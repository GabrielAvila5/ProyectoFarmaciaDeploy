import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import { Loader2, Trash2, Search, Truck } from 'lucide-react';
import { createPurchaseOrderSchema, type CreatePurchaseOrderFormData } from './purchaseOrderSchemas';
import { useSuppliers } from './useSuppliers';
import { useProducts } from '@/features/inventory/useProducts';

interface CreateOrderModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    submitting: boolean;
}

export default function CreateOrderModal({
    open,
    onClose,
    onSubmit,
    submitting,
}: CreateOrderModalProps) {
    const { suppliers } = useSuppliers();
    const { products } = useProducts();
    const [searchProd, setSearchProd] = useState('');

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<CreatePurchaseOrderFormData>({
        resolver: zodResolver(createPurchaseOrderSchema),
        defaultValues: {
            supplier_id: 0,
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    });

    const watchItems = watch('items');
    const totalAmount = watchItems.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.unit_cost || 0)), 0);

    useEffect(() => {
        if (open) {
            reset({
                supplier_id: suppliers.length > 0 ? suppliers[0].id : 0,
                items: [],
            });
            setSearchProd('');
        }
    }, [open, reset, suppliers]);

    const handleFormSubmit = async (data: CreatePurchaseOrderFormData) => {
        // Formatear payload quitando variables UI-only
        const payload = {
            supplier_id: data.supplier_id,
            expected_delivery_date: data.expected_delivery_date || null,
            items: data.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost
            }))
        };
        await onSubmit(payload);
    };

    const addProductItem = (productId: number, productName: string) => {
        if (fields.some(f => f.product_id === productId)) return; // Ya está agregado
        append({
            product_id: productId,
            productName,
            quantity: '' as unknown as number,
            unit_cost: '' as unknown as number
        });
        setSearchProd('');
    };

    const filteredProds = products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Nueva Orden de Compra"
            maxWidth="max-w-2xl"
        >
            <form id="create-po-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Proveedor *
                        </label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                {...register('supplier_id', { valueAsNumber: true })}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 appearance-none outline-none"
                            >
                                <option value={0} disabled>Seleccione un proveedor</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        {errors.supplier_id && <p className="text-xs text-destructive">{errors.supplier_id.message}</p>}
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-sm font-medium text-foreground">
                            Fecha Esperada de Llegada (Opcional)
                        </label>
                        <input
                            type="date"
                            {...register('expected_delivery_date')}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        {errors.expected_delivery_date && <p className="text-xs text-destructive">{errors.expected_delivery_date.message}</p>}
                    </div>

                    <div className="border-t border-border pt-4 mt-4 relative">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Agregar Productos
                        </label>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchProd}
                                onChange={(e) => setSearchProd(e.target.value)}
                                placeholder="Buscar producto en inventario..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                            />
                            {searchProd && (
                                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredProds.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => addProductItem(p.id, p.name)}
                                            className="w-full text-left px-4 py-2 hover:bg-muted text-sm transition-colors text-foreground"
                                        >
                                            {p.name} <span className="text-muted-foreground text-xs ml-2">SKU: {p.sku}</span>
                                        </button>
                                    ))}
                                    {filteredProds.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-muted-foreground">No hay productos que coincidan.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {fields.length > 0 ? (
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-end bg-muted/30 p-3 rounded-xl border border-border">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground mb-2 truncate" title={field.productName}>
                                                {field.productName}
                                            </p>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-muted-foreground block mb-1">Costo Unit.</label>
                                            <input
                                                {...register(`items.${index}.unit_cost`, { valueAsNumber: true })}
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="Ej. 10"
                                                className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-muted-foreground block mb-1">Cantidad</label>
                                            <input
                                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                                type="number"
                                                min="1"
                                                placeholder="Ej. 50"
                                                className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed rounded-xl border-border bg-muted/20">
                                <p className="text-sm text-muted-foreground">Busque y seleccione productos arriba para agregarlos a la orden.</p>
                            </div>
                        )}
                        {errors.items && <p className="text-xs text-destructive mt-2">{errors.items.message}</p>}
                    </div>
                </form>

                <div className="flex justify-between items-center py-2 px-1 border-t border-border mt-2">
                    <span className="text-sm text-muted-foreground font-medium">Total Estimado</span>
                    <span className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}
                    </span>
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-border">
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
                        form="create-po-form"
                        disabled={submitting || fields.length === 0}
                        className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Crear Orden
                    </button>
                </div>
        </Modal>
    );
}
