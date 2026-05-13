/**
 * @fileoverview Funciones utilitarias (helpers) de uso general para el frontend.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
