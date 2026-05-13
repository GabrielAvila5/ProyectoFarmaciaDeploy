/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useMemo, useCallback } from 'react';
import type { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from './useProducts';
import type { CreateProductPayload } from './productApi';
import type { CreateProductFormData, UpdateProductFormData } from './productSchemas';
import { normalizeText } from '@/lib/normalizeText';
import ProductTable from './ProductTable';
import ProductFormModal from './ProductFormModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import DirectRestockModal from './DirectRestockModal';
import { quickRestock } from './stockApi';
import type { DirectRestockFormData } from './directRestockSchemas';
import { toast } from 'sonner';
import {
    Package,
    Plus,
    Search,
    Filter,
    Loader2,
    AlertTriangle,
    RefreshCw,
    PackagePlus,
} from 'lucide-react';

export default function ProductsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const {
        products,
        loading,
        error,
        categories,
        loadProducts,
        addProduct,
        editProduct,
        removeProduct,
    } = useProducts();

    // --- Búsqueda y filtros ---
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    // Obtener marcas únicas
    const brands = useMemo(() => {
        const uniqueBrands = new Set(products.map((p) => p.brand).filter(Boolean));
        return Array.from(uniqueBrands) as string[];
    }, [products]);

    // --- Modales ---
    const [formOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [restockTarget, setRestockTarget] = useState<Product | null>(null);
    const [isGlobalRestockOpen, setIsGlobalRestockOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Debounce de búsqueda (~300ms)
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearch(value);
            if (debounceTimer) clearTimeout(debounceTimer);
            const timer = setTimeout(() => setDebouncedSearch(value), 300);
            setDebounceTimer(timer);
        },
        [debounceTimer]
    );

    // Productos filtrados
    const filteredProducts = useMemo(() => {
        let result = products;

        // Filtrar por búsqueda (nombre o SKU)
        if (debouncedSearch.trim()) {
            const q = normalizeText(debouncedSearch.trim());
            result = result.filter(
                (p) =>
                    normalizeText(p.name).includes(q) ||
                    normalizeText(p.sku).includes(q) ||
                    (p.brand && normalizeText(p.brand).includes(q)) ||
                    (p.category && normalizeText(p.category).includes(q))
            );
        }

        // Filtrar por categoría
        if (categoryFilter) {
            result = result.filter((p) => p.category === categoryFilter);
        }

        // Filtrar por marca
        if (brandFilter) {
            result = result.filter((p) => p.brand === brandFilter);
        }

        return result;
    }, [products, debouncedSearch, categoryFilter, brandFilter]);

    // --- Handlers CRUD ---
    const handleOpenCreate = () => {
        setEditingProduct(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product);
        setFormOpen(true);
    };

    const handleOpenDelete = (product: Product) => {
        setDeleteTarget(product);
    };

    const handleOpenDirectRestock = (product: Product | null) => {
        setRestockTarget(product);
        setIsGlobalRestockOpen(true);
    };

    const handleFormSubmit = async (data: CreateProductFormData | UpdateProductFormData) => {
        setSubmitting(true);
        try {
            if (editingProduct) {
                // Modo edición
                await editProduct(editingProduct.id, {
                    name: data.name,
                    description: data.description || undefined,
                    base_price: data.base_price,
                    category: data.category || undefined,
                    brand: data.brand || undefined,
                    supplier_id: data.supplier_id || undefined,
                    min_stock: data.min_stock,
                });
                toast.success('Producto actualizado correctamente');
            } else {
                // Modo creación
                const createData = data as CreateProductFormData;
                const payload: CreateProductPayload = {
                    name: createData.name,
                    base_price: createData.base_price,
                    description: createData.description || undefined,
                    category: createData.category || undefined,
                    brand: createData.brand || undefined,
                    supplier_id: createData.supplier_id || undefined,
                    min_stock: createData.min_stock,
                };

                // Incluir lote inicial si está habilitado
                if (createData.include_batch && createData.batch) {
                    payload.batches = [
                        {
                            batch_number: createData.batch.batch_number,
                            quantity: createData.batch.quantity,
                            expiry_date: createData.batch.expiry_date,
                            ...(createData.batch.promo_price &&
                                typeof createData.batch.promo_price === 'number' && {
                                    promo_price: createData.batch.promo_price,
                                }),
                            ...(createData.batch.location && { location: createData.batch.location }),
                        },
                    ];
                }

                await addProduct(payload);
                toast.success('Producto creado exitosamente');
            }
            setFormOpen(false);
            setEditingProduct(null);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            const message =
                axiosErr?.response?.data?.message || axiosErr?.message || 'Error al guardar el producto';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setSubmitting(true);
        try {
            await removeProduct(deleteTarget.id);
            toast.success(`"${deleteTarget.name}" eliminado correctamente`);
            setDeleteTarget(null);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            const message =
                axiosErr?.response?.data?.message || axiosErr?.message || 'Error al eliminar el producto';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDirectRestockSubmit = async (data: DirectRestockFormData) => {
        setSubmitting(true);
        try {
            const res = await quickRestock(data);
            toast.success('Ingreso registrado exitosamente.');
            if (res.data?.priceUpdated) {
                toast.info(`Se actualizó el Precio Base a ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(res.data.newBasePrice)} debido al nuevo Costo Unitario.`);
            }
            setRestockTarget(null);
            loadProducts(); // Recargar productos para reflejar stock incrementado y nuevo lote
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            const message = axiosErr?.response?.data?.message || axiosErr?.message || 'Error al registrar el ingreso';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // --- Loading state ---
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando productos...</p>
                </div>
            </div>
        );
    }

    // --- Error state ---
    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                        onClick={loadProducts}
                        className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Package className="w-7 h-7 text-primary" />
                        Inventario de Productos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadProducts}
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Refrescar lista"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => handleOpenDirectRestock(null)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200 dark:border-emerald-500/20"
                            >
                                <PackagePlus className="w-4 h-4" />
                                Ingreso Rápido
                            </button>
                            <button
                                onClick={handleOpenCreate}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Producto
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Buscador */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>

                {/* Filtro de categoría */}
                <div className="relative sm:w-56">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro de marca */}
                <div className="relative sm:w-56">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                        <option value="">Todas las marcas</option>
                        {brands.map((brand) => (
                            <option key={brand} value={brand}>
                                {brand}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results counter */}
            {(debouncedSearch || categoryFilter || brandFilter) && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Mostrando <span className="font-semibold text-foreground">{filteredProducts.length}</span> de {products.length} producto{products.length !== 1 ? 's' : ''}
                    </p>
                    {(debouncedSearch || categoryFilter || brandFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setDebouncedSearch('');
                                setCategoryFilter('');
                                setBrandFilter('');
                            }}
                            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {/* Product Table */}
            <ProductTable
                products={filteredProducts}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onDirectRestock={handleOpenDirectRestock}
            />

            {/* Create/Edit Modal */}
            <ProductFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingProduct(null);
                }}
                onSubmit={handleFormSubmit}
                product={editingProduct}
                submitting={submitting}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                productName={deleteTarget?.name || ''}
                submitting={submitting}
            />

            {/* Direct Restock Modal */}
            <DirectRestockModal
                open={isGlobalRestockOpen}
                onClose={() => {
                    setIsGlobalRestockOpen(false);
                    setRestockTarget(null);
                }}
                onSubmit={handleDirectRestockSubmit}
                product={restockTarget}
                products={products}
                submitting={submitting}
            />
        </div>
    );
}
