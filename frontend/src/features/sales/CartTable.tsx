/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import type { CartItem } from './useCart';
import type { Batch } from '@/types';
import { Minus, Plus, Trash2, ShoppingCart, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CartTableProps {
    items: CartItem[];
    onUpdateQuantity: (productId: number, quantity: number) => string | null;
    onRemove: (productId: number) => void;
}

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

function getTotalStock(item: CartItem): number {
    return item.product.batches.reduce((sum, b) => sum + b.quantity, 0);
}

// Obtiene el lote FEFO con stock disponible
function getFefoBatch(item: CartItem): Batch | null {
    const available = item.product.batches
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

export default function CartTable({ items, onUpdateQuantity, onRemove }: CartTableProps) {
    if (items.length === 0) {
        return (
            <div className="rounded-xl bg-card border border-border p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">El carrito está vacío</h3>
                <p className="text-muted-foreground text-sm">
                    Busca un producto arriba para agregarlo a la venta.
                </p>
            </div>
        );
    }

    const handleQuantityChange = (productId: number, newQty: number) => {
        const err = onUpdateQuantity(productId, newQty);
        if (err) toast.warning(err);
    };

    return (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                P. Unitario
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Subtotal
                            </th>
                            <th className="w-12 py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item) => {
                            const lineTotal = item.unitPrice * item.quantity;
                            const maxStock = getTotalStock(item);
                            const atMax = item.quantity >= maxStock;

                            return (
                                <tr key={item.product.id} className="hover:bg-muted/20 transition-colors">
                                    {/* Producto + Guía de Picking FEFO */}
                                    <td className="py-3 px-4">
                                        <p className="text-sm font-medium text-foreground">
                                            {item.product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                            {item.product.sku}
                                        </p>
                                        {/* Guía de picking: ubicación y lote FEFO */}
                                        {(() => {
                                            const fefoBatch = getFefoBatch(item);
                                            if (!fefoBatch) return null;
                                            return (
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {fefoBatch.location && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md font-medium">
                                                            <MapPin className="w-3 h-3" />
                                                            {fefoBatch.location}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                                                        <Calendar className="w-3 h-3" />
                                                        {fefoBatch.batch_number} — {formatDate(fefoBatch.expiry_date)}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    {/* Cantidad con controles */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors"
                                                title="Reducir cantidad"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-10 text-center text-sm font-bold text-foreground">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                                                disabled={atMax}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                                    atMax
                                                        ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                                                        : 'bg-muted hover:bg-muted/80 text-foreground'
                                                }`}
                                                title={atMax ? 'Stock máximo alcanzado' : 'Aumentar cantidad'}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {atMax && (
                                            <p className="text-center text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                Máx. {maxStock}
                                            </p>
                                        )}
                                    </td>

                                    {/* Precio unitario */}
                                    <td className="py-3 px-4 text-right text-sm text-foreground">
                                        {currencyFmt.format(item.unitPrice)}
                                    </td>

                                    {/* Subtotal */}
                                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                                        {currencyFmt.format(lineTotal)}
                                    </td>

                                    {/* Eliminar */}
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => onRemove(item.product.id)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            title="Eliminar del carrito"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
