import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Search, FileText, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";

interface CreditStats {
  credits_available: number;
  credits_used_this_month: number;
  credits_used_ads: number;
  credits_used_searches: number;
  monthly_limit: number;
  plan_type: string;
}

interface VehicleCacheStatus {
  vehicle_key: string;
  last_updated: string;
  expires_at: string;
  is_expired: boolean;
}

export function CreditBreakdown() {
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [cacheStatus, setCacheStatus] = useState<VehicleCacheStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreditStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get credit stats
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .select('credits_available, credits_used_this_month, credits_used_ads, credits_used_searches, monthly_limit, plan_type')
        .eq('user_id', user.id)
        .single();

      if (creditError) {
        console.error('Error fetching credit stats:', creditError);
        return;
      }

      setStats(creditData);

      // Get cache status
      const { data: cacheData, error: cacheError } = await supabase
        .from('vehicle_market_cache')
        .select('vehicle_key, last_updated, expires_at')
        .eq('user_id', user.id);

      if (!cacheError && cacheData) {
        const cacheWithStatus = cacheData.map(cache => ({
          ...cache,
          is_expired: new Date(cache.expires_at) < new Date()
        }));
        setCacheStatus(cacheWithStatus);
      }

    } catch (error) {
      console.error('Error in fetchCreditStats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando estadísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No se pudieron cargar las estadísticas de créditos</p>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (stats.credits_used_this_month / stats.monthly_limit) * 100;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen de Créditos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.credits_available}</div>
              <div className="text-sm text-muted-foreground">Créditos Disponibles</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.credits_used_this_month}</div>
              <div className="text-sm text-muted-foreground">Usados este Mes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.monthly_limit}</div>
              <div className="text-sm text-muted-foreground">Límite Mensual</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso mensual</span>
              <span>{Math.round(usagePercentage)}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          <Badge variant="outline" className="mx-auto block w-fit">
            Plan {stats.plan_type}
          </Badge>
        </CardContent>
      </Card>

      {/* Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Desglose de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium">Búsquedas Manuales</div>
                  <div className="text-sm text-muted-foreground">Consultas directas de precios</div>
                </div>
              </div>
              <div className="text-xl font-bold text-orange-600">
                {stats.credits_used_searches}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Mis Anuncios</div>
                  <div className="text-sm text-muted-foreground">Info de mercado automática</div>
                </div>
              </div>
              <div className="text-xl font-bold text-purple-600">
                {stats.credits_used_ads}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Status */}
      {cacheStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estado del Cache de Vehículos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cacheStatus.map((cache, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{cache.vehicle_key.replace(/-/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      Actualizado: {new Date(cache.last_updated).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <Badge variant={cache.is_expired ? "destructive" : "secondary"}>
                    {cache.is_expired ? "Expirado" : "Vigente"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                💡 <strong>Cache inteligente:</strong> Los datos se actualizan automáticamente cada 24 horas 
                para optimizar el consumo de créditos. El reseteo nocturno ocurre a las 3:00 AM.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchCreditStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar Estadísticas
        </Button>
      </div>
    </div>
  );
}