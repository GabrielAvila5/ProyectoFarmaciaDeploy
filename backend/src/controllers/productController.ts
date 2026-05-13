/**
 * @fileoverview Controlador para manejar las peticiones HTTP (req, res) relacionadas con product.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { Request, Response, NextFunction } from 'express';
import productService from '../services/ProductService';

// @desc    Crea un nuevo producto (con SKU generado automáticamente)
// @route   POST /api/products
// @access  Privado/Admin
const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // req.body ya fue validado por el middleware Zod
        const product = await productService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Obtiene todos los productos con sus lotes
// @route   GET /api/products
// @access  Público
const getProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Obtiene un producto por su ID
// @route   GET /api/products/:id
// @access  Público
const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de producto inválido');
        }
        const product = await productService.getProductById(id);
        res.json(product);
    } catch (error) {
        if (error instanceof Error && error.message === 'Producto no encontrado') {
            res.status(404);
        }
        next(error);
    }
};

// @desc    Actualiza un producto por su ID
// @route   PUT /api/products/:id
// @access  Privado/Admin
const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de producto inválido');
        }
        const product = await productService.updateProduct(id, req.body, req.user?.id);
        res.json(product);
    } catch (error) {
        if (error instanceof Error && error.message === 'Producto no encontrado') {
            res.status(404);
        }
        next(error);
    }
};

// @desc    Elimina un producto por su ID
// @route   DELETE /api/products/:id
// @access  Privado/Admin
const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400);
            throw new Error('ID de producto inválido');
        }
        const result = await productService.deleteProduct(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Producto no encontrado') {
            res.status(404);
        }
        next(error);
    }
};

// @desc    Busca productos (con stock vigente) por término
// @route   GET /api/products/search
// @access  Privado (Admin/Doctor/Employee)
const searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = req.query.q as string;
        const products = await productService.searchProducts(q || '');
        res.json(products);
    } catch (error) {
        next(error);
    }
};

export {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
};
