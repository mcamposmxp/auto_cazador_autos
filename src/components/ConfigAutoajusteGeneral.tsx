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

interface ConfigAutoajusteGeneralProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesionalId: string | null;
}

interface ConfigAutoajusteGeneral {
  id?: string;
  activo: boolean;
  // Sin precios iniciales, mínimos o máximos para configuración general
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
  calendario_accion_tipo: 'fijo' | 'porcentaje';
  calendario_accion_valor: number;
  calendario_es_aumento: boolean;
}

const defaultConfig: ConfigAutoajusteGeneral = {
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
  calendario_accion_tipo: 'porcentaje',
  calendario_accion_valor: 1,
  calendario_es_aumento: false
};

export default function ConfigAutoajusteGeneral({
  open,
  onOpenChange,
  profesionalId
}: ConfigAutoajusteGeneralProps) {
  const [config, setConfig] = useState<ConfigAutoajusteGeneral>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && profesionalId) {
      cargarConfiguracion();
    }
  }, [open, profesionalId]);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
          calendario_accion_tipo: dbData.calendario_accion_tipo || 'porcentaje',
          calendario_accion_valor: dbData.calendario_accion_valor ?? 1,
          calendario_es_aumento: dbData.calendario_es_aumento ?? false
        });
      } else {
        setConfig(defaultConfig);
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
    setSaving(true);
    try {
      const configToSave = {
        profesional_id: profesionalId,
        ...config,
        calendario_fecha_inicio: config.calendario_fecha_inicio || null,
        calendario_fecha_fin: config.calendario_fecha_fin || null
      };

      if (config.id) {
        const { error } = await supabase
          .from('config_autoajuste_general')
          .update(configToSave)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('config_autoajuste_general')
          .insert(configToSave);
        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Configuración general guardada correctamente"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">Configuración General</span>
              <span className="text-sm text-muted-foreground">
                Configuración predeterminada para todos los vehículos
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
              {/* Alerta informativa principal */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-blue-900 mb-2">
                      Configuración Base para Todos los Vehículos
                    </h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Esta configuración se aplica automáticamente a todos los vehículos que no tengan una configuración específica definida.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerta de requisito de precio mínimo */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-amber-900 mb-2">
                      REQUISITO OBLIGATORIO: Precio Mínimo de Venta
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        <strong>Los ajustes automáticos SOLO se aplicarán a vehículos que ya tengan un precio mínimo de venta capturado en su inventario.</strong>
                      </p>
                      <p className="text-sm text-amber-700">
                        Los vehículos sin precio mínimo definido quedarán exentos de cualquier ajuste automático para evitar ventas a precios muy bajos.
                      </p>
                      <div className="bg-amber-100 rounded-lg p-3 mt-3">
                        <p className="text-xs text-amber-800 font-medium">
                          💡 Para aplicar ajustes a un vehículo específico, primero defina su precio mínimo en la sección "Precios" del inventario.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activación principal */}
              <Card className="border-2 border-dashed border-muted-foreground/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Settings className="h-5 w-5 text-green-600" />
                      </div>
                      <span>Activar Autoajuste General</span>
                    </div>
                    <Switch
                      checked={config.activo}
                      onCheckedChange={(checked) => setConfig({ ...config, activo: checked })}
                    />
                  </CardTitle>
                </CardHeader>
                {!config.activo && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Active esta función para aplicar reglas de autoajuste a todos los vehículos sin configuración específica.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <strong>✓ Protección automática:</strong> Solo afectará vehículos que ya tengan precio mínimo definido.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {config.activo && (
                <>
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
                            <Label>Tipo de reducción</Label>
                            <Select 
                              value={config.tiempo_accion_tipo} 
                              onValueChange={(value: 'fijo' | 'porcentaje') => setConfig({ 
                                ...config, 
                                tiempo_accion_tipo: value 
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
                              Valor {config.tiempo_accion_tipo === 'porcentaje' ? '(%)' : '($)'}
                            </Label>
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
                          </div>
                        </div>
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
                      <CardContent className="space-y-4 bg-purple-50/50 rounded-lg m-4 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <Label>Periodo</Label>
                             <p className="text-sm text-muted-foreground mt-1">
                               Defina las fechas de inicio y fin para el periodo personalizado
                             </p>
                          </div>
                          <div>
                            <Label>Tipo de cambio</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Switch
                                checked={config.calendario_es_aumento}
                                onCheckedChange={(checked) => setConfig({ 
                                  ...config, 
                                  calendario_es_aumento: checked 
                                })}
                              />
                              <span className="text-sm">
                                {config.calendario_es_aumento ? 'Aumentar' : 'Reducir'} precio
                              </span>
                            </div>
                          </div>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo de valor</Label>
                            <Select 
                              value={config.calendario_accion_tipo} 
                              onValueChange={(value: 'fijo' | 'porcentaje') => setConfig({ 
                                ...config, 
                                calendario_accion_tipo: value 
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
                              Valor {config.calendario_accion_tipo === 'porcentaje' ? '(%)' : '($)'}
                            </Label>
                            <Input
                              type="number"
                              value={config.calendario_accion_valor}
                              onChange={(e) => setConfig({ 
                                ...config, 
                                calendario_accion_valor: parseFloat(e.target.value) || 1 
                              })}
                              min="0"
                              step={config.calendario_accion_tipo === 'porcentaje' ? '0.1' : '100'}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </>
              )}
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