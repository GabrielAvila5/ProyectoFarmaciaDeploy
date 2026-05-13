/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de Sale.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import prisma from '../config/prisma';
import { CreateSaleInput } from '../validators/sale.validator';
import { Prisma } from '@prisma/client';

// Servicio que encapsula la lógica de negocio de las ventas
class SaleService {
    /**
     * Crea una nueva transacción de venta.
     * Usa prisma.$transaction() para garantizar atomicidad (todo o nada).
     * 
     * Lógica FEFO (First Expired, First Out):
     * Para cada ítem de la venta, busca los lotes del producto ordenados por
     * fecha de caducidad ascendente y descuenta del lote más próximo a caducar.
     * Si un lote no tiene suficiente stock, pasa al siguiente lote.
     */
    async createSale(saleData: CreateSaleInput) {
        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const { user_id, items, payment_method = 'cash', amount_paid } = saleData;
            let totalAmount = 0;
            let totalTax = 0;

            // Verifica que el usuario existe
            const user = await tx.users.findUnique({ where: { id: user_id } });
            if (!user) {
                throw new Error(`Usuario no encontrado: ${user_id}`);
            }

            // Crea el registro de venta primero (se actualizará el total al final)
            const sale = await tx.sales.create({
                data: {
                    user_id,
                    total_amount: 0, // Se actualizará después
                    total_tax: 0, // Se actualizará después
                    payment_method,
                    amount_paid: amount_paid ?? null,
                },
            });

            // Procesa cada artículo de la venta
            for (const item of items) {
                // Busca el producto para obtener su precio base
                const product = await tx.products.findUnique({
                    where: { id: item.product_id },
                });

                if (!product) {
                    throw new Error(`Producto no encontrado: ${item.product_id}`);
                }

                // Busca los lotes del producto ordenados por fecha de caducidad (FEFO)
                const batches = await tx.batches.findMany({
                    where: {
                        product_id: item.product_id,
                        quantity: { gt: 0 }, // Solo lotes con stock disponible
                    },
                    orderBy: {
                        expiry_date: 'asc', // El más próximo a caducar primero
                    },
                });

                // Calcula el stock total disponible en todos los lotes
                const totalStock = batches.reduce((sum: number, b: { quantity: number }) => sum + b.quantity, 0);
                if (totalStock < item.quantity) {
                    throw new Error(
                        `Stock insuficiente para producto "${product.name}". ` +
                        `Disponible: ${totalStock}, Solicitado: ${item.quantity}`
                    );
                }

                // Descuenta el stock lote por lote (FEFO)
                let remainingQty = item.quantity;

                for (const batch of batches) {
                    if (remainingQty <= 0) break;

                    // Calcula cuánto descontar de este lote
                    const deductFromBatch = Math.min(batch.quantity, remainingQty);

                    // Actualiza el stock del lote
                    await tx.batches.update({
                        where: { id: batch.id },
                        data: { quantity: batch.quantity - deductFromBatch },
                    });

                    // AUDITORIA: Registrar movimiento en inventario
                    await tx.inventory_movements.create({
                        data: {
                            batch_id: batch.id,
                            user_id: user_id,
                            movement_type: 'SALE',
                            quantity: deductFromBatch,
                            previous_quantity: batch.quantity,
                            new_quantity: batch.quantity - deductFromBatch,
                            notes: `Venta procesada`
                        }
                    });

                    // Usa el precio promocional del lote si existe, sino el precio base del producto
                    const priceAtSale = batch.promo_price
                        ? Number(batch.promo_price)
                        : Number(product.base_price);
                    
                    const taxRate = Number(product.tax_rate) || 0;
                    const taxAmount = (priceAtSale * taxRate) / 100;

                    // Crea el item de venta vinculado al lote específico
                    await tx.sale_items.create({
                        data: {
                            sale_id: sale.id,
                            batch_id: batch.id,
                            quantity: deductFromBatch,
                            price_at_sale: priceAtSale,
                            tax_amount: taxAmount,
                        },
                    });

                    // Suma al total de la venta
                    totalAmount += priceAtSale * deductFromBatch;
                    totalTax += taxAmount * deductFromBatch;

                    remainingQty -= deductFromBatch;
                }
            }

            // Regla de negocio: si paga en efectivo, el monto recibido debe cubrir el total
            if (payment_method === 'cash' && amount_paid !== undefined && amount_paid < totalAmount) {
                throw new Error(
                    `Monto recibido insuficiente. ` +
                    `Total de la venta: $${totalAmount.toFixed(2)}, ` +
                    `Monto recibido: $${amount_paid.toFixed(2)}`
                );
            }

            // Actualiza el total de la venta
            const updatedSale = await tx.sales.update({
                where: { id: sale.id },
                data: { total_amount: totalAmount, total_tax: totalTax },
                include: {
                    sale_items: {
                        include: {
                            batches: true, // Incluye info del lote en cada item
                        },
                    },
                    users: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });

            return updatedSale;
        });
    }

    // Lista todas las ventas con información del vendedor y items
    async getAllSales() {
        return prisma.sales.findMany({
            orderBy: { sale_date: 'desc' },
            include: {
                users: {
                    select: { id: true, name: true, email: true },
                },
                sale_items: {
                    include: {
                        batches: {
                            include: {
                                products: {
                                    select: { id: true, name: true, sku: true, category: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    // Obtiene una venta por ID con detalle completo
    async getSaleById(id: number) {
        const sale = await prisma.sales.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, name: true, email: true },
                },
                sale_items: {
                    include: {
                        batches: {
                            include: {
                                products: {
                                    select: { id: true, name: true, sku: true, category: true, base_price: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!sale) throw new Error('Venta no encontrada');
        return sale;
    }

    /**
     * Anula una venta y revierte el stock a los lotes correspondientes
     */
    async voidSale(saleId: number, voidedBy: number, voidReason: string) {
        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Verificar que la venta existe
            const sale = await tx.sales.findUnique({
                where: { id: saleId },
                include: { sale_items: true },
            });

            if (!sale) {
                throw new Error('Venta no encontrada.');
            }

            if (sale.status === 'voided') {
                throw new Error('Esta venta ya fue anulada.');
            }

            // Revertir stock de cada item al lote correspondiente
            for (const item of sale.sale_items) {
                if (item.batch_id) {
                    const batch = await tx.batches.findUnique({ where: { id: item.batch_id } });
                    if(batch) {
                        await tx.batches.update({
                            where: { id: item.batch_id },
                            data: {
                                quantity: { increment: item.quantity },
                            },
                        });

                        // AUDITORIA: Registrar movimiento en inventario por anulación
                        await tx.inventory_movements.create({
                            data: {
                                batch_id: item.batch_id,
                                user_id: voidedBy,
                                movement_type: 'VOID',
                                quantity: item.quantity,
                                previous_quantity: batch.quantity,
                                new_quantity: batch.quantity + item.quantity,
                                notes: `Anulación de Venta #${saleId}. Motivo: ${voidReason}`
                            }
                        });
                    }
                }
            }

            // Marcar la venta como anulada
            const voidedSale = await tx.sales.update({
                where: { id: saleId },
                data: { 
                    status: 'voided',
                    voided_by: voidedBy,
                    void_reason: voidReason
                },
                include: {
                    users: {
                        select: { id: true, name: true, email: true },
                    },
                    sale_items: {
                        include: {
                            batches: {
                                include: {
                                    products: {
                                        select: { id: true, name: true, sku: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            return voidedSale;
        });
    }
}

export default new SaleService();
