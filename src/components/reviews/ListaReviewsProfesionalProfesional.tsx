import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalificacionEstrellas } from "./CalificacionEstrellas";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useReviewsProfesionalProfesional } from "@/hooks/useReviewsProfesionalProfesional";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ListaReviewsProfesionalProfesionalProps {
  profesionalId: string;
  limite?: number;
  tipoFiltro?: 'vendedor' | 'comprador' | 'todos';
}

export function ListaReviewsProfesionalProfesional({
  profesionalId,
  limite,
  tipoFiltro = 'todos'
}: ListaReviewsProfesionalProfesionalProps) {
  const { reviews, loading, obtenerReviewsProfesionalProfesional } = useReviewsProfesionalProfesional();

  useEffect(() => {
    if (profesionalId) {
      obtenerReviewsProfesionalProfesional(profesionalId);
    }
  }, [profesionalId, obtenerReviewsProfesionalProfesional]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filtrar reviews según el tipo
  const reviewsFiltradas = reviews.filter(review => {
    if (tipoFiltro === 'vendedor') {
      return review.tipo_interaccion === 'venta' || review.tipo_interaccion === 'colaboracion';
    }
    if (tipoFiltro === 'comprador') {
      return review.tipo_interaccion === 'compra';
    }
    return true;
  });

  const reviewsParaMostrar = limite ? reviewsFiltradas.slice(0, limite) : reviewsFiltradas;

  if (reviewsParaMostrar.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No hay evaluaciones de otros profesionales disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTipoInteraccionLabel = (tipo: string) => {
    switch (tipo) {
      case 'compra': return 'Compra';
      case 'venta': return 'Venta';
      case 'colaboracion': return 'Colaboración';
      default: return tipo;
    }
  };

  const getTipoInteraccionVariant = (tipo: string) => {
    switch (tipo) {
      case 'compra': return 'default' as const;
      case 'venta': return 'secondary' as const;
      case 'colaboracion': return 'outline' as const;
      default: return 'default' as const;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Evaluaciones de Profesionales
          {tipoFiltro !== 'todos' && ` (${tipoFiltro === 'vendedor' ? 'Como Vendedor' : 'Como Comprador'})`}
        </h3>
        <Badge variant="outline">
          {reviewsParaMostrar.length} evaluación{reviewsParaMostrar.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      {reviewsParaMostrar.map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {review.profesional_evaluador?.negocio_nombre || 'Profesional'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <CalificacionEstrellas calificacion={review.calificacion} size="sm" />
                  <Badge variant={getTipoInteraccionVariant(review.tipo_interaccion)}>
                    {getTipoInteraccionLabel(review.tipo_interaccion)}
                  </Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {review.comentario && (
              <p className="text-sm text-foreground mb-4">
                "{review.comentario}"
              </p>
            )}

            {/* Aspectos específicos */}
            {review.aspectos && typeof review.aspectos === 'object' && (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(review.aspectos as Record<string, number>).map(([aspecto, valor]) => {
                  if (typeof valor === 'number' && valor > 0) {
                    const aspectoLabels: Record<string, string> = {
                      puntualidad: 'Puntualidad',
                      transparencia: 'Transparencia',
                      cumplimiento: 'Cumplimiento',
                      comunicacion: 'Comunicación',
                      recomendacion: 'Recomendación'
                    };

                    return (
                      <div key={aspecto} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {aspectoLabels[aspecto] || aspecto}
                        </span>
                        <CalificacionEstrellas calificacion={valor} size="sm" />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {limite && reviewsFiltradas.length > limite && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {limite} de {reviewsFiltradas.length} evaluaciones
        </p>
      )}
    </div>
  );
}