/**
 * @fileoverview Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de user.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Email inválido').max(100),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(255),
    role: z.enum(['admin', 'employee', 'doctor'] as const),
    specialty: z.string().optional(),
    phone: z.string().optional(),
    alma_mater: z.string().optional(),
    consultation_fee: z.number().optional(),
    consulting_room: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
