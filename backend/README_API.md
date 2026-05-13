# Documentación de la API (Sistema de Gestión Clínica)

Esta documentación describe todos los endpoints disponibles en el backend, incluyendo la autenticación requerida, la estructura de las peticiones (JSON Body) y las respuestas esperadas. Toda la API está sujeta a **Control de Acceso Basado en Roles (RBAC)**.

---

## Módulo de Autenticación (`/api/auth`)

### Login de Usuario
- **Ruta:** `POST /api/auth/login`
- **Roles Requeridos:** Ninguno (Endpoint Público).
- **Propósito:** Validar credenciales y retornar un JWT (`token`) para su uso en rutas protegidas.
- **Estructura del Body (JSON):**
  ```json
  {
      "email": "admin@example.com",
      "password": "mypassword123"
  }
  ```
- **Respuesta Esperada:**
  - `200 OK`: Retorna mensaje de éxito, el JWT y la información del usuario logueado.
  - `401 Unauthorized` / `400 Bad Request`: Error de credenciales o formato de datos (Zod Validation Error).

---

## Módulo de Productos e Inventario (`/api/products`)

### 1. Listar Productos
- **Ruta:** `GET /api/products`
- **Roles Requeridos:** `admin`, `employee`. (Doctores bloqueados: `403 Forbidden`).
- **Propósito:** Retorna un array con todos los productos disponibles en inventario, anidando la información respectiva de `batches` (lotes) como fechas de expiración, cantidad y ubicación.

### 2. Obtener Producto por ID
- **Ruta:** `GET /api/products/:id`
- **Roles Requeridos:** `admin`, `employee`.
- **Propósito:** Retorna el detalle unitario de un producto basado en su `id` suministrado en el parámetro de la URl.

### 3. Crear Producto
- **Ruta:** `POST /api/products`
- **Roles Requeridos:** `admin` (Exclusivo).
- **Propósito:** Da de alta a un nuevo producto generándole un número de SKU automático. Puede recibir lotes iniciales (`batches`) en su carga.
- **Estructura del Body (JSON):**
  ```json
  {
      "name": "Paracetamol 500mg",
      "description": "Caja x 100 tabletas",
      "base_price": 5.50,
      "category": "Analgésicos",
      "batches": [
          {
              "batch_number": "LOTE-123",
              "quantity": 1000,
              "expiry_date": "2027-12-31"
          }
      ]
  }
  ```
- **Respuesta Esperada:**
  - `201 Created`: Objeto del producto y lotes generados.
  - `400 Bad Request`: Error de validación Zod.
  - `403 Forbidden`: Intento de creación por Empleado o Doctor.

### 4. Actualizar Producto
- **Ruta:** `PUT /api/products/:id`
- **Roles Requeridos:** `admin` (Exclusivo).
- **Propósito:** Actualizar detalles de un producto existente.

### 5. Eliminar Producto
- **Ruta:** `DELETE /api/products/:id`
- **Roles Requeridos:** `admin` (Exclusivo).
- **Propósito:** Elimina registro del producto y sus lotes asociados en cascada por ID.

---

## Módulo de Ventas (`/api/sales`)

### 1. Registrar Venta
- **Ruta:** `POST /api/sales`
- **Roles Requeridos:** `admin`, `employee`.
- **Propósito:** Registra una salida transaccional de productos de Farmacia, reduciendo las cantidades del lote correspondiente en inventario en lote.
- **Estructura del Body (JSON):**
  ```json
  {
      "user_id": 1,
      "items": [
          { "batch_id": 10, "quantity": 2 },
          { "batch_id": 15, "quantity": 1 }
      ]
  }
  ```
- **Respuesta Esperada:**
  - `201 Created`: Devuelve la información de la factura de venta generada y el detalle unitario (`sale_items`).
  - `400 Bad Request`: Si no hay inventario suficiente en los lotes solicitados o error Zod (ej., item vacío).

---

## Módulo Clínico (`/api/patients` y `/api/appointments`)

### 1. Gestión de Pacientes
- **Rutas Principales:** `GET /api/patients` | `POST /api/patients` | `PUT /api/patients/:id` | `DELETE /api/patients/:id`
- **Roles Requeridos:** `admin`, `doctor`. (Empleados reciben `403 Forbidden`).
- **Body POST/PUT (JSON):**
  ```json
  {
      "first_name": "Juan",
      "last_name": "Pérez",
      "date_of_birth": "1990-05-15T00:00:00Z",
      "phone": "555-1234",
      "medical_history": "Alergias a penicilina"
  }
  ```

### 2. Gestión de Citas (Appointments)
- **Rutas Principales:** `GET /api/appointments` | `POST /api/appointments`
- **Roles Requeridos:** `admin`, `doctor`.
- **Regla Especial (Double Booking):** El sistema rechazará con HTTP `409 Conflict` si se intenta agendar a un doctor en una hora exacta que ya tiene ocupada.
- **Body POST (JSON):**
  ```json
  {
      "patient_id": 1,
      "doctor_id": 2, // (Opcional si lo envía el mismo doctor autentificado)
      "appointment_date": "2026-03-05T10:00:00Z",
      "status": "SCHEDULED" // Opciones: SCHEDULED, COMPLETED, CANCELLED
  }
  ```

### 3. Generación de Recetas Médicas / PDF
- **Ruta:** `POST /api/prescriptions/generate`
- **Roles Requeridos:** `admin`, `doctor`.
- **Propósito:** Retorna un Buffer Binario (`ContentType: application/pdf`) dibujado en el servidor con los datos de las instrucciones médicas listo para visualizar o descargar en el cliente.
- **Body POST (JSON):**
  ```json
  {
      "doctorName": "Dr. House",
      "patientName": "Juan Pérez",
      "diagnosis": "Infección viral",
      "medications": [
          { "name": "Paracetamol 500mg", "dosage": "1 tableta/8h", "instructions": "Con comidas" }
      ]
  }
  ```

---

## Módulo Analítico (`/api/dashboard`)

### Dashboard de Estadísticas Generales
- **Ruta:** `GET /api/dashboard/summary`
- **Roles Requeridos:** `admin`, `doctor`.
- **Propósito:** Retorna métricas generales agrupadas computando la suma de ventas de Hoy, el número de citas diarias (SCHEDULED), el top 5 de lotes críticos (menos de 15 existencias netas de producto) y los lotes más cercanos a caducar.
- **Respuesta Esperada:**
  ```json
  {
      "todaysSales": 1250.50,
      "todaysAppointments": 8,
      "criticalStock": [
          {
              "productId": 3,
              "productName": "Aspirina 100mg",
              "totalQuantity": 10
          }
      ],
      "expiringBatches": [
          {
              "id": 12,
              "batchNumber": "LOTE-999",
              "quantity": 50,
              "expiryDate": "2026-04-01T00:00:00Z",
              "productName": "Ibuprofeno 400mg"
          }
      ]
  }
  ```
