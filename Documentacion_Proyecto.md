# Documentación del Proyecto: Sistema de Gestión Farmacéutica (FarmaGestión)

## 📌 Resumen Ejecutivo
FarmaGestión es un sistema web integral diseñado para la gestión clínica y administrativa de una farmacia. Permite controlar el inventario de productos, procesar ventas, administrar usuarios y roles, y visualizar métricas clave a través de un panel de control interactivo.

El proyecto está dividido en dos partes principales:
1. **Backend**: API RESTful construida con Node.js, Express y Prisma ORM.
2. **Frontend**: Aplicación de una sola página (SPA) construida con React, Vite, TypeScript, Tailwind CSS y shadcn/ui.

---

## 🏗️ Arquitectura del Sistema

### 1. Backend (Directorio `backend/`)
El backend sigue una arquitectura en capas para separar las responsabilidades y mantener el código organizado y escalable.

- **`src/app.ts` / `src/server.ts`**: Punto de entrada de la aplicación. Configuran Express, middlewares globales (CORS, manejo de errores) y montan las rutas.
- **`src/routes/`**: Definen los endpoints de la API y mapean cada ruta a su controlador correspondiente (ej. `saleRoutes.ts`, `productRoutes.ts`).
- **`src/controllers/`**: Manejan la lógica de las peticiones HTTP. Reciben la petición, llaman al servicio adecuado y envían la respuesta o el error al cliente.
- **`src/services/`**: Contienen la lógica de negocio principal y las consultas a la base de datos a través de Prisma. Aquí es donde ocurre la magia (ej. `SaleService.ts` maneja la creación y anulación de ventas, ajustando el stock).
- **`src/middlewares/`**: Funciones intermedias para validar tokens de autenticación (`authMiddleware.ts`), verificar roles de usuario (`roleMiddleware.ts`), validar el cuerpo de las peticiones (`validateBody.ts`) y manejar errores de forma centralizada.
- **`src/validators/`**: Esquemas de validación (generalmente usando Zod o Joi) para asegurar que los datos enviados por el cliente sean correctos antes de procesarlos.
- **`src/config/prisma.ts`**: Instancia global del cliente de Prisma para interactuar con la base de datos de manera tipada.

### 2. Frontend (Directorio `frontend/`)
El frontend está estructurado siguiendo un enfoque basado en características (Feature-Driven) para una mejor escalabilidad.

- **`src/main.tsx` / `src/App.tsx`**: Configuran la aplicación React, el enrutador (React Router) y los proveedores de contexto globales.
- **`src/features/`**: Contiene módulos agrupados por dominio de negocio (ej. `sales`, `inventory`, `users`). Cada carpeta de *feature* incluye sus propios componentes, llamadas a la API y hooks (ej. `SalesHistoryPage.tsx`, `productApi.ts`).
- **`src/pages/`**: Componentes a nivel de página que agrupan varias *features* o representan vistas principales (ej. `DashboardPage.tsx`, `LoginPage.tsx`).
- **`src/components/layout/` & `src/components/ui/`**: Componentes compartidos y reutilizables. `layout` contiene la barra lateral y encabezado, mientras que `ui` contiene componentes base (modales, alertas, etc.).
- **`src/contexts/`**: Estado global de la aplicación (ej. `AuthContext.tsx` para mantener la sesión del usuario en toda la app).
- **`src/lib/`**: Utilidades genéricas y configuración del cliente HTTP (Axios) para comunicarse con el backend (`api.ts`).

---

## 🚀 Funcionalidades Principales

1. **Gestión de Ventas y Tickets**: Permite procesar ventas, calcular el total, manejar pagos en efectivo/tarjeta e imprimir un ticket de compra. También incluye un panel de historial para ver y anular ventas pasadas (con reversión automática de inventario).
2. **Control de Inventario**: Administración de productos médicos y sus lotes específicos (fechas de caducidad, stock).
3. **Panel de Control (Dashboard)**: Visualización en tiempo real de métricas, como total de ventas, gráficas por categoría, y alertas de stock crítico o lotes próximos a vencer.
4. **Gestión de Usuarios y Roles**: Sistema de autenticación JWT. Diferenciación entre roles (ej. Administrador vs. Vendedor) para proteger endpoints y vistas (el Administrador puede ver el historial completo y anular ventas; el vendedor solo registra ventas).

---

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT (JSON Web Tokens).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React (Íconos), Sonner (Notificaciones).

---
*Este documento proporciona una visión general de la estructura y propósito del sistema.*
