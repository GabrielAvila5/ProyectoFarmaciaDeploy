import { z } from 'zod';

export const quickRestockSchema = z.object({
    product_id: z.number().int().positive('El ID del producto debe ser válido'),
    quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
    batch_number: z.string().min(1, 'El número de lote es obligatorio'),
    expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Fecha de caducidad inválida',
    }),
    unit_cost: z.number().min(0, 'El costo unitario no puede ser negativo'),
    notes: z.string().optional(),
});

export type QuickRestockInput = z.infer<typeof quickRestockSchema>;
