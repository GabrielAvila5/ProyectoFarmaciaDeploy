/**
 * @fileoverview Rutas de proveedores.
 * 
 * Política de acceso:
 *   - Ver proveedores: admin, employee
 *   - Crear/editar/eliminar/toggle: SOLO admin
 *   - Doctor NO accede a proveedores
 */
import express from 'express';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus
} from '../controllers/supplierController';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplier.validator';
import { validateBody } from '../middlewares/validateBody';
import { authenticate } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/roleMiddleware';

const router = express.Router();

router.use(authenticate);

router.route('/')
    .get(checkRole(['admin', 'employee']), getSuppliers)
    .post(checkRole(['admin']), validateBody(createSupplierSchema), createSupplier);

router.route('/:id')
    .get(checkRole(['admin', 'employee']), getSupplierById)
    .put(checkRole(['admin']), validateBody(updateSupplierSchema), updateSupplier)
    .delete(checkRole(['admin']), deleteSupplier);

router.route('/:id/status')
    .patch(checkRole(['admin']), toggleSupplierStatus);

export default router;
