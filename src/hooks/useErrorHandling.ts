import { useState, useCallback } from 'react';
import { errorLogger } from '@/utils/errorLogger';
import type { ErrorCategory, ErrorSeverity } from '@/utils/errorLogger';

export interface ErrorState {
  hasError: boolean;
  title: string;
  message: string;
  errorCode?: string;
  errorDetails?: {
    timestamp?: string;
    endpoint?: string;
    statusCode?: number;
    requestData?: Record<string, any>;
    stackTrace?: string;
    suggestion?: string;
  };
}

export function useErrorHandling() {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((params: {
    title: string;
    message: string;
    errorCode?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    endpoint?: string;
    statusCode?: number;
    requestData?: Record<string, any>;
    stackTrace?: string;
    suggestion?: string;
    context?: Record<string, any>;
  }) => {
    const timestamp = new Date().toISOString();
    
    // Registrar en el logger
    errorLogger.log({
      category: params.category || 'frontend',
      severity: params.severity || 'medium',
      message: params.message,
      errorCode: params.errorCode,
      details: {
        endpoint: params.endpoint,
        statusCode: params.statusCode,
        requestData: params.requestData,
        stackTrace: params.stackTrace,
      },
      context: params.context,
    });

    // Actualizar estado de error
    setError({
      hasError: true,
      title: params.title,
      message: params.message,
      errorCode: params.errorCode,
      errorDetails: {
        timestamp,
        endpoint: params.endpoint,
        statusCode: params.statusCode,
        requestData: params.requestData,
        stackTrace: params.stackTrace,
        suggestion: params.suggestion,
      },
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAPIError = useCallback((params: {
    endpoint: string;
    statusCode?: number;
    message: string;
    errorCode?: string;
    requestData?: Record<string, any>;
    stackTrace?: string;
    suggestion?: string;
  }) => {
    handleError({
      title: 'Error de API',
      message: params.message,
      errorCode: params.errorCode || `API_ERROR_${params.statusCode || 'UNKNOWN'}`,
      category: 'api',
      severity: params.statusCode && params.statusCode >= 500 ? 'high' : 'medium',
      endpoint: params.endpoint,
      statusCode: params.statusCode,
      requestData: params.requestData,
      stackTrace: params.stackTrace,
      suggestion: params.suggestion,
    });
  }, [handleError]);

  const handleNetworkError = useCallback((params: {
    endpoint: string;
    message?: string;
  }) => {
    handleError({
      title: 'Error de Conexión',
      message: params.message || 'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.',
      errorCode: 'NETWORK_ERROR',
      category: 'network',
      severity: 'high',
      endpoint: params.endpoint,
      suggestion: 'Verifica tu conexión a internet y vuelve a intentar.',
    });
  }, [handleError]);

  return {
    error,
    handleError,
    handleAPIError,
    handleNetworkError,
    clearError,
  };
}