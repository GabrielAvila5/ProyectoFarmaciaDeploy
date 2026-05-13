/**
 * @fileoverview Componente de vista principal (Página) que agrupa características y se mapea a una ruta específica.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { DashboardSummary } from '@/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    DollarSign,
    CalendarCheck,
    AlertTriangle,
    Clock,
    TrendingUp,
    Package,
    Loader2,
    BarChart3,
    PieChartIcon,
    Banknote,
    Calendar,
    ShoppingCart,
    Receipt,
} from 'lucide-react';

interface ChartData {
    dailySales: { day: string; total: number }[];
    salesByCategory: { name: string; value: number }[];
    salesByPaymentMethod?: { name: string; value: number }[];
}

interface ReportData {
    granularity: 'day' | 'week' | 'month';
    diffDays: number;
    timeSeries: { label: string; total: number }[];
    salesByCategory: { name: string; value: number }[];
    salesByPaymentMethod: { name: string; value: number }[];
    totals: {
        totalRevenue: number;
        totalNetUtility: number;
        totalTax: number;
        totalTransactions: number;
        avgTicket: number;
    };
}

type Preset = 'today' | 'week' | 'month' | 'year' | 'custom';

const toYMD = (d: Date) => d.toISOString().split('T')[0];

const getPresetRange = (preset: Preset): { from: string; to: string } => {
    const now = new Date();
    const today = toYMD(now);
    if (preset === 'today') return { from: today, to: today };
    if (preset === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        return { from: toYMD(d), to: today };
    }
    if (preset === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: toYMD(d), to: today };
    }
    if (preset === 'year') {
        const d = new Date(now.getFullYear(), 0, 1);
        return { from: toYMD(d), to: today };
    }
    return { from: today, to: today };
};

// Paleta esmeralda/teal para gráficas
const BAR_GRADIENT_ID = 'barGrad';
const PIE_COLORS = [
    '#0d9488', // teal-600
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
    '#14b8a6', // teal-500
    '#34d399', // emerald-400
    '#22d3ee', // cyan-400
    '#059669', // emerald-600
    '#0891b2', // cyan-600
];

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

export default function DashboardPage() {
    // --- Estado estático (alertas del día: no dependen del periodo) ---
    const [data, setData] = useState<DashboardSummary | null>(null);

    // --- Estado del reporte por periodo ---
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [preset, setPreset] = useState<Preset>('week');
    const today = toYMD(new Date());
    const [customFrom, setCustomFrom] = useState(today);
    const [customTo, setCustomTo] = useState(today);
    const [reportLoading, setReportLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch estático: summary (stock crítico, citas, lotes)
    useEffect(() => {
        api.get('/dashboard/summary')
            .then(r => setData(r.data))
            .catch(() => setError('No se pudo cargar el resumen del dashboard.'))
            .finally(() => setLoading(false));
    }, []);

    // Fetch del reporte por periodo
    const fetchReport = useCallback(async (from: string, to: string) => {
        setReportLoading(true);
        try {
            const res = await api.get(`/dashboard/report?from=${from}&to=${to}`);
            setReportData(res.data);
        } catch {
            // silencioso — el error del summary ya se muestra
        } finally {
            setReportLoading(false);
        }
    }, []);

    // Cargar reporte inicial (preset = 'week')
    useEffect(() => {
        const { from, to } = getPresetRange('week');
        fetchReport(from, to);
    }, [fetchReport]);

    const handlePreset = (p: Preset) => {
        setPreset(p);
        if (p !== 'custom') {
            const { from, to } = getPresetRange(p);
            setCustomFrom(from);
            setCustomTo(to);
            fetchReport(from, to);
        }
    };

    const handleCustomApply = () => {
        if (customFrom && customTo && customFrom <= customTo) {
            fetchReport(customFrom, customTo);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Tarjetas estáticas (alertas operativas — siempre del día)
    const alertCards = [
        {
            title: 'Citas Hoy',
            value: data.todaysAppointments.toString(),
            icon: CalendarCheck,
            gradient: 'from-blue-500 to-cyan-500',
            shadow: 'shadow-blue-500/20',
        },
        {
            title: 'Stock Crítico',
            value: data.criticalStock.length.toString(),
            icon: AlertTriangle,
            gradient: 'from-amber-500 to-orange-500',
            shadow: 'shadow-amber-500/20',
            alert: data.criticalStock.length > 0,
        },
        {
            title: 'Lotes por Vencer',
            value: data.expiringBatches.length.toString(),
            icon: Clock,
            gradient: 'from-rose-500 to-pink-500',
            shadow: 'shadow-rose-500/20',
            alert: data.expiringBatches.length > 0,
        },
    ];

    // Datos del reporte dinámico
    const hasTimeSeries = reportData?.timeSeries.some(d => d.total > 0);
    const hasCategoryData = (reportData?.salesByCategory?.length ?? 0) > 0;
    const hasPaymentMethodData = (reportData?.salesByPaymentMethod?.length ?? 0) > 0;
    const PAYMENT_COLORS = ['#10b981', '#3b82f6'];

    const presetLabels: Record<Preset, string> = {
        today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', year: 'Este Año', custom: 'Personalizado',
    };
    const granularityLabel = reportData?.granularity === 'day' ? 'por día'
        : reportData?.granularity === 'week' ? 'por semana' : 'por mes';

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-primary" />
                    Panel de Control
                </h1>
                <p className="text-muted-foreground mt-1">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* ===== SELECTOR DE PERIODO ===== */}
            <div className="rounded-xl bg-card border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground mr-1">Periodo:</span>
                    {(['today', 'week', 'month', 'year', 'custom'] as Preset[]).map(p => (
                        <button
                            key={p}
                            onClick={() => handlePreset(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                preset === p
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {presetLabels[p]}
                        </button>
                    ))}
                    {preset === 'custom' && (
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="date" value={customFrom} max={customTo}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
                            />
                            <span className="text-muted-foreground text-sm">—</span>
                            <input
                                type="date" value={customTo} min={customFrom} max={today}
                                onChange={e => setCustomTo(e.target.value)}
                                className="px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
                            />
                            <button
                                onClick={handleCustomApply}
                                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    )}
                    {reportLoading && <span className="text-xs text-muted-foreground animate-pulse ml-2">Cargando...</span>}
                </div>
            </div>

            {/* ===== KPI CARDS DEL PERIODO ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Ingresos del periodo */}
                <div className="relative overflow-hidden rounded-xl bg-card border border-border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Ingresos ({presetLabels[preset]})</p>
                            <p className="text-3xl font-bold mt-2 text-foreground">
                                {reportData ? currencyFmt.format(reportData.totals.totalRevenue) : '—'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 opacity-[0.04] translate-x-8 translate-y-8" />
                </div>
                {/* Utilidad neta */}
                <div className="relative overflow-hidden rounded-xl bg-card border border-border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Utilidad Neta</p>
                            <p className="text-3xl font-bold mt-2 text-foreground">
                                {reportData ? currencyFmt.format(reportData.totals.totalNetUtility) : '—'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 opacity-[0.04] translate-x-8 translate-y-8" />
                </div>
                {/* Transacciones */}
                <div className="relative overflow-hidden rounded-xl bg-card border border-border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Transacciones</p>
                            <p className="text-3xl font-bold mt-2 text-foreground">
                                {reportData?.totals.totalTransactions ?? '—'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform duration-300">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 opacity-[0.04] translate-x-8 translate-y-8" />
                </div>
                {/* Ticket promedio */}
                <div className="relative overflow-hidden rounded-xl bg-card border border-border p-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Ticket Promedio</p>
                            <p className="text-3xl font-bold mt-2 text-foreground">
                                {reportData ? currencyFmt.format(reportData.totals.avgTicket) : '—'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 opacity-[0.04] translate-x-8 translate-y-8" />
                </div>
            </div>

            {/* ===== ALERTAS OPERATIVAS (siempre del día) ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {alertCards.map(card => (
                    <div key={card.title} className={`relative overflow-hidden rounded-xl bg-card border border-border p-5 hover:shadow-lg transition-all duration-300 group ${card.alert ? 'ring-2 ring-amber-500/20' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                                <p className="text-3xl font-bold mt-2 text-foreground">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-[0.04] translate-x-8 translate-y-8`} />
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar chart: serie temporal dinámica (2/3) */}
                <div className="lg:col-span-2 rounded-xl bg-card border border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Ventas — {presetLabels[preset]}</h2>
                            <p className="text-xs text-muted-foreground">Ingresos {granularityLabel} de la farmacia</p>
                        </div>
                    </div>
                    <div className="p-5">
                        {reportLoading ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : hasTimeSeries ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={reportData?.timeSeries} barSize={36}>
                                    <defs>
                                        <linearGradient id={BAR_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                                    <Tooltip
                                        formatter={((value: number) => [currencyFmt.format(value), 'Total']) as any}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="total" fill={`url(#${BAR_GRADIENT_ID})`} radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center">
                                <div className="text-center">
                                    <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground font-medium">Sin datos para este periodo</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Realiza ventas para ver las estadísticas aquí</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie chart: ventas por categoría (1/3) */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <PieChartIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Ventas por Categoría</h2>
                            <p className="text-xs text-muted-foreground">Desglose — {presetLabels[preset]}</p>
                        </div>
                    </div>
                    <div className="p-5">
                        {hasCategoryData ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={reportData?.salesByCategory} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                        {reportData?.salesByCategory.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={((value: number) => [currencyFmt.format(value), 'Ventas']) as any}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                                        formatter={(value: string) => (
                                            <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 500 }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center">
                                <div className="text-center">
                                    <PieChartIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground font-medium">Sin datos de categorías</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment method distribution */}
            {hasPaymentMethodData && (
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Banknote className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Distribución por Método de Pago</h2>
                            <p className="text-xs text-muted-foreground">Corte de caja — {presetLabels[preset]}</p>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                            <div className="sm:col-span-1">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={reportData?.salesByPaymentMethod} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                            {reportData?.salesByPaymentMethod?.map((_, index) => (
                                                <Cell key={`pm-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={((value: number) => [currencyFmt.format(value), 'Total']) as any}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="sm:col-span-2 space-y-3">
                                {reportData?.salesByPaymentMethod?.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }} />
                                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{currencyFmt.format(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tables section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Critical stock table */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Stock Crítico</h2>
                            <p className="text-xs text-muted-foreground">
                                Productos con menos de 15 unidades
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {data.criticalStock.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                ✅ Todos los productos tienen stock suficiente
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.criticalStock.map((item) => (
                                        <tr
                                            key={item.productId}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="py-3 px-5 text-sm font-medium text-foreground">
                                                {item.productName}
                                                {item.supplierName && (
                                                    <span className="block text-xs text-emerald-600 mt-0.5 font-normal">Comprar a: {item.supplierName}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.totalQuantity <= 5
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}
                                                >
                                                    {item.totalQuantity} uds.
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Expiring batches table */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Lotes por Vencer</h2>
                            <p className="text-xs text-muted-foreground">
                                Próximos a caducar en los siguientes 30 días
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {data.expiringBatches.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                ✅ No hay lotes próximos a vencer
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Lote
                                        </th>
                                        <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Vence
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.expiringBatches.map((batch) => {
                                        const expiryDate = new Date(batch.expiryDate);
                                        const daysLeft = Math.ceil(
                                            (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        );
                                        return (
                                            <tr
                                                key={batch.id}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="py-3 px-5 text-sm font-medium text-foreground">
                                                    {batch.productName}
                                                </td>
                                                <td className="py-3 px-5 text-sm text-muted-foreground">
                                                    {batch.batchNumber}
                                                    <span className="ml-2 text-xs text-muted-foreground/70">
                                                        ({batch.quantity} uds.)
                                                    </span>
                                                    {batch.supplierName && (
                                                        <span className="block text-xs text-emerald-600 mt-0.5 font-normal">Comprar a: {batch.supplierName}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-5 text-right">
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${daysLeft <= 7
                                                                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                            }`}
                                                    >
                                                        {daysLeft <= 0 ? 'Vencido' : `${daysLeft}d`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
