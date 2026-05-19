/**
 * @fileoverview Punto de entrada principal del backend. Inicia el servidor HTTP y escucha conexiones.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */

// Global error handlers to catch silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL ERROR: Unhandled Rejection:', reason);
});

console.log('1. Cargando variables de entorno...');
require('dotenv').config();

console.log('2. Importando aplicación Express...');
import app from './app';

console.log('3. Importando configuración de Prisma...');
import prisma from './config/prisma';

const PORT = process.env.PORT || 3000;

console.log('4. Intentando arrancar el servidor en el puerto:', PORT);

function main() {
    try {
        const server = app.listen(PORT, () => {
            console.log(`5. ¡Servidor arrancado con éxito en el puerto ${PORT}!`);
        });

        server.on('error', (error) => {
            console.error('Error al intentar escuchar en el puerto:', error);
        });
    } catch (error) {
        console.error('Error capturado durante el arranque:', error);
    }
}

main();
