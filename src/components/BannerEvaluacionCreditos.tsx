import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Star, Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BannerEvaluacionCreditosProps {
  className?: string;
  compact?: boolean;
}

export function BannerEvaluacionCreditos({ className = "", compact = false }: BannerEvaluacionCreditosProps) {
  const navigate = useNavigate();

  const handleNavigateToEvaluations = () => {
    navigate('/evaluar-profesionales');
  };

  if (compact) {
    return (
      <Alert className={`border-success/20 bg-gradient-to-r from-success/10 to-success/5 ${className}`}>
        <Gift className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm text-success-foreground">
            <strong>¡Gana 2 créditos gratis</strong> evaluando profesionales
          </span>
          <Button
            onClick={handleNavigateToEvaluations}
            size="sm"
            variant="outline"
            className="h-7 text-xs border-success/30 text-success-foreground hover:bg-success/20"
          >
            Evaluar <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-success/20 bg-gradient-to-r from-success/10 to-success/5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
            <Gift className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className="flex-grow">
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-success" />
                <span className="font-semibold text-success-foreground">
                  ¡Gana créditos gratis evaluando profesionales!
                </span>
              </div>
              <p className="text-sm text-success-foreground">
                Recibe <strong>2 créditos adicionales</strong> por cada evaluación con comentario que hagas. 
                Ayuda a la comunidad y obtén más consultas gratis.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Button
                  onClick={handleNavigateToEvaluations}
                  size="sm"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  Ver evaluaciones pendientes
                </Button>
                <span className="text-xs text-success">
                  Máximo 10 créditos mensuales
                </span>
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}