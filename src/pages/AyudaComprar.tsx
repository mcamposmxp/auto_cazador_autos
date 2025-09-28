import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Shield, 
  DollarSign, 
  FileText,
  Clock,
  MapPin,
  MessageCircle
} from "lucide-react";

export default function AyudaComprar() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Ayuda para Comprar Auto</h1>
        <p className="text-muted-foreground">Guía completa para una compra segura e inteligente</p>
      </div>

      {/* Pasos para comprar */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Pasos para una compra exitosa</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Car,
              title: "Define el auto ideal",
              content: "Piensa en tu estilo de vida y necesidades reales. ¿Para qué lo necesitas? ¿Cuántos pasajeros acomodarás? ¿Qué tan importante es el rendimiento de combustible?"
            },
            {
              icon: DollarSign,
              title: "Define tu presupuesto",
              content: "Considera el costo total: precio del auto, seguro, trámites y mantenimiento inicial. Si es con financiamiento, calcula el costo total del crédito, no solo las mensualidades."
            },
            {
              icon: MapPin,
              title: "Busca y compara opciones",
              content: "Empieza con familiares y amigos para mayor seguridad. Explora medios digitales: sitios de clasificados, grupos especializados y subastas."
            },
            {
              icon: CheckCircle,
              title: "Evalúa candidatos",
              content: "Haz preguntas clave: razón de venta, historial de accidentes, dueños anteriores, registros de servicio y problemas conocidos."
            },
            {
              icon: Shield,
              title: "Revisión técnica profesional",
              content: "Contrata un experto para revisar motor, transmisión, suspensión, frenos y electrónica. No es un gasto, es una inversión que evita problemas futuros."
            },
            {
              icon: Clock,
              title: "Prueba de manejo consciente",
              content: "Va más allá de dar una vuelta. Revisa comodidad, escucha ruidos, frena de golpe, sube pendientes y conduce en terreno irregular."
            },
            {
              icon: FileText,
              title: "Revisa documentación",
              content: "Verifica factura original y secuencia, tenencias, tarjeta de circulación, verificaciones. Coteja serie y motor con documentos. Usa bases de datos oficiales para confirmar que no tenga reportes de robo, adeudos o créditos vigentes."
            },
            {
              icon: DollarSign,
              title: "Cierra la compra segura",
              content: "Elabora contrato de compraventa, usa transferencia o cheque de caja, recibe todos los documentos y una copia de la identificación del vendedor."
            }
          ].map((step, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Señales de alerta */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Señales de alerta</h2>
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ten cuidado con estos puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Precios muy por debajo del mercado</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Vendedor que pide anticipo para mostrar el auto</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Auto con un solo juego de llaves</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Facturas de aseguradora (posible accidente grave)</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Presión excesiva para cerrar la venta rápido</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Negativa a permitir inspección mecánica</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Citas en lugares poco concurridos o peligrosos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Checklist de documentos */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Checklist de documentos</h2>
        <Card>
          <CardHeader>
            <CardTitle>Documentos imprescindibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Documentos del vehículo</h4>
                {[
                  "Factura original y secuencia de facturas",
                  "Comprobantes de pago de tenencias",
                  "Tarjeta de circulación vigente",
                  "Verificación vehicular al corriente",
                  "Manual del propietario y carnet de servicios"
                ].map((doc, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{doc}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Documentos del vendedor</h4>
                {[
                  "Identificación oficial vigente",
                  "Comprobante de domicilio"
                ].map((doc, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Consejo final */}
      <section>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Consejo profesional</h3>
                <p className="text-muted-foreground">
                  No te apresures en la decisión. Un auto es una inversión importante. 
                  Tómate el tiempo necesario para investigar, comparar y verificar. 
                  Una buena compra puede ahorrarte miles de pesos en problemas futuros.
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    Conoce precios de mercado
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Ayuda de expertos */}
      <section>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  ¿Te parece complicado todo este proceso?
                </h3>
                <p className="text-muted-foreground text-base mb-4">
                  Puedes solicitar ayuda de un experto. Nosotros nos encargamos de todo el proceso para evitarte problemas y asegurar una compra exitosa.
                </p>
                <Button asChild>
                  <Link to="/contacto-experto">
                    Obtén más información
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}