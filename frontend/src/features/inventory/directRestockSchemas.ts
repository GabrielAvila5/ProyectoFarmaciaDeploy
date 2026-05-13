import { z } from 'zod';

export const directRestockSchema = z.object({
    product_id: z.number().min(1, 'Debe seleccionar un producto'),
    quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
    batch_number: z.string().min(1, 'El lote es obligatorio'),
    expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Fecha inválida'
    }),
    unit_cost: z.coerce.number().min(0, 'El costo no puede ser negativo'),
    supplier_id: z.number().optional().nullable(),
    notes: z.string().optional()
});

export type DirectRestockFormData = z.infer<typeof directRestockSchema>;
