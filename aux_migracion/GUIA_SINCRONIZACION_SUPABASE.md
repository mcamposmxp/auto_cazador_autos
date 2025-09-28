# Guía de Sincronización Supabase: Estructura y Datos

Esta guía documenta el proceso exitoso para sincronizar la estructura de la base de datos y los datos desde un proyecto remoto de Supabase hacia un ambiente local de desarrollo.

## Prerrequisitos

- Supabase CLI instalado (`supabase --version` para verificar)
- Docker Desktop ejecutándose
- Archivo `.env` con las credenciales del proyecto remoto:
  ```
  SUPABASE_URL=https://tu-proyecto.supabase.co
  SUPABASE_ANON_KEY=tu_anon_key
  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
  SUPABASE_ACCESS_TOKEN=tu_access_token
  ```

## Proceso de Sincronización Completa

### Paso 1: Limpieza Completa del Ambiente Local

Si ya tienes un proyecto Supabase local con problemas, es necesario hacer una limpieza completa:

```bash
# Detener Supabase local
supabase stop

# Remover todos los contenedores de Docker relacionados con Supabase
docker ps -a --filter "name=supabase" --format "{{.ID}}" | xargs docker rm -f

# Remover volúmenes de Docker del proyecto (reemplaza 'tu_proyecto' con el nombre real)
docker volume ls --filter "name=supabase_*_tu_proyecto" --format "{{.Name}}" | xargs docker volume rm

# Eliminar completamente el directorio supabase local
rm -rf supabase/
```

### Paso 2: Inicialización del Proyecto Local

```bash
# Inicializar un nuevo proyecto Supabase
supabase init

# Iniciar Supabase local (esto creará contenedores frescos)
supabase start
```

**Resultado esperado:** Deberías ver URLs locales como:
- API URL: http://127.0.0.1:54321
- Studio URL: http://127.0.0.1:54323
- Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres

### Paso 3: Vinculación con el Proyecto Remoto

```bash
# Vincular con el proyecto remoto (reemplaza con tu project-ref)
supabase link --project-ref tu_project_ref
```

**Nota:** El `project-ref` se encuentra en la URL de tu proyecto: `https://PROJECT_REF.supabase.co`

### Paso 4: Descarga de la Estructura (Schema)

```bash
# Descargar solo la estructura de la base de datos
supabase db dump --schema-only -f supabase/migrations/20240101000000_initial_schema.sql
```

### Paso 5: Descarga de los Datos

```bash
# Descargar solo los datos
supabase db dump --data-only -f supabase/seed.sql
```

### Paso 6: Aplicación de Estructura y Datos

```bash
# Resetear la base de datos local aplicando migraciones y datos
supabase db reset
```

**Este comando:**
- Recrea la base de datos local
- Aplica la migración con la estructura
- Ejecuta el archivo seed.sql con los datos

### Paso 7: Verificación

```bash
# Verificar que Supabase esté ejecutándose
supabase status

# Verificar que las tablas existan
docker exec -e PAGER=cat -it supabase_db_tu_proyecto psql -U postgres -d postgres -c "\dt"

# Verificar algunos datos de ejemplo
docker exec -e PAGER=cat -it supabase_db_tu_proyecto psql -U postgres -d postgres -c "SELECT COUNT(*) FROM profiles;"
```

## Comandos de Verificación Útiles

### Verificar Estado de Supabase
```bash
supabase status
```

### Verificar Contenedores de Docker
```bash
docker ps --filter "name=supabase"
```

### Acceder a la Base de Datos Directamente
```bash
docker exec -e PAGER=cat -it supabase_db_tu_proyecto psql -U postgres -d postgres
```

### Verificar Studio Local
Abrir en navegador: http://127.0.0.1:54323

## Solución de Problemas Comunes

### Error: "Migration not found"
- **Solución:** Eliminar completamente el directorio `supabase/` y empezar desde el Paso 2

### Error: "Container name already in use"
- **Solución:** Ejecutar los comandos de limpieza del Paso 1

### Error: "supabase_storage unhealthy"
- **Solución:** Hacer limpieza completa de contenedores y volúmenes

### No se pueden ver los datos después de la importación
- **Verificar:** Que el archivo `supabase/seed.sql` se haya creado correctamente
- **Verificar:** Que `supabase db reset` se haya ejecutado sin errores

### Las Edge Functions no aparecen en la interfaz web local
- **Causa:** Las funciones están descargadas pero no están siendo servidas localmente
- **Solución:** Ejecutar `supabase functions serve` en una terminal separada
- **Verificar:** Que Supabase local esté ejecutándose (`supabase status`)
- **Nota:** Las funciones solo aparecen en la interfaz web mientras el comando `serve` esté activo

### Error: "Migration fix-object-level not found"
- **Causa:** Conflicto con migraciones existentes o contenedores corruptos
- **Solución:** 
  1. Eliminar migraciones problemáticas: `rm -rf supabase/migrations`
  2. Limpiar contenedores: `docker system prune -a -f --volumes`
  3. Reinicializar: `supabase init --force`
  4. Recomenzar desde el Paso 3

