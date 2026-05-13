import { Router } from 'express';
import { createConsultation, getConsultationsByPatient, getConsultationById, searchCie10, updateConsultation, deleteConsultation, createCie10Code } from '../controllers/consultationController';
import { validateBody } from '../middlewares/validateBody';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';
import { createConsultationSchema } from '../validators/consultation.validator';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/cie10/search', checkRole(['admin', 'doctor']), searchCie10);
router.post('/cie10', checkRole(['admin', 'doctor']), createCie10Code);

// Ruta para subir fotos de la consulta (hasta 4 fotos)
router.post('/upload/:patientId', checkRole(['admin', 'doctor']), upload.array('photos', 4), (req, res) => {
    if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: 'No se subieron imágenes' });
    }
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ urls });
});

router.post('/', checkRole(['admin', 'doctor']), validateBody(createConsultationSchema), createConsultation);
router.get('/patient/:patientId', checkRole(['admin', 'doctor', 'employee']), getConsultationsByPatient);
router.get('/:id', checkRole(['admin', 'doctor', 'employee']), getConsultationById);
router.put('/:id', checkRole(['admin', 'doctor']), updateConsultation);
router.delete('/:id', checkRole(['admin', 'doctor']), deleteConsultation);

export default router;
