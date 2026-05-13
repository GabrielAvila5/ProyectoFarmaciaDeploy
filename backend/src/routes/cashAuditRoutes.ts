/**
 * @fileoverview Rutas de cortes de caja (cash audits).
 * 
 * Política de acceso:
 *   - Crear corte de caja: admin, employee (cajero registra su conteo)
 *   - Ver historial de cortes: SOLO admin (auditoría)
 *   - Ver monto esperado: admin, employee
 */
import express from 'express';
import { createCashAudit, getCashAudits, getExpectedAmount } from '../controllers/cashAuditController';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

router.use(authenticate);

// GET /api/cash-audits → Solo admin puede ver el historial de cortes
router.get('/', checkRole(['admin']), getCashAudits);

// GET /api/cash-audits/expected → Admin y cajero pueden ver el monto esperado
router.get('/expected', checkRole(['admin', 'employee']), getExpectedAmount);

// POST /api/cash-audits → Admin y cajero pueden registrar un corte
router.post('/', checkRole(['admin', 'employee']), createCashAudit);

export default router;
