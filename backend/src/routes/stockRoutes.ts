/**
 * @fileoverview Rutas de inventario/stock.
 * 
 * Política de acceso:
 *   - Reabastecimiento rápido: admin, employee
 *   - Ajuste manual de stock: SOLO admin (auditable)
 *   - Ver movimientos de inventario: admin, employee
 */
import { Router } from 'express';
import StockController from '../controllers/stockController';
import { validateBody } from '../middlewares/validateBody';
import { quickRestockSchema } from '../validators/stock.validator';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = Router();

// Todas las rutas de inventario requieren autenticación
router.use(authenticate);

// Ingreso rápido de inventario (Admin y Cajero)
router.post(
    '/quick-restock',
    checkRole(['admin', 'employee']),
    validateBody(quickRestockSchema),
    StockController.quickRestock
);

// Historial de movimientos (Admin y Cajero pueden ver)
router.get(
    '/movements',
    checkRole(['admin', 'employee']),
    StockController.getInventoryMovements
);

// Ajuste manual de stock (SOLO Admin — operación sensible de auditoría)
router.post(
    '/adjust',
    checkRole(['admin']),
    StockController.adjustStock
);

export default router;
