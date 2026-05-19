/**
 * @fileoverview Punto de entrada principal del backend. Inicia el servidor HTTP y escucha conexiones.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
// Carga las variables de entorno PRIMERO, antes de cualquier otra importación
require('dotenv').config();

// Importa la aplicación configurada (middlewares y rutas)
import app from './app';
import prisma from './config/prisma';

// Usa el puerto definido en .env o 3000 como valor por defecto
const PORT = process.env.PORT || 3000;

// Verifica la conexión a MariaDB e inicia el servidor
// Inicia el servidor sin forzar la conexión previa a la BD (Prisma se conecta on-demand)
function main() {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
    });
}

main();
