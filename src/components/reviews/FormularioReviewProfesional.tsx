import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalificacionEstrellas } from "./CalificacionEstrellas";
import { useReviewsProfesionalProfesional, TransaccionDisponible } from "@/hooks/useReviewsProfesionalProfesional";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const reviewSchema = z.object({
  calificacion_general: z.number().min(1).max(5),
  tipo_interaccion: z.enum(['compra', 'venta', 'colaboracion']),
  comentario: z.string().optional(),
  aspectos: z.object({
    puntualidad: z.number().min(1).max(5),
    transparencia: z.number().min(1).max(5),
    cumplimiento: z.number().min(1).max(5),
    comunicacion: z.number().min(1).max(5),
    recomendacion: z.number().min(1).max(5)
  })
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface FormularioReviewProfesionalProps {
  transaccion: TransaccionDisponible;
  profesionalEvaluadoId: string;
  onReviewCreated: () => void;
  onCancel: () => void;
}

export function FormularioReviewProfesional({
  transaccion,
  profesionalEvaluadoId,
  onReviewCreated,
  onCancel
}: FormularioReviewProfesionalProps) {
  const [calificacionGeneral, setCalificacionGeneral] = useState(0);
  const { crearReviewProfesionalProfesional, loading } = useReviewsProfesionalProfesional();
  const { toast } = useToast();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      calificacion_general: 0,
      tipo_interaccion: 'compra',
      comentario: '',
      aspectos: {
        puntualidad: 0,
        transparencia: 0,
        cumplimiento: 0,
        comunicacion: 0,
        recomendacion: 0
      }
    }
  });

  const aspectos = [
    { key: 'puntualidad', label: 'Puntualidad en pagos/entregas' },
    { key: 'transparencia', label: 'Transparencia en condiciones' },
    { key: 'cumplimiento', label: 'Cumplimiento de acuerdos' },
    { key: 'comunicacion', label: 'Comunicación profesional' },
    { key: 'recomendacion', label: '¿Lo recomendarías?' }
  ];

  const onSubmit = async (data: ReviewForm) => {
    try {
      await crearReviewProfesionalProfesional({
        profesional_evaluado_id: profesionalEvaluadoId,
        transaccion_id: transaccion.id,
        tipo_interaccion: data.tipo_interaccion,
        calificacion: data.calificacion_general,
        comentario: data.comentario,
        aspectos: data.aspectos,
        evidencia_transaccion: {
          auto_marca: transaccion.auto_venta?.marca,
          auto_modelo: transaccion.auto_venta?.modelo,
          auto_ano: transaccion.auto_venta?.ano,
          monto_transaccion: transaccion.monto_oferta
        },
        fecha_transaccion: transaccion.created_at
      });

      toast({
        title: "Review enviada",
        description: "Tu evaluación ha sido registrada exitosamente"
      });

      onReviewCreated();
    } catch (error) {
      console.error('Error al crear review:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Evaluar Profesional</CardTitle>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {transaccion.auto_venta?.marca} {transaccion.auto_venta?.modelo} {transaccion.auto_venta?.ano}
            </Badge>
            <Badge variant="secondary">
              ${transaccion.monto_oferta?.toLocaleString()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Transacción del {format(new Date(transaccion.created_at), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de interacción */}
            <FormField
              control={form.control}
              name="tipo_interaccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de transacción</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de transacción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="compra">Compra de vehículo</SelectItem>
                      <SelectItem value="venta">Venta de vehículo</SelectItem>
                      <SelectItem value="colaboracion">Colaboración en venta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calificación general */}
            <FormField
              control={form.control}
              name="calificacion_general"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calificación general</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <CalificacionEstrellas
                        calificacion={calificacionGeneral}
                        size="lg"
                        interactive
                        onCalificacionChange={(rating) => {
                          setCalificacionGeneral(rating);
                          field.onChange(rating);
                        }}
                      />
                      {calificacionGeneral > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({calificacionGeneral}/5)
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aspectos específicos */}
            <div className="space-y-4">
              <h4 className="font-medium">Aspectos específicos</h4>
              {aspectos.map((aspecto) => (
                <FormField
                  key={aspecto.key}
                  control={form.control}
                  name={`aspectos.${aspecto.key as keyof ReviewForm['aspectos']}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{aspecto.label}</FormLabel>
                      <FormControl>
                        <CalificacionEstrellas
                          calificacion={field.value}
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

            {/* Comentario */}
            <FormField
              control={form.control}
              name="comentario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentario (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu experiencia con este profesional..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={calificacionGeneral === 0 || loading}
                className="flex-1"
              >
                {loading ? "Enviando..." : "Enviar Evaluación"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}