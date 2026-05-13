import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import { Loader2, PackagePlus, Calendar, DollarSign, FileText, Search, Building2, ChevronDown } from 'lucide-react';
import { directRestockSchema, type DirectRestockFormData } from './directRestockSchemas';
import { useSuppliers } from '../restock/useSuppliers';
import type { Product } from '@/types';

interface DirectRestockModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: DirectRestockFormData) => Promise<void>;
    product: Product | null;
    products: Product[];
    submitting: boolean;
}

export default function DirectRestockModal({
    open,
    onClose,
    onSubmit,
    product,
    products,
    submitting,
}: DirectRestockModalProps) {
    const {
        register,
        watch,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DirectRestockFormData>({
        resolver: zodResolver(directRestockSchema) as any,
        defaultValues: {
            product_id: 0,
            quantity: '' as unknown as number,
            batch_number: '',
            expiry_date: '',
            unit_cost: '' as unknown as number,
            supplier_id: null as unknown as number,
            notes: ''
        } as DirectRestockFormData,
    });

    const { suppliers } = useSuppliers();
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const selectedProductId = watch('product_id');
    const selectedProductDetails = product || products.find(p => p.id === selectedProductId);

    useEffect(() => {
        if (open) {
            reset({
                product_id: product ? product.id : 0,
                quantity: '' as unknown as number,
                batch_number: '',
                expiry_date: '',
                unit_cost: product?.batches?.[0]?.unit_cost ? Number(product.batches[0].unit_cost) : ('' as unknown as number),
                supplier_id: null as unknown as number,
                notes: ''
            } as DirectRestockFormData);
            setSearchTerm(product ? `${product.name} (${product.sku})` : '');
            setDropdownOpen(false);
        }
    }, [open, product, reset]);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFormSubmit = (data: DirectRestockFormData) => {
        // Appends supplier name to notes if selected, to keep track in audit without changing DB schema
        let finalNotes = data.notes || '';
        if (data.supplier_id) {
            const supplier = suppliers.find(s => s.id === data.supplier_id);
            if (supplier) {
                finalNotes = finalNotes ? `Proveedor: ${supplier.name}. ${finalNotes}` : `Proveedor: ${supplier.name}`;
            }
        }
        onSubmit({ ...data, notes: finalNotes });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Ingreso Directo de Inventario"
            description={product ? `Registrar nuevo lote para: ${product.name}` : "Registrar nuevo lote manual"}
            maxWidth="max-w-md"
        >
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm mb-4">
                Este movimiento registrará entradas al stock de forma inmediata y quedará guardado en el historial de auditoría.
            </div>

            <form id="direct-restock-form" onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
                {product ? (
                    <input type="hidden" {...register('product_id', { valueAsNumber: true })} />
                ) : (
                    <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-foreground">
                            Búsqueda de Producto *
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setDropdownOpen(true);
                                }}
                                onFocus={() => setDropdownOpen(true)}
                                placeholder="Buscar por nombre o SKU..."
                                className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors"
                            />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        {dropdownOpen && (
                            <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground text-center">No se encontraron productos</div>
                                ) : (
                                    filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm transition-colors border-b border-border/50 last:border-0"
                                            onClick={() => {
                                                register('product_id').onChange({ target: { value: p.id, name: 'product_id' }});
                                                setSearchTerm(`${p.name} (${p.sku})`);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            <div className="font-medium text-foreground">{p.name}</div>
                                            <div className="text-xs text-muted-foreground">SKU: {p.sku} | Stock: {p.batches?.reduce((acc, b) => acc + b.quantity, 0) || 0}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {/* Visually hidden actual input to hold the value for useForm */}
                        <select {...register('product_id', { valueAsNumber: true })} className="sr-only" tabIndex={-1}>
                            <option value={0}></option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                        </select>
                        {errors.product_id && <p className="text-xs text-destructive">{errors.product_id.message}</p>}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Cantidad a Ingresar *
                        </label>
                        <div className="relative">
                            <PackagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                {...register('quantity')}
                                type="number"
                                min="1"
                                placeholder="Ej. 20"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Costo Unitario ($) *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                {...register('unit_cost')}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Ej. 25.50"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        {selectedProductDetails && (selectedProductDetails.batches?.[0]?.unit_cost || selectedProductDetails.base_price) ? (
                            <div className="flex justify-between text-xs mt-1.5 px-1 bg-muted/30 p-1.5 rounded-md border border-border">
                                <span className="text-muted-foreground">Último Costo: <strong className="text-foreground">{selectedProductDetails.batches?.[0]?.unit_cost ? `$${Number(selectedProductDetails.batches[0].unit_cost).toFixed(2)}` : 'N/A'}</strong></span>
                                <span className="text-muted-foreground">PVP (Venta): <strong className="text-foreground">{selectedProductDetails.base_price ? `$${Number(selectedProductDetails.base_price).toFixed(2)}` : 'N/A'}</strong></span>
                            </div>
                        ) : null}
                        {errors.unit_cost && <p className="text-xs text-destructive">{errors.unit_cost.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Número de Lote *
                        </label>
                        <input
                            {...register('batch_number')}
                            type="text"
                            placeholder="EJ. L2024XX"
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors uppercase"
                        />
                        {errors.batch_number && <p className="text-xs text-destructive">{errors.batch_number.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Fecha de Caducidad *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                {...register('expiry_date')}
                                type="date"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        {errors.expiry_date && <p className="text-xs text-destructive">{errors.expiry_date.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Proveedor (Opcional)
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            {...register('supplier_id', { valueAsNumber: true })}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors appearance-none"
                        >
                            <option value={0}>Seleccione un proveedor (opcional)</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Motivo / Notas (Opcional)
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <textarea
                            {...register('notes')}
                            rows={3}
                            placeholder="Ej. Muestra médica gratuita, Ajuste por conteo..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors resize-none"
                        />
                    </div>
                    {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary/20"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar Ingreso
                    </button>
                </div>
            </form>
        </Modal>
    );
}
