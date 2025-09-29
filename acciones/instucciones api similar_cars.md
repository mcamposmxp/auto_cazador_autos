Necesito crear una edge function para de nombre 'maxi_similar_cars' para hacer una consulta de la siguiente api, de la cual comparto el curl

`curl --location 'https://api.maxipublica.com/v3/ads_sites/210000?categoryId={versionId}&locationId=&transmission=TRANS-AUTOMATICA&kilometers=&origin=web' \
--header 'Authorization: {token_de_tabla_api_tokens} '`

donde el valor de:

'versionId' Se obtiene del resultado del formulario previo donde se seleccionó marca modelo, año y versión del vehículo.
'token_de_tabla_api_tokens' Se obtiene del campo 'token' que se encuentra en la tabla 'api_tokens'

Del resultado de esta consulta via API se regresará una estructura como la siguiente:

`
{
    "total": 33,
    "search": {
        "searchLevel": "country",
        "alert": "Se encontraron los siguientes autos en todo el país.",
        "averageLines": {
            "price": 493100,
            "odometer": 31100
        },
        "myCar": {
            "price": 0,
            "odometer": 0
        }
    },
    "similarsCars": [
        {
            "id": "MLM2361987905",
            "siteId": "mlm",
            "price": 519990,
            "odometer": 8390,
            "brand": "Audi",
            "model": "A3",
            "year": "2023",
            "trim": "1.4 Sedán 35tfsi Dynamic At Dsg",
            "condition": "Usado",
            "traction": "Delantera",
            "energy": "Gasolina",
            "transmission": "Automática",
            "bodyType": "Sedán",
            "armored": "No",
            "currency": "MXN",
            "status": "closed",
            "permalink": "https://auto.mercadolibre.com.mx/MLM-2361987905-audi-a3-14-sedan-35tfsi-dynamic-at-dsg-_JM",
            "thumbnail": "https://http2.mlstatic.com/D_741635-MLM86972911396_072025-I.jpg",
            "dateCreated": "2025-07-04T20:57:18.804Z",
            "daysInStock": 31,
            "sellerType": "professional",
            "location": {
                "address_line": "",
                "zip_code": "",
                "subneighborhood": null,
                "neighborhood": {
                    "id": "COL090140562",
                    "name": "Crédito Constructor"
                },
                "city": {
                    "id": "CTY09014",
                    "name": "Benito Juárez"
                },
                "state": {
                    "id": "STS09",
                    "name": "Distrito Federal"
                },
                "country": {
                    "id": "MX",
                    "name": "Mexico"
                },
                "latitude": 19.3655292,
                "longitude": -99.1795226
            }
        }
    ],
    "trend": {
        "name": "Ajuste Lineal",
        "equation": "y = mx + b",
        "m": "-0.817",
        "b": "518564.620",
        "values": {
            "8390": "511707.105",
            "17500": "504261.103",
            "61000": "468706.647"
        },
        "axis": {
            "x": "Kilometros",
            "y": "Precio"
        },
        "trendEquation": "y= -0.817x + 518564.620",
        "R2": 0.07720744185497389,
        "upper": {
            "m": "-0.817",
            "b": 544492.851,
            "values": {
                "8390": 537292.46025,
                "17500": 529474.15815,
                "61000": 492141.97935000004
            },
            "axis": {
                "x": "Kilometros",
                "y": "Precio"
            },
            "equation": "y= -0.817x + 544492.851"
        },
        "lower": {
            "m": "-0.817",
            "b": 492636.38899999997,
            "values": {
                "8390": 486121.74974999996,
                "17500": 479048.04785,
                "61000": 445271.31464999996
            },
            "axis": {
                "x": "Kilometros",
                "y": "Precio"
            },
            "equation": "y= -0.817x + 492636.38899999997"
        }
    },
    "filters": [],
    "availableFilters": []
}
`

de los cuales solo me interesa que se obtengan los siguientes campos:

`
{
    "total": 33,
    "search": {
        "searchLevel": "country",
        "alert": "Se encontraron los siguientes autos en todo el país.",
        "averageLines": {
            "price": 493100,
            "odometer": 31100
        },
        "myCar": {
            "price": 0,
            "odometer": 0
        }
    },
    "similarsCars": [
        {
            "id": "MLM2361987905",
            "siteId": "mlm",
            "price": 519990,
            "odometer": 8390,
            "brand": "Audi",
            "model": "A3",
            "year": "2023",
            "trim": "1.4 Sedán 35tfsi Dynamic At Dsg",
            "condition": "Usado",
            "traction": "Delantera",
            "energy": "Gasolina",
            "transmission": "Automática",
            "bodyType": "Sedán",
            "armored": "No",
            "currency": "MXN",
            "status": "closed",
            "permalink": "https://auto.mercadolibre.com.mx/MLM-2361987905-audi-a3-14-sedan-35tfsi-dynamic-at-dsg-_JM",
            "thumbnail": "https://http2.mlstatic.com/D_741635-MLM86972911396_072025-I.jpg",
            "dateCreated": "2025-07-04T20:57:18.804Z",
            "daysInStock": 31,
            "sellerType": "professional",
            "location": {
                "address_line": "",
                "zip_code": "",
                "subneighborhood": null,
                "neighborhood": {
                    "id": "COL090140562",
                    "name": "Crédito Constructor"
                },
                "city": {
                    "id": "CTY09014",
                    "name": "Benito Juárez"
                },
                "state": {
                    "id": "STS09",
                    "name": "Distrito Federal"
                },
                "country": {
                    "id": "MX",
                    "name": "Mexico"
                },
                "latitude": 19.3655292,
                "longitude": -99.1795226
            }
        }
    ],
    "trend": {
        "name": "Ajuste Lineal",
        "equation": "y = mx + b",
        "m": "-0.817",
        "b": "518564.620",
        "values": {
            "8390": "511707.105",
            "17500": "504261.103",
            "61000": "468706.647"
        },
        "axis": {
            "x": "Kilometros",
            "y": "Precio"
        },
        "trendEquation": "y= -0.817x + 518564.620",
        "R2": 0.07720744185497389
    }
}
`