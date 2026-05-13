/**
 * @fileoverview Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de appointment.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

export const createAppointmentSchema = z.object({
    patient_id: z.number().int().positive('El ID del paciente debe ser un número válido'),
    doctor_id: z.number().int().positive('El ID del doctor debe ser un número válido').optional(),
    appointment_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'La fecha de la cita no es válida' }),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
    reason: z.string().min(2, 'El motivo de la consulta es obligatorio'),
    source: z.enum(['Teléfono', 'Presencial', 'Web']).default('Presencial')
});

export const updateAppointmentSchema = z.object({
    appointment_date: z.string().refine((date) => !isNaN(Date.parse(date))).optional(),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
