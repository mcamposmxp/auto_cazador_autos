import React, { useEffect, useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Crown, Users, AlertTriangle, Star, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthModal from './AuthModal';
import { UpgradeDialog } from './UpgradeDialog';

interface CreditInfo {
  credits_available: number;
  credits_used_this_month: number;
  monthly_limit: number;
  plan_type: string;
}

interface CreditControlProps {
  onCreditChange?: (credits: number) => void;
  showUpgrade?: boolean;
}

export const CreditControl = memo(function CreditControl({ onCreditChange, showUpgrade = true }: CreditControlProps) {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCreditInfo();
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCreditInfo();
      } else {
        setCreditInfo(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCreditInfo = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_available, credits_used_this_month, monthly_limit, plan_type')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const credits = data || {
        credits_available: 5,
        credits_used_this_month: 0,
        monthly_limit: 5,
        plan_type: 'gratuito'
      };

      setCreditInfo(credits);
      onCreditChange?.(credits.credits_available);
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los créditos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    fetchCreditInfo();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-sm border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Consulta limitada</p>
              <p className="text-sm text-amber-600">Solo 1 consulta gratis disponible</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAuth(true)}
            size="sm" 
            className="w-full bg-primary hover:bg-primary/90"
          >
            Registrarse para más consultas
          </Button>
          <AuthModal 
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthSuccess}
          />
        </CardContent>
      </Card>
    );
  }

  if (!creditInfo) {
    return null;
  }

  const usagePercentage = (creditInfo.credits_used_this_month / creditInfo.monthly_limit) * 100;
  const remainingCredits = creditInfo.credits_available;
  const isLowCredits = remainingCredits <= 1;
  const isOutOfCredits = remainingCredits === 0;

  const getPlanInfo = (planType: string) => {
    switch (planType) {
      case 'premium':
        return { name: 'Premium', icon: Crown, color: 'text-amber-600', bgColor: 'bg-amber-50' };
      case 'profesional':
        return { name: 'Profesional', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      default:
        return { name: 'Gratuito', icon: CreditCard, color: 'text-slate-600', bgColor: 'bg-slate-50' };
    }
  };

  const planInfo = getPlanInfo(creditInfo.plan_type);
  const PlanIcon = planInfo.icon;

  return (
    <Card className={`max-w-sm ${isOutOfCredits ? 'border-destructive/50 bg-destructive/5' : isLowCredits ? 'border-amber-300 bg-amber-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <PlanIcon className={`h-4 w-4 ${planInfo.color}`} />
            <span>Plan {planInfo.name}</span>
          </div>
          <Badge variant={remainingCredits > 2 ? "default" : remainingCredits > 0 ? "secondary" : "destructive"}>
            {remainingCredits} créditos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Usado este mes</span>
              <span>{creditInfo.credits_used_this_month}/{creditInfo.monthly_limit}</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${isOutOfCredits ? '[&>div]:bg-destructive' : isLowCredits ? '[&>div]:bg-amber-500' : ''}`}
            />
          </div>

          {/* Incentivo para evaluaciones y referidos */}
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Evalúa profesionales</span>
              </div>
              <p className="text-xs text-green-700">
                2 créditos por evaluación con comentario. Máximo 10 créditos mensuales.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Invita amigos</span>
              </div>
              <p className="text-xs text-purple-700">
                5 créditos por amigo referido. Máximo 25 créditos mensuales.
              </p>
            </div>
          </div>

          {isOutOfCredits && (
            <div className="text-sm text-destructive text-center py-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Sin créditos disponibles
            </div>
          )}

          {isLowCredits && !isOutOfCredits && (
            <div className="text-sm text-amber-600 text-center py-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Pocos créditos restantes
            </div>
          )}

          {showUpgrade && creditInfo.plan_type === 'gratuito' && (
            <UpgradeDialog />
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default CreditControl;