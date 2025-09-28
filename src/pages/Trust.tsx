import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileCheck, 
  Wrench, 
  CreditCard, 
  CheckCircle, 
  Star,
  Clock,
  Users,
  DollarSign,
  Camera,
  Phone,
  MessageCircle,
  ArrowRight,
  AlertTriangle,
  Info,
  Search,
  Truck,
  Award,
  Lock,
  Building,
  HelpCircle,
  Eye,
  Banknote,
  Target,
  Settings
} from "lucide-react";

const serviciosPaquetes = [
  {
    id: "basico",
    nombre: "Trust Básico",
    precio: 2500,
    descripcion: "Perfecto para autos hasta $400,000",
    incluye: [
      "Verificación de documentos legales",
      "Consulta REPUVE y bases oficiales",
      "Verificación de adeudos",
      "Manejo seguro del pago (escrow)",
      "Seguro de transacción",
      "Soporte telefónico"
    ],
    tiempo: "24-48 horas",
    popular: false
  },
  {
    id: "completo",
    nombre: "Trust Completo",
    precio: 4500,
    descripcion: "La protección total para tu transacción",
    incluye: [
      "Todo lo del paquete Básico",
      "Inspección mecánica completa",
      "Revisión física detallada",
      "Reporte fotográfico",
      "Valuación profesional",
      "Historial de siniestros",
      "Garantía de transparencia"
    ],
    tiempo: "48-72 horas",
    popular: true
  },
  {
    id: "premium",
    nombre: "Trust Premium",
    precio: 6500,
    descripcion: "Para autos de lujo y alta gama",
    incluye: [
      "Todo lo del paquete Completo",
      "Perito especializado en marca",
      "Análisis de pintura especializado",
      "Verificación de modificaciones",
      "Financiamiento pre-aprobado",
      "Gestión completa de documentos",
      "Entrega a domicilio",
      "Garantía extendida"
    ],
    tiempo: "72-96 horas",
    popular: false
  }
];

const procesoPasos = [
  {
    numero: 1,
    titulo: "Agenda y registro",
    descripcion: "Recibimos los datos del auto y de las partes, y definimos sede y fecha de inspección",
    icon: Phone,
    tiempo: "24 hrs"
  },
  {
    numero: 2,
    titulo: "Inspección física y mecánica",
    descripcion: "Revisión de carrocería, chasis, interiores, kilometraje, tren motriz, frenos y suspensión. Escaneo OBD-II y prueba de ruta",
    icon: Wrench,
    tiempo: "2-4 hrs"
  },
  {
    numero: 3,
    titulo: "Revisión legal y documental",
    descripcion: "Validamos VIN/serie, factura/propiedad, historial de siniestros, reporte de robo, gravámenes y adeudos",
    icon: FileCheck,
    tiempo: "24 hrs"
  },
  {
    numero: 4,
    titulo: "Informe y valuación",
    descripcion: "Entregamos un reporte claro con hallazgos, costos estimados de reparación y una sugerencia de precio de mercado",
    icon: Info,
    tiempo: "12 hrs"
  },
  {
    numero: 5,
    titulo: "Contrato y cierre",
    descripcion: "Preparamos documentos de compraventa y acompañamos el trámite de traspaso",
    icon: FileCheck,
    tiempo: "2-4 hrs"
  },
  {
    numero: 6,
    titulo: "Pago en custodia (escrow)",
    descripcion: "El comprador deposita en cuenta de custodia; liberamos el pago al vendedor solo cuando se cumplen las condiciones acordadas",
    icon: CreditCard,
    tiempo: "Inmediato"
  },
  {
    numero: 7,
    titulo: "Financiamiento opcional",
    descripcion: "Si el auto aprueba la revisión, gestionamos crédito con instituciones bancarias/aliadas",
    icon: DollarSign,
    tiempo: "24-48 hrs"
  },
  {
    numero: 8,
    titulo: "Garantía mecánica opcional",
    descripcion: "Complementamos con garantías extendidas a través de aliados, dependiendo del modelo y año",
    icon: Shield,
    tiempo: "Al finalizar"
  }
];

