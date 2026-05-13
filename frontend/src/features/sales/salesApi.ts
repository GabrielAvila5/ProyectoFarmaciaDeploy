/**
 * @fileoverview Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import api from '@/lib/api';
import type { Product } from '@/types';

export interface CreateSalePayload {
    user_id: number;
    items: {
        product_id: number;
        quantity: number;
    }[];
    payment_method: 'cash' | 'card';
    amount_paid?: number;
}

export interface SaleResponse {
    id: number;
    user_id: number;
    sale_date: string;
    total_amount: string;
    payment_method: string;
    amount_paid: string | null;
    sale_items: {
        id: number;
        sale_id: number;
        batch_id: number;
        quantity: number;
        price_at_sale: string;
        batches: {
            id: number;
            batch_number: string;
            product_id: number;
        };
    }[];
    users: {
        id: number;
        name: string;
        email: string;
    };
}

// Crea una nueva venta
export async function createSale(data: CreateSalePayload): Promise<SaleResponse> {
    const res = await api.post<SaleResponse>('/sales', data);
    return res.data;
}

// Reutiliza fetchProducts del módulo de inventario para obtener catálogo con stock
export async function fetchProductCatalog(): Promise<Product[]> {
    const res = await api.get<Product[]>('/products');
    return res.data;
}
