/**
 * @fileoverview Pruebas unitarias para SaleService.
 * Comprueba que el inventario se descuente bajo la regla FEFO y verifique las divisas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SaleService from '../SaleService';
import prisma from '../../config/prisma';

// Mocks del Transation Client (tx)
const tx = {
    users: { findUnique: vi.fn() },
    products: { findUnique: vi.fn() },
    batches: { findMany: vi.fn(), update: vi.fn() },
    sales: { create: vi.fn(), update: vi.fn() },
    sale_items: { create: vi.fn() },
};

vi.mock('../../config/prisma', () => ({
    default: {
        $transaction: vi.fn(async (cb) => {
            return cb(tx);
        })
    }
}));

describe('SaleService - createSale() [FEFO Logic]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Debería descontar stock correctamente priorizando el lote que caduca primero (FEFO)', async () => {
        // Mock DB responses
        tx.users.findUnique.mockResolvedValue({ id: 1, name: 'Vendedor 1' });
        tx.sales.create.mockResolvedValue({ id: 100 });
        tx.products.findUnique.mockResolvedValue({ id: 1, base_price: 50, name: 'Paracetamol' });

        // Simulamos dos lotes:
        // Lote A: caduca en 2026, cantidad: 5
        // Lote B: caduca en 2027, cantidad: 10
        // Compra: 8 unidades.
        // FEFO: Debería gastar los 5 del Lote A y 3 del Lote B.
        tx.batches.findMany.mockResolvedValue([
            { id: 10, quantity: 5, promo_price: null }, // Vence primero
            { id: 11, quantity: 10, promo_price: null } // Vence después
        ]);

        tx.sales.update.mockResolvedValue({ id: 100, total_amount: 400 });

        const saleData = {
            user_id: 1,
            payment_method: 'card',
            amount_paid: 400,
            items: [
                { product_id: 1, quantity: 8 }
            ]
        };

        await SaleService.createSale(saleData as any);

        // Verificamos que se actualizaran 2 lotes (gastó el lote completo A y parcial de B)
        expect(tx.batches.update).toHaveBeenCalledTimes(2);

        // Lote A gastado por completo: quedan 0
        expect(tx.batches.update).toHaveBeenNthCalledWith(1, {
            where: { id: 10 },
            data: { quantity: 0 }
        });

        // Lote B gastado parcialmente: quedan 10 - 3 = 7
        expect(tx.batches.update).toHaveBeenNthCalledWith(2, {
            where: { id: 11 },
            data: { quantity: 7 }
        });

        // Verificamos que se crearon los dos items de venta vinculados a cada lote
        expect(tx.sale_items.create).toHaveBeenCalledTimes(2);
        expect(tx.sale_items.create).toHaveBeenNthCalledWith(1, {
            data: { sale_id: 100, batch_id: 10, quantity: 5, price_at_sale: 50 }
        });
        expect(tx.sale_items.create).toHaveBeenNthCalledWith(2, {
            data: { sale_id: 100, batch_id: 11, quantity: 3, price_at_sale: 50 }
        });
    });

    it('Debería arrojar error si el monto pagado en efectivo es menor al total', async () => {
        tx.users.findUnique.mockResolvedValue({ id: 1 });
        tx.sales.create.mockResolvedValue({ id: 100 });
        tx.products.findUnique.mockResolvedValue({ id: 1, base_price: 50 });
        tx.batches.findMany.mockResolvedValue([{ id: 10, quantity: 10, promo_price: null }]);

        const saleData = {
            user_id: 1,
            payment_method: 'cash',
            amount_paid: 20, // Pagó $20 pero es un prod de $50
            items: [{ product_id: 1, quantity: 1 }]
        };

        await expect(SaleService.createSale(saleData as any)).rejects.toThrow(/Monto recibido insuficiente/);
    });

    it('Debería arrojar error si no hay stock suficiente sumando los lotes', async () => {
        tx.users.findUnique.mockResolvedValue({ id: 1 });
        tx.sales.create.mockResolvedValue({ id: 100 });
        tx.products.findUnique.mockResolvedValue({ id: 1, base_price: 50 });
        
        // Suma inventario: 2. Pide: 5
        tx.batches.findMany.mockResolvedValue([{ id: 10, quantity: 2, promo_price: null }]);

        const saleData = {
            user_id: 1,
            payment_method: 'card',
            amount_paid: 250,
            items: [{ product_id: 1, quantity: 5 }]
        };

        await expect(SaleService.createSale(saleData as any)).rejects.toThrow(/Stock insuficiente/);
    });
});
