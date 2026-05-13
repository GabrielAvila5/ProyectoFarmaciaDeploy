/**
 * @fileoverview Componente Global Error Boundary para React.
 * Atrapa cualquier excepción no controlada en la jerarquía de subcomponentes, mostrando 
 * una UI amigable de respaldo (fallback) en vez de crashear o romper todo el dashboard.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // En un caso real, esto enviaría el error a un servicio como Sentry.
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center shadow-lg animate-fade-in">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Ha ocurrido un error inesperado al renderizar el componente. Puedes intentar recargar la página para limpiar el estado.
            </p>
            {this.state.error && (
              <div className="bg-muted p-3 rounded-lg text-left mb-6 overflow-x-auto">
                <p className="text-xs font-mono text-destructive">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors w-full"
            >
              <RefreshCcw className="w-4 h-4" /> Recargar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
