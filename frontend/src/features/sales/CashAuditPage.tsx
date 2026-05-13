/**
 * @fileoverview Página de Corte de Caja (Cash Audit).
 * Permite al cajero/admin registrar el conteo de efectivo al final de turno
 * y comparar contra el monto esperado calculado por el sistema.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Landmark,
    DollarSign,
    Calculator,
    TrendingDown,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Clock,
    User,
} from 'lucide-react';

interface CashAudit {
    id: number;
    user_id: number;
    expected_amount: string;
    counted_amount: string;
    difference: string;
    notes: string | null;
    created_at: string;
    users?: { id: number; name: string; email: string };
}

export default function CashAuditPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [expectedAmount, setExpectedAmount] = useState<number>(0);
    const [countedAmount, setCountedAmount] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [audits, setAudits] = useState<CashAudit[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const difference = countedAmount ? Number(countedAmount) - expectedAmount : 0;

    // Cargar datos
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Obtener monto esperado
            const expectedRes = await api.get('/cash-audits/expected');
            setExpectedAmount(expectedRes.data.expected_amount || 0);

            // Si es admin, cargar historial
            if (isAdmin) {
                const auditsRes = await api.get('/cash-audits');
                setAudits(auditsRes.data);
            }
        } catch (error: any) {
            toast.error('Error al cargar datos del corte de caja');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!countedAmount) {
            toast.error('Ingresa el monto contado');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/cash-audits', {
                counted_amount: Number(countedAmount),
                notes: notes || undefined,
            });

            toast.success('Corte de caja registrado exitosamente');
            setShowSuccess(true);
            setCountedAmount('');
            setNotes('');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al registrar corte');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        Corte de Caja
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Registra el conteo de efectivo al finalizar tu turno</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Principal — Formulario */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tarjetas de Resumen */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Esperado */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                                <Calculator className="w-4 h-4" /> Sistema dice
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                ${expectedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Ventas en efectivo hoy</p>
                        </div>

                        {/* Contado */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                                <DollarSign className="w-4 h-4" /> Tú contaste
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {countedAmount ? `$${Number(countedAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Efectivo físico en caja</p>
                        </div>

                        {/* Diferencia */}
                        <div className={`rounded-2xl p-5 shadow-sm border ${
                            !countedAmount ? 'bg-card border-border' :
                            difference === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' :
                            difference < 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' :
                            'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                        }`}>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                                {difference < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                Diferencia
                            </div>
                            <p className={`text-2xl font-bold ${
                                !countedAmount ? 'text-foreground' :
                                difference === 0 ? 'text-emerald-600' :
                                difference < 0 ? 'text-red-600' : 'text-blue-600'
                            }`}>
                                {countedAmount ? `${difference >= 0 ? '+' : ''}$${difference.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {!countedAmount ? 'Ingresa el conteo' :
                                 difference === 0 ? '¡Caja cuadrada!' :
                                 difference < 0 ? 'Faltante en caja' : 'Sobrante en caja'}
                            </p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Registrar Conteo de Efectivo
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Monto Contado *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={countedAmount}
                                        onChange={e => setCountedAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                                        disabled={showSuccess}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Notas (Opcional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Ej: Billete de $500 sospechoso..."
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                                    disabled={showSuccess}
                                />
                            </div>
                        </div>

                        {showSuccess ? (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                                <div>
                                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Corte registrado exitosamente</p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-0.5">El administrador podrá revisar este corte en el historial.</p>
                                </div>
                                <button type="button" onClick={() => { setShowSuccess(false); loadData(); }} className="ml-auto text-sm font-medium text-primary hover:underline">
                                    Nuevo corte
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !countedAmount}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Registrar Corte de Caja
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Panel Lateral — Historial (solo admin) */}
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            Historial de Cortes
                        </h3>

                        {!isAdmin ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                Solo el administrador puede ver el historial completo de cortes.
                            </p>
                        ) : audits.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No hay cortes de caja registrados.
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {audits.slice(0, 15).map(audit => {
                                    const diff = Number(audit.difference);
                                    return (
                                        <div key={audit.id} className="p-3 bg-background border border-border rounded-xl text-sm space-y-1.5 relative overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${diff === 0 ? 'bg-emerald-400' : diff < 0 ? 'bg-red-400' : 'bg-blue-400'}`} />
                                            <div className="flex items-center justify-between pl-2">
                                                <span className="font-medium text-foreground flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {audit.users?.name || `User #${audit.user_id}`}
                                                </span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    diff === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                                    diff < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                                }`}>
                                                    {diff >= 0 ? '+' : ''}${diff.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pl-2 text-xs text-muted-foreground">
                                                <span>Esperado: ${Number(audit.expected_amount).toFixed(2)} → Contó: ${Number(audit.counted_amount).toFixed(2)}</span>
                                            </div>
                                            <div className="pl-2 text-xs text-muted-foreground">
                                                {new Date(audit.created_at).toLocaleString('es-MX')}
                                            </div>
                                            {audit.notes && (
                                                <div className="pl-2 mt-1">
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                                        {audit.notes}
                                                    </span>
                                                </div>
                                            )}
                                            {diff < 0 && (
                                                <div className="pl-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                                                    <AlertTriangle className="w-3 h-3" /> Faltante
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
