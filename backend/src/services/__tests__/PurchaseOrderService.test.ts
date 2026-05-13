import { describe, it, expect, vi, beforeEach } from 'vitest';
import PurchaseOrderService from '../PurchaseOrderService';
import prisma from '../../config/prisma';

// Mock the prisma client
vi.mock('../../config/prisma', () => ({
    default: {
        purchase_orders: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
        batches: {
            create: vi.fn(),
        }
    }
}));

describe('PurchaseOrderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockOrder = {
        id: 1,
        supplier_id: 1,
        user_id: 1,
        status: 'PENDING',
        total_amount: 100,
        items: [
            { id: 10, purchase_order_id: 1, product_id: 5, quantity: 10, unit_cost: 10 }
        ]
    };

    it('should create a purchase order calculating total amount', async () => {
        const createData = {
            supplier_id: 1,
            user_id: 1,
            items: [
                { product_id: 5, quantity: 10, unit_cost: 10 }
            ]
        };

        (prisma.purchase_orders.create as any).mockResolvedValue(mockOrder);
        
        const result = await PurchaseOrderService.createPurchaseOrder(createData);
        
        expect(result).toEqual(mockOrder);
        expect(prisma.purchase_orders.create).toHaveBeenCalledWith({
            data: {
                supplier_id: 1,
                user_id: 1,
                status: 'PENDING',
                total_amount: 100,
                items: {
                    create: [
                        { product_id: 5, quantity: 10, unit_cost: 10 }
                    ]
                }
            },
            include: { items: true, suppliers: true }
        });
    });

    it('should receive a purchase order in a transaction', async () => {
        (prisma.purchase_orders.findUnique as any).mockResolvedValue(mockOrder);
        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            const tx = {
                purchase_orders: prisma.purchase_orders,
                batches: prisma.batches
            };
            return callback(tx);
        });
        
        (prisma.purchase_orders.update as any).mockResolvedValue({ ...mockOrder, status: 'RECEIVED' });
        
        const payload = {
            items: [
                { purchase_order_item_id: 10, batch_number: 'LOTE1', expiry_date: '2027-12-31' }
            ]
        };

        const result = await PurchaseOrderService.receivePurchaseOrder(1, payload);
        
        expect(result.status).toBe('RECEIVED');
        expect(prisma.purchase_orders.update).toHaveBeenCalled();
        expect(prisma.batches.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                product_id: 5,
                batch_number: 'LOTE1',
                quantity: 10,
                unit_cost: 10
            })
        });
    });

    it('should throw error if order already received', async () => {
        (prisma.purchase_orders.findUnique as any).mockResolvedValue({ ...mockOrder, status: 'RECEIVED' });
        
        await expect(PurchaseOrderService.receivePurchaseOrder(1, { items: [] })).rejects.toThrow('La orden de compra ya fue recibida');
    });

    it('should cancel a pending purchase order', async () => {
        (prisma.purchase_orders.findUnique as any).mockResolvedValue(mockOrder);
        (prisma.purchase_orders.update as any).mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });
        
        const result = await PurchaseOrderService.cancelPurchaseOrder(1);
        
        expect(result.status).toBe('CANCELLED');
        expect(prisma.purchase_orders.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'CANCELLED' }
        });
    });
});
