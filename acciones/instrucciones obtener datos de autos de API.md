Debemos hacer un cambio en la programación, para que en lugar de qué los vehículos que se usarán para realizar el cálculo, se obtengan de la tabla 'anuncios_vehiculos' ahora se obtengan de la edge function  'maxi_similar_cars' donde se envira como parámetros los valores de 'versionId'.

Se debe tambien hacer una consulta a la  Edge Function getCarMarketIntelligenceData
Parámetro requerido: datos.versionId (obtenido del formulario previo donde se seleccionó marca, modelo, año y versión)
API consultada: https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/${versionId}
Valor extraído:

Actualmente se obtienen los vhiculos siilares de la tabla

`SELECT * FROM anuncios_vehiculos 
WHERE marca = 'marca_vehiculo' 
  AND modelo = 'modelo_vehiculo' 
  AND ano = año_vehiculo
  AND activo = true
ORDER BY precio ASC 
LIMIT 20`

En su lugar ahora los datos de los vehículos se obtendrán de la edge function 'maxi_similar_cars' donde se enviran como parámetros los valores de 'versionId'.

Actualmente los campos se obtienen así:

`const autosMapeados = data?.map(vehiculo => ({
  id: vehiculo.id,
  titulo: vehiculo.titulo || '',
  precio: vehiculo.precio || 0,
  kilometraje: vehiculo.kilometraje || 0,
  ano: vehiculo.ano || 0,
  ubicacion: vehiculo.ubicacion || '',
  sitio_web: vehiculo.sitio_web || '',
  url_anuncio: vehiculo.url_anuncio || ''
}))``

Ahora el mapeo de los datos los obtedremos de la API 'maxi_similar_cars', donde ahora se obtienen de los objetos dentro del arreglo de objetos "similarsCars"

  id: "id" dentro del objeto dentro del arreglo "similarsCars",
  titulo: "trim" dentro del objeto dentro del arreglo "similarsCars",
  precio: "price" dentro del objeto dentro del arreglo "similarsCars",
  kilometraje: "odometer" dentro del objeto dentro del arreglo "similarsCars",
  ano: "year" dentro del objeto dentro del arreglo "similarsCars",
  ubicacion: "location.state.name" dentro del objeto dentro del arreglo "similarsCars",
  sitio_web: "siteId" dentro del objeto dentro del arreglo "similarsCars",
  url_anuncio: "permalink" dentro del objeto dentro del arreglo "similarsCars",

Cálculos y Estadísticas Generadas
1. Estadísticas Básicas de Precio
Se obtiene de la API 'maxi_similar_cars' el arreglo de objetos "similarsCars" y se mapea para obtener los precios de los vehículos.

  totalAnuncios: cantidad de elementos dentro del arreglo de objetos "similarsCars" que regresa la API,
  precioMinimo: Valor minímo que se encuentra en el campo "price" dentro del arreglo de objetos "similarsCars",
  precioMaximo: Valor máximo que se encuentra en el campo "price" dentro del arreglo de objetos "similarsCars",
  precioPromedio: Valor promedio que se encuentra en el campo "price" dentro del arreglo de objetos "similarsCars",
  precioRecomendado:  data.suggestedPrice.suggestedPricePublish que se obtiene de la edge function 'getCarMarketIntelligenceData',
  precioPromedioMercado: Es el mismo que precioPromedio,



## tipos de tansmision válidas TRANS-AUTOMATICA, TRANS-CVTIVT, TRANS-MANUAL, TRANS-OTRO, TRANS-TRONIC