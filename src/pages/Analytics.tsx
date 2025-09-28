import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralMarketAnalysis } from "@/components/analytics/GeneralMarketAnalysis";
import { SpecificModelAnalysis } from "@/components/analytics/SpecificModelAnalysis";
import { SalesPatterns } from "@/components/analytics/SalesPatterns";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PerformanceMonitor } from "@/components/shared/PerformanceMonitor";

export default function Analytics() {
  const [generalFilters, setGeneralFilters] = useState({
    ubicacion: "Todo el país",
    periodo: "6m"
  });

  const [specificFilters, setSpecificFilters] = useState({
    marca: "",
    modelo: "",
    ano: "2024",
    version: "Todas",
    ubicacion: "Todo el país"
  });

  // Mantener los filtros antiguos para SalesPatterns
  const salesFilters = {
    marca: "all",
    modelo: "all",
    ano: "all",
    ciudad: "all",
    periodo: "6"
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Análisis de Mercado y Tendencias
            </h1>
            <p className="text-muted-foreground">
              Insights completos del mercado automotriz
            </p>
          </div>
        </div>

        {/* Tabs separadas para cada sección */}
        <ErrorBoundary>
          <PerformanceMonitor componentName="Analytics">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-primary/5 border border-primary/20">
                <TabsTrigger value="general" className="text-sm font-medium">
                  📊 Mercado General
                </TabsTrigger>
                <TabsTrigger value="specific" className="text-sm font-medium">
                  🎯 Modelo Específico
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                <ErrorBoundary>
                  <GeneralMarketAnalysis 
                    filters={generalFilters} 
                    onFiltersChange={setGeneralFilters} 
                  />
                </ErrorBoundary>
              </TabsContent>
              
              <TabsContent value="specific" className="space-y-6">
                <ErrorBoundary>
                  <SpecificModelAnalysis 
                    filters={specificFilters} 
                    onFiltersChange={setSpecificFilters} 
                  />
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          </PerformanceMonitor>
        </ErrorBoundary>
      </div>
    </div>
  );
}