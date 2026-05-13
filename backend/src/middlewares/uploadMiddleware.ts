import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const patientId = req.params.patientId || req.body.patientId || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        // Pattern: pacienteID_timestamp_index.extension
        // index can be derived from the fieldname or we can just let timestamp differentiate, 
        // but to ensure uniqueness within the same millisecond we can add a random string
        const uniqueSuffix = Math.round(Math.random() * 1e9);
        cb(null, `${patientId}_${timestamp}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Solo aceptar imágenes
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPG, PNG, etc).'));
    }
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
