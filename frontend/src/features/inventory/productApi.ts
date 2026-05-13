/**
 * @fileoverview Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import api from '@/lib/api';
import type { Product } from '@/types';

export interface CreateProductPayload {
    name: string;
    description?: string;
    base_price: number;
    category?: string;
    brand?: string;
    supplier_id?: number;
    min_stock?: number;
    batches?: {
        batch_number: string;
        quantity: number;
        expiry_date: string;
        promo_price?: number;
        location?: string;
    }[];
}

export interface UpdateProductPayload {
    name?: string;
    description?: string;
    base_price?: number;
    category?: string;
    brand?: string;
    supplier_id?: number;
    min_stock?: number;
}

// Obtiene todos los productos con sus lotes
export async function fetchProducts(): Promise<Product[]> {
    const res = await api.get<Product[]>('/products');
    return res.data;
}

// Crea un nuevo producto (opcionalmente con lote inicial)
export async function createProduct(data: CreateProductPayload): Promise<Product> {
    const res = await api.post<Product>('/products', data);
    return res.data;
}

// Actualiza un producto existente por ID
export async function updateProduct(id: number, data: UpdateProductPayload): Promise<Product> {
    const res = await api.put<Product>(`/products/${id}`, data);
    return res.data;
}

// Elimina un producto por ID
export async function deleteProduct(id: number): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>(`/products/${id}`);
    return res.data;
}
