import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  supported: boolean;
}

interface NotificationPreferences {
  newOffers: boolean;
  priceAlerts: boolean;
  marketUpdates: boolean;
  systemUpdates: boolean;
}

export function NotificationSystem() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    supported: 'Notification' in window
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newOffers: true,
    priceAlerts: true,
    marketUpdates: false,
    systemUpdates: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthSession();

  useEffect(() => {
    checkNotificationPermission();
    loadPreferences();
  }, [user]);

  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      return;
    }

    setPermission({
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      supported: true
    });
  };

  const loadPreferences = () => {
    if (!user) return;

    // Cargar desde localStorage por ahora
    const saved = localStorage.getItem(`notification-prefs-${user.id}`);
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading preferences from localStorage:', error);
      }
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta notificaciones",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      
      if (result === 'granted') {
        setPermission(prev => ({ ...prev, granted: true, denied: false }));
        toast({
          title: "¡Perfecto!",
          description: "Notificaciones activadas correctamente"
        });
        
        // Enviar notificación de bienvenida
        new Notification('AutoVenta Pro', {
          body: '¡Notificaciones activadas! Te mantendremos informado de todas las novedades.',
          icon: '/favicon.ico'
        });
      } else {
        setPermission(prev => ({ ...prev, denied: true, granted: false }));
        toast({
          title: "Permisos denegados",
          description: "No podrás recibir notificaciones automáticas",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = (newPrefs: NotificationPreferences) => {
    if (!user) return;

    // Guardar en localStorage por ahora
    localStorage.setItem(`notification-prefs-${user.id}`, JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    
    toast({
      title: "Preferencias guardadas",
      description: "Tus preferencias de notificaciones han sido actualizadas"
    });
  };

  const sendTestNotification = () => {
    if (!permission.granted) return;

    new Notification('AutoVenta Pro - Prueba', {
      body: 'Esta es una notificación de prueba. ¡Todo funciona correctamente!',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });

    toast({
      title: "Notificación enviada",
      description: "Deberías ver una notificación de prueba"
    });
  };

  if (!permission.supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones no disponibles
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones web
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de Notificaciones
          </CardTitle>
          <CardDescription>
            Administra tus notificaciones y preferencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Permisos de notificación</p>
              <p className="text-sm text-muted-foreground">
                {permission.granted 
                  ? "Las notificaciones están activadas" 
                  : permission.denied 
                    ? "Las notificaciones fueron denegadas" 
                    : "Las notificaciones no están configuradas"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={permission.granted ? "default" : "secondary"}>
                {permission.granted ? "Activadas" : permission.denied ? "Denegadas" : "Pendientes"}
              </Badge>
              {!permission.granted && (
                <Button 
                  onClick={requestPermission}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? "Solicitando..." : "Activar"}
                </Button>
              )}
            </div>
          </div>

          {permission.granted && (
            <div className="pt-4 border-t">
              <Button 
                onClick={sendTestNotification}
                variant="outline" 
                size="sm"
              >
                Enviar notificación de prueba
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferencias de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferencias de Notificaciones
          </CardTitle>
          <CardDescription>
            Personaliza qué tipo de notificaciones deseas recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: 'newOffers' as keyof NotificationPreferences,
              title: 'Nuevas ofertas',
              description: 'Cuando recibas ofertas por tus vehículos'
            },
            {
              key: 'priceAlerts' as keyof NotificationPreferences,
              title: 'Alertas de precio',
              description: 'Cambios importantes en precios de mercado'
            },
            {
              key: 'marketUpdates' as keyof NotificationPreferences,
              title: 'Actualizaciones de mercado',
              description: 'Tendencias y análisis del mercado automotriz'
            },
            {
              key: 'systemUpdates' as keyof NotificationPreferences,
              title: 'Actualizaciones del sistema',
              description: 'Nuevas funciones y mantenimientos importantes'
            }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button
                variant={preferences[item.key] ? "default" : "outline"}
                size="sm"
                onClick={() => updatePreferences({
                  ...preferences,
                  [item.key]: !preferences[item.key]
                })}
              >
                {preferences[item.key] ? "Activado" : "Desactivado"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}