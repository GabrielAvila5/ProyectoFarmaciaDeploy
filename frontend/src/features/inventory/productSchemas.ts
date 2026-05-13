/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

// Schema para lote inicial (al crear producto)
export const batchSchema = z.object({
    batch_number: z.string().min(1, 'El número de lote es obligatorio'),
    quantity: z.coerce.number().int().min(0, 'La cantidad debe ser ≥ 0'),
    expiry_date: z.string().min(1, 'La fecha de caducidad es obligatoria').refine(
        (d) => !isNaN(Date.parse(d)),
        { message: 'Fecha de caducidad inválida' }
    ),
    promo_price: z.coerce.number().positive('Debe ser mayor a 0').optional().or(z.literal('')),
    location: z.string().optional(),
});

// Schema para crear producto
export const createProductSchema = z.object({
    name: z.string().min(1, 'El nombre del producto es obligatorio'),
    description: z.string().optional(),
    base_price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    category: z.string().optional(),
    brand: z.string().optional(),
    supplier_id: z.coerce.number().optional().or(z.literal(0)).transform(val => val === 0 ? undefined : val),
    min_stock: z.coerce.number().int().min(0).default(10),
    include_batch: z.boolean().default(false),
    batch: batchSchema.optional(),
}).refine(
    (data) => {
        if (data.include_batch) {
            return data.batch && data.batch.batch_number && data.batch.quantity >= 0 && data.batch.expiry_date;
        }
        return true;
    },
    { message: 'Los datos del lote son obligatorios si se incluye un lote inicial', path: ['batch'] }
);

// Schema para editar producto
export const updateProductSchema = z.object({
    name: z.string().min(1, 'El nombre no puede estar vacío'),
    description: z.string().optional(),
    base_price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    category: z.string().optional(),
    brand: z.string().optional().or(z.literal('')),
    supplier_id: z.coerce.number().optional().or(z.literal(0)).transform(val => val === 0 ? undefined : val),
    min_stock: z.coerce.number().int().min(0).default(10),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
