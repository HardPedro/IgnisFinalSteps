import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
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

  public render() {
    if (this.state.hasError) {
      let errorDetails = this.state.error?.message;
      let isFirestoreError = false;
      
      try {
        if (errorDetails && errorDetails.startsWith('{')) {
          const parsed = JSON.parse(errorDetails);
          if (parsed.operationType) {
            isFirestoreError = true;
            errorDetails = `Erro de Permissão no Banco de Dados: Não foi possível realizar a operação (${parsed.operationType}) no caminho '${parsed.path}'. Verifique suas permissões ou contate o suporte.`;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado.</h2>
            <p className="text-gray-600 mb-6">
              {isFirestoreError 
                ? errorDetails 
                : "Ocorreu um erro inesperado na aplicação. Nossa equipe técnica já foi notificada."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Recarregar Página
            </button>
            
            {!isFirestoreError && this.state.error && (
              <div className="mt-8 text-left">
                <p className="text-xs text-gray-400 font-mono break-all bg-gray-100 p-4 rounded-lg">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children as ReactNode;
  }
}
