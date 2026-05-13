/**
 * @fileoverview Layout principal responsivo.
 * En desktop: sidebar fijo con opción de colapsar.
 * En mobile: sidebar como drawer (overlay) que se abre con hamburguesa.
 */
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Detectar breakpoint móvil
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const handler = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
            if (e.matches) {
                setCollapsed(false);
                setMobileOpen(false);
            }
        };
        handler(mq);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Cerrar drawer al navegar en móvil
    useEffect(() => {
        if (isMobile) setMobileOpen(false);
    }, [location.pathname, isMobile]);

    return (
        <div className="min-h-screen bg-background">
            {/* Backdrop para móvil */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Sidebar
                collapsed={isMobile ? false : collapsed}
                onToggle={() => {
                    if (isMobile) {
                        setMobileOpen(false);
                    } else {
                        setCollapsed(!collapsed);
                    }
                }}
                isMobile={isMobile}
                mobileOpen={mobileOpen}
            />

            <div
                className={`transition-all duration-300 ${
                    isMobile
                        ? 'ml-0'
                        : collapsed
                            ? 'ml-[72px]'
                            : 'ml-64'
                }`}
            >
                <Header
                    isMobile={isMobile}
                    onMenuToggle={() => setMobileOpen(!mobileOpen)}
                />
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
