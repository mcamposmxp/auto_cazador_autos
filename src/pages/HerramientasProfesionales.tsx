import { ProfessionalTools } from "@/components/ProfessionalTools";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function HerramientasProfesionales() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Panel Profesional
          </h1>
          <p className="text-muted-foreground">
            Herramientas avanzadas para gestionar tu negocio automotriz
          </p>
        </div>

        {/* Herramientas profesionales */}
        <ProfessionalTools />
      </div>
    </div>
  );
}