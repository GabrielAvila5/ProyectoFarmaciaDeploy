import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando el seeding de la base de datos...');

    // 1. Crear los Roles
    const roles = [
        { name: 'admin' },
        { name: 'doctor' },
        { name: 'employee' }
    ];

    for (const roleData of roles) {
        await prisma.roles.upsert({
            where: { name: roleData.name },
            update: {},
            create: roleData
        });
    }
    console.log('Roles verificados/creados exitosamente.');

    // 2. Crear el Usuario Admin por defecto
    const adminRole = await prisma.roles.findUnique({
        where: { name: 'admin' }
    });

    if (adminRole) {
        const saltRounds = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10;
        const hashedPassword = await bcrypt.hash('admin123', saltRounds);

        await prisma.users.upsert({
            where: { email: 'admin@example.com' },
            update: {
                // Actualizamos la contraseña por si cambió el salt o se requiere reinicio
                password: hashedPassword,
                role_id: adminRole.id
            },
            create: {
                name: 'Administrador Principal',
                email: 'admin@example.com',
                password: hashedPassword,
                role_id: adminRole.id
            }
        });
        console.log('Usuario admin creado/verificado exitosamente (admin@example.com / admin123).');
    }

    console.log('Seeding completado con éxito.');
}

main()
    .catch((e) => {
        console.error('Error durante el seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
