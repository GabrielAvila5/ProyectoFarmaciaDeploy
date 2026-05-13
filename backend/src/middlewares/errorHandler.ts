/**
 * @fileoverview Middleware global para la captura, formateo y manejo de errores de la API.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import logger from '../utils/logger';

// Middleware global para manejar errores en la aplicación
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    // Si el status ya fue establecido en la ruta, lo usa; si no, usa 500 (error interno del servidor)
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    // Registrar el error detallado con Winston
    logger.error(err.message, {
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        ip: req.ip,
        user: (req as any).user?.id || 'Unauthenticated'
    });

    res.status(statusCode);

    // Devuelve el mensaje de error y el stack trace (solo en desarrollo, no en producción)
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export default errorHandler;
