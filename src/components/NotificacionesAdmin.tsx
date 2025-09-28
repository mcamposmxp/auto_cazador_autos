import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function NotificacionesAdmin() {
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const enviarNotificacionGlobal = async () => {
    if (!titulo || !mensaje) {
      toast({
        title: "Error",
        description: "El título y mensaje son requeridos",
        variant: "destructive"
      });
      return;
    }

    setEnviando(true);

    try {
      const { error } = await supabase.functions.invoke('crear-notificacion', {
        body: {
          titulo,
          mensaje,
          tipo,
          es_global: true
        }
      });

      if (error) throw error;

      toast({
        title: "Notificación enviada",
        description: "La notificación global ha sido enviada a todos los usuarios"
      });

      // Limpiar formulario
      setTitulo("");
      setMensaje("");
      setTipo('info');

    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar Notificación Global
        </CardTitle>
        <CardDescription>
          Envía una notificación que será visible para todos los usuarios registrados
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la notificación"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => setTipo(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Información</SelectItem>
              <SelectItem value="success">Éxito</SelectItem>
              <SelectItem value="warning">Advertencia</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensaje">Mensaje</Label>
          <Textarea
            id="mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Contenido del mensaje..."
            rows={4}
          />
        </div>

        <Button 
          onClick={enviarNotificacionGlobal}
          disabled={enviando}
          className="w-full"
        >
          {enviando ? "Enviando..." : "Enviar Notificación Global"}
        </Button>
      </CardContent>
    </Card>
  );
}