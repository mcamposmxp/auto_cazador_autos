-- Habilitar extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear cron job para actualizar tokens cada hora
SELECT cron.schedule(
  'refresh-api-tokens-hourly',
  '0 * * * *', -- cada hora en punto
  $$
  SELECT
    net.http_post(
        url:='https://qflkgtejwqudtceszguf.supabase.co/functions/v1/api_tokens',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGtndGVqd3F1ZHRjZXN6Z3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1MTIzNjcsImV4cCI6MjA0MzA4ODM2N30.46t1X_W2S-DDFZD9TGWCKhL71fZVuLXb5aONg8LnCjA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);