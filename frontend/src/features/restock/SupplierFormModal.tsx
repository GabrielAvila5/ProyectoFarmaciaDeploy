import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import { User, Phone, Mail, Clock, Loader2 } from 'lucide-react';
import { supplierSchema, type SupplierFormData } from './supplierSchemas';
import type { Supplier } from '@/types';

interface SupplierFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: SupplierFormData) => Promise<void>;
    supplier: Supplier | null;
    submitting: boolean;
}

export default function SupplierFormModal({
    open,
    onClose,
    onSubmit,
    supplier,
    submitting,
}: SupplierFormModalProps) {
    const isEditing = !!supplier;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SupplierFormData>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: '',
            contact_name: '',
            phone: '',
            email: '',
            lead_time_days: undefined,
        },
    });

    useEffect(() => {
        if (open) {
            if (supplier) {
                reset({
                    name: supplier.name,
                    contact_name: supplier.contact_name || '',
                    phone: supplier.phone || '',
                    email: supplier.email || '',
                    lead_time_days: supplier.lead_time_days || undefined,
                });
            } else {
                reset({
                    name: '',
                    contact_name: '',
                    phone: '',
                    email: '',
                    lead_time_days: undefined,
                });
            }
        }
    }, [open, supplier, reset]);

    const handleFormSubmit = async (data: SupplierFormData) => {
        // Convert empty strings to undefined to avoid validation issues if backend expects optional fields
        const cleanedData = {
            ...data,
            lead_time_days: Number.isNaN(data.lead_time_days) ? undefined : data.lead_time_days,
            email: data.email === '' ? undefined : data.email
        };
        await onSubmit(cleanedData as SupplierFormData);
    };

    return (
        <Modal 
            open={open} 
            onClose={onClose} 
            title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4" id="supplier-form">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Nombre del Proveedor *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                {...register('name')}
                                type="text"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Ej. Distribuidora Médica S.A."
                            />
                        </div>
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Persona de Contacto
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                {...register('contact_name')}
                                type="text"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    {...register('phone')}
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="55 1234 5678"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Correo E.</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="contacto@empresa.com"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Tiempo de entrega (días)
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                {...register('lead_time_days', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Ej. 3"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Opcional. Estimado de días que tarda en surtir.</p>
                        {errors.lead_time_days && <p className="text-xs text-destructive">{errors.lead_time_days.message}</p>}
                    </div>

                </form>

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
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
                        form="supplier-form"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
                    </button>
                </div>
        </Modal>
    );
}
