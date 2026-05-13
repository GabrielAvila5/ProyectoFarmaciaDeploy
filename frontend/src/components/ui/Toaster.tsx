/**
 * @fileoverview Componente genérico de interfaz de usuario (UI), usado a lo largo de la aplicación.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
    return (
        <SonnerToaster
            position="top-right"
            toastOptions={{
                style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.05)',
                },
            }}
            richColors
            closeButton
        />
    );
}
