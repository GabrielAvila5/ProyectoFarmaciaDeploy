/**
 * @fileoverview Middleware para verificar la autenticación del usuario mediante tokens JWT.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware para proteger rutas, verificando el token JWT.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Leer el header Authorization (Bearer <token>)
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401);
            throw new Error('No autorizado, no hay token o formato incorrecto');
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET no configurado');
        }

        // Verificar el token
        const decoded = jwt.verify(token, secret) as { id: number; name: string; role: string };

        // Adjuntar el usuario decodificado a req.user (gracias al module augmentation)
        req.user = decoded;

        next();
    } catch (error) {
        res.status(401);
        next(new Error('No autorizado, token inválido o expirado'));
    }
};
