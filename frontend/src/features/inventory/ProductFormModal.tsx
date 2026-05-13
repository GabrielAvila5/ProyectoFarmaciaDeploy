/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Product } from '@/types';
import Modal from '@/components/ui/Modal';
import {
    createProductSchema,
    updateProductSchema,
    type CreateProductFormData,
    type UpdateProductFormData,
} from './productSchemas';
import { Package, Layers, Loader2, Truck, Tag, BellRing } from 'lucide-react';
import { useSuppliers } from '../restock/useSuppliers';

interface ProductFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProductFormData | UpdateProductFormData) => Promise<void>;
    product?: Product | null; // null = crear, Product = editar
    submitting: boolean;
}

const inputClasses =
    'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

const labelClasses = 'block text-sm font-medium text-foreground mb-1.5';

const errorClasses = 'text-xs text-destructive mt-1';

export default function ProductFormModal({
    open,
    onClose,
    onSubmit,
    product,
    submitting,
}: ProductFormModalProps) {
    const isEditing = !!product;
    const { suppliers } = useSuppliers();

    // Usar CreateProductFormData como tipo del formulario (es un superset de Update)
    const schema = isEditing ? updateProductSchema : createProductSchema;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<CreateProductFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema as any),
        defaultValues: isEditing
            ? {
                name: product?.name || '',
                description: product?.description || '',
                base_price: product?.base_price ? parseFloat(product.base_price) : undefined,
                category: product?.category || '',
                brand: product?.brand || '',
                supplier_id: product?.supplier_id || 0,
                min_stock: product?.min_stock || 10,
            }
            : {
                name: '',
                description: '',
                base_price: undefined,
                category: '',
                brand: '',
                supplier_id: 0,
                min_stock: 10,
                include_batch: false,
                batch: {
                    batch_number: '',
                    quantity: undefined,
                    expiry_date: '',
                    promo_price: undefined,
                    location: '',
                },
            },
    });

    // Reset con los valores correctos cuando cambia el producto o se abre/cierra
    useEffect(() => {
        if (open) {
            if (isEditing && product) {
                reset({
                    name: product.name,
                    description: product.description || '',
                    base_price: parseFloat(product.base_price),
                    category: product.category || '',
                    brand: product.brand || '',
                    supplier_id: product.supplier_id || 0,
                    min_stock: product.min_stock || 10,
                });
                reset({
                    name: '',
                    description: '',
                    base_price: undefined,
                    category: '',
                    brand: '',
                    supplier_id: 0,
                    min_stock: 10,
                    include_batch: false,
                    batch: {
                        batch_number: '',
                        quantity: undefined,
                        expiry_date: '',
                        promo_price: undefined,
                        location: '',
                    },
                });
            }
        }
    }, [open, product, isEditing, reset]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const includeBatch = !isEditing && watch('include_batch');

    const handleFormSubmit = async (data: CreateProductFormData) => {
        await onSubmit(data);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            description={
                isEditing
                    ? `Editando: ${product?.name}`
                    : 'Completa los datos del nuevo producto.'
            }
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                {/* Sección: Datos del producto */}
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                    <Package className="w-4 h-4" />
                    Información del Producto
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="sm:col-span-2">
                        <label className={labelClasses} htmlFor="product-name">
                            Nombre *
                        </label>
                        <input
                            id="product-name"
                            {...register('name')}
                            className={inputClasses}
                            placeholder="Ej: Paracetamol 500mg"
                        />
                        {errors.name && (
                            <p className={errorClasses}>{errors.name.message}</p>
                        )}
                    </div>

                    {/* Precio base */}
                    <div>
                        <label className={labelClasses} htmlFor="product-price">
                            Precio Base *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                $
                            </span>
                            <input
                                id="product-price"
                                type="number"
                                step="0.01"
                                {...register('base_price')}
                                className={`${inputClasses} pl-7`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.base_price && (
                            <p className={errorClasses}>{errors.base_price.message}</p>
                        )}
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className={labelClasses} htmlFor="product-category">
                            Categoría
                        </label>
                        <input
                            id="product-category"
                            {...register('category')}
                            className={inputClasses}
                            placeholder="Ej: Analgésicos"
                        />
                    </div>

                    {/* Marca */}
                    <div>
                        <label className={labelClasses} htmlFor="product-brand">
                            Marca (Opcional)
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                id="product-brand"
                                {...register('brand')}
                                className={`${inputClasses} pl-9`}
                                placeholder="Ej: Bayer"
                            />
                        </div>
                    </div>

                    {/* Proveedor */}
                    <div>
                        <label className={labelClasses} htmlFor="product-supplier">
                            Proveedor Preferido
                        </label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                id="product-supplier"
                                {...register('supplier_id', { valueAsNumber: true })}
                                className={`${inputClasses} pl-9 appearance-none`}
                            >
                                <option value={0}>Sin proveedor (Opcional)</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stock Mínimo */}
                    <div>
                        <label className={labelClasses} htmlFor="product-min-stock">
                            Stock Mínimo (Alerta)
                        </label>
                        <div className="relative">
                            <BellRing className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                id="product-min-stock"
                                type="number"
                                min="0"
                                {...register('min_stock', { valueAsNumber: true })}
                                className={`${inputClasses} pl-9`}
                                placeholder="10"
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="sm:col-span-2">
                        <label className={labelClasses} htmlFor="product-description">
                            Descripción
                        </label>
                        <textarea
                            id="product-description"
                            rows={2}
                            {...register('description')}
                            className={`${inputClasses} resize-none`}
                            placeholder="Descripción del producto (opcional)"
                        />
                    </div>
                </div>

                {/* Sección: Lote Inicial (solo en creación) */}
                {!isEditing && (
                    <>
                        <div className="border-t border-border pt-5">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        {...register('include_batch')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors"></div>
                                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Incluir Lote Inicial
                                    </span>
                                </div>
                            </label>
                        </div>

                        {includeBatch && (
                            <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/20 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Nº Lote */}
                                    <div>
                                        <label className={labelClasses} htmlFor="batch-number">
                                            Nº Lote *
                                        </label>
                                        <input
                                            id="batch-number"
                                            {...register('batch.batch_number')}
                                            className={inputClasses}
                                            placeholder="Ej: LOT-2026-001"
                                        />
                                        {errors.batch?.batch_number && (
                                            <p className={errorClasses}>
                                                {errors.batch.batch_number.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Cantidad */}
                                    <div>
                                        <label className={labelClasses} htmlFor="batch-quantity">
                                            Cantidad *
                                        </label>
                                        <input
                                            id="batch-quantity"
                                            type="number"
                                            {...register('batch.quantity')}
                                            className={inputClasses}
                                            placeholder="0"
                                        />
                                        {errors.batch?.quantity && (
                                            <p className={errorClasses}>
                                                {errors.batch.quantity.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Fecha caducidad */}
                                    <div>
                                        <label className={labelClasses} htmlFor="batch-expiry">
                                            Fecha Caducidad *
                                        </label>
                                        <input
                                            id="batch-expiry"
                                            type="date"
                                            {...register('batch.expiry_date')}
                                            className={inputClasses}
                                        />
                                        {errors.batch?.expiry_date && (
                                            <p className={errorClasses}>
                                                {errors.batch.expiry_date.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Precio promo */}
                                    <div>
                                        <label className={labelClasses} htmlFor="batch-promo">
                                            Precio Promo
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                $
                                            </span>
                                            <input
                                                id="batch-promo"
                                                type="number"
                                                step="0.01"
                                                {...register('batch.promo_price')}
                                                className={`${inputClasses} pl-7`}
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>

                                    {/* Ubicación */}
                                    <div className="sm:col-span-2">
                                        <label className={labelClasses} htmlFor="batch-location">
                                            Ubicación
                                        </label>
                                        <input
                                            id="batch-location"
                                            {...register('batch.location')}
                                            className={inputClasses}
                                            placeholder="Ej: Estante A-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
