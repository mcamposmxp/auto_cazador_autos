import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users, 
  Star,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/hooks/useAuthSession';
import { formatPrice, formatNumber } from '@/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

interface UserMetrics {
  // Actividad general
  totalQueries: number;
  queriesThisMonth: number;
  creditsUsed: number;
  creditsAvailable: number;
  
  // Valuaciones
  vehiclesValued: number;
  averageValuation: number;
  totalValuationValue: number;
  
  // Ofertas (si es profesional)
  totalOffers?: number;
  acceptedOffers?: number;
  acceptanceRate?: number;
  
  // Reviews
  averageRating?: number;
  totalReviews?: number;
  
  // Actividad temporal
  dailyActivity: { date: string; queries: number }[];
  monthlyTrends: { month: string; activity: number }[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  progress: number;
  maxProgress: number;
}

export function UserMetricsDashboard() {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuthSession();

  useEffect(() => {
    if (user) {
      loadUserMetrics();
      loadAchievements();
    }
  }, [user]);

  const loadUserMetrics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Obtener datos de créditos
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Obtener transacciones de créditos
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Calcular métricas básicas
      const totalQueries = transactionsData?.length || 0;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const queriesThisMonth = transactionsData?.filter(t => 
        new Date(t.created_at) >= thisMonth
      ).length || 0;

      // Generar actividad diaria (últimos 30 días)
      const dailyActivity = generateDailyActivity(transactionsData || []);
      
      // Generar tendencias mensuales (últimos 6 meses)
      const monthlyTrends = generateMonthlyTrends(transactionsData || []);

      const metricsData: UserMetrics = {
        totalQueries,
        queriesThisMonth,
        creditsUsed: creditsData?.credits_used_this_month || 0,
        creditsAvailable: creditsData?.credits_available || 0,
        vehiclesValued: Math.floor(totalQueries * 0.8), // Estimación
        averageValuation: 285000,
        totalValuationValue: Math.floor(totalQueries * 0.8) * 285000,
        dailyActivity,
        monthlyTrends
      };

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading user metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyActivity = (transactions: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        queries: 0
      };
    }).reverse();

    transactions.forEach(transaction => {
      const transactionDate = transaction.created_at.split('T')[0];
      const dayIndex = last30Days.findIndex(d => d.date === transactionDate);
      if (dayIndex !== -1) {
        last30Days[dayIndex].queries++;
      }
    });

    return last30Days;
  };

  const generateMonthlyTrends = (transactions: any[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      activity: Math.floor(Math.random() * 50) + 10 // Datos simulados
    }));
  };

  const loadAchievements = async () => {
    if (!metrics) return;

    const achievementsList: Achievement[] = [
      {
        id: 'first_valuation',
        title: 'Primera Valuación',
        description: 'Realizaste tu primera valuación de vehículo',
        icon: <Star className="h-5 w-5" />,
        completed: metrics.vehiclesValued > 0,
        progress: Math.min(metrics.vehiclesValued, 1),
        maxProgress: 1
      },
      {
        id: 'power_user',
        title: 'Usuario Avanzado',
        description: 'Realiza 50 consultas',
        icon: <Activity className="h-5 w-5" />,
        completed: metrics.totalQueries >= 50,
        progress: Math.min(metrics.totalQueries, 50),
        maxProgress: 50
      },
      {
        id: 'monthly_active',
        title: 'Activo Este Mes',
        description: 'Usa AutoVenta Pro 10 veces este mes',
        icon: <Calendar className="h-5 w-5" />,
        completed: metrics.queriesThisMonth >= 10,
        progress: Math.min(metrics.queriesThisMonth, 10),
        maxProgress: 10
      },
      {
        id: 'valuation_expert',
        title: 'Experto en Valuaciones',
        description: 'Valúa 100 vehículos diferentes',
        icon: <BarChart3 className="h-5 w-5" />,
        completed: metrics.vehiclesValued >= 100,
        progress: Math.min(metrics.vehiclesValued, 100),
        maxProgress: 100
      }
    ];

    setAchievements(achievementsList);
  };

  useEffect(() => {
    if (metrics) {
      loadAchievements();
    }
  }, [metrics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No se pudieron cargar las métricas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Mi Dashboard</h2>
        <p className="text-muted-foreground">
          Analiza tu actividad y progreso en AutoVenta Pro
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalQueries)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.queriesThisMonth} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponibles</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.creditsAvailable}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.creditsUsed} usados este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehículos Valuados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.vehiclesValued)}</div>
            <p className="text-xs text-muted-foreground">
              Valor promedio: {formatPrice(metrics.averageValuation)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Analizado</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(metrics.totalValuationValue)}</div>
            <p className="text-xs text-muted-foreground">
              En {metrics.vehiclesValued} valuaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para detalles */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Tus consultas en los últimos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {metrics.dailyActivity.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('es-MX', { 
                        weekday: 'short', 
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(day.queries / Math.max(...metrics.dailyActivity.map(d => d.queries), 1)) * 100} 
                        className="w-20 h-2" 
                      />
                      <span className="text-sm font-medium w-8 text-right">
                        {day.queries}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className={`
                    p-2 rounded-full mr-3
                    ${achievement.completed 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{achievement.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {achievement.description}
                    </CardDescription>
                  </div>
                  {achievement.completed && (
                    <Badge variant="default">Completado</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
              <CardDescription>
                Tu actividad en AutoVenta Pro a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {metrics.monthlyTrends.map((trend, index) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{trend.month}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(trend.activity / Math.max(...metrics.monthlyTrends.map(t => t.activity))) * 100} 
                        className="w-32 h-2" 
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {trend.activity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}