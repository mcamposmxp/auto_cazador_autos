import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Settings, TrendingDown, TrendingUp, Clock, Calendar, Info, Calculator, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigAutoajusteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesionalId: string | null;
  autoId?: string | null;
  autoTitulo?: string;
  autoPrecioPublicacion?: number;
  isGeneral?: boolean;
}

interface ConfigAutoajuste {
  id?: string;
  activo: boolean;
  precio_inicial?: number;
  precio_minimo?: number;
  precio_maximo?: number;
  // Demanda
  demanda_activa: boolean;
  demanda_dias_evaluar: number;
  demanda_umbral_tipo: 'menos_de' | 'mas_de';
  demanda_contactos_umbral: number;
  demanda_accion_tipo: 'reducir' | 'aumentar';
  demanda_valor_tipo: 'fijo' | 'porcentaje';
  demanda_valor: number;
  // Tiempo
  tiempo_activa: boolean;
  tiempo_dias_limite: number;
  tiempo_accion_tipo: 'fijo' | 'porcentaje';
  tiempo_accion_valor: number;
  // Calendario
  calendario_activa: boolean;
  calendario_frecuencia: 'personalizado';
  calendario_fecha_inicio?: string;
  calendario_fecha_fin?: string;
  calendario_accion_tipo: 'fijo' | 'porcentaje' | 'manual';
  calendario_accion_valor: number;
  calendario_es_aumento: boolean;
  calendario_precio_objetivo?: number;
  calendario_precio_final_tipo?: 'fijo' | 'porcentaje' | 'manual';
  calendario_precio_final_valor?: number;
  calendario_precio_final_es_aumento?: boolean;
}

const defaultConfig: ConfigAutoajuste = {
  activo: false,
  demanda_activa: false,
  demanda_dias_evaluar: 7,
  demanda_umbral_tipo: 'menos_de',
  demanda_contactos_umbral: 5,
  demanda_accion_tipo: 'reducir',
  demanda_valor_tipo: 'porcentaje',
  demanda_valor: 2,
  tiempo_activa: false,
  tiempo_dias_limite: 20,
  tiempo_accion_tipo: 'porcentaje',
  tiempo_accion_valor: 1,
  calendario_activa: false,
  calendario_frecuencia: 'personalizado',
  calendario_accion_tipo: 'fijo',
  calendario_accion_valor: 0,
  calendario_es_aumento: false,
  calendario_precio_objetivo: undefined,
  calendario_precio_final_tipo: 'fijo',
  calendario_precio_final_valor: undefined,
  calendario_precio_final_es_aumento: false
};

