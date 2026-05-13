/**
 * @fileoverview Middleware para autorizar el acceso a rutas basado en los roles del usuario.
 * 
 * Roles válidos del sistema:
 *   - admin:    Acceso total. Gestión de usuarios, productos, ventas, anulaciones, reportes, cortes de caja.
 *   - employee: Cajero / empleado. Puede crear ventas, ver productos, reabastecer stock. NO puede anular ventas, gestionar usuarios ni ver reportes financieros.
 *   - doctor:   Personal clínico. Puede gestionar pacientes, consultas, citas y recetas. Puede ver productos (para recetar) pero NO puede vender ni modificar inventario.
 */
import { Request, Response, NextFunction } from 'express';

// Tipo estricto de roles válidos
export type SystemRole = 'admin' | 'employee' | 'doctor';

/**
 * Middleware para restringir rutas basado en roles.
 * @param allowedRoles Array de roles permitidos (ej. ['admin', 'doctor'])
 */
export const checkRole = (allowedRoles: SystemRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !user.role) {
            res.status(403);
            return next(new Error('Acceso denegado: no se encontró el rol del usuario.'));
        }

        // Normalizar el rol a minúsculas para evitar problemas de case sensitivity
        const userRole = user.role.toLowerCase();

        if (!allowedRoles.includes(userRole as SystemRole)) {
            console.warn(
                `[SECURITY_ALERT] Usuario ID:${user.id} | Rol: ${user.role} | ` +
                `Intentó acceder a: ${req.method} ${req.originalUrl || req.path} | ` +
                `Roles permitidos: [${allowedRoles.join(', ')}] | ` +
                `IP: ${req.ip} | Timestamp: ${new Date().toISOString()}`
            );

            res.status(403);
            return next(new Error('Acceso denegado: no tienes los permisos necesarios para esta acción.'));
        }

        next();
    };
};
