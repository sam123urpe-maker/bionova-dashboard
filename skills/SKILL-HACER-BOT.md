---
name: SKILL-HACER-BOT
description: Genera workflows de n8n personalizados para clientes de BioNova a partir de un config_json de solicitudes_bot (Supabase). Se invoca cuando el admin dice "haz los flujos", "genera el bot", "procesa las solicitudes", o pide crear workflows para clientes.
type: skill
---

# Bot Generator — BioNova

Dado un `config_json` de la tabla `solicitudes_bot` en Supabase (o un archivo JSON equivalente), genera un workflow de n8n personalizado listo para importar, partiendo del workflow base "FLUJO SUERTE Y REMEDIOS".

## Cuándo usar este skill

- "Genera el bot para [cliente]"
- "Crea el workflow de [nombre_curso]"
- "Procesa las solicitudes pendientes"
- Cuando el admin pase directamente un `config_json`

## Arquitectura actual (v4 — 2026-07-08)

### Workflow base
- **Nombre en n8n**: "FLUJO SUERTE Y REMEDIOS"
- **ID**: `3OwwF6vlreDekIZn`
- **Instancia**: `https://bright-kelpie.pikapod.net`
- **Archivo local**: `C:\Users\Lazz.p\Desktop\claude-code-n8n\backend-suerte-remedios-v4.json`
- **Nodos**: 111 | **Conexiones**: 105

### Nodo Cliente Config (multi-tenant)
El nodo Set llamado `Cliente Config` contiene los valores por cliente:
```json
{
  "name": "CLIENTE_API_KEY",
  "value": "<api_key del cliente>"
},
{
  "name": "CURSO",
  "value": "<nombre del curso>"
}
```

Estos valores alimentan TODO el flujo dinámicamente:
- `CURSO` → se usa como `kit` en la tabla `leads` y en los Switch de ruteo
- `CLIENTE_API_KEY` → `Resolver Cliente` busca en `clientes` por `api_key`

### Tablas de Supabase usadas por el flujo
| Tabla | Uso |
|-------|-----|
| `clientes` | `Resolver Cliente` — GET por `api_key` |
| `leads` | CRUD de contactos — POST (crear), GET (buscar), PATCH (actualizar) |
| `conversaciones` | Upsert automático vía RPC `insertar_mensaje` |
| `mensajes` | Insert vía RPC `insertar_mensaje` (texto, imagen, audio) |
| `mensajes_fallidos` | `Registrar API Invalida` — POST |

### RPC `insertar_mensaje`
La función en Supabase acepta 6 parámetros:
- `_cliente_id` UUID, `_lead_telefono` TEXT, `_direccion` TEXT ('entrante'/'saliente')
- `_contenido` TEXT, `_wa_message_id` TEXT, `_tipo` TEXT (DEFAULT 'texto')

Los nodos `Logging Msg Entrante`, `Logging Imagen Entrante (Suerte)` y `Logging Imagen Entrante (Remedios)` llaman esta RPC.

### v3/v4 — Novedades desde v2

| Cambio | Versión | Detalle |
|--------|---------|---------|
| `retryOnFail` | v3 | 10 nodos de logging + Resolver Cliente + Registrar API Invalida (3 intentos, 2s intervalo) |
| `Duplicado?` IF | v3 | Insertado entre Logging Msg Entrante y Search a row by keyword. Si `insertar_mensaje` retorna null (duplicado), frena el flujo |
| Logging saliente (ofertas) | v3 | 5 nodos nuevos después de HTTP Request2/5/6/8/11/12 con `_direccion: "saliente"` y contenido hardcodeado |
| Logging saliente (IA) | v4 | 6 nodos después de cada WhatsApp nativo de los AI Agents. Contenido dinámico: `={{ $('AGENT_NAME').item.json.output }}` |
| Logging saliente (pago inválido) | v4 | 2 nodos después de Responder Pago Invalido1/3 |

