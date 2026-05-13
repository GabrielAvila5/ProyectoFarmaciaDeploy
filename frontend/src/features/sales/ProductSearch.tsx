/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Product, Batch } from '@/types';
import { Search, Package, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { normalizeText } from '@/lib/normalizeText';

interface ProductSearchProps {
    products: Product[];
    onSelect: (product: Product) => string | null;
}

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

function getTotalStock(product: Product): number {
    return product.batches.reduce((sum, b) => sum + b.quantity, 0);
}

// Obtiene el lote FEFO (First Expired, First Out) con stock disponible
function getFefoBatch(product: Product): Batch | null {
    const available = product.batches
        .filter((b) => b.quantity > 0)
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
    return available.length > 0 ? available[0] : null;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function ProductSearch({ products, onSelect }: ProductSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filtrar productos por nombre o SKU
    const filtered = query.trim().length > 0
        ? products.filter(
            (p) => {
                const q = normalizeText(query);
                return normalizeText(p.name).includes(q) ||
                    normalizeText(p.sku).includes(q) ||
                    (p.brand && normalizeText(p.brand).includes(q));
            }
        ).slice(0, 8) // Máximo 8 resultados
        : [];

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Limpiar error después de 3 segundos
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSelect = useCallback((product: Product) => {
        const err = onSelect(product);
        if (err) {
            setError(err);
        } else {
            setError(null);
        }
        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    }, [onSelect]);

    return (
        <div ref={wrapperRef} className="relative">
            {/* Input de búsqueda */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => query.trim() && setIsOpen(true)}
                    placeholder="Buscar producto por nombre o SKU..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    autoComplete="off"
                />
            </div>

            {/* Error de stock */}
            {error && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{error}</p>
                </div>
            )}

            {/* Dropdown de resultados */}
            {isOpen && query.trim() && (
                <div className="absolute z-50 top-full mt-2 w-full rounded-xl bg-card border border-border shadow-xl max-h-[320px] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No se encontraron productos.
                        </div>
                    ) : (
                        filtered.map((product) => {
                            const stock = getTotalStock(product);
                            const outOfStock = stock <= 0;

                            return (
                                <button
                                    key={product.id}
                                    onClick={() => !outOfStock && handleSelect(product)}
                                    disabled={outOfStock}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-border/50 last:border-b-0 ${
                                        outOfStock
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-muted/50 cursor-pointer'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Package className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {product.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {product.sku}
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs font-medium text-primary">
                                                {currencyFmt.format(parseFloat(product.base_price))}
                                            </span>
                                        </div>
                                        {/* Indicador FEFO: lote sugerido */}
                                        {(() => {
                                            const fefoBatch = getFefoBatch(product);
                                            if (!fefoBatch) return null;
                                            return (
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                                                        <Calendar className="w-3 h-3" />
                                                        Lote: {fefoBatch.batch_number} — Vence: {formatDate(fefoBatch.expiry_date)}
                                                    </span>
                                                    {fefoBatch.location && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                                                            <MapPin className="w-3 h-3" />
                                                            {fefoBatch.location}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                                        outOfStock
                                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                            : stock < 5
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                    }`}>
                                        {outOfStock ? 'Agotado' : `${stock} uds.`}
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