const beneficiosCompradores = [
  {
    titulo: "Compra segura",
    descripcion: "El auto se entrega sin adeudos ocultos ni problemas legales",
    icon: Shield
  },
  {
    titulo: "Decisión informada",
    descripcion: "Reporte técnico + costos de reparación estimados",
    icon: Info
  },
  {
    titulo: "Pago protegido",
    descripcion: "Tu dinero se libera solo al cumplirse las condiciones",
    icon: Lock
  },
  {
    titulo: "Financiamiento entre particulares",
    descripcion: "Compra el auto que quieras con crédito bancario, con enganche y plazo a tu medida",
    icon: Banknote
  }
];

const beneficiosVendedores = [
  {
    titulo: "Pago garantizado y sin riesgos",
    descripcion: "Evitamos fraudes y operaciones inseguras; recibes tu pago de forma segura",
    icon: Shield
  },
  {
    titulo: "Cierre ágil",
    descripcion: "Te acompañamos en la firma y entrega, con documentos listos",
    icon: Clock
  },
  {
    titulo: "Más compradores potenciales",
    descripcion: "Si el comprador usa financiamiento, tú cobras de contado",
    icon: Users
  }
];

const revisionesAuto = [
  {
    categoria: "Legal",
    items: ["VIN/serie", "Propiedad/factura", "Reporte de robo", "Gravámenes y adeudos", "Historial de importación si aplica"],
    icon: FileCheck
  },
  {
    categoria: "Físico",
    items: ["Estructura", "Pintura", "Alineación de paneles", "Cristales y luces", "Interiores"],
    icon: Eye
  },
  {
    categoria: "Mecánico",
    items: ["Motor", "Transmisión", "Enfriamiento", "Frenos", "Suspensión", "Dirección"],
    icon: Wrench
  },
  {
    categoria: "Electrónico",
    items: ["Escaneo OBD-II", "Test de batería/carga", "Sensores y testigos"],
    icon: Settings
  }
];

const preguntasFrecuentes = [
  {
    pregunta: "¿Qué pasa si el auto no aprueba?",
    respuesta: "Puedes corregir las observaciones y revaluar, negociar precio o descartar la compra sin liberar el pago."
  },
  {
    pregunta: "¿Ustedes son banco?",
    respuesta: "No. El financiamiento lo otorgan instituciones financieras aliadas; nosotros gestionamos y la decisión final depende de que el comprador sea sujeto de crédito."
  },
  {
    pregunta: "¿Puedo usar el servicio si ya encontré un auto por mi cuenta?",
    respuesta: "Sí. Justo para eso es: compras entre particulares con revisión, contrato y pago seguro."
  },
  {
    pregunta: "¿Pueden trabajar con agencias o lotes?",
    respuesta: "Sí. También brindamos el servicio como tercero de confianza."
  },
  {
    pregunta: "¿Incluyen garantía mecánica?",
    respuesta: "Podemos ofrecer garantías extendidas a través de aliados, dependiendo del modelo y año."
  }
];


const testimonios = [
  {
    nombre: "María González",
    tipo: "Compradora",
    calificacion: 5,
    comentario: "Servicio Trust me dio total tranquilidad. El reporte detectó problemas que no había visto y pude negociar mejor precio.",
    auto: "Honda Civic 2019",
    fecha: "Enero 2024"
  },
  {
    nombre: "Carlos Ruiz",
    tipo: "Vendedor",
    calificacion: 5,
    comentario: "Excelente servicio. El pago fue 100% seguro y la inspección ayudó a justificar mi precio de venta.",
    auto: "Toyota Camry 2020",
    fecha: "Diciembre 2023"
  },
  {
    nombre: "Agencia Premium Motors",
    tipo: "Profesional",
    calificacion: 5,
    comentario: "Usamos Trust para todas nuestras ventas a particulares. Aumentó la confianza de nuestros clientes significativamente.",
    auto: "Múltiples vehículos",
    fecha: "Noviembre 2023"
  }
];

const estadisticas = {
  transacciones_completadas: 2850,
  valor_promedio: 380000,
  satisfaccion: 98.5,
  tiempo_promedio: 2.1,
  problemas_detectados: 34
};

