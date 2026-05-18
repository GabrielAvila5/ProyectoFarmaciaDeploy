# Guía de Despliegue en Hostinger (Plan Business)

Dado que tu proyecto tiene tanto Frontend (React) como Backend (Node.js) en el mismo repositorio (Monorepo), el despliegue en un hosting compartido como Hostinger requiere algunos pasos específicos para que ambas partes funcionen correctamente y de forma segura.

## ⚠️ IMPORTANTE ANTES DE EMPEZAR: Sobre el archivo `.env`
**NO debes hacer commit** de tu archivo `.env` real a GitHub con las contraseñas de la base de datos de Hostinger. Si ya lo hiciste, asegúrate de revertirlo. Las variables de entorno de producción se configuran directamente en el servidor de Hostinger, no se suben al repositorio.

---

## PASO 1: Configurar el Repositorio en Hostinger (Git)

Ya que elegiste la opción de Git en Hostinger:
1. Ve al panel de Hostinger (hPanel) > **Avanzado** > **GIT**.
2. En la configuración, asegúrate de que el repositorio se clone en una carpeta **fuera** de tu `public_html` principal para mayor seguridad (por ejemplo, puedes crear una carpeta llamada `proyecto_farmacia` al mismo nivel que `public_html`).
3. Haz clic en **Desplegar** (Deploy) para que Hostinger descargue tu código.

*Nota:* Cada vez que hagas un `git push` a tu rama principal en GitHub, puedes configurar un Webhook en Hostinger para que se actualice automáticamente (Hostinger te da la URL del webhook en esa misma pantalla de GIT).

---

## PASO 2: Desplegar el Backend (Node.js)

Hostinger Business permite correr aplicaciones Node.js.
1. En hPanel, busca la sección **Avanzado** > **Aplicación Node.js**.
2. **Crea una nueva aplicación**:
   - **Directorio de la aplicación:** Selecciona la ruta donde se descargó tu repo y apunta a la carpeta `backend` (ej. `proyecto_farmacia/backend`).
   - **Archivo de inicio:** `dist/server.js` (si no te deja porque aún no está compilado, pon `src/server.js` por ahora, aunque lo ideal es compilarlo).
   - **URL de la aplicación:** Lo ideal es usar un subdominio para tu API (ej. `api.tudominiotemporal.com`). Si no has creado el subdominio, ve a *Dominios > Subdominios* y créalo primero.
3. **Variables de Entorno (Environment variables):**
   Añade las variables que tenías en tu `.env`, especialmente:
   - `DATABASE_URL` = `mysql://u493510526_gabriel_avila:MaGa150426@localhost:3306/u493510526_farmacia_db`
   - `JWT_SECRET` = `tu_secreto_seguro`
   - `CORS_ORIGIN` = `https://tudominiotemporal.com` (La URL donde vivirá tu frontend).
4. **Instalar dependencias y Compilar**:
   - Una vez creada la app Node.js, Hostinger te da un comando para entrar por SSH o terminal. Alternativamente, puedes usar el **Terminal** web de Hostinger.
   - Abre el Terminal en Hostinger, navega a tu backend (`cd proyecto_farmacia/backend`).
   - Ejecuta: `npm install`
   - Ejecuta: `npx prisma generate`
   - Ejecuta: `npx prisma db push` (Para crear las tablas en tu base de datos de Hostinger).
   - Ejecuta: `npm run build` (Para compilar TypeScript a JavaScript en la carpeta `dist`).
5. Vuelve al panel de la aplicación Node.js, asegúrate que el archivo de inicio sea `dist/server.js` y dale a **Reiniciar (Restart)**.

---

## PASO 3: Desplegar el Frontend (React/Vite)

El frontend de React no necesita un servidor Node.js corriendo, solo necesita compilarse (build) y colocar los archivos estáticos en tu carpeta pública.

1. Abre el **Terminal** de Hostinger.
2. Navega a la carpeta de tu frontend: `cd proyecto_farmacia/frontend`
3. Antes de compilar, necesitas que el frontend sepa a qué URL hacer las peticiones (tu nuevo backend). Si usabas un `.env` en el frontend con `VITE_API_URL`, puedes crearlo ahí:
   ```bash
   echo "VITE_API_URL=https://api.tudominiotemporal.com" > .env
   ```
4. Instala las dependencias: `npm install`
5. Compila el proyecto: `npm run build`
6. Esto generará una carpeta `dist` dentro de `frontend`. Estos son los archivos finales de tu web.
7. Mueve el contenido de la carpeta `dist` a la carpeta `public_html` de tu dominio principal. Puedes hacerlo con este comando:
   ```bash
   cp -r dist/* ../../public_html/
   ```
   *(Asegúrate de que la ruta de destino corresponda a tu `public_html` real).*

---

## Resumen sobre los Commits:
- **Sí**, debes hacer commit de cualquier cambio en el código (como ajustes en el Frontend para leer la variable de entorno, si cambiaste algo en `vite.config.ts`, etc).
- **NO**, no debes hacer commit del archivo `.env` del backend con tus credenciales.

**¡Sigue estos pasos y tu aplicación estará online!** Si te trabas en la terminal de Hostinger o en la configuración de la App Node.js, dímelo y lo revisamos.
