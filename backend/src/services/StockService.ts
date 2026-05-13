import prisma from '../config/prisma';

export interface QuickRestockInput {
    product_id: number;
    quantity: number;
    batch_number: string;
    expiry_date: Date;
    unit_cost: number;
    notes?: string;
    user_id: number;
}

export interface ManualAdjustmentInput {
    batch_id: number;
    new_quantity: number;
    reason: string;
    user_id: number;
}

class StockService {
    /**
     * Reabastecimiento Directo / Rápido
     * Permite ingresar inventario sin necesidad de una Orden de Compra previa.
     * 1. Crea un lote en `batches`.
     * 2. Registra el movimiento en `inventory_movements`.
     * 3. Revisa si el `unit_cost` amerita sugerir un cambio de `base_price` (Opcional, se puede manejar si el costo unitario >= precio base).
     */
    async quickRestock(data: QuickRestockInput) {
        return prisma.$transaction(async (tx) => {
            // Validar que el producto exista
            const product = await tx.products.findUnique({
                where: { id: data.product_id }
            });

            if (!product) {
                throw new Error('Producto no encontrado');
            }

            if (data.quantity <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            // 1. Crear el Lote
            const newBatch = await tx.batches.create({
                data: {
                    product_id: data.product_id,
                    batch_number: data.batch_number,
                    quantity: data.quantity,
                    expiry_date: data.expiry_date,
                    unit_cost: data.unit_cost,
                    location: null // Podrías agregarlo si la UI lo manda
                }
            });

            // 2. Registrar Auditoría (Movimiento)
            await tx.inventory_movements.create({
                data: {
                    batch_id: newBatch.id,
                    user_id: data.user_id,
                    movement_type: 'DIRECT_ENTRY',
                    quantity: data.quantity,
                    previous_quantity: 0,
                    new_quantity: data.quantity,
                    notes: data.notes || 'Ingreso manual por Quick Restock'
                }
            });

            // 3. Lógica Opcional: Auto-Ajuste de Precio o Notificación 
            // Si el costo de compra es mayor o igual al precio de venta actual, podríamos querer actualizarlo.
            // Para proteger al negocio, digamos que actualizamos el base_price al 'unit_cost * 1.3' (30% de margen)
            // SI el unit_cost es >= base_price. 
            let priceUpdated = false;
            let newBasePrice = Number(product.base_price);
            
            if (data.unit_cost >= newBasePrice) {
                newBasePrice = data.unit_cost * 1.30; // Sugiere un 30% arriba del costo
                await tx.products.update({
                    where: { id: product.id },
                    data: { base_price: newBasePrice }
                });
                priceUpdated = true;
            }

            return {
                batch: newBatch,
                priceUpdated,
                previousPrice: Number(product.base_price),
                newBasePrice: priceUpdated ? newBasePrice : Number(product.base_price)
            };
        });
    }

    /**
     * Ajuste manual de stock
     */
    async adjustStock(data: ManualAdjustmentInput) {
        return prisma.$transaction(async (tx) => {
            const batch = await tx.batches.findUnique({
                where: { id: data.batch_id }
            });

            if (!batch) {
                throw new Error('Lote no encontrado');
            }

            const previousQuantity = batch.quantity;

            const updatedBatch = await tx.batches.update({
                where: { id: data.batch_id },
                data: { quantity: data.new_quantity }
            });

            await tx.inventory_movements.create({
                data: {
                    batch_id: data.batch_id,
                    user_id: data.user_id,
                    movement_type: 'MANUAL_ADJUSTMENT',
                    quantity: Math.abs(data.new_quantity - previousQuantity),
                    previous_quantity: previousQuantity,
                    new_quantity: data.new_quantity,
                    notes: data.reason
                }
            });

            return updatedBatch;
        });
    }

    async getInventoryMovements() {
        return prisma.inventory_movements.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                users: { select: { id: true, name: true } },
                batches: {
                    include: {
                        products: { select: { id: true, name: true, sku: true } }
                    }
                }
            }
        });
    }
}

export default new StockService();
