import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car } from "@/utils/iconImports";

// Estados mexicanos
const ESTADOS_MEXICO = [
  { locationId: "STS01", name: "Aguascalientes" },
  { locationId: "STS02", name: "Baja California" },
  { locationId: "STS03", name: "Baja California Sur" },
  { locationId: "STS04", name: "Campeche" },
  { locationId: "STS07", name: "Chiapas" },
  { locationId: "STS08", name: "Chihuahua" },
  { locationId: "STS09", name: "Ciudad de México" },
  { locationId: "STS05", name: "Coahuila" },
  { locationId: "STS06", name: "Colima" },
  { locationId: "STS10", name: "Durango" },
  { locationId: "STS11", name: "Guanajuato" },
  { locationId: "STS12", name: "Guerrero" },
  { locationId: "STS13", name: "Hidalgo" },
  { locationId: "STS14", name: "Jalisco" },
  { locationId: "STS16", name: "Michoacán" },
  { locationId: "STS17", name: "Morelos" },
  { locationId: "STS15", name: "México" },
  { locationId: "STS18", name: "Nayarit" },
  { locationId: "STS19", name: "Nuevo León" },
  { locationId: "STS20", name: "Oaxaca" },
  { locationId: "STS21", name: "Puebla" },
  { locationId: "STS22", name: "Querétaro" },
  { locationId: "STS23", name: "Quintana Roo" },
  { locationId: "STS24", name: "San Luis Potosí" },
  { locationId: "STS25", name: "Sinaloa" },
  { locationId: "STS26", name: "Sonora" },
  { locationId: "STS27", name: "Tabasco" },
  { locationId: "STS28", name: "Tamaulipas" },
  { locationId: "STS29", name: "Tlaxcala" },
  { locationId: "STS30", name: "Veracruz" },
  { locationId: "STS31", name: "Yucatán" },
  { locationId: "STS32", name: "Zacatecas" }
];

interface VehicleDataFormProps {
  precioSeleccionado: number;
  kilometrajeSeleccionado: number;
  estadoSeleccionado: string;
  tipoVendedorSeleccionado: string;
  estadisticas: {
    precioMinimo: number;
    precioMaximo: number;
  };
  estadisticasKilometraje: {
    minimo: number;
    maximo: number;
  };
  onPrecioChange: (precio: number) => void;
  onKilometrajeChange: (km: number) => void;
  onEstadoChange: (estado: string) => void;
  onTipoVendedorChange: (tipo: string) => void;
  formatearPrecio: (precio: number) => string;
}

export const VehicleDataForm = memo(function VehicleDataForm({
  precioSeleccionado,
  kilometrajeSeleccionado,
  estadoSeleccionado,
  tipoVendedorSeleccionado,
  estadisticas,
  estadisticasKilometraje,
  onPrecioChange,
  onKilometrajeChange,
  onEstadoChange,
  onTipoVendedorChange,
  formatearPrecio
}: VehicleDataFormProps) {
  
  const handlePrecioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''));
    if (!isNaN(value)) {
      onPrecioChange(value);
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5" />
          Configurar análisis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Precio de venta objetivo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Precio de venta objetivo</Label>
          <Input
            type="text"
            value={formatearPrecio(precioSeleccionado)}
            onChange={handlePrecioInputChange}
            className="text-lg font-semibold"
          />
          <Slider
            value={[precioSeleccionado]}
            onValueChange={(value) => onPrecioChange(value[0])}
            max={Math.max(estadisticas.precioMaximo * 1.2, 100000)} // Mínimo 100k para evitar sliders rotos
            min={Math.max(estadisticas.precioMinimo * 0.8, 1000)} // Mínimo 1k
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatearPrecio(Math.max(estadisticas.precioMinimo * 0.8, 1000))}</span>
            <span>{formatearPrecio(Math.max(estadisticas.precioMaximo * 1.2, 100000))}</span>
          </div>
        </div>

        {/* Kilometraje */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Kilometraje actual</Label>
          <Input
            type="number"
            value={kilometrajeSeleccionado}
            onChange={(e) => onKilometrajeChange(parseInt(e.target.value) || 0)}
            className="text-lg"
            placeholder="Ej: 50000"
          />
          <Slider
            value={[kilometrajeSeleccionado]}
            onValueChange={(value) => onKilometrajeChange(value[0])}
            max={estadisticasKilometraje.maximo * 1.5}
            min={0}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 km</span>
            <span>{estadisticasKilometraje.maximo.toLocaleString()} km</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado</Label>
            <Select value={estadoSeleccionado} onValueChange={onEstadoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 z-50">
                <SelectItem value="ALL">Todo el país</SelectItem>
                {ESTADOS_MEXICO.map((estado) => (
                  <SelectItem key={estado.locationId} value={estado.locationId}>
                    {estado.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de vendedor</Label>
            <Select value={tipoVendedorSeleccionado} onValueChange={onTipoVendedorChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="agencia">Agencias</SelectItem>
                <SelectItem value="particular">Particulares</SelectItem>
                <SelectItem value="seminuevos">Seminuevos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});