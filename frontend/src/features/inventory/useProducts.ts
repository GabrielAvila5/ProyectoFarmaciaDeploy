/**
 * @fileoverview Custom hook de React para encapsular lógica de estado y efectos de la característica de inventory.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '@/types';
import * as productApi from './productApi';
import type { CreateProductPayload, UpdateProductPayload } from './productApi';

interface UseProductsReturn {
    products: Product[];
    loading: boolean;
    error: string | null;
    categories: string[];
    loadProducts: () => Promise<void>;
    addProduct: (data: CreateProductPayload) => Promise<Product>;
    editProduct: (id: number, data: UpdateProductPayload) => Promise<Product>;
    removeProduct: (id: number) => Promise<void>;
}

export function useProducts(): UseProductsReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productApi.fetchProducts();
            setProducts(data);
        } catch {
            setError('No se pudieron cargar los productos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Extrae categorías únicas de la lista de productos
    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach((p) => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).sort();
    }, [products]);

    const addProduct = useCallback(async (data: CreateProductPayload): Promise<Product> => {
        const newProduct = await productApi.createProduct(data);
        setProducts((prev) => [newProduct, ...prev]);
        return newProduct;
    }, []);

    const editProduct = useCallback(async (id: number, data: UpdateProductPayload): Promise<Product> => {
        const updated = await productApi.updateProduct(id, data);
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
    }, []);

    const removeProduct = useCallback(async (id: number): Promise<void> => {
        await productApi.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return {
        products,
        loading,
        error,
        categories,
        loadProducts,
        addProduct,
        editProduct,
        removeProduct,
    };
}
