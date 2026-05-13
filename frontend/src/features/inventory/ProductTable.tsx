/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, Fragment } from 'react';
import type { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import BatchSubTable from './BatchSubTable';
import {
    ChevronDown,
    Pencil,
    Trash2,
    SearchX,
    PackagePlus,
} from 'lucide-react';

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onDirectRestock: (product: Product) => void;
}

// Calcula el stock total sumando la cantidad de todos los lotes
function getTotalStock(product: Product): number {
    return product.batches.reduce((sum, b) => sum + b.quantity, 0);
}

// Calcula los días mínimos hasta el vencimiento del lote más próximo
function getMinDaysToExpiry(product: Product): number | null {
    if (product.batches.length === 0) return null;
    const now = Date.now();
    const days = product.batches.map((b) =>
        Math.ceil((new Date(b.expiry_date).getTime() - now) / (1000 * 60 * 60 * 24))
    );
    return Math.min(...days);
}

// Determina el nivel de alerta del producto
function getStockStatus(product: Product): 'critical' | 'warning' | 'ok' {
    const totalStock = getTotalStock(product);
    const minDays = getMinDaysToExpiry(product);
    const minStock = product.min_stock || 10;

    if (totalStock < minStock || (minDays !== null && minDays < 30)) return 'critical';
    if (totalStock < (minStock * 2) || (minDays !== null && minDays < 90)) return 'warning';
    return 'ok';
}

const statusConfig = {
    critical: {
        label: 'Crítico',
        className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        dot: 'bg-red-500',
    },
    warning: {
        label: 'Precaución',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        dot: 'bg-amber-500',
    },
    ok: {
        label: 'Normal',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
};

export default function ProductTable({ products, onEdit, onDelete, onDirectRestock }: ProductTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    if (products.length === 0) {
        return (
            <div className="rounded-xl bg-card border border-border p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <SearchX className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No se encontraron productos</h3>
                <p className="text-muted-foreground text-sm">
                    Intenta con otro término de búsqueda o cambia los filtros aplicados.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="w-10 py-3.5 px-3"></th>
                            <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                SKU
                            </th>
                            <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Marca
                            </th>
                            <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Categoría
                            </th>
                            <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Precio Base
                            </th>
                            <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Stock Total
                            </th>
                            <th className="text-center py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Estado
                            </th>
                            {isAdmin && (
                                <th className="text-center py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {products.map((product) => {
                            const totalStock = getTotalStock(product);
                            const status = getStockStatus(product);
                            const config = statusConfig[status];
                            const isExpanded = expandedId === product.id;

                            return (
                                <Fragment key={product.id}>
                                    <tr
                                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                                        onClick={() => toggleExpand(product.id)}
                                    >
                                        {/* Expand arrow */}
                                        <td className="py-3 px-3 text-center">
                                            <ChevronDown
                                                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 mx-auto ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </td>

                                        {/* SKU */}
                                        <td className="py-3 px-4">
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                                {product.sku}
                                            </span>
                                        </td>

                                        {/* Nombre */}
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {product.name}
                                                </p>
                                                {product.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Marca */}
                                        <td className="py-3 px-4">
                                            {product.brand ? (
                                                <span className="text-xs text-foreground font-medium bg-muted/50 px-2 py-1 rounded-md border border-border">
                                                    {product.brand}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>

                                        {/* Categoría */}
                                        <td className="py-3 px-4">
                                            {product.category ? (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {product.category}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>

                                        {/* Precio Base */}
                                        <td className="py-3 px-4 text-sm text-foreground">
                                            {currencyFmt.format(parseFloat(product.base_price))}
                                        </td>

                                        {/* Stock Total */}
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-sm font-bold text-foreground">
                                                {totalStock}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                uds.
                                            </span>
                                        </td>

                                        {/* Estado Badge */}
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                                                {config.label}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        {isAdmin && (
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => onDirectRestock(product)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
                                                        title="Ingreso Rápido"
                                                    >
                                                        <PackagePlus className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onEdit(product)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                        title="Editar producto"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(product)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                        title="Eliminar producto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>

                                    {/* Fila expandida con sub-tabla de lotes */}
                                    {isExpanded && (
                                        <tr>
                                            <td
                                                colSpan={isAdmin ? 8 : 7}
                                                className="bg-muted/10 px-4 py-3 border-t border-border/50"
                                            >
                                                <div className="ml-8 rounded-xl border border-border/50 bg-card overflow-hidden">
                                                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Lotes — {product.batches.length} registrado{product.batches.length !== 1 ? 's' : ''}
                                                        </h4>
                                                    </div>
                                                    <BatchSubTable batches={product.batches} />
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
    );
}

