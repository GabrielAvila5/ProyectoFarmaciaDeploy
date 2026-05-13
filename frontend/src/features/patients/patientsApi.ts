/**
 * @fileoverview Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de pacientes.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import api from '@/lib/api';
import type { PatientFormData } from './patientSchemas';

export interface Consultation {
    id: number;
    patient_id: number;
    doctor_id: number;
    doctor_name_snapshot: string;
    doctor_license: string | null;
    consultation_date: string;
    temperature: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    abdominal_circ: number | null;
    diagnosis: string;
    treatment: string;
    notes: string | null;
    is_finalized: boolean;
    finalized_at: string | null;
    end_treatment_date: string | null;
    users?: {
        name: string;
        medical_license: string | null;
    }
}

export interface Patient {
    id: number;
    patient_code: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string | null;
    email: string | null;
    gender: string | null;
    address: string | null;
    blood_type?: string | null;
    family_history?: string | null;
    pathological_history?: string | null;
    non_pathological_history?: string | null;
    has_allergies: boolean;
    allergies_detail: string | null;
    medical_history: string | null;
    created_at: string;
    consultations?: Consultation[];
}

export const fetchPatients = async (): Promise<Patient[]> => {
    const response = await api.get('/patients');
    return response.data;
};

export const getPatientById = async (id: number): Promise<Patient> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
};

export const searchPatients = async (query: string): Promise<Patient[]> => {
    const response = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

export const createPatient = async (data: PatientFormData): Promise<Patient> => {
    const response = await api.post('/patients', data);
    return response.data;
};

export const updatePatient = async (id: number, data: Partial<PatientFormData>): Promise<Patient> => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
};

export const deletePatient = async (id: number): Promise<void> => {
    await api.delete(`/patients/${id}`);
};
