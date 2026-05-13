import { describe, it, expect, vi, beforeEach } from 'vitest';
import SupplierService from '../SupplierService';
import prisma from '../../config/prisma';

// Mock the prisma client
vi.mock('../../config/prisma', () => ({
    default: {
        suppliers: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        products: {
            count: vi.fn(),
        },
        purchase_orders: {
            count: vi.fn(),
        }
    }
}));

describe('SupplierService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockSupplier = {
        id: 1,
        name: 'Test Supplier',
        contact_name: 'John Doe',
        phone: '123456789',
        email: 'test@supplier.com',
        lead_time_days: 5
    };

    it('should get all suppliers', async () => {
        (prisma.suppliers.findMany as any).mockResolvedValue([mockSupplier]);
        
        const result = await SupplierService.getAllSuppliers();
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockSupplier);
        expect(prisma.suppliers.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });

    it('should create a supplier', async () => {
        (prisma.suppliers.create as any).mockResolvedValue(mockSupplier);
        
        const data = { name: 'Test Supplier', lead_time_days: 5 };
        const result = await SupplierService.createSupplier(data);
        
        expect(result).toEqual(mockSupplier);
        expect(prisma.suppliers.create).toHaveBeenCalledWith({ data });
    });

    it('should get a supplier by id', async () => {
        (prisma.suppliers.findUnique as any).mockResolvedValue(mockSupplier);
        
        const result = await SupplierService.getSupplierById(1);
        expect(result).toEqual(mockSupplier);
        expect(prisma.suppliers.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw error if supplier not found by id', async () => {
        (prisma.suppliers.findUnique as any).mockResolvedValue(null);
        
        await expect(SupplierService.getSupplierById(99)).rejects.toThrow('Proveedor no encontrado');
    });

    it('should update a supplier', async () => {
        (prisma.suppliers.findUnique as any).mockResolvedValue(mockSupplier);
        (prisma.suppliers.update as any).mockResolvedValue({ ...mockSupplier, name: 'Updated' });
        
        const data = { name: 'Updated' };
        const result = await SupplierService.updateSupplier(1, data);
        
        expect(result.name).toBe('Updated');
        expect(prisma.suppliers.update).toHaveBeenCalledWith({ where: { id: 1 }, data });
    });

    it('should delete a supplier if no products or orders exist', async () => {
        (prisma.suppliers.findUnique as any).mockResolvedValue(mockSupplier);
        (prisma.products.count as any).mockResolvedValue(0);
        (prisma.purchase_orders.count as any).mockResolvedValue(0);
        (prisma.suppliers.delete as any).mockResolvedValue(mockSupplier);
        
        const result = await SupplierService.deleteSupplier(1);
        expect(result).toEqual(mockSupplier);
        expect(prisma.suppliers.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should prevent deletion if products exist', async () => {
        (prisma.suppliers.findUnique as any).mockResolvedValue(mockSupplier);
        (prisma.products.count as any).mockResolvedValue(1);
        
        await expect(SupplierService.deleteSupplier(1)).rejects.toThrow('No se puede eliminar un proveedor asociado a productos');
        expect(prisma.suppliers.delete).not.toHaveBeenCalled();
    });
});
