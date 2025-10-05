import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Search, Car, Check, ChevronsUpDown } from "@/utils/iconImports";
import { useAuthSession } from "@/hooks/useAuthSession";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCreditControl } from "@/hooks/useCreditControl";
import AuthModal from "@/components/AuthModal";
import { NoCreditsDialog } from "@/components/NoCreditsDialog";

interface DatosVehiculo {
  marca: string;
  modelo: string;
  ano: number;
  version: string;
  versionId?: string;
  kilometraje: number;
  estado: string;
  estadoId?: string;
  ciudad: string;
}

interface FormularioValuacionProps {
  onEnviar: (datos: DatosVehiculo) => void;
}

interface CatalogItem {
  id: string;
  name: string;
  action: string;
}

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

export function FormularioValuacion({ onEnviar }: FormularioValuacionProps) {
  const [marcas, setMarcas] = useState<CatalogItem[]>([]);
  const [modelos, setModelos] = useState<CatalogItem[]>([]);
  const [anos, setAnos] = useState<CatalogItem[]>([]);
  const [versiones, setVersiones] = useState<CatalogItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [cargandoAnos, setCargandoAnos] = useState(false);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [abrirMarcas, setAbrirMarcas] = useState(false);
  const [abrirModelos, setAbrirModelos] = useState(false);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const { user: usuario } = useAuthSession();
  const { toast } = useToast();
  const { checkCredits, consumeCredits, showUpgradeDialog, setShowUpgradeDialog } = useCreditControl();

  const [formData, setFormData] = useState({
    marca: "",
    marcaId: "",
    modelo: "",
    modeloId: "",
    ano: "",
    anoId: "",
    version: "",
    versionId: "",
    estado: "",
    estadoId: ""
  });

  // Cargar marcas al montar el componente
  useEffect(() => {
    cargarMarcas();
  }, []);

  const cargarMarcas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: null }
      });

      if (error) {
        throw error;
      }

      if (data?.children) {
        setMarcas(data.children);
        return data.children;
      }
      
      return [];
    } catch (error) {
      console.error('Error cargando marcas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las marcas.",
        variant: "destructive"
      });
      return [];
    } finally {
      setCargando(false);
    }
  };

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (formData.marcaId) {
      cargarModelos(formData.marcaId);
    } else {
      setModelos([]);
      setAnos([]);
      setVersiones([]);
    }
  }, [formData.marcaId]);

  // Cargar años cuando cambia el modelo
  useEffect(() => {
    if (formData.modeloId) {
      cargarAnos(formData.modeloId);
    } else {
      setAnos([]);
      setVersiones([]);
    }
  }, [formData.modeloId]);

  // Cargar versiones cuando cambia el año
  useEffect(() => {
    if (formData.anoId) {
      cargarVersiones(formData.anoId);
    } else {
      setVersiones([]);
    }
  }, [formData.anoId]);

  const cargarModelos = async (marcaId: string) => {
    try {
      setCargandoModelos(true);
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: marcaId }
      });

      if (error) {
        throw error;
      }

      if (data?.children) {
        setModelos(data.children);
      }
    } catch (error) {
      console.error('Error cargando modelos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los modelos.",
        variant: "destructive"
      });
    } finally {
      setCargandoModelos(false);
    }
  };

  const cargarAnos = async (modeloId: string) => {
    try {
      setCargandoAnos(true);
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: modeloId }
      });

      if (error) {
        throw error;
      }

      if (data?.children) {
        setAnos(data.children);
      }
    } catch (error) {
      console.error('Error cargando años:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los años.",
        variant: "destructive"
      });
    } finally {
      setCargandoAnos(false);
    }
  };

  const cargarVersiones = async (anoId: string) => {
    try {
      setCargandoVersiones(true);
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: anoId }
      });

      if (error) {
        throw error;
      }

      if (data?.children) {
        setVersiones(data.children);
      }
    } catch (error) {
      console.error('Error cargando versiones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las versiones.",
        variant: "destructive"
      });
    } finally {
      setCargandoVersiones(false);
    }
  };

  const manejarCambioMarca = (marcaId: string) => {
    const marca = marcas.find(m => m.id === marcaId);
    setFormData(prev => ({
      ...prev,
      marca: marca?.name || "",
      marcaId: marcaId,
      modelo: "",
      modeloId: "",
      ano: "",
      anoId: "",
      version: "",
      versionId: ""
    }));
  };

  const manejarCambioModelo = (modeloId: string) => {
    const modelo = modelos.find(m => m.id === modeloId);
    setFormData(prev => ({
      ...prev,
      modelo: modelo?.name || "",
      modeloId: modeloId,
      ano: "",
      anoId: "",
      version: "",
      versionId: ""
    }));
  };

  const manejarCambioAno = (anoId: string) => {
    const ano = anos.find(a => a.id === anoId);
    setFormData(prev => ({
      ...prev,
      ano: ano?.name || "",
      anoId: anoId,
      version: "",
      versionId: ""
    }));
  };

  const manejarCambioVersion = (versionId: string) => {
    const version = versiones.find(v => v.id === versionId);
    setFormData(prev => ({
      ...prev,
      version: version?.name || "",
      versionId: versionId
    }));
  };

  const manejarCambioEstado = (estadoId: string) => {
    const estado = ESTADOS_MEXICO.find(e => e.locationId === estadoId);
    setFormData(prev => ({
      ...prev,
      estado: estado?.name || "",
      estadoId: estadoId
    }));
  };

  const validarFormulario = () => {
    const errores = [];
    
    if (!formData.marca) errores.push("Marca");
    if (!formData.modelo) errores.push("Modelo");
    if (!formData.ano) errores.push("Año");

    if (errores.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Por favor completa: ${errores.join(", ")}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    // Check authentication first
    if (!usuario) {
      setMostrarAuth(true);
      return;
    }

    // Check credits before proceeding
    const hasCredits = await checkCredits();
    if (!hasCredits) {
      return;
    }

    setCargando(true);

    try {
      // Consume credits for price analysis
      const creditConsumed = await consumeCredits(1, 'price_analysis', 'search', {
        marca: formData.marca,
        modelo: formData.modelo,
        ano: formData.ano
      });

      if (!creditConsumed) {
        return;
      }

      const datos: DatosVehiculo = {
        marca: formData.marca,
        modelo: formData.modelo,
        ano: parseInt(formData.ano) || new Date().getFullYear(),
        version: formData.version || "Estándar",
        versionId: formData.versionId || undefined,
        kilometraje: 0, // Valor por defecto
        estado: formData.estado || "Nacional",
        estadoId: formData.estadoId || undefined,
        ciudad: "Nacional" // Valor por defecto
      };

      onEnviar(datos);

      toast({
        title: "Análisis iniciado",
        description: "Procesando los datos de tu vehículo...",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  };

  const manejarExitoAuth = () => {
    setMostrarAuth(false);
    toast({
      title: "¡Bienvenido!",
      description: "Ahora puedes realizar consultas de precios.",
    });
  };

  return (
    <>
      <AuthModal 
        isOpen={mostrarAuth} 
        onClose={() => setMostrarAuth(false)}
        onSuccess={manejarExitoAuth}
      />
      <Card className="max-w-2xl mx-auto shadow-xl border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Car className="h-6 w-6" />
            Datos de tu vehículo
          </CardTitle>
          <p className="text-muted-foreground">
            Ingresa la información básica para obtener el análisis de precios del mercado nacional
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={manejarEnvio} className="space-y-6">
            <div className="grid gap-6">
              {/* Marca */}
              <div className="space-y-2">
                <Label htmlFor="marca" className="text-sm font-medium">
                  Marca <span className="text-destructive">*</span>
                </Label>
                <Popover open={abrirMarcas} onOpenChange={setAbrirMarcas}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={abrirMarcas}
                      className="w-full justify-between bg-background border-2 border-input focus:border-primary"
                      disabled={cargando}
                    >
                      {formData.marcaId
                        ? marcas.find((marca) => marca.id === formData.marcaId)?.name
                        : cargando ? "Cargando marcas..." : "Selecciona la marca"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background border-2">
                    <Command>
                      <CommandInput placeholder="Buscar marca..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron marcas.</CommandEmpty>
                        <CommandGroup>
                          {marcas.map((marca) => (
                            <CommandItem
                              key={marca.id}
                              value={marca.name}
                              onSelect={() => {
                                manejarCambioMarca(marca.id);
                                setAbrirMarcas(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.marcaId === marca.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {marca.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Modelo */}
              <div className="space-y-2">
                <Label htmlFor="modelo" className="text-sm font-medium">
                  Modelo <span className="text-destructive">*</span>
                </Label>
                <Popover open={abrirModelos} onOpenChange={setAbrirModelos}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={abrirModelos}
                      className="w-full justify-between bg-background border-2 border-input focus:border-primary"
                      disabled={!formData.marcaId || cargandoModelos}
                    >
                      {formData.modeloId
                        ? modelos.find((modelo) => modelo.id === formData.modeloId)?.name
                        : !formData.marcaId ? "Primero selecciona una marca" :
                          cargandoModelos ? "Cargando modelos..." :
                          "Selecciona el modelo"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background border-2">
                    <Command>
                      <CommandInput placeholder="Buscar modelo..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron modelos.</CommandEmpty>
                        <CommandGroup>
                          {modelos.map((modelo) => (
                            <CommandItem
                              key={modelo.id}
                              value={modelo.name}
                              onSelect={() => {
                                manejarCambioModelo(modelo.id);
                                setAbrirModelos(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.modeloId === modelo.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {modelo.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Año */}
                <div className="space-y-2">
                  <Label htmlFor="ano" className="text-sm font-medium">
                    Año <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.anoId} onValueChange={manejarCambioAno} disabled={!formData.modeloId || cargandoAnos}>
                    <SelectTrigger className="bg-background border-2 border-input focus:border-primary">
                      <SelectValue placeholder={
                        !formData.modeloId ? "Primero selecciona un modelo" :
                        cargandoAnos ? "Cargando años..." :
                        "Selecciona el año"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 z-50">
                      {anos.map((ano) => (
                        <SelectItem key={ano.id} value={ano.id}>
                          {ano.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Versión */}
                <div className="space-y-2">
                  <Label htmlFor="version" className="text-sm font-medium">
                    Versión
                  </Label>
                  <Select value={formData.versionId} onValueChange={manejarCambioVersion} disabled={!formData.anoId || cargandoVersiones}>
                    <SelectTrigger className="bg-background border-2 border-input focus:border-primary">
                      <SelectValue placeholder={
                        !formData.anoId ? "Primero selecciona un año" :
                        cargandoVersiones ? "Cargando versiones..." :
                        "Selecciona la versión (opcional)"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 z-50">
                      {versiones.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {version.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-sm font-medium">
                    Estado
                  </Label>
                  <Select value={formData.estadoId} onValueChange={manejarCambioEstado}>
                    <SelectTrigger className="bg-background border-2 border-input focus:border-primary">
                      <SelectValue placeholder="Selecciona el estado (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 z-50">
                      {ESTADOS_MEXICO.map((estado) => (
                        <SelectItem key={estado.locationId} value={estado.locationId}>
                          {estado.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>


            {/* Información adicional */}
            <div className="p-4 bg-muted/30 rounded-lg border border-muted">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">📊 Análisis Nacional de Precios</p>
                <p>Obtendrás precios basados en toda la información disponible del mercado mexicano. 
                En los resultados podrás filtrar por estados específicos y tipo de vendedores.</p>
                {!usuario && (
                  <p className="mt-2 text-amber-600 font-medium">
                    ⚠️ Debes registrarte o iniciar sesión para acceder a las consultas.
                  </p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium py-6 text-lg shadow-lg"
              disabled={cargando || !formData.marca || !formData.modelo || !formData.ano}
            >
              {cargando ? (
                <>
                  <Car className="mr-2 h-5 w-5 animate-spin" />
                  Analizando...
                </>
              ) : !usuario ? (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Registrarse y Analizar Precios
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Analizar Precios del Mercado
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Diálogos */}
      <AuthModal 
        isOpen={mostrarAuth} 
        onClose={() => setMostrarAuth(false)} 
        onSuccess={() => setMostrarAuth(false)} 
      />
      <NoCreditsDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
    </>
  );
}