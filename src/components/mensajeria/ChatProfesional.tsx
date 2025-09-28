import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MensajeProfesional {
  id: string;
  remitente_id: string;
  mensaje: string;
  created_at: string;
  leido: boolean;
  remitente_nombre?: string;
}

interface InteraccionB2B {
  telefono_revelado: boolean;
  elegible_evaluacion: boolean;
  fecha_limite_evaluacion: string;
}

interface ChatProfesionalProps {
  interaccionId: string;
  autoInventarioId: string;
  profesionalIniciadorId: string;
  profesionalReceptorId: string;
  profesionalIniciadorNombre: string;
  profesionalReceptorNombre: string;
  autoInfo: {
    marca: string;
    modelo: string;
    ano: number;
    precio_actual: number;
  };
  miProfesionalId: string;
  onTelefonoRevelado?: () => void;
}

export function ChatProfesional({
  interaccionId,
  autoInventarioId,
  profesionalIniciadorId,
  profesionalReceptorId,
  profesionalIniciadorNombre,
  profesionalReceptorNombre,
  autoInfo,
  miProfesionalId,
  onTelefonoRevelado
}: ChatProfesionalProps) {
  const [mensajes, setMensajes] = useState<MensajeProfesional[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [interaccion, setInteraccion] = useState<InteraccionB2B | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const esProfesionalIniciador = miProfesionalId === profesionalIniciadorId;
  const nombreOtroProfesional = esProfesionalIniciador ? profesionalReceptorNombre : profesionalIniciadorNombre;

  useEffect(() => {
    cargarMensajes();
    cargarInteraccion();
    
    // Suscribirse a nuevos mensajes
    const subscription = supabase
      .channel(`mensajes_b2b_${interaccionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes_profesional_profesional',
          filter: `interaccion_id=eq.${interaccionId}`
        }, 
        (payload) => {
          if (payload.new) {
            cargarMensajes();
            cargarInteraccion();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [interaccionId]);

  useEffect(() => {
    // Scroll automático al último mensaje
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cargarMensajes = async () => {
    try {
      const { data, error } = await supabase
        .from('mensajes_profesional_profesional')
        .select('*')
        .eq('interaccion_id', interaccionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enriquecer mensajes con nombres
      const mensajesEnriquecidos = data.map(mensaje => ({
        ...mensaje,
        remitente_nombre: mensaje.remitente_id === profesionalIniciadorId 
          ? profesionalIniciadorNombre 
          : profesionalReceptorNombre
      }));

      setMensajes(mensajesEnriquecidos);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarInteraccion = async () => {
    try {
      const { data, error } = await supabase
        .from('interacciones_profesional_profesional')
        .select('telefono_revelado, elegible_evaluacion, fecha_limite_evaluacion')
        .eq('id', interaccionId)
        .single();

      if (data) {
        setInteraccion(data);
        if (data.telefono_revelado && onTelefonoRevelado) {
          onTelefonoRevelado();
        }
      }
    } catch (error) {
      console.error('Error cargando interacción:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || enviando) return;

    setEnviando(true);
    try {
      const { error } = await supabase
        .from('mensajes_profesional_profesional')
        .insert({
          interaccion_id: interaccionId,
          remitente_id: miProfesionalId,
          mensaje: nuevoMensaje.trim()
        });

      if (error) throw error;

      setNuevoMensaje('');
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado correctamente"
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversación con {nombreOtroProfesional}
          </CardTitle>
          
          {interaccion?.telefono_revelado && (
            <Badge variant="secondary" className="flex items-center gap-1">
              📞 Teléfono revelado
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Vehículo:</strong> {autoInfo.marca} {autoInfo.modelo} {autoInfo.ano}</p>
          <p><strong>Precio:</strong> ${autoInfo.precio_actual.toLocaleString()}</p>
        </div>
        
        {!interaccion?.telefono_revelado && (
          <p className="text-sm text-muted-foreground">
            {esProfesionalIniciador 
              ? "Inicia la conversación para mostrar tu interés en el vehículo."
              : "Responde al mensaje del profesional para revelar ambos teléfonos."
            }
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {mensajes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay mensajes aún.</p>
                <p className="text-sm">Inicia la conversación</p>
              </div>
            ) : (
              mensajes.map((mensaje) => {
                const esMio = mensaje.remitente_id === miProfesionalId;

                return (
                  <div
                    key={mensaje.id}
                    className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        esMio
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {mensaje.remitente_nombre?.charAt(0)?.toUpperCase() || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {mensaje.remitente_nombre}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-1">{mensaje.mensaje}</p>
                      
                      <div className="flex items-center gap-1 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(mensaje.created_at), {
                          addSuffix: true,
                          locale: es
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensaje();
                }
              }}
            />
            <Button
              onClick={enviarMensaje}
              disabled={!nuevoMensaje.trim() || enviando}
              size="sm"
              className="self-end"
            >
              ➤
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </p>
          
          {interaccion?.elegible_evaluacion && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Después de esta conversación, ambos podrán evaluarse mutuamente
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}