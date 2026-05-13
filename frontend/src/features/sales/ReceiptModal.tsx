/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import type { SaleHistoryItem } from './salesHistoryApi';
import { X, Printer } from 'lucide-react';

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
});

interface ReceiptModalProps {
    sale: SaleHistoryItem;
    onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
    const totalAmount = parseFloat(sale.total_amount);
    const amountPaid = sale.amount_paid ? parseFloat(sale.amount_paid) : null;
    const change = amountPaid !== null ? amountPaid - totalAmount : null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const items = sale.sale_items.map((item) => `
            <tr>
                <td style="padding:3px 0;font-size:11px">${item.batches.products.name}</td>
                <td style="padding:3px 0;font-size:11px;text-align:center">${item.quantity}</td>
                <td style="padding:3px 0;font-size:11px;text-align:right">${currencyFmt.format(parseFloat(item.price_at_sale) * item.quantity)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Ticket #${sale.id}</title>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; width:280px; margin:0 auto; padding:10px; color:#000; }
    .center { text-align:center; }
    .line { border-top:1px dashed #000; margin:6px 0; }
    h1 { font-size:16px; margin-bottom:2px; }
    .info { font-size:10px; color:#444; }
    table { width:100%; border-collapse:collapse; }
    th { font-size:10px; text-align:left; padding:3px 0; border-bottom:1px solid #000; }
    .total-row { font-size:13px; font-weight:bold; }
    .footer { font-size:9px; color:#888; margin-top:8px; }
    @media print { body { width:auto; } @page { size:80mm auto; margin:2mm; } }
</style></head>
<body>
    <div class="center">
        <h1>FarmaGestión</h1>
        <p class="info">Sistema de Gestión Farmacéutica</p>
    </div>
    <div class="line"></div>
    <p style="font-size:11px"><strong>Ticket:</strong> #${sale.id.toString().padStart(4, '0')}</p>
    <p style="font-size:11px"><strong>Fecha:</strong> ${new Date(sale.sale_date).toLocaleString('es-MX')}</p>
    <p style="font-size:11px"><strong>Atendió:</strong> ${sale.users.name}</p>
    ${sale.status === 'voided' ? '<p style="font-size:12px;color:red;font-weight:bold;text-align:center;margin:4px 0">*** VENTA ANULADA ***</p>' : ''}
    <div class="line"></div>
    <table>
        <thead><tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Importe</th></tr></thead>
        <tbody>${items}</tbody>
    </table>
    <div class="line"></div>
    <table>
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${currencyFmt.format(totalAmount)}</td></tr>
        ${amountPaid !== null ? `<tr><td style="font-size:11px">Pago (${sale.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'})</td><td style="text-align:right;font-size:11px">${currencyFmt.format(amountPaid)}</td></tr>` : ''}
        ${change !== null && change >= 0 ? `<tr><td style="font-size:11px">Cambio</td><td style="text-align:right;font-size:11px">${currencyFmt.format(change)}</td></tr>` : ''}
    </table>
    <div class="line"></div>
    <p class="center footer">¡Gracias por su compra!</p>
    <p class="center footer">${new Date().toLocaleDateString('es-MX')}</p>
</body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-[340px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Ticket de Venta</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Ticket content */}
                <div className="px-5 py-4 space-y-3 font-mono text-sm">
                    <div className="text-center">
                        <p className="text-base font-bold text-foreground">FarmaGestión</p>
                        <p className="text-xs text-muted-foreground">Sistema de Gestión Farmacéutica</p>
                    </div>

                    <div className="border-t border-dashed border-border"></div>

                    <div className="space-y-1 text-xs">
                        <p><span className="text-muted-foreground">Ticket:</span> <span className="font-bold text-primary">#{sale.id.toString().padStart(4, '0')}</span></p>
                        <p><span className="text-muted-foreground">Fecha:</span> {new Date(sale.sale_date).toLocaleString('es-MX')}</p>
                        <p><span className="text-muted-foreground">Atendió:</span> {sale.users.name}</p>
                    </div>

                    {sale.status === 'voided' && (
                        <div className="text-center py-1 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-500/10 rounded-lg">
                            *** VENTA ANULADA ***
                        </div>
                    )}

                    <div className="border-t border-dashed border-border"></div>

                    {/* Items */}
                    <div className="space-y-2">
                        {sale.sale_items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{item.batches.products.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.quantity} × {currencyFmt.format(parseFloat(item.price_at_sale))}</p>
                                </div>
                                <p className="text-xs font-semibold text-foreground ml-2">
                                    {currencyFmt.format(parseFloat(item.price_at_sale) * item.quantity)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-border"></div>

                    {/* Totals */}
                    <div className="space-y-1">
                        <div className="flex justify-between font-bold text-base">
                            <span>TOTAL</span>
                            <span className="text-primary">{currencyFmt.format(totalAmount)}</span>
                        </div>
                        {amountPaid !== null && (
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Pago ({sale.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'})</span>
                                <span>{currencyFmt.format(amountPaid)}</span>
                            </div>
                        )}
                        {change !== null && change >= 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Cambio</span>
                                <span className="text-emerald-600 font-semibold">{currencyFmt.format(change)}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-border"></div>
                    <p className="text-center text-[10px] text-muted-foreground">¡Gracias por su compra!</p>
                </div>

                {/* Print button */}
                <div className="px-5 pb-4">
                    <button onClick={handlePrint}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                        <Printer className="w-4 h-4" /> Imprimir Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}
