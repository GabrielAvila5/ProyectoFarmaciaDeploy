/**
 * @fileoverview Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de product.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

// Schema del lote (batch) reutilizable
const batchSchema = z.object({
    batch_number: z.string().min(1, 'El número de lote es obligatorio'),
    quantity: z.number().int().min(0, 'La cantidad debe ser >= 0'),
    expiry_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
        message: 'Fecha de caducidad inválida',
    }),
    promo_price: z.number().positive().optional(),
    location: z.string().optional(),
});

// Schema Zod para crear un producto
// El SKU se genera automáticamente en el servicio con nanoid, no se espera del cliente
export const createProductSchema = z.object({
    name: z.string().min(1, 'El nombre del producto es obligatorio'),
    description: z.string().optional(),
    base_price: z.number().positive('El precio debe ser mayor a 0'),
    category: z.string().optional(),
    brand: z.string().optional(),
    supplier_id: z.number().int().positive().optional().nullable(),
    min_stock: z.number().int().min(0).optional(),
    // Lotes: array de lotes a crear junto al producto
    batches: z.array(batchSchema).optional(),
});

// Schema para actualizar un producto (todos los campos opcionales)
export const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    base_price: z.number().positive().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    supplier_id: z.number().int().positive().optional().nullable(),
    min_stock: z.number().int().min(0).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
