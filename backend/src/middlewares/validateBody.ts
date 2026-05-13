/**
 * @fileoverview Middleware para validar el cuerpo de las peticiones (body) usando esquemas Zod o similares.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Middleware genérico de validación con Zod
// Recibe un schema de Zod y valida el cuerpo de la petición
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            // Si hay errores de validación, responde 400 con la lista formateada
            res.status(400).json({
                message: 'Error de validación',
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
            return;
        }
        // Reemplaza req.body con datos parseados y validados
        req.body = result.data;
        next();
    };
};
