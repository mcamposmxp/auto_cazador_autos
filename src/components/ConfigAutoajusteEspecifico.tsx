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

interface ConfigAutoajusteEspecificoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesionalId: string | null;
  autoId: string | null;
  autoTitulo?: string;
}

interface ConfigAutoajusteEspecifico {
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
  tiempo_accion_tipo: 'fijo' | 'porcentaje' | 'manual';
  tiempo_accion_valor: number;
  tiempo_es_aumento: boolean;
  // Calendario
  calendario_activa: boolean;
  calendario_frecuencia: 'personalizado';
  calendario_fecha_inicio?: string;
  calendario_fecha_fin?: string;
  calendario_accion_tipo: 'fijo' | 'porcentaje' | 'manual';
  calendario_accion_valor: number;
  calendario_es_aumento: boolean;
  // Nuevos campos para ajustes programados
  calendario_precio_objetivo?: number;
  calendario_precio_final_tipo: 'fijo' | 'porcentaje' | 'manual';
  calendario_precio_final_valor?: number;
  calendario_precio_final_es_aumento: boolean;
}

const defaultConfig: ConfigAutoajusteEspecifico = {
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
  tiempo_es_aumento: false,
  calendario_activa: false,
  calendario_frecuencia: 'personalizado',
  calendario_accion_tipo: 'manual',
  calendario_accion_valor: 0,
  calendario_es_aumento: false,
  calendario_precio_final_tipo: 'manual',
  calendario_precio_final_valor: 0,
  calendario_precio_final_es_aumento: false
};

