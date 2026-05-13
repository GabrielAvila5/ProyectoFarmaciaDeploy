/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con dashboard.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/DashboardService';

export const getDashboardSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const summary = await dashboardService.getSummary();
        res.json(summary);
    } catch (error) {
        next(error);
    }
};

export const getDashboardCharts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const chartData = await dashboardService.getChartData();
        res.json(chartData);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /dashboard/report?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Devuelve un reporte de ventas para el rango de fechas indicado,
 * con agrupación dinámica (día / semana / mes).
 */
export const getDashboardReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { from, to } = req.query as { from?: string; to?: string };

        if (!from || !to) {
            res.status(400).json({ message: 'Se requieren los parámetros "from" y "to" (YYYY-MM-DD).' });
            return;
        }

        const fromDate = new Date(from);
        const toDate   = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            res.status(400).json({ message: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
            return;
        }

        if (fromDate > toDate) {
            res.status(400).json({ message: '"from" no puede ser mayor que "to".' });
            return;
        }

        const reportData = await dashboardService.getReportData(fromDate, toDate);
        res.json(reportData);
    } catch (error) {
        next(error);
    }
};
