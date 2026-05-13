import { useState, useCallback, useEffect } from 'react';
import type { PurchaseOrder } from '@/types';
import * as api from './purchaseOrderApi';

export function usePurchaseOrders() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getPurchaseOrders();
            setOrders(data);
        } catch (err: unknown) {
            const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Error al cargar órdenes de compra';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addOrder = async (orderData: api.CreatePurchaseOrderPayload) => {
        const newOrder = await api.createPurchaseOrder(orderData);
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
    };

    const updateExpectedDateOrder = async (id: number, expected_date: string | null) => {
        const updated = await api.updateExpectedDate(id, expected_date);
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        return updated;
    };

    const receiveOrder = async (id: number, data: api.ReceivePurchaseOrderPayload) => {
        const updated = await api.receivePurchaseOrder(id, data);
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        return updated;
    };

    const cancelOrder = async (id: number) => {
        const updated = await api.cancelPurchaseOrder(id);
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        return updated;
    };

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    return {
        orders,
        loading,
        error,
        loadOrders,
        addOrder,
        updateExpectedDateOrder,
        receiveOrder,
        cancelOrder
    };
}
