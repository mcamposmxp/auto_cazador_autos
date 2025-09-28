import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalificacionEstrellas } from "./CalificacionEstrellas";
import { useReviewsProfesionales } from "@/hooks/useReviewsProfesionales";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ListaReviewsProps {
  profesionalId: string;
  limite?: number;
}

export function ListaReviews({ profesionalId, limite }: ListaReviewsProps) {
  const { reviews, loading, obtenerReviewsProfesional } = useReviewsProfesionales();

  useEffect(() => {
    obtenerReviewsProfesional(profesionalId);
  }, [profesionalId, obtenerReviewsProfesional]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const reviewsAMostrar = limite ? reviews.slice(0, limite) : reviews;

  if (reviewsAMostrar.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Este profesional aún no tiene reseñas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviewsAMostrar.map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CalificacionEstrellas calificacion={review.calificacion} size="md" />
                <p className="text-sm text-muted-foreground mt-1">
                  Por {review.cliente?.nombre_apellido || "Cliente"} • {' '}
                  {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </CardHeader>

          {(review.comentario || Object.keys(review.aspectos).length > 0) && (
            <CardContent className="pt-0">
              {review.comentario && (
                <p className="text-foreground mb-3">{review.comentario}</p>
              )}

              {review.aspectos && typeof review.aspectos === 'object' && Object.keys(review.aspectos).length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(review.aspectos as Record<string, number>).map(([aspecto, calificacion]) => (
                    <div key={aspecto} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {aspecto}:
                      </span>
                      <CalificacionEstrellas 
                        calificacion={calificacion as number} 
                        size="sm" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {limite && reviews.length > limite && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Y {reviews.length - limite} reseñas más...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}