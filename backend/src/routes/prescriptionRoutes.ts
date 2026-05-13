/**
 * @fileoverview Define los endpoints (rutas) de la API para prescription y enlaza sus respectivos controladores.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';
import { generatePrescriptionPdf } from '../controllers/prescriptionController';
import { validateBody } from '../middlewares/validateBody';
import { generatePrescriptionSchema } from '../validators/prescription.validator';

const router = express.Router();

// Middleware globales del router
router.use(authenticate);
router.use(checkRole(['admin', 'doctor'])); // Solo personal clínico

// Ruta que escupe el Buffer
router.post('/generate', validateBody(generatePrescriptionSchema), generatePrescriptionPdf);

export default router;
