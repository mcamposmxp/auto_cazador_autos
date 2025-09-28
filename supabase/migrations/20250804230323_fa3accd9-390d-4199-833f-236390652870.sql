-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono_movil TEXT NOT NULL,
  telefono_secundario TEXT,
  correo_electronico TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('particular', 'agencia', 'lote', 'comerciante')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, apellido, telefono_movil, correo_electronico, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'telefono_movil', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'tipo_usuario', 'particular')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create ofertas table for professional offers
CREATE TABLE public.ofertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_venta_id UUID NOT NULL REFERENCES public.autos_venta(id) ON DELETE CASCADE,
  profesional_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  monto_oferta NUMERIC NOT NULL,
  comentarios TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ofertas
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Policies for ofertas
CREATE POLICY "Users can view offers for their cars or offers they made" 
ON public.ofertas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.autos_venta av 
    WHERE av.id = auto_venta_id AND av.cliente_id IN (
      SELECT c.id FROM public.clientes c WHERE c.correo_electronico = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  ) OR profesional_id = auth.uid()
);

CREATE POLICY "Professionals can insert offers" 
ON public.ofertas 
FOR INSERT 
WITH CHECK (profesional_id = auth.uid());

CREATE POLICY "Users can update their own offers or car owners can update offer status" 
ON public.ofertas 
FOR UPDATE 
USING (
  profesional_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.autos_venta av 
    WHERE av.id = auto_venta_id AND av.cliente_id IN (
      SELECT c.id FROM public.clientes c WHERE c.correo_electronico = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
);

-- Add trigger for ofertas updated_at
CREATE TRIGGER update_ofertas_updated_at
BEFORE UPDATE ON public.ofertas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();