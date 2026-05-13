/**
 * @fileoverview Define los endpoints (rutas) de la API para sale y enlaza sus respectivos controladores.
 * 
 * Política de acceso:
 *   - Crear ventas: admin, employee
 *   - Ver historial de ventas: admin
 *   - Ver detalle de venta: admin, employee
 *   - Anular ventas: SOLO admin (requiere voided_by y void_reason)
 */
import express from 'express';
import { createSale, getSales, getSaleById, voidSale } from '../controllers/saleController';
import { createSaleSchema } from '../validators/sale.validator';
import { validateBody } from '../middlewares/validateBody';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

// Middleware global para proteger estas rutas
router.use(authenticate);

// GET /api/sales → Admin y cajero pueden ver el historial de ventas
router.get('/', checkRole(['admin', 'employee']), getSales);

// GET /api/sales/:id → Admin y cajero pueden ver detalle de venta
router.get('/:id', checkRole(['admin', 'employee']), getSaleById);

// POST /api/sales → Admin y cajeros pueden crear ventas
router.post('/', checkRole(['admin', 'employee']), validateBody(createSaleSchema), createSale);

// POST /api/sales/:id/void → SOLO admin puede anular ventas (requiere motivo)
router.post('/:id/void', checkRole(['admin']), voidSale);

export default router;
