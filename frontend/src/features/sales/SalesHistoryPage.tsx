/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useEffect, useMemo, Fragment } from 'react';
import { fetchSalesHistory, voidSale as apiVoidSale, type SaleHistoryItem } from './salesHistoryApi';
import { exportToExcel, exportToPDF } from './exportUtils';
import ReceiptModal from './ReceiptModal';
import { toast } from 'sonner';
import {
    History, Loader2, AlertTriangle, RefreshCw, ChevronDown, ChevronRight,
    Receipt, User, Calendar, Package, Banknote, CreditCard, ArrowDownUp,
    FileSpreadsheet, FileDown, XCircle, Printer, Search, Filter,
} from 'lucide-react';

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
});

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function PaymentMethodBadge({ method }: { method: string }) {
    if (method === 'card') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                <CreditCard className="w-3 h-3" /> Tarjeta
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Banknote className="w-3 h-3" /> Efectivo
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'voided') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                <XCircle className="w-3 h-3" /> Anulada
            </span>
        );
    }
    return null;
}

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<SaleHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [voidingId, setVoidingId] = useState<number | null>(null);
    const [confirmVoidId, setConfirmVoidId] = useState<number | null>(null);

    // Filtros avanzados
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided'>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Ticket reprint
    const [ticketSale, setTicketSale] = useState<SaleHistoryItem | null>(null);

    const loadSales = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchSalesHistory();
            setSales(data);
        } catch {
            setError('No se pudo cargar el historial de ventas. Verifica que tengas permisos de administrador.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSales(); }, []);

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleVoid = async (id: number) => {
        setVoidingId(id);
        try {
            await apiVoidSale(id);
            toast.success('Venta anulada exitosamente. Stock revertido.');
            setConfirmVoidId(null);
            setExpandedId(null);
            await loadSales();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(axiosErr?.response?.data?.message || axiosErr?.message || 'Error al anular venta');
        } finally {
            setVoidingId(null);
        }
    };

    // Aplicar filtros
    const filtered = useMemo(() => {
        return sales.filter((s) => {
            // Búsqueda texto
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchText =
                    s.id.toString().includes(q) ||
                    s.users.name.toLowerCase().includes(q) ||
                    formatDate(s.sale_date).toLowerCase().includes(q);
                if (!matchText) return false;
            }
            // Filtro: método de pago
            if (paymentFilter !== 'all' && (s.payment_method || 'cash') !== paymentFilter) return false;
            // Filtro: estado
            if (statusFilter !== 'all' && (s.status || 'completed') !== statusFilter) return false;
            // Filtro: rango de fechas
            if (dateFrom) {
                const [year, month, day] = dateFrom.split('-');
                const from = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
                const saleDate = new Date(s.sale_date);
                if (saleDate < from) return false;
            }
            if (dateTo) {
                const [year, month, day] = dateTo.split('-');
                const to = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);
                const saleDate = new Date(s.sale_date);
                if (saleDate > to) return false;
            }
            return true;
        });
    }, [sales, search, paymentFilter, statusFilter, dateFrom, dateTo]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando historial...</p>
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
                    <button onClick={loadSales} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <History className="w-7 h-7 text-primary" />
                        Historial de Ventas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {sales.length} venta{sales.length !== 1 ? 's' : ''} — mostrando {filtered.length}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <button onClick={() => exportToExcel(filtered)} title="Exportar a Excel"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                    </button>
                    <button onClick={() => exportToPDF(filtered)} title="Exportar a PDF"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        <FileDown className="w-4 h-4 text-red-500" /> PDF
                    </button>
                    <button onClick={() => setShowFilters(!showFilters)} title="Filtros avanzados"
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                        <Filter className="w-4 h-4" /> Filtros
                    </button>
                    <button onClick={loadSales} className="w-9 h-9 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Refrescar">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por ID, vendedor o fecha..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Desde</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hasta</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Método de Pago</label>
                            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'cash' | 'card')}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                <option value="all">Todos</option>
                                <option value="cash">Efectivo</option>
                                <option value="card">Tarjeta</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estado</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'voided')}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                <option value="all">Todos</option>
                                <option value="completed">Completadas</option>
                                <option value="voided">Anuladas</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabla */}
            {filtered.length === 0 ? (
                <div className="rounded-xl bg-card border border-border p-10 text-center">
                    <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-1">No se encontraron ventas</h3>
                    <p className="text-muted-foreground text-sm">{search || dateFrom || dateTo || paymentFilter !== 'all' ? 'Intenta con otros filtros.' : 'Aún no se han registrado ventas.'}</p>
                </div>
            ) : (
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px]">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="w-10 py-3 px-4"></th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"># ID</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendedor</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pago</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((sale) => {
                                    const isExpanded = expandedId === sale.id;
                                    const totalAmount = parseFloat(sale.total_amount);
                                    const amountPaid = sale.amount_paid ? parseFloat(sale.amount_paid) : null;
                                    const change = amountPaid !== null ? amountPaid - totalAmount : null;
                                    const isVoided = sale.status === 'voided';

                                    return (
                                        <Fragment key={sale.id}>
                                            <tr onClick={() => toggleExpand(sale.id)}
                                                className={`hover:bg-muted/20 transition-colors cursor-pointer ${isVoided ? 'opacity-60' : ''}`}>
                                                <td className="py-3 px-4">
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-bold text-primary">#{sale.id.toString().padStart(4, '0')}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {formatDate(sale.sale_date)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                                        <User className="w-3.5 h-3.5 text-muted-foreground" /> {sale.users.name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center"><PaymentMethodBadge method={sale.payment_method || 'cash'} /></td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`text-sm font-bold ${isVoided ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                        {currencyFmt.format(totalAmount)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <StatusBadge status={sale.status || 'completed'} />
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="p-0">
                                                        <div className="bg-muted/30 px-6 py-4 border-t border-border">
                                                            {/* Payment breakdown cards */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                                                                <div className="px-4 py-3 rounded-xl bg-card border border-border/50">
                                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Total de la Venta</p>
                                                                    <p className={`text-lg font-bold ${isVoided ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{currencyFmt.format(totalAmount)}</p>
                                                                </div>
                                                                <div className="px-4 py-3 rounded-xl bg-card border border-border/50">
                                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Método de Pago</p>
                                                                    <div className="mt-0.5"><PaymentMethodBadge method={sale.payment_method || 'cash'} /></div>
                                                                </div>
                                                                <div className="px-4 py-3 rounded-xl bg-card border border-border/50">
                                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Monto Recibido</p>
                                                                    <p className="text-lg font-bold text-foreground">{amountPaid !== null ? currencyFmt.format(amountPaid) : '—'}</p>
                                                                </div>
                                                                <div className={`px-4 py-3 rounded-xl border ${change !== null && change >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-card border-border/50'}`}>
                                                                    <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><ArrowDownUp className="w-3 h-3" />Cambio Entregado</p>
                                                                    <p className={`text-lg font-bold ${change !== null && change >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                                                                        {change !== null ? currencyFmt.format(change) : '—'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Products detail */}
                                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                <Package className="w-3.5 h-3.5" /> Detalle de Productos
                                                            </h4>
                                                            <div className="space-y-2 mb-4">
                                                                {sale.sale_items.map((item) => (
                                                                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-card border border-border/50">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-foreground truncate">{item.batches.products.name}</p>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <span className="text-xs font-mono text-muted-foreground">{item.batches.products.sku}</span>
                                                                                <span className="text-xs text-muted-foreground">•</span>
                                                                                <span className="text-xs text-muted-foreground">Lote: {item.batches.batch_number}</span>
                                                                                {item.batches.products.category && (
                                                                                    <>
                                                                                        <span className="text-xs text-muted-foreground">•</span>
                                                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{item.batches.products.category}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right ml-4 shrink-0">
                                                                            <p className="text-sm font-semibold text-foreground">{currencyFmt.format(parseFloat(item.price_at_sale) * item.quantity)}</p>
                                                                            <p className="text-xs text-muted-foreground">{item.quantity} × {currencyFmt.format(parseFloat(item.price_at_sale))}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex items-center gap-2 pt-2 border-t border-border">
                                                                <button onClick={(e) => { e.stopPropagation(); setTicketSale(sale); }}
                                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                                                                    <Printer className="w-4 h-4 text-primary" /> Ver Ticket
                                                                </button>
                                                                {!isVoided && (
                                                                    <>
                                                                        {confirmVoidId === sale.id ? (
                                                                            <div className="flex items-center gap-2 ml-auto">
                                                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">¿Anular esta venta?</span>
                                                                                <button onClick={(e) => { e.stopPropagation(); handleVoid(sale.id); }}
                                                                                    disabled={voidingId === sale.id}
                                                                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                                                                                    {voidingId === sale.id ? 'Anulando...' : 'Sí, Anular'}
                                                                                </button>
                                                                                <button onClick={(e) => { e.stopPropagation(); setConfirmVoidId(null); }}
                                                                                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                                                                                    Cancelar
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button onClick={(e) => { e.stopPropagation(); setConfirmVoidId(sale.id); }}
                                                                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto">
                                                                                <XCircle className="w-4 h-4" /> Anular Venta
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {ticketSale && (
                <ReceiptModal sale={ticketSale} onClose={() => setTicketSale(null)} />
            )}
        </div>
    );
}
