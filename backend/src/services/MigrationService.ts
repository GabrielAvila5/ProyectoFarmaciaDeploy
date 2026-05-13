/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de Migration.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import prisma from '../config/prisma';
import fs from 'fs';

// Servicio para importar datos masivos desde archivos JSON a la base de datos
class MigrationService {
    /**
     * Importa datos desde un archivo JSON hacia la tabla correspondiente.
     * @param filePath - Ruta al archivo JSON con los datos.
     * @param type - Tipo de datos: 'products' o 'users'.
     */
    async importData(filePath: string, type: 'products' | 'users') {
        try {
            // Lee y parsea el archivo JSON desde el sistema de archivos
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (type === 'products') {
                // Inserta todos los productos de una vez (operación masiva)
                await prisma.products.createMany({ data });
                console.log('Products Imported!');
            } else if (type === 'users') {
                // Inserta todos los usuarios de una vez
                await prisma.users.createMany({ data });
                console.log('Users Imported!');
            } else {
                throw new Error('Invalid data type. Use "products" or "users".');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error with data import: ${message}`);
            throw error;
        }
    }
}

// Exporta una única instancia del servicio (patrón singleton)
export default new MigrationService();
