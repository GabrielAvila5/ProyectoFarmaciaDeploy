/**
 * @fileoverview Configuración principal de la aplicación Express, middlewares globales y montaje de rutas.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
// Dependencias principales: Express, CORS, Helmet (seguridad) y Morgan (logs HTTP)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
// Middleware global para manejar errores
import errorHandler from './middlewares/errorHandler';
// Rutas de productos y ventas
import productRoutes from './routes/productRoutes';
import saleRoutes from './routes/saleRoutes';
// Rutas de autenticación
import authRoutes from './routes/authRoutes';
// Rutas Clínicas nuevas
import patientRoutes from './routes/patientRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
// Rutas de Estadísticas Generales
import dashboardRoutes from './routes/dashboardRoutes';
// Rutas de Gestión de Usuarios
import userRoutes from './routes/userRoutes';
// Rutas de Consultas del Expediente Clínico
import consultationRoutes from './routes/consultationRoutes';
// Rutas de Proveedores
import supplierRoutes from './routes/supplierRoutes';
// Rutas de Órdenes de Compra
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
// Rutas de Movimientos de Inventario
import stockRoutes from './routes/stockRoutes';
// Rutas de Cortes de Caja (Auditoría)
import cashAuditRoutes from './routes/cashAuditRoutes';

// Crea la instancia de la aplicación Express
const app = express();

// Middleware
app.use(express.json());   // Parsea el cuerpo de las peticiones como JSON
// Habilita CORS configurado con el origen desde las variables de entorno, o con un default
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
    origin: corsOrigin,
    credentials: true,
}));
app.use(helmet());         // Agrega cabeceras HTTP de seguridad
app.use(morgan('dev'));    // Registra cada petición HTTP en consola (modo desarrollo)

// Routes
app.use('/api/auth', authRoutes);        // Rutas de autenticación
app.use('/api/products', productRoutes); // Rutas para gestión de productos
app.use('/api/sales', saleRoutes);       // Rutas para gestión de ventas
app.use('/api/patients', patientRoutes); // Rutas para gestión de pacientes
app.use('/api/appointments', appointmentRoutes); // Rutas para gestión de citas
app.use('/api/prescriptions', prescriptionRoutes); // Generador de recetas PDF
app.use('/api/dashboard', dashboardRoutes); // Panel de Estadísticas Generales
app.use('/api/users', userRoutes);           // Gestión de Usuarios
app.use('/api/consultations', consultationRoutes); // Expediente Cronológico
app.use('/api/suppliers', supplierRoutes);   // Gestión de Proveedores
app.use('/api/purchase-orders', purchaseOrderRoutes); // Gestión de Órdenes de Compra
app.use('/api/stock', stockRoutes);          // Movimientos y Ajustes de Inventario
app.use('/api/cash-audits', cashAuditRoutes); // Cortes de Caja (Auditoría)

// Servir estáticamente los archivos subidos (fotos médicas)
app.use('/uploads', express.static('uploads'));

// Servir el frontend compilado (React/Vite) de forma estática
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// Cualquier otra ruta que no sea de la API (/api/...) se redirige al index.html de React
// Esto es necesario para que funcione el React Router
app.use((req, res, next) => {
    // Si la ruta empieza con /api/, pasamos al siguiente middleware (manejo de error 404 de la API)
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error Handler: captura cualquier error lanzado en las rutas y lo formatea
app.use(errorHandler);

export default app;
