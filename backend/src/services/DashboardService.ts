/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de Dashboard.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import prisma from '../config/prisma';
import { IDashboardSummary, IDashboardCriticalStock, IDashboardExpiringBatch } from '../types/dashboard.types';

class DashboardService {
    async getSummary(): Promise<IDashboardSummary> {
        // Manejo estricto de UTC para "Hoy"
        const now = new Date();
        const startOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        const thirtyDaysFromNowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30, 23, 59, 59, 999));

        // Promise.all para concurrencia máxima y rapidez
        const [salesAgg, appointmentsCount, rawCriticalStock, expiringBatches] = await Promise.all([
            // 1. Suma de ingresos, COGS y taxes por ventas HOY (solo completadas)
            prisma.sales.findMany({
                where: {
                    status: 'completed',
                    sale_date: {
                        gte: startOfDayUTC,
                        lte: endOfDayUTC
                    }
                },
                include: {
                    sale_items: {
                        include: {
                            batches: true
                        }
                    }
                }
            }),

            // 2. Conteo de citas "SCHEDULED" HOY
            prisma.appointments.count({
                where: {
                    status: 'SCHEDULED',
                    appointment_date: {
                        gte: startOfDayUTC,
                        lte: endOfDayUTC
                    }
                }
            }),

            // 3. Stock Crítico usando Prisma groupBy
            // Agrupa todos los lotes por producto, suma su stock, y filtra si el total aglomerado es menor a 15
            prisma.batches.groupBy({
                by: ['product_id'],
                _sum: {
                    quantity: true
                },
                having: {
                    quantity: {
                        _sum: {
                            lt: 15
                        }
                    }
                }
            }),

            // 4. Lotes Próximos a Caducar (Top 5 con fecha futura y menor a 30 días)
            prisma.batches.findMany({
                where: {
                    expiry_date: { 
                        gte: startOfDayUTC,
                        lte: thirtyDaysFromNowUTC
                    },
                    quantity: { gt: 0 } // Solo considerar lotes que no estén vacíos
                },
                orderBy: { expiry_date: 'asc' },
                take: 5,
                include: {
                    products: { select: { name: true } }
                }
            })
        ]);

        // Mapeo Adicional para Stock Crítico (Traer los nombres de los productos)
        const criticalStockArray: IDashboardCriticalStock[] = [];
        if (rawCriticalStock.length > 0) {
            // Obtenemos un array de los IDs de producto críticos
            // Prisma infiere product_id como number | null, limpiamos los nulls (aunque relacionalmente no debería haber)
            const productIds = rawCriticalStock
                .map((item: any) => item.product_id)
                .filter((id: any): id is number => id !== null);

            // Buscamos los nombres
            const productsInfo = await prisma.products.findMany({
                where: { id: { in: productIds } },
                select: { id: true, name: true }
            });

            const productMap = new Map(productsInfo.map(p => [p.id, p.name]));

            for (const item of rawCriticalStock) {
                if (item.product_id) {
                    criticalStockArray.push({
                        productId: item.product_id,
                        productName: productMap.get(item.product_id) || 'Producto Desconocido',
                        totalQuantity: Number(item._sum.quantity) || 0
                    });
                }
            }
        }

        let todaysSales = 0;
        let todaysTaxes = 0;
        let todaysCogs = 0;

        for (const sale of salesAgg) {
            todaysSales += Number(sale.total_amount) || 0;
            todaysTaxes += Number(sale.total_tax) || 0;
            
            for (const item of sale.sale_items) {
                if (item.batches && item.batches.unit_cost) {
                    todaysCogs += Number(item.batches.unit_cost) * item.quantity;
                }
            }
        }

        const todaysNetUtility = todaysSales - todaysTaxes - todaysCogs;

        return {
            todaysSales,
            todaysNetUtility,
            todaysTaxes,
            todaysAppointments: appointmentsCount,
            criticalStock: criticalStockArray,
            expiringBatches: expiringBatches.map((batch: any) => ({
                id: batch.id,
                batchNumber: batch.batch_number,
                quantity: batch.quantity,
                expiryDate: batch.expiry_date.toISOString(),
                productName: batch.products?.name || 'Producto Desconocido',
            }))
        };
    }

    // Datos para las gráficas del dashboard
    async getChartData() {
        const now = new Date();
        // Últimos 7 días
        const sevenDaysAgo = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0
        ));

        // Traer todas las ventas COMPLETADAS de los últimos 7 días con sus items y productos
        const recentSales = await prisma.sales.findMany({
            where: {
                status: 'completed',
                sale_date: { gte: sevenDaysAgo },
            },
            include: {
                sale_items: {
                    include: {
                        batches: {
                            include: {
                                products: {
                                    select: { category: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        // --- Ventas por día (últimos 7 días) ---
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dailySales: { day: string; total: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.UTC(
                now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i
            ));
            const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
            const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

            const dayTotal = recentSales
                .filter(s => s.sale_date && s.sale_date >= dayStart && s.sale_date <= dayEnd)
                .reduce((sum, s) => sum + Number(s.total_amount), 0);

            dailySales.push({
                day: dayNames[date.getUTCDay()],
                total: Math.round(dayTotal * 100) / 100,
            });
        }

        // --- Ventas por categoría ---
        const categoryMap = new Map<string, number>();

        for (const sale of recentSales) {
            for (const item of sale.sale_items) {
                const category = item.batches?.products?.category || 'Sin categoría';
                const amount = Number(item.price_at_sale) * item.quantity;
                categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
            }
        }

        const salesByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
        }));

        // --- Distribución por método de pago ---
        const paymentMethodMap = new Map<string, number>();
        const methodLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta' };

        for (const sale of recentSales) {
            const method = sale.payment_method || 'cash';
            const label = methodLabels[method] || method;
            const amount = Number(sale.total_amount);
            paymentMethodMap.set(label, (paymentMethodMap.get(label) || 0) + amount);
        }

        const salesByPaymentMethod = Array.from(paymentMethodMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
        }));

        return {
            dailySales,
            salesByCategory,
            salesByPaymentMethod,
        };
    }

    /**
     * Reporte de ventas para un rango de fechas arbitrario.
     * Agrupación dinámica:
     *   ≤ 31 días  → por día
     *   ≤ 90 días  → por semana
     *   > 90 días  → por mes
     */
    async getReportData(from: Date, to: Date) {
        // Normalizar: from al inicio del día, to al final
        const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0));
        const end   = new Date(Date.UTC(to.getUTCFullYear(),   to.getUTCMonth(),   to.getUTCDate(),   23, 59, 59, 999));

        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        // Determinar granularidad
        const granularity: 'day' | 'week' | 'month' =
            diffDays <= 31 ? 'day' :
            diffDays <= 90 ? 'week' : 'month';

        // --- Ventas en el rango ---
        const sales = await prisma.sales.findMany({
            where: {
                status: 'completed',
                sale_date: { gte: start, lte: end },
            },
            include: {
                sale_items: {
                    include: {
                        batches: {
                            include: {
                                products: { select: { category: true } },
                            },
                        },
                    },
                },
            },
        });

        // --- Totales del periodo ---
        let totalRevenue = 0;
        let totalTax = 0;
        let totalCogs = 0;
        let totalTransactions = 0;

        for (const sale of sales) {
            totalRevenue += Number(sale.total_amount) || 0;
            totalTax     += Number(sale.total_tax)    || 0;
            totalTransactions++;
            for (const item of sale.sale_items) {
                if (item.batches?.unit_cost) {
                    totalCogs += Number(item.batches.unit_cost) * item.quantity;
                }
            }
        }
        const totalNetUtility = totalRevenue - totalTax - totalCogs;
        const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // --- Serie de tiempo según granularidad ---
        const timeSeries: { label: string; total: number }[] = [];

        if (granularity === 'day') {
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            for (let i = 0; i <= diffDays; i++) {
                const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
                const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
                const dayEnd   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
                const total = sales
                    .filter(s => s.sale_date && s.sale_date >= dayStart && s.sale_date <= dayEnd)
                    .reduce((sum, s) => sum + Number(s.total_amount), 0);
                // Etiqueta: si el rango es un solo día muestro la hora, si es varios días el día de semana + número
                const label = diffDays === 0
                    ? `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
                    : diffDays <= 7
                        ? dayNames[d.getUTCDay()]
                        : `${dayNames[d.getUTCDay()]} ${d.getUTCDate()}`;
                timeSeries.push({ label, total: Math.round(total * 100) / 100 });
            }
        } else if (granularity === 'week') {
            // Iterar semana por semana desde start hasta end
            let weekStart = new Date(start);
            let weekNum = 1;
            while (weekStart <= end) {
                const weekEnd = new Date(Date.UTC(
                    weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 6,
                    23, 59, 59, 999
                ));
                const effectiveEnd = weekEnd < end ? weekEnd : end;
                const total = sales
                    .filter(s => s.sale_date && s.sale_date >= weekStart && s.sale_date <= effectiveEnd)
                    .reduce((sum, s) => sum + Number(s.total_amount), 0);
                timeSeries.push({ label: `Sem ${weekNum}`, total: Math.round(total * 100) / 100 });
                weekStart = new Date(Date.UTC(
                    weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 7
                ));
                weekNum++;
            }
        } else {
            // Por mes
            const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
            while (cur <= end) {
                const mStart = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), 1, 0, 0, 0, 0));
                const mEnd   = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 0, 23, 59, 59, 999));
                const effectiveEnd = mEnd < end ? mEnd : end;
                const total = sales
                    .filter(s => s.sale_date && s.sale_date >= mStart && s.sale_date <= effectiveEnd)
                    .reduce((sum, s) => sum + Number(s.total_amount), 0);
                timeSeries.push({
                    label: `${monthNames[cur.getUTCMonth()]} ${cur.getUTCFullYear()}`,
                    total: Math.round(total * 100) / 100,
                });
                cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
            }
        }

        // --- Ventas por categoría ---
        const categoryMap = new Map<string, number>();
        for (const sale of sales) {
            for (const item of sale.sale_items) {
                const cat = item.batches?.products?.category || 'Sin categoría';
                const amount = Number(item.price_at_sale) * item.quantity;
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
            }
        }
        const salesByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
        }));

        // --- Distribución por método de pago ---
        const paymentMethodMap = new Map<string, number>();
        const methodLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta' };
        for (const sale of sales) {
            const method = sale.payment_method || 'cash';
            const label = methodLabels[method] || method;
            paymentMethodMap.set(label, (paymentMethodMap.get(label) || 0) + Number(sale.total_amount));
        }
        const salesByPaymentMethod = Array.from(paymentMethodMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
        }));

        return {
            granularity,
            diffDays,
            timeSeries,
            salesByCategory,
            salesByPaymentMethod,
            totals: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalNetUtility: Math.round(totalNetUtility * 100) / 100,
                totalTax: Math.round(totalTax * 100) / 100,
                totalTransactions,
                avgTicket: Math.round(avgTicket * 100) / 100,
            },
        };
    }
}

export default new DashboardService();
