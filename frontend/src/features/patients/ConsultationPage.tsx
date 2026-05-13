import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Save, Printer, Pill, AlertTriangle, BookOpen, Activity, Stethoscope, Image as ImageIcon, Trash2, ArrowLeft, UserCircle, Calendar, Phone, Copy, Upload } from 'lucide-react';
import { createConsultation, updateConsultation, searchProductsForConsultation, generatePrescriptionPdf, createCie10Code, uploadConsultationPhotos, getConsultationsByPatient } from './consultationApi';
import { getPatientById, type Patient } from './patientsApi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PrescribedMedication {
    id?: number;
    name: string;
    dose: string;
    duration: string;
    additional_instructions: string;
    hasStock: boolean;
}

interface PhotoEntry {
    url?: string;
    file?: File;
    caption: string;
    preview?: string;
}

export default function ConsultationPage() {
    const { patientId, consultationId } = useParams<{ patientId: string, consultationId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Formulario principal SOAP
    const { register, handleSubmit, watch, reset, setValue, getValues } = useForm();
    
    // Auto-Guardado Drafts (localStorage)
    const draftKey = `draft_consultation_${patientId}`;
    useEffect(() => {
        if (!consultationId) {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    Object.keys(parsed).forEach(key => {
                        setValue(key, parsed[key]);
                    });
                    toast.info('Borrador recuperado automáticamente');
                } catch (e) {
                    console.error("Error parsing draft", e);
                }
            }
        }
    }, [consultationId, patientId, setValue, draftKey]);

    useEffect(() => {
        if (!consultationId) {
            const interval = setInterval(() => {
                const data = getValues();
                if (Object.keys(data).length > 0) {
                    localStorage.setItem(draftKey, JSON.stringify(data));
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [consultationId, getValues, draftKey]);

    // IMC Dinámico
    const weight = watch('weight');
    const height = watch('height');
    let computedBmi = '';
    let bmiColor = 'text-primary';
    let bmiBg = 'bg-primary/5';

    if (weight && height && Number(height) > 0) {
        const bmiVal = Number(weight) / Math.pow(Number(height), 2);
        computedBmi = bmiVal.toFixed(2);
        if (bmiVal < 18.5) {
            bmiColor = 'text-orange-600';
            bmiBg = 'bg-orange-50 border-orange-200';
        } else if (bmiVal >= 18.5 && bmiVal < 25) {
            bmiColor = 'text-emerald-600';
            bmiBg = 'bg-emerald-50 border-emerald-200';
        } else if (bmiVal >= 25 && bmiVal < 30) {
            bmiColor = 'text-orange-600';
            bmiBg = 'bg-orange-50 border-orange-200';
        } else {
            bmiColor = 'text-red-600';
            bmiBg = 'bg-red-50 border-red-200';
        }
    }

    // Buscador CIE-10
    const [cieSearchTerm, setCieSearchTerm] = useState('');
    const [cieResults, setCieResults] = useState<any[]>([]);
    const [isSearchingCie, setIsSearchingCie] = useState(false);
    const [isCieFocused, setIsCieFocused] = useState(false);

    const [isAddingCie, setIsAddingCie] = useState(false);
    const [manualCieCode, setManualCieCode] = useState('');
    const [manualCieDesc, setManualCieDesc] = useState('');
    const [isSavingCie, setIsSavingCie] = useState(false);

    useEffect(() => {
        const delay = setTimeout(async () => {
            setIsSearchingCie(true);
            try {
                const res = await api.get(`/consultations/cie10/search?q=${cieSearchTerm}`);
                setCieResults(res.data);
            } catch {
                /* ignore */
            } finally {
                setIsSearchingCie(false);
            }
        }, 500);
        return () => clearTimeout(delay);
    }, [cieSearchTerm]);

    const formatCie10 = (code: string) => {
        if (!code) return '';
        if (code.length === 4 && !code.includes('.')) {
            return `${code.substring(0, 3)}.${code.substring(3)}`;
        }
        return code;
    };

    const handleSaveManualCie = async () => {
        const cleanCode = manualCieCode.trim();
        const regex = /^[A-Za-z][0-9]{2}(\.?[0-9])?$/;
        if (!regex.test(cleanCode)) {
            toast.error('Formato inválido. Ej: L70.0 o B01');
            return;
        }
        if (!manualCieDesc.trim()) {
            toast.error('La descripción es obligatoria');
            return;
        }
        try {
            setIsSavingCie(true);
            const result = await createCie10Code(cleanCode, manualCieDesc);
            toast.success('Diagnóstico agregado al catálogo');
            setValue('cie10_code', result.code);
            setValue('diagnosis', result.description);
            setIsAddingCie(false);
            setManualCieCode('');
            setManualCieDesc('');
            setCieSearchTerm('');
            setCieResults([]);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        } finally {
            setIsSavingCie(false);
        }
    };

    // Load Patient & Consultation
    useEffect(() => {
        const init = async () => {
            const pId = Number(patientId);
            if (!patientId || isNaN(pId)) {
                toast.error('ID inválido');
                navigate('/pacientes', { replace: true });
                return;
            }
            try {
                setLoading(true);
                const pData = await getPatientById(pId);
                setPatient(pData);

                if (consultationId) {
                    const res = await api.get(`/consultations/${consultationId}`);
                    const c = res.data;
                    reset({
                        temperature: c.temperature, weight: c.weight, height: c.height,
                        blood_pressure_sys: c.blood_pressure_sys, blood_pressure_dia: c.blood_pressure_dia,
                        heart_rate: c.heart_rate, respiratory_rate: c.respiratory_rate,
                        oxygen_saturation: c.oxygen_saturation, abdominal_circ: c.abdominal_circ,
                        symptom_subjective: c.symptom_subjective, symptom_objective: c.symptom_objective,
                        analysis: c.analysis, plan: c.plan, cie10_code: c.cie10_code,
                        diagnosis: c.diagnosis, treatment: c.treatment, notes: c.notes,
                        is_finalized: c.is_finalized
                    });
                    if (c.prescriptions && c.prescriptions.length > 0) {
                        setPrescribedMedications(c.prescriptions[0].items.map((i: any) => ({
                            id: i.product_id, name: i.medication_name, dose: i.dosage,
                            duration: i.duration, additional_instructions: i.notes || '', hasStock: true
                        })));
                    }
                    if (c.photos && Array.isArray(c.photos)) {
                        setPhotos(c.photos);
                    }
                }
            } catch (err) {
                toast.error('Error al cargar datos');
                navigate('/pacientes', { replace: true });
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [patientId, consultationId, navigate, reset]);

    // Importar última consulta (Clonado)
    const handleCloneLastConsultation = async () => {
        try {
            const history = await getConsultationsByPatient(Number(patientId));
            if (history.length === 0) {
                toast.error('No hay consultas previas para clonar');
                return;
            }
            // Sort by date desc implicitly handled by backend
            const last = history[0];
            setValue('symptom_subjective', last.symptom_subjective);
            setValue('symptom_objective', last.symptom_objective);
            setValue('analysis', last.analysis);
            setValue('plan', last.plan);
            setValue('cie10_code', last.cie10_code);
            setValue('diagnosis', last.diagnosis);
            setValue('treatment', last.treatment);
            
            // Signos vitales que se conservan (ej: altura)
            if (last.height) setValue('height', last.height);
            
            toast.success('Clonado exitoso. Datos de la consulta del ' + new Date(last.consultation_date).toLocaleDateString() + ' importados.');
        } catch (error) {
            toast.error('Error al importar la última consulta');
        }
    };

    // Farmacia
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [prescribedMedications, setPrescribedMedications] = useState<PrescribedMedication[]>([]);
    const [activeMedicationDraft, setActiveMedicationDraft] = useState<Partial<PrescribedMedication> | null>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await searchProductsForConsultation(searchTerm);
                    setSearchResults(results);
                } catch { } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Fotos
    const [photos, setPhotos] = useState<PhotoEntry[]>([]);
    const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            if (photos.length + newFiles.length > 4) {
                toast.error('Máximo 4 fotos por consulta');
                return;
            }
            const newEntries = newFiles.map(file => ({
                file,
                caption: '',
                preview: URL.createObjectURL(file)
            }));
            setPhotos(prev => [...prev, ...newEntries]);
        }
    };

    const handlePhotoCaptionChange = (index: number, caption: string) => {
        const updated = [...photos];
        updated[index].caption = caption;
        setPhotos(updated);
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const [lastConsultationId, setLastConsultationId] = useState<number | null>(null);
    const [savedData, setSavedData] = useState<any>(null);

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            
            // Subir fotos primero si hay archivos nuevos
            let uploadedPhotos = [...photos];
            const filesToUpload = photos.filter(p => p.file).map(p => p.file!);
            
            if (filesToUpload.length > 0) {
                const uploadRes = await uploadConsultationPhotos(Number(patientId), filesToUpload);
                let uploadIndex = 0;
                uploadedPhotos = uploadedPhotos.map(p => {
                    if (p.file) {
                        const url = uploadRes.urls[uploadIndex++];
                        return { url, caption: p.caption };
                    }
                    return p;
                });
            }

            const payload = {
                ...data,
                patient_id: Number(patientId),
                doctor_id: user?.id || 1, 
                temperature: data.temperature ? Number(data.temperature) : undefined,
                weight: data.weight ? Number(data.weight) : undefined,
                height: data.height ? Number(data.height) : undefined,
                bmi: computedBmi ? Number(computedBmi) : undefined,
                abdominal_circ: data.abdominal_circ ? Number(data.abdominal_circ) : undefined,
                blood_pressure_sys: data.blood_pressure_sys ? Number(data.blood_pressure_sys) : undefined,
                blood_pressure_dia: data.blood_pressure_dia ? Number(data.blood_pressure_dia) : undefined,
                heart_rate: data.heart_rate ? Number(data.heart_rate) : undefined,
                respiratory_rate: data.respiratory_rate ? Number(data.respiratory_rate) : undefined,
                oxygen_saturation: data.oxygen_saturation ? Number(data.oxygen_saturation) : undefined,
                prescriptions: prescribedMedications.map(med => ({
                    product_id: med.id, medication_name: med.name, dosage: med.dose,
                    frequency: med.duration, duration: med.duration, notes: med.additional_instructions
                })),
                photos: uploadedPhotos.map(p => ({ url: p.url, caption: p.caption }))
            };

            let response;
            if (consultationId) {
                response = await updateConsultation(Number(consultationId), payload);
                toast.success('Expediente actualizado exitosamente.');
            } else {
                response = await createConsultation(payload);
                toast.success('Expediente y consulta registrados (SOAP).');
                // Clean draft
                localStorage.removeItem(draftKey);
            }
            
            setLastConsultationId(response.id);
            setSavedData(payload);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la consulta');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !patient) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    }

    const isLocked = !!lastConsultationId || watch('is_finalized');
    const patientAge = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    return (
        <div className="animate-fade-in flex flex-col h-full bg-background min-h-screen pb-20">
            {/* Cabecera Flotante */}
            <div className="sticky top-16 z-40 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-3 shadow-sm flex items-center justify-between -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/pacientes/${patientId}/expediente`)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <UserCircle className="text-primary w-5 h-5"/> {patient.first_name} {patient.last_name}
                        </h1>
                        <p className="text-xs text-muted-foreground">Expediente {patient.patient_code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {lastConsultationId && (
                        <button type="button" onClick={async () => {
                            const pdfBlob = await generatePrescriptionPdf({ doctorName: user?.name, patientName: `${patient.first_name} ${patient.last_name}`, diagnosis: savedData?.diagnosis, treatment: "Ver receta adjunta", consultationId: lastConsultationId });
                            const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
                            const win = window.open(url);
                            if(win) win.onload = () => win.print();
                        }} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 shadow-sm">
                            <Printer className="w-4 h-4" /> Imprimir Receta
                        </button>
                    )}
                    <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || isLocked} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 shadow-md">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLocked ? "Consulta Finalizada" : "Firmar y Guardar"}
                    </button>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-6">
                <form className="flex flex-col xl:flex-row gap-6 items-start h-full">
                    
                    {/* COLUMNA 1: Contexto del Paciente (20%) */}
                    <div className="w-full xl:w-[22%] space-y-4 xl:sticky top-36">
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 border-b pb-2">Contexto Paciente</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Calendar className="w-4 h-4 text-primary" /> {patientAge} años
                                </div>
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Activity className="w-4 h-4 text-primary" /> Sangre: {patient.blood_type || 'N/A'}
                                </div>
                                {patient.phone && (
                                    <div className="flex items-center gap-2 text-foreground font-medium">
                                        <Phone className="w-4 h-4 text-primary" /> {patient.phone}
                                    </div>
                                )}
                            </div>

                            {patient.has_allergies && patient.allergies_detail && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
                                        <AlertTriangle className="w-4 h-4" /> Alergias
                                    </div>
                                    <p className="text-xs font-medium">{patient.allergies_detail}</p>
                                </div>
                            )}

                            {!consultationId && (
                                <button type="button" onClick={handleCloneLastConsultation} className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors">
                                    <Copy className="w-4 h-4" /> Importar última nota
                                </button>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA 2: Metodología SOAP y Fotos (50%) */}
                    <div className="w-full xl:w-[48%] space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary mb-5 uppercase tracking-wider border-b pb-2">
                                <BookOpen className="w-4 h-4"/> Evolución Clínica (SOAP)
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold">Subjetivo (S)</label>
                                    <textarea {...register('symptom_subjective', { required: 'Subjetivo es requerido' })} rows={4} onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} className="w-full px-3 py-3 bg-muted/50 focus:bg-background border border-border rounded-lg text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-primary/20" placeholder="Motivo de consulta, síntomas referidos..."></textarea>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold">Objetivo (O)</label>
                                    <textarea {...register('symptom_objective')} rows={4} onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} className="w-full px-3 py-3 bg-muted/50 focus:bg-background border border-border rounded-lg text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-primary/20" placeholder="Exploración física..."></textarea>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold">Diagnóstico CIE-10 (A)</label>
                                    
                                    {/* Buscador CIE-10 */}
                                    <div className="relative mb-2">
                                        {!isAddingCie ? (
                                            <div className="flex gap-2 relative">
                                                <div className="relative flex-1">
                                                    <input type="text" value={cieSearchTerm} onChange={(e) => setCieSearchTerm(e.target.value)} onFocus={() => setIsCieFocused(true)} onBlur={() => setTimeout(() => setIsCieFocused(false), 200)} placeholder="Buscar código CIE-10..." className="w-full pl-3 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                                                    {isSearchingCie && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />}
                                                    {isCieFocused && cieResults.length > 0 && (
                                                        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                                            {!cieSearchTerm.trim() && <div className="px-3 py-1.5 bg-muted text-xs font-bold text-muted-foreground uppercase tracking-wider">Frecuentes</div>}
                                                            {cieResults.map((cie) => (
                                                                <div key={cie.code} className="flex items-center gap-2 p-3 hover:bg-muted cursor-pointer text-sm border-b last:border-0 border-border/50" onClick={() => { setValue('cie10_code', cie.code); setValue('diagnosis', cie.description); setCieSearchTerm(""); setCieResults([]); setIsCieFocused(false); }}>
                                                                    <span className="font-bold text-primary">{formatCie10(cie.code)}</span> <span>{cie.description}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => setIsAddingCie(true)} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap">✚ Manual</button>
                                            </div>
                                        ) : (
                                            <div className="bg-muted border border-border rounded-lg p-4 space-y-3 shadow-sm">
                                                <div className="font-bold text-sm text-primary">✚ Diagnóstico Manual</div>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Ej: L70.0" value={manualCieCode} onChange={e => setManualCieCode(e.target.value.toUpperCase())} className="w-28 px-3 py-2 bg-background border border-border rounded-md text-sm outline-none uppercase font-mono" />
                                                    <input type="text" placeholder="Descripción" value={manualCieDesc} onChange={e => setManualCieDesc(e.target.value)} className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm outline-none" />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setIsAddingCie(false)} className="px-3 py-1.5 text-xs font-bold bg-background border border-border rounded-md hover:bg-muted">Cancelar</button>
                                                    <button type="button" onClick={handleSaveManualCie} disabled={isSavingCie} className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-md flex items-center gap-1">{isSavingCie && <Loader2 className="w-3 h-3 animate-spin"/>} Guardar</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={formatCie10(watch('cie10_code'))} readOnly className="w-24 px-3 py-3 bg-muted text-sm font-bold border border-border rounded-lg text-center" />
                                        <textarea {...register('diagnosis')} rows={3} onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} className="w-full flex-1 px-3 py-3 bg-muted/50 focus:bg-background border border-border rounded-lg text-sm outline-none resize-none transition-all" placeholder="Descripción extendida del diagnóstico..."></textarea>
                                    </div>
                                    <textarea {...register('analysis')} rows={3} onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} className="mt-2 w-full px-3 py-3 bg-muted/50 focus:bg-background border border-border rounded-lg text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-primary/20" placeholder="Análisis médico..."></textarea>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold">Plan y Tratamiento (P)</label>
                                    <textarea {...register('treatment')} rows={4} onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} className="w-full px-3 py-3 bg-muted/50 focus:bg-background border border-border rounded-lg text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-primary/20" placeholder="Indicaciones, estudios solicitados, reposo..."></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Registro Fotográfico */}
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-5 border-b pb-2">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                                    <ImageIcon className="w-4 h-4"/> Registro Fotográfico
                                </h3>
                                <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">{photos.length}/4</span>
                            </div>
                            
                            {photos.length < 4 && !isLocked && (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-background mb-4 group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <p className="text-sm text-muted-foreground font-medium">Clic para agregar imagen clínica</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleAddPhoto} />
                                </label>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {photos.map((p, idx) => (
                                    <div key={idx} className="bg-background border border-border rounded-xl overflow-hidden shadow-sm relative group">
                                        <div className="aspect-video w-full bg-muted relative">
                                            <img src={p.preview || p.url} alt="Clinical" className="w-full h-full object-cover" />
                                            {!isLocked && (
                                                <button type="button" onClick={() => handleRemovePhoto(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <input type="text" placeholder="Añadir descripción..." value={p.caption} onChange={e => handlePhotoCaptionChange(idx, e.target.value)} disabled={isLocked} className="w-full text-xs px-2 py-1.5 bg-muted/50 border border-transparent focus:bg-background focus:border-border rounded-md outline-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 3: Signos Vitales y Receta (30%) */}
                    <div className="w-full xl:w-[30%] space-y-6 xl:sticky top-36">
                        {/* Signos Vitales */}
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary mb-4 uppercase tracking-wider border-b pb-2">
                                <Activity className="w-4 h-4"/> Signos Vitales
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-bold">Peso (kg)</label>
                                    <input type="number" step="0.1" {...register('weight')} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-primary" placeholder="70" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-bold">Altura (m)</label>
                                    <input type="number" step="0.01" {...register('height')} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-primary" placeholder="1.75" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-bold text-muted-foreground">IMC</label>
                                    <input type="text" readOnly value={computedBmi} className={`w-full px-3 py-2 border rounded-lg text-sm text-center font-bold shadow-sm transition-colors ${bmiBg} ${bmiColor}`} placeholder="—" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs text-muted-foreground font-bold">T.A. (Sistólica/Diastólica)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" {...register('blood_pressure_sys')} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none text-center focus:ring-1 focus:ring-primary" placeholder="120" />
                                        <span className="text-muted-foreground font-light text-lg">/</span>
                                        <input type="number" {...register('blood_pressure_dia')} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none text-center focus:ring-1 focus:ring-primary" placeholder="80" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-bold">FC (lpm)</label>
                                    <input type="number" {...register('heart_rate')} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-primary" placeholder="75" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-bold">Temp (°C)</label>
                                    <input type="number" step="0.1" {...register('temperature')} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-primary" placeholder="36.5" />
                                </div>
                            </div>
                        </div>

                        {/* Receta */}
                        <div className="p-5 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/50 shadow-sm">
                            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm uppercase tracking-wider mb-4 border-b border-sky-200 dark:border-sky-800 pb-2">
                                <Stethoscope className="w-4 h-4" /> Receta Farmacológica
                            </div>
                            
                            {!isLocked && (
                                <div className="relative mb-4">
                                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Añadir medicamento (conexión a farmacia)..." className="w-full pl-3 pr-10 py-2.5 bg-background border border-sky-200 dark:border-sky-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-sm" disabled={activeMedicationDraft !== null} />
                                    {isSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />}
                                </div>
                            )}

                            {searchResults.length > 0 && !activeMedicationDraft && (
                                <div className="mb-4 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                    {searchResults.map((product) => (
                                        <div key={product.id} className="flex justify-between items-center p-3 hover:bg-muted cursor-pointer border-b border-border/50 text-sm" onClick={() => setActiveMedicationDraft({ id: product.id, name: product.name, hasStock: product.totalStock > 0 })}>
                                            <div>
                                                <span className="font-bold text-foreground flex items-center gap-2"><Pill className="w-3 h-3 text-sky-600"/> {product.name}</span>
                                            </div>
                                            {product.totalStock > 0 ? <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Stock</span> : <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Sin Stock</span>}
                                        </div>
                                    ))}
                                    <div className="p-3 hover:bg-muted cursor-pointer border-t-2 border-dashed border-border text-xs font-bold text-sky-600" onClick={() => setActiveMedicationDraft({ name: searchTerm, hasStock: false })}>
                                        ✚ Recetar manual "{searchTerm}"
                                    </div>
                                </div>
                            )}

                            {activeMedicationDraft && (
                                <div className="bg-card border-2 border-sky-400 rounded-xl p-4 shadow-md mb-4">
                                    <div className="font-bold text-sm text-sky-700 mb-3">{activeMedicationDraft.name}</div>
                                    <div className="space-y-3">
                                        <div><label className="text-xs font-bold">Dosis *</label><input type="text" id="draft-dose" className="w-full px-3 py-1.5 border border-border rounded-lg text-sm mt-1" placeholder="Ej: 1 pastilla cada 8 hrs" /></div>
                                        <div><label className="text-xs font-bold">Duración *</label><input type="text" id="draft-duration" className="w-full px-3 py-1.5 border border-border rounded-lg text-sm mt-1" placeholder="Ej: Por 5 días" /></div>
                                        <div><label className="text-xs font-bold">Notas Extras</label><input type="text" id="draft-instructions" className="w-full px-3 py-1.5 border border-border rounded-lg text-sm mt-1" /></div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" onClick={() => setActiveMedicationDraft(null)} className="flex-1 py-1.5 border border-border rounded-lg text-xs font-bold">Cancelar</button>
                                        <button type="button" onClick={() => {
                                            const dose = (document.getElementById('draft-dose') as HTMLInputElement).value;
                                            const duration = (document.getElementById('draft-duration') as HTMLInputElement).value;
                                            const extra = (document.getElementById('draft-instructions') as HTMLInputElement).value;
                                            if(!dose || !duration) return toast.error('Dosis y duración obligatorias');
                                            setPrescribedMedications(prev => [...prev, { id: activeMedicationDraft.id, name: activeMedicationDraft.name!, hasStock: activeMedicationDraft.hasStock ?? false, dose, duration, additional_instructions: extra }]);
                                            setActiveMedicationDraft(null); setSearchTerm(''); setSearchResults([]);
                                        }} className="flex-1 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold shadow-sm">Confirmar</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {prescribedMedications.map((med, i) => (
                                    <div key={i} className="bg-card border border-border rounded-lg p-3 text-sm shadow-sm relative group overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${med.hasStock ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                                        <div className="pl-2">
                                            <div className="font-bold text-foreground">{med.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">Dosis: <span className="font-semibold text-foreground">{med.dose}</span> | Duración: <span className="font-semibold text-foreground">{med.duration}</span></div>
                                            {med.additional_instructions && <div className="text-[11px] bg-muted px-2 py-1 mt-1 rounded text-muted-foreground">{med.additional_instructions}</div>}
                                        </div>
                                        {!isLocked && (
                                            <button type="button" onClick={() => setPrescribedMedications(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500 p-1 bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
