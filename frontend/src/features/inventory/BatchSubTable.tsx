/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import type { Batch } from '@/types';
import { Calendar, MapPin, Tag } from 'lucide-react';

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

interface BatchSubTableProps {
    batches: Batch[];
}

function getDaysUntilExpiry(expiryDate: string): number {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getExpiryBadge(daysLeft: number) {
    if (daysLeft <= 0) {
        return { text: 'Vencido', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' };
    }
    if (daysLeft <= 30) {
        return { text: `${daysLeft}d`, className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' };
    }
    if (daysLeft <= 90) {
        return { text: `${daysLeft}d`, className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' };
    }
    return { text: `${daysLeft}d`, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' };
}

export default function BatchSubTable({ batches }: BatchSubTableProps) {
    if (batches.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground text-sm">
                Este producto no tiene lotes registrados.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-muted/30">
                        <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Nº Lote
                        </th>
                        <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Cantidad
                        </th>
                        <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Vencimiento
                            </span>
                        </th>
                        <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" /> Precio Promo
                            </span>
                        </th>
                        <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> Ubicación
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {batches.map((batch) => {
                        const daysLeft = getDaysUntilExpiry(batch.expiry_date);
                        const badge = getExpiryBadge(daysLeft);

                        return (
                            <tr
                                key={batch.id}
                                className="hover:bg-muted/20 transition-colors"
                            >
                                <td className="py-2.5 px-5 text-sm font-mono text-foreground">
                                    {batch.batch_number}
                                </td>
                                <td className="py-2.5 px-5 text-right text-sm font-semibold text-foreground">
                                    {batch.quantity} uds.
                                </td>
                                <td className="py-2.5 px-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-foreground">
                                            {new Date(batch.expiry_date).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}>
                                            {badge.text}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2.5 px-5 text-right text-sm text-foreground">
                                    {batch.promo_price
                                        ? currencyFmt.format(parseFloat(batch.promo_price))
                                        : <span className="text-muted-foreground">—</span>
                                    }
                                </td>
                                <td className="py-2.5 px-5 text-sm text-foreground">
                                    {batch.location || <span className="text-muted-foreground">—</span>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
