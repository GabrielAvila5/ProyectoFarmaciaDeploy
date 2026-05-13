/**
 * @fileoverview Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de appointments.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import api from '@/lib/api';
import type { AppointmentFormData } from './appointmentSchemas';

export interface Appointment {
    id: number;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
    patients?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    users?: {
        id: number;
        name: string;
    };
}

export const fetchAppointments = async (): Promise<Appointment[]> => {
    const response = await api.get('/appointments');
    return response.data;
};

export const createAppointment = async (data: AppointmentFormData): Promise<Appointment> => {
    const response = await api.post('/appointments', data);
    return response.data;
};

export const updateAppointmentStatus = async (id: number, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'): Promise<Appointment> => {
    const response = await api.put(`/appointments/${id}`, { status });
    return response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
    await api.delete(`/appointments/${id}`);
};
