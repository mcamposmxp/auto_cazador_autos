import { useEffect } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { KPICard } from "@/components/analytics/KPICard";
import { AdminCharts } from "@/components/analytics/AdminCharts";
import { GeographicTable } from "@/components/analytics/GeographicTable";
import AIDashboard from "@/components/analytics/AIDashboard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  Search, 
  Car, 
  UserCheck, 
  TrendingUp,
  RefreshCw,
  BarChart3,
  Globe,
  Activity,
  Brain
} from "lucide-react";
import { toast } from "sonner";

function useDocumentSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }, [title, description]);
}

export default function AdminDashboard() {
  useDocumentSEO("Dashboard Administrativo · Panel", "Dashboard completo con métricas y análisis del sistema");
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { analytics, loading, error, refetch } = useAdminAnalytics();

  if (adminLoading) return <div className="p-6"><LoadingSpinner /></div>;
  if (!isAdmin) return <div className="p-6">Acceso restringido.</div>;

  if (loading) return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
        <p className="text-sm text-muted-foreground">Cargando métricas del sistema...</p>
      </header>
      <LoadingSpinner />
    </div>
  );

  if (error || !analytics) {
    return (
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-sm text-destructive">{error}</p>
        </header>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const handleRefresh = async () => {
    toast.info("Actualizando datos...");
    await refetch();
    toast.success("Datos actualizados");
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Análisis completo del sistema y métricas de negocio
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Financiero
          </TabsTrigger>
          <TabsTrigger value="geographic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geográfico
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Sistema IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Usuarios Totales"
              value={analytics.totalUsers}
              change={{ value: 12, isPositive: true, period: "mes anterior" }}
              icon={Users}
              description="Registrados en el sistema"
            />
            <KPICard
              title="Nuevos Este Mes"
              value={analytics.newUsersThisMonth}
              change={{ value: 8, isPositive: true, period: "mes anterior" }}
              icon={UserPlus}
              description="Registros del mes actual"
            />
            <KPICard
              title="Consultas de Mercado"
              value={analytics.totalMarketQueries}
              change={{ value: 15, isPositive: true, period: "mes anterior" }}
              icon={Search}
              description="Total de consultas realizadas"
            />
            <KPICard
              title="Autos en Red"
              value={analytics.carsToNetwork}
              change={{ value: 5, isPositive: true, period: "mes anterior" }}
              icon={Car}
              description="Enviados a profesionales"
            />
          </div>

          {/* Main Charts */}
          <AdminCharts analytics={analytics} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Usuarios Profesionales"
              value={analytics.professionalUsers}
              icon={UserCheck}
              description={`${((analytics.professionalUsers / analytics.totalUsers) * 100).toFixed(1)}% del total`}
            />
            <KPICard
              title="Usuarios Particulares"
              value={analytics.particularUsers}
              icon={Users}
              description={`${((analytics.particularUsers / analytics.totalUsers) * 100).toFixed(1)}% del total`}
            />
            <KPICard
              title="Referidos Totales"
              value={analytics.totalReferrals}
              change={{ value: analytics.referralsThisMonth, isPositive: true, period: "este mes" }}
              icon={TrendingUp}
              description="Sistema de referidos"
            />
          </div>

          {/* User Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Consultas por Tipo</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profesionales:</span>
                        <span className="font-medium">{analytics.professionalQueries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Particulares:</span>
                        <span className="font-medium">{analytics.particularQueries}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Operaciones de Vehículos</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Red profesionales:</span>
                        <span className="font-medium">{analytics.carsToNetwork}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subastas:</span>
                        <span className="font-medium">{analytics.carsToAuction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Venta directa:</span>
                        <span className="font-medium">{analytics.carsToDirectSale}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Ventas de Créditos"
              value={`$${analytics.creditSalesThisMonth.toLocaleString()}`}
              change={{ value: 22, isPositive: true, period: "mes anterior" }}
              icon={CreditCard}
              description="Ingresos del mes actual"
            />
            <KPICard
              title="Visitas Mensuales"
              value={analytics.monthlyVisits}
              change={{ value: 18, isPositive: true, period: "mes anterior" }}
              icon={TrendingUp}
              description="Tráfico del sitio web"
            />
            <KPICard
              title="Conversión a Pago"
              value="12.5%"
              change={{ value: 3, isPositive: true, period: "mes anterior" }}
              icon={UserCheck}
              description="De visitantes a usuarios premium"
            />
          </div>

          {/* Financial charts would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Financieras Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Ingresos por Fuente</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Créditos individuales:</span>
                      <span className="font-medium">${(analytics.creditSalesThisMonth * 0.7).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Planes premium:</span>
                      <span className="font-medium">${(analytics.creditSalesThisMonth * 0.25).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Corporativo:</span>
                      <span className="font-medium">${(analytics.creditSalesThisMonth * 0.05).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Consumo de Créditos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Búsquedas de mercado:</span>
                      <span className="font-medium">{Math.floor(analytics.totalMarketQueries * 0.8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Visualización anuncios:</span>
                      <span className="font-medium">{Math.floor(analytics.totalMarketQueries * 0.2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <GeographicTable analytics={analytics} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AIDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}