export default function ConfigAutoajusteEspecifico({
  open,
  onOpenChange,
  profesionalId,
  autoId,
  autoTitulo
}: ConfigAutoajusteEspecificoProps) {
  const [config, setConfig] = useState<ConfigAutoajusteEspecifico>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulacion, setSimulacion] = useState<any>(null);
  const { toast } = useToast();

  // Validador simple de UUID (acepta cualquier versión) y también IDs numéricos para datos de ejemplo
  const isValidUUID = (val?: string | null) => {
    console.log('🟠 Validando autoId:', val, 'tipo:', typeof val);
    if (!val) {
      console.log('🔴 autoId es null/undefined');
      return false;
    }
    // Permitir UUIDs válidos
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(val)) {
      console.log('✅ autoId es UUID válido');
      return true;
    }
    // Permitir IDs numéricos para datos de ejemplo
    if (/^\d+$/.test(val)) {
      console.log('✅ autoId es ID numérico válido');
      return true;
    }
    console.log('🔴 autoId no es válido:', val);
    return false;
  };

  useEffect(() => {
    if (open && profesionalId && autoId) {
      cargarConfiguracion();
    }
  }, [open, profesionalId, autoId]);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      // Evitar llamadas a Supabase con auto_id inválido
      if (!isValidUUID(autoId)) {
        setConfig({ ...defaultConfig });
        return;
      }

      const { data, error } = await supabase
        .from('config_autoajuste_auto')
        .select('*')
        .eq('profesional_id', profesionalId!)
        .eq('auto_id', autoId!)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const dbData = data as any;
        setConfig({
          ...defaultConfig,
          id: dbData.id,
          activo: dbData.activo ?? false,
          precio_inicial: dbData.precio_inicial,
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
          tiempo_es_aumento: dbData.tiempo_es_aumento ?? false,
          calendario_activa: dbData.calendario_activa ?? false,
          calendario_frecuencia: dbData.calendario_frecuencia || 'personalizado',
          calendario_fecha_inicio: dbData.calendario_fecha_inicio || '',
          calendario_fecha_fin: dbData.calendario_fecha_fin || '',
          calendario_accion_tipo: dbData.calendario_accion_tipo || 'manual',
          calendario_accion_valor: dbData.calendario_accion_valor ?? 0,
          calendario_es_aumento: dbData.calendario_es_aumento ?? false,
          calendario_precio_objetivo: dbData.calendario_precio_objetivo,
          calendario_precio_final_tipo: dbData.calendario_precio_final_tipo || 'manual',
          calendario_precio_final_valor: dbData.calendario_precio_final_valor,
          calendario_precio_final_es_aumento: dbData.calendario_precio_final_es_aumento ?? false
        });
      } else {
        setConfig({
          ...defaultConfig,
          precio_inicial: undefined
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
    console.log('🔴 GUARDAR CONFIG - autoId recibido:', autoId);
    console.log('🔴 GUARDAR CONFIG - profesionalId recibido:', profesionalId);
    console.log('🔴 GUARDAR CONFIG - autoTitulo recibido:', autoTitulo);
    console.log('🔴 GUARDAR CONFIG - isValidUUID(autoId):', isValidUUID(autoId));
    
    try {
      // Validación específica: precio mínimo es obligatorio cuando autoajuste está activo
      if (config.activo && !config.precio_minimo) {
        toast({
          title: "Error de validación", 
          description: "Debe definir un precio mínimo de venta para evitar que el auto se venda a un precio bajo",
          variant: "destructive",
        });
        return;
      }
      
      // Validación: si hay precio máximo debe haber mínimo
      if (config.precio_maximo && !config.precio_minimo) {
        toast({
          title: "Error de validación", 
          description: "Debe definir un precio mínimo si establece un precio máximo",
          variant: "destructive",
        });
        return;
      }
      
      // Validación: precio máximo mayor que mínimo
      if (config.precio_minimo && config.precio_maximo && Number(config.precio_maximo) < Number(config.precio_minimo)) {
        toast({
          title: "Error de validación",
          description: "El precio máximo debe ser mayor o igual al precio mínimo",
          variant: "destructive",
        });
        return;
      }

      // Validaciones específicas para ajustes programados
      if (config.calendario_activa) {
        if (config.calendario_precio_objetivo && config.precio_minimo && 
            Number(config.calendario_precio_objetivo) < Number(config.precio_minimo)) {
          toast({
            title: "Error de validación",
            description: "El precio objetivo no puede ser menor al precio mínimo",
            variant: "destructive",
          });
          return;
        }

        if (config.calendario_precio_final_valor && config.precio_minimo && 
            config.calendario_precio_final_tipo === 'manual' &&
            Number(config.calendario_precio_final_valor) < Number(config.precio_minimo)) {
          toast({
            title: "Error de validación", 
            description: "El precio final no puede ser menor al precio mínimo",
            variant: "destructive",
          });
          return;
        }
      }
    } catch (error) {
      console.error('ERROR en validación:', error);
    }

    setSaving(true);
    try {
      // Si el autoId no es válido, evitamos guardar
      if (!isValidUUID(autoId)) {
        console.log('🔴 ERROR: autoId no es válido:', autoId);
        toast({
          title: "ID no válido",
          description: `El identificador del vehículo "${autoId}" no es válido. Por favor, contacte al soporte técnico.`,
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      const { calendario_precio_final_es_aumento, ...configPersist } = config;

      const configToSave = {
        profesional_id: profesionalId,
        auto_id: autoId,
        precio_inicial: config.precio_inicial,
        ...configPersist,
        calendario_fecha_inicio: config.calendario_fecha_inicio || null,
        calendario_fecha_fin: config.calendario_fecha_fin || null
      };

      if (config.id) {
        const { error } = await supabase
          .from('config_autoajuste_auto')
          .update(configToSave)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('config_autoajuste_auto')
          .insert(configToSave);
        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Configuración específica guardada correctamente"
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

    const precio = config.precio_inicial;
    const simulacionData = [];

    // Simular 30 días
    for (let dia = 1; dia <= 30; dia++) {
      let precioActual = precio;
      let cambios = [];

      // Simular reglas por demanda (suponiendo contactos aleatorios)
      if (config.demanda_activa) {
        const contactos = Math.floor(Math.random() * 20) + 1;
        const cumpleCondicion = config.demanda_umbral_tipo === 'menos_de' 
          ? contactos < config.demanda_contactos_umbral
          : contactos > config.demanda_contactos_umbral;

        if (cumpleCondicion) {
          const cambio = config.demanda_valor_tipo === 'porcentaje'
            ? precio * (config.demanda_valor / 100)
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

      // Simular reglas por tiempo
      if (config.tiempo_activa && dia >= config.tiempo_dias_limite) {
        const reduccion = config.tiempo_accion_tipo === 'porcentaje'
          ? precio * (config.tiempo_accion_valor / 100)
          : config.tiempo_accion_valor;
        precioActual -= reduccion;
        cambios.push(`Reducción por tiempo: -$${reduccion.toFixed(0)}`);
      }

      // Aplicar límites
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
        cambios
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
              <span className="text-lg font-semibold">Configuración Específica</span>
              <span className="text-sm text-muted-foreground">
                {autoTitulo || 'Auto específico'} - Autoajuste de precios
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
              {/* Alerta informativa */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-blue-900 mb-2">
                      Configuración Prioritaria
                    </h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Esta configuración específica sobrescribe la configuración general y solo se aplica a este vehículo.
                      Incluye precios específicos del vehículo.
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
                  {/* Activación principal */}
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
                      {/* Marco de Protección con precios específicos */}
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
                          <div className="bg-white rounded-lg p-4 border">
                            <Label htmlFor="precio_inicial" className="text-base font-medium">
                              Precio de Publicación
                            </Label>
                            <div className="relative mt-2">
                              <Input
                                id="precio_inicial"
                                type="text"
                                value={config.precio_inicial || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setConfig({ 
                                    ...config, 
                                    precio_inicial: value ? parseInt(value) : undefined 
                                  });
                                }}
                                placeholder="0"
                                className="pl-8"
                              />
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Precio inicial del vehículo para calcular ajustes
                            </p>
                          </div>

                          <div className="bg-white rounded-lg p-4 border">
                            <Label htmlFor="precio_minimo" className="text-base font-medium text-red-700">
                              Precio Mínimo *
                            </Label>
                            <div className="relative mt-2">
                              <Input
                                id="precio_minimo"
                                type="text"
                                value={config.precio_minimo || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setConfig({ 
                                    ...config, 
                                    precio_minimo: value ? parseInt(value) : undefined 
                                  });
                                }}
                                placeholder="0"
                                className="pl-8"
                              />
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Obligatorio - Protege contra ventas a precio bajo
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
                                value={config.precio_maximo || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setConfig({ 
                                    ...config, 
                                    precio_maximo: value ? parseInt(value) : undefined 
                                  });
                                }}
                                placeholder="0"
                                className="pl-8"
                              />
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Límite superior opcional para ajustes de precio
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Reglas por Demanda */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-blue-600" />
                              </div>
                              <span>Ajuste por Demanda</span>
                            </div>
                            <Switch
                              checked={config.demanda_activa}
                              onCheckedChange={(checked) => setConfig({ ...config, demanda_activa: checked })}
                            />
                          </CardTitle>
                        </CardHeader>
                        {config.demanda_activa && (
                          <CardContent className="space-y-4 bg-blue-50/50 rounded-lg m-4 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Evaluar cada</Label>
                                <Input
                                  type="number"
                                  value={config.demanda_dias_evaluar}
                                  onChange={(e) => setConfig({ 
                                    ...config, 
                                    demanda_dias_evaluar: parseInt(e.target.value) || 7 
                                  })}
                                  min="1"
                                  max="30"
                                  className="mt-1"
                                />
                                <span className="text-xs text-muted-foreground">días</span>
                              </div>
                              <div>
                                <Label>Condición</Label>
                                <Select 
                                  value={config.demanda_umbral_tipo} 
                                  onValueChange={(value: 'menos_de' | 'mas_de') => setConfig({ 
                                    ...config, 
                                    demanda_umbral_tipo: value 
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="menos_de">Menos de</SelectItem>
                                    <SelectItem value="mas_de">Más de</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Contactos umbral</Label>
                                <Input
                                  type="number"
                                  value={config.demanda_contactos_umbral}
                                  onChange={(e) => setConfig({ 
                                    ...config, 
                                    demanda_contactos_umbral: parseInt(e.target.value) || 5 
                                  })}
                                  min="1"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Acción</Label>
                                <Select 
                                  value={config.demanda_accion_tipo} 
                                  onValueChange={(value: 'reducir' | 'aumentar') => setConfig({ 
                                    ...config, 
                                    demanda_accion_tipo: value 
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reducir">Reducir precio</SelectItem>
                                    <SelectItem value="aumentar">Aumentar precio</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Tipo de valor</Label>
                                <Select 
                                  value={config.demanda_valor_tipo} 
                                  onValueChange={(value: 'fijo' | 'porcentaje') => setConfig({ 
                                    ...config, 
                                    demanda_valor_tipo: value 
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="porcentaje">Porcentaje</SelectItem>
                                    <SelectItem value="fijo">Cantidad fija</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>
                                  Valor {config.demanda_valor_tipo === 'porcentaje' ? '(%)' : '($)'}
                                </Label>
                                <Input
                                  type="number"
                                  value={config.demanda_valor}
                                  onChange={(e) => setConfig({ 
                                    ...config, 
                                    demanda_valor: parseFloat(e.target.value) || 2 
                                  })}
                                  min="0"
                                  step={config.demanda_valor_tipo === 'porcentaje' ? '0.1' : '100'}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Reglas por Tiempo */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="h-5 w-5 text-orange-600" />
                              </div>
                              <span>Ajuste por Tiempo</span>
                            </div>
                            <Switch
                              checked={config.tiempo_activa}
                              onCheckedChange={(checked) => setConfig({ ...config, tiempo_activa: checked })}
                            />
                          </CardTitle>
                        </CardHeader>
                        {config.tiempo_activa && (
                          <CardContent className="space-y-4 bg-orange-50/50 rounded-lg m-4 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Días límite</Label>
                                <Input
                                  type="number"
                                  value={config.tiempo_dias_limite}
                                  onChange={(e) => setConfig({ 
                                    ...config, 
                                    tiempo_dias_limite: parseInt(e.target.value) || 20 
                                  })}
                                  min="1"
                                  className="mt-1"
                                />
                                <span className="text-xs text-muted-foreground">
                                  Reducir precio después de este tiempo
                                </span>
                              </div>
                              <div>
                                <Label>Método de ajuste</Label>
                                <Select 
                                  value={config.tiempo_accion_tipo} 
                                  onValueChange={(value: 'fijo' | 'porcentaje' | 'manual') => setConfig({ 
                                    ...config, 
                                    tiempo_accion_tipo: value 
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="porcentaje">Ajuste por porcentaje</SelectItem>
                                    <SelectItem value="fijo">Ajuste por cantidad fija</SelectItem>
                                    <SelectItem value="manual">Precio específico manual</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="flex items-center gap-2">
                                  {config.tiempo_accion_tipo === 'manual' 
                                    ? 'Precio específico ($)'
                                    : config.tiempo_accion_tipo === 'porcentaje' 
                                      ? (
                                        <span className="flex items-center gap-1">
                                          Cantidad de ajuste (%)
                                          {config.tiempo_es_aumento ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                          )}
                                        </span>
                                      )
                                      : (
                                        <span className="flex items-center gap-1">
                                          Cantidad de ajuste ($)
                                          {config.tiempo_es_aumento ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                          )}
                                        </span>
                                      )
                                  }
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={config.tiempo_accion_valor}
                                    onChange={(e) => setConfig({ 
                                      ...config, 
                                      tiempo_accion_valor: parseFloat(e.target.value) || 1 
                                    })}
                                    min="0"
                                    step={config.tiempo_accion_tipo === 'porcentaje' ? '0.1' : '100'}
                                    className="mt-1"
                                  />
                                  {config.tiempo_accion_tipo === 'manual' && (
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                      $
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {config.tiempo_accion_tipo !== 'manual' && (
                              <div className="mt-4 flex items-center gap-4">
                                <Label className="text-sm font-medium">Tipo de cambio:</Label>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={config.tiempo_es_aumento}
                                    onCheckedChange={(checked) => setConfig({ 
                                      ...config, 
                                      tiempo_es_aumento: checked 
                                    })}
                                  />
                                  <span className="text-sm font-medium">
                                    {config.tiempo_es_aumento ? (
                                      <span className="text-green-600 flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Aumentar precio
                                      </span>
                                    ) : (
                                      <span className="text-red-600 flex items-center gap-1">
                                        <TrendingDown className="h-4 w-4" />
                                        Reducir precio
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>

                      {/* Reglas por Calendario */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-purple-600" />
                              </div>
                              <span>Ajuste Programado</span>
                            </div>
                            <Switch
                              checked={config.calendario_activa}
                              onCheckedChange={(checked) => setConfig({ ...config, calendario_activa: checked })}
                            />
                          </CardTitle>
                        </CardHeader>
                        {config.calendario_activa && (
                          <CardContent className="space-y-6">
                            {/* Información del precio actual */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                              <Label className="text-base font-semibold text-blue-900 mb-4 block">Información de Precios</Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-3 rounded-lg border">
                                  <Label className="text-sm text-muted-foreground">Precio Actual</Label>
                                  <div className="text-xl font-bold text-green-600 mt-1">
                                    {config.precio_inicial ? formatearPrecio(config.precio_inicial) : 'No definido'}
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                  <Label className="text-sm text-muted-foreground">Precio Mínimo</Label>
                                  <div className="text-xl font-bold text-red-600 mt-1">
                                    {config.precio_minimo ? formatearPrecio(config.precio_minimo) : 'No definido'}
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                  <Label className="text-sm text-muted-foreground">Precio Objetivo Durante Periodo</Label>
                                  <div className="text-xl font-bold text-blue-600 mt-1">
                                    {(() => {
                                      if (config.calendario_precio_objetivo) {
                                        return formatearPrecio(config.calendario_precio_objetivo);
                                      } else if (config.precio_inicial && config.calendario_accion_tipo !== 'manual') {
                                        const precio = config.precio_inicial;
                                        let precioCalculado = precio;
                                        
                                        if (config.calendario_accion_tipo === 'porcentaje') {
                                          precioCalculado = config.calendario_es_aumento 
                                            ? precio * (1 + config.calendario_accion_valor / 100)
                                            : precio * (1 - config.calendario_accion_valor / 100);
                                        } else if (config.calendario_accion_tipo === 'fijo') {
                                          precioCalculado = config.calendario_es_aumento 
                                            ? precio + config.calendario_accion_valor
                                            : precio - config.calendario_accion_valor;
                                        }
                                        
                                        return formatearPrecio(precioCalculado);
                                      }
                                      return 'No definido';
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Periodo */}
                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-base font-medium mb-3 block">Periodo</Label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Defina las fechas de inicio y fin para el periodo personalizado
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Fecha inicio</Label>
                                  <Input
                                    type="date"
                                    value={config.calendario_fecha_inicio}
                                    onChange={(e) => setConfig({ 
                                      ...config, 
                                      calendario_fecha_inicio: e.target.value 
                                    })}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Fecha fin</Label>
                                  <Input
                                    type="date"
                                    value={config.calendario_fecha_fin}
                                    onChange={(e) => setConfig({ 
                                      ...config, 
                                      calendario_fecha_fin: e.target.value 
                                    })}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Precio durante el periodo */}
                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-base font-medium mb-3 block">Precio Durante el Periodo</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Método de configuración</Label>
                                    <Select 
                                     key="precio-durante-metodo-select"
                                     value={config.calendario_accion_tipo || 'porcentaje'} 
                                     onValueChange={(value: 'fijo' | 'porcentaje' | 'manual') => setConfig({ 
                                       ...config, 
                                       calendario_accion_tipo: value 
                                     })}
                                   >
                                     <SelectTrigger className="mt-1">
                                       <SelectValue placeholder="Selecciona un método" />
                                     </SelectTrigger>
                                     <SelectContent className="bg-popover border border-border shadow-lg z-[9999] max-h-60 overflow-auto">
                                       <SelectItem value="porcentaje">Ajuste por porcentaje</SelectItem>
                                       <SelectItem value="fijo">Ajuste por cantidad fija</SelectItem>
                                       <SelectItem value="manual">Precio específico manual</SelectItem>
                                     </SelectContent>
                                   </Select>
                                </div>
                                <div>
                                   <Label className="flex items-center gap-2">
                                     {config.calendario_accion_tipo === 'manual' 
                                       ? 'Precio específico ($)' 
                                       : config.calendario_accion_tipo === 'porcentaje' 
                                         ? (
                                           <span className="flex items-center gap-1">
                                             Cantidad de ajuste (%)
                                             {config.calendario_es_aumento ? (
                                               <TrendingUp className="h-4 w-4 text-green-600" />
                                             ) : (
                                               <TrendingDown className="h-4 w-4 text-red-600" />
                                             )}
                                           </span>
                                         )
                                         : (
                                           <span className="flex items-center gap-1">
                                             Cantidad de ajuste ($)
                                             {config.calendario_es_aumento ? (
                                               <TrendingUp className="h-4 w-4 text-green-600" />
                                             ) : (
                                               <TrendingDown className="h-4 w-4 text-red-600" />
                                             )}
                                           </span>
                                         )
                                     }
                                   </Label>
                                   <div className="relative">
                                      <Input
                                        type="number"
                                        value={config.calendario_accion_tipo === 'manual' 
                                          ? config.calendario_precio_objetivo || '' 
                                          : config.calendario_accion_valor || ''
                                        }
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          if (config.calendario_accion_tipo === 'manual') {
                                            setConfig({ 
                                              ...config, 
                                              calendario_precio_objetivo: value 
                                            });
                                          } else {
                                            setConfig({ 
                                              ...config, 
                                              calendario_accion_valor: value 
                                            });
                                          }
                                        }}
                                        min="0"
                                        step={config.calendario_accion_tipo === 'porcentaje' ? '0.1' : '1000'}
                                        className={`mt-1 ${
                                          config.calendario_accion_tipo === 'manual' || config.calendario_accion_tipo === 'fijo' 
                                            ? 'pl-10' 
                                            : 'pr-10'
                                        }`}
                                        placeholder="0"
                                      />
                                      {(config.calendario_accion_tipo === 'manual' || config.calendario_accion_tipo === 'fijo') && (
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                                          $
                                        </span>
                                      )}
                                      {config.calendario_accion_tipo === 'porcentaje' && (
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                                          %
                                        </span>
                                      )}
                                   </div>
                                </div>
                              </div>
                              
                               {config.calendario_accion_tipo !== 'manual' && (
                                 <div className="mt-4 flex items-center gap-4">
                                   <Label className="text-sm font-medium">Tipo de cambio:</Label>
                                   <div className="flex items-center gap-2">
                                     <Switch
                                       checked={config.calendario_es_aumento}
                                       onCheckedChange={(checked) => setConfig({ 
                                         ...config, 
                                         calendario_es_aumento: checked 
                                       })}
                                     />
                                     <span className="text-sm font-medium">
                                       {config.calendario_es_aumento ? (
                                         <span className="text-green-600 flex items-center gap-1">
                                           <TrendingUp className="h-4 w-4" />
                                           Aumentar precio
                                         </span>
                                       ) : (
                                         <span className="text-red-600 flex items-center gap-1">
                                           <TrendingDown className="h-4 w-4" />
                                           Reducir precio
                                         </span>
                                       )}
                                     </span>
                                   </div>
                                 </div>
                               )}
                            </div>

                            {/* Precio al final del periodo */}
                            <div className="bg-white rounded-lg p-4 border">
                              <Label className="text-base font-medium mb-3 block">Precio al Final del Periodo</Label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Configure el precio que tendrá el vehículo cuando termine el periodo programado
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Tipo de precio final</Label>
                                   <Select 
                                     value={config.calendario_precio_final_tipo} 
                                     onValueChange={(value: 'fijo' | 'porcentaje' | 'manual') => setConfig({ 
                                       ...config, 
                                       calendario_precio_final_tipo: value 
                                     })}
                                   >
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
                                     {config.calendario_precio_final_tipo === 'manual' 
                                       ? 'Precio final específico ($)'
                                       : config.calendario_precio_final_tipo === 'porcentaje' 
                                         ? 'Porcentaje de ajuste (%)'
                                         : 'Cantidad de ajuste ($)'
                                     }
                                   </Label>
                                   <div className="relative">
                                      <Input
                                        type="number"
                                        value={config.calendario_precio_final_valor || ''}
                                        onChange={(e) => setConfig({ 
                                          ...config, 
                                          calendario_precio_final_valor: parseFloat(e.target.value) || 0 
                                        })}
                                        min="0"
                                        step={config.calendario_precio_final_tipo === 'porcentaje' ? '0.1' : '1000'}
                                        className={`mt-1 ${
                                          config.calendario_precio_final_tipo === 'manual' || config.calendario_precio_final_tipo === 'fijo' 
                                            ? 'pl-10' 
                                            : 'pr-10'
                                        }`}
                                        placeholder="0"
                                      />
                                      {(config.calendario_precio_final_tipo === 'manual' || config.calendario_precio_final_tipo === 'fijo') && (
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                                          $
                                        </span>
                                      )}
                                      {config.calendario_precio_final_tipo === 'porcentaje' && (
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                                          %
                                        </span>
                                      )}
                                   </div>
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
                                           <TrendingUp className="h-4 w-4" />
                                           Aumentar precio
                                         </span>
                                       ) : (
                                         <span className="text-red-600 flex items-center gap-1">
                                           <TrendingDown className="h-4 w-4" />
                                           Reducir precio
                                         </span>
                                       )}
                                     </span>
                                   </div>
                                 </div>
                               )}
                               
                              {/* Vista previa del precio final */}
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <Label className="text-sm text-muted-foreground">Precio final calculado:</Label>
                                <div className="text-lg font-semibold text-gray-800 mt-1">
                                   {(() => {
                                     if (config.calendario_precio_final_tipo === 'manual') {
                                       return config.calendario_precio_final_valor ? formatearPrecio(config.calendario_precio_final_valor) : 'No definido';
                                     } else if (config.calendario_precio_final_tipo === 'porcentaje' && config.precio_inicial && config.calendario_precio_final_valor) {
                                       const precioFinal = config.precio_inicial * (config.calendario_precio_final_valor / 100);
                                       return formatearPrecio(precioFinal);
                                     } else if (config.calendario_precio_final_tipo === 'fijo' && config.precio_inicial && config.calendario_precio_final_valor) {
                                       const precioFinal = config.precio_inicial + config.calendario_precio_final_valor;
                                       return formatearPrecio(precioFinal);
                                     }
                                     return 'No calculado';
                                   })()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="simulacion" className="space-y-6 mt-0">
                  {config.precio_inicial ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Simulación de Precios</h3>
                        <Button onClick={calcularSimulacion} variant="outline">
                          <Calculator className="h-4 w-4 mr-2" />
                          Calcular Simulación
                        </Button>
                      </div>

                      {simulacion && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Proyección de 30 días</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {simulacion.slice(0, 10).map((dia: any) => (
                                <div key={dia.dia} className="flex justify-between items-center p-2 border-b">
                                  <span className="font-medium">Día {dia.dia}</span>
                                  <div className="text-right">
                                    <span className="font-semibold">{formatearPrecio(dia.precio)}</span>
                                    {dia.cambios.length > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        {dia.cambios.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Precio inicial requerido</h3>
                      <p className="text-muted-foreground">
                        Configure un precio inicial en la sección Marco de Protección para usar el simulador.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        <div className="shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardarConfiguracion} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
