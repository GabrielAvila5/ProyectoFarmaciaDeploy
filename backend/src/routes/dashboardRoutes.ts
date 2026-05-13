/**
 * @fileoverview Rutas de dashboard.
 * 
 * Política de acceso:
 *   - Dashboard summary y charts: admin, employee, doctor (todos los roles autenticados)
 *   - /report: mismo criterio — cualquier rol autenticado
 */
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';
import { getDashboardSummary, getDashboardCharts, getDashboardReport } from '../controllers/dashboardController';

const router = express.Router();

// Middleware globales del router
router.use(authenticate);
// Todos los roles autenticados pueden ver el dashboard
router.use(checkRole(['admin', 'employee', 'doctor']));

// Endpoint principal
router.get('/summary', getDashboardSummary);

// Datos para gráficas (ventas 7 días + categorías)
router.get('/charts', getDashboardCharts);

// Reporte por rango de fechas personalizado
// GET /dashboard/report?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/report', getDashboardReport);

export default router;

