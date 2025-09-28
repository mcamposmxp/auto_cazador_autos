import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Star, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificacionEvaluacionCreditosProps {
  onDismiss: () => void;
  pendingEvaluations?: number;
}

export function NotificacionEvaluacionCreditos({ 
  onDismiss, 
  pendingEvaluations = 0 
}: NotificacionEvaluacionCreditosProps) {
  const navigate = useNavigate();

  const handleGoToEvaluations = () => {
    onDismiss();
    navigate('/evaluar-profesionales');
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Gift className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex-grow">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-emerald-800">
                ¡Gana créditos gratis evaluando profesionales!
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-emerald-700 mb-3">
              Recibe <strong>2 créditos gratis</strong> por cada evaluación con comentario que hagas. 
              {pendingEvaluations > 0 && (
                <> Tienes <strong>{pendingEvaluations} evaluaciones pendientes</strong>.</>
              )}
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGoToEvaluations}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Star className="h-3 w-3" />
                {pendingEvaluations > 0 ? 'Evaluar ahora' : 'Ver evaluaciones'}
              </Button>
              <div className="text-xs text-emerald-600">
                Máximo 10 créditos/mes
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}