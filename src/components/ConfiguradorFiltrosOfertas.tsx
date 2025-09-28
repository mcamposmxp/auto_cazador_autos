import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Car, DollarSign, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MarcaModelo {
  marca: string;
  modelos: string[];
  versiones: string[];
  años?: {
    min: number;
    max: number;
  };
}

interface FiltrosVehiculo {
  marcas_modelos: MarcaModelo[];
  rango_precio: {
    activo: boolean;
    min: number;
    max: number;
  };
  rango_kilometraje: {
    activo: boolean;
    min: number;
    max: number;
  };
}

interface ConfiguradorFiltrosOfertasProps {
  profesionalId: string;
}

export function ConfiguradorFiltrosOfertas({ profesionalId }: ConfiguradorFiltrosOfertasProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'personalizado'>('todos');
  const [filtrosActivos, setFiltrosActivos] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosVehiculo>({
    marcas_modelos: [],
    rango_precio: { activo: false, min: 50000, max: 500000 },
    rango_kilometraje: { activo: false, min: 0, max: 150000 }
  });

  // Estado para el catálogo de vehículos
  const [catalogoData, setCatalogoData] = useState<any>(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>("");
  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>("todos");
  const [versionSeleccionada, setVersionSeleccionada] = useState<string>("todos");
  const [añoMin, setAñoMin] = useState<number>(0);
  const [añoMax, setAñoMax] = useState<number>(2024);
  const [modelosData, setModelosData] = useState<any>(null);
  const [versionesData, setVersionesData] = useState<any>(null);

  useEffect(() => {
    cargarFiltrosExistentes();
    cargarCatalogoVehiculos();
  }, [profesionalId]);

  const cargarFiltrosExistentes = async () => {
    try {
      const { data, error } = await supabase
        .from('profesional_filtros_ofertas')
        .select('*')
        .eq('profesional_id', profesionalId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando filtros:', error);
        return;
      }

      if (data) {
        setTipoFiltro(data.tipo_filtro as 'todos' | 'personalizado');
        setFiltrosActivos(data.activo);
        setFiltros(data.filtros_vehiculo as unknown as FiltrosVehiculo);
      }
    } catch (error) {
      console.error('Error cargando filtros:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogoVehiculos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos');
      
      if (error) {
        console.error('Error cargando catálogo:', error);
        return;
      }

      setCatalogoData(data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    }
  };

  const guardarFiltros = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profesional_filtros_ofertas')
        .upsert({
          profesional_id: profesionalId,
          activo: filtrosActivos,
          tipo_filtro: tipoFiltro,
          filtros_vehiculo: filtros as any
        });

      if (error) throw error;

      toast({
        title: "Filtros guardados",
        description: "Tus preferencias de ofertas han sido actualizadas correctamente.",
      });
    } catch (error) {
      console.error('Error guardando filtros:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los filtros. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const agregarFiltroMarcaModelo = () => {
    if (!marcaSeleccionada) return;

    const nuevoFiltro: MarcaModelo = {
      marca: marcaSeleccionada,
      modelos: (modeloSeleccionado && modeloSeleccionado !== "todos") ? [modeloSeleccionado] : [],
      versiones: (versionSeleccionada && versionSeleccionada !== "todos") ? [versionSeleccionada] : [],
      años: añoMin > 0 ? { min: añoMin, max: añoMax } : undefined
    };

    setFiltros(prev => ({
      ...prev,
      marcas_modelos: [...prev.marcas_modelos, nuevoFiltro]
    }));

    // Limpiar selección
    setMarcaSeleccionada("");
    setModeloSeleccionado("todos");
    setVersionSeleccionada("todos");
    setAñoMin(0);
    setAñoMax(2024);
  };

  const eliminarFiltroMarcaModelo = (index: number) => {
    setFiltros(prev => ({
      ...prev,
      marcas_modelos: prev.marcas_modelos.filter((_, i) => i !== index)
    }));
  };

  const obtenerMarcas = () => {
    if (!catalogoData?.children) return [];
    return catalogoData.children.map((marca: any) => marca.name).sort();
  };

  const obtenerModelos = (marca: string) => {
    if (!modelosData?.children) return [];
    return modelosData.children.map((modelo: any) => modelo.name).sort();
  };

  const obtenerVersiones = (modelo: string) => {
    if (!versionesData?.children) return [];
    return versionesData.children.map((version: any) => version.name).sort();
  };

  const cargarModelos = async (marca: string) => {
    if (!marca || !catalogoData?.children) return;
    
    const marcaItem = catalogoData.children.find((m: any) => m.name === marca);
    if (!marcaItem) return;

    try {
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: marcaItem.id }
      });
      
      if (error) {
        console.error('Error cargando modelos:', error);
        return;
      }

      setModelosData(data);
    } catch (error) {
      console.error('Error cargando modelos:', error);
    }
  };

  const cargarVersiones = async (modelo: string) => {
    if (!modelo || !modelosData?.children) return;
    
    const modeloItem = modelosData.children.find((m: any) => m.name === modelo);
    if (!modeloItem) return;

    try {
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: modeloItem.id }
      });
      
      if (error) {
        console.error('Error cargando versiones:', error);
        return;
      }

      setVersionesData(data);
    } catch (error) {
      console.error('Error cargando versiones:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando filtros...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Configuración de Filtros de Ofertas
        </CardTitle>
        <CardDescription>
          Configura qué tipos de vehículos deseas recibir en tu panel de oportunidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Activar filtros personalizados</Label>
            <p className="text-sm text-muted-foreground">
              Cuando está desactivado, recibirás todas las ofertas disponibles
            </p>
          </div>
          <Switch
            checked={filtrosActivos}
            onCheckedChange={setFiltrosActivos}
          />
        </div>

        {filtrosActivos && (
          <>
            <Separator />
            
            {/* Tipo de filtro */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de filtro</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${tipoFiltro === 'todos' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setTipoFiltro('todos')}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium">Recibir todas las ofertas</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Todas las oportunidades de compra disponibles
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-colors ${tipoFiltro === 'personalizado' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setTipoFiltro('personalizado')}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium">Filtros personalizados</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solo vehículos que cumplan tus criterios
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {tipoFiltro === 'personalizado' && (
              <>
                {/* Filtros de marca/modelo */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Marcas y Modelos de Interés</Label>
                  
                  {/* Selector de nueva marca/modelo */}
                  <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Marca *</Label>
                        <Select 
                          value={marcaSeleccionada} 
                          onValueChange={(value) => {
                            setMarcaSeleccionada(value);
                            setModeloSeleccionado("todos");
                            setVersionSeleccionada("todos");
                            setModelosData(null);
                            setVersionesData(null);
                            if (value) cargarModelos(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la marca" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {obtenerMarcas().map((marca) => (
                              <SelectItem key={marca} value={marca}>
                                {marca}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Modelo</Label>
                        <Select 
                          value={modeloSeleccionado} 
                          onValueChange={(value) => {
                            setModeloSeleccionado(value);
                            setVersionSeleccionada("todos");
                            if (value && value !== "todos") cargarVersiones(value);
                          }}
                          disabled={!marcaSeleccionada}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={marcaSeleccionada ? "Todos los modelos" : "Primero selecciona una marca"} />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="todos">Todos los modelos</SelectItem>
                            {obtenerModelos(marcaSeleccionada).map((modelo) => (
                              <SelectItem key={modelo} value={modelo}>
                                {modelo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Año</Label>
                        <Select 
                          value={añoMin.toString()} 
                          onValueChange={(value) => setAñoMin(parseInt(value))}
                          disabled={!marcaSeleccionada}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={marcaSeleccionada ? "Todos los años" : "Primero selecciona una marca"} />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="0">Todos los años</SelectItem>
                            {Array.from({ length: 20 }, (_, i) => 2005 + i).reverse().map((año) => (
                              <SelectItem key={año} value={año.toString()}>
                                {año}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Versión</Label>
                        <Select 
                          value={versionSeleccionada} 
                          onValueChange={setVersionSeleccionada}
                          disabled={!marcaSeleccionada}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={marcaSeleccionada ? "Todas las versiones" : "Primero selecciona una marca"} />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="todos">Todas las versiones</SelectItem>
                            {obtenerVersiones(modeloSeleccionado).map((version) => (
                              <SelectItem key={version} value={version}>
                                {version}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={agregarFiltroMarcaModelo}
                      disabled={!marcaSeleccionada}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>

                  {/* Lista de filtros agregados */}
                  {filtros.marcas_modelos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Filtros activos:</Label>
                      {filtros.marcas_modelos.map((filtro, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2 w-fit">
                          <span>
                            {filtro.marca}
                            {filtro.modelos.length > 0 && ` ${filtro.modelos.join(", ")}`}
                            {filtro.versiones?.length > 0 && ` ${filtro.versiones.join(", ")}`}
                            {filtro.años && ` (${filtro.años.min}-${filtro.años.max})`}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => eliminarFiltroMarcaModelo(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Filtro de precio */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Rango de Precio
                    </Label>
                    <Switch
                      checked={filtros.rango_precio.activo}
                      onCheckedChange={(checked) => 
                        setFiltros(prev => ({
                          ...prev,
                          rango_precio: { ...prev.rango_precio, activo: checked }
                        }))
                      }
                    />
                  </div>
                  
                  {filtros.rango_precio.activo && (
                    <div className="space-y-4">
                      <div className="px-4">
                        <Slider
                          value={[filtros.rango_precio.min, filtros.rango_precio.max]}
                          onValueChange={([min, max]) => 
                            setFiltros(prev => ({
                              ...prev,
                              rango_precio: { ...prev.rango_precio, min, max }
                            }))
                          }
                          min={20000}
                          max={2000000}
                          step={10000}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${filtros.rango_precio.min.toLocaleString()}</span>
                        <span>${filtros.rango_precio.max.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Filtro de kilometraje */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Rango de Kilometraje
                    </Label>
                    <Switch
                      checked={filtros.rango_kilometraje.activo}
                      onCheckedChange={(checked) => 
                        setFiltros(prev => ({
                          ...prev,
                          rango_kilometraje: { ...prev.rango_kilometraje, activo: checked }
                        }))
                      }
                    />
                  </div>
                  
                  {filtros.rango_kilometraje.activo && (
                    <div className="space-y-4">
                      <div className="px-4">
                        <Slider
                          value={[filtros.rango_kilometraje.min, filtros.rango_kilometraje.max]}
                          onValueChange={([min, max]) => 
                            setFiltros(prev => ({
                              ...prev,
                              rango_kilometraje: { ...prev.rango_kilometraje, min, max }
                            }))
                          }
                          min={0}
                          max={300000}
                          step={5000}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{filtros.rango_kilometraje.min.toLocaleString()} km</span>
                        <span>{filtros.rango_kilometraje.max.toLocaleString()} km</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Botón guardar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={guardarFiltros} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}