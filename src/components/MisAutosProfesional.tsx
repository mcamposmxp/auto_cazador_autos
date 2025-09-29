import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, BarChart3, Eye, Plus, Settings, TrendingUp, AlertTriangle, DollarSign, Edit3, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreditControl } from "@/hooks/useCreditControl";
import AnalisisMercado from "./AnalisisMercado";
import ConfigAutoajusteGeneral from "./ConfigAutoajusteGeneral";
import ConfigAutoajusteEspecifico from "./ConfigAutoajusteEspecifico";
import { NoCreditsDialog } from "./NoCreditsDialog";

interface AutoProfesional {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  kilometraje: number;
  estado_auto: string;
  precio_venta?: number;
  precio_minimo_venta?: number;
  precio_maximo_venta?: number;
  imagenes: string[];
  created_at: string;
  enviado_a_red?: boolean;
  fecha_envio_red?: string;
  marketDataAccessed?: boolean;
}

interface MarketAccessStatus {
  [key: string]: boolean;
}

interface DatosMercado {
  precioPromedio: number;
  rangoMinimo: number;
  rangoMaximo: number;
  demanda: 'baja' | 'moderada' | 'alta';
  competencia: 'baja' | 'moderada' | 'alta';
  vehiculosSimilares: number;
}

export default function MisAutosProfesional() {
  const [autosEnVenta, setAutosEnVenta] = useState<AutoProfesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuto, setSelectedAuto] = useState<AutoProfesional | null>(null);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [configAutoajusteGeneralOpen, setConfigAutoajusteGeneralOpen] = useState(false);
  const [configAutoajusteEspecificoOpen, setConfigAutoajusteEspecificoOpen] = useState(false);
  const [selectedAutoId, setSelectedAutoId] = useState<string | null>(null);
  const [selectedAutoTitulo, setSelectedAutoTitulo] = useState<string>("");
  const [editingPrecios, setEditingPrecios] = useState<AutoProfesional | null>(null);
  const [preciosForm, setPreciosForm] = useState<{minimo: string; maximo: string}>({minimo: '', maximo: ''});
  const [autoParaEnviar, setAutoParaEnviar] = useState<AutoProfesional | null>(null);
  const [marketAccessStatus, setMarketAccessStatus] = useState<MarketAccessStatus>({});
  const { toast } = useToast();
  const { consumeCredits, isLoading: creditLoading, showUpgradeDialog, setShowUpgradeDialog } = useCreditControl();

  // Funciones para abrir configuraciones
  const abrirConfiguracionGeneral = () => {
    setConfigAutoajusteGeneralOpen(true);
  };

  const abrirConfiguracionEspecifica = (autoId: string, titulo: string) => {
    setSelectedAutoId(autoId);
    setSelectedAutoTitulo(titulo);
    setConfigAutoajusteEspecificoOpen(true);
  };

  // Verificar acceso semanal a datos de mercado
  const checkWeeklyMarketAccess = async (autoId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { data, error } = await supabase.rpc('get_or_create_weekly_ad_credit', {
        p_user_id: session.user.id,
        p_vehicle_id: autoId
      });

      if (error) {
        console.error('Error checking weekly access:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in checkWeeklyMarketAccess:', error);
      return false;
    }
  };

  // Simular datos de mercado - en producción estos vendrían de la base de datos
  const simularDatosMercado = (auto: AutoProfesional): DatosMercado => {
    // Precios base simulados por marca/modelo
    const preciosBase: Record<string, number> = {
      'toyota': 250000,
      'honda': 230000,
      'nissan': 220000,
      'volkswagen': 240000,
      'chevrolet': 210000,
      'ford': 200000
    };

    const precioBase = preciosBase[auto.marca.toLowerCase()] || 220000;
    const factorAno = Math.max(0.7, 1 - (2024 - auto.ano) * 0.05);
    const factorKm = Math.max(0.6, 1 - (auto.kilometraje / 200000) * 0.4);
    
    const precioPromedio = Math.round(precioBase * factorAno * factorKm);
    
    return {
      precioPromedio,
      rangoMinimo: Math.round(precioPromedio * 0.75),
      rangoMaximo: Math.round(precioPromedio * 1.35),
      demanda: auto.ano >= 2020 ? 'alta' : auto.ano >= 2015 ? 'moderada' : 'baja',
      competencia: 'moderada',
      vehiculosSimilares: Math.floor(Math.random() * 15) + 5
    };
  };

  useEffect(() => {
    const cargarAutosEnVenta = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Obtener el ID del profesional
        const { data: profesional } = await supabase
          .from('profesionales')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profesional) {
          setProfesionalId(profesional.id);
        }

        // Cargar autos reales del inventario del profesional
        if (profesional?.id) {
          const { data: autosDb, error: autosError } = await supabase
            .from('autos_profesional_inventario')
            .select('id, marca, modelo, ano, kilometraje, estado, precio_actual, precio_minimo_venta, precio_maximo_venta, imagen_url, created_at')
            .eq('profesional_id', profesional.id)
            .order('created_at', { ascending: false });

          if (autosError) {
            console.error('Error obteniendo inventario:', autosError);
            setAutosEnVenta([]);
          } else {
            const autosMapeados: AutoProfesional[] = (autosDb || []).map((a: any) => ({
              id: a.id,
              marca: a.marca,
              modelo: a.modelo,
              ano: a.ano,
              kilometraje: a.kilometraje,
              estado_auto: a.estado || 'activo',
              precio_venta: Number(a.precio_actual),
              precio_minimo_venta: a.precio_minimo_venta ? Number(a.precio_minimo_venta) : undefined,
              precio_maximo_venta: a.precio_maximo_venta ? Number(a.precio_maximo_venta) : undefined,
              imagenes: a.imagen_url ? [a.imagen_url] : [],
              created_at: a.created_at,
              enviado_a_red: false,
            }));
            setAutosEnVenta(autosMapeados);
          }
        } else {
          setAutosEnVenta([]);
        }
      } catch (error) {
        console.error("Error cargando autos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarAutosEnVenta();
  }, []);

  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const guardarPrecios = async () => {
    if (!editingPrecios) return;

    try {
      const precioActual = editingPrecios.precio_venta;
      const precioMinimo = preciosForm.minimo ? Number(preciosForm.minimo) : null;
      const precioMaximo = preciosForm.maximo ? Number(preciosForm.maximo) : null;

      // Validaciones
      if (precioMinimo && precioMaximo && precioMinimo > precioMaximo) {
        toast({
          title: "Error de validación",
          description: "El precio mínimo no puede ser mayor que el precio máximo",
          variant: "destructive"
        });
        return;
      }

      // Actualizar en la base de datos - incluir precio_actual
      const { error: updateError } = await supabase
        .from('autos_profesional_inventario')
        .update({
          precio_actual: precioActual,
          precio_minimo_venta: precioMinimo,
          precio_maximo_venta: precioMaximo
        })
        .eq('id', editingPrecios.id);

      if (updateError) {
        throw updateError;
      }

      setEditingPrecios(null);
      
      toast({
        title: "Precios actualizados",
        description: "Los precios han sido guardados correctamente"
      });

    } catch (error) {
      console.error('Error guardando precios:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los precios",
        variant: "destructive"
      });
    }
  };

  const enviarAutoProfesionales = async (auto: AutoProfesional) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Crear o obtener cliente temporal para el profesional
      const { data: profesional } = await supabase
        .from('profesionales')
        .select('correo, contacto_principal')
        .eq('id', profesionalId)
        .single();

      if (!profesional) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del profesional",
          variant: "destructive"
        });
        return;
      }

      // Crear cliente temporal
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nombre_apellido: profesional.contacto_principal || 'Profesional',
          correo_electronico: profesional.correo || session.user.email || '',
          numero_telefonico: '0000000000',
          estado: 'General',
          ciudad: 'General',
          preferencia_contacto: 'correo'
        })
        .select()
        .single();

      if (clienteError || !cliente) {
        toast({
          title: "Error",
          description: "No se pudo crear el registro del cliente",
          variant: "destructive"
        });
        return;
      }

      // Insertar auto en autos_venta
      const { error: autoError } = await supabase
        .from('autos_venta')
        .insert({
          cliente_id: cliente.id,
          marca: auto.marca,
          modelo: auto.modelo,
          ano: auto.ano,
          kilometraje: auto.kilometraje,
          estado_auto: auto.estado_auto,
          servicios_agencia: false,
          documentos_orden: true,
          recibiendo_ofertas: true,
          version: '',
          comentarios_estado: `Auto enviado por profesional. Disponible por 5 días hasta ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
        });

      if (autoError) {
        toast({
          title: "Error",
          description: "No se pudo enviar el auto a la red de profesionales",
          variant: "destructive"
        });
        return;
      }

      // Actualizar estado local
      const autosActualizados = autosEnVenta.map(a => 
        a.id === auto.id 
          ? { 
              ...a, 
              enviado_a_red: true, 
              fecha_envio_red: new Date().toISOString() 
            }
          : a
      );
      
      setAutosEnVenta(autosActualizados);
      setAutoParaEnviar(null);
      
      toast({
        title: "Auto enviado exitosamente",
        description: "Tu auto estará disponible para la red de profesionales por 5 días"
      });

    } catch (error) {
      console.error("Error enviando auto:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el auto",
        variant: "destructive"
      });
    }
  };

  const estaEnviadoVigente = (auto: AutoProfesional) => {
    if (!auto.enviado_a_red || !auto.fecha_envio_red) return false;
    
    const fechaEnvio = new Date(auto.fecha_envio_red);
    const fechaExpiracion = new Date(fechaEnvio.getTime() + 5 * 24 * 60 * 60 * 1000);
    const ahora = new Date();
    
    return ahora < fechaExpiracion;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mis Autos</h2>
          <p className="text-muted-foreground">
            Gestiona tu inventario y analiza el mercado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={abrirConfiguracionGeneral}>
            <Settings className="h-4 w-4 mr-2" />
            Autoajuste General
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Auto
          </Button>
        </div>
      </div>

      {/* Sección de Autoajuste de Precios */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Autoajuste Programado de Precios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Configuración General</h4>
              <p className="text-sm text-muted-foreground">
                Define reglas que se aplicarán a todos tus autos automáticamente.
              </p>
              <Button variant="outline" size="sm" onClick={abrirConfiguracionGeneral}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Reglas Generales
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Configuración por Auto</h4>
              <p className="text-sm text-muted-foreground">
                Cada auto puede tener configuración específica (mayor prioridad).
              </p>
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>La configuración específica prevalece sobre la general</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {autosEnVenta.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes autos en venta</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando tu primer vehículo al inventario
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar mi primer auto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {autosEnVenta.map((auto) => (
            <Card key={auto.id} className="overflow-hidden">
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{auto.marca} {auto.modelo}</span>
                  <Badge variant="outline">{auto.ano}</Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Kilometraje</p>
                    <p className="font-medium">{auto.kilometraje.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estado</p>
                    <p className="font-medium">{auto.estado_auto}</p>
                  </div>
                </div>
                
                {auto.precio_venta && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Precio actual</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-primary">
                        {currency.format(auto.precio_venta)}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingPrecios(auto);
                          setPreciosForm({
                            minimo: auto.precio_minimo_venta?.toString() || '',
                            maximo: auto.precio_maximo_venta?.toString() || ''
                          });
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Precios de autoajuste */}
                <div className="pt-2 border-t space-y-2">
                  <h4 className="text-sm font-medium">Marco de Autoajuste</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Precio mínimo</p>
                      <p className="font-medium">
                        {auto.precio_minimo_venta 
                          ? currency.format(auto.precio_minimo_venta)
                          : <span className="text-amber-600">No definido</span>
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Precio máximo</p>
                      <p className="font-medium">
                        {auto.precio_maximo_venta 
                          ? currency.format(auto.precio_maximo_venta)
                          : <span className="text-muted-foreground">Sin límite</span>
                        }
                      </p>
                    </div>
                  </div>
                  {!auto.precio_minimo_venta && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Sin precio mínimo no hay autoajuste</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Sección de Información y Análisis */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Información
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={async () => {
                              // Verificar acceso semanal a datos de mercado
                              const hasAccess = await checkWeeklyMarketAccess(auto.id);
                              if (hasAccess) {
                                setSelectedAuto(auto);
                                setMarketAccessStatus({ ...marketAccessStatus, [auto.id]: true });
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white justify-start"
                            disabled={creditLoading}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {creditLoading ? "Verificando..." : "Análisis"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Análisis de Mercado - {auto.marca} {auto.modelo} {auto.ano}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedAuto && marketAccessStatus[selectedAuto.id] && (
                            <AnalisisMercado
                              marca={selectedAuto.marca}
                              modelo={selectedAuto.modelo}
                              ano={selectedAuto.ano}
                              precio={selectedAuto.precio_venta || simularDatosMercado(selectedAuto).precioPromedio}
                              kilometraje={selectedAuto.kilometraje}
                              datos={simularDatosMercado(selectedAuto)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Sección de Control de Precios */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Control de Precios
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditingPrecios(auto);
                          setPreciosForm({
                            minimo: auto.precio_minimo_venta?.toString() || '',
                            maximo: auto.precio_maximo_venta?.toString() || ''
                          });
                        }}
                        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 justify-start"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Precios
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => abrirConfiguracionEspecifica(auto.id, `${auto.marca} ${auto.modelo} ${auto.ano}`)}
                        className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 justify-start relative"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Autoajuste
                        {/* Indicador de configuración activa */}
                        <div className="absolute -top-1 -right-1">
                          <Badge variant="secondary" className="h-4 text-xs px-1 bg-green-500 text-white">
                            Activa
                          </Badge>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Sección de Ventas Adicionales */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Ventas Adicionales
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            variant={estaEnviadoVigente(auto) ? "default" : "outline"}
                            className={
                              estaEnviadoVigente(auto) 
                                ? "bg-green-600 hover:bg-green-700 text-white justify-start" 
                                : "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 justify-start"
                            }
                            onClick={() => setAutoParaEnviar(auto)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {estaEnviadoVigente(auto) ? "Enviado a Red" : "Red Profesionales"}
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>
                               {estaEnviadoVigente(auto) ? "Auto ya enviado a la red" : "Enviar auto a la red de profesionales"}
                             </AlertDialogTitle>
                             <AlertDialogDescription asChild>
                               <div>
                                 {estaEnviadoVigente(auto) ? (
                                   <>
                                     Tu auto <strong>{auto.marca} {auto.modelo} {auto.ano}</strong> ya está disponible en la red de profesionales.
                                     {auto.fecha_envio_red && (
                                       <>
                                         <br /><br />
                                         <strong>Enviado:</strong> {new Date(auto.fecha_envio_red).toLocaleDateString()}
                                         <br />
                                         <strong>Expira:</strong> {new Date(new Date(auto.fecha_envio_red).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                       </>
                                     )}
                                   </>
                                 ) : (
                                   <>
                                     ¿Estás seguro de que quieres enviar tu <strong>{auto.marca} {auto.modelo} {auto.ano}</strong> a la red de profesionales?
                                     <br /><br />
                                     <strong>¿Qué sucederá?</strong>
                                     <div className="mt-2 text-sm">
                                       <ul className="list-disc list-inside">
                                         <li>Tu auto estará visible para todos los profesionales por 5 días</li>
                                         <li>Los profesionales podrán hacer ofertas por tu vehículo</li>
                                         <li>Podrás revisar y aceptar las ofertas que recibas</li>
                                         <li>Después de 5 días, se retirará automáticamente de la red</li>
                                       </ul>
                                     </div>
                                   </>
                                 )}
                               </div>
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>
                               {estaEnviadoVigente(auto) ? "Cerrar" : "Cancelar"}
                             </AlertDialogCancel>
                             {!estaEnviadoVigente(auto) && (
                               <AlertDialogAction onClick={() => enviarAutoProfesionales(auto)}>
                                 Enviar a Red
                               </AlertDialogAction>
                             )}
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>

                       {/* Botón adicional para Subasta */}
                       <Button 
                         size="sm"
                         variant="outline"
                         className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 justify-start"
                       >
                         <Car className="h-4 w-4 mr-2" />
                         Enviar a Subasta
                       </Button>
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfigAutoajusteGeneral
        open={configAutoajusteGeneralOpen}
        onOpenChange={setConfigAutoajusteGeneralOpen}
        profesionalId={profesionalId}
      />
      
      <ConfigAutoajusteEspecifico
        open={configAutoajusteEspecificoOpen}
        onOpenChange={setConfigAutoajusteEspecificoOpen}
        profesionalId={profesionalId}
        autoId={selectedAutoId}
        autoTitulo={selectedAutoTitulo}
      />

      {/* Diálogo de edición de precios */}
      <Dialog open={!!editingPrecios} onOpenChange={(open) => !open && setEditingPrecios(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Configurar Precios
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingPrecios && `${editingPrecios.marca} ${editingPrecios.modelo} ${editingPrecios.ano}`}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Precio principal de venta */}
            <div className="space-y-2">
              <Label htmlFor="precio_actual_edit">Precio Actual de Venta *</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="precio_actual_edit"
                  type="text"
                  placeholder="450,000"
                  value={editingPrecios?.precio_venta?.toString().replace(/[^\d]/g, '') || ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    if (editingPrecios) {
                      setEditingPrecios({
                        ...editingPrecios,
                        precio_venta: Number(numericValue)
                      });
                    }
                  }}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Precio principal que aparece en el anuncio
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Configuración de autoajuste:</strong> Define los límites para ajustes automáticos de precios.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_minimo_edit">Precio Mínimo (Autoajuste)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="precio_minimo_edit"
                  type="text"
                  placeholder="250,000"
                  value={preciosForm.minimo}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    setPreciosForm({ ...preciosForm, minimo: numericValue });
                  }}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tope mínimo para reducciones automáticas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_maximo_edit">Precio Máximo (Autoajuste)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="precio_maximo_edit"
                  type="text"
                  placeholder="350,000"
                  value={preciosForm.maximo}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    setPreciosForm({ ...preciosForm, maximo: numericValue });
                  }}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tope máximo para aumentos automáticos
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingPrecios(null)}>
                Cancelar
              </Button>
              <Button onClick={guardarPrecios}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de sin créditos */}
      <NoCreditsDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
    </div>
  );
}