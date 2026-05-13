/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from './useCart';
import { fetchProductCatalog, createSale } from './salesApi';
import ProductSearch from './ProductSearch';
import CartTable from './CartTable';
import CheckoutSummary from './CheckoutSummary';
import { toast } from 'sonner';
import {
    ShoppingCart,
    Loader2,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';

export default function SalesPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const cart = useCart();

    // Cargar catálogo de productos
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchProductCatalog();
            setProducts(data);
        } catch {
            setError('No se pudo cargar el catálogo de productos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Finalizar venta
    const handleCheckout = async (paymentMethod: 'cash' | 'card', amountPaid?: number) => {
        if (cart.isEmpty || !user) return;

        setSubmitting(true);
        try {
            await createSale({
                user_id: user.id,
                items: cart.items.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                })),
                payment_method: paymentMethod,
                amount_paid: amountPaid,
            });

            toast.success('¡Venta realizada exitosamente!', {
                description: `Total: $${cart.subtotal.toFixed(2)} — ${cart.totalItems} artículo${cart.totalItems !== 1 ? 's' : ''} • ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}`,
            });

            cart.clearCart();

            // Refrescar stock
            await loadProducts();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            const message =
                axiosErr?.response?.data?.message || axiosErr?.message || 'Error al procesar la venta';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // --- Loading state ---
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando catálogo...</p>
                </div>
            </div>
        );
    }

    // --- Error state ---
    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                        onClick={loadProducts}
                        className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <ShoppingCart className="w-7 h-7 text-primary" />
                        Punto de Venta
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Registra ventas y gestiona el cobro al cliente.
                    </p>
                </div>
                <button
                    onClick={loadProducts}
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground self-start"
                    title="Refrescar catálogo"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Izquierda: Búsqueda + Carrito (2/3) */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Buscador de productos */}
                    <ProductSearch
                        products={products}
                        onSelect={cart.addToCart}
                    />

                    {/* Tabla del carrito */}
                    <CartTable
                        items={cart.items}
                        onUpdateQuantity={cart.updateQuantity}
                        onRemove={cart.removeFromCart}
                    />
                </div>

                {/* Derecha: Resumen de pago (1/3) */}
                <div>
                    <CheckoutSummary
                        totalItems={cart.totalItems}
                        subtotal={cart.subtotal}
                        isEmpty={cart.isEmpty}
                        onCheckout={handleCheckout}
                        submitting={submitting}
                    />
                </div>
            </div>
        </div>
    );
}
