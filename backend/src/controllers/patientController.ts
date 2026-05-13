/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con patient.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import patientService from '../services/PatientService';

export const createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const patient = await patientService.createPatient(req.body);
        res.status(201).json(patient);
    } catch (error) {
        next(error);
    }
};

export const getPatients = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const patients = await patientService.getAllPatients();
        res.json(patients);
    } catch (error) {
        next(error);
    }
};

export const searchPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const query = req.query.q as string;
        const patients = await patientService.searchPatients(query || '');
        res.json(patients);
    } catch (error) {
        next(error);
    }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de paciente inválido');
        }
        const patient = await patientService.getPatientById(id);
        res.json(patient);
    } catch (error) {
        if (error instanceof Error && error.message === 'Paciente no encontrado') res.status(404);
        next(error);
    }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de paciente inválido');
        }
        const patient = await patientService.updatePatient(id, req.body);
        res.json(patient);
    } catch (error) {
        if (error instanceof Error && error.message === 'Paciente no encontrado') res.status(404);
        next(error);
    }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de paciente inválido');
        }
        const result = await patientService.deletePatient(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Paciente no encontrado') res.status(404);
        next(error);
    }
};
