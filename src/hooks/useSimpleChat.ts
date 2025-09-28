import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';
import { useToast } from './use-toast';

export interface ChatMessage {
  id: string;
  remitente_id: string;
  mensaje: string;
  created_at: string;
  leido: boolean;
}

interface UseSimpleChatProps {
  chatId: string;
  chatType: 'oferta' | 'profesional';
}

export function useSimpleChat({ chatId, chatType }: UseSimpleChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuthSession();
  const { toast } = useToast();

  // Cargar mensajes iniciales
  const loadMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      setIsLoading(true);
      
      if (chatType === 'oferta') {
        const { data, error } = await supabase
          .from('mensajes_ofertas')
          .select('*')
          .eq('oferta_id', chatId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } else {
        const { data, error } = await supabase
          .from('mensajes_profesional_profesional')
          .select('*')
          .eq('interaccion_id', chatId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId, chatType, toast]);

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!chatId || !user) return;

    const tableName = chatType === 'oferta' ? 'mensajes_ofertas' : 'mensajes_profesional_profesional';
    const filterField = chatType === 'oferta' ? 'oferta_id' : 'interaccion_id';

    const channel = supabase
      .channel(`chat-${chatType}-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `${filterField}=eq.${chatId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Notificar mensaje nuevo si no es del usuario actual
          if (newMessage.remitente_id !== user.id) {
            toast({
              title: "Nuevo mensaje",
              description: "Has recibido un nuevo mensaje"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, chatType, user, toast]);

  // Cargar mensajes al montar
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Enviar mensaje
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !user || !chatId || isSending) return;

    try {
      setIsSending(true);
      const tableName = chatType === 'oferta' ? 'mensajes_ofertas' : 'mensajes_profesional_profesional';
      const data: any = {
        mensaje: messageText.trim(),
        remitente_id: user.id,
        leido: false
      };

      if (chatType === 'oferta') {
        data.oferta_id = chatId;
        data.remitente_tipo = 'cliente';
      } else {
        data.interaccion_id = chatId;
      }

      const { error } = await supabase
        .from(tableName as any)
        .insert(data);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSending(false);
    }
  }, [user, chatId, chatType, isSending, toast]);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    refreshMessages: loadMessages
  };
}