import { useState } from 'react';
import type { PurchaseOrder } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseOrders } from './usePurchaseOrders';
import CreateOrderModal from './CreateOrderModal';
import ReceiveOrderModal from './ReceiveOrderModal';
import UpdateDateModal from './UpdateDateModal';
import { toast } from 'sonner';
import { ShoppingBag, Plus, Loader2, AlertTriangle, RefreshCw, FileText, CheckCircle, XCircle, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

export default function PurchaseOrdersPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [searchParams, setSearchParams] = useSearchParams();
    const supplierFilterId = searchParams.get('supplier') ? Number(searchParams.get('supplier')) : null;
    const { orders, loading, error, loadOrders, addOrder, updateExpectedDateOrder, receiveOrder, cancelOrder } = usePurchaseOrders();

    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
    const [updateDateTarget, setUpdateDateTarget] = useState<PurchaseOrder | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.id.toString().includes(search) || o.suppliers?.name.toLowerCase().includes(search.toLowerCase());
        const matchesSupplierId = supplierFilterId ? o.supplier_id === supplierFilterId : true;
        return matchesSearch && matchesSupplierId;
    });

    const handleCreateSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            await addOrder(data);
            toast.success('Orden de compra creada exitosamente');
            setCreateOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al crear la orden');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateDateSubmit = async (date: string | null) => {
        if (!updateDateTarget) return;
        setSubmitting(true);
        try {
            await updateExpectedDateOrder(updateDateTarget.id, date);
            toast.success('Fecha esperada actualizada exitosamente');
            setUpdateDateTarget(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al actualizar la fecha');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceiveSubmit = async (data: any) => {
        if (!receiveTarget) return;
        setSubmitting(true);
        try {
            await receiveOrder(receiveTarget.id, data);
            toast.success('Orden recibida correctamente. El inventario ha sido actualizado.');
            setReceiveTarget(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al recibir la orden');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelOrder = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas cancelar esta orden de compra?')) return;
        setSubmitting(true);
        try {
            await cancelOrder(id);
            toast.success('Orden cancelada');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al cancelar la orden');
        } finally {
            setSubmitting(false);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">PENDIENTE</span>;
            case 'RECEIVED': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">RECIBIDA</span>;
            case 'CANCELLED': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">CANCELADA</span>;
            default: return null;
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando órdenes de compra...</p>
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
                    <button onClick={loadOrders} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <ShoppingBag className="w-7 h-7 text-primary" />
                        Órdenes de Compra
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los reabastecimientos de inventario
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={loadOrders} className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-md">
                            <Plus className="w-4 h-4" />
                            Crear Orden
                        </button>
                    )}
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por ID o proveedor..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
            </div>

            {supplierFilterId && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full flex items-center gap-2 border border-border">
                        Filtrando por proveedor seleccionado
                        <button 
                            onClick={() => setSearchParams({})} 
                            className="hover:text-foreground hover:bg-background rounded-full p-0.5 transition-colors"
                            title="Quitar filtro"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </span>
                </div>
            )}

            {/* Orders List */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Orden #</th>
                                <th className="px-4 py-3 font-medium">Proveedor</th>
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium">Total</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">OC-{order.id.toString().padStart(4, '0')}</td>
                                        <td className="px-4 py-3">{order.suppliers?.name || 'Proveedor Eliminado'}</td>
                                        <td className="px-4 py-3">
                                            <div>{format(new Date(order.order_date), "dd MMM yyyy", { locale: es })}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                Llegada: {order.expected_delivery_date ? format(new Date(order.expected_delivery_date), "dd MMM yyyy", { locale: es }) : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{formatCurrency(order.total_amount)}</td>
                                        <td className="px-4 py-3">
                                            {statusBadge(order.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {order.status === 'PENDING' && isAdmin && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setUpdateDateTarget(order)}
                                                        disabled={submitting}
                                                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                                        title="Modificar Fecha Esperada"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        disabled={submitting}
                                                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                                        title="Cancelar Orden"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setReceiveTarget(order)}
                                                        disabled={submitting}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Recibir
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                        No se encontraron órdenes de compra
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {createOpen && isAdmin && (
                <CreateOrderModal 
                    open={createOpen} 
                    onClose={() => setCreateOpen(false)} 
                    onSubmit={handleCreateSubmit}
                    submitting={submitting} 
                />
            )}

            {receiveTarget && isAdmin && (
                <ReceiveOrderModal 
                    open={!!receiveTarget} 
                    onClose={() => setReceiveTarget(null)} 
                    onSubmit={handleReceiveSubmit}
                    order={receiveTarget}
                    submitting={submitting} 
                />
            )}

            {updateDateTarget && isAdmin && (
                <UpdateDateModal 
                    open={!!updateDateTarget} 
                    onClose={() => setUpdateDateTarget(null)} 
                    onSubmit={handleUpdateDateSubmit}
                    order={updateDateTarget}
                    submitting={submitting} 
                />
            )}
        </div>
    );
}
