/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de Appointment.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import prisma from '../config/prisma';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../validators/appointment.validator';

class AppointmentService {
    async createAppointment(data: CreateAppointmentInput, defaultDoctorId?: number) {
        const doctorId = data.doctor_id || defaultDoctorId;
        if (!doctorId) {
            throw new Error('Se requiere el ID del doctor para agendar la cita');
        }

        try {
            const appointment = await prisma.appointments.create({
                data: {
                    patient_id: data.patient_id,
                    doctor_id: doctorId,
                    appointment_date: new Date(data.appointment_date),
                    reason: data.reason,
                    source: data.source,
                    ...(data.status && { status: data.status }),
                },
                include: {
                    patients: true,
                    users: { select: { id: true, name: true, email: true } },
                },
            });
            return appointment;
        } catch (error: any) {
            // Prisma error code P2002: "Unique constraint failed"
            if (error.code === 'P2002' && error.meta?.target === 'doctor_appointment_unique') {
                throw new Error('El doctor ya tiene una cita agendada en ese horario exacto');
            }
            throw error;
        }
    }

    async getAllAppointments() {
        return prisma.appointments.findMany({
            orderBy: { appointment_date: 'asc' },
            include: {
                patients: { select: { first_name: true, last_name: true } },
                users: { select: { name: true } },
            },
        });
    }

    async getAppointmentById(id: number) {
        const appointment = await prisma.appointments.findUnique({
            where: { id },
            include: {
                patients: true,
                users: { select: { id: true, name: true, email: true, roles: true } },
            },
        });

        if (!appointment) throw new Error('Cita no encontrada');
        return appointment;
    }

    async updateAppointment(id: number, data: UpdateAppointmentInput) {
        const existing = await prisma.appointments.findUnique({ where: { id } });
        if (!existing) throw new Error('Cita no encontrada');

        try {
            return await prisma.appointments.update({
                where: { id },
                data: {
                    ...(data.appointment_date && { appointment_date: new Date(data.appointment_date) }),
                    ...(data.status && { status: data.status }),
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002' && error.meta?.target === 'doctor_appointment_unique') {
                throw new Error('El doctor ya tiene una cita agendada en ese horario exacto');
            }
            throw error;
        }
    }

    async deleteAppointment(id: number) {
        const existing = await prisma.appointments.findUnique({ where: { id } });
        if (!existing) throw new Error('Cita no encontrada');

        await prisma.appointments.delete({ where: { id } });
        return { message: 'Cita eliminada exitosamente' };
    }
}

export default new AppointmentService();
