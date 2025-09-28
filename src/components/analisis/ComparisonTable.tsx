import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, Search } from "@/utils/iconImports";

interface AutoSimilar {
  id: string;
  titulo: string;
  precio: number;
  kilometraje: number;
  ano: number;
  ubicacion: string;
  sitio_web: string;
  url_anuncio: string;
}

interface ComparisonTableProps {
  autosSimilares: AutoSimilar[];
  mostrarRangosDetallados: boolean;
  onToggleRangos: () => void;
  formatearPrecio: (precio: number) => string;
}

export const ComparisonTable = memo(function ComparisonTable({
  autosSimilares,
  mostrarRangosDetallados,
  onToggleRangos,
  formatearPrecio
}: ComparisonTableProps) {

  const autosMostrar = mostrarRangosDetallados ? autosSimilares : autosSimilares.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Autos similares en venta ({autosSimilares.length})
          </CardTitle>
          {autosSimilares.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleRangos}
            >
              {mostrarRangosDetallados ? "Ver menos" : "Ver todos"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {autosSimilares.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron vehículos similares.</p>
            <p className="text-sm">Intenta buscar con diferentes criterios o verifica la conectividad.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Kilometraje</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Sitio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autosMostrar.map((auto, index) => (
                  <TableRow key={auto.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {auto.titulo}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {auto.ano}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatearPrecio(auto.precio)}
                    </TableCell>
                    <TableCell className="text-right">
                      {auto.kilometraje ? auto.kilometraje.toLocaleString() + " km" : "No especificado"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {auto.ubicacion || "No especificada"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {auto.sitio_web}
                        </Badge>
                        <a
                          href={auto.url_anuncio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          Ver anuncio
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});