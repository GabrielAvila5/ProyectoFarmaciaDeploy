import api from '@/lib/api';

export interface CreateConsultationData {
    patient_id: number;
    doctor_id: number; // Obtenido del usuario logueado
    temperature?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    abdominal_circ?: number;
    diagnosis: string;
    treatment: string;
    notes?: string;
    end_treatment_date?: string;
}

export const createConsultation = async (data: CreateConsultationData) => {
    const response = await api.post('/consultations', data);
    return response.data;
};

export const updateConsultation = async (id: number, data: Partial<CreateConsultationData>) => {
    const response = await api.put(`/consultations/${id}`, data);
    return response.data;
};

export const deleteConsultation = async (id: number) => {
    const response = await api.delete(`/consultations/${id}`);
    return response.data;
};

export const getConsultationsByPatient = async (patientId: number) => {
    const response = await api.get(`/consultations/patient/${patientId}`);
    return response.data;
};

export const searchProductsForConsultation = async (query: string) => {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

export const generatePrescriptionPdf = async (data: any) => {
    const response = await api.post('/prescriptions/generate', data, {
        responseType: 'blob'
    });
    return response.data;
};

export const createCie10Code = async (code: string, description: string) => {
    const response = await api.post('/consultations/cie10', { code, description });
    return response.data;
};

export const uploadConsultationPhotos = async (patientId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    const response = await api.post(`/consultations/upload/${patientId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data as { urls: string[] };
};
