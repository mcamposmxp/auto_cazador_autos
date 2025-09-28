import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Calculator, TrendingUp } from "lucide-react";
import { FormularioValuacion } from "./FormularioValuacion";
import { AnalisisPrecio } from "./AnalisisPrecio";
import { AuthRequiredWrapper } from "./AuthRequiredWrapper";

interface DatosVehiculo {
  marca: string;
  modelo: string;
  ano: number;
  version: string;
  kilometraje: number;
  estado: string;
  ciudad: string;
}

export default function ValuacionAuto() {
  const [mostrarAnalisis, setMostrarAnalisis] = useState(false);
  const [datosVehiculo, setDatosVehiculo] = useState<DatosVehiculo | null>(null);

  const manejarEnvio = (datos: DatosVehiculo) => {
    setDatosVehiculo(datos);
    setMostrarAnalisis(true);
  };

  const volverAlFormulario = () => {
    setMostrarAnalisis(false);
    setDatosVehiculo(null);
  };

  if (mostrarAnalisis && datosVehiculo) {
    return <AnalisisPrecio datos={datosVehiculo} onVolver={volverAlFormulario} />;
  }

  return (
    <AuthRequiredWrapper
      title="Análisis de Precios Profesional"
      description="Para acceder al análisis de precios necesitas registrarte. Es gratis y recibes 5 consultas al registrarte."
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Conoce el precio de tu auto
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre el valor real de tu vehículo en el mercado actual con nuestro análisis inteligente
            </p>
          </div>

          {/* Beneficios */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="bg-success/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Precio Preciso</h3>
                <p className="text-muted-foreground">Análisis basado en datos reales del mercado mexicano</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Tendencias Actuales</h3>
                <p className="text-muted-foreground">Información actualizada de precios y demanda</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Comparativa</h3>
                <p className="text-muted-foreground">Ve autos similares disponibles en el mercado</p>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <FormularioValuacion onEnviar={manejarEnvio} />
        </div>
      </div>
    </AuthRequiredWrapper>
  );
}