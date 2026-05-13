/**
 * @fileoverview Punto de entrada de React. Renderiza la aplicación en el DOM e inicializa el entorno global.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ui/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
