const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'types', 'index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace CriticalStock
content = content.replace(
`export interface CriticalStock {
    productId: number;
    productName: string;
    totalQuantity: number;
}`,
`export interface CriticalStock {
    productId: number;
    productName: string;
    totalQuantity: number;
    supplierName?: string;
}`
);

// Replace ExpiringBatch
content = content.replace(
`export interface ExpiringBatch {
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    productName: string;
}`,
`export interface ExpiringBatch {
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    productName: string;
    supplierName?: string;
}`
);

// Replace Product and Batch
content = content.replace(
`export interface Product {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    base_price: string; // Decimal comes as string from Prisma
    category: string | null;
    batches: Batch[];
}

export interface Batch {
    id: number;
    product_id: number;
    batch_number: string;
    quantity: number;
    expiry_date: string;
    promo_price: string | null;
    location: string | null;
}`,
`export interface Product {
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
    unit_cost?: string | null;
}

// --- Restock / Purchasing ---
export interface Supplier {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    lead_time_days: number | null;
    created_at?: string;
}

export type PurchaseOrderStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    unit_cost: string;
    products?: Product;
}

export interface PurchaseOrder {
    id: number;
    supplier_id: number;
    user_id: number;
    status: PurchaseOrderStatus;
    order_date: string;
    received_date: string | null;
    total_amount: string;
    suppliers?: Supplier;
    items?: PurchaseOrderItem[];
    users?: { id: number; name: string; email: string };
}`
);

// Fallback if Windows newline matching failed
if (!content.includes('export interface Supplier')) {
    // try to just replace lines using \r?\n
    console.log("Regex fallback logic...");
    // Just replace using regex
    content = content.replace(/export interface CriticalStock \{[\s\S]*?\}/, `export interface CriticalStock {
    productId: number;
    productName: string;
    totalQuantity: number;
    supplierName?: string;
}`);
    content = content.replace(/export interface ExpiringBatch \{[\s\S]*?\}/, `export interface ExpiringBatch {
    id: number;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    productName: string;
    supplierName?: string;
}`);
    content = content.replace(/export interface Product \{[\s\S]*?batches: Batch\[\];\s*\}/, `export interface Product {
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
}`);
    content = content.replace(/export interface Batch \{[\s\S]*?\}/, `export interface Batch {
    id: number;
    product_id: number;
    batch_number: string;
    quantity: number;
    expiry_date: string;
    promo_price: string | null;
    location: string | null;
    unit_cost?: string | null;
}

// --- Restock / Purchasing ---
export interface Supplier {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    lead_time_days: number | null;
    created_at?: string;
}

export type PurchaseOrderStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    unit_cost: string;
    products?: Product;
}

export interface PurchaseOrder {
    id: number;
    supplier_id: number;
    user_id: number;
    status: PurchaseOrderStatus;
    order_date: string;
    received_date: string | null;
    total_amount: string;
    suppliers?: Supplier;
    items?: PurchaseOrderItem[];
    users?: { id: number; name: string; email: string };
}`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Types updated.');
