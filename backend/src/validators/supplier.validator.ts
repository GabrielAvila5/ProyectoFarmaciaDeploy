import { z } from 'zod';

export const createSupplierSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
    contact_name: z.string().max(150).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email('Email inválido').max(100).optional().nullable(),
    lead_time_days: z.number().int().min(0).optional().nullable()
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
