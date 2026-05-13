/**
 * @fileoverview Rutas de órdenes de compra.
 * 
 * Política de acceso:
 *   - Ver órdenes: admin, employee
 *   - Crear/recibir/cancelar/editar fecha: admin, employee
 *   - Doctor NO tiene acceso a compras
 */
import express from 'express';
import {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    receivePurchaseOrder,
    cancelPurchaseOrder,
    updateExpectedDate
} from '../controllers/purchaseOrderController';
import { createPurchaseOrderSchema, receivePurchaseOrderSchema, updateExpectedDateSchema } from '../validators/purchaseOrder.validator';
import { validateBody } from '../middlewares/validateBody';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

router.use(authenticate);

// Listar y crear órdenes (admin y employee)
router.route('/')
    .get(checkRole(['admin', 'employee']), getPurchaseOrders)
    .post(checkRole(['admin', 'employee']), validateBody(createPurchaseOrderSchema), createPurchaseOrder);

// Detalle de una orden específica
router.route('/:id')
    .get(checkRole(['admin', 'employee']), getPurchaseOrderById);

// Recibir orden (registrar lote y stock)
router.post('/:id/receive', checkRole(['admin', 'employee']), validateBody(receivePurchaseOrderSchema), receivePurchaseOrder);

// Modificar fecha esperada
router.put('/:id/expected-date', checkRole(['admin', 'employee']), validateBody(updateExpectedDateSchema), updateExpectedDate);

// Cancelar orden
router.post('/:id/cancel', checkRole(['admin']), cancelPurchaseOrder);

export default router;
