import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/hooks/useAuthSession';

interface MensajeOferta {
  id: string;
  oferta_id: string;
  remitente_tipo: 'cliente' | 'profesional';
  remitente_id: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
  updated_at: string;
}

interface InteraccionProfesional {
  id: string;
  cliente_id: string;
  profesional_id: string;
  oferta_id: string;
  primera_interaccion: string;
  telefono_revelado: boolean;
  elegible_evaluacion: boolean;
  created_at: string;
  updated_at: string;
}

interface OfertaConMensajes {
  id: string;
  auto_venta_id: string;
  profesional_id: string;
  monto_oferta: number;
  estado: string;
  created_at: string;
  mensajes_count: number;
  ultimo_mensaje: string | null;
  ultimo_mensaje_fecha: string | null;
  telefono_revelado: boolean;
  elegible_evaluacion: boolean;
  profesional_nombre?: string;
  auto_info?: {
    marca: string;
    modelo: string;
    ano: number;
  };
}

export function useMensajeriaOfertas() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthSession();

  const obtenerOfertasConMensajes = async (clienteId?: string, profesionalId?: string): Promise<OfertaConMensajes[]> => {
    setCargando(true);
    setError(null);
    
    try {
      let query = supabase
        .from('ofertas')
        .select(`
          id,
          auto_venta_id,
          profesional_id,
          monto_oferta,
          estado,
          created_at,
          autos_venta:auto_venta_id(
            marca,
            modelo,
            ano
          ),
          profesionales:profesional_id(
            negocio_nombre
          )
        `);

      // Filtrar por cliente o profesional
      if (clienteId) {
        const { data: ofertas, error: ofertasError } = await supabase
          .from('ofertas')
          .select(`
            id,
            auto_venta_id,
            profesional_id,
            monto_oferta,
            estado,
            created_at,
            autos_venta!inner(
              marca,
              modelo,
              ano,
              cliente_id
            ),
            profesionales:profesional_id(
              negocio_nombre
            )
          `)
          .eq('autos_venta.cliente_id', clienteId)
          .order('created_at', { ascending: false });

        if (ofertasError) throw ofertasError;

        return await procesarOfertas(ofertas || []);
      } else if (profesionalId) {
        const { data: ofertas, error: ofertasError } = await query
          .eq('profesional_id', profesionalId)
          .order('created_at', { ascending: false });

        if (ofertasError) throw ofertasError;

        return await procesarOfertas(ofertas || []);
      }

      return [];
    } catch (error) {
      console.error('Error obteniendo ofertas con mensajes:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return [];
    } finally {
      setCargando(false);
    }
  };

  const procesarOfertas = async (ofertas: any[]): Promise<OfertaConMensajes[]> => {
    if (!ofertas || ofertas.length === 0) return [];

    // Obtener estadísticas de mensajes para cada oferta
    const ofertasIds = ofertas.map(o => o.id);
    
    const { data: mensajesStats, error: mensajesError } = await supabase
      .from('mensajes_ofertas')
      .select('oferta_id, mensaje, created_at')
      .in('oferta_id', ofertasIds)
      .order('created_at', { ascending: false });

    if (mensajesError) throw mensajesError;

    // Obtener interacciones
    const { data: interacciones, error: interaccionesError } = await supabase
      .from('interacciones_profesionales')
      .select('oferta_id, telefono_revelado, elegible_evaluacion')
      .in('oferta_id', ofertasIds);

    if (interaccionesError) throw interaccionesError;

    // Combinar datos
    const ofertasConMensajes: OfertaConMensajes[] = ofertas.map(oferta => {
      const mensajesOferta = mensajesStats?.filter(m => m.oferta_id === oferta.id) || [];
      const interaccion = interacciones?.find(i => i.oferta_id === oferta.id);
      const ultimoMensaje = mensajesOferta[0];

      return {
        id: oferta.id,
        auto_venta_id: oferta.auto_venta_id,
        profesional_id: oferta.profesional_id,
        monto_oferta: oferta.monto_oferta,
        estado: oferta.estado,
        created_at: oferta.created_at,
        mensajes_count: mensajesOferta.length,
        ultimo_mensaje: ultimoMensaje?.mensaje || null,
        ultimo_mensaje_fecha: ultimoMensaje?.created_at || null,
        telefono_revelado: interaccion?.telefono_revelado || false,
        elegible_evaluacion: interaccion?.elegible_evaluacion || false,
        profesional_nombre: (oferta as any).profesionales?.negocio_nombre,
        auto_info: oferta.autos_venta ? {
          marca: (oferta as any).autos_venta.marca,
          modelo: (oferta as any).autos_venta.modelo,
          ano: (oferta as any).autos_venta.ano
        } : undefined
      };
    });

    return ofertasConMensajes;
  };

  const enviarMensaje = async (
    ofertaId: string,
    mensaje: string,
    remitenteTipo: 'cliente' | 'profesional',
    remitenteId: string
  ): Promise<boolean> => {
    setCargando(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('mensajes_ofertas')
        .insert({
          oferta_id: ofertaId,
          remitente_tipo: remitenteTipo,
          remitente_id: remitenteId,
          mensaje: mensaje.trim()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setError(error instanceof Error ? error.message : 'Error enviando mensaje');
      return false;
    } finally {
      setCargando(false);
    }
  };

  const obtenerMensajesOferta = async (ofertaId: string): Promise<MensajeOferta[]> => {
    setCargando(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('mensajes_ofertas')
        .select('*')
        .eq('oferta_id', ofertaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(mensaje => ({
        ...mensaje,
        remitente_tipo: mensaje.remitente_tipo as 'cliente' | 'profesional'
      }));
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      setError(error instanceof Error ? error.message : 'Error obteniendo mensajes');
      return [];
    } finally {
      setCargando(false);
    }
  };

  const marcarMensajesComoLeidos = async (ofertaId: string, remitenteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mensajes_ofertas')
        .update({ leido: true })
        .eq('oferta_id', ofertaId)
        .neq('remitente_id', remitenteId)
        .eq('leido', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      return false;
    }
  };

  const obtenerInteraccion = async (
    clienteId: string,
    profesionalId: string,
    ofertaId: string
  ): Promise<InteraccionProfesional | null> => {
    try {
      const { data, error } = await supabase
        .from('interacciones_profesionales')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('profesional_id', profesionalId)
        .eq('oferta_id', ofertaId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo interacción:', error);
      return null;
    }
  };

  const obtenerProfesionalesParaEvaluar = async (clienteId: string): Promise<any[]> => {
    setCargando(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('interacciones_profesionales')
        .select(`
          *,
          profesionales:profesional_id(
            negocio_nombre,
            contacto_principal
          ),
          ofertas:oferta_id(
            monto_oferta,
            created_at,
            autos_venta:auto_venta_id(
              marca,
              modelo,
              ano
            )
          )
        `)
        .eq('cliente_id', clienteId)
        .eq('elegible_evaluacion', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo profesionales para evaluar:', error);
      setError(error instanceof Error ? error.message : 'Error obteniendo profesionales');
      return [];
    } finally {
      setCargando(false);
    }
  };

  return {
    cargando,
    error,
    obtenerOfertasConMensajes,
    enviarMensaje,
    obtenerMensajesOferta,
    marcarMensajesComoLeidos,
    obtenerInteraccion,
    obtenerProfesionalesParaEvaluar
  };
}