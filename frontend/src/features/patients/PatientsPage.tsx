/**
 * @fileoverview Componente principal para la gestión de pacientes en el UI clínico.
 * Permite visualizar el registro, agregar nuevos pacientes y acceder al expediente médico.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPatients, type Patient } from './patientsApi';
import { toast } from 'sonner';
import { Users, Plus, Loader2, FileText, UserCircle, Search } from 'lucide-react';
import { normalizeText } from '@/lib/normalizeText';

export default function PatientsPage() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await fetchPatients();
            setPatients(data);
        } catch {
            toast.error('No se pudieron cargar los pacientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    // -------- Lógica de Búsqueda Optimizada (Debounce) --------
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300); // 300ms de retraso (debounce)
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredPatients = useMemo(() => {
        if (!debouncedQuery) return patients;
        
        const lowerQ = normalizeText(debouncedQuery);
        return patients.filter(p => 
            normalizeText(p.first_name).includes(lowerQ) ||
            normalizeText(p.last_name).includes(lowerQ) ||
            (p.phone && p.phone.includes(debouncedQuery)) ||
            (p.patient_code && normalizeText(p.patient_code).includes(lowerQ))
        );
    }, [patients, debouncedQuery]);
    // ---------------------------------------------------------



    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Users className="w-7 h-7 text-primary" />
                        Expedientes Clínicos (Pacientes)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Gestión digital de pacientes, antecedentes médicos y consultas cronológicas.
                    </p>
                </div>
                
                {/* Controles de Búsqueda y Botón */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, tel o folio..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                        />
                        {searchQuery !== debouncedQuery ? (
                            <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground animate-spin" />
                        ) : (
                            <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground/50" />
                        )}
                    </div>
                    
                    <button
                        onClick={() => navigate('/pacientes/nuevo')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary w-full sm:w-auto text-primary-foreground rounded-xl hover:bg-primary/90 font-medium whitespace-nowrap shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Iniciar Expediente
                    </button>
                </div>
            </div>

            {/* Listado */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Identificador / Paciente</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Nacimiento</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Contacto</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Alertas</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <UserCircle className="w-10 h-10 text-muted-foreground/30" />
                                            <p>{searchQuery ? 'No se encontraron pacientes que coincidan con la búsqueda.' : 'No hay pacientes en la base de datos.'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground text-base">
                                                {patient.first_name} {patient.last_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5 px-2 py-0.5 bg-muted rounded-md w-fit">
                                                {patient.patient_code || 'S/C'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(patient.date_of_birth).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {patient.phone || '—'}
                                            {patient.email && <div className="text-xs">{patient.email}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {patient.has_allergies ? (
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                                                    ALERGIAS
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground/40 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/pacientes/${patient.id}/expediente`)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium rounded-lg transition-colors"
                                            >
                                                <FileText className="w-4 h-4" /> Expediente
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>




        </div>
    );
}
