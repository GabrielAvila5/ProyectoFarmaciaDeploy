import { Request, Response } from 'express';
import SupplierService from '../services/SupplierService';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await SupplierService.getAllSuppliers();
        res.json(suppliers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSupplierById = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const supplier = await SupplierService.getSupplierById(id);
        res.json(supplier);
    } catch (error: any) {
        if (error.message === 'Proveedor no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const supplier = await SupplierService.createSupplier(req.body);
        res.status(201).json(supplier);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSupplier = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const supplier = await SupplierService.updateSupplier(id, req.body);
        res.json(supplier);
    } catch (error: any) {
        if (error.message === 'Proveedor no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        await SupplierService.deleteSupplier(id);
        res.json({ message: 'Proveedor eliminado exitosamente' });
    } catch (error: any) {
        if (error.message === 'Proveedor no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
};

export const toggleSupplierStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active field must be a boolean' });

        const supplier = await SupplierService.updateSupplierStatus(id, is_active);
        res.json(supplier);
    } catch (error: any) {
        if (error.message === 'Proveedor no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};
