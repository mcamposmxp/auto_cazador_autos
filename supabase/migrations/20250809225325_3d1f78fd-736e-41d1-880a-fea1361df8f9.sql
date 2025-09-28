-- 1) Roles infrastructure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create has_role helper (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can manage roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
    ON public.user_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 2) Profesionales table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_negocio') THEN
    CREATE TYPE public.tipo_negocio AS ENUM ('agencia_nuevos', 'seminuevos', 'comerciante');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profesionales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  negocio_nombre text NOT NULL,
  razon_social text NOT NULL,
  rfc text NOT NULL,
  tipo_negocio public.tipo_negocio NOT NULL,
  direccion_calle text,
  direccion_numero text,
  direccion_estado text,
  direccion_ciudad text,
  direccion_cp text,
  representante_legal text,
  contacto_principal text,
  telefono text,
  correo text,
  activo boolean NOT NULL DEFAULT true,
  pausado boolean NOT NULL DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfc)
);

ALTER TABLE public.profesionales ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profesionales_correo ON public.profesionales (correo);
CREATE INDEX IF NOT EXISTS idx_profesionales_rfc ON public.profesionales (rfc);

-- Timestamp trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profesionales_updated_at'
  ) THEN
    CREATE TRIGGER update_profesionales_updated_at
    BEFORE UPDATE ON public.profesionales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS policies for profesionales (admin + owners)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Admins can select all profesionales'
  ) THEN
    CREATE POLICY "Admins can select all profesionales"
    ON public.profesionales
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Users can select their own profesionales'
  ) THEN
    CREATE POLICY "Users can select their own profesionales"
    ON public.profesionales
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Admins can insert profesionales'
  ) THEN
    CREATE POLICY "Admins can insert profesionales"
    ON public.profesionales
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Users can insert their own profesionales'
  ) THEN
    CREATE POLICY "Users can insert their own profesionales"
    ON public.profesionales
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Admins can update profesionales'
  ) THEN
    CREATE POLICY "Admins can update profesionales"
    ON public.profesionales
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Users can update their own profesionales'
  ) THEN
    CREATE POLICY "Users can update their own profesionales"
    ON public.profesionales
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profesionales' AND policyname = 'Admins can delete profesionales'
  ) THEN
    CREATE POLICY "Admins can delete profesionales"
    ON public.profesionales
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 3) Let admins view all subasta_autos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subasta_autos' AND policyname = 'Admins can view all subasta_autos'
  ) THEN
    CREATE POLICY "Admins can view all subasta_autos"
    ON public.subasta_autos
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- NOTE: After this migration, please provide the admin email so we can grant you the 'admin' role:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT u.id, 'admin'::public.app_role FROM auth.users u WHERE u.email = 'YOUR_EMAIL_HERE'
-- ON CONFLICT (user_id, role) DO NOTHING;
