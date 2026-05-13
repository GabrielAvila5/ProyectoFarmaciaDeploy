/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de User.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import type { CreateUserInput } from '../validators/user.validator';

class UserService {
    /**
     * Lista todos los usuarios con su rol
     */
    async getAllUsers() {
        return prisma.users.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                role_id: true,
                roles: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Lista únicamente a los doctores activos de forma segura
     */
    async getAllDoctors() {
        return prisma.users.findMany({
            where: {
                is_active: true,
                roles: { name: 'doctor' }
            },
            select: {
                id: true,
                name: true,
                specialty: true,
                consulting_room: true
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Crea un nuevo usuario con contraseña hasheada
     */
    async createUser(data: CreateUserInput) {
        // Buscar el role_id por nombre
        const role = await prisma.roles.findUnique({
            where: { name: data.role },
        });

        if (!role) {
            throw new Error(`Rol "${data.role}" no encontrado en la base de datos.`);
        }

        // Verificar email duplicado
        const existing = await prisma.users.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            throw new Error('Ya existe un usuario con ese email.');
        }

        // Hash del password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.users.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role_id: role.id,
                specialty: data.specialty,
                phone: data.phone,
                alma_mater: data.alma_mater,
                consultation_fee: data.consultation_fee,
                consulting_room: data.consulting_room,
            },
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                roles: { select: { id: true, name: true } },
            },
        });

        return user;
    }

    /**
     * Activa/desactiva un usuario. Protección anti-autodesactivación.
     */
    async toggleActive(targetUserId: number, requestingUserId: number) {
        // Protección: no puedes desactivarte a ti mismo
        if (targetUserId === requestingUserId) {
            throw new Error('No puedes desactivar tu propia cuenta.');
        }

        const user = await prisma.users.findUnique({
            where: { id: targetUserId },
        });

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        const updated = await prisma.users.update({
            where: { id: targetUserId },
            data: { is_active: !user.is_active },
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                roles: { select: { id: true, name: true } },
            },
        });

        return updated;
    }

    /**
     * Elimina permanentemente un usuario si no tiene registros históricos asociados.
     */
    async deleteUser(targetUserId: number, requestingUserId: number) {
        if (targetUserId === requestingUserId) {
            throw new Error('No puedes eliminar tu propia cuenta.');
        }

        const user = await prisma.users.findUnique({
            where: { id: targetUserId },
        });

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        try {
            await prisma.users.delete({
                where: { id: targetUserId },
            });
            return { message: 'Usuario eliminado exitosamente' };
        } catch (error: any) {
            if (error.code === 'P2003') {
                throw new Error('No se puede eliminar este usuario porque tiene registros históricos (ventas, citas, consultas). Por favor, usa la opción de desactivar en su lugar.');
            }
            throw error;
        }
    }
}

export default new UserService();