export default function Trust() {
  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Servicio Trust</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
          Compra o vende tu auto con un tercero de confianza. Revisión total, pago en custodia y financiamiento opcional.
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Transacciones seguras entre particulares, sin sorpresas.
        </p>
        
        {/* Badge list */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {["Revisión legal", "Inspección mecánica", "Pago protegido", "Contrato y traspaso", "Financiamiento opcional"].map((badge) => (
            <Badge key={badge} variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {badge}
            </Badge>
          ))}
        </div>
        
        {/* Estadísticas de confianza */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.transacciones_completadas.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Transacciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatearPrecio(estadisticas.valor_promedio)}</div>
            <div className="text-sm text-muted-foreground">Valor Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.satisfaccion}%</div>
            <div className="text-sm text-muted-foreground">Satisfacción</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.tiempo_promedio}d</div>
            <div className="text-sm text-muted-foreground">Tiempo Proceso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{estadisticas.problemas_detectados}%</div>
            <div className="text-sm text-muted-foreground">Problemas Detectados</div>
          </div>
        </div>
      </div>

      {/* Qué es Trust Service */}
      <Card className="mb-12">
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold text-center mb-6">¿Qué es Servicio Trust?</h2>
          <p className="text-lg text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
            Servicio Trust es un servicio integral y tercero de confianza para vender o comprar un auto usado entre particulares. 
            Verificamos el vehículo (estado físico, mecánico y documentación) y a las partes (vendedor y comprador), 
            coordinamos la entrega segura del pago y, si lo deseas, gestionamos financiamiento bancario. 
            <strong className="text-foreground"> Nuestro objetivo: que la operación sea segura, transparente y sin sorpresas.</strong>
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="proceso" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
          <TabsTrigger value="proceso">Cómo Funciona</TabsTrigger>
          <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
          <TabsTrigger value="revision">Qué Revisamos</TabsTrigger>
          <TabsTrigger value="custodia">Pago en Custodia</TabsTrigger>
          <TabsTrigger value="faq">Preguntas</TabsTrigger>
          <TabsTrigger value="solicitar">Solicitar</TabsTrigger>
        </TabsList>

        <TabsContent value="proceso">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                ¿Cómo funciona? (paso a paso)
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Un proceso transparente y profesional que protege tanto a compradores como vendedores
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {procesoPasos.map((paso) => (
                <Card key={paso.numero} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <paso.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="text-lg font-semibold mb-2">{paso.numero}. {paso.titulo}</div>
                    <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{paso.descripcion}</p>
                    <Badge variant="outline">{paso.tiempo}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">Garantía de Satisfacción</h3>
                </div>
                <p className="text-green-800">
                  Si no estás completamente satisfecho con nuestro servicio, te devolvemos el 100% de tu dinero. 
                  Sin preguntas, sin complicaciones.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="beneficios">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Beneficios para todos
              </h2>
              <p className="text-muted-foreground">
                Servicio Trust protege tanto a compradores como vendedores
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Beneficios para compradores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Beneficios para compradores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {beneficiosCompradores.map((beneficio, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <beneficio.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{beneficio.titulo}</h4>
                        <p className="text-muted-foreground text-sm">{beneficio.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Beneficios para vendedores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Beneficios para vendedores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {beneficiosVendedores.map((beneficio, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <beneficio.icon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{beneficio.titulo}</h4>
                        <p className="text-muted-foreground text-sm">{beneficio.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revision">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                ¿Qué revisamos del auto?
              </h2>
              <p className="text-muted-foreground">
                Inspección integral en todos los aspectos críticos
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {revisionesAuto.map((revision, idx) => (
                <Card key={idx}>
                  <CardHeader className="text-center pb-4">
                    <revision.icon className="h-12 w-12 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">{revision.categoria}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {revision.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Target className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Resultado</h3>
                    <p className="text-foreground">
                      Un informe claro con semáforos (OK/Atención/Crítico), fotos y recomendaciones detalladas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custodia">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Pago en custodia (cómo te protege)
              </h2>
              <p className="text-muted-foreground">
                Tu dinero está seguro hasta que se cumplan todas las condiciones
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Depósito seguro</h3>
                  <p className="text-muted-foreground text-sm">
                    El comprador no paga directo al vendedor; deposita en custodia
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Liberación condicionada</h3>
                  <p className="text-muted-foreground text-sm">
                    Liberamos el pago solo cuando se firma y se entrega el auto con la documentación acordada
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Protección total</h3>
                  <p className="text-muted-foreground text-sm">
                    Si algo no se cumple, no liberamos los fondos y activamos el proceso acordado
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Financiamiento entre particulares (opcional)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Para el comprador:</h4>
                    <ul className="space-y-1 text-blue-700 text-sm">
                      <li>• Otorgado por bancos/aliados, sujeto a aprobación</li>
                      <li>• Tú eliges: enganche y plazo</li>
                      <li>• Requisito: que el auto apruebe la revisión</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Para el vendedor:</h4>
                    <ul className="space-y-1 text-blue-700 text-sm">
                      <li>• Vendedor cobra de contado</li>
                      <li>• Más compradores potenciales</li>
                      <li>• Transacción más rápida</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Preguntas frecuentes
              </h2>
              <p className="text-muted-foreground">
                Resolvemos las dudas más comunes sobre Servicio Trust
              </p>
            </div>
            
            <div className="grid gap-4 max-w-4xl mx-auto">
              {preguntasFrecuentes.map((faq, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">{faq.pregunta}</h3>
                        <p className="text-muted-foreground">{faq.respuesta}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Building className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Quiero comprar con Servicio Trust</h3>
                  <Button className="w-full">Iniciar compra segura</Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Quiero vender con pago seguro</h3>
                  <Button className="w-full">Iniciar venta segura</Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Banknote className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Solicitar financiamiento</h3>
                  <Button className="w-full">Solicitar crédito</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>


        <TabsContent value="testimonios">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Lo que dicen nuestros clientes
              </h2>
              <p className="text-muted-foreground">
                Más de 2,850 transacciones exitosas nos respaldan
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {testimonios.map((testimonio, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(testimonio.calificacion)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground mb-4 italic">"{testimonio.comentario}"</p>
                    
                    <div className="border-t pt-4">
                      <div className="font-semibold">{testimonio.nombre}</div>
                      <div className="text-sm text-muted-foreground">{testimonio.tipo}</div>
                      <div className="text-sm text-muted-foreground">{testimonio.auto}</div>
                      <div className="text-xs text-muted-foreground">{testimonio.fecha}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="solicitar">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Solicitar Servicio Trust</CardTitle>
                <p className="text-muted-foreground">
                  Completa la información para iniciar tu proceso Trust
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Usuario</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Soy comprador</option>
                      <option>Soy vendedor</option>
                      <option>Representante de agencia</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Paquete Deseado</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Trust Básico - $2,500</option>
                      <option>Trust Completo - $4,500</option>
                      <option>Trust Premium - $6,500</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Marca del Vehículo</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Ej: Toyota" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Modelo</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Ej: Corolla" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Año</label>
                    <input type="number" className="w-full p-2 border rounded-md" placeholder="2020" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Precio</label>
                    <input type="number" className="w-full p-2 border rounded-md" placeholder="$350,000" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Kilometraje</label>
                    <input type="number" className="w-full p-2 border rounded-md" placeholder="45,000" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Ubicación del Vehículo</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="Ciudad de México, CDMX" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre Completo</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Tu nombre completo" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Teléfono</label>
                    <input type="tel" className="w-full p-2 border rounded-md" placeholder="55 1234 5678" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <input type="email" className="w-full p-2 border rounded-md" placeholder="tu@email.com" />
                </div>
                
                  <div>
                    <label className="text-sm font-medium mb-2 block">Comentarios Adicionales</label>
                    <textarea 
                      className="w-full p-2 border rounded-md h-20" 
                      placeholder="Cualquier información adicional que consideres importante..."
                    ></textarea>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">¿Necesitas financiamiento?</h4>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="financiamiento" />
                      <label htmlFor="financiamiento" className="text-sm">
                        Sí, quiero información sobre opciones de financiamiento
                      </label>
                    </div>
                  </div>
                  
                  <Button size="lg" className="w-full">
                    Solicitar Servicio Trust
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Nota legal:</strong> Servicio Trust actúa como tercero de confianza y coordinador de la operación. 
                      No es institución de crédito. El financiamiento es otorgado por instituciones financieras sujetas a análisis y aprobación.
                    </p>
                    <p>
                      La inspección es un dictamen técnico al momento de la revisión; no constituye garantía del desempeño futuro del vehículo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}