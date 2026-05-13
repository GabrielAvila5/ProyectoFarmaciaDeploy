/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con auth.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import { loginSchema } from '../validators/authValidator';

class AuthController {
    /**
     * Maneja el endpoint de login
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            // Validar la request con Zod
            const validatedData = loginSchema.parse(req.body);

            // Llamar al servicio
            const result = await AuthService.login(validatedData.email, validatedData.password);

            // Devolver respuesta
            res.status(200).json({
                message: 'Login exitoso',
                ...result
            });
        } catch (error: any) {
            // Si es un error personalizado de "Credenciales inválidas", lo marcamos como 401
            if (error.message === 'Credenciales inválidas') {
                res.status(401);
            }
            next(error);
        }
    }
}

export default new AuthController();
