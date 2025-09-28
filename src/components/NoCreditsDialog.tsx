import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CreditCard, Zap, AlertTriangle } from "lucide-react";

interface NoCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoCreditsDialog({ open, onOpenChange }: NoCreditsDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/planes');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl">Sin créditos disponibles</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            No tienes créditos suficientes para realizar esta acción. Actualiza tu plan para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">¿Qué puedes hacer con más créditos?</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Análisis de precios, datos de mercado, autoajuste automático y más
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleUpgrade} className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Ver Planes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}