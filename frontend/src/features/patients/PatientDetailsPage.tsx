/**
 * @fileoverview Vista a pantalla completa del expediente de un paciente.
 * Contiene datos personales, alertas alergénicas y un historial cronológico de consultas.
 * Reemplaza al anterior PatientDetailsModal.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Patient, getPatientById } from './patientsApi';
import { Loader2, Plus, Calendar, AlertTriangle, FileText, UserCircle, Activity, ArrowLeft, Edit, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { deletePatient } from './patientsApi';
import { deleteConsultation } from './consultationApi';

export default function PatientDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        const patientId = Number(id);
        if (!patientId || isNaN(patientId)) {
            toast.error('ID de paciente inválido.');
            navigate('/pacientes', { replace: true });
            return;
        }

        setLoading(true);
        try {
            const data = await getPatientById(patientId);
            setPatient(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'No se pudo cargar el expediente.');
            navigate('/pacientes', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id, navigate]);

    const handleDeletePatient = async () => {
        if (!window.confirm('¿Está seguro de eliminar o dar de baja a este paciente?')) return;
        try {
            await deletePatient(Number(id));
            toast.success('Paciente dado de baja/eliminado correctamente.');
            navigate('/pacientes');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar el paciente.');
        }
    };

    const handleDeleteConsultation = async (consultationId: number) => {
        if (!window.confirm('¿Está seguro de eliminar esta nota médica?')) return;
        try {
            await deleteConsultation(consultationId);
            toast.success('Consulta eliminada correctamente.');
            fetchDetails();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar la consulta.');
        }
    };

    const openEditConsultation = (consultationId: number) => {
        navigate(`/pacientes/${id}/consulta/${consultationId}/editar`);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Breadcrumb / Header Row */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/pacientes')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a Expedientes
                </button>
            </div>

            {/* Ficha Resumen del Paciente */}
            <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
                <div className="bg-muted/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                            <UserCircle className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {patient.first_name} {patient.last_name}
                            </h1>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="font-mono text-sm bg-background border border-border px-2.5 py-1 rounded-md text-foreground shadow-sm">
                                    Folio: {patient.patient_code || 'S/C'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate(`/pacientes/${patient.id}/editar`)}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-background text-sm font-semibold rounded-xl hover:bg-muted transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleDeletePatient}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                            title="Eliminar o dar de baja"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => navigate(`/pacientes/${patient.id}/consulta/nueva`)}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Agregar Consulta
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nacimiento</p>
                            <p className="text-sm font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Teléfono</p>
                            <p className="text-sm font-medium">{patient.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                            <p className="text-sm font-medium truncate" title={patient.email || ''}>{patient.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Género</p>
                            <p className="text-sm font-medium">{patient.gender || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner de Alergias Crítico */}
            {patient.has_allergies && patient.allergies_detail && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-2xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-red-400" />
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-red-400 mb-1">Aviso Crítico de Alergias</h4>
                        <p className="text-sm font-medium">{patient.allergies_detail}</p>
                    </div>
                </div>
            )}

            {/* Historial General */}
            {patient.medical_history && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-lg text-foreground flex items-center gap-2 mb-3 border-b border-border pb-2">
                        Antecedentes Médicos Generales
                    </h4>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {patient.medical_history}
                    </p>
                </div>
            )}

            {/* Línea de tiempo cronológica de Consultas */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold flex items-center justify-between border-b border-border pb-4 mb-6 relative">
                    <span className="flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Historial Cronológico de Consultas
                    </span>
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {patient.consultations?.length || 0} consultas
                    </span>
                </h3>
                
                <div className="space-y-6">
                    {!patient.consultations || patient.consultations.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 border justify-center border-border border-dashed rounded-xl flex flex-col items-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h4 className="text-lg font-medium text-foreground mb-1">Sin historial médico</h4>
                            <p className="text-sm text-muted-foreground max-w-sm">No se han registrado consultas previas para este paciente. Presione "Agregar Consulta" para comenzar.</p>
                        </div>
                    ) : (
                        patient.consultations.map((consultation, index) => (
                            <div key={consultation.id} className="relative pl-8 pb-8 border-l-2 border-primary/30 last:border-l-0 last:pb-0">
                                {/* Timeline Node */}
                                <div className="absolute w-4 h-4 bg-primary shadow-[0_0_0_4px_hsl(var(--background))] rounded-full -left-[9px] top-1.5" />
                                
                                <div className="bg-background border border-border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md shadow-sm border border-primary/20 mb-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(consultation.consultation_date).toLocaleString()}
                                            </span>
                                            <h4 className="font-semibold text-base text-foreground mt-1">
                                                Consulta #{patient.consultations!.length - index}
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                Atendido por: Dr(a). <span className="text-foreground font-medium">{consultation.users?.name || consultation.doctor_name_snapshot}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {consultation.is_finalized || consultation.finalized_at ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg shadow-sm">
                                                    <Lock className="w-3.5 h-3.5" /> Finalizada
                                                </span>
                                            ) : (
                                                <>
                                                    <button onClick={() => openEditConsultation(consultation.id)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteConsultation(consultation.id)} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-border">
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" /> Diagnóstico
                                            </p>
                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{consultation.diagnosis}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                                                <Activity className="w-3.5 h-3.5" /> Tratamiento Indicado
                                            </p>
                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{consultation.treatment}</p>
                                        </div>
                                    </div>

                                    {(consultation.temperature || consultation.weight || consultation.bmi) && (
                                        <div className="mt-5 pt-4 flex flex-wrap gap-4 text-sm bg-muted/30 border border-muted p-3 rounded-xl">
                                            <span className="font-semibold text-muted-foreground mb-1 w-full text-xs uppercase tracking-wider">Signos Vitales</span>
                                            {consultation.weight && <span className="bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm"><strong className='font-medium text-foreground'>Peso:</strong> {consultation.weight} kg</span>}
                                            {consultation.temperature && <span className="bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm"><strong className='font-medium text-foreground'>Temp:</strong> {consultation.temperature}°C</span>}
                                            {consultation.bmi && <span className="bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm"><strong className='font-medium text-foreground'>IMC:</strong> {consultation.bmi}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
