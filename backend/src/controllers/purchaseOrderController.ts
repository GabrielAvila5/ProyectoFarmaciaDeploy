import { Request, Response } from 'express';
import PurchaseOrderService from '../services/PurchaseOrderService';

export const getPurchaseOrders = async (req: Request, res: Response) => {
    try {
        const orders = await PurchaseOrderService.getAllPurchaseOrders();
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPurchaseOrderById = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const order = await PurchaseOrderService.getPurchaseOrderById(id);
        res.json(order);
    } catch (error: any) {
        if (error.message === 'Orden de compra no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
    try {
        // En un entorno productivo real, el user_id vendría del token (req.user),
        // pero lo dejaremos tomar del body si se envía, o lo sobre-escribiremos aquí.
        // Aquí asumimos que el body trae `user_id` o lo obtenemos de `req.user.id`.
        // Usaremos `req.user?.id` si está disponible por authMiddleware.
        const userId = (req as any).user?.id || req.body.user_id;

        if (!userId) {
            return res.status(400).json({ error: 'Usuario no identificado' });
        }

        const data = {
            ...req.body,
            user_id: userId
        };

        const order = await PurchaseOrderService.createPurchaseOrder(data);
        res.status(201).json(order);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const receivePurchaseOrder = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const order = await PurchaseOrderService.receivePurchaseOrder(id, req.body);
        res.json(order);
    } catch (error: any) {
        if (error.message === 'Orden de compra no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
};

export const updateExpectedDate = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const { expected_delivery_date } = req.body;
        const order = await PurchaseOrderService.updateExpectedDate(id, expected_delivery_date);
        res.json(order);
    } catch (error: any) {
        if (error.message === 'Orden de compra no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
};

export const cancelPurchaseOrder = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const order = await PurchaseOrderService.cancelPurchaseOrder(id);
        res.json(order);
    } catch (error: any) {
         if (error.message === 'Orden de compra no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
};
