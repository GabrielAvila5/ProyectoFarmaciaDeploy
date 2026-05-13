/**
 * @fileoverview Configuración global del logger de la aplicación utilizando Winston.
 * Centraliza los logs con transportes para consola (desarrollo) y archivo (producción/errores).
 */

import winston from 'winston';
import path from 'path';

// Definir los niveles de severidad
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Establecer el nivel dependiendo del entorno
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

// Colores personalizados
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);

// Formato de los logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }), // Captura automáticamente los stack traces
    winston.format.printf((info) => {
        const { timestamp, level, message, stack, ...meta } = info;
        const metaString = Object.keys(meta).length ? `\nContext: ${JSON.stringify(meta, null, 2)}` : '';
        return `[${timestamp}] ${level}: ${message}${stack ? `\nStack: ${stack}` : ''}${metaString}`;
    })
);

// Formulario para consola (coloreado)
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    format
);

// Transportes: lugares donde se guardarán los logs
const transports = [
    // Consola para modo de desarrollo
    new winston.transports.Console({
        format: consoleFormat,
    }),
    // Archivo exclusivamente para errores
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        format: format,
    }),
    // Archivo con todos los logs (opcional, para auditoría general)
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/all.log'),
        format: format,
    }),
];

// Crear y exportar la instancia del logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export default logger;
