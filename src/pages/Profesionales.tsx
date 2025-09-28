import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Star, MapPin, Phone, MessageCircle, TrendingUp } from "lucide-react";

export default function Profesionales() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Red de Profesionales</h1>
        <p className="text-muted-foreground">Conecta con agencias y lotes verificados</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Agencia Premium {i}</h3>
                <div className="flex items-center justify-center gap-1 my-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>4.8</span>
                </div>
                <Badge variant="outline">150 ventas</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}