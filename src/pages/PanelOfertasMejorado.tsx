import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// Función para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Car, DollarSign, Clock, User, AlertCircle, MessageSquare } from 'lucide-react';
import { ChatOferta } from '@/components/mensajeria/ChatOferta';
import { useMensajeriaOfertas } from '@/hooks/useMensajeriaOfertas';

interface OfertaConDatos {
  id: string;
  monto_oferta: number;
  estado: string;
  created_at: string;
  updated_at: string;
  comentarios?: string;
  monto_min?: number;
  monto_max?: number;
  mensajes_count?: number;
  ultimo_mensaje?: string;
  telefono_revelado?: boolean;
  profesional: {
    id: string;
    negocio_nombre: string;
    contacto_principal?: string;
    telefono?: string;
    correo?: string;
  };
  auto_venta: {
    id: string;
    marca: string;
    modelo: string;
    ano: number;
    kilometraje: number;
    cliente_id: string;
  };
}

export default function PanelOfertasMejorado() {
  const [ofertas, setOfertas] = useState<OfertaConDatos[]>([]);
  const [cargando, setCargando] = useState(true);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<OfertaConDatos | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const { user } = useAuthSession();
  const { toast } = useToast();
  const { obtenerInteraccion } = useMensajeriaOfertas();

  useEffect(() => {
    if (user?.email) {
      cargarClienteYOfertas();
    }
  }, [user]);

  const cargarClienteYOfertas = async () => {
    try {
      // Primero obtener el cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nombre_apellido')
        .eq('correo_electronico', user!.email)
        .single();

      if (clienteError) throw clienteError;
      
      setClienteId(cliente.id);
      setClienteNombre(cliente.nombre_apellido);
      
      // Luego cargar las ofertas
      await cargarOfertas();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del cliente",
        variant: "destructive"
      });
    }
  };

  const cargarOfertas = async () => {
    if (!user?.email) return;

    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          id,
          monto_oferta,
          estado,
          created_at,
          updated_at,
          comentarios,
          monto_min,
          monto_max,
          profesionales:profesional_id (
            id,
            negocio_nombre
          ),
          autos_venta:auto_venta_id (
            id,
            marca,
            modelo,
            ano,
            kilometraje,
            cliente_id,
            clientes:cliente_id (
              correo_electronico
            )
          )
        `)
        .eq('autos_venta.clientes.correo_electronico', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener estadísticas de mensajes para cada oferta
      const ofertasIds = data.map(o => o.id);
      let mensajesStats: any[] = [];
      let interacciones: any[] = [];

      if (ofertasIds.length > 0) {
        const { data: mensajes } = await supabase
          .from('mensajes_ofertas')
          .select('oferta_id, mensaje, created_at')
          .in('oferta_id', ofertasIds)
          .order('created_at', { ascending: false });

        mensajesStats = mensajes || [];

        const { data: interaccionesData } = await supabase
          .from('interacciones_profesionales')
          .select('oferta_id, telefono_revelado')
          .in('oferta_id', ofertasIds);

        interacciones = interaccionesData || [];
      }

      const ofertasFormateadas = data.map(oferta => {
        const mensajesOferta = mensajesStats.filter(m => m.oferta_id === oferta.id);
        const interaccion = interacciones.find(i => i.oferta_id === oferta.id);
        const ultimoMensaje = mensajesOferta[0];

        return {
          id: oferta.id,
          monto_oferta: oferta.monto_oferta,
          estado: oferta.estado,
          created_at: oferta.created_at,
          updated_at: oferta.updated_at,
          comentarios: oferta.comentarios,
          monto_min: oferta.monto_min,
          monto_max: oferta.monto_max,
          mensajes_count: mensajesOferta.length,
          ultimo_mensaje: ultimoMensaje?.mensaje,
          telefono_revelado: interaccion?.telefono_revelado || false,
          profesional: {
            id: oferta.profesionales.id,
            negocio_nombre: oferta.profesionales.negocio_nombre,
            contacto_principal: '',
            telefono: '',
            correo: '',
          },
          auto_venta: {
            id: oferta.autos_venta.id,
            marca: oferta.autos_venta.marca,
            modelo: oferta.autos_venta.modelo,
            ano: oferta.autos_venta.ano,
            kilometraje: oferta.autos_venta.kilometraje,
            cliente_id: oferta.autos_venta.cliente_id,
          }
        };
      });

      setOfertas(ofertasFormateadas);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ofertas",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoOferta = async (ofertaId: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('ofertas')
        .update({ estado: nuevoEstado })
        .eq('id', ofertaId);

      if (error) throw error;

      toast({
        title: "Oferta actualizada",
        description: `La oferta ha sido ${nuevoEstado === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`
      });

      cargarOfertas();
    } catch (error) {
      console.error('Error actualizando oferta:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la oferta",
        variant: "destructive"
      });
    }
  };

  const abrirChat = (oferta: OfertaConDatos) => {
    setOfertaSeleccionada(oferta);
    setChatAbierto(true);
  };

  const cerrarChat = () => {
    setChatAbierto(false);
    setOfertaSeleccionada(null);
    // Recargar ofertas para actualizar contadores de mensajes
    cargarOfertas();
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'aceptada':
        return <Badge className="bg-green-100 text-green-800">Aceptada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  if (cargando) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Panel de Ofertas</h1>
        <p className="text-muted-foreground">
          Gestiona las ofertas recibidas en tus vehículos y comunícate con los profesionales
        </p>
      </div>

      {ofertas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes ofertas recibidas aún</p>
              <p className="text-sm">Las ofertas aparecerán aquí cuando los profesionales las envíen</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ofertas.map((oferta) => (
            <Card key={oferta.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {oferta.auto_venta.marca} {oferta.auto_venta.modelo} {oferta.auto_venta.ano}
                  </CardTitle>
                  {getEstadoBadge(oferta.estado)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Detalles de la Oferta</h4>
                    
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary mb-2">
                      <DollarSign className="h-5 w-5" />
                      {formatCurrency(oferta.monto_oferta)}
                    </div>
                    
                    {(oferta.monto_min || oferta.monto_max) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Rango: {oferta.monto_min ? formatCurrency(oferta.monto_min) : 'N/A'} - {oferta.monto_max ? formatCurrency(oferta.monto_max) : 'N/A'}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(oferta.created_at), 'PPP', { locale: es })}</span>
                    </div>
                    
                    {oferta.comentarios && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Comentarios:</p>
                        <p className="text-sm text-muted-foreground">{oferta.comentarios}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Información del Profesional</h4>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>{oferta.profesional.negocio_nombre}</span>
                    </div>
                    
                    {oferta.profesional.contacto_principal && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Contacto: {oferta.profesional.contacto_principal}
                      </p>
                    )}
                    
                    {/* Mostrar teléfono solo si está revelado */}
                    {oferta.telefono_revelado && oferta.profesional.telefono && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        📞 <span>{oferta.profesional.telefono}</span>
                        <Badge variant="secondary" className="text-xs">
                          Revelado
                        </Badge>
                      </div>
                    )}
                    
                    {oferta.profesional.correo && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Email: {oferta.profesional.correo}
                      </p>
                    )}

                    {/* Información de mensajes */}
                    {oferta.mensajes_count !== undefined && oferta.mensajes_count > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{oferta.mensajes_count} mensaje{oferta.mensajes_count !== 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {oferta.ultimo_mensaje && (
                      <p className="text-sm text-muted-foreground mb-2 italic">
                        Último mensaje: "{oferta.ultimo_mensaje.substring(0, 50)}..."
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    {/* Botón de mensajería siempre disponible */}
                    <Button
                      onClick={() => abrirChat(oferta)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {oferta.mensajes_count && oferta.mensajes_count > 0 ? 'Ver conversación' : 'Iniciar conversación'}
                    </Button>

                    {oferta.estado === 'pendiente' && (
                      <>
                        <Button
                          onClick={() => actualizarEstadoOferta(oferta.id, 'aceptada')}
                          variant="default"
                          size="sm"
                        >
                          Aceptar
                        </Button>
                        <Button
                          onClick={() => actualizarEstadoOferta(oferta.id, 'rechazada')}
                          variant="outline"
                          size="sm"
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para chat */}
      <Dialog open={chatAbierto} onOpenChange={setChatAbierto}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Conversación - {ofertaSeleccionada?.auto_venta.marca} {ofertaSeleccionada?.auto_venta.modelo} {ofertaSeleccionada?.auto_venta.ano}
            </DialogTitle>
          </DialogHeader>
          
          {ofertaSeleccionada && clienteId && (
            <ChatOferta
              ofertaId={ofertaSeleccionada.id}
              profesionalId={ofertaSeleccionada.profesional.id}
              clienteId={clienteId}
              profesionalNombre={ofertaSeleccionada.profesional.negocio_nombre}
              profesionalTelefono={ofertaSeleccionada.profesional.telefono}
              clienteNombre={clienteNombre}
              esCliente={true}
              onTelefonoRevelado={() => {
                // Actualizar el estado local de la oferta
                setOfertas(prev => prev.map(o => 
                  o.id === ofertaSeleccionada.id 
                    ? { ...o, telefono_revelado: true }
                    : o
                ));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}