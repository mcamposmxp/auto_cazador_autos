import { NotificationSystem } from "@/components/NotificationSystem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notificaciones() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Centro de Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona cómo y cuándo quieres recibir notificaciones sobre tu actividad en AutoVenta Pro
          </p>
        </div>

        {/* Sistema de notificaciones */}
        <NotificationSystem />

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Acerca de las Notificaciones</CardTitle>
            <CardDescription>
              Información importante sobre cómo funcionan las notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Notificaciones Web</h4>
                <p className="text-sm text-muted-foreground">
                  Recibe alertas instantáneas en tu navegador, incluso cuando AutoVenta Pro no esté abierta.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Notificaciones en la App</h4>
                <p className="text-sm text-muted-foreground">
                  Todas las notificaciones también aparecen en tu centro de notificaciones dentro de la aplicación.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Privacidad</h4>
                <p className="text-sm text-muted-foreground">
                  Nunca compartimos tu información. Las notificaciones solo contienen información relevante para ti.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Control Total</h4>
                <p className="text-sm text-muted-foreground">
                  Puedes desactivar las notificaciones en cualquier momento desde esta página o desde tu navegador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}