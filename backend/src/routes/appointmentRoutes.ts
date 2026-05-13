/**
 * @fileoverview Define los endpoints (rutas) de la API para appointment y enlaza sus respectivos controladores.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

// Middleware de protección general
router.use(authenticate);

// Restricción: Admin, Doctores y Empleados (Para agendar citas)
router.use(checkRole(['admin', 'doctor', 'employee']));

import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
} from '../controllers/appointmentController';
import { validateBody } from '../middlewares/validateBody';
import { createAppointmentSchema, updateAppointmentSchema } from '../validators/appointment.validator';

// Endpoints (Protegidos)
router.get('/', getAppointments);
router.post('/', validateBody(createAppointmentSchema), createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', validateBody(updateAppointmentSchema), updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
