import { Request, Response, NextFunction } from 'express';
import consultationService from '../services/ConsultationService';
import prisma from '../config/prisma';

export const createConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const consultation = await consultationService.createConsultation(req.body);
        res.status(201).json(consultation);
    } catch (error) {
        next(error);
    }
};

export const searchCie10 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const query = String(req.query.q || '').trim();
        if (!query) {
            // Devolver diagnósticos frecuentes dermatológicos (priorizando códigos L comunes)
            const frequentResults = await prisma.$queryRaw<any[]>`
                SELECT code, description 
                FROM cie10_catalog 
                WHERE code LIKE 'L%' OR code LIKE 'B0%' OR code LIKE 'C4%' OR code LIKE 'D2%'
                ORDER BY CASE 
                    WHEN code LIKE 'L%' THEN 1 
                    ELSE 2 
                END, code ASC
                LIMIT 20
            `;
            res.json(frequentResults);
            return;
        }
        const searchPattern = `%${query}%`;
        // Búsqueda con collation utf8mb4 para ignorar acentos/diacríticos
        const results = await prisma.$queryRaw<any[]>`
            SELECT code, description 
            FROM cie10_catalog 
            WHERE code COLLATE utf8mb4_unicode_ci LIKE ${searchPattern}
               OR description COLLATE utf8mb4_unicode_ci LIKE ${searchPattern}
            ORDER BY 
                CASE WHEN code LIKE 'L%' THEN 1 ELSE 2 END ASC,
                code ASC
            LIMIT 20
        `;
        res.json(results);
    } catch (error) {
        next(error);
    }
};

export const getConsultationsByPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const patientId = parseInt(String(req.params.patientId), 10);
        if (isNaN(patientId)) {
            res.status(400);
            throw new Error('ID de paciente inválido');
        }
        const consultations = await consultationService.getConsultationsByPatient(patientId);
        res.json(consultations);
    } catch (error) {
        next(error);
    }
};

export const getConsultationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de consulta inválido');
        }
        const consultation = await consultationService.getConsultationById(id);
        res.json(consultation);
    } catch (error) {
        if (error instanceof Error && error.message === 'Consulta no encontrada') res.status(404);
        next(error);
    }
};

export const updateConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de consulta inválido');
        }
        const consultation = await consultationService.updateConsultation(id, req.body);
        res.json(consultation);
    } catch (error) {
        if (error instanceof Error && error.message.includes('legalmente')) {
            res.status(403);
            res.json({ message: error.message });
            return;
        }
        if (error instanceof Error && error.message === 'Consulta no encontrada') res.status(404);
        next(error);
    }
};

export const deleteConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de consulta inválido');
        }
        const result = await consultationService.deleteConsultation(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message.includes('legalmente')) {
            res.status(403);
            res.json({ message: error.message });
            return;
        }
        if (error instanceof Error && error.message === 'Consulta no encontrada') res.status(404);
        next(error);
    }
};

export const createCie10Code = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { code, description } = req.body;
        
        if (!code || !description) {
            res.status(400);
            throw new Error('Código y descripción son obligatorios');
        }

        // Eliminar punto decimal y limpiar espacios/mayúsculas
        const cleanCode = String(code).replace(/\./g, '').trim().toUpperCase();
        const cleanDesc = String(description).trim();

        // Validar Regex: Letra + 2 o 3 números
        const regex = /^[A-Z][0-9]{2,3}$/;
        if (!regex.test(cleanCode)) {
            res.status(400);
            throw new Error('Formato de código inválido.');
        }

        const newCode = await prisma.cie10_catalog.upsert({
            where: { code: cleanCode },
            update: {
                description: cleanDesc,
                is_custom: true
            },
            create: {
                code: cleanCode,
                description: cleanDesc,
                is_custom: true
            }
        });

        res.status(201).json(newCode);
    } catch (error) {
        next(error);
    }
};
