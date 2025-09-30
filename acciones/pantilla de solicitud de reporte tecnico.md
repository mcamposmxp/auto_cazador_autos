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
- Ejemplo de datos obtenidos
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
dev_analisis/RT_[NOMBRE_DE_LA_FUNCIONALIDAD].md
```

### Archivos de Changelog
```
changelogs/YYYYMMDD_HHMMSS_[descripcion_cambio].md
```
el timestamp debe seguir el formato YYYYMMDD_HHMMSS y en la zona horaria de la ciudad de México

### Ejemplos:
- `dev_analisis/RT_CALCULO_DEMANDA_VEHICULAR.md`
- `dev_analisis/RT_SISTEMA_VALUACION.md`
- `dev_analisis/RT_ANALISIS_PRECIO_COMPONENTE.md`

## Proceso de Análisis Requerido

1. **Identificación de Componentes**: Localizar todos los archivos relacionados con la funcionalidad
2. **Análisis de Flujo**: Mapear el flujo completo desde frontend hasta backend
3. **Documentación de APIs**: Detallar todas las llamadas a Edge Functions y APIs externas
4. **Revisión de Algoritmos**: Analizar los cálculos y lógica de negocio
5. **Evaluación de Rendimiento**: Revisar optimizaciones y puntos críticos
6. **Análisis de Seguridad**: Verificar validaciones y controles de acceso