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
      <Alert className={`border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 ${className}`}>
        <Gift className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm text-emerald-700">
            <strong>¡Gana 2 créditos gratis</strong> evaluando profesionales
          </span>
          <Button
            onClick={handleNavigateToEvaluations}
            size="sm"
            variant="outline"
            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            Evaluar <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Gift className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="flex-grow">
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800">
                  ¡Gana créditos gratis evaluando profesionales!
                </span>
              </div>
              <p className="text-sm text-emerald-700">
                Recibe <strong>2 créditos adicionales</strong> por cada evaluación con comentario que hagas. 
                Ayuda a la comunidad y obtén más consultas gratis.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Button
                  onClick={handleNavigateToEvaluations}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Ver evaluaciones pendientes
                </Button>
                <span className="text-xs text-emerald-600">
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