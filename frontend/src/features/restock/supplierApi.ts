import api from '@/lib/api';
import type { Supplier } from '@/types';

export interface CreateSupplierPayload {
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    lead_time_days?: number;
}

export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {}

export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data;
};

export const createSupplier = async (data: CreateSupplierPayload): Promise<Supplier> => {
    const response = await api.post('/suppliers', data);
    return response.data;
};

export const updateSupplier = async (id: number, data: UpdateSupplierPayload): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
};

export const deleteSupplier = async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
};

export const toggleSupplierStatus = async (id: number, is_active: boolean): Promise<Supplier> => {
    const response = await api.patch(`/suppliers/${id}/status`, { is_active });
    return response.data;
};
