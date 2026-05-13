/**
 * @fileoverview Utilidad para normalizar texto eliminando diacríticos (acentos).
 * Permite búsquedas que ignoren acentos, ej: "ibuprofeno" encuentra "Ibuprofén".
 */

/**
 * Normaliza un string eliminando diacríticos (á→a, é→e, í→i, ó→o, ú→u, ñ→n)
 * y convirtiéndolo a minúsculas para búsquedas tolerantes.
 * 
 * Usa Unicode NFD decomposition + regex para quitar marcas combinantes.
 */
export function normalizeText(text: string): string {
    return text
        .normalize('NFD')                   // Descomponer caracteres acentuados (á → a + ́)
        .replace(/[\u0300-\u036f]/g, '')    // Eliminar los diacríticos combinantes
        .toLowerCase();                      // Convertir a minúsculas
}
