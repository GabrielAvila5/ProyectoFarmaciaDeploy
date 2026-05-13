import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import type { PurchaseOrder } from '@/types';

interface UpdateDateModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (expected_date: string | null) => Promise<void>;
    order: PurchaseOrder;
    submitting: boolean;
}

export default function UpdateDateModal({
    open,
    onClose,
    onSubmit,
    order,
    submitting,
}: UpdateDateModalProps) {
    const [date, setDate] = useState('');

    useEffect(() => {
        if (open) {
            setDate(order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '');
        }
    }, [open, order]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(date || null);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Modificar Fecha Esperada"
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 py-4 px-1">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Fecha Esperada de Llegada
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground">
                        Déjalo en blanco si no hay una fecha definida aún.
                    </p>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar
                    </button>
                </div>
            </form>
        </Modal>
    );
}
