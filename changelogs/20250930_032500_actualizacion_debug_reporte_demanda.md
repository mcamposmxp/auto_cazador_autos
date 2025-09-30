# Changelog Técnico

**Usuario que solicitó el cambio:** Usuario  
**Fecha y hora del cambio:** 2025-09-30 03:25:00  
**Título del cambio:** Actualización popup Debug y creación de reporte técnico para Cálculo de Demanda  
**Instrucciones solicitadas:**  
"Construir un reporte técnico real de cómo se obtienen los datos, cómo se procesan y cómo se presentan para el 'Cálculo de demanda'. Actualizar el popup Debug con información técnica real y precisa. Guardar reporte en carpeta 'dev_analisis' con nombre descriptivo."

---

## Detalle técnico de los cambios aplicados

### Archivos modificados:

**1. `src/components/AnalisisMercado.tsx` (líneas 78-136)**
- **Fuente de datos:** Actualizada de "Análisis de mercado local + Base de datos anuncios" a "Edge Function 'maxi_similar_cars' + API MaxiPublica"
- **Datos predecesores:** Corregidos para reflejar el flujo real:
  - API MaxiPublica ads_sites como fuente primaria
  - Edge Function maxi_similar_cars como intermediario
- **Reglas aplicadas:** Añadidas reglas específicas de ajuste por marca y antigüedad
- **Procesamiento:** Actualizado con 6 pasos reales del flujo técnico
- **Observaciones:** Mejoradas con información específica del algoritmo y API

**2. `dev_analisis/REPORTE_TECNICO_CALCULO_DEMANDA_VEHICULAR.md` (archivo nuevo)**
- **Creado reporte técnico completo** de 250+ líneas
- **Secciones incluidas:**
  - Arquitectura del sistema con diagrama de flujo
  - Especificaciones técnicas detalladas
  - Algoritmo de cálculo con ejemplos de código
  - Logs y monitoreo del sistema
  - Análisis de performance y optimización
  - Casos de uso reales con ejemplos
  - Conclusiones y áreas de mejora

### Análisis técnico realizado:

**Flujo real identificado:**
1. Frontend → Edge Function `maxi_similar_cars`
2. Edge Function → API MaxiPublica `ads_sites/210000`
3. API retorna vehículos filtrados por versionId
4. Mapeo y normalización de datos
5. Aplicación algoritmo `calcularDemandaAuto()`
6. Clasificación final con factores de ajuste

**Factores de demanda documentados:**
- Clasificación principal: >15 (Alta), 5-15 (Moderada), <5 (Baja)
- Ajuste por marca: Toyota/Honda/Mazda/Subaru (+1)
- Ajuste por antigüedad: ≤2 años (+1), 3-5 años (0), >5 años (-1)

**Logs del sistema analizados:**
- Tiempo de respuesta: ~28ms boot + ~1.5s API
- Ejemplo real: 35 vehículos encontrados para Audi A3 2023
- Token de autenticación funcionando correctamente

---