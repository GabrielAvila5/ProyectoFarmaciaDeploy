const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend', 'src');
const frontendDir = path.join(__dirname, 'frontend', 'src');

function getCommentForFile(filePath, isBackend) {
    const fileName = path.basename(filePath);
    const relativePath = isBackend ? path.relative(backendDir, filePath) : path.relative(frontendDir, filePath);
    const dirName = path.dirname(relativePath);

    let desc = '';

    if (isBackend) {
        if (fileName === 'app.ts') desc = 'Configuración principal de la aplicación Express, middlewares globales y montaje de rutas.';
        else if (fileName === 'server.ts') desc = 'Punto de entrada principal del backend. Inicia el servidor HTTP y escucha conexiones.';
        else if (dirName === 'config' && fileName === 'prisma.ts') desc = 'Instancia global del cliente Prisma ORM para interactuar con la base de datos.';
        else if (dirName === 'controllers') desc = `Controlador para manejar las peticiones HTTP (req, res) relacionadas con ${fileName.replace('Controller.ts', '')}.`;
        else if (dirName === 'services') desc = `Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de ${fileName.replace('Service.ts', '')}.`;
        else if (dirName === 'routes') desc = `Define los endpoints (rutas) de la API para ${fileName.replace('Routes.ts', '')} y enlaza sus respectivos controladores.`;
        else if (dirName === 'middlewares') {
            if (fileName.includes('auth')) desc = 'Middleware para verificar la autenticación del usuario mediante tokens JWT.';
            else if (fileName.includes('role')) desc = 'Middleware para autorizar el acceso a rutas basado en los roles del usuario.';
            else if (fileName.includes('error')) desc = 'Middleware global para la captura, formateo y manejo de errores de la API.';
            else if (fileName.includes('validateBody')) desc = 'Middleware para validar el cuerpo de las peticiones (body) usando esquemas Zod o similares.';
            else desc = `Middleware de Express para procesar peticiones HTTP: ${fileName}.`;
        }
        else if (dirName === 'validators') desc = `Esquemas de validación de datos para asegurar un formato correcto de entrada en la entidad de ${fileName.replace('.validator.ts', '').replace('Validator.ts', '')}.`;
        else if (dirName === 'types') desc = `Definiciones de tipos, interfaces y estructuras compartidas de TypeScript para el backend.`;
        else desc = `Archivo fuente del backend: ${fileName}.`;
    } else {
        if (fileName === 'main.tsx') desc = 'Punto de entrada de React. Renderiza la aplicación en el DOM e inicializa el entorno global.';
        else if (fileName === 'App.tsx') desc = 'Componente raíz de React que configura el enrutamiento (React Router) principal de la aplicación.';
        else if (dirName.startsWith(`components${path.sep}layout`)) desc = `Componente de diseño/estructura (Layout) reutilizable en la interfaz web (ej. Sidebar, Navbar).`;
        else if (dirName.startsWith(`components${path.sep}ui`)) desc = `Componente genérico de interfaz de usuario (UI), usado a lo largo de la aplicación.`;
        else if (dirName.startsWith('pages')) desc = `Componente de vista principal (Página) que agrupa características y se mapea a una ruta específica.`;
        else if (dirName.startsWith('features')) {
            const feature = dirName.split(path.sep)[1] || 'general';
            if (fileName.includes('Api.ts')) desc = `Llamadas asíncronas a la API del backend relacionadas específicamente con el módulo de ${feature}.`;
            else if (fileName.includes('use')) desc = `Custom hook de React para encapsular lógica de estado y efectos de la característica de ${feature}.`;
            else desc = `Componente de interfaz o lógica específica empacada bajo la característica funcional de ${feature}.`;
        }
        else if (dirName === 'lib' && fileName === 'api.ts') desc = 'Configuración global del cliente HTTP Axios para las comunicaciones con el backend.';
        else if (dirName === 'lib' && fileName === 'utils.ts') desc = 'Funciones utilitarias (helpers) de uso general para el frontend.';
        else if (dirName === 'contexts') desc = 'Proveedor de contexto de React (Context API) para manejar estados globales (ej. Autenticación).';
        else desc = `Archivo fuente del frontend: ${fileName}.`;
    }

    return `/**\n * @fileoverview ${desc}\n * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.\n */\n`;
}

let modifiedCount = 0;

function processDirectory(dirPath, isBackend) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath, isBackend);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            if (fullPath.endsWith('.d.ts') || fullPath.endsWith('vite-env.d.ts')) continue;
            
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.startsWith('/**\n * @fileoverview')) {
                const comment = getCommentForFile(fullPath, isBackend);
                fs.writeFileSync(fullPath, comment + content, 'utf8');
                modifiedCount++;
            }
        }
    }
}

console.log('Iniciando procesamiento de archivos...');
processDirectory(backendDir, true);
processDirectory(frontendDir, false);
console.log(`¡Proceso completado! Se agregaron comentarios a ${modifiedCount} archivos.`);
