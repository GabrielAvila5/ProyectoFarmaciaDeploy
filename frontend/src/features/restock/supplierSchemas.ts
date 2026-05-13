import { z } from 'zod';

export const supplierSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    contact_name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Correo inválido').optional().or(z.literal('')),
    lead_time_days: z.number().int().min(0, 'El tiempo debe ser mayor o igual a 0').optional().or(z.nan()),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
