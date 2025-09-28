import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DollarSign, Shield, Clock, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
export default function VentaCuentaPropia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para las listas desplegables dependientes
  const [marcas, setMarcas] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [anos, setAnos] = useState<any[]>([]);
  const [versiones, setVersiones] = useState<any[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [cargandoAnos, setCargandoAnos] = useState(false);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  
  const [form, setForm] = useState({
    vendedor_nombre: "",
    vendedor_correo: "",
    vendedor_telefono: "",
    ciudad: "",
    estado: "",
    preferencia_contacto: "",
    marca: "",
    marcaId: "",
    modelo: "",
    modeloId: "",
    version: "",
    versionId: "",
    ano: "",
    anoId: "",
    kilometraje: "0",
    servicios_agencia: "no",
    documentos_orden: "si",
    estado_auto: "",
  });
  const [lastSubmission, setLastSubmission] = useState<any | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);

  const cargarSolicitudes = async (correo: string) => {
    const { data, error } = await (supabase as any)
      .from('vendedores_ayuda')
      .select('*')
      .eq('vendedor_correo', correo)
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error) setSolicitudes(data || []);
  };

  useEffect(() => {
    document.title = "Vende tu auto por tu cuenta | Financiamiento seguro";
    const desc = "Vende tu auto por tu cuenta con ayuda profesional y financiamiento bancario para tu comprador. Seguro, simple y al mejor precio.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      const userId = data.user?.id ?? null;
      setUserEmail(email);
      if (email) setForm((f) => ({ ...f, vendedor_correo: email }));
      if (userId) {
        (supabase as any)
          .from('profiles')
          .select('nombre,apellido,telefono_movil,correo_electronico,user_id')
          .eq('user_id', userId)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const correo = userEmail || form.vendedor_correo;
    if (correo) cargarSolicitudes(correo);
  }, [userEmail, form.vendedor_correo]);

  // Cargar marcas al montar el componente
  useEffect(() => {
    cargarMarcas();
  }, []);

  const cargarMarcas = async () => {
    try {
      setCargandoMarcas(true);
      const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {
        body: { catalogId: null }
      });

      if (error) {
        throw error;
      }

      if (data?.children) {
        setMarcas(data.children);
      }
    } catch (error) {
      console.error('Error cargando marcas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las marcas. Intenta recargar la página.",
        variant: "destructive"
      });
    } finally {
      setCargandoMarcas(false);
    }
  };

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (form.marcaId) {
      cargarModelos(form.marcaId);
    } else {
      setModelos([]);
      setAnos([]);
      setVersiones([]);
    }
  }, [form.marcaId]);

  // Cargar años cuando cambia el modelo
  useEffect(() => {
    if (form.modeloId) {
      cargarAnos(form.modeloId);
    } else {
      setAnos([]);
      setVersiones([]);
    }
  }, [form.modeloId]);

  // Cargar versiones cuando cambia el año
  useEffect(() => {
    if (form.anoId) {
      cargarVersiones(form.anoId);
    } else {
      setVersiones([]);
    }
  }, [form.anoId]);

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
    setForm(prev => ({
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
    setForm(prev => ({
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
    setForm(prev => ({
      ...prev,
      ano: ano?.name || "",
      anoId: anoId,
      version: "",
      versionId: ""
    }));
  };

  const manejarCambioVersion = (versionId: string) => {
    const version = versiones.find(v => v.id === versionId);
    setForm(prev => ({
      ...prev,
      version: version?.name || "",
      versionId: versionId
    }));
  };

  const isLoggedIn = Boolean(userEmail);
  const isCarFormComplete = Boolean(form.marca && form.modelo && form.ano && form.estado_auto);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/opciones-venta')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a opciones
          </Button>
          
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Vende tu auto por tu cuenta (y con nuestra ayuda)
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Si buscas el máximo rendimiento por tu venta y tienes experiencia en el proceso, esta opción es para ti. Sabemos que implica tiempo e inversión, pero con nuestra ayuda, podrás vender tu auto de manera más segura y con más opciones de pago para tu comprador. Suena bien, ¿verdad?
            </p>
          </div>
        </div>

        {/* ¿Cómo funciona? */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600">¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="rounded-xl md:rounded-2xl border border-blue-100 bg-blue-50/50 p-4 md:p-6">
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  Ofrecemos un servicio único que te permite vender tu auto a un particular, con la ventaja de ofrecer opciones de financiamiento bancario. Tú no necesitas ser un negocio ni realizar trámites complejos. El comprador, aunque no tenga el dinero total, podrá obtener un crédito y pagarte el 100% al contado.
                </p>
                <p className="text-muted-foreground text-sm md:text-base mb-6">
                  Para esto, solo necesitas encontrar al comprador interesado. Una vez que lo tengas, nosotros nos encargamos de guiarte en el proceso:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">1</span>
                      <p className="text-muted-foreground text-sm">Revisamos tu auto para verificar su estado físico y mecánico.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">2</span>
                      <p className="text-muted-foreground text-sm">Validamos la documentación y los pagos (tenencia, verificación, etc.).</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">3</span>
                      <p className="text-muted-foreground text-sm">Investigamos que no tenga reporte de robo ni adeudos.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">4</span>
                      <p className="text-muted-foreground text-sm">Confirmamos que el precio de venta esté dentro del rango promedio del mercado.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">5</span>
                      <p className="text-muted-foreground text-sm">Ofrecemos opciones de financiamiento al comprador a través de un crédito bancario.</p>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">6</span>
                      <p className="text-muted-foreground text-sm">Realizamos una investigación crediticia del comprador.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">7</span>
                      <p className="text-muted-foreground text-sm">Si el crédito es aprobado, la operación se autoriza y se prepara la documentación.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">8</span>
                      <p className="text-muted-foreground text-sm">El comprador paga el enganche y el banco realiza el pago total.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium">9</span>
                      <p className="text-muted-foreground text-sm">¡Tú recibes el pago completo y al contado!</p>
                    </div>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Ventajas y Desventajas - layout estilo referencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Ventajas de usar nuestro servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Mayor ganancia</h4>
                    <p className="text-muted-foreground text-sm">Obtienes el mejor precio por tu auto, ya que no hay intermediarios que resten valor a tu venta.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Venta con financiamiento</h4>
                    <p className="text-muted-foreground text-sm">Puedes ofrecer un crédito bancario a tu comprador, lo que amplía tus posibilidades de venta y te permite llegar a más interesados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Seguridad garantizada</h4>
                    <p className="text-muted-foreground text-sm">Nuestro proceso te protege de fraudes, estafas y asaltos. Nos encargamos de cerrar la operación en un entorno seguro y profesional. Además, la revisión del auto por nuestros expertos da confianza al comprador, lo que agiliza la venta.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Tú decides el precio</h4>
                    <p className="text-muted-foreground text-sm">Eres tú quien negocia el precio final con el comprador, sin presiones ni intermediarios.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Desventajas (y lo que tienes que hacer)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Requiere tiempo</h4>
                    <p className="text-muted-foreground text-sm">Debes encargarte de promocionar tu auto en redes sociales, sitios de clasificados, con amigos y conocidos hasta que encuentres a tu comprador ideal.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Inversión inicial</h4>
                    <p className="text-muted-foreground text-sm">Es necesario cubrir un costo mínimo por la revisión y validación de tu auto para garantizar que todo esté en orden. Esta pequeña inversión te da seguridad y confianza en todo el proceso.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmación post-envío */}
        {lastSubmission && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold">¡Solicitud recibida!</h3>
                  <p className="text-sm text-muted-foreground">
                    Folio: {lastSubmission.id} • Fecha: {new Date(lastSubmission.created_at ?? lastSubmission.fecha_registro).toLocaleString()} • Estado: Recibida
                  </p>
                  <p className="text-sm mt-2">
                    {(form.vendedor_nombre || lastSubmission.vendedor_nombre) || ""} — {(form.vendedor_telefono || lastSubmission.vendedor_telefono) || ""} — {(form.vendedor_correo || lastSubmission.vendedor_correo) || ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Auto: {lastSubmission.marca} {lastSubmission.modelo} {lastSubmission.version ? `(${lastSubmission.version})` : ""} {lastSubmission.ano ? `• ${lastSubmission.ano}` : ""} • {lastSubmission.kilometraje} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">¿Listo para vender por tu cuenta con financiamiento?</h3>
              <p className="text-muted-foreground mb-6">
                Te guiamos y ofrecemos crédito bancario a tu comprador para que recibas el 100% al contado.
              </p>
              <Button size="lg" className="mr-4" onClick={() => {
                const el = document.getElementById('validacion-usuario');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                Quiero vender con financiamiento
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/opciones-venta')}>
                Ver otras opciones
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Formulario para vendedores que requieren ayuda */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!userEmail || !form.marca || !form.modelo || !form.ano || !form.estado_auto) {
              toast({
                title: "Completa los campos requeridos",
                description: "Inicia sesión y completa los datos del auto.",
              });
              return;
            }
            if (!(form.vendedor_nombre || (profile && (profile.nombre || profile.apellido))) || !(form.vendedor_telefono || profile?.telefono_movil)) {
              toast({
                title: "Falta información de tu perfil",
                description: "Tu perfil debe tener nombre y teléfono para continuar.",
              });
              return;
            }
            setSubmitting(true);
            try {
              const { data: authData } = await supabase.auth.getUser();
              const { data, error } = await (supabase as any)
                .from('vendedores_ayuda')
                .insert({
                  user_id: authData.user?.id ?? null,
                  vendedor_nombre: form.vendedor_nombre || `${profile?.nombre ?? ""} ${profile?.apellido ?? ""}`.trim(),
                  vendedor_correo: form.vendedor_correo || userEmail || "",
                  vendedor_telefono: form.vendedor_telefono || profile?.telefono_movil || "",
                  ciudad: form.ciudad,
                  estado: form.estado,
                  preferencia_contacto: form.preferencia_contacto,
                  marca: form.marca,
                  modelo: form.modelo,
                  version: form.version || null,
                  ano: parseInt(form.ano, 10),
                  kilometraje: parseInt(form.kilometraje, 10) || 0,
                  servicios_agencia: form.servicios_agencia === "si",
                  documentos_orden: form.documentos_orden === "si",
                  estado_auto: form.estado_auto,
                })
                .select('*')
                .single();
              if (error) throw error;
              setLastSubmission(data);
              const correo = userEmail || form.vendedor_correo;
              if (correo) await cargarSolicitudes(correo);
              toast({
                title: "Solicitud enviada",
                description: "Guardamos tus datos. Te contactaremos para ayudarte a vender tu auto.",
              });
              setForm({ 
                vendedor_nombre:"", 
                vendedor_correo: userEmail || "", 
                vendedor_telefono:"", 
                ciudad:"", 
                estado:"", 
                preferencia_contacto:"", 
                marca:"", 
                marcaId: "",
                modelo:"", 
                modeloId: "",
                version:"", 
                versionId: "",
                ano:"", 
                anoId: "",
                kilometraje:"0", 
                servicios_agencia:"no", 
                documentos_orden:"si", 
                estado_auto:"" 
              });
            } catch (err: any) {
              toast({ title: "Error al enviar", description: err.message || "Intenta de nuevo más tarde." });
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-6 mb-8"
        >
          <Card id="validacion-usuario">
            <CardHeader>
              <CardTitle>Validación de usuario</CardTitle>
            </CardHeader>
            <CardContent>
              {userEmail ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm">
                  ¡Usuario logueado! {userEmail}
                </div>
              ) : (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm">
                  No has iniciado sesión. Puedes continuar llenando el formulario.
                </div>
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>Datos del auto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Select value={form.marcaId} onValueChange={manejarCambioMarca} disabled={cargandoMarcas}>
                    <SelectTrigger>
                      <SelectValue placeholder={cargandoMarcas ? "Cargando marcas..." : "Selecciona la marca"} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 z-50">
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Select value={form.modeloId} onValueChange={manejarCambioModelo} disabled={!form.marcaId || cargandoModelos}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !form.marcaId ? "Primero selecciona una marca" : 
                        cargandoModelos ? "Cargando modelos..." : 
                        "Selecciona el modelo"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 z-50">
                      {modelos.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          {modelo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ano">Año</Label>
                  <Select value={form.anoId} onValueChange={manejarCambioAno} disabled={!form.modeloId || cargandoAnos}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !form.modeloId ? "Primero selecciona un modelo" :
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
                <div>
                  <Label htmlFor="version">Versión</Label>
                  <Select value={form.versionId} onValueChange={manejarCambioVersion} disabled={!form.anoId || cargandoVersiones}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !form.anoId ? "Primero selecciona un año" :
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
                <div>
                  <Label htmlFor="kilometraje">Kilometraje</Label>
                  <Input id="kilometraje" name="kilometraje" type="number" placeholder="0" value={form.kilometraje} onChange={(e)=>setForm(f=>({...f, kilometraje:e.target.value}))}/>
                </div>
                <div>
                  <Label>¿Servicios de agencia?</Label>
                  <Select value={form.servicios_agencia} onValueChange={(v)=>setForm(f=>({...f, servicios_agencia:v}))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>¿Documentos en orden?</Label>
                  <Select value={form.documentos_orden} onValueChange={(v)=>setForm(f=>({...f, documentos_orden:v}))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado del auto</Label>
                  <Select value={form.estado_auto} onValueChange={(v)=>setForm(f=>({...f, estado_auto:v}))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona el estado"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">Excelente</SelectItem>
                      <SelectItem value="muy_bueno">Muy bueno</SelectItem>
                      <SelectItem value="bueno">Bueno</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="con_detalles">Con detalles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6">
                <Button type="submit" size="lg" disabled={submitting || !isLoggedIn || !isCarFormComplete}>
                  {submitting ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Panel de solicitudes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            {(userEmail || form.vendedor_correo) ? (
              solicitudes.length > 0 ? (
                <ul className="divide-y">
                  {solicitudes.map((s) => (
                    <li key={s.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-medium">{s.marca} {s.modelo} {s.ano}</div>
                        <div className="text-muted-foreground">Folio: {s.id} • {new Date(s.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-sm">Estado: Recibida</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no tienes solicitudes registradas.</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Ingresa tu correo para ver tus solicitudes.</p>
            )}
          </CardContent>
        </Card>

        {/* CTA movida arriba */}
      </div>
    </div>
  );
}