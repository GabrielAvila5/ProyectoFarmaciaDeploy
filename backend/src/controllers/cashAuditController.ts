/**
 * @fileoverview Controlador para manejar las peticiones HTTP relacionadas con cortes de caja (cash audits).
 */
import { Request, Response, NextFunction } from 'express';
import cashAuditService from '../services/CashAuditService';

// @desc    Registra un nuevo corte de caja
// @route   POST /api/cash-audits
// @access  Privado (Admin, Employee)
const createCashAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            res.status(401);
            throw new Error('Usuario no autenticado');
        }

        const { counted_amount, notes } = req.body;

        if (counted_amount === undefined) {
            res.status(400);
            throw new Error('Debe proveer counted_amount');
        }

        // Calcular el monto esperado automáticamente
        const expected_amount = await cashAuditService.getExpectedAmountForToday(user_id);

        const audit = await cashAuditService.createAudit({
            user_id,
            expected_amount,
            counted_amount: Number(counted_amount),
            notes
        });

        res.status(201).json(audit);
    } catch (error) {
        next(error);
    }
};

// @desc    Lista todos los cortes de caja
// @route   GET /api/cash-audits
// @access  Privado (Solo Admin)
const getCashAudits = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const audits = await cashAuditService.getAllAudits();
        res.json(audits);
    } catch (error) {
        next(error);
    }
};

// @desc    Obtiene el monto esperado en caja para el usuario actual
// @route   GET /api/cash-audits/expected
// @access  Privado (Admin, Employee)
const getExpectedAmount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            res.status(401);
            throw new Error('Usuario no autenticado');
        }

        const expected = await cashAuditService.getExpectedAmountForToday(user_id);
        res.json({ expected_amount: expected });
    } catch (error) {
        next(error);
    }
};

export { createCashAudit, getCashAudits, getExpectedAmount };
