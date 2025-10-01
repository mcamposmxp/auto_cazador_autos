import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DebugInfoProps {
  title: string;
  data: {
    fuente: string;
    fuenteTipo?: 'online' | 'fallback' | 'cache';
    consulta?: string;
    parametros?: Record<string, any>;
    datosPredecesores?: {
      fuente: string;
      valor: any;
      fecha?: string;
    }[];
    reglasAplicadas?: string[];
    calculos?: {
      formula: string;
      formulaConValores?: string;
      valores: Record<string, any>;
      resultado: any;
      documentacion?: string;
    }[];
    tiempoRespuesta?: number;
    observaciones?: string[];
    procesamiento?: {
      pasos: string[];
      filtros: string[];
      transformaciones: string[];
    };
  };
}

export function DebugInfo({ title, data }: DebugInfoProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
          <Info className="h-4 w-4 text-orange-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border-border z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-orange-500" />
            Debug: {title}
          </DialogTitle>
          <DialogDescription>
            Información técnica sobre el origen y cálculo de estos datos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Fuente de datos */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              📊 Fuente de datos
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {data.fuente}
              </Badge>
              {data.fuenteTipo && (
                <Badge 
                  variant={data.fuenteTipo === 'online' ? 'default' : data.fuenteTipo === 'fallback' ? 'secondary' : 'outline'}
                  className="font-mono"
                >
                  {data.fuenteTipo === 'online' && '🟢 Online (API en tiempo real)'}
                  {data.fuenteTipo === 'fallback' && '🟡 Fallback (Caché de respaldo)'}
                  {data.fuenteTipo === 'cache' && '🔵 Cache (Datos recientes)'}
                </Badge>
              )}
            </div>
            {data.fuenteTipo === 'fallback' && (
              <p className="text-xs text-muted-foreground mt-2">
                ℹ️ Estos datos provienen del último cálculo exitoso almacenado en caché debido a que la API externa no está disponible en este momento.
              </p>
            )}
          </div>

          {/* Consulta/API */}
          {data.consulta && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🔍 Consulta realizada
              </h4>
              <div className="bg-muted/50 border border-border p-3 rounded-md">
                <code className="text-sm text-foreground font-mono">{data.consulta}</code>
              </div>
            </div>
          )}

          {/* Parámetros */}
          {data.parametros && Object.keys(data.parametros).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                ⚙️ Parámetros utilizados
              </h4>
              <div className="bg-muted/30 border border-border p-3 rounded-md space-y-1">
                {Object.entries(data.parametros).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">{key}:</span>
                    <span className="font-mono text-foreground">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cálculos */}
          {data.calculos && data.calculos.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🧮 Cálculos aplicados
              </h4>
              <div className="space-y-3">
                {data.calculos.map((calculo, index) => (
                  <div key={index} className="bg-muted/30 border border-border p-3 rounded-md">
                    <div className="font-medium text-sm mb-2 text-foreground">Fórmula:</div>
                    <code className="text-sm bg-background border border-border p-2 rounded block mb-2 text-foreground font-mono">
                      {calculo.formula}
                    </code>
                    {calculo.formulaConValores && (
                      <>
                        <div className="font-medium text-sm mb-2 text-foreground">Fórmula con valores:</div>
                        <code className="text-sm bg-muted border border-border p-2 rounded block mb-2 text-foreground font-mono text-green-700 dark:text-green-300">
                          {calculo.formulaConValores}
                        </code>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Valores:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(calculo.valores).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-foreground">{key}:</span>
                              <span className="font-mono text-foreground">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Resultado:</span>
                        <div className="mt-1">
                          <Badge variant="default" className="font-mono">
                            {JSON.stringify(calculo.resultado)}
                          </Badge>
                          {calculo.documentacion && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">
                                📖 Ver implementación: <code className="bg-muted px-1 py-0.5 rounded text-xs">{calculo.documentacion}</code>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiempo de respuesta */}
          {data.tiempoRespuesta && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                ⏱️ Rendimiento
              </h4>
              <Badge variant={data.tiempoRespuesta < 1000 ? "default" : "destructive"}>
                {data.tiempoRespuesta}ms
              </Badge>
            </div>
          )}

          {/* Datos predecesores */}
          {data.datosPredecesores && data.datosPredecesores.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                📋 Datos predecesores
              </h4>
              <div className="space-y-2">
                {data.datosPredecesores.map((dato, index) => (
                  <div key={index} className="bg-muted/30 border border-border p-3 rounded-md">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground">{dato.fuente}</span>
                      {dato.fecha && (
                        <span className="text-xs text-muted-foreground">{dato.fecha}</span>
                      )}
                    </div>
                    <div className="font-mono text-sm text-foreground">{JSON.stringify(dato.valor)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reglas aplicadas */}
          {data.reglasAplicadas && data.reglasAplicadas.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                📏 Reglas aplicadas
              </h4>
              <ul className="space-y-1">
                {data.reglasAplicadas.map((regla, index) => (
                  <li key={index} className="text-sm bg-muted/20 border border-border p-2 rounded flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-foreground">{regla}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Procesamiento */}
          {data.procesamiento && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                ⚡ Procesamiento
              </h4>
              <div className="space-y-3">
                {data.procesamiento.pasos.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Pasos:</span>
                    <ol className="mt-1 space-y-1">
                      {data.procesamiento.pasos.map((paso, index) => (
                        <li key={index} className="text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2 rounded flex gap-2">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{index + 1}.</span>
                          <span className="text-blue-900 dark:text-blue-100">{paso}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {data.procesamiento.filtros.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
                    <ul className="mt-1 space-y-1">
                      {data.procesamiento.filtros.map((filtro, index) => (
                        <li key={index} className="text-sm bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-2 rounded flex gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">🔍</span>
                          <span className="text-yellow-900 dark:text-yellow-100">{filtro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.procesamiento.transformaciones.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Transformaciones:</span>
                    <ul className="mt-1 space-y-1">
                      {data.procesamiento.transformaciones.map((transformacion, index) => (
                        <li key={index} className="text-sm bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-2 rounded flex gap-2">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">🔄</span>
                          <span className="text-purple-900 dark:text-purple-100">{transformacion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {data.observaciones && data.observaciones.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                💡 Observaciones
              </h4>
              <ul className="space-y-1">
                {data.observaciones.map((observacion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    {observacion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}