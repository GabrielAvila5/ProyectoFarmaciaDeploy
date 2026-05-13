import { z } from 'zod';

export const generatePrescriptionSchema = z.object({
    doctorName: z.string().min(2),
    doctorLicense: z.string().nullable().optional().or(z.literal('')),
    patientName: z.string().min(2),
    patientCode: z.string().nullable().optional().or(z.literal('')),
    patientAge: z.number().int().positive().nullable().optional(),
    patientAllergies: z.string().nullable().optional().or(z.literal('')),
    diagnosis: z.string().min(2),
    treatment: z.string().min(2),
    consultationId: z.number().int().positive().optional(),
});

export type GeneratePrescriptionInput = z.infer<typeof generatePrescriptionSchema>;
