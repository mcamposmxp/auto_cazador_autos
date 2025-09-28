import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useToast } from "@/hooks/use-toast";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  es_global: boolean;
  created_at: string;
}

interface UseNotificacionesReturn {
  notificaciones: Notificacion[];
  loading: boolean;
  noLeidas: number;
  marcarComoLeida: (id: string) => Promise<void>;
  recargar: () => Promise<void>;
}

export function useNotificaciones(): UseNotificacionesReturn {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthSession();
  const { toast } = useToast();

  const cargarNotificaciones = useCallback(async () => {
    if (!user) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setNotificaciones(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const marcarComoLeida = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotificaciones(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id},es_global=eq.true`
        },
        (payload) => {
          const nuevaNotificacion = payload.new as Notificacion;
          setNotificaciones(prev => [nuevaNotificacion, ...prev]);
          
          // Show toast for new notifications
          toast({
            title: nuevaNotificacion.titulo,
            description: nuevaNotificacion.mensaje,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return {
    notificaciones,
    loading,
    noLeidas,
    marcarComoLeida,
    recargar: cargarNotificaciones
  };
}