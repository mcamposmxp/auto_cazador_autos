import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Users, CreditCard, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';

interface Plan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  credits: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  bgColor: string;
  isPopular?: boolean;
  ctaText: string;
}

const particularsPlans: Plan[] = [
  {
    id: 'basico_particular',
    name: 'Básico',
    price: '$100',
    credits: '20 créditos',
    description: 'Perfecto para consultas ocasionales',
    features: [
      '20 consultas de precios',
      'Análisis básico de mercado',
      'Recomendaciones simples',
      'Válido por 30 días',
      'Soporte por email'
    ],
    icon: CreditCard,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    ctaText: 'Comprar Ahora'
  },
  {
    id: 'pro_particular',
    name: 'Pro',
    price: '$150',
    originalPrice: '$200',
    credits: '40 créditos',
    description: 'Para uso regular y análisis detallados',
    features: [
      '40 consultas de precios',
      'Análisis avanzado de tendencias',
      'Recomendaciones IA mejoradas',
      'Comparativas detalladas',
      'Válido por 30 días',
      'Soporte prioritario'
    ],
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isPopular: true,
    ctaText: 'Más Popular'
  },
  {
    id: 'premium_particular',
    name: 'Premium',
    price: '$229',
    originalPrice: '$300',
    credits: '75 créditos',
    description: 'Máximo valor para usuarios intensivos',
    features: [
      '75 consultas de precios',
      'Análisis completo de mercado',
      'IA avanzada con predicciones',
      'Reportes personalizados',
      'Alertas de oportunidades',
      'Válido por 30 días',
      'Soporte 24/7'
    ],
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    ctaText: 'Máximo Ahorro'
  }
];

const professionalPlans: Plan[] = [
  {
    id: 'esencial_profesional',
    name: 'Esencial',
    price: '$499',
    credits: '150 consultas/mes',
    description: 'Solo consultas de precios básicas',
    features: [
      '150 consultas de precios',
      'Análisis completo de mercado',
      'IA avanzada con predicciones',
      'Válido por 30 días',
      'Contador unificado de créditos',
      'Dashboard con desglose de uso',
      'Soporte básico'
    ],
    icon: CreditCard,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    ctaText: 'Empezar Ahora'
  },
  {
    id: 'profesional_profesional',
    name: 'Profesional',
    price: '$999',
    credits: '160 consultas/mes',
    description: 'Consultas + Ajustes automáticos',
    features: [
      '160 consultas mensuales totales',
      'Ajustes automáticos de precios de autos en venta',
      '25 anuncios con info de mercado automática (100 consultas por mes)',
      'API de inventario',
      '60 búsquedas manuales de precios',
      'Configuración de ajuste automático de precio',
      'Reglas personalizables de precio, por demanda y tiempo',
      'Gestión inteligente de inventario',
      'Contador unificado de créditos',
      'Dashboard con desglose de uso',
      'Soporte estándar'
    ],
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isPopular: true,
    ctaText: 'Más Popular'
  },
  {
    id: 'business_profesional',
    name: 'Business',
    price: '$1,999',
    credits: '300 consultas/mes',
    description: 'Consultas + Ajustes + Oportunidades',
    features: [
      '300 consultas mensuales totales',
      'Ajustes automáticos de precios de autos en venta',
      '50 anuncios con info de mercado automática (200 consultas por mes)',
      'API de inventario',
      '100 búsquedas manuales de precios',
      'Configuración de ajuste automático de precio',
      'Reglas personalizables de precio, por demanda y tiempo',
      'Oportunidades de compra de unidades (Particulares y profesionales)',
      'Gestión inteligente de inventario',
      'Contador unificado de créditos',
      'Dashboard con desglose de uso',
      'Soporte estándar'
    ],
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    ctaText: 'Comenzar Business'
  },
  {
    id: 'enterprise_profesional',
    name: 'Enterprise',
    price: '$2,999',
    credits: '600 consultas/mes',
    description: 'Consultas + Ajustes + Oportunidades + Análisis',
    features: [
      '600 consultas mensuales totales',
      'Ajustes automáticos de precios de autos en venta',
      '75 anuncios con info de mercado automática (300 consultas por mes)',
      'API de inventario',
      '300 búsquedas manuales de precios',
      'Configuración de ajuste automático de precio',
      'Reglas personalizables de precio, por demanda y tiempo',
      'Oportunidades de compra de unidades (Particulares y profesionales)',
      'Analisis del mercado nacional',
      'Gestión inteligente de inventario',
      'Contador unificado de créditos',
      'Dashboard con desglose de uso',
      'Soporte estándar',
      'Soporte 24/7 dedicado'
    ],
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    ctaText: 'Contactar Ventas'
  }
];

