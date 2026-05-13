/**
 * @fileoverview Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de auth.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Debe ser un correo electrónico válido'),
    password: z.string().min(1, 'La contraseña es requerida')
});
