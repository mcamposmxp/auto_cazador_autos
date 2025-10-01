-- Crear tabla para almacenar logs de errores
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('frontend', 'backend', 'api', 'database', 'network')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  error_code TEXT,
  user_id UUID,
  endpoint TEXT,
  status_code INTEGER,
  request_data JSONB,
  stack_trace TEXT,
  user_agent TEXT,
  url TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_category ON public.error_logs(category);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);

-- Habilitar RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios autenticados puedan ver solo sus propios logs
CREATE POLICY "Users can view their own error logs"
ON public.error_logs
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Política para que el servicio pueda insertar logs (desde edge function)
CREATE POLICY "Service can insert error logs"
ON public.error_logs
FOR INSERT
WITH CHECK (true);

-- Función para limpiar logs antiguos (mantener solo últimos 30 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.error_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON TABLE public.error_logs IS 'Almacena logs de errores del sistema para debugging y monitoreo';
COMMENT ON FUNCTION public.cleanup_old_error_logs IS 'Limpia logs de errores más antiguos de 30 días';