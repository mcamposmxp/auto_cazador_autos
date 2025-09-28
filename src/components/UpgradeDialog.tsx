import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Users, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: string;
  credits: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  bgColor: string;
}

const particularsPlans: Plan[] = [
  {
    id: 'basico_particular',
    name: 'Básico',
    price: '$100 MXN',
    credits: '20 créditos',
    description: 'Perfecto para consultas ocasionales',
    features: ['20 consultas de precios', 'Análisis básico', 'Válido por 30 días'],
    icon: CreditCard,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50'
  },
  {
    id: 'pro_particular',
    name: 'Pro',
    price: '$150 MXN',
    credits: '40 créditos',
    description: 'Para uso regular y análisis detallados',
    features: ['40 consultas de precios', 'Análisis avanzado', 'Recomendaciones IA', 'Válido por 30 días'],
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'premium_particular',
    name: 'Premium',
    price: '$229 MXN',
    credits: '75 créditos',
    description: 'Máximo valor para usuarios intensivos',
    features: ['75 consultas de precios', 'Análisis completo', 'IA avanzada', 'Soporte prioritario', 'Válido por 30 días'],
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
];

const professionalPlans: Plan[] = [
  {
    id: 'starter_profesional',
    name: 'Starter',
    price: '$299 MXN/mes',
    credits: '100 créditos',
    description: 'Ideal para profesionales independientes',
    features: ['100 créditos mensuales', 'Análisis profesional', 'Herramientas de gestión', 'Soporte estándar'],
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'business_profesional',
    name: 'Business',
    price: '$699 MXN/mes',
    credits: '300 créditos',
    description: 'Para agencias y equipos pequeños',
    features: ['300 créditos mensuales', 'Análisis avanzado', 'Dashboard profesional', 'API access', 'Soporte prioritario'],
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'enterprise_profesional',
    name: 'Enterprise',
    price: '$1,299 MXN/mes',
    credits: '1000 créditos',
    description: 'Para concesionarias y empresas grandes',
    features: ['1000 créditos mensuales', 'Análisis empresarial', 'Integraciones avanzadas', 'API completa', 'Soporte 24/7'],
    icon: Crown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
];

export function UpgradeDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (planId: string) => {
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

  const renderPlanCard = (plan: Plan) => {
    const PlanIcon = plan.icon;
    const isLoadingThis = isLoading && selectedPlan === plan.id;

    return (
      <Card key={plan.id} className={`border-2 hover:border-primary/30 transition-colors ${plan.bgColor}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PlanIcon className={`h-5 w-5 ${plan.color}`} />
              <h3 className="font-semibold">{plan.name}</h3>
            </div>
            <Badge variant="secondary">{plan.credits}</Badge>
          </div>
          
          <div className="mb-3">
            <p className="text-2xl font-bold text-primary mb-1">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>

          <ul className="text-sm space-y-1 mb-4">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>

          <Button 
            className="w-full" 
            onClick={() => handlePurchase(plan.id)}
            disabled={isLoading}
          >
            {isLoadingThis ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Seleccionar Plan'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80">
          <Zap className="h-4 w-4 mr-1" />
          Obtener más créditos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-amber-600" />
            Planes de Créditos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Planes para Particulares */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-600" />
              Particulares - Pago único
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {particularsPlans.map(renderPlanCard)}
            </div>
          </div>

          {/* Planes para Profesionales */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Profesionales - Suscripción mensual
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {professionalPlans.map(renderPlanCard)}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>• Los créditos de particulares expiran en 30 días</p>
            <p>• Las suscripciones profesionales se renuevan automáticamente</p>
            <p>• Puedes cancelar tu suscripción en cualquier momento</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}