/**
 * @fileoverview Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de users.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import api from '@/lib/api';

export interface UserItem {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role_id: number | null;
    roles: { id: number; name: string } | null;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'employee' | 'doctor';
    specialty?: string;
    phone?: string;
    alma_mater?: string;
    consultation_fee?: number;
    consulting_room?: string;
}

export async function fetchUsers(): Promise<UserItem[]> {
    const res = await api.get('/users');
    return res.data;
}

export async function fetchDoctors(): Promise<UserItem[]> {
    const res = await api.get('/users/doctors');
    return res.data;
}

export async function createUser(data: CreateUserPayload): Promise<UserItem> {
    const res = await api.post('/users', data);
    return res.data;
}

export async function toggleUserActive(id: number): Promise<UserItem> {
    const res = await api.patch(`/users/${id}/toggle-active`);
    return res.data;
}

export async function deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
}
