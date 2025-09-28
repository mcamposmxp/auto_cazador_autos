import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, TrendingUp, Database, Clock, AlertCircle, FileText, Gift } from "lucide-react";
import { DatabaseSchema } from "@/components/DatabaseSchema";
import { BannerEvaluacionCreditos } from "@/components/BannerEvaluacionCreditos";
import { ReferralSystem } from "@/components/ReferralSystem";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { Suspense, lazy } from "react";

// Lazy load components pesados
const LazyAIDashboard = lazy(() => import("@/components/analytics/AIDashboard"));
const LazyAdminCharts = lazy(() => import("@/components/analytics/AdminCharts").then(module => ({ default: module.AdminCharts })));
const LazyPredictiveRecommendations = lazy(() => import("@/components/analytics/PredictiveRecommendations").then(module => ({ default: module.PredictiveRecommendations })));

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  status?: "success" | "warning" | "destructive";
}

const MetricCard = ({ title, value, description, icon, trend, status }: MetricCardProps) => (
  <Card className="bg-gradient-to-br from-card to-muted/20 border-border/50 hover:shadow-lg transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-primary">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <Badge variant={status === "success" ? "default" : status === "warning" ? "secondary" : "destructive"} className="text-xs">
            {trend}
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
);

interface SourceCardProps {
  name: string;
  status: "active" | "inactive" | "error";
  lastSync: string;
  totalAds: number;
  newToday: number;
}

const SourceCard = ({ name, status, lastSync, totalAds, newToday }: SourceCardProps) => (
  <Card className="bg-gradient-to-br from-card to-muted/10 border-border/50">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        <Badge 
          variant={status === "active" ? "default" : status === "error" ? "destructive" : "secondary"}
          className="capitalize"
        >
          {status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total anuncios</p>
          <p className="font-semibold text-foreground">{totalAds.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Nuevos hoy</p>
          <p className="font-semibold text-success">+{newToday}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Última sincronización: {lastSync}
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const sources = [
    {
      name: "MercadoLibre",
      status: "active" as const,
      lastSync: "Hace 15 min",
      totalAds: 12847,
      newToday: 245
    },
    {
      name: "Facebook Marketplace",
      status: "active" as const,
      lastSync: "Hace 32 min",
      totalAds: 8934,
      newToday: 189
    },
    {
      name: "Kavak",
      status: "inactive" as const,
      lastSync: "Hace 2 horas",
      totalAds: 5621,
      newToday: 67
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sistema de Extracción Automotriz
          </h1>
          <p className="text-muted-foreground">
            Monitoreo y análisis de mercado automotriz mexicano
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-primary-hover">
            <Database className="w-4 h-4 mr-2" />
            Conectar Supabase
          </Button>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-fit lg:grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="referidos" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Invitar Amigos
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Esquema DB
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Anuncios"
              value="27,402"
              description="En todas las plataformas"
              icon={<Car className="w-5 h-5" />}
              trend="+8.2%"
              status="success"
            />
            <MetricCard
              title="Nuevos Hoy"
              value="501"
              description="Anuncios detectados"
              icon={<TrendingUp className="w-5 h-5" />}
              trend="+12.1%"
              status="success"
            />
            <MetricCard
              title="Duplicados Detectados"
              value="89"
              description="Entre plataformas"
              icon={<AlertCircle className="w-5 h-5" />}
              trend="3.2%"
              status="warning"
            />
            <MetricCard
              title="Tiempo Promedio"
              value="12 días"
              description="En el mercado"
              icon={<Clock className="w-5 h-5" />}
              trend="-2.3 días"
              status="success"
            />
          </div>

          {/* Banner de créditos por evaluaciones */}
          <BannerEvaluacionCreditos />

          {/* Estado de fuentes */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Estado de Fuentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.map((source) => (
                <SourceCard key={source.name} {...source} />
              ))}
            </div>
          </div>

          {/* Próximas características */}
          <Card className="bg-gradient-to-br from-accent/10 to-warning/10 border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-accent" />
                Siguiente Paso: Configurar Base de Datos
              </CardTitle>
              <CardDescription>
                Para activar la extracción automática y almacenamiento de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-2">Funcionalidades disponibles con Supabase:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Almacenamiento automático de anuncios</li>
                    <li>Deduplicación inteligente entre plataformas</li>
                    <li>Tracking temporal de publicaciones</li>
                    <li>APIs para análisis y reportes</li>
                    <li>Automatización de extracción diaria</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referidos">
          <ReferralSystem />
        </TabsContent>

        <TabsContent value="schema">
          <DatabaseSchema />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Extracción</CardTitle>
              <CardDescription>
                Configurar parámetros para la extracción de datos de cada plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Conecta Supabase para acceder a la configuración completa</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};