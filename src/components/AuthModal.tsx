import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  telefono_movil: z.string().min(10, 'El teléfono móvil es requerido'),
  telefono_secundario: z.string().optional(),
  tipo_usuario: z.enum(['particular', 'agencia', 'lote', 'comerciante']),
  referral_code: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [referralValidation, setReferralValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Detect referral code from URL on component mount
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode && refCode.trim()) {
        registerForm.setValue('referral_code', refCode.trim());
        validateReferralCode(refCode.trim());
      }
    }
  }, [isOpen]);

  // Debounced referral validation
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 3) {
      setReferralValidation({ status: 'idle', message: '' });
      return;
    }

    setReferralValidation({ status: 'validating', message: 'Verificando código...' });

    try {
      const { data, error } = await supabase.functions.invoke('validate-referral', {
        body: { referral_code: code }
      });

      if (error) throw error;

      if (data.success) {
        setReferralValidation({ 
          status: 'valid', 
          message: '¡Código válido! Recibirás créditos adicionales al registrarte.' 
        });
      } else {
        setReferralValidation({ 
          status: 'invalid', 
          message: 'Código de referido inválido o expirado.' 
        });
      }
    } catch (error) {
      setReferralValidation({ 
        status: 'invalid', 
        message: 'Error al validar el código.' 
      });
    }
  };

  // Handle referral code input changes with debounce
  useEffect(() => {
    const referralCode = registerForm.watch('referral_code');
    if (referralCode === undefined) return;

    const timeoutId = setTimeout(() => {
      validateReferralCode(referralCode);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [registerForm.watch('referral_code')]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sesión iniciada",
        description: "Has iniciado sesión correctamente",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Validate referral code if provided
      if (data.referral_code && referralValidation.status !== 'valid') {
        toast({
          title: "Código de referido inválido",
          description: "Por favor verifica que el código de referido sea correcto.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            telefono_movil: data.telefono_movil,
            telefono_secundario: data.telefono_secundario,
            tipo_usuario: data.tipo_usuario,
            referral_code: data.referral_code,
          }
        }
      });

      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // If user is created and referral code is provided, process referral
      if (authData.user && data.referral_code && referralValidation.status === 'valid') {
        try {
          await supabase.functions.invoke('validate-referral', {
            body: { referral_code: data.referral_code }
          });
        } catch (referralError) {
          // Don't block registration if referral processing fails
          console.error('Error processing referral:', referralError);
        }
      }

      toast({
        title: "Registro exitoso",
        description: data.referral_code 
          ? "Se ha enviado un correo de confirmación. Tu código de referido ha sido aplicado."
          : "Se ha enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acceso a la plataforma</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    {...registerForm.register('nombre')}
                  />
                  {registerForm.formState.errors.nombre && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    {...registerForm.register('apellido')}
                  />
                  {registerForm.formState.errors.apellido && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.apellido.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email-register">Correo Electrónico</Label>
                <Input
                  id="email-register"
                  type="email"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="telefono_movil">Teléfono Móvil</Label>
                <Input
                  id="telefono_movil"
                  {...registerForm.register('telefono_movil')}
                />
                {registerForm.formState.errors.telefono_movil && (
                  <p className="text-sm text-destructive mt-1">
                    {registerForm.formState.errors.telefono_movil.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="telefono_secundario">Teléfono Secundario (Opcional)</Label>
                <Input
                  id="telefono_secundario"
                  {...registerForm.register('telefono_secundario')}
                />
              </div>
              
              <div>
                <Label htmlFor="tipo_usuario">Tipo de Usuario</Label>
                <Select onValueChange={(value) => registerForm.setValue('tipo_usuario', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="agencia">Agencia</SelectItem>
                    <SelectItem value="lote">Lote</SelectItem>
                    <SelectItem value="comerciante">Comerciante</SelectItem>
                  </SelectContent>
                </Select>
                {registerForm.formState.errors.tipo_usuario && (
                  <p className="text-sm text-destructive mt-1">
                    {registerForm.formState.errors.tipo_usuario.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password-register">Contraseña</Label>
                <Input
                  id="password-register"
                  type="password"
                  {...registerForm.register('password')}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerForm.register('confirmPassword')}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="referral_code">Código de Referido (Opcional)</Label>
                <div className="relative">
                  <Input
                    id="referral_code"
                    placeholder="Ingresa tu código de referido"
                    {...registerForm.register('referral_code')}
                  />
                  {referralValidation.status === 'validating' && (
                    <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {referralValidation.status === 'valid' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {referralValidation.status === 'invalid' && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {referralValidation.message && (
                  <p className={`text-sm mt-1 ${
                    referralValidation.status === 'valid' 
                      ? 'text-green-600' 
                      : referralValidation.status === 'invalid' 
                        ? 'text-destructive' 
                        : 'text-muted-foreground'
                  }`}>
                    {referralValidation.message}
                  </p>
                )}
                {!registerForm.watch('referral_code') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Si alguien te invitó, ingresa su código para obtener créditos adicionales
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || (registerForm.watch('referral_code') && referralValidation.status === 'invalid')}
              >
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}