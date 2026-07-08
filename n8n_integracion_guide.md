# n8n Integration Guide — Guardar Mensajes en Supabase

Este documento explica cómo modificar tus workflows de n8n ("suerte" y "remedios")
para guardar todas las conversaciones y mensajes de WhatsApp en Supabase.

---

## Lo que necesitas en n8n

Necesitas una **credential de Supabase** en n8n. Si aún no la tienes:

1. n8n → Credenciales → Add credential → Supabase
2. Service Role Key (la encontrás en Supabase → Project Settings → API → `service_role` key)
3. URL de Supabase (`https://xxxxxxxxxxxx.supabase.co`)

---

## Paso 1: Agregar un nodo HTTP Request (Supabase) — Guardar conversación

Agrega este nodo **después de identificar al cliente y el número de teléfono**, pero **antes de guardar el mensaje individual**.

### Configuración del HTTP Request node:

| Campo | Valor |
|-------|-------|
| Method | POST |
| URL | `https://xxxxxxxxxxxx.supabase.co/rest/v1/conversaciones` |
| Authentication | Generic Credential Type → Supabase (la que creaste arriba) |
| Headers | `Content-Type: application/json`, `Prefer: return=representation` |
| Body | Ver código abajo |

### Body (expresión n8n):

```json
{
  "cliente_id": "{{ $json.cliente_id }}",
  "telefono": "{{ $json.telefono }}",
  "nombre_contacto": "{{ $json.nombre_contacto }}",
  "ultima_actividad": "{{ $now.toISOString() }}"
}
```

**Importante**: Marcar "On Conflict" si usas upsert. En el header agregar:
- `Prefer: resolution=merge-duplicates`

Esto hará upsert automático porque conversaciones tiene `UNIQUE(cliente_id, telefono)`.

---

## Paso 2: Agregar Code Node — Guardar cada mensaje

Agrega este Code node **después de enviar o recibir un mensaje de WhatsApp**.

### Configuración:

- Mode: **Run Once for All Items**
- Language: **JavaScript**

### Código:

```javascript
// ============================================================
// Guardar mensaje en Supabase (conversaciones + mensajes)
// ============================================================
// Este código se ejecuta DESPUÉS de enviar/recibir un mensaje
// por WhatsApp. Recibe datos del mensaje y los guarda en:
//   1. conversaciones (upsert por cliente_id + telefono)
//   2. mensajes (insert con wa_message_id único)
//   3. mensajes_fallidos (si algo falla)
// ============================================================

const items = $input.all();

for (const item of items) {
  const data = item.json;

  try {
    // -------------------------------------------------------
    // 1. UPSERT conversación
    // -------------------------------------------------------
    const convPayload = {
      cliente_id: data.cliente_id,
      telefono: data.telefono,
      nombre_contacto: data.nombre_contacto || null,
      ultima_actividad: new Date().toISOString()
    };

    const convResponse = await $helpers.httpRequest({
      method: 'POST',
      url: $env.SUPABASE_URL + '/rest/v1/conversaciones',
      headers: {
        'apikey': $env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(convPayload)
    });

    // La respuesta incluye la conversación (nueva o existente)
    const conversacion = Array.isArray(convResponse) ? convResponse[0] : convResponse;
    const conversacionId = conversacion?.id;

    if (!conversacionId) {
      throw new Error('No se pudo obtener conversacion_id');
    }

    // -------------------------------------------------------
    // 2. INSERT mensaje
    // -------------------------------------------------------
    const msgPayload = {
      cliente_id: data.cliente_id,
      conversacion_id: conversacionId,
      wa_message_id: data.wa_message_id || data.id || `wa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      remitente: data.remitente || 'contacto',  // 'contacto', 'bot', 'agente_humano'
      tipo: data.tipo || 'texto',               // 'texto', 'imagen', 'audio', 'video', 'documento'
      contenido: data.contenido || data.text || data.body || null,
      url_adjunto: data.url_adjunto || data.media_url || null,
      duracion_segundos: data.duracion_segundos || data.duration || null,
      estado_envio: data.estado_envio || 'enviado',
      timestamp: data.timestamp || new Date().toISOString()
    };

    const msgResponse = await $helpers.httpRequest({
      method: 'POST',
      url: $env.SUPABASE_URL + '/rest/v1/mensajes',
      headers: {
        'apikey': $env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(msgPayload)
    });

  } catch (error) {
    // -------------------------------------------------------
    // 3. FALLBACK: guardar en mensajes_fallidos
    // -------------------------------------------------------
    console.error('Error guardando mensaje:', error.message);

    try {
      await $helpers.httpRequest({
        method: 'POST',
        url: $env.SUPABASE_URL + '/rest/v1/mensajes_fallidos',
        headers: {
          'apikey': $env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          cliente_id: data.cliente_id || null,
          payload_original: data,
          motivo_error: error.message,
          intentos: 0,
          resuelto: false
        })
      });
    } catch (fallbackError) {
      console.error('FATAL: No se pudo guardar en mensajes_fallidos:', fallbackError.message);
    }
  }
}

