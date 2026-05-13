import api from '@/lib/api';
import type { PurchaseOrder } from '@/types';

export interface CreatePurchaseOrderPayload {
    supplier_id: number;
    expected_delivery_date?: string | null;
    items: Array<{
        product_id: number;
        quantity: number;
        unit_cost: number;
    }>;
}

export interface ReceivePurchaseOrderPayload {
    items: Array<{
        purchase_order_item_id: number;
        batch_number: string;
        expiry_date: string;
    }>;
}

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    const response = await api.get('/purchase-orders');
    return response.data;
};

export const createPurchaseOrder = async (data: CreatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
};

export const updateExpectedDate = async (id: number, expected_delivery_date: string | null): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}/expected-date`, { expected_delivery_date });
    return response.data;
};

export const receivePurchaseOrder = async (id: number, data: ReceivePurchaseOrderPayload): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/receive`, data);
    return response.data;
};

export const cancelPurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/cancel`);
    return response.data;
};
