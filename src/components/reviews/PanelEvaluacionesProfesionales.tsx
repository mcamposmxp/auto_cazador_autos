import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormularioReviewProfesional } from "./FormularioReviewProfesional";
import { ListaReviewsProfesionalProfesional } from "./ListaReviewsProfesionalProfesional";
import { PerfilReputacionProfesional } from "./PerfilReputacionProfesional";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useReviewsProfesionalProfesional } from "@/hooks/useReviewsProfesionalProfesional";
import { useProfesionales } from "@/hooks/useProfesionales";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, Clock, CheckCircle } from "lucide-react";

export function PanelEvaluacionesProfesionales() {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState<any>(null);
  const [profesionalEvaluadoId, setProfesionalEvaluadoId] = useState<string>('');

  const { transaccionesDisponibles, loading, obtenerTransaccionesParaReview } = useReviewsProfesionalProfesional();
  const { profesionalActual } = useProfesionales();

  useEffect(() => {
    if (profesionalActual?.id) {
      obtenerTransaccionesParaReview(profesionalActual.id);
    }
  }, [profesionalActual?.id]); // Removed obtenerTransaccionesParaReview from dependencies

  const abrirFormularioReview = (transaccion: any, profesionalEvaluadoId: string) => {
    setTransaccionSeleccionada(transaccion);
    setProfesionalEvaluadoId(profesionalEvaluadoId);
    setDialogAbierto(true);
  };

  const cerrarDialog = () => {
    setDialogAbierto(false);
    setTransaccionSeleccionada(null);
    setProfesionalEvaluadoId('');
    // Recargar transacciones para actualizar el estado
    if (profesionalActual?.id) {
      obtenerTransaccionesParaReview(profesionalActual.id);
    }
  };

  if (!profesionalActual) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Debes ser un profesional registrado para acceder a las evaluaciones
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Sistema de Evaluaciones Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Evalúa a otros profesionales con los que has realizado transacciones y consulta tu reputación 
            en la red profesional.
          </p>
          
          <Tabs defaultValue="evaluar" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="evaluar">Evaluar Profesionales</TabsTrigger>
              <TabsTrigger value="mi-reputacion">Mi Reputación</TabsTrigger>
              <TabsTrigger value="evaluaciones-recibidas">Evaluaciones Recibidas</TabsTrigger>
            </TabsList>

            <TabsContent value="evaluar" className="space-y-4">
              {/* Banner de incentivo para créditos */}
              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-green-800 mb-1">¡Gana 2 créditos gratis por evaluación!</h4>
                      <p className="text-sm text-green-700">
                        Evalúa a otros profesionales con comentarios y recibe créditos adicionales. 
                        Máximo 10 créditos mensuales por evaluaciones.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Solo puedes evaluar transacciones después de 48 horas de completadas
                </span>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : transaccionesDisponibles.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No tienes transacciones disponibles para evaluar en este momento
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {transaccionesDisponibles.map((transaccion) => (
                    <Card key={transaccion.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
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
                          <div className="flex items-center gap-2">
                            {transaccion.review_existente ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Evaluado
                              </Badge>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <Button
                                  onClick={() => {
                                    // En este caso, necesitaríamos obtener el ID del profesional que fue evaluado
                                    // basándose en la lógica de negocio de cada transacción
                                    const profesionalEvaluadoId = transaccion.profesional_id; // Esto podría necesitar ajustes
                                    abrirFormularioReview(transaccion, profesionalEvaluadoId);
                                  }}
                                  size="sm"
                                  className="gap-1"
                                >
                                  <Star className="h-3 w-3" />
                                  Evaluar (+2 créditos)
                                </Button>
                                <span className="text-xs text-green-600 font-medium">
                                  Con comentario
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mi-reputacion">
              <PerfilReputacionProfesional
                profesionalId={profesionalActual.id}
                showDetailed={true}
              />
            </TabsContent>

            <TabsContent value="evaluaciones-recibidas">
              <ListaReviewsProfesionalProfesional
                profesionalId={profesionalActual.id}
                tipoFiltro="todos"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para formulario de review */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluar Profesional</DialogTitle>
          </DialogHeader>
          {transaccionSeleccionada && profesionalEvaluadoId && (
            <FormularioReviewProfesional
              transaccion={transaccionSeleccionada}
              profesionalEvaluadoId={profesionalEvaluadoId}
              onReviewCreated={cerrarDialog}
              onCancel={cerrarDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}