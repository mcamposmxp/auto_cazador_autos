import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Heart, 
  Users, 
  Building2, 
  AlertTriangle, 
  Car, 
  FileText, 
  TrendingUp, 
  Shield,
  CheckCircle,
  Info
} from "lucide-react";

export default function PreciosVenta() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Precios de Venta</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Comprende cómo funcionan los precios reales de venta de automóviles y toma mejores decisiones
        </p>
      </div>

      {/* Main Question Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Info className="h-8 w-8 text-primary" />
            ¿Por qué el precio publicado de un auto es diferente al precio real de venta?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">
            ¡Hola! Cuando buscas o vendes un auto, los precios que ves publicados no siempre son los precios finales. 
            Aquí te explicamos por qué y cómo nuestra herramienta te ayuda a encontrar un precio de venta más realista.
          </p>
        </CardContent>
      </Card>

      {/* How We Calculate Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground text-center">
          Calculando el precio de venta estimado de tu auto
        </h2>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-base leading-relaxed text-center">
              Nuestra herramienta usa los precios de autos similares en el mercado. Pero como casi siempre hay negociación, 
              calculamos un precio de venta más cercano a la realidad, considerando estos rangos:
            </p>
          </CardContent>
        </Card>

        {/* Sales Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Friends and Family */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Heart className="h-6 w-6" />
                Venta entre amigos o conocidos
              </CardTitle>
              <Badge className="w-fit bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Mejor opción
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Esta es la mejor opción ya que la negociación es bastante simple, acuerdas un buen precio de venta y no corres riesgos.
              </p>
            </CardContent>
          </Card>

          {/* Private Sales */}
          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <Users className="h-6 w-6" />
                Venta a particulares
              </CardTitle>
              <Badge className="w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                5% - 10% descuento
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Si vendes tu auto a otra persona, es común que se negocie una rebaja de entre 5% y 10% sobre el precio publicado.
              </p>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Debes tomar precauciones al vender a desconocidos para evitar fraudes o asaltos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Sales */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Building2 className="h-6 w-6" />
                Venta a profesionales
              </CardTitle>
              <Badge className="w-fit bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                10% - 25% descuento
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Si vendes tu auto a una agencia o lote, la negociación suele ser mayor, entre un 10% y 25% del precio que anuncias.
              </p>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  La ventaja es que evitas situaciones de riesgo siempre y cuando sea un negocio bien establecido y con reputación.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Point */}
      <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <CheckCircle className="h-6 w-6" />
            Un punto clave sobre la negociación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">
            Aunque es común negociar y reducir el precio, <strong>no es una regla obligatoria</strong>. 
            La decisión final de negociar siempre dependerá de ti como vendedor y debes considerar 
            el rango de precio de tu auto vs valores de mercado.
          </p>
        </CardContent>
      </Card>

      {/* Additional Factors */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground text-center">
          ¿Qué más influye en el precio real de tu auto?
        </h2>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-base leading-relaxed mb-6 text-center">
              El precio final de un auto seminuevo no solo depende del mercado y la negociación, sino también de:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Car className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Estado general</h4>
                  <p className="text-sm text-muted-foreground">
                    ¿Qué tan bien cuidado está por dentro y por fuera?
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Kilometraje</h4>
                  <p className="text-sm text-muted-foreground">
                    Menos kilómetros suelen significar un mejor precio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Historial</h4>
                  <p className="text-sm text-muted-foreground">
                    Si ha tenido reparaciones importantes o accidentes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Situación legal</h4>
                  <p className="text-sm text-muted-foreground">
                    Es crucial que todos los documentos estén en orden, sin multas ni adeudos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <DollarSign className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">El mercado (oferta y demanda)</h4>
                  <p className="text-sm text-muted-foreground">
                    Si tu modelo de auto es muy buscado o hay muchos similares en venta.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Tus condiciones como vendedor</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu urgencia o situación particular también pueden influir en qué tan flexible seas con el precio.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conclusion */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-lg text-center leading-relaxed mb-6">
            Esperamos que esto te ayude a entender mejor cómo se calcula el precio real de venta de un auto 
            y a tomar la mejor decisión para tu seguridad.
          </p>
          <div className="text-center">
            <Button asChild size="lg">
              <Link to="/valuacion">
                Consulta precios actuales
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}