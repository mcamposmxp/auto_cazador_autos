# Instrucciones para Solicitar Reportes Técnicos de Funcionalidades del Sistema

## Plantilla de Solicitud

Para solicitar un reporte técnico completo de cualquier funcionalidad del sistema, utiliza la siguiente plantilla:

```
Necesito un reporte técnico completo del funcionamiento de [NOMBRE_DE_LA_FUNCIONALIDAD]. 

El reporte debe incluir:
- Análisis de la arquitectura y flujo de datos
- Especificaciones técnicas detalladas
- Implementación en frontend y backend
- Algoritmos y cálculos utilizados
- Logs y monitoreo
- Aspectos de seguridad y rendimiento
- Casos de uso prácticos
- Mantenimiento y evolución

Guarda el reporte en: dev_analisis/RT_[NOMBRE_FUNCIONALIDAD].md
```

## Estructura Esperada del Reporte

Cada reporte técnico debe contener las siguientes secciones obligatorias:

### 1. **Resumen Ejecutivo**
- Descripción concisa de la funcionalidad
- Componentes principales involucrados
- Tecnologías utilizadas

### 2. **Arquitectura del Sistema**
- Diagrama de componentes
- Flujo de datos detallado
- Interacciones entre frontend y backend
- APIs externas involucradas

### 3. **Especificaciones Técnicas**
- Edge Functions utilizadas
- Algoritmos de cálculo
- Parámetros de entrada y salida
- Estructuras de datos

### 4. **Implementación Frontend**
- Componentes React principales
- Hooks personalizados
- Gestión de estado
- Visualización de resultados

### 5. **Implementación Backend**
- Edge Functions detalladas
- Consultas a APIs externas
- Procesamiento de datos
- Validaciones y seguridad

### 6. **Logs y Monitoreo**
- Ejemplos de logs de Edge Functions
- Métricas de rendimiento
- Puntos de monitoreo críticos

### 7. **Seguridad y Tokens**
- Gestión de secretos
- Validación de datos
- Control de acceso

### 8. **Rendimiento y Optimización**
- Tiempos de respuesta
- Estrategias de caché
- Optimizaciones implementadas

### 9. **Casos de Uso**
- Ejemplos prácticos
- Escenarios de prueba
- Datos de entrada y resultados esperados

### 10. **Mantenimiento y Evolución**
- Puntos de monitoreo
- Mejoras potenciales
- Consideraciones futuras

### 11. **Conclusiones**
- Fortalezas del sistema
- Áreas de oportunidad
- Recomendaciones

## Convenciones de Nomenclatura

### Archivos de Reporte
```
dev_analisis/RT_[FUNCIONALIDAD].md
```

### Archivos de Changelog
```
changelogs/YYYYMMDD_HHMMSS_[descripcion_cambio].md
```

**⚠️ CRÍTICO: Zona Horaria para Timestamps - OBLIGATORIO**

**REGLA ABSOLUTA: TODOS los timestamps deben estar CONVERTIDOS a la zona horaria de Ciudad de México (America/Mexico_City)**

### Alcance Obligatorio:
- ✅ Nombres de archivos de changelog
- ✅ Contenido de archivos de changelog (campo Fecha)
- ✅ Logs del sistema
- ✅ Registros en base de datos con timestamp
- ✅ Bitácoras de errores
- ✅ Cualquier otro registro temporal en el sistema

### Formato Obligatorio:
```
YYYYMMDD_HHMMSS (hora convertida a America/Mexico_City)
```

### ⚠️ ERROR COMÚN A EVITAR:
❌ **INCORRECTO**: Usar UTC y solo agregar la etiqueta `(America/Mexico_City)`
```
**Fecha:** 2025-09-30 23:15:00 (America/Mexico_City)  // ❌ Esta es hora UTC!
```

✅ **CORRECTO**: Convertir REALMENTE el timestamp a hora de Ciudad de México
```
**Fecha:** 2025-09-30 18:15:00 (America/Mexico_City)  // ✅ Convertido correctamente!
```

