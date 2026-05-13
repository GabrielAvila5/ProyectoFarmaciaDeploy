/**
 * @fileoverview Define los endpoints (rutas) de la API para auth y enlaza sus respectivos controladores.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Router } from 'express';
import authController from '../controllers/authController';

const router = Router();

// Ruta de login
router.post('/login', authController.login);

export default router;
