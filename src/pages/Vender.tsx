import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import toyotaCamryImage from "@/assets/toyota-camry-2020.jpg";
import mazdaCX5Image from "@/assets/mazda-cx5-2021.jpg";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Edit,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Flame,
  BarChart3,
  AlertTriangle,
  Settings,
  Car,
  X,
  Star,
  Phone,
  Mail,
  MapPin,
  Gavel
} from "lucide-react";
import ConfigAutoajuste from "@/components/ConfigAutoajuste";
import { RecomendacionesIA } from '@/components/RecomendacionesIA';
import { CalificacionEstrellas } from "@/components/reviews/CalificacionEstrellas";
import { BadgeConfianza } from "@/components/reviews/BadgeConfianza";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Simplified auto-adjustment section component
const AutoAdjustmentSection = ({ 
  professionalId, 
  onConfigureGeneral, 
  onConfigureSpecific 
}: { 
  professionalId: string | null;
  onConfigureGeneral: () => void;
  onConfigureSpecific: (autoId: string, titulo: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Autoajuste Programado de Precios
            {isConfigured ? (
              <Badge variant="default" className="bg-success/20 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-warning border-warning/50">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Sin configurar
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Contraer" : "Configurar"}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <h4 className="font-medium mb-2">Configuración General</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Aplica reglas a todo tu inventario
                </p>
                <Button onClick={onConfigureGeneral} variant="outline" size="sm">
                  Configurar General
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <h4 className="font-medium mb-2">Configuración por Auto</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Usa el botón "Autoajuste" en cada auto
                </p>
                <Badge variant="secondary">Individual</Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Solo se aplicarán ajustes a autos con precio mínimo configurado
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Datos simulados de anuncios del usuario
const misAnuncios = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    titulo: "Toyota Camry XLE 2020",
    precio: 450000,
    precio_original: 465000,
    kilometraje: 45000,
    estado: "activo",
    dias_publicado: 8,
    vistas: 234,
    contactos: 12,
    ofertas_profesionales: 3,
    plataformas: ["MercadoLibre", "Facebook", "Instagram"],
    imagen: toyotaCamryImage,
    tiempo_estimado_venta: 15,
    sugerencia: "bajar_precio",
    precio_sugerido: 440000,
    demanda: {
      nivel: "Alta demanda",
      color: "text-success",
      bgColor: "bg-success/20",
    },
    competencia: {
      nivel: "Baja competencia",
      cantidad: 5,
      color: "text-success",
      bgColor: "bg-success/20",
    },
    distribucion_precios: {
      muy_bajo: 8,
      bajo: 17,
      promedio: 50,
      alto: 20,
      muy_alto: 5,
      posicion_actual: "alto", // donde está el precio actual
      zona_optima: "El 50% se vende en rango promedio",
      dispersion: "Alta dispersión detectada",
      precio_minimo: 420000,
      precio_promedio: 445000,
      precio_maximo: 470000
    },
    distribucion_kilometraje: {
      muy_bajo: 12,
      bajo: 18,
      promedio: 45,
      alto: 20,
      muy_alto: 5,
      posicion_actual: "bajo", // donde está el kilometraje actual
      zona_optima: "El 45% tiene kilometraje promedio",
      dispersion: "Dispersión moderada",
      km_minimo: 15000,
      km_promedio: 85000,
      km_maximo: 150000
    },
    leads: [
      { nombre: "Carlos M.", fecha: "2024-01-15", mensaje: "¿Acepta intercambio?", tipo: "particular" },
      { nombre: "Ana G.", fecha: "2024-01-14", mensaje: "¿Está disponible para verlo?", tipo: "particular" }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    titulo: "Honda Accord Sport 2019",
    precio: 380000,
    precio_original: 380000,
    kilometraje: 125000,
    estado: "pausado",
    dias_publicado: 22,
    vistas: 156,
    contactos: 8,
    ofertas_profesionales: 1,
    plataformas: ["MercadoLibre"],
    imagen: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400",
    tiempo_estimado_venta: 35,
    sugerencia: "mejorar_anuncio",
    precio_sugerido: 375000,
    demanda: {
      nivel: "Demanda moderada",
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
    competencia: {
      nivel: "Alta competencia",
      cantidad: 18,
      color: "text-warning",
      bgColor: "bg-warning/20",
    },
    distribucion_precios: {
      muy_bajo: 10,
      bajo: 15,
      promedio: 45,
      alto: 25,
      muy_alto: 5,
      posicion_actual: "promedio",
      zona_optima: "El 45% se vende en rango promedio",
      dispersion: "Dispersión moderada",
      precio_minimo: 360000,
      precio_promedio: 385000,
      precio_maximo: 410000
    },
    distribucion_kilometraje: {
      muy_bajo: 8,
      bajo: 15,
      promedio: 55,
      alto: 18,
      muy_alto: 4,
      posicion_actual: "alto", // donde está el kilometraje actual
      zona_optima: "El 55% tiene kilometraje promedio",
      dispersion: "Baja dispersión",
      km_minimo: 45000,
      km_promedio: 95000,
      km_maximo: 140000
    },
    leads: []
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    titulo: "Mazda CX-5 Grand Touring 2021",
    precio: 520000,
    precio_original: 520000,
    kilometraje: 20000,
    estado: "vendido",
    dias_publicado: 12,
    vistas: 423,
    contactos: 28,
    ofertas_profesionales: 5,
    plataformas: ["MercadoLibre", "Facebook", "Seminuevos"],
    imagen: mazdaCX5Image,
    tiempo_estimado_venta: 0,
    fecha_venta: "2024-01-10",
    demanda: {
      nivel: "Muy alta demanda",
      color: "text-destructive",
      bgColor: "bg-destructive/20",
    },
    competencia: {
      nivel: "Muy baja competencia",
      cantidad: 3,
      color: "text-success",
      bgColor: "bg-success/20",
    },
    distribucion_precios: {
      muy_bajo: 5,
      bajo: 12,
      promedio: 58,
      alto: 20,
      muy_alto: 5,
      posicion_actual: "muy_alto",
      zona_optima: "El 58% se vende en rango promedio",
      dispersion: "Baja dispersión",
      precio_minimo: 500000,
      precio_promedio: 515000,
      precio_maximo: 530000
    },
    distribucion_kilometraje: {
      muy_bajo: 15,
      bajo: 25,
      promedio: 40,
      alto: 15,
      muy_alto: 5,
      posicion_actual: "muy_bajo", // donde está el kilometraje actual
      zona_optima: "El 40% tiene kilometraje promedio",
      dispersion: "Muy baja dispersión",
      km_minimo: 8000,
      km_promedio: 45000,
      km_maximo: 80000
    },
    leads: []
  }
];

// Datos simulados de autos similares para cada anuncio
const autosSimilares = {
  "550e8400-e29b-41d4-a716-446655440001": [ // Para Toyota Camry
    {
      vehiculo: "Toyota Camry LE 2020",
      precio: 430000,
      kilometraje: 52000,
      ubicacion: "Ciudad de México",
      vendedor: "Particular",
      plataforma: "MercadoLibre"
    },
    {
      vehiculo: "Toyota Camry SE 2019",
      precio: 415000,
      kilometraje: 68000,
      ubicacion: "Guadalajara",
      vendedor: "Particular",
      plataforma: "AutoTrader"
    },
    {
      vehiculo: "Toyota Camry XLE 2021",
      precio: 475000,
      kilometraje: 35000,
      ubicacion: "Monterrey",
      vendedor: "Profesional",
      plataforma: "Kavak"
    },
    {
      vehiculo: "Toyota Camry Hybrid 2020",
      precio: 460000,
      kilometraje: 41000,
      ubicacion: "Puebla",
      vendedor: "Particular",
      plataforma: "Facebook"
    },
    {
      vehiculo: "Toyota Camry XSE 2019",
      precio: 440000,
      kilometraje: 58000,
      ubicacion: "Querétaro",
      vendedor: "Profesional",
      plataforma: "MercadoLibre"
    }
  ],
  "550e8400-e29b-41d4-a716-446655440002": [ // Para Honda Accord
    {
      vehiculo: "Honda Accord LX 2019",
      precio: 370000,
      kilometraje: 115000,
      ubicacion: "Ciudad de México",
      vendedor: "Particular",
      plataforma: "MercadoLibre"
    },
    {
      vehiculo: "Honda Accord EX 2018",
      precio: 355000,
      kilometraje: 98000,
      ubicacion: "Guadalajara",
      vendedor: "Particular",
      plataforma: "AutoTrader"
    },
    {
      vehiculo: "Honda Accord Sport 2020",
      precio: 395000,
      kilometraje: 78000,
      ubicacion: "Monterrey",
      vendedor: "Profesional",
      plataforma: "Kavak"
    }
  ],
  "550e8400-e29b-41d4-a716-446655440003": [ // Para Mazda CX-5
    {
      vehiculo: "Mazda CX-5 Touring 2021",
      precio: 510000,
      kilometraje: 25000,
      ubicacion: "Ciudad de México",
      vendedor: "Particular",
      plataforma: "MercadoLibre"
    },
    {
      vehiculo: "Mazda CX-5 Grand Select 2020",
      precio: 485000,
      kilometraje: 38000,
      ubicacion: "Guadalajara",
      vendedor: "Profesional",
      plataforma: "AutoTrader"
    },
    {
      vehiculo: "Mazda CX-5 Signature 2021",
      precio: 535000,
      kilometraje: 18000,
      ubicacion: "Monterrey",
      vendedor: "Profesional",
      plataforma: "Kavak"
    }
  ]
};

const estadisticas = {
  anuncios_activos: 2,
  total_vistas: 813,
  total_contactos: 48,
  tasa_conversion: 5.9,
  tiempo_promedio_venta: 18,
  precio_promedio: 450000
};

export default function Vender() {
  const [tabActiva, setTabActiva] = useState("anuncios");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("todos");
  const [tipoVendedorSeleccionado, setTipoVendedorSeleccionado] = useState("todos");
  const [autosSimilaresMostrar, setAutosSimilaresMostrar] = useState<string | null>(null);
  const [autosSimilaresData, setAutosSimilaresData] = useState<{[key: string]: any[]}>({});
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configAutoId, setConfigAutoId] = useState<string | null>(null);
  const [configAutoTitulo, setConfigAutoTitulo] = useState<string>("");
  const [configIsGeneral, setConfigIsGeneral] = useState(true);
  const [preciosDialogOpen, setPreciosDialogOpen] = useState(false);
  const [preciosAutoId, setPreciosAutoId] = useState<string | null>(null);
  const [preciosForm, setPreciosForm] = useState<{ minimo: string; maximo: string; publicacion: string }>({ minimo: '', maximo: '', publicacion: '' });
  const [preciosAutoajuste, setPreciosAutoajuste] = useState<Record<string, { minimo: number | null; maximo: number | null; publicacion: number }>>({});
  const [anunciosActualizados, setAnunciosActualizados] = useState(misAnuncios);
  const [autosEnviadosRed, setAutosEnviadosRed] = useState<Record<string, { enviado: boolean; fecha_envio: string }>>({});
  const [autoParaEnviar, setAutoParaEnviar] = useState<string | null>(null);
  const [isEnviandoAuto, setIsEnviandoAuto] = useState(false);
  const [isEnviandoSubasta, setIsEnviandoSubasta] = useState(false);
  const [configGeneralActiva, setConfigGeneralActiva] = useState(false);
  const [configsEspecificasActivas, setConfigsEspecificasActivas] = useState<Set<string>>(new Set());
  const [ofertasProfesionales, setOfertasProfesionales] = useState<any[]>([]);
  const [loadingOfertas, setLoadingOfertas] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const { data: profesional } = await supabase
        .from('profesionales')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (profesional) {
        setProfesionalId(profesional.id);
        // Verificar configuraciones de autoajuste después de cargar el profesional
        verificarConfiguracionesAutoajuste(profesional.id);
      }
      
      // Cargar ofertas profesionales
      await cargarOfertasProfesionales();
    };
    load();
  }, []);

  // Cargar datos reales de Supabase para "Mis Anuncios"
  useEffect(() => {
    const cargarMisAutos = async () => {
      if (!profesionalId) return;
      
      try {
        const { data: autos } = await supabase
          .from('autos_profesional_inventario')
          .select('*')
          .eq('profesional_id', profesionalId)
          .eq('estado', 'activo');

        if (autos) {
          // Convertir datos de Supabase al formato esperado
          const autosFormateados = autos.map(auto => ({
            id: auto.id,
            titulo: auto.titulo,
            precio: auto.precio_actual,
            precio_original: auto.precio_original || auto.precio_actual,
            kilometraje: auto.kilometraje,
            estado: auto.estado,
            dias_publicado: Math.floor((new Date().getTime() - new Date(auto.fecha_publicacion || auto.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            vistas: Math.floor(Math.random() * 500) + 50,
            contactos: Math.floor(Math.random() * 30) + 5,
            ofertas_profesionales: Math.floor(Math.random() * 8) + 1,
            plataformas: ["MercadoLibre", "Facebook"],
            imagen: auto.imagen_url || toyotaCamryImage,
            tiempo_estimado_venta: 15,
            sugerencia: calcularSugerenciaPrecio(auto),
            precio_sugerido: calcularPrecioSugerido(auto),
            // Agregar campos necesarios para la búsqueda de similares
            marca: auto.marca,
            modelo: auto.modelo,
            ano: auto.ano,
            demanda: {
              nivel: "Alta demanda",
              color: "text-success",
              bgColor: "bg-success/20",
            },
            competencia: {
              nivel: "Baja competencia",
              cantidad: 5,
              color: "text-success",
              bgColor: "bg-success/20",
            },
            distribucion_precios: {
              muy_bajo: 8,
              bajo: 17,
              promedio: 50,
              alto: 20,
              muy_alto: 5,
              posicion_actual: "promedio",
              zona_optima: "El 50% se vende en rango promedio",
              dispersion: "Dispersión moderada",
              precio_minimo: auto.precio_actual * 0.9,
              precio_promedio: auto.precio_actual * 0.98,
              precio_maximo: auto.precio_actual * 1.1
            },
            distribucion_kilometraje: {
              muy_bajo: 12,
              bajo: 18,
              promedio: 45,
              alto: 20,
              muy_alto: 5,
              posicion_actual: "bajo",
              zona_optima: "El 45% tiene kilometraje promedio",
              dispersion: "Dispersión moderada",
              km_minimo: auto.kilometraje * 0.8,
              km_promedio: auto.kilometraje * 1.2,
              km_maximo: auto.kilometraje * 1.5
            },
            leads: []
          }));
          
          setAnunciosActualizados(autosFormateados);
          
          // Inicializar precios de autoajuste
          const preciosIniciales: Record<string, { minimo: number | null; maximo: number | null; publicacion: number }> = {};
          autos.forEach(auto => {
            preciosIniciales[auto.id] = {
              minimo: auto.precio_minimo_venta,
              maximo: auto.precio_maximo_venta,
              publicacion: auto.precio_actual
            };
          });
          setPreciosAutoajuste(preciosIniciales);
        }
      } catch (error) {
        console.error('Error cargando autos:', error);
      }
    };

    cargarMisAutos();
  }, [profesionalId]);
  // Función para verificar configuraciones de autoajuste activas
  const verificarConfiguracionesAutoajuste = async (profId?: string) => {
    const profesionalIdToUse = profId || profesionalId;
    if (!profesionalIdToUse) return;

    try {
      // Verificar configuración general
      const { data: configGeneral } = await supabase
        .from('config_autoajuste_general')
        .select('activo')
        .eq('profesional_id', profesionalIdToUse)
        .eq('activo', true)
        .maybeSingle();

      setConfigGeneralActiva(!!configGeneral);

      // Verificar configuraciones específicas
      const { data: configsEspecificas } = await supabase
        .from('config_autoajuste_auto')
        .select('auto_id')
        .eq('profesional_id', profesionalIdToUse)
        .eq('activo', true);

      const autosConConfigEspecifica = new Set(
        configsEspecificas?.map(config => config.auto_id.toString()) || []
      );
      setConfigsEspecificasActivas(autosConConfigEspecifica);
    } catch (error) {
      console.error('Error verificando configuraciones:', error);
    }
  };

  // Funciones para calcular recomendaciones de precio basadas en datos del auto
  const calcularSugerenciaPrecio = (auto: any) => {
    const diasPublicado = Math.floor((new Date().getTime() - new Date(auto.fecha_publicacion || auto.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const precioActual = auto.precio_actual;
    const precioOriginal = auto.precio_original || precioActual;
    
    // Si el auto lleva más de 20 días publicado, sugerir bajar precio
    if (diasPublicado > 20) {
      return "bajar_precio";
    }
    
    // Si el precio actual está muy por encima del precio promedio del mercado, sugerir bajar
    const precioPromedio = precioActual * 0.98; // Simulación de precio promedio del mercado
    if (precioActual > precioPromedio * 1.15) {
      return "bajar_precio";
    }
    
    // Si el auto tiene pocos datos o fotos, sugerir mejorar anuncio
    if (!auto.imagen_url || !auto.descripcion || auto.descripcion.length < 50) {
      return "mejorar_anuncio";
    }
    
    // Si ha tenido poca actividad después de una semana, sugerir mejorar
    if (diasPublicado > 7 && diasPublicado <= 20) {
      return "mejorar_anuncio";
    }
    
    // Por defecto, mantener precio si está bien posicionado
    return "mantener";
  };

  const calcularPrecioSugerido = (auto: any) => {
    const precioActual = auto.precio_actual;
    const diasPublicado = Math.floor((new Date().getTime() - new Date(auto.fecha_publicacion || auto.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular precio sugerido basado en tiempo y posición en el mercado
    let factorReduccion = 1;
    
    if (diasPublicado > 30) {
      factorReduccion = 0.90; // Reducir 10% después de 30 días
    } else if (diasPublicado > 20) {
      factorReduccion = 0.95; // Reducir 5% después de 20 días
    } else if (diasPublicado > 10) {
      factorReduccion = 0.97; // Reducir 3% después de 10 días
    }
    
    return Math.round(precioActual * factorReduccion);
  };

  const cargarOfertasProfesionales = async () => {
    setLoadingOfertas(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener IDs de clientes del usuario por email
      const { data: clientesRows } = await supabase
        .from('clientes')
        .select('id')
        .eq('correo_electronico', user.email);

      if (!clientesRows || clientesRows.length === 0) {
        setOfertasProfesionales([]);
        return;
      }

      const clienteIds = clientesRows.map(c => c.id);

      // Obtener autos del usuario y sus ofertas
      const { data: autosData } = await supabase
        .from('autos_venta')
        .select(`
          id,
          marca,
          modelo,
          ano,
          kilometraje,
          estado_auto,
          created_at,
          recibiendo_ofertas,
          cliente_id
        `)
        .in('cliente_id', clienteIds);

      if (!autosData || autosData.length === 0) {
        setOfertasProfesionales([]);
        return;
      }

      // Obtener ofertas con información de profesionales y estadísticas
      const { data: ofertasData } = await supabase
        .from('ofertas')
        .select(`
          id,
          monto_oferta,
          monto_min,
          monto_max,
          preferente,
          comentarios,
          estado,
          created_at,
          auto_venta_id,
          profesional_id,
          profiles!ofertas_profesional_id_fkey (
            nombre,
            apellido,
            telefono_movil,
            tipo_usuario,
            negocio_nombre,
            reputacion,
            ubicacion_ciudad,
            ubicacion_estado,
            contacto_nombre,
            contacto_telefono,
            correo_electronico
          )
        `)
        .in('auto_venta_id', autosData.map(auto => auto.id))
        .order('created_at', { ascending: false });

      // Obtener información adicional de profesionales
      if (ofertasData && ofertasData.length > 0) {
        const profesionalIds = ofertasData.map(o => o.profesional_id);
        const { data: profesionalesData } = await supabase
          .from('profesionales')
          .select('user_id, direccion_ciudad, direccion_estado, negocio_nombre')
          .in('user_id', profesionalIds);
        
        // Combinar datos
        const ofertasConInfo = ofertasData.map(oferta => {
          const auto = autosData.find(a => a.id === oferta.auto_venta_id);
          const profesionalInfo = profesionalesData?.find(p => p.user_id === oferta.profesional_id);
          
          return {
            ...oferta,
            auto: auto,
            profesional_adicional: profesionalInfo
          };
        });
        
        setOfertasProfesionales(ofertasConInfo);
      } else {
        setOfertasProfesionales([]);
      }
    } catch (error) {
      console.error('Error cargando ofertas:', error);
    } finally {
      setLoadingOfertas(false);
    }
  };

  const manejarAccionOferta = async (ofertaId: string, accion: 'aceptada' | 'rechazada') => {
    try {
      const { error } = await supabase
        .from('ofertas')
        .update({ estado: accion })
        .eq('id', ofertaId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la oferta",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Oferta actualizada",
        description: `La oferta ha sido ${accion}`
      });

      // Recargar ofertas
      await cargarOfertasProfesionales();
    } catch (error) {
      console.error('Error actualizando oferta:', error);
    }
  };

  const pausarRecepcionOfertas = async (autoVentaId: string) => {
    try {
      const { error } = await supabase
        .from('autos_venta')
        .update({ recibiendo_ofertas: false })
        .eq('id', autoVentaId);

      if (error) throw error;

      toast({
        title: "Ofertas pausadas",
        description: "Ya no recibirás nuevas ofertas para este auto."
      });

      // Recargar ofertas
      await cargarOfertasProfesionales();
    } catch (error) {
      console.error('Error al pausar ofertas:', error);
      toast({
        title: "Error",
        description: "No se pudo pausar la recepción de ofertas.",
        variant: "destructive"
      });
    }
  };

  const eliminarDeOportunidades = async (autoVentaId: string) => {
    try {
      const { error } = await supabase
        .from('autos_venta')
        .delete()
        .eq('id', autoVentaId);

      if (error) throw error;

      toast({
        title: "Auto eliminado",
        description: "El auto fue eliminado de la sección de oportunidades."
      });

      // Recargar ofertas
      await cargarOfertasProfesionales();
    } catch (error) {
      console.error('Error al eliminar de oportunidades:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el auto de oportunidades.",
        variant: "destructive"
      });
    }
  };
  
  // Función para cargar autos similares desde la base de datos
  const cargarAutosSimilares = async (auto: any) => {
    try {
      console.log('Buscando autos similares para:', auto);
      
      // Extraer marca y modelo del auto
      const marca = auto.marca || auto.titulo?.split(' ')[0] || '';
      const modeloParts = auto.modelo || auto.titulo?.split(' ').slice(1, 3).join(' ') || '';
      const ano = auto.ano || 2020;
      
      console.log('Criterios de búsqueda:', { marca, modeloParts, ano });
      
      const { data, error } = await supabase
        .from('anuncios_vehiculos')
        .select('id, marca, modelo, ano, precio, kilometraje, ubicacion, sitio_web, activo')
        .ilike('marca', `%${marca}%`)
        .or(`modelo.ilike.%${modeloParts}%,titulo.ilike.%${modeloParts}%`)
        .gte('ano', ano - 3) // Autos de hasta 3 años más antiguos
        .lte('ano', ano + 3) // Autos de hasta 3 años más nuevos
        .eq('activo', true)
        .limit(20);

      console.log('Resultado consulta autos similares:', { data, error });

      if (error) {
        console.error('Error cargando autos similares:', error);
        return [];
      }

      const autosSimilares = data?.map(anuncio => ({
        vehiculo: `${anuncio.marca} ${anuncio.modelo} ${anuncio.ano}`,
        precio: anuncio.precio || 0,
        kilometraje: anuncio.kilometraje || 0,
        ubicacion: anuncio.ubicacion || 'No especificada',
        vendedor: 'Consultivo', // Contact info hidden for security
        plataforma: anuncio.sitio_web
      })) || [];

      console.log('Autos similares procesados:', autosSimilares);
      return autosSimilares;
    } catch (error) {
      console.error('Error cargando autos similares:', error);
      return [];
    }
  };

  // Función para manejar mostrar autos similares
  const toggleAutosSimilares = async (autoId: string) => {
    console.log('Toggle autos similares para ID:', autoId);
    
    if (autosSimilaresMostrar === autoId) {
      setAutosSimilaresMostrar(null);
      return;
    }

    setAutosSimilaresMostrar(autoId);
    
    // Solo cargar si no tenemos los datos ya
    if (!autosSimilaresData[autoId]) {
      console.log('Cargando datos para autoId:', autoId);
      console.log('anunciosActualizados disponibles:', anunciosActualizados);
      
      const auto = anunciosActualizados.find(a => a.id === autoId);
      console.log('Auto encontrado:', auto);
      
      if (auto) {
        const similares = await cargarAutosSimilares(auto);
        console.log('Similares obtenidos:', similares);
        setAutosSimilaresData(prev => ({
          ...prev,
          [autoId]: similares
        }));
      } else {
        console.log('No se encontró el auto con ID:', autoId);
      }
    } else {
      console.log('Datos ya disponibles para autoId:', autoId, autosSimilaresData[autoId]);
    }
  };

  const guardarPrecios = () => {
    try {
      // Validar que el precio de publicación sea obligatorio
      if (!preciosForm.publicacion || parseFloat(preciosForm.publicacion) <= 0) {
        toast({
          title: "Error de validación",
          description: "El precio de publicación es obligatorio",
          variant: "destructive"
        });
        return;
      }

      const minimoNum = preciosForm.minimo ? parseFloat(preciosForm.minimo) : null;
      const maximoNum = preciosForm.maximo ? parseFloat(preciosForm.maximo) : null;
      const publicacionNum = parseFloat(preciosForm.publicacion);
      
      // Validar rangos de precios
      if (minimoNum && publicacionNum < minimoNum) {
        toast({
          title: "Error de validación",
          description: "El precio de publicación no puede ser menor que el precio mínimo",
          variant: "destructive"
        });
        return;
      }

      if (maximoNum && publicacionNum > maximoNum) {
        toast({
          title: "Error de validación",
          description: "El precio de publicación no puede ser mayor que el precio máximo",
          variant: "destructive"
        });
        return;
      }

      if (minimoNum && maximoNum && minimoNum > maximoNum) {
        toast({
          title: "Error de validación",
          description: "El precio mínimo no puede ser mayor que el precio máximo",
          variant: "destructive"
        });
        return;
      }

      // Actualizar en Supabase y en el estado local
      const actualizarPrecios = async () => {
        try {
          const { error } = await supabase
            .from('autos_profesional_inventario')
            .update({
              precio_actual: publicacionNum,
              precio_minimo_venta: minimoNum,
              precio_maximo_venta: maximoNum
            })
            .eq('id', preciosAutoId);

          if (error) {
            toast({
              title: "Error",
              description: "No se pudieron guardar los precios en la base de datos",
              variant: "destructive"
            });
            return;
          }

          // Actualizar estado local
          setPreciosAutoajuste(prev => ({
            ...prev,
            [preciosAutoId]: { minimo: minimoNum, maximo: maximoNum, publicacion: publicacionNum },
          }));

          toast({
            title: "Precios actualizados",
            description: "Los precios se han guardado correctamente"
          });
        } catch (error) {
          console.error('Error actualizando precios:', error);
          toast({
            title: "Error",
            description: "Error al actualizar precios",
            variant: "destructive"
          });
        }
      };

      actualizarPrecios();

      // Actualizar el precio del auto en la lista de anuncios
      setAnunciosActualizados(prev => prev.map(anuncio => 
        anuncio.id === preciosAutoId 
          ? { ...anuncio, precio: publicacionNum }
          : anuncio
      ));

      setPreciosDialogOpen(false);
      toast({
        title: "Precios actualizados",
        description: "Los precios han sido configurados correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los precios",
        variant: "destructive"
      });
    }
  };

  const enviarAutoProfesionales = async (autoId: string) => {
    setIsEnviandoAuto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const auto = anunciosActualizados.find(a => a.id === autoId);
      if (!auto) return;

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
          marca: auto.titulo.split(' ')[0], // Primera palabra como marca
          modelo: auto.titulo.split(' ').slice(1).join(' '), // Resto como modelo
          ano: 2020, // Extraer del título si es posible
          kilometraje: auto.kilometraje,
          estado_auto: 'excelente',
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
      setAutosEnviadosRed(prev => ({
        ...prev,
        [autoId]: { 
          enviado: true, 
          fecha_envio: new Date().toISOString() 
        }
      }));
      
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
    } finally {
      setIsEnviandoAuto(false);
    }
  };

  const estaEnviadoVigente = (autoId: string) => {
    const envio = autosEnviadosRed[autoId];
    if (!envio || !envio.enviado) return false;
    
    const fechaEnvio = new Date(envio.fecha_envio);
    const fechaExpiracion = new Date(fechaEnvio.getTime() + 5 * 24 * 60 * 60 * 1000);
    const ahora = new Date();
    
    return ahora < fechaExpiracion;
  };

  const enviarAutoSubasta = async (autoId: string) => {
    setIsEnviandoSubasta(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const auto = anunciosActualizados.find(a => a.id === autoId);
      if (!auto) return;

      // Insertar auto en subasta_autos
      const { error: subastaError } = await supabase
        .from('subasta_autos')
        .insert({
          user_id: session.user.id,
          vendedor_nombre: session.user.user_metadata?.full_name || 'Usuario',
          vendedor_correo: session.user.email || '',
          vendedor_telefono: '0000000000', // Se puede pedir al usuario más tarde
          marca: auto.titulo.split(' ')[0], // Primera palabra como marca
          modelo: auto.titulo.split(' ').slice(1).join(' '), // Resto como modelo
          ano: 2020, // Extraer del título si es posible
          kilometraje: auto.kilometraje,
          estado_auto: 'excelente',
          servicios_agencia: false,
          documentos_orden: true,
          version: '',
          estado: 'General',
          ciudad: 'General',
          preferencia_contacto: 'correo',
          comentarios_estado: `Auto enviado a subasta desde panel de vendedor`
        });

      if (subastaError) {
        toast({
          title: "Error",
          description: "No se pudo enviar el auto a subasta",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Auto enviado a subasta exitosamente",
        description: "Tu auto estará disponible en la subasta para recibir ofertas de múltiples compradores"
      });

    } catch (error) {
      console.error("Error enviando auto a subasta:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el auto a subasta",
        variant: "destructive"
      });
    } finally {
      setIsEnviandoSubasta(false);
    }
  };

  // Función para calcular datos filtrados
  const calcularDatosFiltrados = (anuncio: any) => {
    // Simulamos diferentes distribuciones basadas en los filtros
    let factorEstado = 1;
    let factorTipoVendedor = 1;
    
    // Ajustar datos según estado seleccionado
    if (estadoSeleccionado !== "todos") {
      factorEstado = estadoSeleccionado === "Ciudad de México" ? 1.2 : 
                     estadoSeleccionado === "Monterrey" ? 1.1 : 
                     estadoSeleccionado === "Guadalajara" ? 1.05 : 0.9;
    }
    
    // Ajustar datos según tipo de vendedor
    if (tipoVendedorSeleccionado !== "todos") {
      factorTipoVendedor = tipoVendedorSeleccionado === "profesionales" ? 1.3 : 0.8;
    }
    
    const factor = factorEstado * factorTipoVendedor;
    
    // Calcular nueva competencia
    const nuevaCantidadCompetencia = Math.max(1, Math.round(anuncio.competencia.cantidad * factor));
    const nuevaCompetencia = {
      cantidad: nuevaCantidadCompetencia,
      nivel: nuevaCantidadCompetencia <= 5 ? "Baja competencia" : 
             nuevaCantidadCompetencia <= 10 ? "Competencia moderada" : "Alta competencia",
      color: nuevaCantidadCompetencia <= 5 ? "text-success" : 
             nuevaCantidadCompetencia <= 10 ? "text-primary" : "text-warning",
      bgColor: nuevaCantidadCompetencia <= 5 ? "bg-success/20" : 
               nuevaCantidadCompetencia <= 10 ? "bg-primary/20" : "bg-warning/20"
    };
    
    // Calcular nueva demanda
    const demandaFactor = 1 / factor; // Inversamente proporcional a la competencia
    const nuevaDemanda = {
      nivel: demandaFactor > 1.2 ? "Muy alta demanda" :
             demandaFactor > 1.0 ? "Alta demanda" :
             demandaFactor > 0.8 ? "Demanda moderada" : "Baja demanda",
      color: demandaFactor > 1.2 ? "text-red-600" :
             demandaFactor > 1.0 ? "text-green-600" :
             demandaFactor > 0.8 ? "text-blue-600" : "text-orange-600",
      bgColor: demandaFactor > 1.2 ? "bg-destructive/20" :
               demandaFactor > 1.0 ? "bg-success/20" :
               demandaFactor > 0.8 ? "bg-primary/20" : "bg-warning/20"
    };
    
    // Calcular nueva distribución de precios
    const distribucionPrecios = {
      ...anuncio.distribucion_precios,
      muy_bajo: Math.max(1, Math.round(anuncio.distribucion_precios.muy_bajo * (2 - factor))),
      bajo: Math.max(1, Math.round(anuncio.distribucion_precios.bajo * (1.5 - factor * 0.3))),
      promedio: Math.max(1, Math.round(anuncio.distribucion_precios.promedio * (1.2 - factor * 0.2))),
      alto: Math.max(1, Math.round(anuncio.distribucion_precios.alto * factor)),
      muy_alto: Math.max(1, Math.round(anuncio.distribucion_precios.muy_alto * factor * 1.2)),
      // Actualizar también los valores de referencia
      precio_minimo: Math.round(anuncio.distribucion_precios.precio_minimo * (0.95 + (factor - 1) * 0.1)),
      precio_promedio: Math.round(anuncio.distribucion_precios.precio_promedio * (0.98 + (factor - 1) * 0.05)),
      precio_maximo: Math.round(anuncio.distribucion_precios.precio_maximo * (1.02 + (factor - 1) * 0.1))
    };
    
    // Calcular nueva distribución de kilometraje
    const distribucionKilometraje = {
      ...anuncio.distribucion_kilometraje,
      muy_bajo: Math.max(1, Math.round(anuncio.distribucion_kilometraje.muy_bajo * (1.5 - factor * 0.3))),
      bajo: Math.max(1, Math.round(anuncio.distribucion_kilometraje.bajo * (1.3 - factor * 0.2))),
      promedio: Math.max(1, Math.round(anuncio.distribucion_kilometraje.promedio * (1.1 - factor * 0.1))),
      alto: Math.max(1, Math.round(anuncio.distribucion_kilometraje.alto * factor)),
      muy_alto: Math.max(1, Math.round(anuncio.distribucion_kilometraje.muy_alto * factor * 1.1)),
      // Actualizar también los valores de referencia
      km_minimo: Math.round(anuncio.distribucion_kilometraje.km_minimo * (0.9 + (factor - 1) * 0.15)),
      km_promedio: Math.round(anuncio.distribucion_kilometraje.km_promedio * (0.95 + (factor - 1) * 0.1)),
      km_maximo: Math.round(anuncio.distribucion_kilometraje.km_maximo * (1.1 + (factor - 1) * 0.2))
    };
    
    return {
      competencia: nuevaCompetencia,
      demanda: nuevaDemanda,
      distribucion_precios: distribucionPrecios,
      distribucion_kilometraje: distribucionKilometraje
    };
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const formatearKilometraje = (km: number) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
    }).format(km) + ' km';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-success/20 text-success">Activo</Badge>;
      case 'pausado':
        return <Badge className="bg-yellow-100 text-yellow-700">Pausado</Badge>;
      case 'vendido':
        return <Badge className="bg-primary/20 text-primary">Vendido</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getSugerenciaIcon = (sugerencia: string) => {
    switch (sugerencia) {
      case 'bajar_precio':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'mejorar_anuncio':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'mantener':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'optimizar':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSugerenciaTexto = (anuncio: any) => {
    switch (anuncio.sugerencia) {
      case 'bajar_precio':
        return `Considera bajar a ${formatearPrecio(anuncio.precio_sugerido)} para vender más rápido`;
      case 'mejorar_anuncio':
        return 'Agrega más fotos y mejora la descripción para aumentar interés';
      case 'mantener':
        return 'El precio está bien posicionado en el mercado';
      case 'optimizar':
        return 'Precio competitivo, considera optimizar fotos y descripción';
      default:
        return 'Analizando posicionamiento en el mercado...';
    }
  };

  const getPosicionColor = (posicion: string) => {
    switch (posicion) {
      case 'muy_bajo':
        return 'text-success';
      case 'bajo':
        return 'text-success';
      case 'promedio':
        return 'text-primary';
      case 'alto':
        return 'text-warning';
      case 'muy_alto':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPosicionTexto = (posicion: string) => {
    switch (posicion) {
      case 'muy_bajo':
        return 'Muy Bajo';
      case 'bajo':
        return 'Bajo';
      case 'promedio':
        return 'Promedio';
      case 'alto':
        return 'Alto';
      case 'muy_alto':
        return 'Muy Alto';
      default:
        return '';
    }
  };

  const calcularPosicionEnBarra = (distribucion: any, precioActual?: number) => {
    // Si se proporciona un precio actual, calcular la posición basada en ese precio
    if (precioActual && distribucion.precio_minimo && distribucion.precio_maximo) {
      const rango = distribucion.precio_maximo - distribucion.precio_minimo;
      const posicionRelativa = (precioActual - distribucion.precio_minimo) / rango;
      return Math.max(0, Math.min(100, posicionRelativa * 100));
    }
    
    // Si no, usar la lógica original basada en la posición categórica
    let acumulado = 0;
    switch (distribucion.posicion_actual) {
      case 'muy_bajo':
        return acumulado + distribucion.muy_bajo / 2;
      case 'bajo':
        acumulado += distribucion.muy_bajo;
        return acumulado + distribucion.bajo / 2;
      case 'promedio':
        acumulado += distribucion.muy_bajo + distribucion.bajo;
        return acumulado + distribucion.promedio / 2;
      case 'alto':
        acumulado += distribucion.muy_bajo + distribucion.bajo + distribucion.promedio;
        return acumulado + distribucion.alto / 2;
      case 'muy_alto':
        acumulado += distribucion.muy_bajo + distribucion.bajo + distribucion.promedio + distribucion.alto;
        return acumulado + distribucion.muy_alto / 2;
      default:
        return 50;
    }
  };

  // Estado para controlar si el input está siendo editado
  const [inputEnEdicion, setInputEnEdicion] = useState<{[key: string]: boolean}>({});

  // Función para formatear números con separadores de miles y .00 (solo para mostrar)
  const formatearNumeroInput = (valor: string, enEdicion: boolean = false) => {
    if (!valor) return '';
    if (enEdicion) return valor; // No formatear mientras se edita
    const numero = parseInt(valor);
    if (isNaN(numero)) return '';
    return numero.toLocaleString('es-MX') + '.00';
  };

  // Función para determinar la posición del precio actual basada en el precio real
  const determinarPosicionPrecio = (precio: number, distribucion: any) => {
    if (!distribucion.precio_minimo || !distribucion.precio_maximo) {
      return { posicion: 'promedio', color: 'text-primary' };
    }
    
    const rango = distribucion.precio_maximo - distribucion.precio_minimo;
    const posicionRelativa = (precio - distribucion.precio_minimo) / rango;
    
    if (posicionRelativa <= 0.2) {
      return { posicion: 'muy_bajo', color: 'text-success' };
    } else if (posicionRelativa <= 0.4) {
      return { posicion: 'bajo', color: 'text-primary' };
    } else if (posicionRelativa <= 0.6) {
      return { posicion: 'promedio', color: 'text-gray-600' };
    } else if (posicionRelativa <= 0.8) {
      return { posicion: 'alto', color: 'text-warning' };
    } else {
      return { posicion: 'muy_alto', color: 'text-destructive' };
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Anuncios</h1>
          <p className="text-muted-foreground">
            Gestiona tus anuncios y monitorea su rendimiento
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.anuncios_activos}</div>
            <div className="text-sm text-muted-foreground">Activos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.total_vistas}</div>
            <div className="text-sm text-muted-foreground">Vistas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.total_contactos}</div>
            <div className="text-sm text-muted-foreground">Contactos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.tasa_conversion}%</div>
            <div className="text-sm text-muted-foreground">Conversión</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.tiempo_promedio_venta}d</div>
            <div className="text-sm text-muted-foreground">Tiempo Venta</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{formatearPrecio(estadisticas.precio_promedio)}</div>
            <div className="text-sm text-muted-foreground">Precio Prom.</div>
          </CardContent>
        </Card>
      </div>

      {/* Autoajuste Programado de Precios (Profesionales) */}
      <Card className="bg-gradient-to-r from-muted/20 to-accent/20 border-primary/20 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Autoajuste Programado de Precios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Configuración General</h4>
                {configGeneralActiva && (
                  <Badge variant="default" className="bg-success/20 text-success text-xs">
                    <div className="w-2 h-2 bg-success rounded-full mr-1" />
                    Activa
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Define reglas que se aplicarán a todos tus autos automáticamente.
              </p>
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => {
                  setConfigIsGeneral(true);
                  setConfigDialogOpen(true);
                }} disabled={!profesionalId}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Reglas Generales
                </Button>
                {configGeneralActiva && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" 
                       title="Configuración general activa" />
                )}
              </div>
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

      {/* Filtros de Análisis */}
      <Card className="mb-6 border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-foreground" />
            <h3 className="text-base font-medium text-foreground">Filtros de Análisis</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Personaliza tu análisis de mercado</p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {/* Filtro de Estados */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Estado/Ubicación</label>
              <Select value={estadoSeleccionado} onValueChange={setEstadoSeleccionado}>
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Ciudad de México">Ciudad de México</SelectItem>
                  <SelectItem value="Guadalajara">Jalisco</SelectItem>
                  <SelectItem value="Monterrey">Nuevo León</SelectItem>
                  <SelectItem value="Puebla">Puebla</SelectItem>
                  <SelectItem value="Querétaro">Querétaro</SelectItem>
                  <SelectItem value="Tijuana">Baja California</SelectItem>
                  <SelectItem value="León">Guanajuato</SelectItem>
                  <SelectItem value="Mérida">Yucatán</SelectItem>
                  <SelectItem value="Toluca">Estado de México</SelectItem>
                  <SelectItem value="Cancún">Quintana Roo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {estadoSeleccionado === "todos" && "Mostrando resultados de todo México"}
                {estadoSeleccionado !== "todos" && `Mostrando solo resultados de ${estadoSeleccionado}`}
              </p>
            </div>

            {/* Filtro de Tipo de Vendedor */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Tipo de Vendedor</label>
              <Select value={tipoVendedorSeleccionado} onValueChange={setTipoVendedorSeleccionado}>
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los vendedores</SelectItem>
                  <SelectItem value="particulares">Solo particulares</SelectItem>
                  <SelectItem value="profesionales">Solo profesionales</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {tipoVendedorSeleccionado === "todos" && "Incluyendo particulares y profesionales"}
                {tipoVendedorSeleccionado === "particulares" && "Solo vendedores particulares"}
                {tipoVendedorSeleccionado === "profesionales" && "Solo vendedores profesionales"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="anuncios">Mis Anuncios</TabsTrigger>
          <TabsTrigger value="leads">Leads ({anunciosActualizados.reduce((acc, anuncio) => acc + (anuncio.leads?.length || 0), 0)})</TabsTrigger>
          <TabsTrigger value="ofertas">Ofertas Profesionales</TabsTrigger>
        </TabsList>

        <TabsContent value="anuncios" className="space-y-6">
           {anunciosActualizados.map((anuncio) => {
             const datosFiltrados = calcularDatosFiltrados(anuncio);
             const precioActualParaIndicador = (preciosDialogOpen && preciosAutoId === anuncio.id && preciosForm.publicacion && !isNaN(Number(preciosForm.publicacion)))
               ? Number(preciosForm.publicacion)
               : anuncio.precio;
             
             return (
            <Card key={anuncio.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Columna izquierda - Imagen y información básica */}
                  <div className="lg:col-span-1">
                    {/* Imagen */}
                    <div className="w-full h-48 mb-4">
                      <img 
                        src={anuncio.imagen} 
                        alt={anuncio.titulo}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* Información básica */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{anuncio.titulo}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          {getEstadoBadge(anuncio.estado)}
                          <span className="text-xs text-muted-foreground">
                            {anuncio.estado === 'vendido' ? 
                              `Vendido el ${anuncio.fecha_venta}` : 
                              `${anuncio.dias_publicado} días`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Precio destacado */}
                      <div className="bg-primary/5 p-3 rounded-lg border">
                        <div className="text-xl font-bold text-primary">
                          {formatearPrecio(anuncio.precio)}
                        </div>
                        {anuncio.precio !== anuncio.precio_original && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatearPrecio(anuncio.precio_original)}
                          </div>
                        )}
                        <div className="text-xs font-medium text-muted-foreground mt-1">
                          📏 {formatearKilometraje(anuncio.kilometraje)}
                        </div>
                        
                        {/* Precios autoajuste */}
                        {preciosAutoajuste[anuncio.id] && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {preciosAutoajuste[anuncio.id].minimo && (
                              <div>Mín: {formatearPrecio(preciosAutoajuste[anuncio.id].minimo)}</div>
                            )}
                            {preciosAutoajuste[anuncio.id].maximo && (
                              <div>Máx: {formatearPrecio(preciosAutoajuste[anuncio.id].maximo)}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Secciones agrupadas de botones */}
                      <div className="space-y-3">
                        {/* Sección de Control de Precios */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Control de Precios
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setPreciosAutoId(anuncio.id);
                                setPreciosForm({
                                  minimo: preciosAutoajuste[anuncio.id]?.minimo?.toString() || '',
                                  maximo: preciosAutoajuste[anuncio.id]?.maximo?.toString() || '',
                                  publicacion: preciosAutoajuste[anuncio.id]?.publicacion?.toString() || anuncio.precio.toString(),
                                });
                                setPreciosDialogOpen(true);
                              }}
                              className="bg-success/20 hover:bg-success/30 border-success/50 text-success justify-start"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Precios
                            </Button>
                            
                            <div className="relative">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  // Limpiar estado previo
                                  setConfigAutoId(null);
                                  setConfigAutoTitulo("");
                                  setConfigIsGeneral(true);
                                  setConfigDialogOpen(false);
                                  
                                  const idStr = anuncio.id.toString();
                                  console.log('🔍 ID del anuncio:', idStr, 'tipo:', typeof idStr);
                                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                  const esValidoUUID = uuidRegex.test(idStr);
                                  console.log('🔍 Es UUID válido?', esValidoUUID);
                                  if (!esValidoUUID) {
                                    console.log('❌ Bloqueando porque no es UUID válido');
                                    toast({
                                      title: "No disponible",
                                      description: "Este vehículo no tiene un ID válido para configurar ajustes específicos.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  console.log('✅ UUID válido, abriendo configuración');
                                  // Establecer nuevo estado después de la validación
                                  setTimeout(() => {
                                    setConfigAutoId(idStr);
                                    setConfigAutoTitulo(anuncio.titulo);
                                    setConfigIsGeneral(false);
                                    setConfigDialogOpen(true);
                                  }, 100);
                                }} 
                                disabled={!profesionalId}
                                className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 justify-start w-full"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Autoajuste
                              </Button>
                              {/* Badge "Activa" posicionado en la esquina superior derecha */}
                              {configsEspecificasActivas.has(anuncio.id.toString()) && (
                                <div className="absolute -top-1 -right-1">
                                  <Badge variant="secondary" className="h-4 text-xs px-1 bg-success text-success-foreground">
                                    Activa
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sección de Ventas Adicionales */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Ventas Adicionales
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  variant={estaEnviadoVigente(anuncio.id) ? "default" : "outline"}
                                  className={
                                    estaEnviadoVigente(anuncio.id) 
                                      ? "bg-success hover:bg-success/80 text-success-foreground justify-start" 
                                      : "bg-warning/20 hover:bg-warning/30 border-warning/50 text-warning justify-start"
                                  }
                                  onClick={() => setAutoParaEnviar(anuncio.id)}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  {estaEnviadoVigente(anuncio.id) ? "Enviado a Red" : "Red Profesionales"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {estaEnviadoVigente(anuncio.id) ? "Auto ya enviado a la red" : "Enviar auto a la red de profesionales"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div>
                                      {estaEnviadoVigente(anuncio.id) ? (
                                        <>
                                          Tu auto <strong>{anuncio.titulo}</strong> ya está disponible en la red de profesionales.
                                          {autosEnviadosRed[anuncio.id] && (
                                            <>
                                              <br /><br />
                                              <strong>Enviado:</strong> {new Date(autosEnviadosRed[anuncio.id].fecha_envio).toLocaleDateString()}
                                              <br />
                                              <strong>Expira:</strong> {new Date(new Date(autosEnviadosRed[anuncio.id].fecha_envio).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          ¿Estás seguro de que quieres enviar <strong>{anuncio.titulo}</strong> a la red de profesionales?
                                          <br /><br />
                                          Tu auto será visible para profesionales autorizados durante 5 días. Podrás recibir ofertas directas.
                                        </>
                                      )}
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  {!estaEnviadoVigente(anuncio.id) && (
                                    <AlertDialogAction 
                                      onClick={() => enviarAutoProfesionales(anuncio.id)}
                                      disabled={isEnviandoAuto}
                                    >
                                      {isEnviandoAuto ? "Enviando..." : "Enviar"}
                                    </AlertDialogAction>
                                  )}
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="bg-accent/20 hover:bg-accent/30 border-accent/50 text-accent justify-start"
                                >
                                  <Gavel className="h-4 w-4 mr-2" />
                                  Enviar a Subasta
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Enviar auto a subasta
                                  </AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div>
                                      ¿Estás seguro de que quieres enviar <strong>{anuncio.titulo}</strong> a la subasta?
                                      <br /><br />
                                      <strong>¿Qué sucederá?</strong>
                                      <div className="mt-2 text-sm">
                                        <ul className="list-disc list-inside space-y-1">
                                          <li>Tu auto estará disponible en la subasta pública</li>
                                          <li>Múltiples compradores podrán hacer ofertas</li>
                                          <li>Recibirás notificaciones de todas las ofertas</li>
                                          <li>Podrás revisar y aceptar la mejor oferta</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => enviarAutoSubasta(anuncio.id)}
                                    disabled={isEnviandoSubasta}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    {isEnviandoSubasta ? "Enviando..." : "Enviar a Subasta"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>

                      {/* Plataformas */}
                      <div>
                        <div className="text-xs font-medium text-foreground mb-2">Publicado en:</div>
                        <div className="flex flex-wrap gap-1">
                          {anuncio.plataformas.map((plataforma, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs px-2 py-0">
                              {plataforma}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna derecha - Estadísticas y análisis */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Estadísticas de rendimiento */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border">
                        <Eye className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-sm font-semibold">{anuncio.vistas}</div>
                          <div className="text-xs text-muted-foreground">Vistas</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border">
                        <MessageCircle className="h-4 w-4 text-success" />
                        <div>
                          <div className="text-sm font-semibold">{anuncio.contactos}</div>
                          <div className="text-xs text-muted-foreground">Contactos</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border">
                        <Users className="h-4 w-4 text-accent" />
                        <div>
                          <div className="text-sm font-semibold">{anuncio.ofertas_profesionales}</div>
                          <div className="text-xs text-muted-foreground">Ofertas Pro</div>
                        </div>
                      </div>
                      {anuncio.estado !== 'vendido' && (
                        <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border">
                          <Clock className="h-4 w-4 text-warning" />
                          <div>
                            <div className="text-sm font-semibold">{anuncio.tiempo_estimado_venta}d</div>
                            <div className="text-xs text-muted-foreground">Estimado</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Análisis de mercado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${datosFiltrados.demanda.bgColor} border`}>
                        {datosFiltrados.demanda.nivel === "Muy alta demanda" && <Flame className={`h-4 w-4 ${datosFiltrados.demanda.color}`} />}
                        {datosFiltrados.demanda.nivel === "Alta demanda" && <TrendingUp className={`h-4 w-4 ${datosFiltrados.demanda.color}`} />}
                        {datosFiltrados.demanda.nivel === "Demanda moderada" && <BarChart3 className={`h-4 w-4 ${datosFiltrados.demanda.color}`} />}
                        {datosFiltrados.demanda.nivel === "Baja demanda" && <AlertTriangle className={`h-4 w-4 ${datosFiltrados.demanda.color}`} />}
                        {datosFiltrados.demanda.nivel === "Muy baja demanda" && <TrendingDown className={`h-4 w-4 ${datosFiltrados.demanda.color}`} />}
                        <div>
                          <div className={`text-xs font-medium ${datosFiltrados.demanda.color}`}>Demanda</div>
                          <div className="text-xs text-muted-foreground">{datosFiltrados.demanda.nivel}</div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${datosFiltrados.competencia.bgColor} border`}>
                        {datosFiltrados.competencia.nivel === "Muy baja competencia" && <TrendingDown className={`h-4 w-4 ${datosFiltrados.competencia.color}`} />}
                        {datosFiltrados.competencia.nivel === "Baja competencia" && <TrendingDown className={`h-4 w-4 ${datosFiltrados.competencia.color}`} />}
                        {datosFiltrados.competencia.nivel === "Competencia moderada" && <BarChart3 className={`h-4 w-4 ${datosFiltrados.competencia.color}`} />}
                        {datosFiltrados.competencia.nivel === "Alta competencia" && <TrendingUp className={`h-4 w-4 ${datosFiltrados.competencia.color}`} />}
                        {datosFiltrados.competencia.nivel === "Competencia extrema" && <TrendingUp className={`h-4 w-4 ${datosFiltrados.competencia.color}`} />}
                        <div>
                          <div className={`text-xs font-medium ${datosFiltrados.competencia.color}`}>Competencia</div>
                          <div className="text-xs text-muted-foreground">{datosFiltrados.competencia.cantidad} autos en el mercado</div>
                        </div>
                      </div>
                    </div>

                    {/* Distribución de Precios */}
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-medium text-foreground">Distribución de precios:</div>
                          {(() => {
                             const posicionActual = determinarPosicionPrecio(precioActualParaIndicador, datosFiltrados.distribucion_precios);
                             return (
                               <div className={`px-2 py-1 rounded-md bg-white border-2 ${posicionActual.color} font-bold text-xs`} style={{borderColor: posicionActual.color.replace('text-', '')}}>
                                 Tu precio: {getPosicionTexto(posicionActual.posicion)}
                               </div>
                             );
                          })()}
                        </div>
                      
                      {/* Precios de referencia - arriba de la barra */}
                      <div className="flex justify-between text-xs font-medium text-foreground mb-1">
                        <span>{formatearPrecio(datosFiltrados.distribucion_precios.precio_minimo)}</span>
                        <span>{formatearPrecio(datosFiltrados.distribucion_precios.precio_promedio)}</span>
                        <span>{formatearPrecio(datosFiltrados.distribucion_precios.precio_maximo)}</span>
                      </div>
                      
                      <div className="relative mb-2">
                        {/* Barra de distribución */}
                        <div className="flex h-4 rounded-full overflow-hidden border">
                          <div 
                            className="bg-success"
                            style={{ width: `${datosFiltrados.distribucion_precios.muy_bajo}%` }}
                          />
                          <div 
                            className="bg-green-400" 
                            style={{ width: `${datosFiltrados.distribucion_precios.bajo}%` }}
                          />
                          <div 
                            className="bg-primary"
                            style={{ width: `${datosFiltrados.distribucion_precios.promedio}%` }}
                          />
                          <div 
                            className="bg-warning"
                            style={{ width: `${datosFiltrados.distribucion_precios.alto}%` }}
                          />
                          <div 
                            className="bg-destructive"
                            style={{ width: `${datosFiltrados.distribucion_precios.muy_alto}%` }}
                          />
                        </div>
                        
                        {/* Marcador de posición actual más prominente */}
                         <div 
                           className="absolute -top-1 h-6 w-1 bg-foreground z-10 rounded-sm shadow-lg"
                           style={{ left: `${calcularPosicionEnBarra(datosFiltrados.distribucion_precios, precioActualParaIndicador)}%`, transform: 'translateX(-50%)' }}
                         >
                           <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                         </div>
                      </div>
                      
                      {/* Etiquetas de referencia - debajo de la barra */}
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Mínimo</span>
                        <span>Promedio</span>
                        <span>Máximo</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>{datosFiltrados.distribucion_precios.muy_bajo}%</span>
                        <span>{datosFiltrados.distribucion_precios.bajo}%</span>
                        <span>{datosFiltrados.distribucion_precios.promedio}%</span>
                        <span>{datosFiltrados.distribucion_precios.alto}%</span>
                        <span>{datosFiltrados.distribucion_precios.muy_alto}%</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Muy Bajo</span>
                        <span>Bajo</span>
                        <span>Promedio</span>
                        <span>Alto</span>
                        <span>Muy Alto</span>
                      </div>
                      
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        ⚡ Zona Óptima: {anuncio.distribucion_precios.zona_optima} • {anuncio.distribucion_precios.dispersion}
                      </div>
                    </div>

                    {/* Distribución de Kilometraje */}
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-foreground">Distribución de kilometraje:</div>
                        <div className={`px-2 py-1 rounded-md bg-white border-2 ${getPosicionColor(anuncio.distribucion_kilometraje.posicion_actual)} font-bold text-xs`} style={{borderColor: getPosicionColor(anuncio.distribucion_kilometraje.posicion_actual).replace('text-', '')}}>
                          Tu kilometraje: {getPosicionTexto(anuncio.distribucion_kilometraje.posicion_actual)}
                        </div>
                      </div>
                      
                       {/* Kilometrajes de referencia - arriba de la barra */}
                       <div className="flex justify-between text-xs font-medium text-foreground mb-1">
                         <span>{formatearKilometraje(datosFiltrados.distribucion_kilometraje.km_minimo)}</span>
                         <span>{formatearKilometraje(datosFiltrados.distribucion_kilometraje.km_promedio)}</span>
                         <span>{formatearKilometraje(datosFiltrados.distribucion_kilometraje.km_maximo)}</span>
                       </div>
                      
                      <div className="relative mb-2">
                        {/* Barra de distribución */}
                        <div className="flex h-4 rounded-full overflow-hidden border">
                          <div 
                            className="bg-success" 
                            style={{ width: `${datosFiltrados.distribucion_kilometraje.muy_bajo}%` }}
                          />
                          <div 
                            className="bg-green-400" 
                            style={{ width: `${datosFiltrados.distribucion_kilometraje.bajo}%` }}
                          />
                          <div 
                            className="bg-primary" 
                            style={{ width: `${datosFiltrados.distribucion_kilometraje.promedio}%` }}
                          />
                          <div 
                            className="bg-warning" 
                            style={{ width: `${datosFiltrados.distribucion_kilometraje.alto}%` }}
                          />
                          <div 
                            className="bg-destructive" 
                            style={{ width: `${datosFiltrados.distribucion_kilometraje.muy_alto}%` }}
                          />
                        </div>
                        
                        {/* Marcador de posición actual más prominente */}
                        <div 
                          className="absolute -top-1 h-6 w-1 bg-foreground z-10 rounded-sm shadow-lg"
                          style={{ left: `${calcularPosicionEnBarra(datosFiltrados.distribucion_kilometraje)}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                      
                      {/* Etiquetas de referencia - debajo de la barra */}
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Mínimo</span>
                        <span>Promedio</span>
                        <span>Máximo</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>{datosFiltrados.distribucion_kilometraje.muy_bajo}%</span>
                        <span>{datosFiltrados.distribucion_kilometraje.bajo}%</span>
                        <span>{datosFiltrados.distribucion_kilometraje.promedio}%</span>
                        <span>{datosFiltrados.distribucion_kilometraje.alto}%</span>
                        <span>{datosFiltrados.distribucion_kilometraje.muy_alto}%</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Muy Bajo</span>
                        <span>Bajo</span>
                        <span>Promedio</span>
                        <span>Alto</span>
                        <span>Muy Alto</span>
                      </div>
                      
                      <div className="mt-2 p-2 bg-primary/10 rounded text-xs text-primary">
                        🚗 Zona Óptima: {anuncio.distribucion_kilometraje.zona_optima} • {anuncio.distribucion_kilometraje.dispersion}
                      </div>
                    </div>

                    {/* Plataformas */}
                    <div className="flex flex-wrap gap-2">
                      {anuncio.plataformas.map((plataforma, idx) => (
                        <Badge key={idx} variant="outline">
                          {plataforma}
                        </Badge>
                      ))}
                    </div>

                    {/* Recomendaciones IA */}
                    {anuncio.estado === 'activo' && (
                      <RecomendacionesIA 
                         anuncio={{
                           id: anuncio.id,
                           marca: anuncio.titulo.split(' ')[0] || 'Auto',
                           modelo: anuncio.titulo.split(' ').slice(1).join(' ') || 'Usado',
                           ano: (() => { const m = anuncio.titulo.match(/(20\d{2}|19\d{2})/); return m ? Number(m[1]) : new Date().getFullYear() - 5; })(),
                           kilometraje: anuncio.kilometraje,
                           precio: anuncio.precio,
                           estado: anuncio.estado,
                           descripcion: `${anuncio.titulo} • ${typeof anuncio.kilometraje === 'number' ? anuncio.kilometraje.toLocaleString() : anuncio.kilometraje} km • Publicado en ${Array.isArray(anuncio.plataformas) ? anuncio.plataformas.join(', ') : '1 plataforma'}`,
                           imagenes: anuncio.imagen ? [anuncio.imagen] : [],
                           ciudad: 'Ciudad de México',
                           created_at: new Date(Date.now() - anuncio.dias_publicado * 24 * 60 * 60 * 1000).toISOString()
                         }}
                        datosMercado={{
                          precioPromedio: anuncio.distribucion_precios?.precio_promedio || Math.round(anuncio.precio * (0.92 + (anuncio.id.charCodeAt(0) % 17) / 100)),
                          competencia: anuncio.competencia?.cantidad || (3 + (anuncio.id.charCodeAt(1) % 8)),
                          demanda: ((anuncio.demanda?.nivel || 'media').toLowerCase().includes('alta')
                            ? 'alta'
                            : (anuncio.demanda?.nivel || '').toLowerCase().includes('baja')
                              ? 'baja'
                              : 'media')
                        }}
                      />
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {anuncio.estado === 'activo' ? (
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      ) : anuncio.estado === 'pausado' && (
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Activar
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver Anuncio
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleAutosSimilares(anuncio.id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Ver Autos anunciados
                      </Button>
                      
                      {anuncio.estado !== 'vendido' && (
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>

                    {/* Autos Similares */}
                    {autosSimilaresMostrar === anuncio.id && autosSimilaresData[anuncio.id] && (
                      <div className="mt-4 p-4 bg-muted/20 rounded-lg border">
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="h-4 w-4 text-foreground" />
                          <h4 className="text-sm font-medium text-foreground">Autos Similares Actualmente Listados ({autosSimilaresData[anuncio.id]?.length || 0})</h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium text-muted-foreground">Vehículo</th>
                                <th className="text-left py-2 font-medium text-muted-foreground">Precio</th>
                                <th className="text-left py-2 font-medium text-muted-foreground">Kilometraje</th>
                                <th className="text-left py-2 font-medium text-muted-foreground">Ubicación</th>
                                <th className="text-left py-2 font-medium text-muted-foreground">Vendedor</th>
                                <th className="text-left py-2 font-medium text-muted-foreground">Plataforma</th>
                              </tr>
                            </thead>
                            <tbody>
                              {autosSimilaresData[anuncio.id]?.map((auto, idx) => (
                                <tr key={idx} className="border-b border-muted/50">
                                  <td className="py-2 font-medium text-foreground">{auto.vehiculo}</td>
                                  <td className="py-2 text-green-600 font-semibold">{formatearPrecio(auto.precio)}</td>
                                  <td className="py-2 text-muted-foreground">{formatearKilometraje(auto.kilometraje)}</td>
                                  <td className="py-2 text-muted-foreground">{auto.ubicacion}</td>
                                  <td className="py-2">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span className="text-muted-foreground">{auto.vendedor}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-muted-foreground">{auto.plataforma}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {anunciosActualizados.filter(anuncio => anuncio.leads && anuncio.leads.length > 0).map((anuncio) => (
            <Card key={anuncio.id}>
              <CardHeader>
                <CardTitle className="text-lg">{anuncio.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anuncio.leads.map((lead, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{lead.nombre}</div>
                        <div className="text-sm text-muted-foreground">{lead.mensaje}</div>
                        <div className="text-xs text-muted-foreground">{lead.fecha}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">Responder</Button>
                        <Button size="sm" variant="outline">Ver Perfil</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ofertas" className="space-y-6">
          {loadingOfertas ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando ofertas...</p>
                </div>
              </CardContent>
            </Card>
          ) : ofertasProfesionales.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Ofertas de Profesionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No has recibido ofertas aún</p>
                  <p className="text-sm">Las ofertas de profesionales aparecerán aquí cuando tengas anuncios enviados a la red.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Ofertas de Profesionales</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1">
                    {ofertasProfesionales.length} ofertas
                  </Badge>
                </div>
              </div>
              
              {ofertasProfesionales.map((oferta) => (
                <Card key={oferta.id} className={`${oferta.preferente ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Car className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {oferta.auto.marca} {oferta.auto.modelo} {oferta.auto.ano}
                          </CardTitle>
                          <CardDescription>
                            {oferta.auto.kilometraje.toLocaleString()} km • {oferta.auto.estado_auto}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {oferta.preferente && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Preferente
                          </Badge>
                        )}
                        <Badge variant={
                          oferta.estado === 'pendiente' ? 'default' :
                          oferta.estado === 'aceptada' ? 'secondary' : 'destructive'
                        }>
                          {oferta.estado}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Información del profesional */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Información del Profesional</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Datos de contacto */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {oferta.profiles?.negocio_nombre || `${oferta.profiles?.nombre} ${oferta.profiles?.apellido}`}
                            </span>
                          </div>
                          {oferta.profiles?.telefono_movil && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{oferta.profiles.telefono_movil}</span>
                            </div>
                          )}
                          {oferta.profiles?.correo_electronico && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{oferta.profiles.correo_electronico}</span>
                            </div>
                          )}
                          {(oferta.profiles?.ubicacion_ciudad || oferta.profiles?.ubicacion_estado) && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{oferta.profiles?.ubicacion_ciudad}, {oferta.profiles?.ubicacion_estado}</span>
                            </div>
                          )}
                        </div>

                        {/* Reputación y Reviews */}
                        <div className="space-y-3">
                          <div className="font-medium text-sm text-muted-foreground">Reputación</div>
                          
                          {oferta.stats_profesional ? (
                            <div className="space-y-2">
                              {/* Calificación con estrellas */}
                              <div className="flex items-center gap-2">
                                <CalificacionEstrellas 
                                  calificacion={oferta.stats_profesional.calificacion_promedio} 
                                  size="sm"
                                />
                                <span className="text-sm font-medium">
                                  {oferta.stats_profesional.calificacion_promedio.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({oferta.stats_profesional.total_reviews} reviews)
                                </span>
                              </div>
                              
                              {/* Badge de confianza */}
                              <div>
                                <BadgeConfianza badge={oferta.stats_profesional.badge_confianza} />
                              </div>
                            </div>
                          ) : oferta.profiles?.reputacion ? (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{oferta.profiles.reputacion}/5 de reputación</span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              <Badge variant="outline">Nuevo profesional</Badge>
                              <div className="text-xs mt-1">Sin reviews aún</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalles de la oferta */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-success/20 rounded-lg">
                        <div className="text-lg font-bold text-success">
                          {oferta.monto_oferta ? `$${oferta.monto_oferta.toLocaleString()}` : 'Por definir'}
                        </div>
                        <div className="text-sm text-green-600">Oferta</div>
                      </div>
                      
                      {oferta.monto_min && (
                        <div className="text-center p-3 bg-primary/20 rounded-lg">
                          <div className="text-lg font-bold text-primary">
                            ${oferta.monto_min.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-600">Mínimo</div>
                        </div>
                      )}
                      
                      {oferta.monto_max && (
                        <div className="text-center p-3 bg-accent/20 rounded-lg">
                          <div className="text-lg font-bold text-accent">
                            ${oferta.monto_max.toLocaleString()}
                          </div>
                          <div className="text-sm text-purple-600">Máximo</div>
                        </div>
                      )}
                    </div>

                    {/* Comentarios */}
                    {oferta.comentarios && (
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <h5 className="font-medium text-sm mb-1">Comentarios:</h5>
                        <p className="text-sm text-muted-foreground">{oferta.comentarios}</p>
                      </div>
                    )}

                    {/* Opciones de gestión del auto */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => pausarRecepcionOfertas(oferta.auto_venta_id)}
                        className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 font-medium"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar Ofertas
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => eliminarDeOportunidades(oferta.auto_venta_id)}
                        className="bg-destructive/20 text-destructive border-destructive/50 hover:bg-destructive/30 hover:border-destructive/60 font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Quitar de Oportunidades
                      </Button>
                    </div>

                    {/* Acciones */}
                    {oferta.estado === 'pendiente' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          onClick={() => manejarAccionOferta(oferta.id, 'aceptada')}
                          className="flex-1"
                        >
                          Aceptar Oferta
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => manejarAccionOferta(oferta.id, 'rechazada')}
                          className="flex-1"
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}

                    {/* Fecha */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Oferta recibida el {new Date(oferta.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de edición de precios individuales */}
      <Dialog open={preciosDialogOpen} onOpenChange={(open) => !open && setPreciosDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Editar Precios del Vehículo
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {preciosAutoId != null && misAnuncios.find(a => a.id === preciosAutoId)?.titulo}
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Información actual del vehículo */}
            {preciosAutoId != null && (() => {
              const anuncio = misAnuncios.find(a => a.id === preciosAutoId);
              const datosFiltrados = anuncio ? calcularDatosFiltrados(anuncio) : null;
              
              if (!anuncio || !datosFiltrados) return null;
              
              return (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 text-sm">Contexto de Mercado Actual</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Precio Actual:</span>
                      <div className="font-semibold text-primary">{formatearPrecio(anuncio.precio)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Competencia:</span>
                      <div className={`font-medium ${datosFiltrados.competencia.color}`}>
                        {datosFiltrados.competencia.cantidad} autos
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rango de Mercado:</span>
                      <div className="font-medium">
                        {formatearPrecio(datosFiltrados.distribucion_precios.precio_minimo)} - {formatearPrecio(datosFiltrados.distribucion_precios.precio_maximo)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Precio Promedio:</span>
                      <div className="font-medium">
                        {formatearPrecio(datosFiltrados.distribucion_precios.precio_promedio)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="precio_publicacion_edit" className="text-sm font-medium">
                  Precio de Publicación <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="precio_publicacion_edit"
                    type="text"
                    placeholder="450,000.00"
                    value={formatearNumeroInput(preciosForm.publicacion, inputEnEdicion.publicacion)}
                    onFocus={() => setInputEnEdicion({...inputEnEdicion, publicacion: true})}
                    onBlur={() => setInputEnEdicion({...inputEnEdicion, publicacion: false})}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^\d]/g, '');
                      setPreciosForm({ ...preciosForm, publicacion: numericValue });
                    }}
                    className="pl-10 h-12 text-lg font-medium border-2 focus:border-primary"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este será el precio mostrado en tus anuncios publicados
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_minimo_edit" className="text-sm font-medium">
                    Precio Mínimo <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="precio_minimo_edit"
                      type="text"
                      placeholder="250,000.00"
                      value={formatearNumeroInput(preciosForm.minimo, inputEnEdicion.minimo)}
                      onFocus={() => setInputEnEdicion({...inputEnEdicion, minimo: true})}
                      onBlur={() => setInputEnEdicion({...inputEnEdicion, minimo: false})}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        setPreciosForm({ ...preciosForm, minimo: numericValue });
                      }}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Límite inferior para autoajustes
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="precio_maximo_edit" className="text-sm font-medium">
                    Precio Máximo <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="precio_maximo_edit"
                      type="text"
                      placeholder="550,000.00"
                      value={formatearNumeroInput(preciosForm.maximo, inputEnEdicion.maximo)}
                      onFocus={() => setInputEnEdicion({...inputEnEdicion, maximo: true})}
                      onBlur={() => setInputEnEdicion({...inputEnEdicion, maximo: false})}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '');
                        setPreciosForm({ ...preciosForm, maximo: numericValue });
                      }}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Límite superior para autoajustes
                  </p>
                </div>
              </div>
            </div>

            {/* Vista previa de la posición en el mercado */}
            {preciosForm.publicacion && (() => {
              const anuncio = preciosAutoId != null ? misAnuncios.find(a => a.id === preciosAutoId) : null;
              const datosFiltrados = anuncio ? calcularDatosFiltrados(anuncio) : null;
              const nuevoPrecio = Number(preciosForm.publicacion);
              
              if (!anuncio || !datosFiltrados || isNaN(nuevoPrecio)) return null;
              
              const posicion = determinarPosicionPrecio(nuevoPrecio, datosFiltrados.distribucion_precios);
              
              return (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-medium mb-2 text-sm text-primary">
                    Vista Previa de Posicionamiento
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${posicion.color} bg-white border-2`} 
                         style={{borderColor: posicion.color.replace('text-', '')}}>
                      {getPosicionTexto(posicion.posicion)}
                    </div>
                    <span className="text-sm text-primary">
                      con el precio de {formatearPrecio(nuevoPrecio)}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setPreciosDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarPrecios} className="min-w-[120px]">
                <DollarSign className="h-4 w-4 mr-2" />
                Guardar Precios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-adjustment configuration dialog */}
      <ConfigAutoajuste
        open={configDialogOpen}
        onOpenChange={(open) => {
          setConfigDialogOpen(open);
          if (!open) {
            // Refrescar indicadores cuando se cierre el diálogo
            verificarConfiguracionesAutoajuste();
          }
        }}
        profesionalId={profesionalId}
        autoId={configAutoId}
        autoTitulo={configAutoTitulo}
        autoPrecioPublicacion={configAutoId ? (preciosAutoajuste[configAutoId]?.publicacion ?? anunciosActualizados.find(a => a.id === configAutoId)?.precio) : undefined}
        isGeneral={configIsGeneral}
      />
    </div>
  );
}