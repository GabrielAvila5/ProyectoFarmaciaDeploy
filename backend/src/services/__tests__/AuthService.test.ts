/**
 * @fileoverview Pruebas unitarias para AuthService.
 * Valida la autenticación, bloqueo de usuarios inactivos y la firma de JWT.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../AuthService';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mocks
vi.mock('../../config/prisma', () => ({
    default: {
        users: {
            findUnique: vi.fn(),
        }
    }
}));

vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn(),
    }
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(),
    }
}));

describe('AuthService - login()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('Debería retornar un token y datos del usuario si las credenciales son válidas', async () => {
        const mockUser = {
            id: 1,
            name: 'Juan',
            email: 'juan@test.com',
            password: 'hashedpassword',
            is_active: true,
            roles: { name: 'admin' }
        };

        // Simular que el usuario existe en BD
        (prisma.users.findUnique as any).mockResolvedValue(mockUser);
        // Simular que la contraseña es correcta
        (bcrypt.compare as any).mockResolvedValue(true);
        // Simular la firma del JWT
        (jwt.sign as any).mockReturnValue('fake-jwt-token');

        const result = await AuthService.login('juan@test.com', 'password123');

        expect(prisma.users.findUnique).toHaveBeenCalledWith({
            where: { email: 'juan@test.com' },
            include: { roles: true }
        });
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
        expect(jwt.sign).toHaveBeenCalled();
        
        expect(result).toEqual({
            token: 'fake-jwt-token',
            user: { id: 1, name: 'Juan', email: 'juan@test.com', role: 'admin' }
        });
    });

    it('Debería arrojar error si el usuario no existe', async () => {
        (prisma.users.findUnique as any).mockResolvedValue(null);

        await expect(AuthService.login('notfound@test.com', 'pass')).rejects.toThrow('Credenciales inválidas');
    });

    it('Debería arrojar error si la contraseña es incorrecta', async () => {
        const mockUser = { id: 1, password: 'hash', is_active: true };
        (prisma.users.findUnique as any).mockResolvedValue(mockUser);
        (bcrypt.compare as any).mockResolvedValue(false);

        await expect(AuthService.login('juan@test.com', 'wrongpass')).rejects.toThrow('Credenciales inválidas');
    });

    it('Debería arrojar error si el usuario está inactivo (is_active = false)', async () => {
        const mockUser = { id: 1, password: 'hash', is_active: false };
        (prisma.users.findUnique as any).mockResolvedValue(mockUser);
        (bcrypt.compare as any).mockResolvedValue(true);

        await expect(AuthService.login('juan@test.com', 'password123')).rejects.toThrow('Tu cuenta ha sido desactivada. Contacta al administrador.');
    });
});
