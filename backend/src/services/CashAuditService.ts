import prisma from '../config/prisma';

export interface CreateCashAuditInput {
    user_id: number;
    expected_amount: number;
    counted_amount: number;
    notes?: string;
}

class CashAuditService {
    /**
     * Registra un nuevo corte de caja
     */
    async createAudit(data: CreateCashAuditInput) {
        const difference = data.counted_amount - data.expected_amount;
        
        return prisma.cash_audits.create({
            data: {
                user_id: data.user_id,
                expected_amount: data.expected_amount,
                counted_amount: data.counted_amount,
                difference: difference,
                notes: data.notes
            },
            include: {
                users: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }

    /**
     * Obtiene todos los cortes de caja del sistema
     */
    async getAllAudits() {
        return prisma.cash_audits.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }

    /**
     * Obtiene todos los cortes de caja de un usuario específico
     */
    async getAuditsByUser(userId: number) {
        return prisma.cash_audits.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }

    /**
     * Calcula el monto esperado en caja (Efectivo) para un usuario (cajero)
     * basándose en las ventas cobradas en efectivo que no han sido anuladas
     * desde el inicio del día o desde el último corte.
     */
    async getExpectedAmountForToday(userId: number) {
        // En un sistema real, buscaríamos la fecha del último corte de caja
        // Por simplificación, sumaremos las ventas en efectivo del día actual para este usuario
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        const sales = await prisma.sales.findMany({
            where: {
                user_id: userId,
                payment_method: 'cash',
                status: 'completed',
                sale_date: {
                    gte: todayAtMidnight
                }
            }
        });

        const expectedCashAmount = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

        return expectedCashAmount;
    }
}

export default new CashAuditService();
