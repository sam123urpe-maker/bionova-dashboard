---
name: SKILL-HACER-BOT
description: Genera workflows de n8n personalizados para clientes de BioNova a partir de un config_json y un workflow base. Se invoca cuando el admin dice "haz los flujos", "genera el bot", "procesa las solicitudes", o pide crear workflows para clientes.
type: skill
---

# Bot Generator — BioNova

Dado un `config_json` de un cliente (el "mini JSON" generado desde el formulario
"Crear Agente") y un workflow BASE de n8n de referencia, genera un workflow de n8n
personalizado, listo para importar, para ese cliente específico.

## Cuándo usar este skill

Cuando el admin de BioNova (Lazz) te pida generar un bot para un cliente:
- "Genera el bot para [cliente]"
- "Crea el workflow de [nombre_curso]"
- "Procesa las solicitudes pendientes"
- O cuando el admin te pase directamente un archivo `config_json`

## Requisitos previos

Antes de ejecutar, necesitas dos archivos:

1. **config_json** — el mini JSON del cliente, generado por el formulario "Crear Agente".
   Puede venir de:
   - Un archivo `.json` en el escritorio (`~/Desktop/bots-clientes/`)
   - La tabla `solicitudes_bot` en Supabase (columna `config_json`)
   - Directamente pegado en el chat

2. **Workflow BASE** — el JSON del workflow de n8n que sirve como plantilla.
   - Por defecto: el workflow "FLUJO SUERTE Y REMEDIOS" (ID: `3OwwF6vlreDekIZn`)
     en `https://bright-kelpie.pikapod.net`
   - O una ruta local que el admin te indique

Si el admin no te da la ruta del workflow base, pregúntale. No la asumas.

## Paso a paso

### Paso 1: Leer y validar el config_json

Carga el `config_json` y verifica que tenga TODOS los campos obligatorios:

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `cliente_id` | string (UUID) | Sí |
| `nombre_negocio` | string | Sí |
| `api_key` | string | Sí |
| `nombre_agente` | string | Sí |
| `curso.nombre` | string | Sí |
| `curso.descripcion` | string | Sí |
| `curso.precio_oferta` | number | Sí |
| `curso.precio_regular` | number | Sí |
| `curso.moneda` | string | Sí |
| `medios_pago` | array (min 1) | Sí |
| `medios_pago[].tipo` | "yape" \| "plin" \| "transferencia_bancaria" \| "otro" | Sí |
| `medios_pago[].dato` | string | Sí |
| `medios_pago[].titular` | string | Sí |
| `link_entrega` | string \| null | No (pero recomendado) |
| `bonos_extras` | string[] \| null | No |
| `mensaje_bienvenida` | string \| null | No |
| `fecha_solicitud` | string (ISO 8601) | Sí |

Si falta algún campo obligatorio, DETENTE y avisa claramente qué falta.
No generes un workflow incompleto.

### Paso 2: Obtener el workflow base

Descarga el workflow base usando la API de n8n:

```bash
curl -H "X-N8N-API-KEY: <key>" \
  https://bright-kelpie.pikapod.net/api/v1/workflows/3OwwF6vlreDekIZn
```

O lee el archivo local si el admin te dio una ruta.

