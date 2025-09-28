import { UserMetricsDashboard } from "@/components/analytics/UserMetricsDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Shield } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function MisDatos() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Mis Datos y Métricas
          </h1>
          <p className="text-muted-foreground">
            Analiza tu actividad, progreso y estadísticas personales en AutoVenta Pro
          </p>
        </div>

        {/* Dashboard de métricas */}
        <UserMetricsDashboard />

        {/* Seguridad de la cuenta */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Seguridad
            </h2>
            <p className="text-muted-foreground">
              Gestiona la seguridad de tu cuenta y actualiza tus credenciales
            </p>
          </div>
          
          <ChangePasswordForm />
        </div>

        {/* Información sobre privacidad */}
        <Card>
          <CardHeader>
            <CardTitle>Privacidad de tus Datos</CardTitle>
            <CardDescription>
              Cómo protegemos y usamos tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Datos Seguros</h4>
                <p className="text-sm text-muted-foreground">
                  Toda tu información se almacena de forma segura y encriptada.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">No Compartimos</h4>
                <p className="text-sm text-muted-foreground">
                  Nunca vendemos o compartimos tus datos personales con terceros.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Control Total</h4>
                <p className="text-sm text-muted-foreground">
                  Puedes exportar o eliminar tus datos en cualquier momento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}