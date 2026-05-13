/**
 * @fileoverview Esquemas de validación Zod para el módulo de Citas Médicas.
 * Tipan los formularios y las peticiones al backend garantizando datos seguros.
 */
import { z } from 'zod';

export const appointmentSchema = z.object({
    patient_id: z.number().int().positive('Debe seleccionar un paciente'),
    doctor_id: z.number().int().positive('Debe seleccionar un doctor'),
    appointment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Fecha de cita inválida',
    }),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional().default('SCHEDULED'),
    reason: z.string().min(2, 'El motivo de la consulta es obligatorio'),
    source: z.enum(['Teléfono', 'Presencial', 'Web']).optional().default('Presencial'),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
