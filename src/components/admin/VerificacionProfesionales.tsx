import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, XCircle, Clock, Building, Phone, Mail, MapPin, Calendar } from "lucide-react";

interface ProfesionalPendiente {
  id: string;
  negocio_nombre: string;
  razon_social: string;
  rfc: string;
  tipo_negocio: string;
  telefono?: string;
  correo?: string;
  direccion_calle?: string;
  direccion_numero?: string;
  direccion_ciudad?: string;
  direccion_estado?: string;
  direccion_cp?: string;
  estado_verificacion: string;
  fecha_solicitud: string;
  comentarios_verificacion?: string;
  documentos_verificacion: any;
}

interface DocumentoProfesional {
  id: string;
  tipo_documento: string;
  url_documento: string;
  nombre_archivo: string;
  estado: string;
  comentarios?: string;
  created_at: string;
}

const tiposDocumento = {
  rfc: "RFC",
  comprobante_domicilio: "Comprobante de Domicilio",
  identificacion: "Identificación Oficial",
  licencia_funcionamiento: "Licencia de Funcionamiento",
  foto_establecimiento: "Foto del Establecimiento"
};

const estadosVerificacion = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  en_revision: { label: "En Revisión", color: "bg-blue-100 text-blue-800", icon: FileText },
  verificado: { label: "Verificado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-800", icon: XCircle }
};

