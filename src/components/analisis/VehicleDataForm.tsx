import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car } from "@/utils/iconImports";

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
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="cdmx">Ciudad de México</SelectItem>
                <SelectItem value="guadalajara">Guadalajara</SelectItem>
                <SelectItem value="monterrey">Monterrey</SelectItem>
                <SelectItem value="otros">Otros estados</SelectItem>
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