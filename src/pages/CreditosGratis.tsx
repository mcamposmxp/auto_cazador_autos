import { Gift, Users, Star, CreditCard, Award, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReferralSystem } from "@/components/ReferralSystem";
import { useNavigate } from "react-router-dom";

export default function CreditosGratis() {
  const navigate = useNavigate();

  const creditMethods = [
    {
      icon: Users,
      title: "Invita a tus amigos",
      description: "Gana 5 créditos por cada amigo que se registre con tu código",
      color: "bg-blue-500",
      credits: "5 créditos",
      limit: "Hasta 5 referidos por mes"
    },
    {
      icon: Star,
      title: "Evalúa profesionales",
      description: "Califica tu experiencia después de interactuar con profesionales",
      color: "bg-green-500",
      credits: "2 créditos",
      limit: "Sin límite mensual"
    },
    {
      icon: Award,
      title: "Completa tu perfil",
      description: "Obtén créditos bonus al completar tu información de perfil",
      color: "bg-purple-500",
      credits: "3 créditos",
      limit: "Una sola vez"
    }
  ];

  const benefits = [
    "Análisis ilimitados de precios de mercado",
    "Acceso a información de contacto de vendedores",
    "Estadísticas avanzadas de mercado",
    "Recomendaciones personalizadas de IA",
    "Alertas de oportunidades de compra"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            ¡Gana Créditos Gratis!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubre múltiples formas de obtener créditos gratuitos y accede a todas las funciones premium de nuestra plataforma
          </p>
        </div>

        {/* Methods to earn credits */}
        <div className="grid md:grid-cols-3 gap-6">
          {creditMethods.map((method, index) => (
            <Card key={index} className="relative overflow-hidden border-2 hover:border-primary/20 transition-all duration-300">
              <div className={`absolute top-0 left-0 w-full h-1 ${method.color}`} />
              <CardHeader className="text-center">
                <div className="mx-auto p-3 bg-muted rounded-lg w-fit">
                  <method.icon className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-lg">{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {method.credits}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{method.limit}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral System */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Sistema de Referidos
            </CardTitle>
            <CardDescription>
              Invita a tus amigos y gana créditos cuando se registren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferralSystem />
          </CardContent>
        </Card>

        {/* Benefits section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              ¿Qué puedes hacer con tus créditos?
            </CardTitle>
            <CardDescription>
              Cada crédito te da acceso a funciones premium de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold mb-2">¿Necesitas más créditos?</h3>
                <p className="text-muted-foreground">
                  Obtén créditos ilimitados con nuestros planes premium
                </p>
              </div>
              <Button 
                onClick={() => navigate('/planes')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Ver Planes Premium
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">¿Los créditos gratis expiran?</h4>
              <p className="text-sm text-muted-foreground">
                Sí, los créditos gratuitos expiran a los 30 días de haber sido otorgados. Te recomendamos usarlos antes de que caduquen.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">¿Cuánto tiempo tarda en procesarse un referido?</h4>
              <p className="text-sm text-muted-foreground">
                Los créditos por referidos se otorgan inmediatamente cuando tu amigo complete su registro y primera acción.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">¿Puedo combinar créditos gratis con planes premium?</h4>
              <p className="text-sm text-muted-foreground">
                Sí, los créditos gratis se suman a tu cuenta y puedes usarlos junto con cualquier plan premium.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}