export function VerificacionProfesionales() {
  const [profesionales, setProfesionales] = useState<ProfesionalPendiente[]>([]);
  const [documentos, setDocumentos] = useState<{ [key: string]: DocumentoProfesional[] }>({});
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [comentarios, setComentarios] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    cargarProfesionales();
  }, []);

  const cargarProfesionales = async () => {
    try {
      setLoading(true);
      
      // Cargar profesionales pendientes de verificación
      const { data: profData, error: profError } = await supabase
        .from('profesionales')
        .select('*')
        .in('estado_verificacion', ['pendiente', 'en_revision'])
        .order('fecha_solicitud', { ascending: true });

      if (profError) throw profError;

      setProfesionales(profData || []);

      // Cargar documentos para cada profesional
      if (profData && profData.length > 0) {
        const { data: docData, error: docError } = await supabase
          .from('documentos_profesional')
          .select('*')
          .in('profesional_id', profData.map(p => p.id));

        if (docError) throw docError;

        // Agrupar documentos por profesional
        const docsAgrupados = (docData || []).reduce((acc, doc) => {
          if (!acc[doc.profesional_id]) {
            acc[doc.profesional_id] = [];
          }
          acc[doc.profesional_id].push(doc);
          return acc;
        }, {} as { [key: string]: DocumentoProfesional[] });

        setDocumentos(docsAgrupados);
      }
    } catch (error) {
      console.error('Error cargando profesionales:', error);
      toast({
        title: "Error",
        description: "Error al cargar los profesionales pendientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoVerificacion = async (profesionalId: string, nuevoEstado: string, comentarios: string) => {
    try {
      setProcesando(true);

      // Actualizar estado del profesional
      const { error: updateError } = await supabase
        .from('profesionales')
        .update({
          estado_verificacion: nuevoEstado,
          fecha_verificacion: nuevoEstado === 'verificado' ? new Date().toISOString() : null,
          comentarios_verificacion: comentarios,
          activo: nuevoEstado === 'verificado' // Solo activar si está verificado
        })
        .eq('id', profesionalId);

      if (updateError) throw updateError;

      // Registrar en historial
      const { error: historialError } = await supabase
        .from('historial_verificaciones')
        .insert({
          profesional_id: profesionalId,
          accion: nuevoEstado,
          comentarios: comentarios
        });

      if (historialError) throw historialError;

      toast({
        title: "Estado actualizado",
        description: `El profesional ha sido ${nuevoEstado === 'verificado' ? 'verificado' : 'rechazado'} exitosamente`
      });

      // Recargar la lista
      cargarProfesionales();
      setComentarios("");
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del profesional",
        variant: "destructive"
      });
    } finally {
      setProcesando(false);
    }
  };

  const iniciarRevision = async (profesionalId: string) => {
    try {
      const { error } = await supabase
        .from('profesionales')
        .update({ estado_verificacion: 'en_revision' })
        .eq('id', profesionalId);

      if (error) throw error;

      await supabase
        .from('historial_verificaciones')
        .insert({
          profesional_id: profesionalId,
          accion: 'revision_iniciada',
          comentarios: 'Revisión iniciada por administrador'
        });

      toast({
        title: "Revisión iniciada",
        description: "El profesional está ahora en revisión"
      });

      cargarProfesionales();
    } catch (error) {
      console.error('Error iniciando revisión:', error);
      toast({
        title: "Error",
        description: "Error al iniciar la revisión",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="h-64 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Verificación de Profesionales</h2>
        <Badge variant="outline" className="text-sm">
          {profesionales.length} pendientes
        </Badge>
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="en_revision">En Revisión</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {profesionales.filter(p => p.estado_verificacion === 'pendiente').map((profesional) => (
            <ProfesionalCard 
              key={profesional.id} 
              profesional={profesional} 
              documentos={documentos[profesional.id] || []}
              onIniciarRevision={() => iniciarRevision(profesional.id)}
              onVerificar={(comentarios) => cambiarEstadoVerificacion(profesional.id, 'verificado', comentarios)}
              onRechazar={(comentarios) => cambiarEstadoVerificacion(profesional.id, 'rechazado', comentarios)}
              procesando={procesando}
            />
          ))}
          {profesionales.filter(p => p.estado_verificacion === 'pendiente').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay profesionales pendientes de verificación
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="en_revision" className="space-y-4">
          {profesionales.filter(p => p.estado_verificacion === 'en_revision').map((profesional) => (
            <ProfesionalCard 
              key={profesional.id} 
              profesional={profesional} 
              documentos={documentos[profesional.id] || []}
              onVerificar={(comentarios) => cambiarEstadoVerificacion(profesional.id, 'verificado', comentarios)}
              onRechazar={(comentarios) => cambiarEstadoVerificacion(profesional.id, 'rechazado', comentarios)}
              procesando={procesando}
            />
          ))}
          {profesionales.filter(p => p.estado_verificacion === 'en_revision').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay profesionales en revisión
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfesionalCard({ 
  profesional, 
  documentos, 
  onIniciarRevision, 
  onVerificar, 
  onRechazar, 
  procesando 
}: {
  profesional: ProfesionalPendiente;
  documentos: DocumentoProfesional[];
  onIniciarRevision?: () => void;
  onVerificar: (comentarios: string) => void;
  onRechazar: (comentarios: string) => void;
  procesando: boolean;
}) {
  const [comentarios, setComentarios] = useState("");
  const estado = estadosVerificacion[profesional.estado_verificacion as keyof typeof estadosVerificacion];
  const IconoEstado = estado.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {profesional.negocio_nombre}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{profesional.razon_social}</p>
          </div>
          <Badge className={estado.color}>
            <IconoEstado className="h-3 w-3 mr-1" />
            {estado.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>RFC: {profesional.rfc}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>Tipo: {profesional.tipo_negocio}</span>
          </div>
          {profesional.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profesional.telefono}</span>
            </div>
          )}
          {profesional.correo && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profesional.correo}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Solicitud: {new Date(profesional.fecha_solicitud).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Dirección */}
        {(profesional.direccion_calle || profesional.direccion_ciudad) && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>
              {[
                profesional.direccion_calle,
                profesional.direccion_numero,
                profesional.direccion_ciudad,
                profesional.direccion_estado,
                profesional.direccion_cp
              ].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Documentos */}
        <div className="space-y-2">
          <h4 className="font-medium">Documentos ({documentos.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(tiposDocumento).map(([tipo, nombre]) => {
              const doc = documentos.find(d => d.tipo_documento === tipo);
              return (
                <div key={tipo} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{nombre}</span>
                  {doc ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.estado}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url_documento, '_blank')}
                      >
                        Ver
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      No subido
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comentarios existentes */}
        {profesional.comentarios_verificacion && (
          <div className="p-3 bg-muted rounded">
            <h4 className="font-medium text-sm mb-2">Comentarios anteriores:</h4>
            <p className="text-sm">{profesional.comentarios_verificacion}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t">
          {profesional.estado_verificacion === 'pendiente' && onIniciarRevision && (
            <Button 
              variant="outline" 
              onClick={onIniciarRevision}
              disabled={procesando}
            >
              Iniciar Revisión
            </Button>
          )}

          {profesional.estado_verificacion === 'en_revision' && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" disabled={procesando}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verificar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Verificar Profesional</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que quieres verificar a este profesional? 
                      Esta acción activará su cuenta y le permitirá hacer ofertas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Comentarios sobre la verificación (opcional)"
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        onVerificar(comentarios);
                        setComentarios("");
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Verificar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={procesando}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rechazar Profesional</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que quieres rechazar a este profesional?
                      Proporciona un motivo para el rechazo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Motivo del rechazo (requerido)"
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      required
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        if (comentarios.trim()) {
                          onRechazar(comentarios);
                          setComentarios("");
                        }
                      }}
                      disabled={!comentarios.trim()}
                    >
                      Rechazar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}