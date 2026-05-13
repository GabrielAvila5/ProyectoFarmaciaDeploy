/**
 * @fileoverview Página completa para registrar un nuevo paciente.
 * Reemplaza el modal anterior con un layout de múltiples columnas,
 * navigation guard para datos sin guardar, y manejo robusto de errores.
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { updatePatient, getPatientById } from './patientsApi';
import { patientSchema, type PatientFormData } from './patientSchemas';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Edit } from 'lucide-react';

export default function EditPatientPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            has_allergies: false,
        }
    });

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                setIsLoading(true);
                const patientId = Number(id);
                if (!patientId || isNaN(patientId)) throw new Error("ID inválido");
                const data = await getPatientById(patientId);
                // Convert date to YYYY-MM-DD
                const formattedDate = new Date(data.date_of_birth).toISOString().split('T')[0];
                reset({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    date_of_birth: formattedDate,
                    gender: data.gender || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || '',
                    has_allergies: data.has_allergies,
                    allergies_detail: data.allergies_detail || '',
                    medical_history: data.medical_history || ''
                });
            } catch (error) {
                toast.error("Error al cargar paciente.");
                navigate('/pacientes');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatient();
    }, [id, navigate, reset]);

    const hasAllergies = watch('has_allergies');

    // ────────── Submit Handler ──────────
    const onSubmit = async (data: PatientFormData) => {
        try {
            setIsSubmitting(true);
            await updatePatient(Number(id), data);

            toast.success(`Datos del paciente actualizados exitosamente.`);

            // Redireccionar al expediente
            navigate(`/pacientes/${id}/expediente`, { replace: true });
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || 'Error al registrar paciente. Verifique la conexión e intente de nuevo.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Clases reutilizables para inputs
    const inputClass = 'w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-colors';
    const labelClass = 'text-sm font-medium text-foreground';
    const sectionTitleClass = 'text-sm font-semibold text-primary uppercase tracking-wider border-b border-border pb-1 mb-4';

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in min-h-[calc(100vh-4rem)] flex flex-col">
            {/* ══════ Header con Breadcrumb ══════ */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(`/pacientes/${id}/expediente`)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Expediente
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Edit className="w-7 h-7 text-primary" />
                        Editar Paciente
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Modifique los datos personales y antecedentes clínicos del paciente.
                    </p>
                </div>
            </div>

            {/* ══════ Formulario Principal ══════ */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-6">
                {/* ── Sección 1: Identificación (3 columnas) ── */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <h3 className={sectionTitleClass}>Identificación del Paciente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className={labelClass}>Nombre(s) *</label>
                            <input {...register('first_name')} className={inputClass} placeholder="Ej: Juan Carlos" />
                            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Apellido(s) *</label>
                            <input {...register('last_name')} className={inputClass} placeholder="Ej: Pérez López" />
                            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Fecha de Nacimiento *</label>
                            <input type="date" {...register('date_of_birth')} className={inputClass} />
                            {errors.date_of_birth && <p className="text-xs text-red-500">{errors.date_of_birth.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Género</label>
                            <select {...register('gender')} className={inputClass}>
                                <option value="">Seleccione...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro/Prefiero no decir</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Sección 2: Contacto y Residencia (2 columnas) ── */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <h3 className={sectionTitleClass}>Contacto y Residencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className={labelClass}>Teléfono Principal</label>
                            <input {...register('phone')} className={inputClass} placeholder="10 dígitos" />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Email</label>
                            <input type="email" {...register('email')} className={inputClass} placeholder="correo@ejemplo.com" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-1 md:col-span-2 lg:col-span-1">
                            <label className={labelClass}>Dirección Completa</label>
                            <input {...register('address')} className={inputClass} placeholder="Calle, Número, Colonia, C.P., Ciudad" />
                        </div>
                    </div>
                </div>

                {/* ── Sección 3: Antecedentes Clínicos (2 columnas) ── */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                    <h3 className={sectionTitleClass}>Antecedentes Clínicos</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Columna Izquierda — Alergias */}
                        <div className="space-y-3">
                            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer w-fit text-sm font-bold text-red-300">
                                    <input
                                        type="checkbox"
                                        {...register('has_allergies')}
                                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 focus:ring-2 border-red-300"
                                    />
                                    ¿El paciente tiene alergias conocidas?
                                </label>

                                {hasAllergies && (
                                    <div className="mt-3 space-y-1">
                                        <label className="text-xs font-semibold text-red-400">
                                            Detalle de Alergias (Medicamentos, alimentos, etc.) *
                                        </label>
                                        <textarea
                                            {...register('allergies_detail')}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="Ej: Penicilina, Ibuprofeno, Mariscos..."
                                        />
                                        {errors.allergies_detail && (
                                            <p className="text-xs text-red-500 font-medium">{errors.allergies_detail.message}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Columna Derecha — Historial Médico */}
                        <div className="space-y-1">
                            <label className={labelClass}>Antecedentes Heredofamiliares o Patológicos Generales</label>
                            <textarea
                                {...register('medical_history')}
                                rows={5}
                                className={`${inputClass} resize-y`}
                                placeholder="Hipertensión, diabetes, cirugías previas, enfermedades crónicas familiares, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* ── Footer de Acciones (Sticky) ── */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 -mx-1 px-1 mt-auto flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => navigate(`/pacientes/${id}/expediente`)}
                        className="px-5 py-2.5 text-sm font-medium border border-border hover:bg-muted rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>

        </div>
    );
}
