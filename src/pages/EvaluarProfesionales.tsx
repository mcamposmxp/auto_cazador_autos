import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormularioReview } from "@/components/reviews/FormularioReview";
import { CalificacionEstrellas } from "@/components/reviews/CalificacionEstrellas";
import { useReviewsProfesionales, OfertaParaReview } from "@/hooks/useReviewsProfesionales";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, MessageCircle, Car } from "lucide-react";

export default function EvaluarProfesionales() {
  const { user } = useAuthSession();
  const { ofertasParaReview, loading, obtenerOfertasParaReview } = useReviewsProfesionales();
  const [ofertaParaEvaluar, setOfertaParaEvaluar] = useState<OfertaParaReview | null>(null);
  const [clienteId, setClienteId] = useState<string>("");

  useEffect(() => {
    document.title = "Evaluar Profesionales | Valúa tu Auto";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Evalúa a los profesionales que enviaron ofertas por tu auto y ayuda a otros usuarios a tomar mejores decisiones.');
    }
  }, []);

  useEffect(() => {
    const cargarOfertas = async () => {
      if (!user?.email) return;

      // Obtener cliente ID basado en email
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id')
        .eq('correo_electronico', user.email)
        .single();

      if (clienteData) {
        setClienteId(clienteData.id);
        await obtenerOfertasParaReview(user.email);
      }
    };

    cargarOfertas();
  }, [user, obtenerOfertasParaReview]);

  const handleEvaluarOferta = (oferta: OfertaParaReview) => {
    setOfertaParaEvaluar(oferta);
  };

  const handleReviewCreated = () => {
    setOfertaParaEvaluar(null);
    if (user?.email) {
      obtenerOfertasParaReview(user.email);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Acceso Requerido</h2>
            <p className="text-muted-foreground">
              Debes iniciar sesión para evaluar profesionales.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (ofertaParaEvaluar) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <FormularioReview
          oferta={ofertaParaEvaluar}
          clienteId={clienteId}
          onReviewCreated={handleReviewCreated}
          onCancel={() => setOfertaParaEvaluar(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Evaluar Profesionales
        </h1>
        <p className="text-muted-foreground">
          Evalúa a los profesionales que enviaron ofertas aceptadas por tu auto.
          Tu opinión ayuda a otros usuarios a tomar mejores decisiones.
        </p>
      </div>

      {ofertasParaReview.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sin ofertas para evaluar</h2>
            <p className="text-muted-foreground">
              Aún no tienes ofertas aceptadas de profesionales para evaluar.
              Cuando aceptes ofertas y tengas contacto con profesionales, 
              podrás evaluarlos aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ofertasParaReview.map((oferta) => (
            <Card key={oferta.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {oferta.profesional?.negocio_nombre}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Car className="h-4 w-4" />
                      {oferta.auto_venta?.marca} {oferta.auto_venta?.modelo} {oferta.auto_venta?.ano}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    ${oferta.monto_oferta.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Oferta del {format(new Date(oferta.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    
                    {oferta.review_existente ? (
                      <div className="flex items-center gap-2">
                        <CalificacionEstrellas
                          calificacion={oferta.review_existente.calificacion}
                          size="sm"
                        />
                        <span className="text-sm text-muted-foreground">
                          Ya evaluado
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleEvaluarOferta(oferta)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Evaluar
                      </Button>
                    )}
                  </div>
                </div>

                {oferta.review_existente && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-foreground">
                      "{oferta.review_existente.comentario}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Evaluado el {format(new Date(oferta.review_existente.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}