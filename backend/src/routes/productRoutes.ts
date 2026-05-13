/**
 * @fileoverview Define los endpoints (rutas) de la API para product y enlaza sus respectivos controladores.
 * 
 * Política de acceso:
 *   - Ver/Listar productos: admin, employee
 *   - Buscar productos (para recetas): admin, employee, doctor
 *   - Crear productos: SOLO admin
 *   - Editar productos: SOLO admin (registra historial de precios)
 *   - Eliminar productos: SOLO admin
 */
import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts
} from '../controllers/productController';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { validateBody } from '../middlewares/validateBody';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

// Middleware global: requiere JWT válido
router.use(authenticate);

// GET /api/products/search → Búsqueda para autocompletado en consultas (todos los roles)
router.get('/search', checkRole(['admin', 'employee', 'doctor']), searchProducts);

// GET /api/products → Lista todos los productos con sus lotes (admin, employee)
// POST /api/products → Crea un producto (solo admin)
router.route('/')
    .get(checkRole(['admin', 'employee']), getProducts)
    .post(checkRole(['admin']), validateBody(createProductSchema), createProduct);

// GET /api/products/:id → Obtiene un producto por ID (admin, employee)
// PUT /api/products/:id → Actualiza un producto por ID (solo admin)
// DELETE /api/products/:id → Elimina un producto por ID (solo admin)
router.route('/:id')
    .get(checkRole(['admin', 'employee']), getProductById)
    .put(checkRole(['admin']), validateBody(updateProductSchema), updateProduct)
    .delete(checkRole(['admin']), deleteProduct);

export default router;
