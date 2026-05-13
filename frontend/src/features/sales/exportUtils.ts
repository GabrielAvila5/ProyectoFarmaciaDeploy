/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import * as XLSX from 'xlsx';
import type { SaleHistoryItem } from './salesHistoryApi';

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Exporta las ventas filtradas a un archivo Excel (.xlsx)
 */
export function exportToExcel(sales: SaleHistoryItem[], filename = 'historial_ventas') {
    const rows = sales.map((s) => ({
        'ID': `#${s.id.toString().padStart(4, '0')}`,
        'Fecha': formatDate(s.sale_date),
        'Vendedor': s.users.name,
        'Método de Pago': s.payment_method === 'card' ? 'Tarjeta' : 'Efectivo',
        'Total': parseFloat(s.total_amount),
        'Monto Recibido': s.amount_paid ? parseFloat(s.amount_paid) : '',
        'Cambio': s.amount_paid ? parseFloat(s.amount_paid) - parseFloat(s.total_amount) : '',
        'Estado': s.status === 'voided' ? 'Anulada' : 'Completada',
        'Productos': s.sale_items.map((i) => `${i.batches.products.name} x${i.quantity}`).join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ajustar anchos de columna
    ws['!cols'] = [
        { wch: 8 },  // ID
        { wch: 22 }, // Fecha
        { wch: 20 }, // Vendedor
        { wch: 15 }, // Método
        { wch: 12 }, // Total
        { wch: 15 }, // Monto Recibido
        { wch: 10 }, // Cambio
        { wch: 12 }, // Estado
        { wch: 40 }, // Productos
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exporta las ventas filtradas a PDF usando window.print() con estilos de impresión
 */
export function exportToPDF(sales: SaleHistoryItem[]) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = sales.map((s) => `
        <tr>
            <td>#${s.id.toString().padStart(4, '0')}</td>
            <td>${formatDate(s.sale_date)}</td>
            <td>${s.users.name}</td>
            <td>${s.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'}</td>
            <td style="text-align:right">${currencyFmt.format(parseFloat(s.total_amount))}</td>
            <td style="text-align:center">${s.status === 'voided' ? '❌ Anulada' : '✅'}</td>
        </tr>
    `).join('');

    const totalCompleted = sales
        .filter((s) => s.status !== 'voided')
        .reduce((sum, s) => sum + parseFloat(s.total_amount), 0);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Historial de Ventas - FarmaGestión</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1a1a1a; }
                h1 { font-size: 18px; margin-bottom: 4px; }
                .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { background: #f0f0f0; padding: 8px 6px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
                td { padding: 6px; border-bottom: 1px solid #eee; }
                .total-row { margin-top: 16px; text-align: right; font-size: 14px; font-weight: bold; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>📋 Historial de Ventas — FarmaGestión</h1>
            <p class="subtitle">Generado: ${new Date().toLocaleString('es-MX')} | ${sales.length} ventas</p>
            <table>
                <thead>
                    <tr><th>ID</th><th>Fecha</th><th>Vendedor</th><th>Método</th><th style="text-align:right">Total</th><th style="text-align:center">Estado</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p class="total-row">Total Ventas Completadas: ${currencyFmt.format(totalCompleted)}</p>
        </body>
        </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
}
