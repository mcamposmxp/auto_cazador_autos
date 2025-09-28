import { useState } from 'react';
import { HelpCircle, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCrispIntegration } from '@/hooks/useCrispIntegration';
import { useLocation } from 'react-router-dom';

const getContextualHelp = (pathname: string) => {
  const helpContexts: Record<string, { title: string; quickActions: string[] }> = {
    '/comprar': {
      title: 'Ayuda para Compradores',
      quickActions: ['¿Cómo usar filtros?', '¿Qué es Trust Service?', '¿Cómo contactar vendedor?']
    },
    '/vender': {
      title: 'Ayuda para Vendedores',
      quickActions: ['¿Cómo valuar mi auto?', 'Modalidades de venta', '¿Cuánto tiempo toma vender?']
    },
    '/profesionales': {
      title: 'Ayuda Profesional',
      quickActions: ['Configurar autoajuste', 'Gestionar inventario', 'Red B2B']
    },
    '/analytics': {
      title: 'Ayuda Analytics',
      quickActions: ['Interpretar gráficos', 'Exportar datos', 'Configurar alertas']
    },
    '/administracion': {
      title: 'Ayuda Administrativa',
      quickActions: ['Dashboard admin', 'Gestión usuarios', 'Reportes sistema']
    }
  };

  return helpContexts[pathname] || {
    title: 'Centro de Ayuda',
    quickActions: ['Preguntas frecuentes', 'Contactar soporte', 'Ver tutoriales']
  };
};

export function HelpFloatingButton() {
  const [showQuickHelp, setShowQuickHelp] = useState(false);
  const { openChat, showHelp } = useCrispIntegration();
  const location = useLocation();
  const contextHelp = getContextualHelp(location.pathname);

  const handleQuickAction = (action: string) => {
    console.log('handleQuickAction llamado con:', action);
    showHelp(action);
    setShowQuickHelp(false);
  };

  const handleChatOpen = () => {
    openChat();
    setShowQuickHelp(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showQuickHelp && (
        <Card className="mb-4 w-80 bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">
                {contextHelp.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickHelp(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Ayuda rápida para esta sección:
            </p>
            {contextHelp.quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => handleQuickAction(action)}
              >
                <HelpCircle className="h-3 w-3 mr-2" />
                {action}
              </Button>
            ))}
            <div className="pt-2 border-t border-border">
              <Button
                variant="default"
                size="sm"
                className="w-full h-8"
                onClick={handleChatOpen}
              >
                <MessageCircle className="h-3 w-3 mr-2" />
                Chat con Soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-full bg-card border-border shadow-lg hover:bg-accent"
          onClick={() => setShowQuickHelp(!showQuickHelp)}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="sm"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={handleChatOpen}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
      
      {location.pathname !== '/' && (
        <Badge 
          variant="secondary" 
          className="absolute -top-1 -left-2 text-xs bg-primary text-primary-foreground"
        >
          !
        </Badge>
      )}
    </div>
  );
}