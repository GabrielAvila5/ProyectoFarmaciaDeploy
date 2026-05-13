import prisma from '../config/prisma';
import { CreateSupplierInput, UpdateSupplierInput } from '../validators/supplier.validator';

class SupplierService {
    async getAllSuppliers() {
        return prisma.suppliers.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { purchase_orders: true }
                }
            }
        });
    }

    async getSupplierById(id: number) {
        const supplier = await prisma.suppliers.findUnique({ where: { id } });
        if (!supplier) throw new Error('Proveedor no encontrado');
        return supplier;
    }

    async createSupplier(data: CreateSupplierInput) {
        return prisma.suppliers.create({ data });
    }

    async updateSupplier(id: number, data: UpdateSupplierInput) {
        const existing = await prisma.suppliers.findUnique({ where: { id } });
        if (!existing) throw new Error('Proveedor no encontrado');

        return prisma.suppliers.update({
            where: { id },
            data
        });
    }

    async updateSupplierStatus(id: number, is_active: boolean) {
        const existing = await prisma.suppliers.findUnique({ where: { id } });
        if (!existing) throw new Error('Proveedor no encontrado');

        return prisma.suppliers.update({
            where: { id },
            data: { is_active }
        });
    }

    async deleteSupplier(id: number) {
        const existing = await prisma.suppliers.findUnique({ where: { id } });
        if (!existing) throw new Error('Proveedor no encontrado');

        const productsCount = await prisma.products.count({ where: { supplier_id: id } });
        if (productsCount > 0) throw new Error('No se puede eliminar un proveedor asociado a productos');

        const ordersCount = await prisma.purchase_orders.count({ where: { supplier_id: id } });
        if (ordersCount > 0) throw new Error('No se puede eliminar un proveedor con órdenes de compra');

        return prisma.suppliers.delete({ where: { id } });
    }
}

export default new SupplierService();
