/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con user.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import UserService from '../services/UserService';

// GET /api/users
export async function getUsers(_req: Request, res: Response, next: NextFunction) {
    try {
        const users = await UserService.getAllUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
}

// GET /api/users/doctors
export async function getDoctors(_req: Request, res: Response, next: NextFunction) {
    try {
        const doctors = await UserService.getAllDoctors();
        res.json(doctors);
    } catch (error) {
        next(error);
    }
}

// POST /api/users
export async function createUser(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await UserService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

// PATCH /api/users/:id/toggle-active
export async function toggleUserActive(req: Request, res: Response, next: NextFunction) {
    try {
        const targetId = parseInt(req.params.id as string, 10);
        const requestingUserId = (req as any).user?.id;

        if (isNaN(targetId)) {
            res.status(400).json({ message: 'ID de usuario inválido' });
            return;
        }

        const user = await UserService.toggleActive(targetId, requestingUserId);
        res.json(user);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/users/:id
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const targetId = parseInt(req.params.id as string, 10);
        const requestingUserId = (req as any).user?.id;

        if (isNaN(targetId)) {
            res.status(400).json({ message: 'ID de usuario inválido' });
            return;
        }

        const result = await UserService.deleteUser(targetId, requestingUserId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}