La API key de n8n es:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOGVhNzQyMC1lMGViLTQ4OGUtYmJmZC02NmY4MzQyM2MxYzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2ViNTI0ZmYtMGZhYS00YzE2LTkwMGEtZTIxOTMzMWQ1YWM5IiwiaWF0IjoxNzgzMjU1MzIzfQ.IZfvUIONdBictCLzjiAdX7BnWFYLZrtMEJ83AMBaYdo
```

### Paso 3: Personalizar el workflow

Trabaja sobre una COPIA del workflow base. Nunca modifiques el original.

#### 3a) Nodo "Cliente Config"

Reemplaza el valor de `CLIENTE_API_KEY` en el nodo Set llamado "Cliente Config":

```json
{
  "name": "CLIENTE_API_KEY",
  "value": "<api_key del config_json>"
}
```

#### 3b) Mensajes de bienvenida / oferta inicial

Busca TODOS los nodos HTTP Request que envían el mensaje inicial de oferta.
En el flujo actual son los nodos que contienen el texto del producto en `jsonBody` o en `bodyParameters`.

Para CADA uno, reemplaza:

| Texto actual | Reemplazar por |
|-------------|---------------|
| Nombre del producto hardcodeado | `config_json.curso.nombre` |
| Descripción del producto hardcodeada | `config_json.curso.descripcion` |
| Precio de oferta hardcodeado (ej. "S/.10") | `config_json.curso.moneda` + `config_json.curso.precio_oferta` |
| Precio regular hardcodeado (ej. "S/.50") | `config_json.curso.moneda` + `config_json.curso.precio_regular` |
| Bonos hardcodeados | `config_json.bonos_extras` (si existen) |
| Link de Drive hardcodeado | `config_json.link_entrega` |

#### 3c) Agentes de IA (AI Agent nodes)

Hay 6 agentes en el flujo base (3 para cada producto). Para el bot de un cliente,
puedes necesitar solo 3 (un producto = 3 niveles de oferta: principal, 1ra oferta, 2da oferta).

En el `systemPrompt` o `text` de cada AI Agent, reemplaza:

- **Nombre del agente**: "Samantha" / "DigiPro Closer" / "Asesora Samantha" → `config_json.nombre_agente`
- **Nombre del producto**: hardcodeado → `config_json.curso.nombre`
- **Descripción del producto**: hardcodeada → `config_json.curso.descripcion`
- **Precio oferta**: hardcodeado → `${config_json.curso.moneda} ${config_json.curso.precio_oferta}`
- **Precio regular**: hardcodeado → `${config_json.curso.moneda} ${config_json.curso.precio_regular}`
- **Medios de pago**: hardcodeados → generados dinámicamente desde `config_json.medios_pago`
- **Bonos**: hardcodeados → `config_json.bonos_extras`

**Formato de medios de pago en los prompts:**

Para cada medio de pago en `config_json.medios_pago`, genera una línea como:

```
${medio.tipo.toUpperCase()}: ${medio.dato}
Titular: ${medio.titular}
```

Si el cliente tiene 2 o 3 medios de pago, lista todos. Adapta el texto del prompt
para que incluya todos los medios, no solo uno.

**Mensaje de bienvenida personalizado:**

Si `config_json.mensaje_bienvenida` NO es null, reemplaza el mensaje de bienvenida
por defecto en el prompt del agente PRINCIPAL con el texto del cliente.

Si es null, usa un mensaje genérico:
```
¡Hola! Soy ${config_json.nombre_agente}, tu asesor virtual de ${config_json.nombre_negocio}.
¿Te interesa conocer más sobre "${config_json.curso.nombre}"?
```

#### 3d) Mensajes de entrega post-pago

Busca los nodos que envían el link de entrega después de confirmar el pago.
Reemplaza el link hardcodeado por `config_json.link_entrega`.

Si `link_entrega` es null, deja el mensaje genérico sin link (solo confirmación de pago).

#### 3e) Adaptar el flujo para UN solo producto

El workflow base maneja DOS productos (Suerte/Rituales y Remedios) con un Switch
que bifurca según el kit seleccionado. Para un cliente con UN solo producto:

1. Elimina la bifurcación de "kit selection" (el Switch que pregunta "suerte o remedios")
2. Deja solo UNA rama de producto con sus 3 niveles de oferta
3. Elimina los nodos de la otra rama

O alternativamente, mantén la estructura pero reemplaza AMBOS productos con el mismo
curso del cliente (más simple, menos errores).

La decisión depende de la complejidad del flujo base que estés usando.

#### 3f) WhatsApp API credentials

Los nodos HTTP Request que llaman a `graph.facebook.com` usan un token de WhatsApp
Business API. Este token y el Phone Number ID son del SISTEMA (BioNova), NO del cliente.
**No los reemplaces.** Déjalos como están.

Lo mismo aplica para:
- API keys de Groq (análisis de imágenes de pago)
- API key de ImgBB (subida de imágenes)
- Credenciales de Supabase

### Paso 4: Renombrar el workflow

Cambia el nombre del workflow a:
```
BOT - {config_json.nombre_negocio} - {config_json.curso.nombre}
```

### Paso 5: Guardar el archivo

Crea la carpeta `~/Desktop/bots-clientes/` si no existe.

Guarda el JSON resultante con nombre:
```
{slugify(nombre_negocio)}-{slugify(nombre_curso)}-{fecha}.json
```

Función `slugify`:
```javascript
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

