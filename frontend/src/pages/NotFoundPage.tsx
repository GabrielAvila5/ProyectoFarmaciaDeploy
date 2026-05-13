/**
 * @fileoverview Componente de vista principal (Página) que agrupa características y se mapea a una ruta específica.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-8xl font-black text-primary/20 mb-4">404</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
                Página no encontrada
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                La página que buscas no existe o ha sido movida.
            </p>
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
                <Home className="w-4 h-4" />
                Ir al Dashboard
            </Link>
        </div>
    );
}
