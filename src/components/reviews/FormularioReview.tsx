import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalificacionEstrellas } from "./CalificacionEstrellas";
import { useToast } from "@/hooks/use-toast";
import { OfertaParaReview, useReviewsProfesionales } from "@/hooks/useReviewsProfesionales";

const reviewSchema = z.object({
  calificacion_general: z.number().min(1, "Debe seleccionar una calificación").max(5),
  comentario: z.string().optional(),
  comunicacion: z.number().min(1).max(5),
  profesionalismo: z.number().min(1).max(5),
  cumplimiento: z.number().min(1).max(5),
  recomendacion: z.number().min(1).max(5)
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface FormularioReviewProps {
  oferta: OfertaParaReview;
  clienteId: string;
  onReviewCreated?: () => void;
  onCancel?: () => void;
}

export function FormularioReview({ 
  oferta, 
  clienteId, 
  onReviewCreated, 
  onCancel 
}: FormularioReviewProps) {
  // Si ya hay una evaluación pendiente, mostrar mensaje
  if (oferta.review_existente?.pendiente) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Evaluación Enviada</h3>
          <p className="text-muted-foreground mb-4">
            Tu evaluación para {oferta.profesional?.negocio_nombre} ya fue enviada. 
            Se revelará cuando ambas partes hayan evaluado o tras el tiempo límite.
          </p>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cerrar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  const [calificacionGeneral, setCalificacionGeneral] = useState(0);
  const { crearReview, loading } = useReviewsProfesionales();
  const { toast } = useToast();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      calificacion_general: 0,
      comentario: "",
      comunicacion: 0,
      profesionalismo: 0,
      cumplimiento: 0,
      recomendacion: 0
    }
  });

  const aspectos = [
    { key: "comunicacion", label: "Comunicación" },
    { key: "profesionalismo", label: "Profesionalismo" },
    { key: "cumplimiento", label: "Cumplimiento" },
    { key: "recomendacion", label: "Recomendación" }
  ];

  const onSubmit = async (data: ReviewForm) => {
    try {
      await crearReview({
        profesional_id: oferta.profesional_id,
        cliente_id: clienteId,
        oferta_id: oferta.id,
        calificacion: data.calificacion_general,
        comentario: data.comentario,
        aspectos: {
          comunicacion: data.comunicacion,
          profesionalismo: data.profesionalismo,
          cumplimiento: data.cumplimiento,
          recomendacion: data.recomendacion
        } as any
      });

      toast({
        title: "Evaluación enviada",
        description: "Tu evaluación se revelará cuando ambas partes hayan evaluado o tras el tiempo límite"
      });

      onReviewCreated?.();
    } catch (error) {
      console.error("Error al crear review:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Evaluar a {oferta.profesional?.negocio_nombre}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {oferta.auto_venta?.marca} {oferta.auto_venta?.modelo} {oferta.auto_venta?.ano}
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="calificacion_general"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calificación General</FormLabel>
                  <FormControl>
                    <div>
                      <CalificacionEstrellas
                        calificacion={field.value}
                        size="lg"
                        interactive
                        onCalificacionChange={(rating) => {
                          field.onChange(rating);
                          setCalificacionGeneral(rating);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {aspectos.map((aspecto) => (
                <FormField
                  key={aspecto.key}
                  control={form.control}
                  name={aspecto.key as keyof ReviewForm}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{aspecto.label}</FormLabel>
                      <FormControl>
                        <CalificacionEstrellas
                          calificacion={field.value as number}
                          size="md"
                          interactive
                          onCalificacionChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="comentario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Comparte tu experiencia con este profesional..."
                      rows={3}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground mt-1">
                    💰 ¡Incluye un comentario y recibe 2 créditos gratis! (Máximo 10 créditos por mes)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || calificacionGeneral === 0}
                className="flex-1"
              >
                {loading ? "Enviando..." : "Enviar Review"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}