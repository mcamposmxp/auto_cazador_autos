#!/bin/bash

# Script para descargar todas las Edge Functions de Supabase
# Basado en el archivo finciones.csv

echo "🚀 Iniciando descarga de Edge Functions..."

# Crear directorio de funciones si no existe
mkdir -p supabase/functions

# Lista de funciones extraída del CSV
functions=(
    "detectar-duplicados"
    "extractor-vehiculos"
    "normalizar-datos"
    "prueba-extraccion"
    "corregir-precios"
    "extraccion-masiva"
    "extraccion-completa"
    "diagnostico-ml"
    "extraccion-masiva-completa"
    "extraccion-simple-funcional"
    "extraccion-directa-ml"
    "calcular-tiempo-venta-ia"
    "analizar-rangos-precios-ia"
    "enviar-correo-oferta"
    "enviar-credenciales"
    "crear-credenciales"
    "catalogo-vehiculos"
    "generar-recomendaciones-ia"
    "obtener-precio-mercado"
    "getCarMarketIntelligenceData"
    "stripe-admin-dashboard"
    "stripe-test"
    "create-payment"
    "stripe-dashboard"
    "api_tokens"
    "consume-credits"
    "crear-notificacion"
    "notificar-nueva-oferta"
    "check-subscription"
    "create-checkout"
    "customer-portal"
    "consume-credits-typed"
    "award-evaluation-credits"
    "award-referral-credits"
    "generate-referral-code"
    "validate-referral"
    "calcular-precio-estimado-vehiculo"
    "evaluar-filtros-profesional"
)

# Contador de funciones descargadas
downloaded=0
failed=0

# Descargar cada función
for func in "${functions[@]}"; do
    echo "📥 Descargando función: $func"
    
    if supabase functions download "$func"; then
        echo "✅ $func descargada exitosamente"
        ((downloaded++))
    else
        echo "❌ Error descargando $func"
        ((failed++))
    fi
    
    # Pequeña pausa para evitar rate limiting
    sleep 1
done

echo ""
echo "📊 Resumen de descarga:"
echo "✅ Funciones descargadas exitosamente: $downloaded"
echo "❌ Funciones con error: $failed"
echo "📁 Total de funciones procesadas: ${#functions[@]}"

if [ $failed -eq 0 ]; then
    echo "🎉 ¡Todas las funciones se descargaron exitosamente!"
else
    echo "⚠️  Algunas funciones no se pudieron descargar. Revisa los errores arriba."
fi

echo ""
echo "📂 Las funciones se guardaron en: supabase/functions/"
echo "🔍 Para verificar: ls -la supabase/functions/"