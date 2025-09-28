import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Lock } from "@/utils/iconImports";
import { useAuthSession } from "@/hooks/useAuthSession";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import AuthModal from "@/components/AuthModal";
import { useToast } from "@/hooks/use-toast";

interface AuthRequiredWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthRequiredWrapper({ 
  children, 
  title = "Registro Requerido",
  description = "Para acceder a esta función necesitas registrarte o iniciar sesión."
}: AuthRequiredWrapperProps) {
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const { user: usuario, loading: cargando } = useAuthSession();
  const { toast } = useToast();

  const manejarExitoAuth = () => {
    setMostrarAuth(false);
    toast({
      title: "¡Bienvenido!",
      description: "Ahora puedes acceder a todas las funciones.",
    });
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }

  if (!usuario) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-amber-200 bg-amber-50/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Lock className="h-8 w-8 text-amber-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-amber-800">{title}</CardTitle>
                  <p className="text-amber-700 mt-2">{description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                      <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Datos Seguros</h4>
                      <p className="text-xs text-muted-foreground">Tu información protegida</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                      <UserPlus className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Registro Rápido</h4>
                      <p className="text-xs text-muted-foreground">Solo necesitas email</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                      <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">5</div>
                      <h4 className="font-medium text-sm">Créditos Gratis</h4>
                      <p className="text-xs text-muted-foreground">Al registrarte</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      onClick={() => setMostrarAuth(true)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Registrarse o Iniciar Sesión
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={mostrarAuth} 
          onClose={() => setMostrarAuth(false)}
          onSuccess={manejarExitoAuth}
        />
      </>
    );
  }

  return <>{children}</>;
}