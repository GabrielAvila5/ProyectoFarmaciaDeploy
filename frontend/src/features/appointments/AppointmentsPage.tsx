/**
 * @fileoverview Vista detallada para la creación y gestión de citas médicas.
 * Conecta pacientes, doctores y agendas en un CRUD integrado con validación Zod.
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchAppointments, createAppointment, updateAppointmentStatus, deleteAppointment, type Appointment } from './appointmentsApi';
import { appointmentSchema, type AppointmentFormData } from './appointmentSchemas';
import { searchPatients, createPatient, type Patient } from '../patients/patientsApi';
import { fetchDoctors, type UserItem } from '../users/usersApi';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Calendar, Plus, Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<UserItem[]>([]);
    
    // Estados para la búsqueda asíncrona de pacientes
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Registro Express
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [isSavingPatient, setIsSavingPatient] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ first_name: '', last_name: '', date_of_birth: '', phone: '' });

    const loadData = async () => {
        try {
            setLoading(true);
            const [apptsRes, doctorsRes] = await Promise.all([
                fetchAppointments(),
                fetchDoctors()
            ]);
            setAppointments(apptsRes);
            setDoctors(doctorsRes);
        } catch {
            toast.error('Error al cargar datos de citas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Efecto de Debounce para búsqueda
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        
        const delayDebounceFn = setTimeout(async () => {
            try {
                setIsSearching(true);
                const results = await searchPatients(searchQuery);
                setSearchResults(results);
                setShowDropdown(true);
            } catch (error) {
                console.error('Error buscando pacientes', error);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            source: 'Presencial',
            status: 'SCHEDULED'
        }
    });

    const watchPatientId = watch('patient_id');
    const watchReason = watch('reason');

    const handleCreateQuickPatient = async () => {
        try {
            setIsSavingPatient(true);
            const p = await createPatient({
                ...newPatientData,
                has_allergies: false,
                is_incomplete: true
            } as any);
            toast.success('Paciente Exprés guardado');
            setSelectedPatient(p);
            setValue('patient_id', p.id, { shouldValidate: true });
            setIsCreatingPatient(false);
            setNewPatientData({ first_name: '', last_name: '', date_of_birth: '', phone: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al guardar paciente exprés');
        } finally {
            setIsSavingPatient(false);
        }
    };

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            setIsSubmitting(true);
            await createAppointment({
                ...data,
                patient_id: Number(data.patient_id),
                doctor_id: Number(data.doctor_id)
            });
            toast.success('Cita programada con éxito');
            closeModal();
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al programar la cita');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        reset();
        setSearchQuery('');
        setSelectedPatient(null);
        setShowDropdown(false);
        setIsCreatingPatient(false);
    };

    const handleStatusUpdate = async (id: number, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
        try {
            await updateAppointmentStatus(id, status);
            toast.success('Estado actualizado');
            loadData();
        } catch (err: any) {
            toast.error('Error al actualizar');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar esta cita permanentemente?')) return;
        try {
            await deleteAppointment(id);
            toast.success('Cita eliminada');
            loadData();
        } catch (err: any) {
            toast.error('Error al eliminar');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-primary" />
                        Citas Médicas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Programa, actualiza y gestiona las consultas clínicas.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Nueva Cita
                </button>
            </div>

            {/* Listado de Citas */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Fecha y Hora</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Paciente</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Doctor Asignado</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Estado</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No hay citas programadas actualmente.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium whitespace-nowrap">
                                            {new Date(appt.appointment_date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : `ID: ${appt.patient_id}`}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {appt.users?.name || `ID: ${appt.doctor_id}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                                appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {appt.status === 'SCHEDULED' ? 'PROGRAMADA' : appt.status === 'COMPLETED' ? 'COMPLETADA' : 'CANCELADA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {appt.status === 'SCHEDULED' && (
                                                    <>
                                                        <button onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')} className="text-emerald-600 hover:text-emerald-700 p-1" title="Marcar Completada">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')} className="text-orange-500 hover:text-orange-600 p-1" title="Cancelar">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDelete(appt.id)} className="text-red-500 hover:text-red-600 p-1" title="Eliminar definitivamente">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Nueva Cita */}
            <Modal open={isAddModalOpen} onClose={closeModal} title="Agendar Nueva Cita">
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 overflow-visible">
                    <div className="space-y-1 relative">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium">Buscar Paciente *</label>
                            {!selectedPatient && !isCreatingPatient && (
                                <button type="button" onClick={() => setIsCreatingPatient(true)} className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                    <Plus className="w-3 h-3"/> Nuevo Paciente ⚡
                                </button>
                            )}
                        </div>

                        {/* Formulario Exprés */}
                        {isCreatingPatient ? (
                            <div className="bg-muted p-3 rounded-xl border border-border space-y-3 mb-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center border-b border-border pb-1">
                                    <span className="text-sm font-bold text-primary">Registro Clínico Rápido</span>
                                    <button type="button" onClick={() => setIsCreatingPatient(false)} className="text-muted-foreground hover:text-foreground">
                                        <XCircle className="w-4 h-4"/>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Nombre(s) *" value={newPatientData.first_name} onChange={e=>setNewPatientData({...newPatientData, first_name: e.target.value})} className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
                                    <input placeholder="Apellidos *" value={newPatientData.last_name} onChange={e=>setNewPatientData({...newPatientData, last_name: e.target.value})} className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
                                    <input type="date" title="Nacimiento *" value={newPatientData.date_of_birth} onChange={e=>setNewPatientData({...newPatientData, date_of_birth: e.target.value})} className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none text-muted-foreground" />
                                    <input placeholder="Teléfono" value={newPatientData.phone} onChange={e=>setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none" />
                                </div>
                                <button 
                                    type="button" 
                                    disabled={!newPatientData.first_name || !newPatientData.last_name || !newPatientData.date_of_birth || isSavingPatient} 
                                    onClick={handleCreateQuickPatient} 
                                    className="w-full bg-primary text-primary-foreground text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingPatient ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>}
                                    Guardar y Auto-seleccionar
                                </button>
                            </div>
                        ) : !selectedPatient ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, tel o email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground absolute right-3 top-2.5" />}
                                
                                {showDropdown && searchResults.length > 0 && (
                                    <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map((p) => (
                                            <li
                                                key={p.id}
                                                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                                                onClick={() => {
                                                    setSelectedPatient(p);
                                                    setValue('patient_id', p.id);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <div className="font-medium text-foreground">{p.first_name} {p.last_name}</div>
                                                <div className="text-xs text-muted-foreground flex gap-2">
                                                    <span>Tel: {p.phone || 'N/A'}</span>
                                                    <span>Email: {p.email || 'N/A'}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                
                                {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-3 text-sm text-center text-muted-foreground">
                                        No se encontraron pacientes.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                    <p className="text-xs text-primary/70">{selectedPatient.phone || selectedPatient.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setValue('patient_id', 0); // reset value
                                        setSearchQuery('');
                                    }}
                                    className="text-primary hover:bg-primary/20 p-1.5 rounded-full transition-colors"
                                    title="Quitar selección"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input type="hidden" {...register('patient_id', { valueAsNumber: true })} />
                        {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Doctor Asignado *</label>
                            <select
                                {...register('doctor_id', { valueAsNumber: true })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Seleccionar Doctor --</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            {errors.doctor_id && <p className="text-xs text-red-500">{errors.doctor_id.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Origen / Toma de Cita *</label>
                            <select
                                {...register('source')}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="Presencial">Presencial (Mostrador)</option>
                                <option value="Teléfono">Vía Telefónica</option>
                                <option value="Web">Página Web / Redes</option>
                            </select>
                            {errors.source && <p className="text-xs text-red-500">{errors.source?.message as string}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Fecha y Hora de la Cita *</label>
                        <input
                            type="datetime-local"
                            {...register('appointment_date')}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.appointment_date && <p className="text-xs text-red-500">{errors.appointment_date.message}</p>}
                    </div>

                    <div className="space-y-2 border-t border-border pt-4 mt-2">
                        <label className="text-sm font-medium">Motivo de Consulta *</label>
                        <input
                            type="text"
                            {...register('reason')}
                            placeholder="Ej: Dolor abdominal, Revisión de rutina..."
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
                        
                        {/* Quick Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['Revisión General', 'Seguimiento de Tratamiento', 'Valoración Inicial', 'Lectura de Estudios'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setValue('reason', tag, { shouldValidate: true })}
                                    className="text-xs bg-muted hover:bg-muted-foreground/20 text-muted-foreground px-2 py-1 rounded-md transition-colors border border-border"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !watchPatientId || !watchReason || isCreatingPatient}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Agendar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
