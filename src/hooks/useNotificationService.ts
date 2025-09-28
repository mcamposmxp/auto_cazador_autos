import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';
import { useToast } from './use-toast';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export function useNotificationService() {
  const { user } = useAuthSession();
  const { toast } = useToast();

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNewNotification = useCallback((notification: any) => {
    // Mostrar toast notification
    toast({
      title: notification.titulo,
      description: notification.mensaje,
    });

    // Si las notificaciones del navegador están habilitadas, mostrar también
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.titulo, {
          body: notification.mensaje,
          icon: '/favicon.ico',
          tag: `notification-${notification.id}`,
          requireInteraction: notification.tipo === 'important'
        });
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  }, [toast]);

  const sendNotification = useCallback(async (
    userId: string,
    payload: NotificationPayload,
    type: string = 'info'
  ) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .insert({
          user_id: userId,
          titulo: payload.title,
          mensaje: payload.body,
          tipo: type,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, []);

  const sendSystemNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .insert({
          user_id: null, // Global notification
          titulo: payload.title,
          mensaje: payload.body,
          tipo: 'system',
          es_global: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending system notification:', error);
      return false;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  return {
    sendNotification,
    sendSystemNotification,
    markAsRead,
    requestPermission,
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'unsupported'
  };
}