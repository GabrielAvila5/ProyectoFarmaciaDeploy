import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import { Loader2, Calendar } from 'lucide-react';
import { receivePurchaseOrderSchema, type ReceivePurchaseOrderFormData } from './purchaseOrderSchemas';
import type { PurchaseOrder } from '@/types';

interface ReceiveOrderModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    order: PurchaseOrder | null;
    submitting: boolean;
}

export default function ReceiveOrderModal({
    open,
    onClose,
    onSubmit,
    order,
    submitting,
}: ReceiveOrderModalProps) {
    
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ReceivePurchaseOrderFormData>({
        resolver: zodResolver(receivePurchaseOrderSchema),
        defaultValues: {
            items: [],
        },
    });

    const { fields } = useFieldArray({
        control,
        name: 'items'
    });

    useEffect(() => {
        if (open && order && order.items) {
            // Predate the form with the order items
            reset({
                items: order.items.map(item => ({
                    purchase_order_item_id: item.id,
                    batch_number: '',
                    expiry_date: '',
                    _productName: item.product?.name || 'Producto Desconocido',
                    _quantity: item.quantity,
                })) as any
            });
        }
    }, [open, order, reset]);

    const handleFormSubmit = async (data: ReceivePurchaseOrderFormData) => {
        // Enviar solo los campos necesarios, desechando los campos _ (UI)
        const payload = {
            items: data.items.map(item => ({
                purchase_order_item_id: item.purchase_order_item_id,
                batch_number: item.batch_number,
                expiry_date: new Date(item.expiry_date).toISOString()
            }))
        };
        await onSubmit(payload);
    };

    if (!order) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Recibir Orden: OC-${order.id.toString().padStart(4, '0')}`}
            maxWidth="max-w-3xl"
        >
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-2">
                    Ingresa el <strong>Número de Lote</strong> y la <strong>Fecha de Caducidad</strong> para cada producto físico que estás recibiendo. Esto creará el inventario en automático.
                </div>

                <form id="receive-po-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[60vh] overflow-y-auto px-1">
                    
                    <div className="space-y-4">
                        {fields.map((field: any, index) => (
                            <div key={field.id} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <div className="flex justify-between items-center mb-3 border-b border-border pb-2">
                                    <h4 className="font-semibold text-foreground">{field._productName}</h4>
                                    <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium text-center">
                                        Entran: {field._quantity} un.
                                    </span>
                                </div>
                                
                                <input type="hidden" {...register(`items.${index}.purchase_order_item_id`, { valueAsNumber: true })} />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Número de Lote *</label>
                                        <input
                                            {...register(`items.${index}.batch_number`)}
                                            type="text"
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary text-sm uppercase"
                                            placeholder="EJ. L2024XX"
                                        />
                                        {errors.items?.[index]?.batch_number && <p className="text-[10px] text-destructive">{errors.items[index]?.batch_number?.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Fecha de Caducidad *</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                {...register(`items.${index}.expiry_date`)}
                                                type="date"
                                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary text-sm"
                                            />
                                        </div>
                                        {errors.items?.[index]?.expiry_date && <p className="text-[10px] text-destructive">{errors.items[index]?.expiry_date?.message}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </form>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
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
                        form="receive-po-form"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary/20"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar e Ingresar Inventario
                    </button>
                </div>
        </Modal>
    );
}
