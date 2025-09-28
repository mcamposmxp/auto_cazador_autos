import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Heart, Eye, Phone, MessageCircle, Star, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


// Estados y ciudades de México
const estadosCiudades = {
  "Ciudad de México": ["Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán", "Cuauhtémoc"],
  "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
  "Nuevo León": ["Monterrey", "Guadalupe", "San Nicolás", "Escobedo", "Santa Catarina"],
  "Puebla": ["Puebla", "Tehuacán", "San Martín", "Atlixco", "Cholula"]
};

interface DatosVehiculo {
  marca: string;
  modelo: string;
  ano: string;
  version: string;
  kilometraje: string;
  estado: string;
  ciudad: string;
}

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
  }
];

export default function BuscarAutos() {
  const [formData, setFormData] = useState<DatosVehiculo>({
    marca: "",
    modelo: "",
    ano: "",
    version: "",
    kilometraje: "",
    estado: "",
    ciudad: ""
  });

  const [marcas, setMarcas] = useState<string[]>([
    "Toyota", "Honda", "Nissan", "Mazda", "Volkswagen", "Chevrolet", "Ford", "Hyundai", "Kia", "BMW"
  ]);
  const [modelos, setModelos] = useState<string[]>([]);
  const [anos, setAnos] = useState<string[]>([
    "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"
  ]);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const { toast } = useToast();

  const modelosPorMarca: Record<string, string[]> = {
    "Toyota": ["Corolla", "Camry", "Prius", "RAV4", "Highlander"],
    "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Fit"],
    "Nissan": ["Sentra", "Altima", "Versa", "X-Trail", "Kicks"],
    "Mazda": ["Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9"],
    "Volkswagen": ["Jetta", "Passat", "Golf", "Tiguan", "Atlas"],
    "Chevrolet": ["Aveo", "Cruze", "Malibu", "Equinox", "Tahoe"],
    "Ford": ["Focus", "Fusion", "Escape", "Explorer", "F-150"],
    "Hyundai": ["Accent", "Elantra", "Sonata", "Tucson", "Santa Fe"],
    "Kia": ["Rio", "Forte", "Optima", "Sportage", "Sorento"],
    "BMW": ["Serie 1", "Serie 3", "Serie 5", "X1", "X3"]
  };

  const cargarModelos = (marca: string) => {
    if (!marca) {
      setModelos([]);
      return;
    }
    
    const modelosDisponibles = modelosPorMarca[marca] || [];
    setModelos(modelosDisponibles);
  };

  useEffect(() => {
    if (formData.marca) {
      cargarModelos(formData.marca);
    }
  }, [formData.marca]);

  const manejarCambio = (campo: keyof DatosVehiculo, valor: string) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor,
      // Limpiar campos dependientes
      ...(campo === 'marca' ? { modelo: '', version: '' } : {}),
      ...(campo === 'estado' ? { ciudad: '' } : {})
    }));
  };

  const validarFormulario = (): boolean => {
    if (!formData.marca || !formData.modelo || !formData.ano) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa marca, modelo y año",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const manejarBusqueda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setCargando(true);
    
    // Simular búsqueda
    setTimeout(() => {
      setCargando(false);
      setMostrarResultados(true);
      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${autosEnVenta.length} autos disponibles`,
      });
    }, 2000);
  };

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

  if (mostrarResultados) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Autos Encontrados</h1>
          <p className="text-muted-foreground">
            Resultados para {formData.marca} {formData.modelo} {formData.ano}
          </p>
          <Button 
            variant="outline" 
            onClick={() => setMostrarResultados(false)}
            className="mt-4"
          >
            Nueva Búsqueda
          </Button>
        </div>

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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Buscar Autos en Venta</h1>
        <p className="text-muted-foreground">
          Encuentra el auto perfecto especificando las características que buscas
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Datos del Vehículo a Buscar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarBusqueda} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Marca *</label>
                <Select value={formData.marca} onValueChange={(value) => manejarCambio('marca', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map((marca) => (
                      <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Modelo *</label>
                <Select 
                  value={formData.modelo} 
                  onValueChange={(value) => manejarCambio('modelo', value)}
                  disabled={!formData.marca}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelos.map((modelo) => (
                      <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Año *</label>
                <Select value={formData.ano} onValueChange={(value) => manejarCambio('ano', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Versión</label>
                <Input
                  placeholder="Ej: Touring, LX, etc."
                  value={formData.version}
                  onChange={(e) => manejarCambio('version', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select value={formData.estado} onValueChange={(value) => manejarCambio('estado', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(estadosCiudades).map((estado) => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ciudad</label>
                <Select 
                  value={formData.ciudad} 
                  onValueChange={(value) => manejarCambio('ciudad', value)}
                  disabled={!formData.estado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.estado && estadosCiudades[formData.estado]?.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Kilometraje máximo</label>
              <Input
                type="number"
                placeholder="Ej: 50000"
                value={formData.kilometraje}
                onChange={(e) => manejarCambio('kilometraje', e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Autos
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}