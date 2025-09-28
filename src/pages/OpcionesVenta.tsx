import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, DollarSign, Users, TrendingUp, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OpcionesVenta() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Opciones para vender tu auto
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Elige la mejor opción para vender tu vehículo según tus necesidades y preferencias
          </p>
        </div>

        {/* Opciones de venta */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Red de Profesionales */}
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors relative h-full flex flex-col">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Más Popular
              </span>
            </div>
            <CardHeader className="text-center pb-4 pt-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Red de Profesionales</CardTitle>
              <p className="text-muted-foreground">Te conectamos con compradores profesionales verificados</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Ventajas</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sin costo para ti</li>
                    <li>• Ahorro de tiempo</li>
                    <li>• Seguridad garantizada</li>
                    <li>• Rapidez en la venta</li>
                    <li>• Comodidad total</li>
                    <li>• Tú decides a quién contactar</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Desventaja</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Precio menor que venta directa</li>
                  </ul>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={() => navigate('/red-profesionales')}>
                <Info className="h-4 w-4 mr-2" />
                Más información
              </Button>
            </CardContent>
          </Card>

          {/* Subasta */}
          <Card className="border-2 border-primary/40 hover:border-primary/60 transition-colors relative h-full flex flex-col">
            <CardHeader className="text-center pb-4">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Subasta de tu auto</CardTitle>
              <p className="text-muted-foreground">Subasta exclusiva para compradores profesionales</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Ventajas</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sin desgaste para ti</li>
                    <li>• Proceso transparente</li>
                    <li>• Precio garantizado</li>
                    <li>• Operación segura</li>
                    <li>• Comodidad total</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Desventajas</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tiene un costo</li>
                    <li>• Requiere tiempo para revisión</li>
                  </ul>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={() => navigate('/subasta-auto')}>
                <Info className="h-4 w-4 mr-2" />
                Más información
              </Button>
            </CardContent>
          </Card>

          {/* Venta por tu cuenta */}
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors h-full flex flex-col">
            <CardHeader className="text-center pb-4">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Venta por tu cuenta (Con nuestra ayuda)</CardTitle>
              <p className="text-muted-foreground">Vende tu auto sin riesgos y con opción de financiamiento</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Ventajas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Mayor ganancia</li>
              <li>• Venta con financiamiento</li>
              <li>• Seguridad garantizada</li>
              <li>• Tú decides el precio</li>
            </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Desventajas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Requiere tiempo</li>
              <li>• Inversión inicial</li>
            </ul>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={() => navigate('/venta-cuenta-propia')}>
                <Info className="h-4 w-4 mr-2" />
                Más información
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">¿No estás seguro cuál elegir?</h3>
              <p className="text-muted-foreground mb-6">
                Nuestros expertos pueden ayudarte a elegir la mejor opción según tu situación específica
              </p>
              <Button variant="outline" size="lg">
                Hablar con un experto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}