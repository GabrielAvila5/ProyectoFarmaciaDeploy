/**
 * @fileoverview Archivo fuente del frontend: index.ts.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
// ============================================
// Tipos compartidos entre Frontend y Backend
// ============================================

// --- Auth ---
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

// --- Dashboard ---
export interface DashboardSummary {
    todaysSales: number;
    todaysNetUtility: number;
    todaysTaxes: number;
    todaysAppointments: number;
    criticalStock: CriticalStock[];
    expiringBatches: ExpiringBatch[];
}

export interface CriticalStock {
    productId: number;
    productName: string;
    totalQuantity: number;
    supplierName?: string;
}

export interface ExpiringBatch {
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    productName: string;
    supplierName?: string;
}

// --- Products ---
export interface Product {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    base_price: string; // Decimal comes as string from Prisma
    category: string | null;
    brand: string | null;
    supplier_id: number | null;
    min_stock: number;
    batches: Batch[];
    suppliers?: Supplier | null;
}

export interface Batch {
    id: number;
    product_id: number;
    batch_number: string;
    quantity: number;
    expiry_date: string;
    promo_price: string | null;
    location: string | null;
    unit_cost: string | null;
}

// --- Patients ---
export interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string | null;
    medical_history: string | null;
    created_at: string;
}

// --- Appointments ---
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
    id: number;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    status: AppointmentStatus;
    created_at: string;
    patients?: Patient;
    users?: { id: number; name: string; email: string };
}

// --- Sales ---
export interface SaleItem {
    batch_id: number;
    quantity: number;
    price_at_sale: string;
}

export interface Sale {
    id: number;
    user_id: number;
    sale_date: string;
    total_amount: string;
    sale_items: SaleItem[];
}

// --- Restock ---
export interface Supplier {
    id: number;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    lead_time_days: number | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    _count?: {
        purchase_orders: number;
        products?: number;
    };
}

export type PurchaseOrderStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_cost: string;
    received_quantity: number;
    product?: Product;
}

export interface PurchaseOrder {
    id: number;
    supplier_id: number;
    user_id: number;
    order_date: string;
    expected_delivery_date: string | null;
    status: PurchaseOrderStatus;
    total_amount: string;
    notes: string | null;
    created_at: string;
    suppliers?: Supplier;
    items?: PurchaseOrderItem[];
}

export interface InventoryMovement {
    id: number;
    batch_id: number;
    user_id: number;
    movement_type: string;
    quantity: number;
    notes: string | null;
    created_at: string;
    batches?: Batch;
    users?: AuthUser;
}

// --- API Error ---
export interface ApiError {
    message: string;
    status?: number;
}
