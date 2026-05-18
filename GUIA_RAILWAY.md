# Guía de Despliegue en Railway 🚂

El proyecto ha sido configurado para que sea sumamente fácil de desplegar en Railway como dos servicios separados (Backend y Frontend) junto a la base de datos MariaDB.

Sigue estos pasos desde el [Dashboard de Railway](https://railway.app/dashboard):

## Paso 1: Crear el Entorno y Base de Datos
1. En Railway, haz clic en **New Project** y selecciona **Empty Project**.
2. Una vez dentro de tu proyecto vacío, presiona `Ctrl/Cmd + K` o haz clic en **New**, y selecciona **Database** -> **Add MariaDB** (o MySQL).
3. Espera a que la base de datos se despliegue.

## Paso 2: Desplegar el Backend
1. En el mismo proyecto, haz clic en **New** -> **GitHub Repo** y selecciona este repositorio.
2. Railway intentará desplegar todo el repo. Cancela el build inicial si empieza automáticamente.
3. Haz clic en el servicio recién creado, ve a **Settings** -> **Service** y asegúrate de configurar el **Root Directory** a `/backend`.
4. Ve a la pestaña **Variables** del backend y añade las siguientes variables:
   - Haz clic en **Reference Variable** y selecciona tu base de datos MariaDB para que se enlace automáticamente la variable `DATABASE_URL`. (Si no, añade `DATABASE_URL` manualmente copiando la Connection URL de tu MariaDB).
   - `JWT_SECRET`: (escribe un texto largo y seguro o genera uno aleatorio).
   - `JWT_EXPIRES_IN`: `7d`
   - `BCRYPT_SALT_ROUNDS`: `10`
   - `PORT`: `5000` (opcional, Railway lo suele inyectar automáticamente).
   - `NODE_ENV`: `production`
5. Ve a **Settings** -> **Networking** y haz clic en **Generate Domain** para que el backend tenga una URL pública. **Copia esta URL**, la necesitarás para el frontend.

## Paso 3: Desplegar el Frontend
1. Haz clic de nuevo en **New** -> **GitHub Repo** y vuelve a seleccionar este mismo repositorio (así creamos el segundo servicio).
2. Haz clic en el nuevo servicio, ve a **Settings** -> **Service** y asegúrate de configurar el **Root Directory** a `/frontend`.
3. Ve a la pestaña **Variables** del frontend y añade la siguiente variable:
   - `VITE_API_URL`: Aquí pegarás la URL pública que generaste para tu backend en el Paso 2 (asegúrate de agregar `/api` al final, ejemplo: `https://tu-backend-url.railway.app/api`).
4. Ve a **Settings** -> **Networking** y haz clic en **Generate Domain** para crear la URL pública de tu aplicación web (Frontend).

## Paso 4: Variables Finales
Ahora que tienes el dominio de tu frontend:
1. Regresa a las **Variables** de tu servicio **Backend**.
2. Añade o actualiza la variable `CORS_ORIGIN` con la URL de tu frontend (ejemplo: `https://tu-frontend-url.railway.app`). Esto asegurará la comunicación correcta entre ambos.

## Resumen de los Cambios Aplicados al Código
Para lograr esto, realicé los siguientes ajustes automáticos en tu código:
- **Backend**: Se añadió `"postinstall": "prisma generate"` en el `package.json` para que Prisma se prepare automáticamente al construir el proyecto en Railway.
- **Frontend**: Se modificó el archivo `api.ts` para que use dinámicamente `import.meta.env.VITE_API_URL` en producción (si no, usa `localhost` para desarrollo).
- **Frontend**: Se instaló la dependencia `serve` y se añadió el script `"start": "serve -s dist -l tcp://0.0.0.0:$PORT"` para asegurar que la aplicación estática compilada con Vite se exponga correctamente en Railway.

¡Una vez finalizado, sube tus cambios a GitHub y Railway se encargará del resto! 🚀