### Herramientas para Conversión:
1. **date-fns-tz** (recomendado):
```typescript
import { formatInTimeZone } from 'date-fns-tz';

const mexicoTime = formatInTimeZone(
  new Date(),
  'America/Mexico_City',
  'yyyy-MM-dd HH:mm:ss'
);
```

2. **JavaScript nativo**:
```typescript
const mexicoTime = new Date().toLocaleString('es-MX', { 
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
```

### Ejemplo de Nombre de Archivo con Timestamp Correcto:
Si la hora actual en Ciudad de México es: `2025-09-30 18:15:00`
- Nombre archivo: `changelogs/20250930_181500_descripcion_cambio.md`
- Contenido: `**Fecha:** 2025-09-30 18:15:00 (America/Mexico_City)`

### Verificación:
Antes de generar cualquier archivo o log, SIEMPRE verifica:
1. ¿Convertiste el timestamp a America/Mexico_City?
2. ¿El nombre del archivo usa la hora convertida?
3. ¿El contenido del archivo usa la hora convertida?

**NO es suficiente agregar la etiqueta `(America/Mexico_City)` - DEBES hacer la conversión real del timestamp.**

### Ejemplos:
- `dev_analisis/REPORTE_TECNICO_CALCULO_DEMANDA_VEHICULAR.md`
- `dev_analisis/REPORTE_TECNICO_SISTEMA_VALUACION.md`
- `dev_analisis/REPORTE_TECNICO_ANALISIS_PRECIO_COMPONENTE.md`

## Proceso de Análisis Requerido

1. **Identificación de Componentes**: Localizar todos los archivos relacionados con la funcionalidad
2. **Análisis de Flujo**: Mapear el flujo completo desde frontend hasta backend
3. **Documentación de APIs**: Detallar todas las llamadas a Edge Functions y APIs externas
4. **Revisión de Algoritmos**: Analizar los cálculos y lógica de negocio
5. **Evaluación de Rendimiento**: Revisar optimizaciones y puntos críticos
6. **Análisis de Seguridad**: Verificar validaciones y controles de acceso

## Funcionalidades Candidatas para Reportes

### Alta Prioridad
- ✅ Cálculo de Demanda Vehicular
- 📋 Sistema de Valuación de Vehículos
- 📋 Análisis de Precio por Componente
- 📋 Recomendaciones de IA
- 📋 Sistema de Extracción de Datos ML

### Media Prioridad
- 📋 Sistema de Créditos y Suscripciones
- 📋 Sistema de Notificaciones
- 📋 Mensajería entre Usuarios
- 📋 Sistema de Reviews y Reputación
- 📋 Analytics y Métricas

### Baja Prioridad
- 📋 Sistema de Autenticación
- 📋 Gestión de Perfiles
- 📋 Sistema de Referidos
- 📋 Configuración de Filtros

## Notas Importantes

- **Consistencia**: Todos los reportes deben seguir la misma estructura
- **Detalle Técnico**: Incluir suficiente detalle para permitir mantenimiento futuro
- **Ejemplos Prácticos**: Siempre incluir casos de uso reales con datos
- **Actualización**: Los reportes deben actualizarse cuando la funcionalidad cambie significativamente

## Ejemplo de Solicitud Completa

```
Necesito un reporte técnico completo del funcionamiento del SISTEMA DE VALUACIÓN DE VEHÍCULOS.

El reporte debe incluir:
- Análisis de la arquitectura y flujo de datos
- Especificaciones técnicas detalladas
- Implementación en frontend y backend
- Algoritmos y cálculos utilizados
- Logs y monitoreo
- Aspectos de seguridad y rendimiento
- Casos de uso prácticos
- Mantenimiento y evolución

Guarda el reporte en: dev_analisis/REPORTE_TECNICO_SISTEMA_VALUACION.md
```