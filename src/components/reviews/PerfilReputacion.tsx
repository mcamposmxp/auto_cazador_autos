import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalificacionEstrellas } from "./CalificacionEstrellas";
import { BadgeConfianza } from "./BadgeConfianza";
import { useReviewsProfesionales } from "@/hooks/useReviewsProfesionales";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TrendingUp, MessageCircle, CheckCircle } from "lucide-react";

interface PerfilReputacionProps {
  profesionalId: string;
  showDetailed?: boolean;
}

export function PerfilReputacion({ profesionalId, showDetailed = false }: PerfilReputacionProps) {
  const { statsProf, loading, obtenerStatsProfesional } = useReviewsProfesionales();

  useEffect(() => {
    obtenerStatsProfesional(profesionalId);
  }, [profesionalId, obtenerStatsProfesional]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!statsProf) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <BadgeConfianza badge="nuevo" />
          <p className="text-sm text-muted-foreground mt-2">
            Profesional sin estadísticas aún
          </p>
        </CardContent>
      </Card>
    );
  }

  const estadisticas = [
    {
      label: "Ofertas Enviadas",
      value: statsProf.total_ofertas_enviadas,
      icon: MessageCircle,
      color: "text-blue-500"
    },
    {
      label: "Ofertas Aceptadas", 
      value: statsProf.total_ofertas_aceptadas,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      label: "Tasa de Respuesta",
      value: `${statsProf.tasa_respuesta.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Reputación</CardTitle>
            <BadgeConfianza badge={statsProf.badge_confianza} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <CalificacionEstrellas
              calificacion={statsProf.calificacion_promedio}
              totalReviews={statsProf.total_reviews}
              size="lg"
            />
          </div>

          {showDetailed && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {estadisticas.map((stat, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                    <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {statsProf.total_reviews > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nivel de Confianza</span>
                    <span>{Math.round((statsProf.calificacion_promedio / 5) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(statsProf.calificacion_promedio / 5) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}