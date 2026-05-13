/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de Product.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import prisma from '../config/prisma';
import { nanoid } from 'nanoid';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';

// Servicio que encapsula la lógica de negocio de productos
class ProductService {
    /**
     * Genera un SKU único de 8 caracteres usando nanoid.
     * Prefijo "PRD-" + 8 caracteres alfanuméricos.
     */
    private generateSku(): string {
        return `PRD-${nanoid(8)}`;
    }

    /**
     * Crea un nuevo producto con SKU generado automáticamente.
     * Si se envían lotes (batches), se crean anidados junto al producto.
     */
    async createProduct(data: CreateProductInput) {
        const sku = this.generateSku();

        // Verifica si el SKU generado ya existe (improbable, pero seguro)
        const existing = await prisma.products.findUnique({ where: { sku } });
        if (existing) {
            throw new Error('SKU generado ya existe, intenta de nuevo');
        }

        // Crear el producto con lotes anidados si se proporcionan
        const product = await prisma.products.create({
            data: {
                sku,
                name: data.name,
                description: data.description ?? null,
                base_price: data.base_price,
                category: data.category ?? null,
                brand: data.brand ?? null,
                supplier_id: data.supplier_id ?? null,
                min_stock: data.min_stock ?? 10,
                // Si se envían lotes, se crean anidados con create
                ...(data.batches && data.batches.length > 0 && {
                    batches: {
                        create: data.batches.map((batch) => ({
                            batch_number: batch.batch_number,
                            quantity: batch.quantity,
                            expiry_date: new Date(batch.expiry_date),
                            promo_price: batch.promo_price ?? null,
                            location: batch.location ?? null,
                        })),
                    },
                }),
            },
            include: {
                batches: true, // Incluye los lotes creados en la respuesta
            },
        });

        return product;
    }

    /**
     * Obtiene todos los productos con sus lotes.
     */
    async getAllProducts() {
        return prisma.products.findMany({
            include: {
                batches: {
                    orderBy: { expiry_date: 'asc' },
                },
                suppliers: true,
            },
        });
    }

    /**
     * Busca productos por nombre para sugerir medicamentos con stock en consultas.
     * Usa COLLATE utf8_unicode_ci para búsqueda insensible a acentos/diacríticos.
     */
    async searchProducts(query: string) {
        if (!query || query.length < 2) return [];
        
        const searchPattern = `%${query}%`;
        
        // Búsqueda con collation que ignora acentos/diacríticos
        const products = await prisma.$queryRaw<any[]>`
            SELECT p.id, p.sku, p.name, p.active_substance, p.base_price,
                   COALESCE(SUM(CASE WHEN b.expiry_date > NOW() AND b.quantity > 0 THEN b.quantity ELSE 0 END), 0) as totalStock
            FROM products p
            LEFT JOIN batches b ON b.product_id = p.id
            WHERE p.name COLLATE utf8_unicode_ci LIKE ${searchPattern}
               OR p.brand COLLATE utf8_unicode_ci LIKE ${searchPattern}
               OR p.active_substance COLLATE utf8_unicode_ci LIKE ${searchPattern}
               OR p.sku COLLATE utf8_unicode_ci LIKE ${searchPattern}
            GROUP BY p.id
            LIMIT 10
        `;

        // Formatear para el frontend
        return products.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            active_substance: p.active_substance,
            totalStock: Number(p.totalStock)
        }));
    }

    /**
     * Obtiene un producto por su ID.
     */
    async getProductById(id: number) {
        const product = await prisma.products.findUnique({
            where: { id },
            include: {
                batches: {
                    orderBy: { expiry_date: 'asc' },
                },
                suppliers: true,
            },
        });

        if (!product) {
            throw new Error('Producto no encontrado');
        }

        return product;
    }

    /**
     * Actualiza un producto por su ID.
     */
    async updateProduct(id: number, data: UpdateProductInput, userId?: number) {
        // Verifica que el producto existe
        const existing = await prisma.products.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Producto no encontrado');
        }

        return prisma.$transaction(async (tx) => {
            // Registrar cambio de precio si envían base_price y es diferente
            if (data.base_price !== undefined && Number(data.base_price) !== Number(existing.base_price) && userId) {
                await tx.product_price_history.create({
                    data: {
                        product_id: id,
                        user_id: userId,
                        old_price: existing.base_price,
                        new_price: data.base_price
                    }
                });
            }

            return tx.products.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.base_price !== undefined && { base_price: data.base_price }),
                    ...(data.category !== undefined && { category: data.category }),
                    ...(data.brand !== undefined && { brand: data.brand }),
                    ...(data.supplier_id !== undefined && { supplier_id: data.supplier_id }),
                    ...(data.min_stock !== undefined && { min_stock: data.min_stock }),
                },
                include: {
                    batches: true,
                },
            });
        });
    }

    /**
     * Elimina un producto por su ID.
     */
    async deleteProduct(id: number) {
        const existing = await prisma.products.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Producto no encontrado');
        }

        // Primero elimina los lotes asociados, luego el producto
        await prisma.batches.deleteMany({ where: { product_id: id } });
        await prisma.products.delete({ where: { id } });

        return { message: 'Producto eliminado' };
    }
}

export default new ProductService();
