-- Eliminar el cron job existente
SELECT cron.unschedule('refresh-api-tokens-hourly');

-- Crear nuevo cron job para ejecutar cada 30 minutos
SELECT cron.schedule(
  'refresh-api-tokens-30min',
  '*/30 * * * *', -- cada 30 minutos
  $$
  SELECT
    net.http_post(
        url:='https://qflkgtejwqudtceszguf.supabase.co/functions/v1/api_tokens',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGtndGVqd3F1ZHRjZXN6Z3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1MTIzNjcsImV4cCI6MjA0MzA4ODM2N30.46t1X_W2S-DDFZD9TGWCKhL71fZVuLXb5aONg8LnCjA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);