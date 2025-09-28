import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TrendingUp, Shield, Clock, CheckCircle, ArrowLeft, DollarSign, Users, Car, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";
export default function SubastaAuto() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const autoSchema = z.object({
    marca: z.string().min(1, "Marca es requerida"),
    ano: z.number().min(1900, "Año inválido").max(new Date().getFullYear() + 1, "Año inválido"),
    modelo: z.string().min(1, "Modelo es requerido"),
    version: z.string().optional(),
    kilometraje: z.number().min(0, "Kilometraje debe ser mayor a 0"),
    serviciosAgencia: z.boolean(),
    documentosOrden: z.boolean(),
    estadoAuto: z.enum(["excelente", "bueno", "regular", "con_detalles"], {
      required_error: "Selecciona el estado del auto",
    }),
  });

  const autoForm = useForm<z.infer<typeof autoSchema>>({
    resolver: zodResolver(autoSchema),
    defaultValues: {
      marca: "",
      modelo: "",
      version: "",
      kilometraje: 0,
      serviciosAgencia: false,
      documentosOrden: true,
    },
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById('formulario-subasta');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const onSubmitForms = async () => {
    if (!user) {
      toast({ title: "Debes iniciar sesión", description: "Autentícate para registrar tu auto en subasta", variant: "destructive" });
      setShowAuthModal(true);
      return;
    }

    try {
      const autoData = autoForm.getValues();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      const { error: insertError } = await supabase
        .from('subasta_autos')
        .insert({
          user_id: user.id,
          vendedor_nombre: `${profile.nombre} ${profile.apellido}`,
          vendedor_correo: profile.correo_electronico,
          vendedor_telefono: profile.telefono_movil,
          marca: autoData.marca,
          ano: autoData.ano,
          modelo: autoData.modelo,
          version: autoData.version || null,
          kilometraje: autoData.kilometraje,
          servicios_agencia: autoData.serviciosAgencia,
          documentos_orden: autoData.documentosOrden,
          estado_auto: autoData.estadoAuto,
        });

      if (insertError) throw insertError;

      toast({ title: "¡Registro exitoso!", description: "Tu solicitud de subasta fue registrada. Te contactaremos para agendar la revisión." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No pudimos registrar tu solicitud. Intenta de nuevo.", variant: "destructive" });
    }
  };

  const handleSendInfo = async () => {
    const valid = await autoForm.trigger();
    if (!valid) {
      toast({ title: "Error", description: "Por favor completa todos los datos del auto", variant: "destructive" });
      return;
    }
    await onSubmitForms();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setTimeout(() => { onSubmitForms(); }, 500);
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
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Subasta de tu auto
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ponemos tu auto en una subasta exclusiva para compradores profesionales de todo el país, garantizando transparencia y un precio justo.
            </p>
          </div>
        </div>

        {/* ¿Cómo funciona? */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <Users className="h-6 w-6" />
              ¿Cómo funciona?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold leading-none">1</span>
                  <p className="text-muted-foreground">Agendamos una cita para revisar tu auto y su documentación.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold leading-none">2</span>
                  <p className="text-muted-foreground">Verificamos su estado e historial y acordamos un precio mínimo de venta.</p>
                </li>
              </ul>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold leading-none">3</span>
                  <p className="text-muted-foreground">Publicamos tu auto en nuestra plataforma de subastas.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold leading-none">4</span>
                  <p className="text-muted-foreground">Si recibe una oferta igual o mayor al mínimo, se vende; si no, no tienes obligación.</p>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Ventajas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Ventajas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Sin desgaste</h4>
                    <p className="text-muted-foreground text-sm">Nosotros nos encargamos de todo el proceso de negociación.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Proceso transparente</h4>
                    <p className="text-muted-foreground text-sm">La subasta es un proceso claro y se realiza con compradores profesionales de toda la república.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Precio garantizado</h4>
                    <p className="text-muted-foreground text-sm">El auto no se venderá por menos del precio mínimo que acordamos.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Operación segura</h4>
                    <p className="text-muted-foreground text-sm">El pago se recibe al contado a través de una transferencia segura.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Comodidad total</h4>
                    <p className="text-muted-foreground text-sm">Nosotros nos hacemos cargo de todos los trámites y el papeleo de la venta.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desventajas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Desventajas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Tiene un costo</h4>
                  <p className="text-muted-foreground text-sm">Existe una cuota por participar en la subasta, incluso si el auto no se vende.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Requiere tiempo</h4>
                  <p className="text-muted-foreground text-sm">Debes llevar el auto a nuestra sucursal para la revisión.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">¿Listo para subastar tu auto?</h3>
              <p className="text-muted-foreground mb-6">
                Participa en nuestra subasta exclusiva y obtén el mejor precio con total transparencia
              </p>
              <Button size="lg" className="mr-4" onClick={scrollToForm}>
                Me interesa Subastarlo
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/opciones-venta')}>
                Ver otras opciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de registro para Subasta */}
        <div id="formulario-subasta" className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Regístrate para subastar tu auto
            </h2>
            <p className="text-lg text-muted-foreground">
              Completa la información y coordinaremos la subasta con compradores profesionales
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
                      Para continuar debes estar logueado en nuestra plataforma
                    </p>
                    <div className="space-y-2">
                      <Button onClick={() => setShowAuthModal(true)} className="w-full">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={autoForm.control}
                        name="serviciosAgencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>¿Servicios de agencia?</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(v === 'true')}
                              value={field.value ? 'true' : 'false'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
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
                            <Select
                              onValueChange={(v) => field.onChange(v === 'true')}
                              value={field.value ? 'true' : 'false'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
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
                    </div>

                    <FormField
                      control={autoForm.control}
                      name="estadoAuto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado del auto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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

                    <div className="pt-2">
                      <Button className="w-full md:w-auto" onClick={handleSendInfo}>
                        Enviar registro para subasta
                      </Button>
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}