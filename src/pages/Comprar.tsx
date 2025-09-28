import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Heart,
  Eye,
  Phone,
  MessageCircle,
  Star,
  ExternalLink,
  SlidersHorizontal
} from "lucide-react";

// Datos simulados de autos en venta
const autosEnVenta = [
  {
    id: 1,
    titulo: "Honda Civic Touring 2019",
    precio: 385000,
    año: 2019,
    kilometraje: 45000,
    ubicacion: "Ciudad de México, CDMX",
    tipo_anunciante: "Particular",
    imagenes: ["https://images.unsplash.com/photo-1549399736-f79b4aa851f3?w=400"],
    plataforma: "MercadoLibre",
    dias_publicado: 5,
    vistas: 234,
    contactos: 12,
    rating_vendedor: 4.8,
    url_original: "https://mercadolibre.com.mx/...",
    caracteristicas: ["Automático", "A/C", "Bluetooth", "Cámara Reversa"]
  },
  {
    id: 2,
    titulo: "Toyota Corolla Cross LE 2020",
    precio: 340000,
    año: 2020,
    kilometraje: 32000,
    ubicacion: "Guadalajara, JAL",
    tipo_anunciante: "Agencia",
    imagenes: ["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400"],
    plataforma: "Seminuevos.com",
    dias_publicado: 2,
    vistas: 156,
    contactos: 8,
    rating_vendedor: 4.9,
    url_original: "https://seminuevos.com/...",
    caracteristicas: ["CVT", "Apple CarPlay", "Sensores", "LED"]
  },
  {
    id: 3,
    titulo: "Nissan Versa Advance 2021",
    precio: 280000,
    año: 2021,
    kilometraje: 28000,
    ubicacion: "Monterrey, NL",
    tipo_anunciante: "Lote",
    imagenes: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400"],
    plataforma: "Facebook Marketplace",
    dias_publicado: 8,
    vistas: 89,
    contactos: 5,
    rating_vendedor: 4.5,
    url_original: "https://facebook.com/marketplace/...",
    caracteristicas: ["Manual", "A/C", "Bluetooth", "USB"]
  },
  {
    id: 4,
    titulo: "Mazda CX-5 i Grand Touring 2018",
    precio: 420000,
    año: 2018,
    kilometraje: 68000,
    ubicacion: "Puebla, PUE",
    tipo_anunciante: "Particular",
    imagenes: ["https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400"],
    plataforma: "OLX Autos",
    dias_publicado: 12,
    vistas: 312,
    contactos: 18,
    rating_vendedor: 4.6,
    url_original: "https://olx.com.mx/...",
    caracteristicas: ["AWD", "Piel", "Sunroof", "Bose Audio"]
  }
];

export default function Comprar() {
  const [filtros, setFiltros] = useState({
    busqueda: "",
    marca: "",
    modelo: "",
    año_min: 2015,
    año_max: 2024,
    precio_min: 100000,
    precio_max: 1000000,
    km_max: 200000,
    ubicacion: "",
    tipo_anunciante: ""
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const formatearKilometraje = (km: number) => {
    return new Intl.NumberFormat('es-MX').format(km) + ' km';
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Particular': return 'bg-blue-100 text-blue-700';
      case 'Agencia': return 'bg-green-100 text-green-700';
      case 'Lote': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Autos en Venta</h1>
        <p className="text-muted-foreground">
          Encuentra el auto perfecto entre miles de anuncios verificados
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo o palabras clave..."
                className="pl-10"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
              
              <Select value={filtros.tipo_anunciante} onValueChange={(value) => setFiltros({...filtros, tipo_anunciante: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Particular">Particulares</SelectItem>
                  <SelectItem value="Agencia">Agencias</SelectItem>
                  <SelectItem value="Lote">Lotes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros expandibles */}
          {mostrarFiltros && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Año</label>
                  <div className="space-y-2">
                    <Slider
                      value={[filtros.año_min, filtros.año_max]}
                      onValueChange={([min, max]) => setFiltros({...filtros, año_min: min, año_max: max})}
                      min={2010}
                      max={2024}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{filtros.año_min}</span>
                      <span>{filtros.año_max}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Precio</label>
                  <div className="space-y-2">
                    <Slider
                      value={[filtros.precio_min, filtros.precio_max]}
                      onValueChange={([min, max]) => setFiltros({...filtros, precio_min: min, precio_max: max})}
                      min={50000}
                      max={1500000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatearPrecio(filtros.precio_min)}</span>
                      <span>{formatearPrecio(filtros.precio_max)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Máx. Kilometraje</label>
                  <div className="space-y-2">
                    <Slider
                      value={[filtros.km_max]}
                      onValueChange={([max]) => setFiltros({...filtros, km_max: max})}
                      min={10000}
                      max={300000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground text-center">
                      {formatearKilometraje(filtros.km_max)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ubicación</label>
                  <Select value={filtros.ubicacion} onValueChange={(value) => setFiltros({...filtros, ubicacion: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las ciudades</SelectItem>
                      <SelectItem value="cdmx">Ciudad de México</SelectItem>
                      <SelectItem value="guadalajara">Guadalajara</SelectItem>
                      <SelectItem value="monterrey">Monterrey</SelectItem>
                      <SelectItem value="puebla">Puebla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {autosEnVenta.map((auto) => (
          <Card key={auto.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              <div className="relative">
                <img 
                  src={auto.imagenes[0]} 
                  alt={auto.titulo}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-3 left-3">
                  <Badge className={getBadgeColor(auto.tipo_anunciante)}>
                    {auto.tipo_anunciante}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    {auto.plataforma}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">{auto.titulo}</h3>
                  <div className="text-2xl font-bold text-primary">
                    {formatearPrecio(auto.precio)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Año: <span className="font-medium text-foreground">{auto.año}</span></div>
                  <div>KM: <span className="font-medium text-foreground">{formatearKilometraje(auto.kilometraje)}</span></div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {auto.ubicacion}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {auto.vistas}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {auto.contactos}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {auto.dias_publicado}d
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {auto.rating_vendedor}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {auto.caracteristicas.slice(0, 3).map((caracteristica, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {caracteristica}
                    </Badge>
                  ))}
                  {auto.caracteristicas.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{auto.caracteristicas.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Contactar
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={auto.url_original} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      <div className="mt-8 flex justify-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Anterior</Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Siguiente</Button>
        </div>
      </div>
    </div>
  );
}