Ejemplo: `bionova-megakit-de-rituales-2026-07-08.json`

### Paso 6: Resumen final

Al terminar, muestra un resumen claro:

```
Bot generado exitosamente

Cliente: {nombre_negocio}
Curso: {curso.nombre}
Precio: {moneda} {precio_oferta} (regular: {precio_regular})
Medios de pago: {cantidad} configurados
Link de entrega: {link_entrega o "No especificado"}
Bonos: {cantidad de bonos o "Ninguno"}
Mensaje personalizado: {Sí/No}

Campos personalizados en el workflow:
- Cliente Config: API Key reemplazada
- {N} mensajes de oferta: nombres, precios, bonos actualizados
- {N} agentes IA: prompts actualizados con datos del curso
- {N} mensajes de entrega: link reemplazado
- {N} medios de pago integrados en todos los mensajes

Archivo: ~/Desktop/bots-clientes/{nombre-archivo}.json

Revisa el archivo antes de importarlo a n8n.
```

## Validaciones

Antes de dar el workflow por terminado, verifica:

1. No quedan placeholders sin reemplazar (busca "Samantha", "S/.10", "S/.50",
   "910 801 141", links de Drive viejos en TODO el JSON).
2. El api_key en Cliente Config es EXACTAMENTE el del config_json (sin espacios extra).
3. El nombre del workflow empieza con "BOT - ".
4. El JSON es válido (sin comas extra, sin campos undefined).
5. Todos los `{{ }}` expressions de n8n siguen intactos (no rompiste ninguna sintaxis).
6. La cantidad de medios de pago en los mensajes coincide con `config_json.medios_pago.length`.

## Manejo de variaciones

### Cantidad variable de medios de pago

Si el config_json tiene 1 medio de pago → el mensaje solo menciona ese.
Si tiene 2 → menciona ambos (Yape + Plin, por ejemplo).
Si tiene 3+ → lista todos.

Genera el texto de medios de pago dinámicamente, no uses un template fijo.

### Bonos opcionales

Si `bonos_extras` es null o array vacío → elimina las líneas de "BONUS GRATIS" de
los mensajes de oferta y de los prompts de los agentes.

Si tiene bonos → insértalos como lista en el mismo formato que el flujo original.

### Mensaje de bienvenida opcional

Si es null → usa el mensaje genérico del Paso 3c.
Si tiene valor → úsalo textualmente, sin modificarlo.

## Workflow base de referencia

- **Nombre en n8n**: "FLUJO SUERTE Y REMEDIOS"
- **ID**: `3OwwF6vlreDekIZn`
- **Instancia**: `https://bright-kelpie.pikapod.net`
- **Nodos**: ~96 (varía según la versión)
- **Productos**: Suerte (Rituales) + Remedios
- **Estructura**: WhatsApp Trigger → API Key validation → Audio/Image routing → Kit selection → 3 niveles de oferta por producto → Payment validation → Delivery

## Notas importantes

- Este skill genera un archivo JSON para que el admin lo REVISE antes de importar/desplegar.
- No despliega automáticamente el workflow en n8n — solo lo genera.
- El admin debe verificar visualmente el resultado antes de subirlo.
- Si algo no cuadra (ej. el workflow base cambió su estructura), avisa al admin en vez de
  generar un workflow potencialmente roto.
