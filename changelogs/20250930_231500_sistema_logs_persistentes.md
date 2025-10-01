# Sistema de Logs Persistentes en Base de Datos
**Fecha:** 2025-09-30 23:15:00 America/Mexico_City  
**Tipo:** Feature - Sistema de Logging

## Resumen
Implementación completa de un sistema de logs persistentes que almacena errores críticos y de alta severidad en la base de datos de Supabase. Los logs se envían automáticamente desde el frontend a través de una Edge Function dedicada.

---

## Cambios Implementados

### 1. **Nueva Tabla: `error_logs`**
Tabla de base de datos para almacenar logs de errores del sistema.

**Columnas principales:**
- `id`: UUID único del log
- `timestamp`: Fecha y hora del error (con zona horaria)
- `category`: Categoría del error (frontend, backend, api, database, network)
- `severity`: Nivel de severidad (low, medium, high, critical)
- `message`: Mensaje descriptivo del error
- `error_code`: Código de error opcional
- `user_id`: ID del usuario (si está autenticado)
- `endpoint`, `status_code`, `request_data`: Detalles de errores API
- `stack_trace`, `user_agent`, `url`: Información de contexto
- `context`: Datos adicionales en formato JSON

**Características:**
- Índices optimizados para consultas rápidas por timestamp, severidad, categoría y user_id
- RLS habilitado para que usuarios solo vean sus propios logs
- Política que permite al servicio insertar logs sin restricciones
- Función de limpieza automática (`cleanup_old_error_logs`) que elimina logs mayores a 30 días

### 2. **Nueva Edge Function: `log-error`**
Archivo: `supabase/functions/log-error/index.ts`

Edge Function dedicada para recibir y almacenar logs en la base de datos.

**Funcionalidades:**
- Manejo de CORS para llamadas desde el frontend
- Validación de campos requeridos (category, severity, message)
- Extracción automática de `user_id` del token de autenticación si está presente
- Inserción de logs con todos los detalles en la tabla `error_logs`
- Logging detallado en consola para debugging
- Manejo robusto de errores

**Endpoint:** `https://qflkgtejwqudtceszguf.supabase.co/functions/v1/log-error`

### 3. **Actualización de `errorLogger.ts`**
Archivo: `src/utils/errorLogger.ts`

**Cambios:**
- Nueva función `sendToDatabase()`: Envía logs a la Edge Function
- Actualización de `notifyCriticalError()`: Ahora envía logs a la base de datos automáticamente
- Manejo de errores para evitar loops infinitos si el envío falla
- Solo se envían a BD los logs de severidad `critical` y `high`

**Flujo de logging:**
```
Error ocurre → errorLogger.log() → 
  - Almacena en memoria (últimos 100)
  - Muestra en consola con formato
  - Si es critical/high → Envía a base de datos
```

---

## Beneficios

1. **Persistencia de Datos:** Los errores críticos se guardan permanentemente
2. **Trazabilidad:** Cada error incluye timestamp, usuario, contexto completo
3. **Análisis Post-Mortem:** Los logs permiten investigar problemas históricos
4. **Monitoreo Proactivo:** Administradores pueden consultar errores recientes
5. **Limpieza Automática:** Los logs antiguos se eliminan para evitar saturación
6. **Privacidad:** RLS asegura que usuarios solo vean sus propios errores
7. **Sin Dependencias Externas:** Todo integrado en la infraestructura de Supabase

---

## Uso del Sistema

### Para Desarrolladores

**Log manual de un error:**
```typescript
import { errorLogger } from '@/utils/errorLogger';

errorLogger.logAPIError({
  endpoint: '/api/vehicles',
  statusCode: 500,
  message: 'Error al obtener vehículos',
  errorCode: 'API_ERROR',
  severity: 'high'
});
```

**Consultar logs recientes en memoria:**
```typescript
const recentLogs = errorLogger.getRecentLogs(50);
const criticalLogs = errorLogger.getLogsBySeverity('critical');
```

### Para Administradores

**Consultar logs en Supabase:**
```sql
-- Ver logs críticos de las últimas 24 horas
SELECT * FROM error_logs 
WHERE severity = 'critical' 
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Ver logs de un usuario específico
SELECT * FROM error_logs 
WHERE user_id = 'uuid-del-usuario'
ORDER BY timestamp DESC;
```

**Limpiar logs antiguos manualmente:**
```sql
SELECT public.cleanup_old_error_logs();
```

---

## Consideraciones de Seguridad

1. **RLS Habilitado:** Usuarios autenticados solo ven sus propios logs
2. **Service Role:** Solo la Edge Function puede insertar logs sin restricciones
3. **Datos Sensibles:** Los logs NO deben contener contraseñas ni tokens
4. **Retención:** Los logs se eliminan automáticamente después de 30 días

---

## Próximos Pasos (Opcional)

- [ ] Implementar dashboard de monitoreo de errores
- [ ] Agregar alertas por email para errores críticos
- [ ] Integración con Sentry o LogRocket para errores del frontend
- [ ] Métricas y gráficas de tendencias de errores
- [ ] Exportación de logs para análisis externo

---

## Warnings de Seguridad

⚠️ La migración generó algunos warnings de seguridad que NO están relacionados con esta implementación:
- Function Search Path Mutable
- Extension in Public
- Leaked Password Protection Disabled
- Postgres version security patches available

Estos warnings existían previamente y deben ser revisados por el administrador.
