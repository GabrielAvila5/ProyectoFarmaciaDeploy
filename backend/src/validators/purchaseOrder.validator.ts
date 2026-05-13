import { z } from 'zod';

export const createPurchaseOrderItemSchema = z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unit_cost: z.number().positive(),
});

export const createPurchaseOrderSchema = z.object({
    supplier_id: z.number().int().positive(),
    user_id: z.number().int().positive().optional(),
    expected_delivery_date: z.string().optional().nullable(),
    items: z.array(createPurchaseOrderItemSchema).min(1, 'La orden debe tener al menos un producto'),
});

export const receivePurchaseOrderItemSchema = z.object({
    purchase_order_item_id: z.number().int().positive(),
    batch_number: z.string().min(1, 'El número de lote es obligatorio'),
    expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
    location: z.string().optional().nullable(),
});

export const receivePurchaseOrderSchema = z.object({
    items: z.array(receivePurchaseOrderItemSchema).min(1, 'Se requiere información de lote para recibir'),
});

export const updateExpectedDateSchema = z.object({
    expected_delivery_date: z.string().nullable(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
export type UpdateExpectedDateInput = z.infer<typeof updateExpectedDateSchema>;
