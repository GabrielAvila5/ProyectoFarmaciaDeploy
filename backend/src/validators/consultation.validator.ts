import { z } from 'zod';

export const createConsultationSchema = z.object({
    patient_id: z.number().int().positive(),
    doctor_id: z.number().int().positive(),
    
    // Vitals
    temperature: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    height: z.number().positive().optional(),
    bmi: z.number().positive().optional(),
    blood_pressure_sys: z.number().int().positive().optional(),
    blood_pressure_dia: z.number().int().positive().optional(),
    heart_rate: z.number().int().positive().optional(),
    respiratory_rate: z.number().int().positive().optional(),
    oxygen_saturation: z.number().int().positive().optional(),
    abdominal_circ: z.number().positive().optional(),
    
    // SOAP
    symptom_subjective: z.string().min(3, "Subjetivo es requerido").optional(),
    symptom_objective: z.string().optional(),
    analysis: z.string().optional(),
    plan: z.string().optional(),

    // Diagnostico
    cie10_code: z.string().optional(),
    diagnosis: z.string().optional(),
    
    // Legacy (Opcional)
    treatment: z.string().optional(),
    notes: z.string().optional(),
    
    is_finalized: z.boolean().optional(),
    end_treatment_date: z.string().datetime().optional(),

    // Recetas
    prescriptions: z.array(z.object({
        product_id: z.number().int().positive().optional(),
        medication_name: z.string().min(1, "Debe tener un nombre de medicamento"),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.string().min(1),
        notes: z.string().optional(),
    })).optional(),

    // Fotos
    photos: z.array(z.object({
        url: z.string(),
        caption: z.string().optional()
    })).max(4, "Máximo 4 fotos por consulta").optional()
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
