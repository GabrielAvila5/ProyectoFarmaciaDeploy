/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con sale.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import saleService from '../services/SaleService';

// @desc    Crea una nueva venta
// @route   POST /api/sales
// @access  Privado (Empleado/Admin/Doctor)
const createSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // req.body ya fue validado por el middleware Zod
        const sale = await saleService.createSale(req.body);
        res.status(201).json(sale);
    } catch (error) {
        // Si el error es de stock insuficiente o producto/usuario no encontrado, responde 400
        if (error instanceof Error) {
            if (
                error.message.includes('Stock insuficiente') ||
                error.message.includes('no encontrado')
            ) {
                res.status(400);
            }
        }
        next(error);
    }
};

// @desc    Lista todas las ventas
// @route   GET /api/sales
// @access  Privado (Solo Admin)
const getSales = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sales = await saleService.getAllSales();
        res.json(sales);
    } catch (error) {
        next(error);
    }
};

// @desc    Obtiene detalle de una venta
// @route   GET /api/sales/:id
// @access  Privado (Solo Admin)
const getSaleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sale = await saleService.getSaleById(Number(req.params.id));
        res.json(sale);
    } catch (error) {
        if (error instanceof Error && error.message.includes('no encontrada')) {
            res.status(404);
        }
        next(error);
    }
};
// @desc    Anula una venta y revierte stock
// @route   POST /api/sales/:id/void
// @access  Privado (Solo Admin)
const voidSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { voided_by, void_reason } = req.body;
        
        if (!voided_by || !void_reason) {
            res.status(400);
            throw new Error('Debe proveer voided_by y void_reason para anular una venta');
        }

        const sale = await saleService.voidSale(Number(req.params.id), Number(voided_by), String(void_reason));
        res.json({ message: 'Venta anulada exitosamente', sale });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('no encontrada')) {
                res.status(404);
            } else if (error.message.includes('ya fue anulada')) {
                res.status(400);
            }
        }
        next(error);
    }
};

export { createSale, getSales, getSaleById, voidSale };
