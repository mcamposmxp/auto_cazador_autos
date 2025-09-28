import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useAIPerformanceMonitor } from '@/hooks/useAIPerformanceMonitor';
import { formatRelativeTime } from '@/utils/formatters';

const AIDashboard: React.FC = () => {
  const { 
    metrics, 
    startMonitoring, 
    getHealthScore, 
    getRecentErrors, 
    clearHistory 
  } = useAIPerformanceMonitor();
  
  const [healthScore, setHealthScore] = useState(0);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  useEffect(() => {
    const cleanup = startMonitoring();
    setHealthScore(getHealthScore());
    setRecentErrors(getRecentErrors(10));
    
    return cleanup;
  }, [startMonitoring, getHealthScore, getRecentErrors]);

  useEffect(() => {
    setHealthScore(getHealthScore());
    setRecentErrors(getRecentErrors(10));
  }, [metrics, getHealthScore, getRecentErrors]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excelente' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Bueno' };
    return { variant: 'destructive' as const, label: 'Crítico' };
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Panel de Control IA</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearHistory}
          >
            <Settings className="h-4 w-4 mr-2" />
            Limpiar Historial
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Salud del Sistema</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                    {Math.round(healthScore)}%
                  </span>
                  <Badge {...getHealthBadge(healthScore)}>
                    {getHealthBadge(healthScore).label}
                  </Badge>
                </div>
              </div>
              <CheckCircle className={`h-8 w-8 ${getHealthColor(healthScore)}`} />
            </div>
            <Progress value={healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                <p className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.requestCount} solicitudes procesadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">
                  {formatResponseTime(metrics.avgResponseTime)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tiempo de respuesta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Eficiencia de caché
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="errors">Errores</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas Generales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Solicitudes Totales:</span>
                    <span className="font-medium">{metrics.requestCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Exitosas:</span>
                    <span className="font-medium text-success">
                      {Math.round((metrics.successRate / 100) * metrics.requestCount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fallidas:</span>
                    <span className="font-medium text-destructive">
                      {metrics.requestCount - Math.round((metrics.successRate / 100) * metrics.requestCount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cache Hits:</span>
                    <span className="font-medium text-accent">
                      {Math.round((metrics.cacheHitRate / 100) * metrics.requestCount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Estado Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Última Actualización:</span>
                    <span className="font-medium">
                      {formatRelativeTime(metrics.lastUpdated)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tiempo Máximo:</span>
                    <span className="font-medium">
                      {formatResponseTime(Math.max(...(recentErrors.map(e => e.endTime - e.startTime) || [0])))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Estabilidad:</span>
                    <Badge variant={metrics.successRate > 95 ? 'default' : metrics.successRate > 80 ? 'secondary' : 'destructive'}>
                      {metrics.successRate > 95 ? 'Estable' : metrics.successRate > 80 ? 'Moderada' : 'Inestable'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Análisis de Errores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.errorTypes).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(metrics.errorTypes).map(([type, count]) => (
                      <div key={type} className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-destructive">{count}</p>
                        <p className="text-sm text-muted-foreground">{type}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Errores Recientes:</h4>
                    {recentErrors.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentErrors.map((error, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-destructive/5">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{error.type}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatRelativeTime(new Date(error.startTime))}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {error.error}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay errores recientes</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                  <p className="text-lg font-medium">¡Sin errores!</p>
                  <p className="text-muted-foreground">El sistema IA está funcionando perfectamente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Métricas de Velocidad</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Tiempo Promedio</span>
                        <span className="text-sm font-medium">
                          {formatResponseTime(metrics.avgResponseTime)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (metrics.avgResponseTime / 10000) * 100)} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Eficiencia Cache</span>
                        <span className="text-sm font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.cacheHitRate} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Recomendaciones</h4>
                  <div className="space-y-2">
                    {metrics.successRate < 90 && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium text-destructive">
                          Tasa de éxito baja
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Revisar configuración de API y rate limits
                        </p>
                      </div>
                    )}
                    
                    {metrics.avgResponseTime > 8000 && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm font-medium text-warning">
                          Respuestas lentas
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Considerar optimizar prompts o usar modelo más rápido
                        </p>
                      </div>
                    )}
                    
                    {metrics.cacheHitRate < 30 && metrics.requestCount > 10 && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm font-medium text-warning">
                          Cache ineficiente
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Revisar estrategia de cacheo
                        </p>
                      </div>
                    )}
                    
                    {metrics.successRate >= 95 && metrics.avgResponseTime < 5000 && (
                      <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-sm font-medium text-success">
                          Rendimiento óptimo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sistema funcionando correctamente
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIDashboard;