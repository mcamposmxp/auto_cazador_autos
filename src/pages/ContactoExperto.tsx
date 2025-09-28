import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Car,
  CheckCircle
} from "lucide-react";

export default function ContactoExperto() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    ciudad: "",
    presupuesto: "",
    tipoAuto: "",
    urgencia: "",
    mensaje: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí iría la lógica para enviar los datos
    toast({
      title: "Solicitud enviada",
      description: "Un experto se pondrá en contacto contigo en las próximas 24 horas.",
    });
    
    // Reset form
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      ciudad: "",
      presupuesto: "",
      tipoAuto: "",
      urgencia: "",
      mensaje: ""
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Solicita Ayuda de un Experto</h1>
        <p className="text-muted-foreground">
          Completa el formulario y un especialista te contactará para guiarte en tu compra de auto
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Información de contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nombre"
                        placeholder="Tu nombre completo"
                        value={formData.nombre}
                        onChange={(e) => handleChange("nombre", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefono"
                        placeholder="55 1234 5678"
                        value={formData.telefono}
                        onChange={(e) => handleChange("telefono", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ciudad"
                        placeholder="Ciudad donde buscas el auto"
                        value={formData.ciudad}
                        onChange={(e) => handleChange("ciudad", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Detalles de tu búsqueda
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="presupuesto">Presupuesto aproximado</Label>
                      <Select value={formData.presupuesto} onValueChange={(value) => handleChange("presupuesto", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu presupuesto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50-100k">$50,000 - $100,000</SelectItem>
                          <SelectItem value="100-200k">$100,000 - $200,000</SelectItem>
                          <SelectItem value="200-300k">$200,000 - $300,000</SelectItem>
                          <SelectItem value="300-500k">$300,000 - $500,000</SelectItem>
                          <SelectItem value="500k+">$500,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tipoAuto">Tipo de auto que buscas</Label>
                      <Select value={formData.tipoAuto} onValueChange={(value) => handleChange("tipoAuto", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de vehículo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedan">Sedán</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="hatchback">Hatchback</SelectItem>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="coupe">Coupé</SelectItem>
                          <SelectItem value="convertible">Convertible</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgencia">¿Qué tan urgente es tu compra?</Label>
                    <Select value={formData.urgencia} onValueChange={(value) => handleChange("urgencia", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tiempo disponible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inmediato">Necesito comprar esta semana</SelectItem>
                        <SelectItem value="pronto">En las próximas 2-4 semanas</SelectItem>
                        <SelectItem value="mes">En el próximo mes</SelectItem>
                        <SelectItem value="flexible">No tengo prisa, quiero la mejor opción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje">Cuéntanos más sobre lo que necesitas</Label>
                    <Textarea
                      id="mensaje"
                      placeholder="Compártenos detalles específicos: marcas preferidas, características importantes, dudas particulares, etc."
                      value={formData.mensaje}
                      onChange={(e) => handleChange("mensaje", e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Solicitar contacto de experto
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">¿Qué incluye nuestro servicio?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Búsqueda personalizada según tus necesidades",
                "Verificación completa de documentos",
                "Inspección técnica profesional",
                "Negociación del mejor precio",
                "Acompañamiento en todo el proceso",
                "Garantía de compra segura"
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tiempo de respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Un experto se pondrá en contacto contigo en las próximas <strong>24 horas</strong> 
                para agendar una consulta personalizada y comenzar la búsqueda de tu auto ideal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}