import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalificacionEstrellas } from "./CalificacionEstrellas";
import { BadgeConfianza } from "./BadgeConfianza";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useReviewsProfesionalProfesional } from "@/hooks/useReviewsProfesionalProfesional";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerfilReputacionProfesionalProps {
  profesionalId: string;
  showDetailed?: boolean;
}

export function PerfilReputacionProfesional({
  profesionalId,
  showDetailed = false
}: PerfilReputacionProfesionalProps) {
  const { statsProf, loading, obtenerStatsProfesionalProfesional } = useReviewsProfesionalProfesional();

  useEffect(() => {
    if (profesionalId) {
      obtenerStatsProfesionalProfesional(profesionalId);
    }
  }, [profesionalId, obtenerStatsProfesionalProfesional]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!statsProf) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">
            Este profesional aún no tiene evaluaciones de otros profesionales
          </p>
        </CardContent>
      </Card>
    );
  }

  const reputacionPorcentaje = (statsProf.reputacion_general / 5) * 100;

  if (!showDetailed) {
    // Vista compacta
    return (
      <div className="flex items-center gap-3">
        <CalificacionEstrellas
          calificacion={statsProf.reputacion_general}
          totalReviews={statsProf.total_reviews_vendedor + statsProf.total_reviews_comprador}
          size="sm"
        />
        <div className="flex gap-2">
          <BadgeConfianza badge={statsProf.badge_vendedor} size="sm" showText={false} />
          <BadgeConfianza badge={statsProf.badge_comprador} size="sm" showText={false} />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Reputación Profesional
          <Badge variant="outline">
            {statsProf.total_reviews_vendedor + statsProf.total_reviews_comprador} evaluaciones
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Reputación general */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reputación General</span>
            <CalificacionEstrellas
              calificacion={statsProf.reputacion_general}
              size="md"
            />
          </div>
          <Progress value={reputacionPorcentaje} className="h-2" />
        </div>

        <Tabs defaultValue="vendedor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vendedor">Como Vendedor</TabsTrigger>
            <TabsTrigger value="comprador">Como Comprador</TabsTrigger>
          </TabsList>

          <TabsContent value="vendedor" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <CalificacionEstrellas
                  calificacion={statsProf.calificacion_promedio_vendedor}
                  totalReviews={statsProf.total_reviews_vendedor}
                  size="md"
                />
                <BadgeConfianza
                  badge={statsProf.badge_vendedor}
                  size="md"
                  showIcon={true}
                  showText={true}
                />
              </div>
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsProf.total_reviews_vendedor}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Evaluaciones recibidas
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comprador" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <CalificacionEstrellas
                  calificacion={statsProf.calificacion_promedio_comprador}
                  totalReviews={statsProf.total_reviews_comprador}
                  size="md"
                />
                <BadgeConfianza
                  badge={statsProf.badge_comprador}
                  size="md"
                  showIcon={true}
                  showText={true}
                />
              </div>
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsProf.total_reviews_comprador}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Evaluaciones recibidas
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}