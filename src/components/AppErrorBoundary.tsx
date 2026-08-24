import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Algo correu mal</h2>
            <p className="text-sm text-muted-foreground mb-6">
              A aplicação encontrou um erro inesperado. Pedimos desculpa pelo incómodo.
            </p>
            {this.state.error && (
              <div className="bg-secondary/50 p-3 rounded-lg text-left w-full mb-6 overflow-auto max-h-32">
                <code className="text-xs text-secondary-foreground font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors w-full justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
