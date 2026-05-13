/**
 * @fileoverview Esquemas de validación Zod para el módulo de Pacientes.
 * Tipan los formularios y las peticiones al backend garantizando datos seguros.
 */
import { z } from 'zod';

export const patientSchema = z.object({
    first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    date_of_birth: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Fecha de nacimiento requerida',
    }),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    has_allergies: z.boolean(),
    allergies_detail: z.string().optional(),
    medical_history: z.string().optional().or(z.literal('')),

}).superRefine((data, ctx) => {
    if (data.has_allergies && (!data.allergies_detail || data.allergies_detail.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['allergies_detail'],
            message: 'Debe especificar el detalle de las alergias',
        });
    }
});

export type PatientFormData = z.infer<typeof patientSchema>;
