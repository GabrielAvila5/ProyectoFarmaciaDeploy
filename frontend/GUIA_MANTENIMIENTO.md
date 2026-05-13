# Guía de Mantenimiento y Troubleshooting (FarmaGestión)

Esta guía detalla el flujo de datos principal del sistema y ofrece soluciones estandarizadas para los problemas más comunes a nivel base de datos usando Prisma ORM.

---

## 🏗️ Flujo de Datos Principal (Backend)

Comprender el ciclo de vida de una petición (Request) es vital para saber en qué archivo investigar un error. El flujo sigue el patrón MVC estricto:

### 1. Router (`src/routes/`)
- **Propósito:** Interceptar la petición del cliente (`GET`, `POST`, `PUT`, `DELETE`) en un endpoint específico (ej. `/api/sales`).
- **Qué hace:** Aplica middlewares (como verificación de tokens o roles) y redirige la petición a la función correspondiente del Controlador.
- **Ejemplo de fallo aquí:** `404 Not Found` (ruta mal escrita) o `401 Unauthorized` (falta de token).

### 2. Controlador (`src/controllers/`)
- **Propósito:** Manejar el objeto HTTP (`req` y `res`).
- **Qué hace:** Extrae los parámetros, headers, o el *body* de la petición. Realiza validaciones sencillas de entrada (como verificar que un ID sea un número válido). Comunica los datos limpios al Servicio.
- **Ejemplo de fallo aquí:** `400 Bad Request` si los datos del cliente son defectuosos o `res.status()` no se ejecutó.

### 3. Servicio (`src/services/`)
- **Propósito:** Alojar la *lógica de negocio* pura. No debe saber absolutamente nada de objetos HTTP (`req`/`res`).
- **Qué hace:** Ejecuta cálculos (ej. algoritmos FEFO para lotes), interactúa con múltiples tablas de forma coordinada, e implementa reglas estrictas del sistema farmacéutico.
- **Ejemplo de fallo aquí:** Error lógico (cobrar en efectivo menos del valor necesario) o fallos lanzados explícitamente (`throw new Error(...)`).

### 4. Prisma ORM (`src/config/prisma.ts`)
- **Propósito:** Persistencia de datos en PostgreSQL/MySQL.
- **Qué hace:** Traduce el objeto o función de TS a una query SQL validada estáticamente. Es el corazón de las consultas de lectura y escritura.

---

## 🛠️ Troubleshooting y Códigos de Error Comunes (Prisma)

A continuación se listan los códigos de error más comunes de Prisma, por qué suceden y cómo solucionarlos.

### 🔴 Prisma Error Códigos
- **`P2002` - Unique Constraint Failed:**
    - **Causa:** Intentaste insertar o actualizar un registro que choca con un valor único existente en la base de datos. Ejemplo: Intentar registrar a un usuario o paciente con un email que ya existe.
    - **Solución:** Valida desde el controlador o el frontend que el valor no exista en la BD antes de intentar crearlo, o atrapa específicamente este código en el manejador de errores e informa al usuario: "El correo ya está en uso".
- **`P2003` - Foreign Key Constraint Failed:**
    - **Causa:** Estás relacionando un dato que depende de un ID de otra tabla que **no existe**. Ejemplo: Añadir un elemento al carrito (`sale_item`) referenciando un ID de Lote o de Producto borrado o incorrecto.
    - **Solución:** Verifica que el registro padre exista. (¿El ID proporcionado es correcto?).
- **`P2025` - Record to update/delete not found:**
    - **Causa:** Intentaste realizar un `prisma.entidad.update` o `delete` sobre un registro que ya no existe (o cuyo ID está erróneo).
    - **Solución:** Utiliza `findUnique` antes del `update` para cerciorarte amistosamente de su existencia o captura la excepción y retorna un amigable 404 al cliente.

### 🟣 Fallos Generales
- **Error en Transacciones (`prisma.$transaction`)**:
  Si un error ocurre dentro de una transacción en el `Service`, TODAS las modificaciones que allí ocurrieron se revertirán automáticamente. Fíjate en el punto exacto donde falló el log de Winston (`logs/error.log`) para aislar el problema.
- **CORS Errors**:
  Asegúrate en `src/app.ts` de o `server.ts` que los dominios esperados del frontend estén listados en las configuraciones aceptables por tu backend.

---
> **Recuerda:** Ante fallos en producción, revisa invariablemente el archivo registrado por Winston en `backend/logs/error.log` para conseguir el Stack Trace del error completo.
