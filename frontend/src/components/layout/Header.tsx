/**
 * @fileoverview Header responsivo con botón hamburguesa en móvil.
 */
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Moon, Sun, Menu } from 'lucide-react';
import { useState } from 'react';

function getInitialTheme(): boolean {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        return true;
    }
    return false;
}

interface HeaderProps {
    isMobile?: boolean;
    onMenuToggle?: () => void;
}

export default function Header({ isMobile = false, onMenuToggle }: HeaderProps) {
    const { user, logout } = useAuth();
    const [dark, setDark] = useState(getInitialTheme);

    const toggleTheme = () => {
        setDark((d) => {
            const next = !d;
            if (next) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return next;
        });
    };

    return (
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-lg flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                {/* Hamburger button — solo en móvil */}
                {isMobile && (
                    <button
                        onClick={onMenuToggle}
                        className="p-2 -ml-1 rounded-xl hover:bg-muted transition-colors"
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-5 h-5 text-foreground" />
                    </button>
                )}
                <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                        Bienvenido de vuelta,
                    </h2>
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {user?.name ?? 'Usuario'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                {/* Dark mode toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 sm:p-2.5 rounded-xl hover:bg-muted transition-colors"
                    title={dark ? 'Modo claro' : 'Modo oscuro'}
                >
                    {dark ? (
                        <Sun className="w-5 h-5 text-amber-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-muted-foreground" />
                    )}
                </button>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
            </div>
        </header>
    );
}