## Estructura de Archivos Resultante

Después del proceso exitoso, deberías tener:

```
supabase/
├── config.toml                                    # Configuración de Supabase
├── migrations/
│   └── 20240101000000_initial_schema.sql          # Estructura de la BD
└── seed.sql                                       # Datos de la BD
```

## Notas Importantes

1. **Backup:** Siempre haz backup de tus datos antes de hacer cambios
2. **Credenciales:** Nunca commitees el archivo `.env` al repositorio
3. **Sincronización:** Este proceso descarga una copia estática. Para cambios en tiempo real, considera usar replicación
4. **Rendimiento:** Para bases de datos grandes, considera descargar solo tablas específicas

## Comandos de Mantenimiento

### Resincronizar Solo Datos (sin cambiar estructura)
```bash
supabase db dump --data-only -f supabase/seed.sql
supabase db reset
```

### Resincronizar Solo Estructura (sin datos)
```bash
supabase db dump --schema-only -f supabase/migrations/20240101000000_initial_schema.sql
supabase db reset
```

### Resincronización Completa
Repetir todo el proceso desde el Paso 4.

## Descarga de Edge Functions

### Paso 8: Descarga de Edge Functions

Las Edge Functions se deben descargar por separado ya que no están incluidas en el dump de la base de datos.

#### Opción A: Descarga Manual (una por una)
```bash
# Listar todas las funciones disponibles
supabase functions list

# Descargar una función específica
supabase functions download nombre-de-la-funcion
```

#### Opción B: Descarga Automática (recomendado)
Usar el script automatizado que descarga todas las funciones:

```bash
# Ejecutar el script de descarga automática
./aux_migracion/download_functions.sh
```

**El script descargará automáticamente todas las Edge Functions:**
- 38 funciones en total
- Se guardan en `supabase/functions/`
- Incluye manejo de errores y reporte de progreso

### Verificación de Edge Functions

```bash
# Verificar que las funciones se descargaron
ls -la supabase/functions/

# Contar el número de funciones
ls supabase/functions/ | wc -l

# Verificar el contenido de una función específica
cat supabase/functions/getCarMarketIntelligenceData/index.ts
```

### Servir Edge Functions Localmente

Para que las Edge Functions aparezcan en la interfaz web de Supabase Studio (`http://127.0.0.1:54323/project/default/functions`), es necesario servirlas localmente:

```bash
# Servir todas las funciones localmente
supabase functions serve

# Servir una función específica
supabase functions serve nombre-de-la-funcion --port 54321
```

**URLs de las funciones locales:**
- Base URL: `http://127.0.0.1:54321/functions/v1/`
- Ejemplo: `http://127.0.0.1:54321/functions/v1/getCarMarketIntelligenceData`

**Visualización en Supabase Studio:**
- Una vez que `supabase functions serve` esté ejecutándose, las funciones aparecerán automáticamente en la interfaz web
- Acceder a: `http://127.0.0.1:54323/project/default/functions`
- Las funciones se mostrarán con sus nombres, estado y última actualización

**Nota importante:** Las funciones solo aparecen en la interfaz web cuando están siendo servidas localmente. Si detienes el comando `supabase functions serve`, las funciones desaparecerán de la interfaz web.

## Estructura Completa Resultante

Después del proceso completo, deberías tener:

```
auto_cazador_autos/
├── .env                                    # Variables de entorno
├── aux_migracion/                          # Archivos de migración
│   ├── GUIA_SINCRONIZACION_SUPABASE.md   # Esta guía
│   ├── download_functions.sh              # Script de descarga de funciones
│   ├── finciones.csv                      # Lista de funciones
│   └── schema_completo.sql                # Esquema completo
├── supabase/
│   ├── config.toml                        # Configuración local
│   ├── seed.sql                           # Datos de producción
│   ├── migrations/
│   │   └── 20240101000000_initial_schema.sql
│   └── functions/                         # Edge Functions (38 funciones)
│       ├── detectar-duplicados/
│       ├── extractor-vehiculos/
│       ├── getCarMarketIntelligenceData/
│       └── ... (35 funciones más)
└── ...
```

## Comandos de Mantenimiento Actualizados

### Resincronizar Solo Edge Functions
```bash
# Eliminar funciones existentes
rm -rf supabase/functions/

# Ejecutar script de descarga
./aux_migracion/download_functions.sh
```

### Resincronización Completa (Estructura + Datos + Funciones)
```bash
# 1. Resincronizar estructura y datos
supabase db dump --schema-only -f supabase/migrations/20240101000000_initial_schema.sql
supabase db dump --data-only -f supabase/seed.sql
supabase db reset

# 2. Resincronizar funciones
./aux_migracion/download_functions.sh
```

---

**Fecha de creación:** $(date)
**Versión de Supabase CLI probada:** 2.45.5
**Sistema operativo:** macOS
**Edge Functions descargadas:** 38 funciones