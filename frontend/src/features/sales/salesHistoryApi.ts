/**
 * @fileoverview Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import api from '@/lib/api';

// Tipos para el historial de ventas
export interface SaleHistoryItem {
    id: number;
    user_id: number;
    sale_date: string;
    total_amount: string;
    payment_method: string;
    amount_paid: string | null;
    status: string;
    users: {
        id: number;
        name: string;
        email: string;
    };
    sale_items: SaleDetailItem[];
}

export interface SaleDetailItem {
    id: number;
    sale_id: number;
    batch_id: number;
    quantity: number;
    price_at_sale: string;
    batches: {
        id: number;
        batch_number: string;
        products: {
            id: number;
            name: string;
            sku: string;
            category: string | null;
            base_price?: string;
        };
    };
}

// Obtiene la lista completa de ventas (solo admin)
export async function fetchSalesHistory(): Promise<SaleHistoryItem[]> {
    const response = await api.get('/sales');
    return response.data;
}

// Obtiene detalle de una venta específica
export async function fetchSaleDetail(id: number): Promise<SaleHistoryItem> {
    const response = await api.get(`/sales/${id}`);
    return response.data;
}

// Anula una venta
export async function voidSale(id: number): Promise<{ message: string; sale: SaleHistoryItem }> {
    const response = await api.post(`/sales/${id}/void`);
    return response.data;
}
