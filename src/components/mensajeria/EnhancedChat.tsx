import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, Phone, UserCheck } from 'lucide-react';
import { useSimpleChat } from '@/hooks/useSimpleChat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface EnhancedChatProps {
  chatId: string;
  chatType: 'oferta' | 'profesional';
  title: string;
  subtitle?: string;
  currentUserId: string;
  participants: {
    id: string;
    name: string;
    type?: string;
  }[];
  phoneRevealed?: boolean;
  phoneNumber?: string;
  canEvaluate?: boolean;
  onEvaluate?: () => void;
}

export function EnhancedChat({
  chatId,
  chatType,
  title,
  subtitle,
  currentUserId,
  participants,
  phoneRevealed,
  phoneNumber,
  canEvaluate,
  onEvaluate
}: EnhancedChatProps) {
  const [newMessageText, setNewMessageText] = useState('');
  
  const {
    messages,
    isLoading,
    isSending,
    sendMessage
  } = useSimpleChat({
    chatId,
    chatType
  });

  const handleSendMessage = async () => {
    if (!newMessageText.trim()) return;
    const success = await sendMessage(newMessageText);
    if (success) {
      setNewMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getParticipantName = (userId: string) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.name || 'Usuario';
  };

  if (isLoading) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {phoneRevealed && phoneNumber && (
              <Button variant="outline" size="sm" className="text-xs">
                <Phone className="h-3 w-3 mr-1" />
                {phoneNumber}
              </Button>
            )}
            {canEvaluate && (
              <Button onClick={onEvaluate} size="sm" variant="secondary">
                <UserCheck className="h-3 w-3 mr-1" />
                Evaluar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Área de mensajes */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
              </div>
            ) : (
              messages.map((mensaje) => {
                const esPropio = mensaje.remitente_id === currentUserId;
                
                return (
                  <div key={mensaje.id} className={`flex ${esPropio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] space-y-1`}>
                      {!esPropio && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getParticipantName(mensaje.remitente_id)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {getParticipantName(mensaje.remitente_id)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`
                        p-3 rounded-lg break-words
                        ${esPropio 
                          ? 'bg-primary text-primary-foreground ml-8' 
                          : 'bg-muted mr-8'
                        }
                      `}>
                        <p className="text-sm whitespace-pre-wrap">{mensaje.mensaje}</p>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${esPropio ? 'justify-end' : 'justify-start'}`}>
                        <span>
                          {formatDistanceToNow(new Date(mensaje.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                        {esPropio && (
                          <Badge variant={mensaje.leido ? "default" : "secondary"} className="text-xs">
                            {mensaje.leido ? "Leído" : "Enviado"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Aquí iría el indicador de escritura cuando esté implementado */}
          </div>
        </ScrollArea>

        {/* Área de escritura */}
        <div className="p-4 border-t bg-background/50">
          <div className="flex gap-2">
            <Textarea
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isSending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessageText.trim() || isSending}
              size="lg"
              className="px-4"
            >
              <Send className="h-4 w-4" />
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