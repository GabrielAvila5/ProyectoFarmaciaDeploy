import { Request, Response } from 'express';
import StockService from '../services/StockService';

class StockController {
    /**
     * POST /api/stock/quick-restock
     * Realiza un ingreso rápido de mercancía sin orden de compra.
     */
    async quickRestock(req: Request, res: Response) {
        try {
            // El usuario autenticado viene del authMiddleware
            const user_id = req.user?.id;
            
            if (!user_id) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            const data = {
                ...req.body,
                expiry_date: new Date(req.body.expiry_date),
                user_id
            };

            const result = await StockService.quickRestock(data);

            return res.status(201).json({
                message: 'Ajuste de inventario registrado correctamente',
                data: result
            });
        } catch (error: any) {
            console.error('Error en quickRestock:', error);
            return res.status(400).json({ message: error.message || 'Error al registrar reabastecimiento rápido' });
        }
    }

    /**
     * GET /api/stock/movements
     * Retorna el historial de movimientos de inventario.
     */
    async getInventoryMovements(req: Request, res: Response) {
        try {
            const movements = await StockService.getInventoryMovements();
            return res.status(200).json(movements);
        } catch (error: any) {
            console.error('Error al obtener movimientos de inventario:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    /**
     * POST /api/stock/adjust
     * Ajuste manual de stock de un lote (solo admin).
     * Requiere: batch_id, new_quantity, reason
     */
    async adjustStock(req: Request, res: Response) {
        try {
            const user_id = req.user?.id;
            if (!user_id) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            const { batch_id, new_quantity, reason } = req.body;

            if (!batch_id || new_quantity === undefined || !reason) {
                return res.status(400).json({ message: 'Debe proveer batch_id, new_quantity y reason' });
            }

            const result = await StockService.adjustStock({
                batch_id: Number(batch_id),
                new_quantity: Number(new_quantity),
                reason: String(reason),
                user_id
            });

            return res.status(200).json({
                message: 'Ajuste manual registrado correctamente',
                data: result
            });
        } catch (error: any) {
            console.error('Error en adjustStock:', error);
            return res.status(400).json({ message: error.message || 'Error al ajustar stock' });
        }
    }
}

export default new StockController();
