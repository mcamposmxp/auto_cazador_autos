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
import { useAuthSession } from '@/hooks/useAuthSession';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Mensaje {
  id: string;
  remitente_tipo: 'cliente' | 'profesional';
  remitente_id: string;
  mensaje: string;
  created_at: string;
  leido: boolean;
  remitente_nombre?: string;
}

interface InteraccionProfesional {
  telefono_revelado: boolean;
  elegible_evaluacion: boolean;
}

interface ChatOfertaProps {
  ofertaId: string;
  profesionalId: string;
  clienteId: string;
  profesionalNombre: string;
  profesionalTelefono?: string;
  clienteNombre: string;
  esCliente: boolean;
  onTelefonoRevelado?: () => void;
}

export function ChatOferta({
  ofertaId,
  profesionalId,
  clienteId,
  profesionalNombre,
  profesionalTelefono,
  clienteNombre,
  esCliente,
  onTelefonoRevelado
}: ChatOfertaProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [interaccion, setInteraccion] = useState<InteraccionProfesional | null>(null);
  const { user } = useAuthSession();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarMensajes();
    cargarInteraccion();
    
    // Suscribirse a nuevos mensajes
    const subscription = supabase
      .channel(`mensajes_oferta_${ofertaId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes_ofertas',
          filter: `oferta_id=eq.${ofertaId}`
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
  }, [ofertaId]);

  useEffect(() => {
    // Scroll automático al último mensaje
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cargarMensajes = async () => {
    try {
      const { data, error } = await supabase
        .from('mensajes_ofertas')
        .select('*')
        .eq('oferta_id', ofertaId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enriquecer mensajes con nombres
      const mensajesEnriquecidos = data.map(mensaje => ({
        ...mensaje,
        remitente_tipo: mensaje.remitente_tipo as 'cliente' | 'profesional',
        remitente_nombre: mensaje.remitente_tipo === 'cliente' 
          ? clienteNombre 
          : profesionalNombre
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
        .from('interacciones_profesionales')
        .select('telefono_revelado, elegible_evaluacion')
        .eq('cliente_id', clienteId)
        .eq('profesional_id', profesionalId)
        .eq('oferta_id', ofertaId)
        .single();

      if (data) {
        setInteraccion(data);
        if (data.telefono_revelado && onTelefonoRevelado) {
          onTelefonoRevelado();
        }
      }
    } catch (error) {
      // No hay interacción aún, es normal
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !user || enviando) return;

    setEnviando(true);
    try {
      const remitenteId = esCliente ? clienteId : user.id;
      const remitenteTipo = esCliente ? 'cliente' : 'profesional';

      const { error } = await supabase
        .from('mensajes_ofertas')
        .insert({
          oferta_id: ofertaId,
          remitente_tipo: remitenteTipo,
          remitente_id: remitenteId,
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

  const marcarComoLeido = async (mensajeId: string) => {
    try {
      await supabase
        .from('mensajes_ofertas')
        .update({ leido: true })
        .eq('id', mensajeId);
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
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
            Conversación con {esCliente ? profesionalNombre : clienteNombre}
          </CardTitle>
          
          {interaccion?.telefono_revelado && profesionalTelefono && (
            <Badge variant="secondary" className="flex items-center gap-1">
              📞 {profesionalTelefono}
            </Badge>
          )}
        </div>
        
        {!interaccion?.telefono_revelado && (
          <p className="text-sm text-muted-foreground">
            {esCliente 
              ? "Inicia la conversación para que el profesional pueda responder y obtener su teléfono."
              : "Responde al mensaje del cliente para revelar ambos teléfonos."
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
                const esMio = esCliente 
                  ? mensaje.remitente_tipo === 'cliente'
                  : mensaje.remitente_tipo === 'profesional';

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
                            {mensaje.remitente_nombre?.charAt(0)?.toUpperCase() || 'U'}
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
        </div>
      </CardContent>
    </Card>
  );
}