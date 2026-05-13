import { useState, useCallback, useEffect } from 'react';
import type { Supplier } from '@/types';
import * as api from './supplierApi';

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSuppliers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getSuppliers();
            setSuppliers(data);
        } catch (err: unknown) {
            const message = (err as any)?.response?.data?.message || (err as any)?.message || 'Error al cargar proveedores';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addSupplier = async (supplierData: api.CreateSupplierPayload) => {
        const newSupplier = await api.createSupplier(supplierData);
        setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
        return newSupplier;
    };

    const editSupplier = async (id: number, supplierData: api.UpdateSupplierPayload) => {
        const updated = await api.updateSupplier(id, supplierData);
        setSuppliers(prev => prev.map(s => s.id === id ? updated : s).sort((a, b) => a.name.localeCompare(b.name)));
        return updated;
    };

    const removeSupplier = async (id: number) => {
        await api.deleteSupplier(id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
    };

    const toggleStatus = async (id: number, is_active: boolean) => {
        const updated = await api.toggleSupplierStatus(id, is_active);
        setSuppliers(prev => prev.map(s => s.id === id ? updated : s).sort((a, b) => a.name.localeCompare(b.name)));
        return updated;
    };

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    return {
        suppliers,
        loading,
        error,
        loadSuppliers,
        addSupplier,
        editSupplier,
        removeSupplier,
        toggleStatus
    };
}
