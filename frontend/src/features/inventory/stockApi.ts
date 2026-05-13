import api from '@/lib/api';
import type { DirectRestockFormData } from './directRestockSchemas';

export const quickRestock = async (data: DirectRestockFormData) => {
    const response = await api.post('/stock/quick-restock', data);
    return response.data;
};

export const getInventoryMovements = async () => {
    const response = await api.get('/stock/movements');
    return response.data;
};
