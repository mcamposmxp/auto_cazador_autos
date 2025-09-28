import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useVerificacionProfesionales } from "@/hooks/useVerificacionProfesionales";
import { CheckCircle, XCircle, Clock, AlertCircle, Upload, FileText } from "lucide-react";

const estadosInfo = {
  pendiente: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    title: "Verificación Pendiente",
    description: "Tu solicitud está en espera de revisión por nuestro equipo.",
    variant: "default" as const
  },
  en_revision: {
    icon: FileText,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    title: "En Revisión",
    description: "Nuestro equipo está revisando tu documentación.",
    variant: "default" as const
  },
  verificado: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    title: "Cuenta Verificada",
    description: "¡Felicidades! Tu cuenta profesional ha sido verificada.",
    variant: "default" as const
  },
  rechazado: {
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    title: "Verificación Rechazada",
    description: "Tu solicitud fue rechazada. Revisa los comentarios y vuelve a enviar.",
    variant: "destructive" as const
  }
};

export function EstadoVerificacion() {
  const { profesionalActual } = useProfesionales();
  const { estadoVerificacion, verificarEstadoProfesional } = useVerificacionProfesionales();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profesionalActual?.id) {
      verificarEstadoProfesional(profesionalActual.id).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [profesionalActual, verificarEstadoProfesional]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profesionalActual) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se encontró información de tu cuenta profesional.
        </AlertDescription>
      </Alert>
    );
  }

  if (!estadoVerificacion) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el estado de verificación.
        </AlertDescription>
      </Alert>
    );
  }

  const estado = estadosInfo[estadoVerificacion.estado];
  const IconoEstado = estado.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconoEstado className="h-5 w-5" />
          Estado de Verificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={estado.color}>
                <IconoEstado className="h-3 w-3 mr-1" />
                {estado.title}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {estado.description}
            </p>
          </div>
        </div>

        {/* Información adicional según el estado */}
        {estadoVerificacion.estado === 'rechazado' && estadoVerificacion.comentarios && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo del rechazo:</strong> {estadoVerificacion.comentarios}
            </AlertDescription>
          </Alert>
        )}

        {estadoVerificacion.estado === 'verificado' && estadoVerificacion.fecha_verificacion && (
          <div className="text-sm text-muted-foreground">
            Verificado el: {new Date(estadoVerificacion.fecha_verificacion).toLocaleDateString()}
          </div>
        )}

        {/* Acciones según el estado */}
        {(estadoVerificacion.estado === 'pendiente' || estadoVerificacion.estado === 'rechazado') && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Para completar tu verificación necesitas:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• RFC de tu negocio</li>
              <li>• Comprobante de domicilio del establecimiento</li>
              <li>• Identificación oficial del representante legal</li>
              <li>• Licencia de funcionamiento</li>
              <li>• Foto del establecimiento (opcional)</li>
            </ul>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Subir Documentos
            </Button>
          </div>
        )}

        {/* Restricciones de funcionalidad */}
        {!estadoVerificacion.puede_ofertar && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Funcionalidad limitada:</strong> No puedes hacer ofertas hasta completar la verificación. 
              Puedes usar las herramientas de consulta y análisis de precios.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}