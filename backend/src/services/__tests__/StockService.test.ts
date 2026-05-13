import { describe, it, expect, vi, beforeEach } from 'vitest';
import StockService from '../StockService';
import prisma from '../../config/prisma';

// Mock del Prisma Client
vi.mock('../../config/prisma', () => ({
    default: {
        $transaction: vi.fn(),
        inventory_movements: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
        products: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        batches: {
            create: vi.fn(),
        }
    }
}));

describe('StockService - quickRestock()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Simular ejecución manual del callback de transacción
        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            return callback(prisma);
        });
    });

    it('Debería arrojar error si el producto no existe', async () => {
        (prisma.products.findUnique as any).mockResolvedValue(null);

        await expect(StockService.quickRestock({
            product_id: 999,
            quantity: 10,
            batch_number: 'LOTE01',
            expiry_date: new Date(),
            unit_cost: 50,
            user_id: 1
        })).rejects.toThrow('Producto no encontrado');
    });

    it('Debería registrar el lote y el movimiento de inventario correctamente', async () => {
        const mockProduct = { id: 1, name: 'Paracetamol', base_price: 100 };
        const mockBatch = { id: 10, product_id: 1, quantity: 50, unit_cost: 60 };
        const mockMovement = { id: 5, batch_id: 10, movement_type: 'DIRECT_ENTRY', quantity: 50 };

        (prisma.products.findUnique as any).mockResolvedValue(mockProduct);
        (prisma.batches.create as any).mockResolvedValue(mockBatch);
        (prisma.inventory_movements.create as any).mockResolvedValue(mockMovement);

        const result = await StockService.quickRestock({
            product_id: 1,
            quantity: 50,
            batch_number: 'L2024TEST',
            expiry_date: new Date('2025-12-31'),
            unit_cost: 60,
            notes: 'Donación',
            user_id: 2
        });

        // Verificar llamadas de base de datos
        expect(prisma.batches.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                product_id: 1,
                batch_number: 'L2024TEST',
                quantity: 50,
                unit_cost: 60
            })
        });

        expect(prisma.inventory_movements.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                batch_id: 10,
                user_id: 2,
                movement_type: 'DIRECT_ENTRY',
                quantity: 50,
                notes: 'Donación'
            })
        });

        // Costo(60) < BasePrice(100), no debería hacer update del precio
        expect(prisma.products.update).not.toHaveBeenCalled();
        expect(result.priceUpdated).toBe(false);
    });

    it('Debería sugerir incrementar base_price si el unit_cost es mayor o igual', async () => {
        const mockProduct = { id: 2, name: 'Aspirina', base_price: 20 };
        const mockBatch = { id: 11, product_id: 2, quantity: 10, unit_cost: 25 }; // Costo subió

        (prisma.products.findUnique as any).mockResolvedValue(mockProduct);
        (prisma.batches.create as any).mockResolvedValue(mockBatch);
        (prisma.products.update as any).mockResolvedValue({ ...mockProduct, base_price: 32.5 });

        const result = await StockService.quickRestock({
            product_id: 2,
            quantity: 10,
            batch_number: 'L2024HIGH',
            expiry_date: new Date('2025-01-01'),
            unit_cost: 25, // 25 >= 20, dispara el trigger
            user_id: 1
        });

        // Debería calcular 25 * 1.30 = 32.5
        expect(prisma.products.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { base_price: 32.5 }
        });

        expect(result.priceUpdated).toBe(true);
        expect(result.newBasePrice).toBeCloseTo(32.5, 1);
    });
});
