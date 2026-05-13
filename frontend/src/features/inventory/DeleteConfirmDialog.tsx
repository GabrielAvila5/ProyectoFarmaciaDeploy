/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import Modal from '@/components/ui/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    productName: string;
    submitting: boolean;
}

export default function DeleteConfirmDialog({
    open,
    onClose,
    onConfirm,
    productName,
    submitting,
}: DeleteConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Eliminar Producto"
            maxWidth="max-w-md"
        >
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <p className="text-sm text-foreground mb-1">
                    ¿Estás seguro de que deseas eliminar?
                </p>
                <p className="text-base font-semibold text-foreground mb-1">
                    {productName}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                    Esta acción eliminará el producto y todos sus lotes asociados. No se puede deshacer.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
