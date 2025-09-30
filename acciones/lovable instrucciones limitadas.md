A partir de este momento **aplica siempre estas reglas para mis solicitudes**:

---

### 1. Alcance limitado

* Aplica cambios **únicamente en el archivo, función, componente o módulo que te indique**.
* **No modifiques nada fuera del alcance solicitado**, aunque pienses que puede mejorar el proyecto.

### 2. Base de datos

* **No cambies ni reestructures la base de datos** (tablas, modelos, relaciones, migraciones) salvo que yo lo pida de forma explícita.

### 3. Interfaz de usuario (UI)

* **No cambies diseño, estilos ni componentes de la interfaz** a menos que lo especifique en mi instrucción.

### 4. Lógica y funciones existentes

* Mantén intacta toda la lógica que ya funciona.
* No elimines ni renombres funciones, variables, rutas o controladores que no formen parte de lo solicitado.

### 5. Bitácora técnica (Changelog)

* Por **cada cambio realizado**, debes crear un archivo en la carpeta `changelog/`.
* El archivo debe estar en formato **Markdown** (`.md`).
* El nombre del archivo debe iniciar con el **timestamp en formato `YYYYMMDD_HHmmss`**, seguido de un guion bajo y un nombre breve que describa el cambio.

  * Ejemplo: `20250928_214500_validacion_precio_negativo.md`

#### Contenido del archivo Markdown:

Debe seguir esta estructura:

```markdown
# Changelog Técnico

**Usuario que solicitó el cambio:** ​(Nombre del usuario que solicita los cambios por ejemplo Miguel Campos)  
**Fecha y hora del cambio:** (Fecha y hora en formato `YYYY-MM-DD HH:mm:ss` cuando se realizó el cambio por ejemplo 2025-09-28 21:45:00)  
**Título del cambio:** (Breve descripción del cambio realizado por ejemplo Validación de precio en formulario de productos)  
**Instrucciones solicitadas:**  
(Descripción detallada de lo que se solicitó cambiar por ejemplo "Agrega validación para que el campo precio no acepte valores negativos en el formulario de productos.")

---

## Detalle técnico de los cambios aplicados
- Archivo(s) modificados: `/src/components/FormularioProducto.tsx`  
- Se añadió validación en la función `handleSubmit` para verificar que el campo `precio` sea >= 0.  
- Se ajustó el mensaje de error en el componente `InputPrecio`.  
- Se actualizaron pruebas unitarias en `/tests/FormularioProducto.test.tsx`.  

---
```

El nivel de detalle debe ser **profesional**, tal como lo haría un ingeniero de software en un entorno de control de versiones.

6. **Confirmación previa a aplicar cambios**
Antes de ejecutar, guardar o aplicar cualquier cambio solicitado, debes mostrarme un resumen claro y explícito de lo que vas a modificar y pedirme confirmación para proceder.
Sólo aplica el cambio después de que yo confirme y autorice explícitamente.
Si hay ambigüedad o duda sobre el alcance, pregunta y espera mi respuesta antes de modificar algo.
7. **Entrega del resultado**
Muestra los cambios de forma clara y explícita, solo en el archivo o fragmento afectado.
Antes de cerrar recuerda: “Verifica que no cambié nada fuera del alcance pedido”.

***

**Ejemplo de interpretación**
Si yo pido “agrega validación para que el campo precio no acepte valores negativos en el formulario de productos”:
Solo debes modificar la validación correspondiente en el formulario de productos.
No debes cambiar el modelo, la base de datos, otros formularios ni estilos.
Antes de aplicar el cambio, debes mostrarme un resumen de la modificación y **solicitar mi confirmación** para proceder.
Además, debes generar un archivo changelog en la carpeta changelog/ con el detalle técnico del cambio.

***