### Estructura del flujo (v4 simplificada)
```
WhatsApp Trigger
  → Edit Fields (telefono, texto, tipo)
  → Cliente Config (CLIENTE_API_KEY, CURSO)
  → Resolver Cliente (GET /clientes?api_key=...)
  → API Key Valida?
    ├── VALID:
    │   → Es Audio? → Transcribir → ...
    │   → Logging Msg Entrante (RPC insertar_mensaje)
    │   → Duplicado? [NUEVO v3] — si es duplicado, TERMINA aquí
    │   → Search a row by keyword (GET /leads?telefono=...)
    │   → Switch1 (kit == CURSO) → ofertas HTTP + AI Agents
    │   → [CADA WhatsApp send ahora tiene Logging Msg Saliente después]
    │   → Validación de pago (imagen → Groq → ¿válido?)
    │     ├── SÍ: Update estado=pagado + Entregar link + Logging Msg Saliente
    │     └── NO: Responder Pago Invalido + Logging Msg Saliente [NUEVO v4]
    └── INVALID:
        → Registrar API Invalida
```

### Inventario completo de nodos de logging saliente (13 total)

**Ofertas fijas (HTTP Request) — v3:**
| Nodo logging | Después de | Contenido |
|---|---|---|
| Logging Msg Saliente (Oferta Suerte) | HTTP Request2, HTTP Request8 | Texto fijo (oferta inicial rituales) |
| Logging Msg Saliente (Entrega Suerte) | HTTP Request5 | Texto fijo (link de entrega rituales) |
| Logging Msg Saliente (Botones) | HTTP Request6 | Texto fijo (interactive buttons) |
| Logging Msg Saliente (Entrega Remedios) | HTTP Request | Texto fijo (link de entrega remedios) |
| Logging Msg Saliente (Oferta Remedios) | HTTP Request11, HTTP Request12 | Texto fijo (oferta inicial remedios) |

**Respuestas de IA (WhatsApp nativo) — v4:**
| Nodo logging | Después de | Contenido |
|---|---|---|
| Logging Msg Saliente (Agente Rituales Principal) | Send message8 | `={{ $('RITUALES PRINCIPAL').item.json.output }}` |
| Logging Msg Saliente (Agente Rituales 1ra Oferta) | Send message | `={{ $('RITUALES 1RA OFERTA').item.json.output }}` |
| Logging Msg Saliente (Agente Rituales 2da Oferta) | Send message1 | `={{ $('RITUALES 2da OFERTA1').item.json.output }}` |
| Logging Msg Saliente (Agente Remedios Principal) | Send message14 | `={{ $('REMEDIOS PRINCIPAL').item.json.output }}` |
| Logging Msg Saliente (Agente Remedios 1ra Oferta) | Send message15 | `={{ $('REMEDIOS 1RA OFERTA').item.json.output }}` |
| Logging Msg Saliente (Agente Remedios 2da Oferta) | Send message16 | `={{ $('REMEDIOS 2DA OFERTA').item.json.output }}` |

**Pago inválido — v4:**
| Nodo logging | Después de | Contenido |
|---|---|---|
| Logging Msg Saliente (Pago Invalido 1) | Responder Pago Invalido1 | Texto fijo |
| Logging Msg Saliente (Pago Invalido 3) | Responder Pago Invalido3 | Texto fijo |

---

## Paso a paso

### Paso 1: Obtener el config_json

Lee el `config_json` de la tabla `solicitudes_bot` en Supabase:

```sql
SELECT id, cliente_id, nombre_curso, estado, config_json
FROM public.solicitudes_bot
WHERE estado = 'pendiente'
ORDER BY created_at ASC;
```

O recíbelo directamente del admin como archivo `.json`.

### Estructura del config_json (de solicitudes_bot)

```json
{
  "cliente_id": "uuid",
  "api_key": "bionova_xxx",
  "nombre_negocio": "BioNova",
  "nombre_agente": "AGENTE BioNova",
  "curso": {
    "nombre": "kit de rituales",
    "descripcion": "descripción del curso",
    "precio_oferta": 10,
    "precio_regular": 50,
    "moneda": "PEN"
  },
  "medios_pago": [
    { "tipo": "yape", "dato": "987654321", "titular": "Nombre" }
  ],
  "link_entrega": "https://...",
  "bonos_extras": null,
  "mensaje_bienvenida": null,
  "fecha_solicitud": "2026-07-08T..."
}
```

### Paso 2: Obtener el workflow base

