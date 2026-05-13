import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
    supplier_id: z.number().int().positive('Selecciona un proveedor'),
    expected_delivery_date: z.string().optional(),
    items: z.array(z.object({
        product_id: z.number().int().positive('Producto requerido'),
        quantity: z.number().int().positive('Cantidad requerida'),
        unit_cost: z.number().positive('Costo requerido'),
        productName: z.string().optional() // Solo para UI
    })).min(1, 'Agrega al menos un producto a la orden')
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;

export const receivePurchaseOrderSchema = z.object({
    items: z.array(z.object({
        purchase_order_item_id: z.number().int(),
        batch_number: z.string().min(1, 'Número de lote requerido'),
        expiry_date: z.string().min(1, 'Fecha expiración requerida')
    }))
});

export type ReceivePurchaseOrderFormData = z.infer<typeof receivePurchaseOrderSchema>;