export default function ConfigAutoajuste({
  open,
  onOpenChange,
  profesionalId,
  autoId,
  autoTitulo,
  autoPrecioPublicacion,
  isGeneral = true
}: ConfigAutoajusteProps) {
  const [config, setConfig] = useState<ConfigAutoajuste>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulacion, setSimulacion] = useState<any>(null);
  const { toast } = useToast();

  // Validador estricto de UUID (solo acepta formato UUID)
  const isValidUUID = (val?: string | null) => {
    return !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  };


  const isConfigEspecifica = !!autoId;
  const tabla = isConfigEspecifica ? 'config_autoajuste_auto' : 'config_autoajuste_general';
  
  // ConfigAutoajuste props procesados

  useEffect(() => {
    if (open && profesionalId) {
      cargarConfiguracion();
    }
  }, [open, profesionalId, autoId]);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      // Evitar llamadas a Supabase con auto_id inválido (por ejemplo, ids numéricos como "1")
      if (isConfigEspecifica && !isValidUUID(autoId)) {
        setConfig({ ...defaultConfig });
        return; // mostramos UI por defecto sin error
      }

      const { data, error } = isConfigEspecifica 
        ? await supabase
            .from('config_autoajuste_auto')
            .select('*')
            .eq('profesional_id', profesionalId!)
            .eq('auto_id', autoId!)
            .maybeSingle()
        : await supabase
            .from('config_autoajuste_general') 
            .select('*')
            .eq('profesional_id', profesionalId!)
            .maybeSingle();

      if (error) throw error;

      if (data) {
        const dbData = data as any;
        setConfig({
          ...defaultConfig,
          id: dbData.id,
          activo: dbData.activo ?? false,
          precio_inicial: dbData.precio_inicial ?? (isConfigEspecifica ? autoPrecioPublicacion : undefined),
          precio_minimo: dbData.precio_minimo,
          precio_maximo: dbData.precio_maximo,
          demanda_activa: dbData.demanda_activa ?? false,
          demanda_dias_evaluar: dbData.demanda_dias_evaluar ?? 7,
          demanda_umbral_tipo: dbData.demanda_umbral_tipo || 'menos_de',
          demanda_contactos_umbral: dbData.demanda_contactos_umbral ?? 5,
          demanda_accion_tipo: dbData.demanda_accion_tipo || 'reducir',
          demanda_valor_tipo: dbData.demanda_valor_tipo || 'porcentaje',
          demanda_valor: dbData.demanda_valor ?? 2,
          tiempo_activa: dbData.tiempo_activa ?? false,
          tiempo_dias_limite: dbData.tiempo_dias_limite ?? 20,
          tiempo_accion_tipo: dbData.tiempo_accion_tipo || 'porcentaje',
          tiempo_accion_valor: dbData.tiempo_accion_valor ?? 1,
          calendario_activa: dbData.calendario_activa ?? false,
          calendario_frecuencia: dbData.calendario_frecuencia || 'personalizado',
          calendario_fecha_inicio: dbData.calendario_fecha_inicio || '',
          calendario_fecha_fin: dbData.calendario_fecha_fin || '',
          calendario_accion_tipo: dbData.calendario_accion_tipo || 'fijo',
          calendario_accion_valor: dbData.calendario_accion_valor ?? 0,
          calendario_es_aumento: dbData.calendario_es_aumento ?? false,
          calendario_precio_objetivo: dbData.calendario_precio_objetivo,
          calendario_precio_final_tipo: dbData.calendario_precio_final_tipo || 'fijo',
          calendario_precio_final_valor: dbData.calendario_precio_final_valor,
          calendario_precio_final_es_aumento: dbData.calendario_precio_final_es_aumento ?? false
        });
      } else {
        setConfig({
          ...defaultConfig,
          precio_inicial: isConfigEspecifica ? autoPrecioPublicacion : undefined
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = async () => {
    console.log('🔴 FUNCIÓN GUARDAR EJECUTADA - Iniciando proceso');
    
    try {
      console.log('Paso 1: Revisando config', config);
      
      // Validación para configuración específica: precio mínimo es obligatorio cuando autoajuste está activo
      if (isConfigEspecifica && config.activo && !config.precio_minimo) {
        console.log('Paso 2A: ERROR - Autoajuste activo sin precio mínimo');
        toast({
          title: "Error de validación", 
          description: "Debe definir un precio mínimo de venta para evitar que el auto se venda a un precio bajo",
          variant: "destructive",
        });
        return;
      }
      
      // Validación corregida: detectar caso donde precio_maximo existe pero precio_minimo es null
      if (config.precio_maximo && !config.precio_minimo) {
        console.log('Paso 2B: ERROR - Precio máximo definido pero precio mínimo es null');
        toast({
          title: "Error de validación", 
          description: "Debe definir un precio mínimo si establece un precio máximo",
          variant: "destructive",
        });
        return;
      }
      
      if (config.precio_minimo && config.precio_maximo) {
        console.log('Paso 2C: Ambos precios definidos', {
          minimo: config.precio_minimo,
          maximo: config.precio_maximo
        });
        
        if (Number(config.precio_maximo) < Number(config.precio_minimo)) {
          console.log('Paso 3: ERROR DETECTADO - Precio máximo menor que mínimo');
          toast({
            title: "Error de validación",
            description: "El precio máximo debe ser mayor o igual al precio mínimo",
            variant: "destructive",
          });
          return;
        }
      }
      
      console.log('Paso 4: Validación pasó, continuando...');

      // Validación adicional: precio_inicial es obligatorio en configuración específica
      if (isConfigEspecifica && (config.precio_inicial == null || Number(config.precio_inicial) <= 0)) {
        toast({
          title: 'Error de validación',
          description: 'Debe definir un precio inicial válido para este auto.',
          variant: 'destructive',
        });
        return;
      }

      // Validaciones para ajustes programados
      if (config.calendario_activa) {
        console.log('Paso 5: Validando fechas de calendario', {
          fecha_inicio: config.calendario_fecha_inicio,
          fecha_fin: config.calendario_fecha_fin
        });
        
        // Validar que la fecha de fin sea mayor o igual a la fecha de inicio
        if (config.calendario_fecha_inicio && config.calendario_fecha_fin) {
          const fechaInicio = new Date(config.calendario_fecha_inicio);
          const fechaFin = new Date(config.calendario_fecha_fin);
          
          console.log('Paso 5A: Comparando fechas', {
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: fechaFin.toISOString(),
            fechaFinEsMenor: fechaFin < fechaInicio
          });
          
          if (fechaFin < fechaInicio) {
            console.log('Paso 5B: ERROR DETECTADO - Fecha fin menor que inicio');
            toast({ 
              title: 'Error de validación', 
              description: 'La fecha de fin debe ser mayor o igual a la fecha de inicio', 
              variant: 'destructive' 
            });
            return;
          }
        }

        // Las validaciones de valor_directo ya no son necesarias ya que ese tipo fue removido

        // Las validaciones de valor_directo ya no son necesarias ya que ese tipo fue removido
      }
    } catch (error) {
      console.error('ERROR en validación:', error);
    }

    setSaving(true);
    try {
      // Si el autoId no es un UUID válido, evitamos guardar configuración específica para no romper con Supabase
      if (isConfigEspecifica && !isValidUUID(autoId)) {
        toast({
          title: "No disponible",
          description: "Este vehículo no está vinculado con un identificador válido para guardar configuración específica.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Construir payload evitando sobrescribir precio_inicial con undefined
      const { id: _omitId, precio_inicial: precioInicialConfig, calendario_precio_final_es_aumento: _omitToggle, ...restConfig } = config;

      const configToSave = {
        ...restConfig,
        profesional_id: profesionalId,
        ...(isConfigEspecifica ? { auto_id: autoId, precio_inicial: Number(precioInicialConfig) } : {}),
        calendario_fecha_inicio: config.calendario_fecha_inicio || null,
        calendario_fecha_fin: config.calendario_fecha_fin || null,
        // Solo enviar campos de calendario si están activos
        ...(config.calendario_activa ? {} : {
          calendario_accion_tipo: null,
          calendario_accion_valor: null,
          calendario_precio_objetivo: null,
          calendario_precio_final_tipo: null,
          calendario_precio_final_valor: null
        })
      };

      if (config.id) {
        const { error } = await supabase
          .from(tabla)
          .update(configToSave)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(tabla)
          .insert(configToSave);
        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente"
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const calcularSimulacion = () => {
    if (!config.precio_inicial) return;

    let precioActual = config.precio_inicial;
    const simulacionData: any[] = [];

    // Simular 30 días
    for (let dia = 1; dia <= 30; dia++) {
      const cambios: string[] = [];
      let precioAnterior = precioActual;

      // Simular reglas por demanda (suponiendo contactos aleatorios)
      if (config.demanda_activa) {
        const contactos = Math.floor(Math.random() * 20) + 1;
        const cumpleCondicion = config.demanda_umbral_tipo === 'menos_de'
          ? contactos < config.demanda_contactos_umbral
          : contactos > config.demanda_contactos_umbral;

        if (cumpleCondicion) {
          const cambio = config.demanda_valor_tipo === 'porcentaje'
            ? precioActual * (config.demanda_valor / 100)
            : config.demanda_valor;

          if (config.demanda_accion_tipo === 'reducir') {
            precioActual -= cambio;
            cambios.push(`Reducción por demanda: -$${cambio.toFixed(0)}`);
          } else {
            precioActual += cambio;
            cambios.push(`Aumento por demanda: +$${cambio.toFixed(0)}`);
          }
        }
      }

      // Simular reglas por tiempo: solo aplicar cada N días exactos (p.ej., 10, 20, 30...)
      if (config.tiempo_activa && config.tiempo_dias_limite > 0 && dia % config.tiempo_dias_limite === 0) {
        const reduccion = config.tiempo_accion_tipo === 'porcentaje'
          ? precioActual * (config.tiempo_accion_valor / 100)
          : config.tiempo_accion_valor;
        precioActual -= reduccion;
        cambios.push(`Reducción por tiempo: -$${reduccion.toFixed(0)}`);
      }

      // Aplicar límites
      const precioAntesLimites = precioActual;
      if (config.precio_minimo && precioActual < config.precio_minimo) {
        precioActual = config.precio_minimo;
        cambios.push('Precio limitado al mínimo');
      }
      if (config.precio_maximo && precioActual > config.precio_maximo) {
        precioActual = config.precio_maximo;
        cambios.push('Precio limitado al máximo');
      }

      simulacionData.push({
        dia,
        precio: precioActual,
        cambios: cambios.length > 0 ? cambios : ['Sin cambios']
      });
    }

    setSimulacion(simulacionData);
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(precio);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">
                {isConfigEspecifica ? 'Configuración Específica' : 'Configuración General'}
              </span>
              <span className="text-sm text-muted-foreground">
                {isConfigEspecifica 
                  ? `${autoTitulo || 'Auto específico'} - Autoajuste de precios`
                  : 'Reglas que se aplicarán a todos los vehículos automáticamente'
                }
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <p className="text-sm text-muted-foreground">Cargando configuración...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-1">
              {/* Alerta de jerarquía mejorada */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-blue-900 mb-2">
                      {isConfigEspecifica ? 'Configuración Prioritaria' : 'Configuración Base'}
                    </h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {isConfigEspecifica 
                        ? 'Esta configuración específica sobrescribe la configuración general y solo se aplica a este vehículo.'
                        : 'Esta configuración se aplica automáticamente a todos los vehículos que no tengan una configuración específica definida.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="configuracion" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="configuracion" className="text-sm font-medium">
                    Configuración
                  </TabsTrigger>
                  <TabsTrigger value="simulacion" className="text-sm font-medium">
                    Simulador
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="configuracion" className="space-y-6 mt-0">
                  {/* Activación principal mejorada */}
                  <Card className="border-2 border-dashed border-muted-foreground/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Settings className="h-5 w-5 text-green-600" />
                          </div>
                          <span>Activar Autoajuste de Precios</span>
                        </div>
                        <Switch
                          checked={config.activo}
                          onCheckedChange={(checked) => setConfig({ ...config, activo: checked })}
                        />
                      </CardTitle>
                    </CardHeader>
                    {!config.activo && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          Active esta función para automatizar los ajustes de precio basados en demanda, tiempo y programación.
                        </p>
                      </CardContent>
                    )}
                  </Card>

                  {config.activo && (
                    <>
                      {/* Marco de Seguridad mejorado */}
                      <Card className="border-orange-200 bg-orange-50/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 text-orange-900">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Shield className="h-5 w-5 text-orange-600" />
                            </div>
                            Marco de Protección
                          </CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-6">
                           {isConfigEspecifica && (
                             <>
                               <div className="bg-white rounded-lg p-4 border">
                                 <Label htmlFor="precio_inicial" className="text-base font-medium">
                                   Precio de Publicación
                                 </Label>
                                 <div className="relative mt-2">
                                   <Input
                                     id="precio_inicial"
                                     type="text"
                                     placeholder="450,000"
                                     value={config.precio_inicial?.toLocaleString('es-MX') || ''}
                                     onChange={(e) => {
                                       const numericValue = e.target.value.replace(/[^\d]/g, '');
                                       setConfig({ ...config, precio_inicial: Number(numericValue) });
                                     }}
                                     className="pl-8 text-lg font-medium"
                                   />
                                   <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                                     $
                                   </span>
                                 </div>
                                 <p className="text-sm text-muted-foreground mt-2">
                                   Precio inicial de publicación desde el cual se aplicarán los ajustes automáticos
                                 </p>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="bg-white rounded-lg p-4 border">
                                   <Label htmlFor="precio_minimo" className="text-base font-medium">
                                     Precio Mínimo
                                   </Label>
                                   <div className="relative mt-2">
                                     <Input
                                       id="precio_minimo"
                                       type="text"
                                       placeholder="350,000"
                                       value={config.precio_minimo?.toLocaleString('es-MX') || ''}
                                       onChange={(e) => {
                                         const numericValue = e.target.value.replace(/[^\d]/g, '');
                                         setConfig({ ...config, precio_minimo: Number(numericValue) });
                                       }}
                                       className="pl-8"
                                     />
                                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                       $
                                     </span>
                                   </div>
                                   <p className="text-sm text-muted-foreground mt-2">
                                     El precio nunca bajará de este límite
                                   </p>
                                 </div>

                                 <div className="bg-white rounded-lg p-4 border">
                                   <Label htmlFor="precio_maximo" className="text-base font-medium">
                                     Precio Máximo (Opcional)
                                   </Label>
                                   <div className="relative mt-2">
                                     <Input
                                       id="precio_maximo"
                                       type="text"
                                       placeholder="550,000"
                                       value={config.precio_maximo?.toLocaleString('es-MX') || ''}
                                       onChange={(e) => {
                                         const numericValue = e.target.value.replace(/[^\d]/g, '');
                                         setConfig({ ...config, precio_maximo: Number(numericValue) });
                                       }}
                                       className="pl-8"
                                     />
                                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                       $
                                     </span>
                                   </div>
                                   <p className="text-sm text-muted-foreground mt-2">
                                     El precio nunca subirá de este límite
                                   </p>
                                 </div>
                               </div>
                             </>
                           )}

                           {!isConfigEspecifica && (
                             <>
                               {/* Información sobre protección automática mejorada */}
                               <div className="bg-blue-50 dark:bg-blue-950 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                                 <div className="flex items-start gap-4">
                                   <div className="p-2 bg-blue-100 rounded-lg">
                                     <Info className="h-5 w-5 text-blue-600" />
                                   </div>
                                   <div className="space-y-3">
                                     <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                                       Sistema de Protección Inteligente
                                     </h4>
                                     <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                                       <p>
                                         • Los ajustes solo se aplican a vehículos con precio mínimo definido
                                       </p>
                                       <p>
                                         • Los vehículos sin límites de seguridad quedan protegidos automáticamente
                                       </p>
                                       <p className="font-medium">
                                         Configure los precios mínimo y máximo en "Mis Anuncios" → "Editar Precios"
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </>
                           )}
                        </CardContent>
                      </Card>

                      {/* Reglas por Demanda mejorada */}
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-green-900">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              </div>
                              <span>Ajustes por Demanda</span>
                            </div>
                            <Switch
                              checked={config.demanda_activa}
                              onCheckedChange={(checked) => setConfig({ ...config, demanda_activa: checked })}
                            />
                          </CardTitle>
                        </CardHeader>
                        {config.demanda_activa && (
                          <CardContent className="space-y-6">
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="demanda_dias" className="text-sm font-medium">Evaluar cada (días)</Label>
                                  <Input
                                    id="demanda_dias"
                                    type="number"
                                    min="1"
                                    value={config.demanda_dias_evaluar}
                                    onChange={(e) => setConfig({ ...config, demanda_dias_evaluar: Number(e.target.value) })}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Cuando reciba</Label>
                                  <div className="flex gap-2 mt-1">
                                    <Select
                                      value={config.demanda_umbral_tipo}
                                      onValueChange={(value: 'menos_de' | 'mas_de') => 
                                        setConfig({ 
                                          ...config, 
                                          demanda_umbral_tipo: value,
                                          demanda_accion_tipo: value === 'menos_de' ? 'reducir' : 'aumentar'
                                        })
                                      }
                                    >
                                      <SelectTrigger className="flex-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="menos_de">Menos de</SelectItem>
                                        <SelectItem value="mas_de">Más de</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={config.demanda_contactos_umbral}
                                      onChange={(e) => setConfig({ ...config, demanda_contactos_umbral: Number(e.target.value) })}
                                      className="w-20"
                                      placeholder="5"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">mensajes de interesados</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-sm font-medium block mb-3">Acción a realizar</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Select
                                    value={config.demanda_valor_tipo}
                                    onValueChange={(value: 'fijo' | 'porcentaje') => 
                                      setConfig({ ...config, demanda_valor_tipo: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fijo">Cantidad fija</SelectItem>
                                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <div className="relative">
                                    <Input
                                      type={config.demanda_valor_tipo === 'fijo' ? 'text' : 'number'}
                                      value={config.demanda_valor_tipo === 'fijo' 
                                        ? config.demanda_valor?.toLocaleString('es-MX') || ''
                                        : config.demanda_valor}
                                      onChange={(e) => {
                                        if (config.demanda_valor_tipo === 'fijo') {
                                          const numericValue = e.target.value.replace(/[^\d]/g, '');
                                          setConfig({ ...config, demanda_valor: Number(numericValue) });
                                        } else {
                                          setConfig({ ...config, demanda_valor: Number(e.target.value) });
                                        }
                                      }}
                                      placeholder={config.demanda_valor_tipo === 'fijo' ? '5,000' : '2'}
                                      className={`${config.demanda_valor_tipo === 'fijo' ? 'pl-8' : 'pr-8'} ${
                                        config.demanda_accion_tipo === 'reducir' ? 'text-red-600' : 'text-green-600'
                                      }`}
                                    />
                                    {config.demanda_valor_tipo === 'fijo' && (
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                    )}
                                    {config.demanda_valor_tipo === 'porcentaje' && (
                                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    {config.demanda_accion_tipo === 'reducir' ? (
                                      <><TrendingDown className="h-3 w-3 text-red-500" /> Reducir precio</>
                                    ) : (
                                      <><TrendingUp className="h-3 w-3 text-green-500" /> Aumentar precio</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Reglas por Tiempo mejorada */}
                      <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-blue-900">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600" />
                              </div>
                              <span>Ajustes por Antigüedad</span>
                            </div>
                            <Switch
                              checked={config.tiempo_activa}
                              onCheckedChange={(checked) => setConfig({ ...config, tiempo_activa: checked })}
                            />
                          </CardTitle>
                        </CardHeader>
                        {config.tiempo_activa && (
                          <CardContent>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="tiempo_dias" className="text-sm font-medium">Reducir cada (días)</Label>
                                  <Input
                                    id="tiempo_dias"
                                    type="number"
                                    min="1"
                                    value={config.tiempo_dias_limite}
                                    onChange={(e) => setConfig({ ...config, tiempo_dias_limite: Number(e.target.value) })}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Tipo de reducción</Label>
                                  <Select
                                    value={config.tiempo_accion_tipo}
                                    onValueChange={(value: 'fijo' | 'porcentaje') => 
                                      setConfig({ ...config, tiempo_accion_tipo: value })
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fijo">Cantidad fija</SelectItem>
                                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Valor de reducción</Label>
                                  <div className="relative mt-1">
                                    <Input
                                      type={config.tiempo_accion_tipo === 'fijo' ? 'text' : 'number'}
                                      value={config.tiempo_accion_tipo === 'fijo' 
                                        ? config.tiempo_accion_valor?.toLocaleString('es-MX') || ''
                                        : config.tiempo_accion_valor}
                                      onChange={(e) => {
                                        if (config.tiempo_accion_tipo === 'fijo') {
                                          const numericValue = e.target.value.replace(/[^\d]/g, '');
                                          setConfig({ ...config, tiempo_accion_valor: Number(numericValue) });
                                        } else {
                                          setConfig({ ...config, tiempo_accion_valor: Number(e.target.value) });
                                        }
                                      }}
                                      placeholder={config.tiempo_accion_tipo === 'fijo' ? '5,000' : '1'}
                                      className={config.tiempo_accion_tipo === 'fijo' ? 'pl-8' : 'pr-8'}
                                    />
                                    {config.tiempo_accion_tipo === 'fijo' && (
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                    )}
                                    {config.tiempo_accion_tipo === 'porcentaje' && (
                                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Reglas Programadas mejorada */}
                      <Card className="border-purple-200 bg-purple-50/50">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-purple-900">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-purple-600" />
                              </div>
                              <span>Ajustes Programados</span>
                            </div>
                            <Switch
                              checked={config.calendario_activa}
                              onCheckedChange={(checked) => setConfig({ ...config, calendario_activa: checked })}
                            />
                          </CardTitle>
                        </CardHeader>
                        {config.calendario_activa && (
                          <CardContent className="space-y-6">
                             {/* Información de precios - Solo para configuración específica */}
                             {isConfigEspecifica && (
                               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                                 <Label className="text-base font-semibold text-blue-900 mb-4 block">Información de Precios del Vehículo</Label>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="bg-white p-3 rounded-lg border">
                                     <Label className="text-sm text-muted-foreground">Precio Actual</Label>
                                     <div className="text-xl font-bold text-green-600 mt-1">
                                       {config.precio_inicial ? new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0}).format(config.precio_inicial) : 'No definido'}
                                     </div>
                                   </div>
                                   <div className="bg-white p-3 rounded-lg border">
                                     <Label className="text-sm text-muted-foreground">Precio Mínimo</Label>
                                     <div className="text-xl font-bold text-red-600 mt-1">
                                       {config.precio_minimo ? new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0}).format(config.precio_minimo) : 'No definido'}
                                     </div>
                                   </div>
                                   <div className="bg-white p-3 rounded-lg border">
                                     <Label className="text-sm text-muted-foreground">Precio Máximo</Label>
                                     <div className="text-xl font-bold text-blue-600 mt-1">
                                       {config.precio_maximo ? new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0}).format(config.precio_maximo) : 'No definido'}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             )}

                             {/* Para configuración general, mostrar información diferente */}
                             {!isConfigEspecifica && (
                               <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                                 <div className="flex items-start gap-4">
                                   <div className="p-2 bg-amber-100 rounded-lg">
                                     <Info className="h-5 w-5 text-amber-600" />
                                   </div>
                                   <div className="flex-1">
                                     <h4 className="text-base font-semibold text-amber-900 mb-2">
                                       Configuración General
                                     </h4>
                                     <p className="text-sm text-amber-700 leading-relaxed">
                                       Esta programación se aplicará a todos los vehículos que tengan configurados sus precios mínimo y máximo.
                                       Configure fechas y reglas de ajuste que se aplicarán automáticamente.
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             )}

                            {/* Periodo */}
                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-base font-medium mb-3 block">Periodo</Label>
                              <p className="text-sm text-muted-foreground mb-4">Defina las fechas de inicio y fin para el periodo personalizado</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Fecha inicio</Label>
                                  <Input type="date" value={config.calendario_fecha_inicio || ''} onChange={(e) => setConfig({ ...config, calendario_fecha_inicio: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                  <Label>Fecha fin</Label>
                                  <Input type="date" value={config.calendario_fecha_fin || ''} onChange={(e) => setConfig({ ...config, calendario_fecha_fin: e.target.value })} className="mt-1" />
                                </div>
                              </div>
                            </div>

                            {/* Precio durante el periodo */}
                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-base font-medium mb-3 block">Precio Durante el Periodo</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Método de configuración</Label>
                                  <Select value={config.calendario_accion_tipo || 'porcentaje'} onValueChange={(value: 'fijo' | 'porcentaje' | 'manual') => setConfig({ ...config, calendario_accion_tipo: value })}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Selecciona un método" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                                      <SelectItem value="porcentaje">Ajuste por porcentaje</SelectItem>
                                      <SelectItem value="fijo">Ajuste por cantidad fija</SelectItem>
                                      <SelectItem value="manual">Precio específico manual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="flex items-center gap-2">
                                    {config.calendario_accion_tipo !== 'manual' && (
                                      config.calendario_es_aumento ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                      )
                                    )}
                                    {config.calendario_accion_tipo === 'manual'
                                      ? 'Captura el precio del periodo ($)'
                                      : config.calendario_accion_tipo === 'porcentaje'
                                        ? 'Porcentaje de ajuste (%)'
                                        : 'Cantidad de ajuste ($)'}
                                  </Label>
                                  <div className="relative">
                                  <Input
                                    type="text"
                                    value={config.calendario_accion_tipo === 'manual'
                                      ? (config.calendario_precio_objetivo?.toLocaleString('es-MX') ?? '')
                                      : (config.calendario_accion_valor?.toLocaleString('es-MX') ?? '')}
                                    onChange={(e) => {
                                      const numericValue = e.target.value.replace(/,/g, '');
                                      const value = parseFloat(numericValue) || 0;
                                      if (config.calendario_accion_tipo === 'manual') {
                                        setConfig({ ...config, calendario_precio_objetivo: value });
                                      } else {
                                        setConfig({ ...config, calendario_accion_valor: value });
                                        }
                                      }}
                                      min={0}
                                      step={config.calendario_accion_tipo === 'porcentaje' ? 0.1 : 1000}
                                      className={`mt-1 ${config.calendario_accion_tipo !== 'porcentaje' ? 'pl-10' : ''} ${config.calendario_accion_tipo === 'porcentaje' ? 'pr-10' : ''}`}
                                      placeholder="0"
                                    />
                                    {config.calendario_accion_tipo !== 'porcentaje' && (
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">$</span>
                                    )}
                                    {config.calendario_accion_tipo === 'porcentaje' && (
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">%</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {config.calendario_accion_tipo !== 'manual' && (
                                <div className="mt-4 flex items-center gap-4">
                                  <Label className="text-sm font-medium">Tipo de cambio:</Label>
                                  <div className="flex items-center gap-2">
                                    <Switch checked={config.calendario_es_aumento} onCheckedChange={(checked) => setConfig({ ...config, calendario_es_aumento: checked })} />
                                    <span className="text-sm font-medium">{config.calendario_es_aumento ? (<span className="text-green-600 flex items-center gap-1"><TrendingUp className="h-4 w-4" />Aumentar precio</span>) : (<span className="text-red-600 flex items-center gap-1"><TrendingDown className="h-4 w-4" />Reducir precio</span>)}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Precio al final del periodo */}
                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-base font-medium mb-3 block">Precio al Final del Periodo</Label>
                              <p className="text-sm text-muted-foreground mb-4">Configure el precio que tendrá el vehículo cuando termine el periodo programado</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Tipo de precio final</Label>
                                  <Select value={config.calendario_precio_final_tipo || 'fijo'} onValueChange={(value: 'fijo' | 'porcentaje' | 'manual') => setConfig({ ...config, calendario_precio_final_tipo: value })}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border border-border shadow-lg z-[9999]">
                                      <SelectItem value="porcentaje">Ajuste por porcentaje</SelectItem>
                                      <SelectItem value="fijo">Ajuste por cantidad fija</SelectItem>
                                      <SelectItem value="manual">Precio específico manual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                  <div>
                                    <Label className="flex items-center gap-2">
                                      {config.calendario_precio_final_tipo !== 'manual' && (
                                        config.calendario_precio_final_es_aumento ? (
                                          <TrendingUp className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <TrendingDown className="h-4 w-4 text-red-600" />
                                        )
                                      )}
                                      {config.calendario_precio_final_tipo === 'manual'
                                        ? 'Captura el precio del periodo ($)'
                                        : config.calendario_precio_final_tipo === 'porcentaje'
                                          ? 'Porcentaje de ajuste (%)'
                                          : 'Cantidad de ajuste ($)'}
                                    </Label>
                                    <div className="relative">
                                       <Input 
                                         type="text" 
                                         value={config.calendario_precio_final_valor?.toLocaleString('es-MX') ?? ''} 
                                         onChange={(e) => {
                                           const numericValue = e.target.value.replace(/,/g, '');
                                           setConfig({ ...config, calendario_precio_final_valor: parseFloat(numericValue) || 0 });
                                         }}
                                         min={0} 
                                         step={config.calendario_precio_final_tipo === 'porcentaje' ? 0.1 : 1000} 
                                         className={`mt-1 ${
                                           config.calendario_precio_final_tipo !== 'porcentaje' 
                                             ? 'pl-10' 
                                             : 'pr-10'
                                         }`}
                                         placeholder="0" 
                                       />
                                       {config.calendario_precio_final_tipo !== 'porcentaje' && (
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">$</span>
                                       )}
                                       {config.calendario_precio_final_tipo === 'porcentaje' && (
                                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">%</span>
                                       )}
                                    </div>
                                  </div>
                                  {config.calendario_precio_final_tipo !== 'manual' && (
                                    <div className="mt-4 flex items-center gap-4">
                                      <Label className="text-sm font-medium">Tipo de cambio:</Label>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={config.calendario_precio_final_es_aumento}
                                          onCheckedChange={(checked) => setConfig({
                                            ...config,
                                            calendario_precio_final_es_aumento: checked
                                          })}
                                        />
                                        <span className="text-sm font-medium">
                                          {config.calendario_precio_final_es_aumento ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                              <TrendingUp className="h-4 w-4" /> Aumentar precio
                                            </span>
                                          ) : (
                                            <span className="text-red-600 flex items-center gap-1">
                                              <TrendingDown className="h-4 w-4" /> Reducir precio
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="simulacion" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calculator className="h-5 w-5 text-primary" />
                        </div>
                        <span>Simulador de Precios</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button onClick={calcularSimulacion} disabled={!config.precio_inicial} className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Simular 30 días
                        </Button>
                        {!config.precio_inicial && (
                          <p className="text-sm text-muted-foreground">
                            * Configure un precio inicial para usar el simulador
                          </p>
                        )}
                      </div>

                      {simulacion && (
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="text-sm font-medium mb-2">Resumen de la simulación</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Precio Inicial</p>
                                <p className="font-semibold">{formatearPrecio(config.precio_inicial || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Precio Final (Día 30)</p>
                                <p className="font-semibold">{formatearPrecio(simulacion[29]?.precio || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Diferencia Total</p>
                                <p className={`font-semibold ${
                                  (simulacion[29]?.precio || 0) < (config.precio_inicial || 0) ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {formatearPrecio(Math.abs((simulacion[29]?.precio || 0) - (config.precio_inicial || 0)))}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg">
                            {simulacion.slice(0, 15).map((dia: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="min-w-[60px] justify-center">
                                    Día {dia.dia}
                                  </Badge>
                                  <span className="font-medium">
                                    {formatearPrecio(dia.precio)}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground max-w-[300px] text-right">
                                  {dia.cambios.length > 0 ? dia.cambios[0] : 'Sin cambios'}
                                </div>
                              </div>
                            ))}
                            {simulacion.length > 15 && (
                              <div className="p-3 text-center border-t">
                                <p className="text-sm text-muted-foreground">
                                  ... y {simulacion.length - 15} días más
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Botones de acción */}
            <div className="shrink-0 pt-4 border-t mt-6">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarConfiguracion} disabled={saving} className="min-w-[140px]">
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    'Guardar Configuración'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}