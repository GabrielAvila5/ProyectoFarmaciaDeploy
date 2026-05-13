/**
 * @fileoverview Define los endpoints (rutas) de la API para patient y enlaza sus respectivos controladores.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

// Middleware de protección: Solo usuarios logueados pueden acceder a pacientes
router.use(authenticate);

// Restricción dura: ESTRICTAMENTE Admin y Doctores (Empleados recibirán 403 Forbidden)
router.use(checkRole(['admin', 'doctor']));

import {
    createPatient,
    getPatients,
    searchPatients,
    getPatientById,
    updatePatient,
    deletePatient,
} from '../controllers/patientController';
import { validateBody } from '../middlewares/validateBody';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator';

// Endpoints (Protegidos)
router.get('/', getPatients);
router.post('/', validateBody(createPatientSchema), createPatient);
router.get('/search', searchPatients);
router.get('/:id', getPatientById);
router.put('/:id', validateBody(updatePatientSchema), updatePatient);
router.delete('/:id', deletePatient);

export default router;
