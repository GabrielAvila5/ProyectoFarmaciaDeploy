/**
 * @fileoverview Custom hook de React para encapsular lógica de estado y efectos de la característica de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useCallback, useMemo } from 'react';
import type { Product } from '@/types';

export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number; // precio base del producto
}

interface UseCartReturn {
    items: CartItem[];
    isEmpty: boolean;
    totalItems: number;
    subtotal: number;
    addToCart: (product: Product) => string | null; // retorna error string o null si OK
    updateQuantity: (productId: number, quantity: number) => string | null;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
}

// Calcula el stock total disponible de un producto
function getTotalStock(product: Product): number {
    return product.batches.reduce((sum, b) => sum + b.quantity, 0);
}

export function useCart(): UseCartReturn {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = useCallback((product: Product): string | null => {
        const totalStock = getTotalStock(product);

        if (totalStock <= 0) {
            return `"${product.name}" no tiene stock disponible.`;
        }

        setItems((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);

            if (existing) {
                // Verificar si ya está al máximo
                if (existing.quantity >= totalStock) {
                    return prev; // No cambia — retornamos error abajo
                }
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    product,
                    quantity: 1,
                    unitPrice: parseFloat(product.base_price),
                },
            ];
        });

        // Verificar si ya estaba al máximo (para mostrar el error)
        const existing = items.find((item) => item.product.id === product.id);
        if (existing && existing.quantity >= totalStock) {
            return `Stock máximo alcanzado para "${product.name}" (${totalStock} uds.)`;
        }

        return null;
    }, [items]);

    const updateQuantity = useCallback((productId: number, quantity: number): string | null => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((item) => item.product.id !== productId));
            return null;
        }

        const item = items.find((i) => i.product.id === productId);
        if (!item) return null;

        const totalStock = getTotalStock(item.product);
        if (quantity > totalStock) {
            return `Stock máximo: ${totalStock} uds. disponibles.`;
        }

        setItems((prev) =>
            prev.map((i) =>
                i.product.id === productId ? { ...i, quantity } : i
            )
        );
        return null;
    }, [items]);

    const removeFromCart = useCallback((productId: number) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const isEmpty = items.length === 0;

    const totalItems = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items]
    );

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        [items]
    );

    return {
        items,
        isEmpty,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };
}
