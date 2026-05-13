/**
 * @fileoverview Componente de vista principal (Página) que agrupa características y se mapea a una ruta específica.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
    title: string;
    description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Construction className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground mb-8 max-w-md">{description}</p>
            <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm"
            >
                Volver al Dashboard
            </Link>
        </div>
    );
}
