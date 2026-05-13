/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con prescription.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import pdfService, { PrescriptionData } from '../services/PdfService';

export const generatePrescriptionPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data: PrescriptionData = req.body;

        // Generar el Buffer del PDF
        const pdfBuffer = await pdfService.generatePrescription(data);

        // Configurar Headers para retorno binario (MIME type PDF)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="receta_medica.pdf"');
        // Usamos 'inline' para sugerirle al navegador que lo muestre si puede, 
        // usar 'attachment' forzaría la descarga automática.

        // Enviar el ArrayBuffer directamente a la red
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
