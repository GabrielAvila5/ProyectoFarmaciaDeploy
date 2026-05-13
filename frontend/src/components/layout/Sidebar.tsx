/**
 * @fileoverview Sidebar responsivo con navegación filtrada por rol del usuario.
 * 
 * Desktop: sidebar fijo con collapse/expand.
 * Mobile: drawer overlay que se desliza desde la izquierda.
 * 
 * Roles:
 *   - admin: Ve todas las opciones
 *   - employee (cajero): Ve Dashboard, Productos, Proveedores, Compras, Punto de Venta, Historial, Corte de Caja
 *   - doctor: Ve Dashboard, Pacientes, Citas
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { DashboardSummary } from '@/types';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    CalendarDays,
    ChevronLeft,
    ShieldCheck,
    History,
    UserCog,
    AlertTriangle,
    Truck,
    ShoppingBag,
    Landmark,
    X,
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    isMobile?: boolean;
    mobileOpen?: boolean;
}

type SystemRole = 'admin' | 'employee' | 'doctor';

interface NavItem {
    path: string;
    label: string;
    icon: any;
    /** Roles que pueden ver este item. Si no se especifica, todos lo ven. */
    roles?: SystemRole[];
    stockBadge?: boolean;
    /** Sección separadora antes de este item */
    section?: string;
}

const navItems: NavItem[] = [
    // --- General ---
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

    // --- Farmacia / Inventario ---
    { path: '/productos', label: 'Productos', icon: Package, roles: ['admin', 'employee'], stockBadge: true, section: 'Farmacia' },
    { path: '/proveedores', label: 'Proveedores', icon: Truck, roles: ['admin', 'employee'] },
    { path: '/compras', label: 'Compras', icon: ShoppingBag, roles: ['admin', 'employee'] },

    // --- Ventas ---
    { path: '/ventas', label: 'Punto de Venta', icon: ShoppingCart, roles: ['admin', 'employee'], section: 'Ventas' },
    { path: '/ventas/historial', label: 'Historial Ventas', icon: History, roles: ['admin', 'employee'] },
    { path: '/corte-caja', label: 'Corte de Caja', icon: Landmark, roles: ['admin', 'employee'] },

    // --- Clínica ---
    { path: '/pacientes', label: 'Pacientes', icon: Users, roles: ['admin', 'doctor'], section: 'Clínica' },
    { path: '/citas', label: 'Citas', icon: CalendarDays, roles: ['admin', 'doctor', 'employee'] },

    // --- Administración ---
    { path: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['admin'], section: 'Admin' },
];

export default function Sidebar({ collapsed, onToggle, isMobile = false, mobileOpen = false }: SidebarProps) {
    const location = useLocation();
    const { user } = useAuth();
    const [criticalCount, setCriticalCount] = useState(0);

    const userRole = (user?.role?.toLowerCase() || 'employee') as SystemRole;

    // Filtrar items según el rol del usuario
    const visibleItems = navItems.filter(item => {
        if (!item.roles) return true; // Sin restricción = visible para todos
        return item.roles.includes(userRole);
    });

    // Fetch critical stock count for badge
    useEffect(() => {
        const loadCritical = async () => {
            try {
                const res = await api.get<DashboardSummary>('/dashboard/summary');
                setCriticalCount(res.data.criticalStock.length);
            } catch {
                // Silently fail — badge is non-essential
            }
        };
        loadCritical();
        const interval = setInterval(loadCritical, 60000);
        return () => clearInterval(interval);
    }, []);

    // Mapeo de etiquetas de rol para mostrar en el badge del usuario
    const roleLabels: Record<SystemRole, string> = {
        admin: 'Administrador',
        employee: 'Cajero',
        doctor: 'Doctor(a)',
    };

    // En mobile: si el drawer no está abierto, no renderizar nada visible
    const isVisible = isMobile ? mobileOpen : true;
    const showLabels = isMobile ? true : !collapsed;
    const sidebarWidth = isMobile ? 'w-72' : collapsed ? 'w-[72px]' : 'w-64';

    let lastSection = '';

    return (
        <aside
            className={`fixed top-0 left-0 h-full z-50 flex flex-col border-r transition-all duration-300 ease-in-out ${sidebarWidth} ${
                isMobile
                    ? isVisible
                        ? 'translate-x-0'
                        : '-translate-x-full'
                    : ''
            }`}
            style={{
                backgroundColor: 'hsl(var(--sidebar))',
                borderColor: 'hsl(var(--sidebar-border))',
            }}
        >
            {/* Brand */}
            <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    {showLabels && (
                        <span className="text-lg font-bold whitespace-nowrap" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                            FarmaGestión
                        </span>
                    )}
                </div>
                {isMobile && (
                    <button
                        onClick={onToggle}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                        style={{ color: 'hsl(var(--sidebar-foreground))' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const showBadge = item.stockBadge && criticalCount > 0;

                    // Renderizar separador de sección si es diferente a la anterior
                    let sectionHeader = null;
                    if (item.section && item.section !== lastSection && showLabels) {
                        lastSection = item.section;
                        sectionHeader = (
                            <p
                                key={`section-${item.section}`}
                                className="text-[10px] font-bold uppercase tracking-widest px-3 pt-5 pb-1.5"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                                {item.section}
                            </p>
                        );
                    } else if (item.section && item.section !== lastSection && !showLabels) {
                        lastSection = item.section;
                        sectionHeader = <div key={`sep-${item.section}`} className="border-t my-2 mx-2" style={{ borderColor: 'hsl(var(--sidebar-border))' }} />;
                    }

                    return (
                        <div key={item.path}>
                            {sectionHeader}
                            <Link
                                to={item.path}
                                title={!showLabels ? item.label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'hover:bg-muted/80'
                                    }`}
                                style={!isActive ? { color: 'hsl(var(--sidebar-foreground))' } : undefined}
                            >
                                <item.icon
                                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`}
                                />
                                {showLabels && <span className="whitespace-nowrap">{item.label}</span>}
                                {showBadge && (
                                    <span className={`${!showLabels ? 'absolute -top-1 -right-1' : 'ml-auto'} flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm`}>
                                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                                        {criticalCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* User badge / collapse toggle */}
            <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                {showLabels && user && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-muted/50">
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                            {user.name}
                        </p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {roleLabels[userRole] || user.role}
                        </p>
                    </div>
                )}
                {!isMobile && (
                    <button
                        onClick={onToggle}
                        className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-muted/80 transition-colors"
                        style={{ color: 'hsl(var(--sidebar-foreground))' }}
                        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
        </aside>
    );
}
