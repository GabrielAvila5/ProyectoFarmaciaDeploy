/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de sales.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useMemo } from 'react';
import {
    Receipt,
    ShoppingBag,
    Banknote,
    CreditCard,
    ArrowDownUp,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

interface CheckoutSummaryProps {
    totalItems: number;
    subtotal: number;
    isEmpty: boolean;
    onCheckout: (paymentMethod: 'cash' | 'card', amountPaid?: number) => Promise<void>;
    submitting: boolean;
}

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

export default function CheckoutSummary({
    totalItems,
    subtotal,
    isEmpty,
    onCheckout,
    submitting,
}: CheckoutSummaryProps) {
    const [amountReceived, setAmountReceived] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

    // Calculadora de cambio (solo para efectivo)
    const changeInfo = useMemo(() => {
        if (paymentMethod !== 'cash') return null;
        const received = parseFloat(amountReceived);
        if (isNaN(received) || received <= 0 || subtotal <= 0) {
            return null;
        }
        const change = received - subtotal;
        return {
            sufficient: change >= 0,
            amount: change,
        };
    }, [amountReceived, subtotal, paymentMethod]);

    // Validación: efectivo necesita monto suficiente
    const canCheckout = useMemo(() => {
        if (isEmpty) return false;
        if (paymentMethod === 'cash') {
            const received = parseFloat(amountReceived);
            return !isNaN(received) && received >= subtotal;
        }
        return true; // Tarjeta no requiere monto manual
    }, [isEmpty, paymentMethod, amountReceived, subtotal]);

    const handleCheckout = async () => {
        const amountPaid = paymentMethod === 'cash' ? parseFloat(amountReceived) : undefined;
        await onCheckout(paymentMethod, amountPaid);
        setAmountReceived('');
        setPaymentMethod('cash');
    };

    return (
        <div className="rounded-xl bg-card border border-border overflow-hidden h-fit sticky top-24">
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-foreground">Resumen de Venta</h2>
                    <p className="text-xs text-muted-foreground">
                        Detalle del cobro actual
                    </p>
                </div>
            </div>

            {/* Resumen */}
            <div className="p-5 space-y-4">
                {/* Items count */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShoppingBag className="w-4 h-4" />
                        Artículos
                    </div>
                    <span className="text-sm font-semibold text-foreground">{totalItems}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-border"></div>

                {/* Total */}
                <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                        {currencyFmt.format(subtotal)}
                    </span>
                </div>

                {/* Método de pago */}
                {!isEmpty && (
                    <div className="space-y-3 pt-2">
                        <div className="border-t border-border pt-4">
                            <label className="text-sm font-medium text-foreground mb-2.5 block">
                                Método de Pago
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                        paymentMethod === 'cash'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                            : 'border-border text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    <Banknote className="w-4 h-4" />
                                    Efectivo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                        paymentMethod === 'card'
                                            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 shadow-sm'
                                            : 'border-border text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Tarjeta
                                </button>
                            </div>
                        </div>

                        {/* Campo de efectivo recibido (solo para efectivo) */}
                        {paymentMethod === 'cash' && (
                            <div>
                                <label
                                    htmlFor="amount-received"
                                    className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
                                >
                                    <Banknote className="w-4 h-4 text-primary" />
                                    Efectivo Recibido
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        $
                                    </span>
                                    <input
                                        id="amount-received"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amountReceived}
                                        onChange={(e) => setAmountReceived(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Resultado del cambio (solo efectivo) */}
                        {changeInfo && (
                            <div
                                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                                    changeInfo.sufficient
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                                        : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowDownUp
                                        className={`w-4 h-4 ${
                                            changeInfo.sufficient
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}
                                    />
                                    <span
                                        className={`text-sm font-medium ${
                                            changeInfo.sufficient
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : 'text-red-700 dark:text-red-400'
                                        }`}
                                    >
                                        {changeInfo.sufficient ? 'Cambio a entregar' : 'Monto insuficiente'}
                                    </span>
                                </div>
                                <span
                                    className={`text-lg font-bold ${
                                        changeInfo.sufficient
                                            ? 'text-emerald-700 dark:text-emerald-400'
                                            : 'text-red-700 dark:text-red-400'
                                    }`}
                                >
                                    {currencyFmt.format(Math.abs(changeInfo.amount))}
                                </span>
                            </div>
                        )}

                        {/* Tarjeta info message */}
                        {paymentMethod === 'card' && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-sm text-blue-700 dark:text-blue-400">
                                    El cobro con tarjeta se registrará por el total exacto.
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Botón de checkout */}
                <button
                    onClick={handleCheckout}
                    disabled={!canCheckout || submitting}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Finalizar Venta
                        </>
                    )}
                </button>

                {isEmpty && (
                    <p className="text-xs text-center text-muted-foreground">
                        Agrega productos al carrito para poder finalizar la venta.
                    </p>
                )}
            </div>
        </div>
    );
}
