import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Shield, Clock, CheckCircle, ArrowLeft, Car, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";

const autoSchema = z.object({
  marca: z.string().min(1, "Marca es requerida"),
  ano: z.number().min(1900, "Año inválido").max(new Date().getFullYear() + 1, "Año inválido"),
  modelo: z.string().min(1, "Modelo es requerido"),
  version: z.string().optional(),
  kilometraje: z.number().min(0, "Kilometraje debe ser mayor a 0"),
  serviciosAgencia: z.boolean(),
  documentosOrden: z.boolean(),
  comentariosDocumentos: z.string().optional(),
  estadoAuto: z.enum(["excelente", "bueno", "regular", "con_detalles"], {
    required_error: "Selecciona el estado del auto",
  }),
  comentariosEstado: z.string().optional(),
});

export default function RedProfesionales() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const autoForm = useForm<z.infer<typeof autoSchema>>({
    resolver: zodResolver(autoSchema),
    defaultValues: {
      marca: "",
      modelo: "",
      version: "",
      kilometraje: 0,
      serviciosAgencia: false,
      documentosOrden: true,
      comentariosDocumentos: "",
    },
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const scrollToForm = () => {
    const formElement = document.getElementById('formulario-ofertas');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendInfo = async () => {
    const autoValid = await autoForm.trigger();
    
    if (!autoValid) {
      toast({
        title: "Error",
        description: "Por favor completa todos los datos del auto",
        variant: "destructive",
      });
      return;
    }

    onSubmitForms();
  };

  const onSubmitForms = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar logueado para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      const autoData = autoForm.getValues();

      // Obtener perfil del usuario logueado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Crear cliente basado en el perfil del usuario
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nombre_apellido: `${profile.nombre} ${profile.apellido}`,
          correo_electronico: profile.correo_electronico,
          numero_telefonico: profile.telefono_movil,
          estado: '',
          ciudad: '',
          preferencia_contacto: 'correo',
        })
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Insertar auto
      const { error: autoError } = await supabase
        .from('autos_venta')
        .insert({
          cliente_id: cliente.id,
          marca: autoData.marca,
          ano: autoData.ano,
          modelo: autoData.modelo,
          version: autoData.version || null,
          kilometraje: autoData.kilometraje,
          servicios_agencia: autoData.serviciosAgencia,
          documentos_orden: autoData.documentosOrden,
          comentarios_documentos: autoData.comentariosDocumentos || null,
          estado_auto: autoData.estadoAuto,
          comentarios_estado: autoData.comentariosEstado || null,
        });

      if (autoError) throw autoError;

      toast({
        title: "¡Registro exitoso!",
        description: "Tu información ha sido registrada. Revisa las ofertas en tu panel.",
      });

      // Redirigir al panel de ofertas
      navigate('/panel-ofertas');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAuthSuccess = () => {
    setTimeout(() => {
      onSubmitForms();
    }, 1000);
  };

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
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Venta a través de nuestra Red de Profesionales
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Te conectamos directamente con una red de compradores profesionales como agencias y negocios de autos, de manera segura y sin riesgos.
            </p>
          </div>
        </div>

        {/* Cómo funciona */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <Users className="h-5 w-5" />
              ¿Cómo funciona?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nos envías la información de tu auto a través de nuestra aplicación.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nosotros la compartimos con nuestra red de profesionales, quienes te enviarán ofertas de compra.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tú defines el tiempo para recibir las ofertas (de 1 día a 1 semana).
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    4
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verás todas las ofertas en un panel de nuestra aplicación.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    5
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si te interesa alguna oferta, puedes contactar al comprador para coordinar una revisión.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    6
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tú decides a quién vender en base a lo que más te convenga.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ventajas y Desventaja */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ventajas */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Ventajas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Sin costo para ti</h4>
                    <p className="text-xs text-muted-foreground">Usar nuestra plataforma es totalmente gratis.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Ahorro de tiempo</h4>
                    <p className="text-xs text-muted-foreground">Evitas visitar múltiples lugares para recibir cotizaciones.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Seguridad</h4>
                    <p className="text-xs text-muted-foreground">Te proteges de fraudes o asaltos al tratar solo con compradores verificados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Rapidez y Comodidad</h4>
                    <p className="text-xs text-muted-foreground">Concreta la venta rápido. Algunos compradores pueden ir hasta tu casa u oficina.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Control</h4>
                    <p className="text-xs text-muted-foreground">Tú decides a qué compradores contactar.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desventaja */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-red-600">Desventaja</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                El precio de venta será menor al que obtendrías vendiéndolo por tu cuenta, ya que los compradores profesionales requieren un margen de utilidad para cubrir los costos de reacondicionamiento y el tiempo de reventa.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">¿Listo para conectar con nuestra red?</h3>
              <p className="text-muted-foreground mb-6">
                Conecta con compradores profesionales verificados y vende tu auto de forma segura
              </p>
              <Button size="lg" className="mr-4" onClick={scrollToForm}>
                Quiero recibir ofertas de profesionales
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/opciones-venta')}>
                Ver otras opciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de registro */}
        <div id="formulario-ofertas" className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Regístrate para recibir ofertas
            </h2>
            <p className="text-lg text-muted-foreground">
              Completa la información y te conectaremos con profesionales interesados en tu auto
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Validación de Usuario */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Validación de usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                      Para recibir ofertas debes estar logueado en nuestra plataforma
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => setShowAuthModal(true)}
                        className="w-full"
                      >
                        Iniciar sesión
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        ¿No tienes cuenta? Puedes registrarte desde el modal de login
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    <p className="text-green-600 font-medium">¡Usuario logueado!</p>
                    <p className="text-sm text-muted-foreground">
                      Completaste la autenticación correctamente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datos del Auto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Datos del auto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...autoForm}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={autoForm.control}
                        name="marca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                              <Input placeholder="Toyota, Honda, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={autoForm.control}
                        name="ano"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Año</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="2020" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={autoForm.control}
                        name="modelo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <FormControl>
                              <Input placeholder="Corolla, Civic, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={autoForm.control}
                        name="version"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Versión (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="XLE, LX, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={autoForm.control}
                      name="kilometraje"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kilometraje</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="50000" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={autoForm.control}
                      name="serviciosAgencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿Servicios de agencia?</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Sí</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={autoForm.control}
                      name="documentosOrden"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿Documentos en orden?</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Sí</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {autoForm.watch("documentosOrden") === false && (
                      <FormField
                        control={autoForm.control}
                        name="comentariosDocumentos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comentarios sobre documentos</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Explica qué documentos faltan o están pendientes..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                     <FormField
                       control={autoForm.control}
                       name="estadoAuto"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Estado del auto</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl>
                               <SelectTrigger>
                                 <SelectValue placeholder="Selecciona el estado" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               <SelectItem value="excelente">Excelente</SelectItem>
                               <SelectItem value="bueno">Bueno</SelectItem>
                               <SelectItem value="regular">Regular</SelectItem>
                               <SelectItem value="con_detalles">Con detalles</SelectItem>
                             </SelectContent>
                           </Select>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     {(autoForm.watch("estadoAuto") === "regular" || autoForm.watch("estadoAuto") === "con_detalles") && (
                       <FormField
                         control={autoForm.control}
                         name="comentariosEstado"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Describe los daños o detalles</FormLabel>
                             <FormControl>
                               <Textarea 
                                 placeholder="Describe los daños, rayones, golpes o cualquier detalle del auto..."
                                 {...field}
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     )}
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Botón de envío */}
          <div className="text-center mt-8">
            <Button 
              size="lg" 
              onClick={handleSendInfo} 
              className="px-8"
              disabled={!user || !autoForm.formState.isValid}
            >
              Enviar información y recibir ofertas
            </Button>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}