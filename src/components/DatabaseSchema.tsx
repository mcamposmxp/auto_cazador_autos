import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Code2, ArrowRight } from "lucide-react";

export const DatabaseSchema = () => {
  const schemaFields = [
    { field: "id_anuncio", type: "PRIMARY KEY", description: "Identificador único del anuncio" },
    { field: "url_original", type: "TEXT", description: "URL completa del anuncio original" },
    { field: "plataforma", type: "VARCHAR(50)", description: "MercadoLibre, Facebook, Kavak, etc." },
    { field: "marca", type: "VARCHAR(100)", description: "Ford, Chevrolet, Nissan, etc." },
    { field: "modelo", type: "VARCHAR(100)", description: "Mustang, Aveo, Sentra, etc." },
    { field: "version", type: "VARCHAR(150)", description: "GT Premium, LTZ, Advance, etc." },
    { field: "anio", type: "INTEGER", description: "Año del vehículo" },
    { field: "kilometraje_inicial", type: "INTEGER", description: "Km al momento de publicación" },
    { field: "precio_inicial", type: "DECIMAL(12,2)", description: "Precio al momento de publicación" },
    { field: "estado_vehiculo", type: "VARCHAR(20)", description: "usado, nuevo, seminuevo" },
    { field: "ciudad", type: "VARCHAR(100)", description: "Ciudad donde se vende" },
    { field: "estado_republica", type: "VARCHAR(50)", description: "Estado de la República Mexicana" },
    { field: "descripcion", type: "TEXT", description: "Descripción completa del anuncio" },
    { field: "fecha_publicacion", type: "TIMESTAMP", description: "Fecha de primera detección" },
    { field: "fecha_ultima_actividad", type: "TIMESTAMP", description: "Última vez que se detectó activo" },
    { field: "status_anuncio", type: "VARCHAR(20)", description: "activo, inactivo, vendido, duplicado" },
    { field: "dias_publicado", type: "INTEGER", description: "Días desde la publicación" },
    { field: "contacto", type: "JSONB", description: "Teléfono, email si disponible" },
    { field: "urls_imagenes", type: "TEXT[]", description: "Array de URLs de imágenes" },
    { field: "num_imagenes", type: "INTEGER", description: "Cantidad total de imágenes" },
    { field: "tiene_video", type: "BOOLEAN", description: "Si incluye video" },
    { field: "tiene_financiamiento", type: "BOOLEAN", description: "Si ofrece financiamiento" },
    { field: "tiene_garantia", type: "BOOLEAN", description: "Si incluye garantía" },
    { field: "tipo_anunciante", type: "ENUM", description: "particular, agencia, lote, desconocido" }
  ];

  const sampleData = [
    {
      id_anuncio: "ML_2024_001",
      plataforma: "MercadoLibre",
      marca: "Nissan",
      modelo: "Sentra",
      version: "Advance CVT",
      anio: 2022,
      precio_inicial: 285000,
      estado_vehiculo: "seminuevo",
      ciudad: "Guadalajara",
      estado_republica: "Jalisco",
      status_anuncio: "activo",
      dias_publicado: 5,
      tipo_anunciante: "agencia"
    },
    {
      id_anuncio: "FB_2024_002",
      plataforma: "Facebook",
      marca: "Chevrolet",
      modelo: "Aveo",
      version: "LTZ",
      anio: 2020,
      precio_inicial: 195000,
      estado_vehiculo: "usado",
      ciudad: "CDMX",
      estado_republica: "Ciudad de México",
      status_anuncio: "activo",
      dias_publicado: 12,
      tipo_anunciante: "particular"
    },
    {
      id_anuncio: "KV_2024_003",
      plataforma: "Kavak",
      marca: "Ford",
      modelo: "Mustang",
      version: "GT Premium",
      anio: 2021,
      precio_inicial: 850000,
      estado_vehiculo: "seminuevo",
      ciudad: "Monterrey",
      estado_republica: "Nuevo León",
      status_anuncio: "duplicado",
      dias_publicado: 8,
      tipo_anunciante: "lote"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Esquema de Base de Datos</h2>
          <p className="text-muted-foreground">Estructura optimizada para extracción automotriz</p>
        </div>
      </div>

      {/* Esquema completo */}
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Tabla: anuncios_vehiculos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Campo</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemaFields.map((field, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {field.field}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {field.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {field.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Datos de ejemplo */}
      <Card className="bg-gradient-to-br from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-success" />
            Ejemplo de Datos Extraídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{item.id_anuncio}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.plataforma}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.marca} {item.modelo}</div>
                        <div className="text-xs text-muted-foreground">{item.version} ({item.anio})</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${item.precio_inicial.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{item.ciudad}</div>
                        <div className="text-xs text-muted-foreground">{item.estado_republica}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          item.status_anuncio === "activo" ? "default" :
                          item.status_anuncio === "duplicado" ? "destructive" : "secondary"
                        }
                      >
                        {item.status_anuncio}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.dias_publicado}d</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.tipo_anunciante}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Características especiales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-primary mb-2">Deduplicación Inteligente</h4>
            <p className="text-sm text-muted-foreground">
              Algoritmos para detectar el mismo vehículo en diferentes plataformas usando marca, modelo, año, precio y ubicación.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-accent mb-2">Tracking Temporal</h4>
            <p className="text-sm text-muted-foreground">
              Seguimiento automático de días publicados y detección de cambios de estado (activo/inactivo/vendido).
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-success mb-2">Datos Enriquecidos</h4>
            <p className="text-sm text-muted-foreground">
              Extracción de metadatos como financiamiento, garantía, tipo de anunciante y múltiples medios.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};