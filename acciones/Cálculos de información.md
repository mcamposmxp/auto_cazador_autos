# Origen de datos y cálculo de variables

## `Filtros de Estado`

### 1. Obtener lista de ubicaciónes

**Se obtiene de la API .../v3/ads_sites**


* **País**:

  * https://api.maxipublica.com/v3/ads_sites/?categoryId=v_1_29_4_8_1
  * Se identifica la búsqueda en todo el país por el resultado en`"search.searchLevel": "country"`
  * Los valores de las**ubicaciónes** se obtienen de "`availableFilters`.`values`" donde el objeto del arreglo tiene este valor`"availableFilters.locationId"`
  * Los valores del**tipo de vendedor** se obtiene desde el arreglo de objetos`"availableFilters.values`" donde el objeto del arreglo tiene este valor`"availableFilters.sellerType`"
* **Estado**:

  * https://api.maxipublica.com/v3/ads_sites/?categoryId=v_1_29_4_8_1&locationId=STS09
  * Se identifica la búsqueda en todo el país por el resultado en`"search.searchLevel": "myLocation"`
  * `"filters.values"` donde se filtran el objeto`"filters.id"` =`"state"`
  * los valores del**tipo de vendedor** se obtiene desde el arreglo de objetos`"availableFilters.values"` donde el objeto del arreglo tiene este valor`"availableFilters.sellerType`"
* **Zona económica**:

  * https://api.maxipublica.com/v3/ads_sites/?categoryId=v_1_29_4_8_1&locationId=STS09&economicZone=true
  * Se identifica la búsqueda en todo el país por el resultado en`"search.searchLevel": "Centrosur"`
  * Los valores de las**ubicaciónes**  se obtienen de`"filters.values"` donde se filtran el objeto`"filters.id"` =`"state"`
  * los valores del**tipo de vendedor** se obtiene desde el arreglo de objetos`"availableFilters.values"` donde el objeto del arreglo tiene este valor`"availableFilters.sellerType"`


### 2 Obtener lista de tipo de vendedor


* * https://api.maxipublica.com/v3/ads_sites/?categoryId=v_1_29_4_8_1
  * Los valores del**tipo de vendedor** se obtiene desde el arreglo de objetos`"availableFilters.values`" donde el objeto del arreglo tiene este valor`"availableFilters.sellerType`"

### 3 Demanda del vehículo
getCarMarketIntelligenceData.
### 4 Marca modelo año
### 5 PRECIO PROMEDIO DE MERCADO
### 6 Versión
### 7 COMPETENCIA DEL MERCADO
### 8 Condiciones del mercado
### 9 Cantidad de Autos
### 10 Distribución de precios
### 11 RANGO DEL MERCADO
### 12 Gráfico de bigotes y cajas
### 13 Observaciones de la distribución de precios
### 14 Ver rangos de precios detallados
### 15 Precio base del mercado (precio al km promedio)
### 16 Ajuste porcentual del precio base
### 17 Precio ajustado
### 18 Deslizador del kilometraje para ajustar el precio
### 19 TIEMPO ESTIMADO DE VENTA (IA): Rango mínimo
### 20 TIEMPO ESTIMADO DE VENTA (IA): Rango máximo
### 21 Tiempo promedio de venta
### 22 PRECIO DE VENTA ESTIMADO
### 23 Autos Similares Actualmente Listados
### 24 Vehículo	
### 25 Precio
### 26 Kilometraje
### 27 Todas las ubicaciones
### 28 Todos los vendedores
### 29 Todas las plataformas


