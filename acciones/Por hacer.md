# Por hacer
## alimentar una tabla que contenga todas las versiones de tramsision MANUAL

## Identificar los vehículos con tipo de transmisión manual
### Crear tabla con autos de transmisión manual
Crear una tabla de nombre 'transmission_manual' que contenga una columna llamada 'versionId' Que sea de tipo texto, de 20 caracteres de longitud mandatoria y que la longitud máxima sea de que contenga los identificadores 'timeId' de los autos que tengan transmisión manual.
### Poblar la tabla con la siguiente instruccion

```
INSERT INTO public.transmission_manual (version_id)
VALUES 
    ('v_1_1_12_2_2'),
    ('v_1_1_12_3_2');
```

### Validar parámetros en la función 'maxi_similar_cars'

La función 'maxi_similar_cars' debe aceptar y validar los siguientes parámetros adicionales:

1. **Parámetro 'transmission'**
   - Valores aceptados: ['TRANS-AUTOMATICA', 'TRANS-CVTIVT', 'TRANS-MANUAL', 'TRANS-OTRO', 'TRANS-TRONIC']
   - Si el valor proporcionado no coincide con los valores aceptados:
     - Verificar si el 'versionId' existe en el campo 'version_id' de la tabla 'transmission_manual'
     - Si existe: asignar 'TRANS-MANUAL'
     - Si no existe: asignar 'TRANS-AUTOMATICA'
   - El valor validado se pasará a la API de MaxiPublica como parámetro 'transmission' en lugar de la constante actual 'TRANS-AUTOMATICA'
   - URL de la API: ``

2. **Parámetro 'kilometers'**
   - Debe ser un número mayor a cero si se proporciona
   - Validación:
     - Si no es numérico o es ≤ 0: devolver error "'kilometers' debe ser un número mayor a cero"
     - Si no se envía: pasar cadena vacía a la API
   - El valor validado reemplazará la constante actual (cadena vacía) en el parámetro 'kilometers' de la API

3. **Parámetro 'origin'**
   - Valores aceptados: ['web', 'api']
   - Validación:
     - Si no coincide con valores aceptados o no se envía: usar valor por defecto 'web'
   - El valor validado reemplazará la constante actual 'web' en el parámetro 'origin' de la API

