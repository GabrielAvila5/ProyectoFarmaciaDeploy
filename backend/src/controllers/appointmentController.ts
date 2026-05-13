/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con appointment.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import appointmentService from '../services/AppointmentService';

export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Tomamos el ID del doctor del usuario autenticado si es que la request la hace el mismo doctor
        const defaultDoctorId = req.user?.id;
        const appointment = await appointmentService.createAppointment(req.body, defaultDoctorId);
        res.status(201).json(appointment);
    } catch (error) {
        if (error instanceof Error && error.message.includes('horario exacto')) {
            res.status(409).json({ message: error.message });
            return;
        }
        next(error);
    }
};

export const getAppointments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointments = await appointmentService.getAllAppointments();
        res.json(appointments);
    } catch (error) {
        next(error);
    }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de cita inválido');
        }
        const appointment = await appointmentService.getAppointmentById(id);
        res.json(appointment);
    } catch (error) {
        if (error instanceof Error && error.message === 'Cita no encontrada') res.status(404);
        next(error);
    }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de cita inválido');
        }
        const appointment = await appointmentService.updateAppointment(id, req.body);
        res.json(appointment);
    } catch (error) {
        if (error instanceof Error && error.message.includes('horario exacto')) {
            res.status(409).json({ message: error.message });
            return;
        }
        if (error instanceof Error && error.message === 'Cita no encontrada') res.status(404);
        next(error);
    }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de cita inválido');
        }
        const result = await appointmentService.deleteAppointment(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Cita no encontrada') res.status(404);
        next(error);
    }
};