**Opción A — Desde n8n (recomendado, siempre actualizado):**
```bash
curl -s -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOGVhNzQyMC1lMGViLTQ4OGUtYmJmZC02NmY4MzQyM2MxYzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2ViNTI0ZmYtMGZhYS00YzE2LTkwMGEtZTIxOTMzMWQ1YWM5IiwiaWF0IjoxNzgzMjU1MzIzfQ.IZfvUIONdBictCLzjiAdX7BnWFYLZrtMEJ83AMBaYdo" \
  "https://bright-kelpie.pikapod.net/api/v1/workflows/3OwwF6vlreDekIZn"
```

**Opción B — Desde archivo local:**
Leer `C:\Users\Lazz.p\Desktop\claude-code-n8n\backend-suerte-remedios-v4.json`

### Paso 3: Personalizar el workflow

Trabaja sobre una COPIA. NUNCA modifiques el original.

#### 3a) Nodo "Cliente Config"

Actualiza los dos valores en el nodo Set:
```json
{
  "name": "CLIENTE_API_KEY",
  "value": "<config_json.api_key>"
},
{
  "name": "CURSO",
  "value": "<config_json.curso.nombre>"
}
```

#### 3b) Mensajes de WhatsApp (HTTP Request a graph.facebook.com)

Hay 7 nodos HTTP Request que envían mensajes de WhatsApp a `graph.facebook.com`:
`HTTP Request2`, `HTTP Request5`, `HTTP Request6`, `HTTP Request8`, `HTTP Request`, `HTTP Request11`, `HTTP Request12`

En cada uno, reemplaza en el `jsonBody` o `bodyParameters`:

| Dato hardcodeado actual | Reemplazar por |
|--------------------------|----------------|
| Nombre del producto | `config_json.curso.nombre` |
| Descripción del producto | `config_json.curso.descripcion` |
| Precio "S/.10" o similar | `S/. {config_json.curso.precio_oferta}` |
| Precio regular "S/.50" | `S/. {config_json.curso.precio_regular}` |
| Link de Drive/entrega | `config_json.link_entrega` |
| Datos de medios de pago | Generar desde `config_json.medios_pago` |
| Bonos extras | `config_json.bonos_extras` (o eliminar si null) |

**IMPORTANTE:** Los 5 nodos de logging de ofertas (v3) que van DESPUÉS de estos HTTP Request tienen el contenido **hardcodeado** en `_contenido`. Debes aplicar los MISMOS reemplazos de arriba a sus `jsonBody._contenido`:
- `Logging Msg Saliente (Oferta Suerte)` → mismo contenido que HTTP Request2
- `Logging Msg Saliente (Entrega Suerte)` → mismo contenido que HTTP Request5
- `Logging Msg Saliente (Botones)` → mismo contenido que HTTP Request6
- `Logging Msg Saliente (Entrega Remedios)` → mismo contenido que HTTP Request
- `Logging Msg Saliente (Oferta Remedios)` → mismo contenido que HTTP Request11 |

#### 3c) Agentes de IA (system prompts)

6 nodos `@n8n/n8n-nodes-langchain.agent`:
`RITUALES PRINCIPAL`, `RITUALES 1RA OFERTA`, `RITUALES 2da OFERTA1`,
`REMEDIOS PRINCIPAL`, `REMEDIOS 1RA OFERTA`, `REMEDIOS 2DA OFERTA`

En el `systemPrompt` o `text` de cada uno, reemplaza:
- Nombre del agente → `config_json.nombre_agente`
- Nombre del producto → `config_json.curso.nombre`
- Descripción → `config_json.curso.descripcion`
- Precio → `{moneda} {precio_oferta}` / `{moneda} {precio_regular}`
- Medios de pago → generar desde `config_json.medios_pago`
- Bonos → `config_json.bonos_extras`

**Formato de medios de pago:**
```
YAPE: {dato} - {titular}
PLIN: {dato} - {titular}
TRANSFERENCIA: {dato} - {titular}
```

#### 3d) Mensajes de entrega post-pago

Nodos `HTTP Request5` y `HTTP Request` — reemplazar link de entrega por `config_json.link_entrega`.

#### 3e) Simplificar para UN solo curso

El workflow base maneja DOS paths (Switch1 bifurca por `kit`). Para un cliente con UN solo curso:

**Opción recomendada:** Mantén la estructura completa pero con AMBOS paths apuntando al mismo `CURSO`. Así el Switch1 siempre toma el primer match y el flujo funciona sin necesidad de eliminar nodos. Menos riesgo de romper conexiones.

