import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Calculator, 
  TrendingUp, 
  Shield, 
  Users, 
  Zap,
  ArrowRight,
  Star,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const features = [
    {
      icon: Calculator,
      title: "Precio Inteligente",
      description: "IA que analiza miles de anuncios para darte información real del mercado y una venta segura",
      color: "bg-primary/20 text-primary"
    },
    {
      icon: Shield,
      title: "Servicio Trust",
      description: "Transacciones 100% seguras con verificación legal y mecánica",
      color: "bg-accent/20 text-accent"
    },
    {
      icon: TrendingUp,
      title: "Tendencias de Mercado",
      description: "Ve cómo han cambiado los precios y predice el mejor momento para vender",
      color: "bg-success/20 text-success"
    },
    {
      icon: Users,
      title: "Red de Profesionales",
      description: "Conecta con agencias y lotes verificados para venta rápida",
      color: "bg-warning/20 text-warning"
    }
  ];

  const stats = [
    { number: "500K+", label: "Autos Valuados" },
    { number: "98%", label: "Precisión en Precios" },
    { number: "15 días", label: "Tiempo promedio de venta nacional" },
    { number: "2,000+", label: "Profesionales Activos" }
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      role: "Vendedor Particular",
      content: "Vendí mi auto en 8 días al precio recomendado. El servicio Trust me dio total seguridad.",
      rating: 5
    },
    {
      name: "Agencia Premium Motors",
      role: "Concesionario",
      content: "Aumentamos nuestra rotación 40% usando las recomendaciones de precio inteligente.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <Badge variant="secondary" className="mb-4">
          🚀 La plataforma #1 de valuación automotriz
        </Badge>
        
        <h1 className="text-5xl font-bold text-foreground mb-6 max-w-4xl mx-auto leading-tight">
          Conoce el <span className="text-primary">precio de mercado</span> de tu auto con Inteligencia Artificial
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Más de 500,000 autos valuados con 98% de precisión. Vende más rápido, compra mejor.
        </p>
        
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Todo lo que necesitas para vender o comprar tu auto
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Herramientas inteligentes que hacen que comprar y vender autos sea más fácil, rápido y seguro.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Cómo funciona
            </h2>
            <p className="text-muted-foreground">
              3 pasos simples para obtener el precio de tu auto
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-primary-foreground text-lg font-bold">
                1
              </div>
              <h3 className="text-base font-semibold mb-2">Ingresa los datos</h3>
              <p className="text-sm text-muted-foreground">Marca, modelo, año, kilometraje y ubicación</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-primary-foreground text-lg font-bold">
                2
              </div>
              <h3 className="text-base font-semibold mb-2">IA analiza el mercado</h3>
              <p className="text-sm text-muted-foreground">Comparamos con miles de anuncios similares</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-primary-foreground text-lg font-bold">
                3
              </div>
              <h3 className="text-base font-semibold mb-2">Recibe tu precio</h3>
              <p className="text-sm text-muted-foreground">Precio exacto + tiempo estimado de venta</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main CTA Section */}
      <section className="py-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para conocer el precio exacto de tu auto?
          </h2>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            Únete a más de 500,000 usuarios que ya confían en nuestra plataforma de valuación inteligente
          </p>
          
          <Button asChild size="lg" variant="secondary" className="text-xl px-12 py-6 h-auto shadow-xl mb-6">
            <Link to="/valuacion">
              <Calculator className="mr-3 h-6 w-6" />
              Valuar mi Auto Gratis
            </Link>
          </Button>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Sin registro requerido
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resultado inmediato
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              100% gratis
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-6 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Lo que dicen nuestros usuarios
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}