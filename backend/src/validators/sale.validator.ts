/**
 * @fileoverview Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de sale.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

// Schema Zod para crear una venta
export const createSaleSchema = z.object({
    user_id: z.number().int().positive('El ID de usuario es obligatorio'),
    items: z.array(z.object({
        product_id: z.number().int().positive('El ID de producto es obligatorio'),
        quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
    })).min(1, 'Debe haber al menos un artículo en la venta'),
    payment_method: z.enum(['cash', 'card'] as const).default('cash'),
    amount_paid: z.number().positive('El monto recibido debe ser positivo').optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