Si el admin pide explícitamente flujo simplificado, elimina la segunda rama.

#### 3f) Logging de respuestas de IA (v4) — NO TOCAR contenido

Los 6 nodos `Logging Msg Saliente (Agente ...)` capturan la respuesta del AI Agent **dinámicamente** mediante `={{ $('NOMBRE_AGENTE').item.json.output }}`. El contenido NO necesita personalización porque se resuelve en runtime.

Lo ÚNICO que debes verificar es que el nombre del AI Agent en la expresión coincida con el nombre real del nodo (por si renombraste agentes en el paso 3c).

#### 3g) Logging de Pago Invalido (v4) — actualizar si cambia

Los 2 nodos `Logging Msg Saliente (Pago Invalido 1/3)` tienen el texto hardcodeado en `_contenido`. Si cambiaste el mensaje en `Responder Pago Invalido1/3`, replica el mismo cambio aquí.

#### 3h) Credenciales del sistema — NO TOCAR

Estos valores son de BioNova, NO del cliente. Déjalos intactos:
- Token de WhatsApp (`EAALrZBb...`) en headers `Authorization: Bearer`
- API Key de Groq (`gsk_...`) en `Gemini Analisis1/3`
- URL de Supabase (`cflbaocrsjmpmalgluch.supabase.co`)
- Credencial de Supabase en n8n (`supabaseApi`)
- API Key de ImgBB

### Paso 4: Renombrar el workflow

```json
"name": "BOT - {config_json.nombre_negocio} - {config_json.curso.nombre}"
```

### Paso 5: Guardar el archivo

Crear carpeta `C:\Users\Lazz.p\Desktop\bots-clientes\` si no existe.

Nombre de archivo:
```
{slug(nombre_negocio)}-{slug(curso.nombre)}-{fecha}.json
```

Función slug: lowercase, sin acentos, solo `[a-z0-9-]`.

Ejemplo: `bionova-kit-de-rituales-2026-07-08.json`

### Paso 6: Actualizar solicitudes_bot

Después de generar el workflow, marcar la solicitud como procesada:
```sql
UPDATE public.solicitudes_bot
SET estado = 'entregado', procesado_at = now()
WHERE id = '<solicitud_id>';
```

---

## Resumen final (formato de salida)

```
Bot generado exitosamente

Cliente: {nombre_negocio}
Curso: {curso.nombre}
Precio: {moneda} {precio_oferta} (regular: {precio_regular})
Medios de pago: {N} configurados
Link de entrega: {link_entrega o "No especificado"}
Bonos: {N bonos o "Ninguno"}

Cambios aplicados:
- Cliente Config: CLIENTE_API_KEY + CURSO actualizados
- {N} mensajes de WhatsApp: precios, nombres, links actualizados
- {N} agentes IA: prompts actualizados
- {N} mensajes de entrega: link reemplazado
- {N} medios de pago integrados

Archivo: C:\Users\Lazz.p\Desktop\bots-clientes\{nombre-archivo}.json

Revisa el archivo antes de importarlo a n8n.
```

---

## Validaciones finales

1. No quedan placeholders viejos ("Samantha", "S/.10", "S/.50", "910 801 141", links de Drive antiguos)
2. `CLIENTE_API_KEY` y `CURSO` en Cliente Config son exactamente los del config_json
3. El nombre del workflow empieza con "BOT - "
4. El JSON es válido y todos los `{{ }}` de n8n están intactos
5. La cantidad de medios de pago en los mensajes coincide con `config_json.medios_pago.length`
6. Si `bonos_extras` es null/empty, NO hay líneas de "BONUS" en ningún lado
7. Los nodos de Logging tienen `_tipo` correcto ("texto" dinámico, "imagen" fijo)
8. Los 5 nodos de logging de ofertas (v3) reflejan los mismos cambios de contenido que sus HTTP Request padre
9. Los 6 nodos de logging de IA (v4) referencian al nombre correcto del AI Agent: `={{ $('NOMBRE_EXACTO').item.json.output }}`
10. Si renombraste agentes en 3c, actualizaste las referencias en los logging de IA (3f)
11. El `_direccion` en TODO nodo de logging saliente es `"saliente"` (NO "entrante")
12. `retryOnFail` sigue activo en todos los nodos de logging (no se desactivó durante la edición)
