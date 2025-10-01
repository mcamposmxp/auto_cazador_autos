import { AlertCircle, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useDebugMode } from '@/hooks/useDebugMode';

interface ErrorBlockProps {
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
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBlock({
  title,
  message,
  errorCode,
  errorDetails,
  onRetry,
  onDismiss
}: ErrorBlockProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { debugMode } = useDebugMode();

  return (
    <Alert variant="destructive" className="mb-4 border-destructive/50 bg-destructive/10">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTitle className="text-destructive font-semibold">
                {title}
              </AlertTitle>
              {errorCode && (
                <Badge variant="outline" className="text-xs font-mono border-destructive/30 text-destructive">
                  {errorCode}
                </Badge>
              )}
            </div>
            <AlertDescription className="text-destructive/90">
              {message}
            </AlertDescription>

            {/* Sugerencia */}
            {errorDetails?.suggestion && (
              <div className="mt-2 p-3 bg-background/50 border border-border rounded-md">
                <p className="text-sm text-muted-foreground">
                  💡 <span className="font-medium">Sugerencia:</span> {errorDetails.suggestion}
                </p>
              </div>
            )}

            {/* Detalles técnicos (solo en modo debug) */}
            {debugMode && errorDetails && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Ocultar detalles técnicos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Ver detalles técnicos
                    </>
                  )}
                </Button>

                {showDetails && (
                  <div className="mt-2 space-y-2">
                    {errorDetails.timestamp && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Timestamp:</span>{' '}
                        <span className="font-mono text-foreground">{errorDetails.timestamp}</span>
                      </div>
                    )}

                    {errorDetails.endpoint && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Endpoint:</span>{' '}
                        <span className="font-mono text-foreground break-all">{errorDetails.endpoint}</span>
                      </div>
                    )}

                    {errorDetails.statusCode && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Status Code:</span>{' '}
                        <Badge variant="destructive" className="font-mono text-xs">
                          {errorDetails.statusCode}
                        </Badge>
                      </div>
                    )}

                    {errorDetails.requestData && Object.keys(errorDetails.requestData).length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Request Data:</span>
                        <pre className="mt-1 p-2 bg-muted/50 border border-border rounded text-xs overflow-x-auto">
                          {JSON.stringify(errorDetails.requestData, null, 2)}
                        </pre>
                      </div>
                    )}

                    {errorDetails.stackTrace && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Stack Trace:</span>
                        <pre className="mt-1 p-2 bg-muted/50 border border-border rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {errorDetails.stackTrace}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}