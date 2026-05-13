import { useState } from 'react';
import type { Supplier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSuppliers } from './useSuppliers';
import type { SupplierFormData } from './supplierSchemas';
import SupplierFormModal from './SupplierFormModal';
import DeleteConfirmDialog from '@/features/inventory/DeleteConfirmDialog';
import { toast } from 'sonner';
import { Truck, Plus, Search, Loader2, AlertTriangle, RefreshCw, Mail, Phone, Clock, Pencil, Trash2, PowerOff, Power, ExternalLink, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeText } from '@/lib/normalizeText';

export default function SuppliersPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';
    const { suppliers, loading, error, loadSuppliers, addSupplier, editSupplier, removeSupplier, toggleStatus } = useSuppliers();

    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const filteredSuppliers = suppliers.filter(s => {
        const q = normalizeText(search);
        return normalizeText(s.name).includes(q) || 
            (s.contact_name && normalizeText(s.contact_name).includes(q));
    });

    const handleOpenCreate = () => {
        setEditingSupplier(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data: SupplierFormData) => {
        setSubmitting(true);
        try {
            if (editingSupplier) {
                await editSupplier(editingSupplier.id, data);
                toast.success('Proveedor actualizado');
            } else {
                await addSupplier(data);
                toast.success('Proveedor creado');
            }
            setFormOpen(false);
            setEditingSupplier(null);
        } catch (err: unknown) {
            toast.error('Error al guardar el proveedor');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setSubmitting(true);
        try {
            await removeSupplier(deleteTarget.id);
            toast.success(`Proveedor eliminado`);
            setDeleteTarget(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (supplier: Supplier) => {
        try {
            await toggleStatus(supplier.id, !supplier.is_active);
            toast.success(`Proveedor ${supplier.is_active ? 'desactivado' : 'activado'}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al cambiar el estado');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando proveedores...</p>
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
                    <button onClick={loadSuppliers} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
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
                        <Truck className="w-7 h-7 text-primary" />
                        Directorio de Proveedores
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los proveedores de restock
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={loadSuppliers} className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-md">
                            <Plus className="w-4 h-4" />
                            Nuevo Proveedor
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
                    placeholder="Buscar proveedor..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className={`bg-card border ${supplier.is_active ? 'border-border' : 'border-destructive/30 opacity-75'} rounded-xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold text-lg ${supplier.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{supplier.name}</h3>
                                    {!supplier.is_active && <span className="text-[10px] uppercase font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Inactivo</span>}
                                </div>
                                {supplier.contact_name && <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleToggleStatus(supplier)} className={`p-1.5 ${supplier.is_active ? 'text-muted-foreground hover:text-orange-500' : 'text-orange-500 hover:text-green-500'} transition-colors`} title={supplier.is_active ? 'Desactivar' : 'Activar'}>
                                        {supplier.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleOpenEdit(supplier)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeleteTarget(supplier)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-3 mt-auto flex-grow">
                            {/* Contact Links as Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {supplier.phone && (
                                    <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-md transition-colors">
                                        <Phone className="w-3.5 h-3.5" />
                                        Llamar
                                    </a>
                                )}
                                {supplier.email && (
                                    <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-2 py-1 rounded-md transition-colors">
                                        <Mail className="w-3.5 h-3.5" />
                                        Correo
                                    </a>
                                )}
                            </div>

                            {/* Additional Info */}
                            {supplier.lead_time_days !== null && supplier.lead_time_days !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    Tiempo est.: <span className="font-medium text-foreground">{supplier.lead_time_days} días</span>
                                </div>
                            )}

                            {/* Metrics & Shortcuts */}
                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Órdenes:</span>
                                    <span className="font-bold text-foreground">{supplier._count?.purchase_orders || 0}</span>
                                </div>
                                <button 
                                    onClick={() => navigate(`/compras?supplier=${supplier.id}`)}
                                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                >
                                    Ver todas <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSuppliers.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border bg-card/50">
                        <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-foreground">No se encontraron proveedores</h3>
                        <p className="text-muted-foreground">Intenta con otros términos de búsqueda.</p>
                    </div>
                )}
            </div>

            <SupplierFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                supplier={editingSupplier}
                submitting={submitting}
            />

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                productName={deleteTarget?.name || 'este proveedor'}
                submitting={submitting}
            />
        </div>
    );
}
