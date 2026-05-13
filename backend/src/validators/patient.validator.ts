/**
 * @fileoverview Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de patient.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

export const createPatientSchema = z.object({
    first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    date_of_birth: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'La fecha de nacimiento es inválida o no tiene formato correcto',
    }),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    has_allergies: z.boolean().default(false),
    allergies_detail: z.string().optional().or(z.literal('')),
    medical_history: z.string().optional().or(z.literal('')),
    is_incomplete: z.boolean().optional().default(false),
});

export const updatePatientSchema = z.object({
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    date_of_birth: z.string().refine((date) => !isNaN(Date.parse(date))).optional(),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    has_allergies: z.boolean().optional(),
    allergies_detail: z.string().optional().or(z.literal('')),
    medical_history: z.string().optional().or(z.literal('')),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
