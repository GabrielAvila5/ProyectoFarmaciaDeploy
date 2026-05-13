/**
 * @fileoverview Servicio que encapsula la lógica de negocio y consultas a la base de datos para la entidad de Pdf.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
const PdfPrinter = require('pdfmake/js/printer').default || require('pdfmake/js/printer');
import { TDocumentDefinitions } from 'pdfmake/interfaces';

// Fuentes genéricas
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const printer = new PdfPrinter(fonts);

export interface PrescriptionData {
    doctorName: string;
    doctorLicense?: string | null;
    patientName: string;
    patientCode?: string | null;
    patientAge?: number | null;
    patientAllergies?: string | null;
    diagnosis: string;
    treatment: string;
    consultationId?: number;
}

class PdfService {
    /**
     * Genera un buffer PDF usando la librería pdfmake para recetas médicas.
     */
    async generatePrescription(data: PrescriptionData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                // Alergias format
                let allergiesText = 'Sin alergias conocidas';
                if (data.patientAllergies) {
                    allergiesText = `ALERGIAS: ${data.patientAllergies}`;
                }

                const docDefinition: TDocumentDefinitions = {
                    defaultStyle: {
                        font: 'Helvetica'
                    },
                    content: [
                        // Cabecera Clínica Muestra (Simulando Logo con Texto y Color)
                        { text: 'FarmaGestión Clínica', style: 'header', alignment: 'center', color: '#10b981' },
                        { text: 'Receta Médica Oficial', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 5] as [number, number, number, number] },
                        { text: `Folio de Consulta: ${data.consultationId ? `#${data.consultationId}` : 'N/A'}`, alignment: 'center', fontSize: 10, color: 'gray', margin: [0, 0, 0, 15] as [number, number, number, number] },

                        // Datos Médico
                        {
                            columns: [
                                { text: `Doctor: Dr(a). ${data.doctorName}`, bold: true },
                                { text: `Fecha: ${new Date().toLocaleDateString()}`, alignment: 'right' }
                            ]
                        },
                        { text: `Cédula Profesional: ${data.doctorLicense || 'N/A'}`, margin: [0, 2, 0, 10] as [number, number, number, number] },

                        // Datos Paciente
                        { text: 'Datos del Paciente', style: 'sectionHeader', margin: [0, 10, 0, 5] as [number, number, number, number] },
                        {
                            columns: [
                                { text: `Nombre: ${data.patientName}` },
                                { text: `Expediente: ${data.patientCode || 'N/A'}` },
                                { text: `Edad: ${data.patientAge ? `${data.patientAge} años` : 'N/A'}`, alignment: 'right' }
                            ]
                        },
                        { 
                            text: allergiesText, 
                            color: data.patientAllergies ? 'red' : 'gray', 
                            bold: !!data.patientAllergies, 
                            margin: [0, 5, 0, 15] as [number, number, number, number] 
                        },

                        // Diagnostico
                        { text: `Diagnóstico Presuntivo/Definitivo: \n ${data.diagnosis}`, margin: [0, 5, 0, 20] as [number, number, number, number], italics: true },

                        // Tratamiento
                        { text: 'Indicaciones y Tratamiento:', style: 'sectionHeader', margin: [0, 10, 0, 10] as [number, number, number, number] },
                        { text: data.treatment, margin: [0, 0, 0, 80] as [number, number, number, number] },

                        // Footer / Firmas
                        { text: '__________________________________', alignment: 'center', margin: [0, 60, 0, 5] as [number, number, number, number] },
                        { text: 'Firma y Sello del Médico', alignment: 'center', fontSize: 10 }
                    ],
                    styles: {
                        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 5] as [number, number, number, number] },
                        subheader: { fontSize: 14, color: '#555555' },
                        sectionHeader: { fontSize: 15, bold: true, color: '#2B579A' }
                    }
                };

                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks: Uint8Array[] = [];

                pdfDoc.on('data', (chunk: Uint8Array) => {
                    chunks.push(chunk);
                });

                pdfDoc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });

                pdfDoc.on('error', (err: any) => {
                    reject(err);
                });

                pdfDoc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default new PdfService();
