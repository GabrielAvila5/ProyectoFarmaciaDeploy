# Sistema de Gestión para Farmacia — Explicación del Proyecto (FarmaGestión)

## 📋 Descripción General

**FarmaGestión** es un sistema integral diseñado para la gestión clínica y administrativa de una farmacia moderna. El sistema permite controlar el ciclo completo del negocio: desde la recepción de productos médicos y control de lotes (caducidad), hasta el registro de ventas, historial de transacciones, panel de control con métricas en tiempo real y gestión de pacientes con agenda de citas.

Este proyecto ha evolucionado de un prototipo básico a una aplicación robusta con una arquitectura profesional de doble capa (Frontend y Backend) utilizando tecnologías modernas de alto rendimiento.

---

## 🚀 Estado Actual del Proyecto (Marzo 2026)

### ✅ Implementado y Operacional

| Módulo | Tecnología | Descripción |
|--------|------------|-------------|
| **Backend API** | Node.js + TypeScript | Arquitectura por capas (Routes -> Controller -> Service). |
| **Base de Datos** | MySQL + Prisma ORM | Esquema relacional con productos, lotes, ventas, usuarios y pacientes. |
| **Frontend SPA** | React 19 + Vite | Interfaz rápida y reactiva con TypeScript. |
| **UI/UX Cosmético** | Tailwind + shadcn/ui | Diseño moderno con paleta armoniosa y modo oscuro. |
| **Gestión de Ventas** | Transacciones Prisma | Creación de ventas y tickets con ajuste automático de stock por lotes. |
| **Historial de Ventas** | Tabla Dinámica | Visualización de transacciones pasadas y lógica de **Anulación (Voiding)** con reversión de inventario. |
| **Dashboard** | Recharts | Gráficas de ventas semanales, categorías más vendidas y alertas de stock/caducidad. |
| **Módulo Clínico** | CRUD Completo | Registro de pacientes y agenda de citas médicas. |
| **Seguridad** | JWT + Roles | Autenticación robusta y control de acceso (Admin/Vendedor/Doctor). |
| **Observabilidad** | Winston + Morgan | Logs estructurados para depuración en tiempo real. |

---

## 🏗️ Arquitectura del Sistema

### 1. Backend (`backend/`)
El corazón del sistema utiliza una **Arquitectura en Capas** para asegurar que el código sea mantenible y escalable.

- **`prisma/schema.prisma`**: Definición de la base de datos (MySQL). Prisma genera tipos automáticos para todo el backend.
- **`src/routes/`**: Define los puntos de entrada (p. ej. `/api/sales`, `/api/products`).
- **`src/controllers/`**: Gestiona las peticiones HTTP, validando entradas antes de enviarlas a la lógica de negocio.
- **`src/services/`**: Donde reside la **Lógica de Negocio**. Por ejemplo, `SaleService.ts` maneja transacciones complejas para asegurar que si una venta falla, el stock no se descuente incorrectamente.
- **`src/validators/`**: Uso de **Zod** para validar que los datos lleguen en el formato correcto antes de tocar la base de datos.
- **`src/middlewares/`**: Manejo global de errores, verificación de autenticación (JWT) y roles.

### 2. Frontend (`frontend/`)
Construido como una **SPA (Single Page Application)** moderna bajo un enfoque de **Feature-Driven Design**.

- **`src/features/`**: Módulos aislados por dominio (sales, inventory, clinical). Cada uno tiene sus propios componentes y lógica de API.
- **`src/components/ui/`**: Componentes base de alta calidad (botones, modales, alertas) basados en Radix UI.
- **`src/lib/api.ts`**: Cliente Axios configurado para comunicarse con el Backend.
- **`src/contexts/`**: Gestión de estado global (p. ej. `AuthContext` para mantener la sesión del usuario).

---

## 🔧 Componentes Clave y Lógica de Negocio

### Gestión de Lotes (Batches)
A diferencia de sistemas simples, este software no solo rastrea "stock total", sino que rastrea **lotes específicos**:
1. Un producto puede tener múltiples lotes con diferentes fechas de caducidad.
2. Al vender, el sistema descuenta stock del lote seleccionado, previniendo la venta de productos caducados.

### Lógica de Anulación de Ventas
El sistema permite anular ventas (voiding), lo cual dispara un proceso automático de:
- Cambio de estado de la venta a `voided`.
- Devolución del stock retirado a sus lotes originales.
- Actualización de las métricas del Dashboard en tiempo real.

### Dashboard Inteligente
El panel principal no es solo estático; analiza los datos para mostrar:
- **Ventas semanales**: Gráfico de barras interactivo.
- **Top Categorías**: Gráfico circular con la distribución de ventas.
- **Alertas Críticas**: Identifica productos por debajo del stock mínimo o lotes que vencen en los próximos 30 días.

---

## 📦 Tecnologías Utilizadas

| Categoría | Tecnologías |
|-----------|-------------|
| **Lenguajes** | TypeScript (Backend y Frontend) |
| **Frameworks** | React 19, Express 5 |
| **Base de Datos** | MySQL + Prisma ORM |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Visualización** | Recharts (Gráficas) |
| **Validación** | Zod |
| **Testing** | Vitest |
| **Seguridad** | JWT, bcryptjs, Helmet |

---

## ▶️ Cómo Ejecutar el Proyecto

### Requisitos Previos
- Node.js v18+
- MySQL Server

### Configuración del Backend
```bash
cd backend
npm install
# Configura tu .env (DATABASE_URL, JWT_SECRET)
npx prisma generate
npm run dev
```

### Configuración del Frontend
```bash
cd frontend
npm install
npm run dev
```
*El frontend correrá en `http://localhost:5173` y el backend en `http://localhost:5000`.*

---

*Documento actualizado el 7 de marzo de 2026 para reflejar el paso de MongoDB a MySQL/Prisma y la implementación del Frontend.*
da de citas.
- `patient` — Referencia al paciente
- `doctor` — Referencia al usuario con rol doctor
- `date` — Fecha y hora de la cita
- `status` — `pending`, `completed`, o `cancelled`
- `reason` — Motivo de consulta

---

## ▶️ Cómo Ejecutar el Proyecto

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
# Crear archivo .env con:
#   PORT=5000
#   MONGO_URI=mongodb+srv://...
#   NODE_ENV=development

# 3. Iniciar en modo desarrollo (reinicio automático con nodemon)
npm run dev

# 4. Iniciar en modo producción
npm start
```

---

*Documento generado el 25 de febrero de 2026.*
