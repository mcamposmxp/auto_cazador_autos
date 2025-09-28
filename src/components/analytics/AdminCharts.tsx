import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AdminAnalytics } from "@/hooks/useAdminAnalytics";

interface AdminChartsProps {
  analytics: AdminAnalytics;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

export function AdminCharts({ analytics }: AdminChartsProps) {
  const userTypeData = [
    { name: 'Profesionales', value: analytics.professionalUsers, fill: 'hsl(var(--primary))' },
    { name: 'Particulares', value: analytics.particularUsers, fill: 'hsl(var(--accent))' }
  ];

  const vehicleOperationsData = [
    { name: 'Red Profesionales', value: analytics.carsToNetwork, fill: 'hsl(var(--primary))' },
    { name: 'Subasta', value: analytics.carsToAuction, fill: 'hsl(var(--accent))' },
    { name: 'Venta Directa', value: analytics.carsToDirectSale, fill: 'hsl(var(--secondary))' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Activity Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Actividad Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              users: { label: "Usuarios", color: "hsl(var(--primary))" },
              queries: { label: "Consultas", color: "hsl(var(--accent))" }
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="users" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="queries" stackId="2" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* User Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              profesionales: { label: "Profesionales", color: "hsl(var(--primary))" },
              particulares: { label: "Particulares", color: "hsl(var(--accent))" }
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Vehicle Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Operaciones de Vehículos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              red: { label: "Red Profesionales", color: "hsl(var(--primary))" },
              subasta: { label: "Subasta", color: "hsl(var(--accent))" },
              directa: { label: "Venta Directa", color: "hsl(var(--secondary))" }
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleOperationsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Daily Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Actividad Diaria (Últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              visits: { label: "Visitas", color: "hsl(var(--primary))" },
              registrations: { label: "Registros", color: "hsl(var(--accent))" }
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="registrations" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}