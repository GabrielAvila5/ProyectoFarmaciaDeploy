import prisma from '../config/prisma';
import { CreatePurchaseOrderInput, ReceivePurchaseOrderInput } from '../validators/purchaseOrder.validator';

class PurchaseOrderService {
    async getAllPurchaseOrders() {
        return prisma.purchase_orders.findMany({
            include: {
                suppliers: true,
                users: {
                    select: { id: true, name: true }
                },
                items: {
                    include: {
                        products: true
                    }
                }
            },
            orderBy: { order_date: 'desc' }
        });
    }

    async getPurchaseOrderById(id: number) {
        const order = await prisma.purchase_orders.findUnique({
            where: { id },
             include: {
                suppliers: true,
                users: {
                    select: { id: true, name: true }
                },
                items: {
                    include: {
                        products: true
                    }
                }
            }
        });
        if (!order) throw new Error('Orden de compra no encontrada');
        return order;
    }

    async createPurchaseOrder(data: CreatePurchaseOrderInput) {
        const total_amount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

        return prisma.purchase_orders.create({
            data: {
                supplier_id: data.supplier_id,
                user_id: data.user_id!,
                status: 'PENDING',
                total_amount,
                expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date) : null,
                items: {
                    create: data.items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_cost: item.unit_cost
                    }))
                }
            },
            include: {
                items: true,
                suppliers: true
            }
        });
    }

    async updateExpectedDate(id: number, expected_delivery_date: string | null) {
        const order = await prisma.purchase_orders.findUnique({ where: { id } });
        if (!order) throw new Error('Orden de compra no encontrada');
        if (order.status !== 'PENDING') throw new Error('Solo se puede modificar la fecha de entrega de órdenes pendientes');

        return prisma.purchase_orders.update({
            where: { id },
            data: {
                expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : null
            }
        });
    }

    async receivePurchaseOrder(id: number, data: ReceivePurchaseOrderInput) {
        const order = await prisma.purchase_orders.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) throw new Error('Orden de compra no encontrada');
        if (order.status === 'RECEIVED') throw new Error('La orden de compra ya fue recibida');
        if (order.status === 'CANCELLED') throw new Error('La orden de compra está cancelada');

        return await prisma.$transaction(async (tx) => {
            // Actualizar el estado de la orden
            const updatedOrder = await tx.purchase_orders.update({
                where: { id },
                data: {
                    status: 'RECEIVED',
                    received_date: new Date()
                },
                include: {
                    items: true,
                    suppliers: true
                }
            });

            // Para cada ítem recibido, crear un nuevo lote (batch) en el inventario
            for (const receivedItem of data.items) {
                const orderItem = order.items.find(i => i.id === receivedItem.purchase_order_item_id);
                if (!orderItem) {
                    throw new Error(`Ítem de orden ${receivedItem.purchase_order_item_id} no válido para esta orden`);
                }

                const newBatch = await tx.batches.create({
                    data: {
                        product_id: orderItem.product_id,
                        batch_number: receivedItem.batch_number,
                        quantity: orderItem.quantity,
                        expiry_date: new Date(receivedItem.expiry_date),
                        unit_cost: orderItem.unit_cost,
                        location: receivedItem.location || null
                    }
                });

                await tx.inventory_movements.create({
                    data: {
                        batch_id: newBatch.id,
                        user_id: order.user_id,
                        movement_type: 'PURCHASE_RECEIPT',
                        quantity: orderItem.quantity,
                        notes: `Recepción OC-${order.id}`,
                    }
                });
            }

            return updatedOrder;
        });
    }

    async cancelPurchaseOrder(id: number) {
        const order = await prisma.purchase_orders.findUnique({
            where: { id }
        });

        if (!order) throw new Error('Orden de compra no encontrada');
        if (order.status === 'RECEIVED') throw new Error('No se puede cancelar una orden ya recibida');

        return prisma.purchase_orders.update({
            where: { id },
            data: {
                status: 'CANCELLED'
            }
        });
    }
}

export default new PurchaseOrderService();