export default function Planes() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      setIsLoading(true);
      setSelectedPlan(planId);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_type: planId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No se pudo obtener la URL de pago');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el pago. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan: Plan, section: 'particulares' | 'profesionales') => {
    const PlanIcon = plan.icon;
    const isLoadingThis = isLoading && selectedPlan === plan.id;

    return (
      <Card 
        key={plan.id} 
        className={`relative border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col h-full ${
          plan.isPopular ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border'
        } ${plan.bgColor}`}
      >
        {plan.isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-3 py-1">
              ⭐ {section === 'particulares' ? 'Más Popular' : 'Más Elegido'}
            </Badge>
          </div>
        )}
        
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <PlanIcon className={`h-8 w-8 ${plan.color}`} />
            <CardTitle className="text-xl">{plan.name}</CardTitle>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-primary">{plan.price}</span>
              <span className="text-muted-foreground">
                {section === 'profesionales' ? '/mes' : 'MXN'}
              </span>
            </div>
            {plan.originalPrice && (
              <div className="text-sm text-muted-foreground">
                <span className="line-through">{plan.originalPrice} MXN</span>
                <Badge variant="secondary" className="ml-2">
                  Ahorro {Math.round(((parseInt(plan.originalPrice.slice(1)) - parseInt(plan.price.slice(1))) / parseInt(plan.originalPrice.slice(1))) * 100)}%
                </Badge>
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="mx-auto mt-2">
            {plan.credits}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col">
          <ul className="space-y-2 flex-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
            size="lg"
            onClick={() => handlePurchase(plan.id)}
            disabled={isLoading}
          >
            {isLoadingThis ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              plan.ctaText
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground">
          Planes de Créditos AutoPriceLabs
        </h1>
        <p className="text-xl text-muted-foreground">
          Obtén acceso completo a análisis de precios, tendencias de mercado y recomendaciones inteligentes
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-600" />
            <span>Sin comisiones ocultas</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-600" />
            <span>Activación instantánea</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-600" />
            <span>Soporte especializado</span>
          </div>
        </div>
      </div>

      {/* Planes para Particulares */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <CreditCard className="h-8 w-8 text-slate-600" />
            Particulares
          </h2>
          <p className="text-lg text-muted-foreground">
            Pago único • Créditos válidos por 30 días • Ideal para compra/venta ocasional
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {particularsPlans.map(plan => renderPlanCard(plan, 'particulares'))}
        </div>
      </section>

      {/* Planes para Profesionales */}
      <section className="space-y-6">
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Profesionales
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 space-y-3">
            <h3 className="text-2xl font-bold text-blue-900">
              Maximiza tu negocio automotriz con tecnología inteligente
            </h3>
            <p className="text-blue-700 text-lg leading-relaxed">
              Nuestra plataforma te ofrece herramientas profesionales que transforman la manera de gestionar tu inventario, 
              optimizar precios y conectar con oportunidades de negocio. Con análisis de IA avanzada, autoajuste de precios 
              y acceso a una red exclusiva de profesionales del sector.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="font-semibold text-green-700 mb-1">⏱️ Ahorra Tiempo</div>
              <div className="text-muted-foreground">Automatización inteligente de tareas repetitivas</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="font-semibold text-blue-700 mb-1">💰 Aumenta Ganancias</div>
              <div className="text-muted-foreground">Precios optimizados con análisis de mercado</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="font-semibold text-purple-700 mb-1">🌐 Amplía tu Alcance</div>
              <div className="text-muted-foreground">Red exclusiva de oportunidades profesionales</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="font-semibold text-orange-700 mb-1">📊 Mejores Decisiones</div>
              <div className="text-muted-foreground">Análisis predictivo e insights de IA</div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900">💡 Tipos de Consumo de Créditos:</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">🔍</span>
                <div>
                  <strong>Consulta manual:</strong> 1 crédito por búsqueda directa de precios
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">📋</span>
                <div>
                  <strong>Vista "Mis Anuncios":</strong> 1 crédito por semana por auto publicado
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">⚙️</span>
                <div>
                  <strong>Autoajuste automático:</strong> Configuración de reglas de precio inteligentes
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">📊</span>
                <div>
                  <strong>Historial de cambios:</strong> Seguimiento completo de ajustes automáticos
                </div>
              </div>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Suscripción mensual • Renovación automática • Para agencias y concesionarias
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {professionalPlans.map(plan => renderPlanCard(plan, 'profesionales'))}
        </div>
      </section>

      {/* FAQ/Info Section */}
      <section className="bg-muted/50 rounded-lg p-8 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-6">Preguntas Frecuentes</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-semibold mb-2">¿Cómo funcionan los créditos profesionales?</h4>
            <p className="text-sm text-muted-foreground">
              Los profesionales tienen dos tipos de consumo: 1 crédito por búsqueda manual y 1 crédito semanal 
              por auto en "Mis Anuncios" para información de mercado automática.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">¿Cómo funciona el autoajuste automático?</h4>
            <p className="text-sm text-muted-foreground">
              Configura reglas personalizadas por demanda, tiempo y calendario para que el sistema 
              ajuste automáticamente los precios de tus autos según las condiciones del mercado.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">¿Cómo veo mi desglose de créditos?</h4>
            <p className="text-sm text-muted-foreground">
              En tu dashboard verás el desglose completo: "X usados en anuncios, Y en búsquedas" para 
              controlar exactamente cómo usas tus créditos.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">¿Los créditos expiran?</h4>
            <p className="text-sm text-muted-foreground">
              Los créditos de particulares expiran en 30 días. Los profesionales se renuevan mensualmente 
              y las configuraciones de autoajuste se mantienen activas.
            </p>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />
    </div>
  );
}