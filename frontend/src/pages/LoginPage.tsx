/**
 * @fileoverview Componente de vista principal (Página) que agrupa características y se mapea a una ruta específica.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Ingresa un correo electrónico válido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError('');
        setIsSubmitting(true);
        try {
            await login(data);
            navigate('/dashboard', { replace: true });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setServerError(
                error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-800" />

            {/* Decorative blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-emerald-400/5 blur-2xl" />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
                <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10">
                    {/* Logo / Brand */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            FarmaGestión
                        </h1>
                        <p className="text-emerald-200/60 text-sm mt-1">
                            Sistema de Gestión Clínica y Administrativa
                        </p>
                    </div>

                    {/* Server error */}
                    {serverError && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                            <p className="text-red-300 text-sm">{serverError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-emerald-100/80"
                            >
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="admin@example.com"
                                className={`w-full px-4 py-3 rounded-xl bg-white/[0.06] border text-white placeholder:text-white/25 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.email
                                        ? 'border-red-500/50 focus:ring-red-500/30'
                                        : 'border-white/10 focus:ring-emerald-500/40 focus:border-emerald-500/30'
                                    }`}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-emerald-100/80"
                            >
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.06] border text-white placeholder:text-white/25 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.password
                                            ? 'border-red-500/50 focus:ring-red-500/30'
                                            : 'border-white/10 focus:ring-emerald-500/40 focus:border-emerald-500/30'
                                        }`}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-white/20 text-xs mt-8">
                        © 2026 FarmaGestión — Sistema Seguro
                    </p>
                </div>
            </div>
        </div>
    );
}
