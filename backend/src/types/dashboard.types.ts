/**
 * @fileoverview Definiciones de tipos, interfaces y estructuras compartidas de TypeScript para el backend.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
export interface IDashboardSummary {
    todaysSales: number;
    todaysNetUtility: number;
    todaysTaxes: number;
    todaysAppointments: number;
    criticalStock: IDashboardCriticalStock[];
    expiringBatches: IDashboardExpiringBatch[];
}

export interface IDashboardCriticalStock {
    productId: number;
    productName: string;
    totalQuantity: number;
    supplierName?: string;
}

export interface IDashboardExpiringBatch {
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string; // ISO String
    productName: string;
    supplierName?: string;
}