// Pasar los items originales al siguiente nodo sin modificar
return items.map(item => ({ json: item.json }));
```

---

## Paso 3: Variables de entorno en n8n

Agrega estas variables en tu instancia de n8n (Settings → Environment Variables):

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service_role key de Supabase |

---

## Paso 4: Flujo completo (dónde va cada nodo)

```
WhatsApp Webhook (mensaje entrante)
    │
    ▼
[Identificar cliente por api_key o número]
    │
    ▼
[Procesar mensaje / IA / lógica del bot]
    │
    ▼
┌─────────────────────────────────────────┐
│  Code Node: Guardar en Supabase         │  ← PASO 2 (nuevo)
│  (el código de arriba)                  │
└─────────────────────────────────────────┘
    │
    ▼
[Enviar respuesta por WhatsApp]  ← también debe ejecutar el Code node después
    │
    ▼
┌─────────────────────────────────────────┐
│  Code Node: Guardar en Supabase         │  ← mismo nodo, para mensaje saliente
│  (mismo código, remitente = 'bot')      │
└─────────────────────────────────────────┘
```

---

## Datos que necesitas pasar al Code Node

Asegurate que el `$json` que llega al Code node tenga estos campos:

```javascript
{
  // REQUERIDOS:
  "cliente_id": "uuid-del-cliente",        // de clientes.id
  "telefono": "51999888777",               // número de WhatsApp del contacto

  // ID del mensaje de WhatsApp:
  "wa_message_id": "whatsapp_msg_12345",   // o data.id si viene de Baileys

  // Dirección del mensaje:
  "remitente": "contacto",                 // "contacto" | "bot" | "agente_humano"

  // Tipo y contenido:
  "tipo": "texto",                         // "texto" | "imagen" | "audio" | "video" | "documento"
  "contenido": "Hola, quiero info",        // el texto del mensaje (null si es media)

  // OPCIONALES:
  "nombre_contacto": "Juan Perez",         // si está disponible
  "url_adjunto": "https://...",            // URL de la imagen/audio/video
  "duracion_segundos": 42,                 // duración de audio/video
  "estado_envio": "enviado",               // "pendiente" | "enviado" | "fallido"
  "timestamp": "2026-07-08T15:30:00-05:00" // ISO 8601 con timezone
}
```

---

## Para mensajes enviados por el bot

Después de que el bot envía un mensaje por WhatsApp, ejecuta el mismo Code node pero con:

```javascript
{
  ...
  "remitente": "bot",
  "estado_envio": "enviado",
  "wa_message_id": "el_id_que_devuelve_whatsapp_al_enviar"
}
```

---

## Para manejar media (imágenes, audio, video)

Cuando el contacto envía una imagen:
```javascript
{
  "tipo": "imagen",
  "contenido": null,  // o el caption si tiene
  "url_adjunto": "https://...url_de_la_imagen...",
}
```

Cuando el contacto envía un audio:
```javascript
{
  "tipo": "audio",
  "contenido": null,
  "url_adjunto": "https://...url_del_audio...",
  "duracion_segundos": 35
}
```

---

## Verificación

Después de agregar el Code node:

1. Ejecuta el workflow con un mensaje de prueba
2. Revisa en Supabase Table Editor que:
   - Se creó una fila en `conversaciones`
   - Se creó una fila en `mensajes` con `secuencia = 1`
3. Si algo falla, revisa `mensajes_fallidos` para ver el error
4. Si el mismo wa_message_id llega de nuevo, la constraint UNIQUE lo rechaza (sin error)

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `duplicate key value violates unique constraint` | El `wa_message_id` ya existe | Normal, es el dedup funcionando. Ignorar. |
| `violates foreign key constraint` | `cliente_id` o `conversacion_id` no existe | Verificar que el cliente existe en `clientes` |
| `new row violates row-level security` | RLS bloqueando la inserción | Usar `service_role` key, no `anon` key |
| `Could not find the "conversacion_id"` | El upsert no devolvió datos | Agregar `Prefer: return=representation` al header |
