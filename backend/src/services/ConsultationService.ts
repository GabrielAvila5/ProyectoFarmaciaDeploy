import prisma from '../config/prisma';
import { CreateConsultationInput } from '../validators/consultation.validator';

class ConsultationService {
    async createConsultation(data: CreateConsultationInput) {
        // Fetch doctor info for snapshots
        const doctor = await prisma.users.findUnique({
            where: { id: data.doctor_id }
        });

        if (!doctor) throw new Error('Doctor no encontrado');

        const payloadParams: any = {
            patient_id: data.patient_id,
            doctor_id: data.doctor_id,
            doctor_name_snapshot: doctor.name,
            doctor_license: doctor.medical_license,
            
            temperature: data.temperature,
            weight: data.weight,
            height: data.height,
            bmi: data.bmi,
            blood_pressure_sys: data.blood_pressure_sys,
            blood_pressure_dia: data.blood_pressure_dia,
            heart_rate: data.heart_rate,
            respiratory_rate: data.respiratory_rate,
            oxygen_saturation: data.oxygen_saturation,
            abdominal_circ: data.abdominal_circ,

            symptom_subjective: data.symptom_subjective,
            symptom_objective: data.symptom_objective,
            analysis: data.analysis,
            plan: data.plan,

            cie10_code: data.cie10_code,
            diagnosis: data.diagnosis,
            
            treatment: data.treatment,
            notes: data.notes,
            is_finalized: data.is_finalized || false,
            finalized_at: data.is_finalized ? new Date() : null,
            end_treatment_date: data.end_treatment_date ? new Date(data.end_treatment_date) : null,

            photos: data.photos || []
        };

        // Si mandaron array de prescripciones, crear la receta atada
        if (data.prescriptions && data.prescriptions.length > 0) {
            payloadParams.prescriptions = {
                create: {
                    items: {
                        create: data.prescriptions.map((p: any) => ({
                            product_id: p.product_id,
                            medication_name: p.medication_name,
                            dosage: p.dosage,
                            frequency: p.frequency,
                            duration: p.duration,
                            notes: p.notes
                        }))
                    }
                }
            };
        }

        return prisma.consultations.create({
            data: payloadParams,
            include: { prescriptions: { include: { items: true } } }
        });
    }

    async getConsultationsByPatient(patientId: number) {
        const consultations = await prisma.consultations.findMany({
            where: { patient_id: patientId },
            orderBy: { consultation_date: 'desc' },
            include: {
                users: {
                    select: { name: true, medical_license: true }
                },
                prescriptions: { include: { items: true } }
            }
        });

        // Format decimal values properly
        return consultations.map(c => ({
            ...c,
            temperature: c.temperature ? Number(c.temperature) : null,
            weight: c.weight ? Number(c.weight) : null,
            height: c.height ? Number(c.height) : null,
            bmi: c.bmi ? Number(c.bmi) : null,
            abdominal_circ: c.abdominal_circ ? Number(c.abdominal_circ) : null,
        }));
    }

    async getConsultationById(id: number) {
        const consultation = await prisma.consultations.findUnique({
            where: { id },
            include: {
                patients: true,
                users: {
                    select: { name: true, medical_license: true }
                },
                prescriptions: { include: { items: true } }
            }
        });

        if (!consultation) throw new Error('Consulta no encontrada');

        return {
            ...consultation,
            temperature: consultation.temperature ? Number(consultation.temperature) : null,
            weight: consultation.weight ? Number(consultation.weight) : null,
            height: consultation.height ? Number(consultation.height) : null,
            bmi: consultation.bmi ? Number(consultation.bmi) : null,
            abdominal_circ: consultation.abdominal_circ ? Number(consultation.abdominal_circ) : null,
        };
    }

    async updateConsultation(id: number, data: Partial<CreateConsultationInput>) {
        const existing = await prisma.consultations.findUnique({
            where: { id },
            include: { prescriptions: { include: { items: true } } }
        });

        if (!existing) throw new Error('Consulta no encontrada');
        if (existing.is_finalized || existing.finalized_at) {
            throw new Error('Esta consulta ya fue finalizada legalmente y no puede ser modificada.');
        }

        const payloadParams: any = {
            ...(data.temperature !== undefined && { temperature: data.temperature }),
            ...(data.weight !== undefined && { weight: data.weight }),
            ...(data.height !== undefined && { height: data.height }),
            ...(data.bmi !== undefined && { bmi: data.bmi }),
            ...(data.blood_pressure_sys !== undefined && { blood_pressure_sys: data.blood_pressure_sys }),
            ...(data.blood_pressure_dia !== undefined && { blood_pressure_dia: data.blood_pressure_dia }),
            ...(data.heart_rate !== undefined && { heart_rate: data.heart_rate }),
            ...(data.respiratory_rate !== undefined && { respiratory_rate: data.respiratory_rate }),
            ...(data.oxygen_saturation !== undefined && { oxygen_saturation: data.oxygen_saturation }),
            ...(data.abdominal_circ !== undefined && { abdominal_circ: data.abdominal_circ }),

            ...(data.symptom_subjective !== undefined && { symptom_subjective: data.symptom_subjective }),
            ...(data.symptom_objective !== undefined && { symptom_objective: data.symptom_objective }),
            ...(data.analysis !== undefined && { analysis: data.analysis }),
            ...(data.plan !== undefined && { plan: data.plan }),

            ...(data.cie10_code !== undefined && { cie10_code: data.cie10_code }),
            ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
            
            ...(data.treatment !== undefined && { treatment: data.treatment }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.is_finalized !== undefined && { 
                is_finalized: data.is_finalized,
                finalized_at: data.is_finalized ? new Date() : null
            }),
            ...(data.end_treatment_date !== undefined && { 
                end_treatment_date: data.end_treatment_date ? new Date(data.end_treatment_date) : null 
            }),
            ...(data.photos !== undefined && { photos: data.photos })
        };

        // Si se proveen prescriptions en update, primero borramos las anteriores y creamos las nuevas (recreación completa de receta)
        if (data.prescriptions !== undefined) {
            // Delete all existing prescriptions for this consultation
            await prisma.prescriptions.deleteMany({
                where: { consultation_id: id }
            });

            if (data.prescriptions.length > 0) {
                payloadParams.prescriptions = {
                    create: {
                        items: {
                            create: data.prescriptions.map((p: any) => ({
                                product_id: p.product_id,
                                medication_name: p.medication_name,
                                dosage: p.dosage,
                                frequency: p.frequency,
                                duration: p.duration,
                                notes: p.notes
                            }))
                        }
                    }
                };
            }
        }

        return prisma.consultations.update({
            where: { id },
            data: payloadParams,
            include: { prescriptions: { include: { items: true } } }
        });
    }

    async deleteConsultation(id: number) {
        const existing = await prisma.consultations.findUnique({ where: { id } });
        if (!existing) throw new Error('Consulta no encontrada');
        if (existing.is_finalized || existing.finalized_at) {
            throw new Error('Esta consulta ya fue finalizada legalmente y no puede ser eliminada.');
        }

        await prisma.consultations.delete({ where: { id } });
        return { message: 'Consulta eliminada exitosamente' };
    }
}

export default new ConsultationService();
