/**
 * @fileoverview Componente de interfaz o lógica específica empacada bajo la característica funcional de users.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useEffect } from 'react';
import { fetchUsers, createUser, toggleUserActive, deleteUser, type UserItem, type CreateUserPayload } from './usersApi';
import { toast } from 'sonner';
import {
    Users, Loader2, AlertTriangle, RefreshCw, Plus, UserCheck, UserX,
    Mail, Shield, X, Eye, EyeOff, Trash2
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = { admin: 'Administrador', employee: 'Empleado', doctor: 'Doctor' };
const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    employee: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    doctor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
};

export default function UsersPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState<'admin' | 'employee' | 'doctor'>('employee');
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);

    // New doctor fields
    const [formSpecialty, setFormSpecialty] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formAlmaMater, setFormAlmaMater] = useState('');
    const [formConsultationFee, setFormConsultationFee] = useState('');
    const [formConsultingRoom, setFormConsultingRoom] = useState('');

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchUsers();
            setUsers(data);
        } catch {
            setError('No se pudieron cargar los usuarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const payload: CreateUserPayload = {
                name: formName, email: formEmail, password: formPassword, role: formRole,
                ...(formRole === 'doctor' && {
                    specialty: formSpecialty || undefined,
                    phone: formPhone || undefined,
                    alma_mater: formAlmaMater || undefined,
                    consultation_fee: formConsultationFee ? Number(formConsultationFee) : undefined,
                    consulting_room: formConsultingRoom || undefined,
                })
            };
            await createUser(payload);
            toast.success('Usuario creado exitosamente');
            setShowModal(false);
            resetForm();
            await loadUsers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(axiosErr?.response?.data?.message || axiosErr?.message || 'Error al crear usuario');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este usuario? Esta acción no se puede deshacer.')) return;
        setDeletingId(id);
        try {
            await deleteUser(id);
            toast.success('Usuario eliminado permanentemente');
            await loadUsers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(axiosErr?.response?.data?.message || axiosErr?.message || 'Error al eliminar usuario');
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggle = async (id: number) => {
        setTogglingId(id);
        try {
            const updated = await toggleUserActive(id);
            toast.success(updated.is_active ? 'Usuario activado' : 'Usuario desactivado');
            await loadUsers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(axiosErr?.response?.data?.message || axiosErr?.message || 'Error al cambiar estado');
        } finally {
            setTogglingId(null);
        }
    };

    const resetForm = () => {
        setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('employee'); setShowPassword(false);
        setFormSpecialty(''); setFormPhone(''); setFormAlmaMater(''); setFormConsultationFee(''); setFormConsultingRoom('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-medium">{error}</p>
                    <button onClick={loadUsers} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">Reintentar</button>
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
                        <Users className="w-7 h-7 text-primary" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-muted-foreground mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                        <Plus className="w-4 h-4" /> Nuevo Usuario
                    </button>
                    <button onClick={loadUsers} className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors text-muted-foreground" title="Refrescar">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Users grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => {
                    const roleName = user.roles?.name || 'sin rol';
                    return (
                        <div key={user.id}
                            className={`rounded-xl bg-card border border-border p-5 transition-all ${!user.is_active ? 'opacity-50' : 'hover:shadow-md'}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${user.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{user.name}</p>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLORS[roleName] || 'bg-muted text-muted-foreground'}`}>
                                            <Shield className="w-2.5 h-2.5" /> {ROLE_LABELS[roleName] || roleName}
                                        </span>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    user.is_active
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                }`}>
                                    {user.is_active ? <UserCheck className="w-2.5 h-2.5" /> : <UserX className="w-2.5 h-2.5" />}
                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Mail className="w-3.5 h-3.5" /> {user.email}
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleToggle(user.id)}
                                    disabled={togglingId === user.id || deletingId === user.id}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                        user.is_active
                                            ? 'border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                                            : 'border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                    }`}>
                                    {togglingId === user.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : user.is_active ? (
                                        <><UserX className="w-3 h-3" /> Desactivar</>
                                    ) : (
                                        <><UserCheck className="w-3 h-3" /> Activar</>
                                    )}
                                </button>
                                <button onClick={() => handleDelete(user.id)}
                                    disabled={deletingId === user.id || togglingId === user.id}
                                    title="Eliminar permanentemente"
                                    className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10">
                                    {deletingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="font-semibold text-foreground flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" /> Crear Nuevo Usuario
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre completo</label>
                                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    placeholder="Ej: María García" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    placeholder="Ej: maria@farmacia.com" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required minLength={6}
                                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        placeholder="Mínimo 6 caracteres" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Rol</label>
                                <select value={formRole} onChange={(e) => setFormRole(e.target.value as CreateUserPayload['role'])}
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                                    <option value="employee">Empleado</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {formRole === 'doctor' && (
                                <div className="space-y-4 pt-2 border-t border-border mt-2">
                                    <h3 className="text-sm font-semibold text-primary">Datos del Médico</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-foreground mb-1 block">Especialidad</label>
                                            <input type="text" value={formSpecialty} onChange={(e) => setFormSpecialty(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                                placeholder="Ej: Pediatría" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-foreground mb-1 block">Consultorio</label>
                                            <input type="text" value={formConsultingRoom} onChange={(e) => setFormConsultingRoom(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                                placeholder="Ej: A-102" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-foreground mb-1 block">Universidad</label>
                                            <input type="text" value={formAlmaMater} onChange={(e) => setFormAlmaMater(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                                placeholder="Ej: UNAM" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-foreground mb-1 block">Teléfono</label>
                                            <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                                placeholder="10 dígitos" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-foreground mb-1 block">Costo de Consulta Base ($)</label>
                                        <input type="number" step="0.01" value={formConsultationFee} onChange={(e) => setFormConsultationFee(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                            placeholder="Ej: 500.00" />
                                    </div>
                                </div>
                            )}
                            <button type="submit" disabled={creating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : <><Plus className="w-4 h-4" /> Crear Usuario</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
