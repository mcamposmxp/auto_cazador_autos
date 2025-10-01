/**
 * Sistema de logging de errores
 * Registra errores en consola con formato estructurado
 * En producción, estos logs pueden ser capturados por servicios de monitoreo
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'frontend' | 'backend' | 'api' | 'database' | 'network';

export interface ErrorLogEntry {
  timestamp: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  errorCode?: string;
  details?: {
    userId?: string;
    endpoint?: string;
    statusCode?: number;
    requestData?: Record<string, any>;
    stackTrace?: string;
    userAgent?: string;
    url?: string;
  };
  context?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogsInMemory = 100;

  /**
   * Registra un error en el sistema de logging
   */
  log(entry: Omit<ErrorLogEntry, 'timestamp'>): void {
    const logEntry: ErrorLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Agregar a memoria
    this.logs.push(logEntry);
    
    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Log en consola con formato
    this.logToConsole(logEntry);

    // Enviar logs críticos y de alta severidad a la base de datos
    if (entry.severity === 'critical' || entry.severity === 'high') {
      this.notifyCriticalError(logEntry);
    }
  }

  /**
   * Log formateado en consola
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.category.toUpperCase()}] [${entry.severity.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    const consoleMethod = entry.severity === 'critical' || entry.severity === 'high' 
      ? console.error 
      : console.warn;

    consoleMethod(message, {
      timestamp: entry.timestamp,
      errorCode: entry.errorCode,
      details: entry.details,
      context: entry.context,
    });
  }

  /**
   * Notificar errores críticos y enviarlos a la base de datos
   */
  private async notifyCriticalError(entry: ErrorLogEntry): Promise<void> {
    console.error('🚨 CRITICAL ERROR DETECTED:', {
      message: entry.message,
      timestamp: entry.timestamp,
      details: entry.details,
    });

    // Enviar a la base de datos vía Edge Function
    this.sendToDatabase(entry);
  }

  /**
   * Enviar log a la base de datos vía Edge Function
   */
  private async sendToDatabase(entry: ErrorLogEntry): Promise<void> {
    try {
      const response = await fetch(
        'https://qflkgtejwqudtceszguf.supabase.co/functions/v1/log-error',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGtndGVqd3F1ZHRjZXN6Z3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzQ4NDAsImV4cCI6MjA2OTE1MDg0MH0.23z2cICQB3TUhwC_1ncFfuv6Wm7POmUeIhp5bDMDdsU',
          },
          body: JSON.stringify({
            category: entry.category,
            severity: entry.severity,
            message: entry.message,
            errorCode: entry.errorCode,
            details: entry.details,
            context: entry.context,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send log to database:', await response.text());
      }
    } catch (error) {
      // Evitar error infinito si el envío falla
      console.error('Error sending log to database:', error);
    }
  }

  /**
   * Obtener logs recientes
   */
  getRecentLogs(count: number = 20): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Obtener logs por categoría
   */
  getLogsByCategory(category: ErrorCategory): ErrorLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Obtener logs por severidad
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Limpiar logs en memoria
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log específico para errores de API
   */
  logAPIError(params: {
    endpoint: string;
    statusCode?: number;
    message: string;
    errorCode?: string;
    requestData?: Record<string, any>;
    stackTrace?: string;
    severity?: ErrorSeverity;
  }): void {
    this.log({
      category: 'api',
      severity: params.severity || 'high',
      message: params.message,
      errorCode: params.errorCode,
      details: {
        endpoint: params.endpoint,
        statusCode: params.statusCode,
        requestData: params.requestData,
        stackTrace: params.stackTrace,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * Log específico para errores de frontend
   */
  logFrontendError(params: {
    message: string;
    errorCode?: string;
    stackTrace?: string;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
  }): void {
    this.log({
      category: 'frontend',
      severity: params.severity || 'medium',
      message: params.message,
      errorCode: params.errorCode,
      details: {
        stackTrace: params.stackTrace,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      context: params.context,
    });
  }

  /**
   * Log específico para errores de red
   */
  logNetworkError(params: {
    endpoint: string;
    message: string;
    errorCode?: string;
    severity?: ErrorSeverity;
  }): void {
    this.log({
      category: 'network',
      severity: params.severity || 'high',
      message: params.message,
      errorCode: params.errorCode,
      details: {
        endpoint: params.endpoint,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });
  }
}

// Instancia singleton
export const errorLogger = new ErrorLogger();