# Funciones en supabase

## Configuración

### Project ID

qflkgtejwqudtceszguf

### API Key

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGtndGVqd3F1ZHRjZXN6Z3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzQ4NDAsImV4cCI6MjA2OTE1MDg0MH0.23z2cICQB3TUhwC_1ncFfuv6Wm7POmUeIhp5bDMDdsU

## Función: extractor-vehiculos

`{
"sitio_web": "mercadolibre",
"urls": [
"https://auto.mercadolibre.com.mx/MLM-2406790421-audi-a6-mild-hybrid-2019-_JM",
"https://auto.mercadolibre.com.mx/MLM-3998911752-audi-a6-mild-hybrid-s-line-_JM"
]
}`

## llamado desde API

https://`<project-ref>`.functions.supabase.co/<slug-de-tu-función>

https://qflkgtejwqudtceszguf.functions.supabase.co/extractor-vehiculos

## CURL

```
curl -X POST 'https://qflkgtejwqudtceszguf.supabase.co/functions/v1/extractor-vehiculos' -H 'Authorization: Bearer YOUR_API_KEY_HERE' -H 'Content-Type: application/json' -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGtndGVqd3F1ZHRjZXN6Z3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzQ4NDAsImV4cCI6MjA2OTE1MDg0MH0.23z2cICQB3TUhwC_1ncFfuv6Wm7POmUeIhp5bDMDdsU' -d '{
"sitio_web": "mercadolibre",
"urls": [
"https://auto.mercadolibre.com.co/MCO-1234567890-toyota-corolla-2020",
"https://auto.mercadolibre.com.co/MCO-0987654321-honda-civic-2019"
]
}'
```
