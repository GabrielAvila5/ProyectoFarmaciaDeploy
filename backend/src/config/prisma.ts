/**
 * @fileoverview Instancia global del cliente Prisma ORM para interactuar con la base de datos.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
// Instancia singleton de PrismaClient para toda la aplicación
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
