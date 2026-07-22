# BioNova Dashboard — Documentación de Avance Completo

> Última actualización: **2026-07-21** — Sesión #7: Pipeline completo (solicitud_to_clientes.py), documentación unificada, listo para prueba end-to-end

---

## Resumen del Proyecto

BioNova es una plataforma SaaS multi-tenant para automatizar ventas de cursos digitales vía WhatsApp. Los clientes (negocios) se registran, obtienen una API key única (`bionova_...`), y envían una solicitud para que se les arme un bot vendedor 24/7. El admin procesa las solicitudes, arma los bots en n8n, y los entrega. Cada cliente tiene su dashboard con KPIs, gráficos, tabla de leads, revenue, y visor de conversaciones de WhatsApp.

**Stack:** Next.js 16.2.10 (App Router) + React 19.2.4 + TypeScript 5 + Tailwind CSS v4 + Supabase (Auth, DB, Realtime) + Vercel (auto-deploy) + n8n (workflows WhatsApp en Pikapod)

**Repositorio:** `https://github.com/sam123urpe-maker/bionova-dashboard.git`

**n8n:** `https://bright-kelpie.pikapod.net` (workflow ID: `3OwwF6vlreDekIZn`, **v4: 111 nodos, 105 conexiones**)

---

## Estructura del Proyecto

```
bionova-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                         # Server component → fetch leads, auth, solicitudes, pending bots
│   │   ├── dashboard.tsx                    # Client component → dashboard principal con todos los estados
│   │   ├── globals.css                      # Tailwind v4 (@import "tailwindcss")
│   │   ├── layout.tsx                       # Root layout con fuente Geist
│   │   ├── login/
│   │   │   └── page.tsx                     # Login con Supabase Auth
│   │   ├── registro/
│   │   │   └── page.tsx                     # Registro (signUp + trigger SQL genera api_key)
│   │   ├── crear-agente/
│   │   │   └── page.tsx                     # Formulario completo → solicitudes_bot + animación Lottie
│   │   ├── admin/bots/
│   │   │   ├── page.tsx                     # Server component (solo admin, check por clientes.rol)
│   │   │   └── bots-client.tsx              # Panel admin: tabla, procesar/entregado, download JSON/ZIP
│   │   └── auth/callback/
│   │       └── route.ts                     # Supabase auth code exchange
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── header.tsx                   # Logo + "Tu ID" dropdown + Bots link (admin) + Crear Agente + logout
│   │   │   ├── date-filter.tsx              # Hoy, Ayer, Esta semana, Este mes, Todo, fecha personalizada
│   │   │   ├── kpi-cards.tsx                # 4 KPIs: contactos, pagados, conversión %, esperando
│   │   │   ├── revenue-card.tsx             # Revenue: hoy, semana, mes (con S/. formato)
│   │   │   ├── bot-building.tsx             # 3 componentes en 1 archivo:
│   │   │   │                                #   BotBuilding — loading screen 8s con Lottie cohete + frases
│   │   │   │                                #   BotBuildingBanner — banner cliente: chatbot Lottie + frases cicladas
│   │   │   │                                #   AdminBotsBanner — banner admin: X bots en construcción + link
│   │   │   ├── charts/
│   │   │   │   ├── status-donut.tsx         # Recharts donut: pagado/abandonado/esperando/falta
│   │   │   │   └── kit-bar.tsx              # Recharts barras: remedios vs suerte
│   │   │   ├── table/
│   │   │   │   ├── clients-table.tsx        # Tabla leads con filtros, búsqueda, paginación, click → mensajes
│   │   │   │   ├── status-badge.tsx         # Badge coloreado por estado
│   │   │   │   ├── table-filters.tsx        # Dropdowns (estado, kit, oferta) + search input
│   │   │   │   └── table-pagination.tsx     # Paginación (20 por página)
│   │   │   └── messages/
│   │   │       ├── message-viewer.tsx       # Slideover chat: conversaciones_id + realtime, burbujas, fechas
│   │   │       ├── image-lightbox.tsx       # Overlay full-screen ver imágenes (loading/error/loaded)
│   │   │       └── audio-player.tsx         # Player inline para notas de voz (play/pause, progress, time)
│   │   └── ui/
│   │       └── card.tsx                     # Componente Card genérico (border, rounded-xl, shadow-sm)
│   ├── hooks/
│   │   └── useRealtime.ts                   # Supabase Realtime: suscribe a cambios en leads → refresh
│   ├── lib/
│   │   ├── auth.ts                          # getAuthUser(), getScopeClienteId(), getSolicitudActiva()
│   │   │                                    # ClienteRecord incluye: id, email, nombre, api_key, rol, bot_activo
│   │   ├── date.ts                          # getLimaDateString(), filterByDate(), getWeekRevenue(), getMonthRevenue()
│   │   └── supabase/
│   │       ├── client.ts                    # createBrowserClient (singleton exportado)
│   │       └── server.ts                    # createServerClient con cookies
│   └── types/
│       └── client.ts                        # TODAS las interfaces:
│                                            # Lead, Mensaje, Conversacion, MensajeFallido, SolicitudBot,
│                                            # SolicitudBotInsert, MedioPago, EstadoFilter, KitFilter, OfertaFilter
├── public/
│   ├── logo.png
│   ├── money.svg                            # Ícono de revenue (no usado en componentes actualmente)
│   └── animations/
│       ├── robot-building.json              # Lottie: cohete/avión de papel (BotBuilding loading screen)
│       └── live-chatbot.json                # Lottie: chatbot animado con ojos, manos, burbujas (banners)
├── supabase_schema.sql                      # SQL del esquema original (puede fallar si tablas ya existen)
├── fix_mensajes_table.sql                   # SQL CORRECTO para ejecutar AHORA (dropea mensajes vieja y recrea)
├── n8n_integracion_guide.md                 # Guía paso a paso: Code node JS para guardar mensajes en Supabase
├── avance.md                                # Este archivo
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── next.config.ts
├── AGENTS.md                                # Referencia a docs de Next.js 16
└── CLAUDE.md                                # → @AGENTS.md
```

---

## Historial de Commits

| Commit | Descripción |
|--------|-------------|
| `343eef0` | Integrar Lottie animation para bot building screen (8s, frases escalonadas) |
| `a1bfdeb` | Switch a live chatbot Lottie animation (rocket para loading, chatbot para banner) |
| `de3aff4` | Agregar live chatbot animation al dashboard banner con frases cicladas cada 5s |
| `0427614` | Agregar chatbot animation banner para admin dashboard (AdminBotsBanner) |
| `ac4b6b3` | Renombrar "API Key" → "Tu ID" en el header |
| `7b3f613` | Agregar WhatsApp message viewer: chat UI slideover + image lightbox + audio player |
| `86cf2fa` | Schema completo Supabase (6 tablas + RLS + triggers), mensajes con nuevo esquema, admin por rol, avance.md |
| `6155463` | Agregar guía de integración n8n (Code node JS para guardar mensajes) |
| `dfc8f34` | Agregar fix_mensajes_table.sql (dropea tabla mensajes vieja, recrea con esquema correcto) |

---

## Base de Datos (Supabase)

### ⚠️ Script SQL a ejecutar AHORA

El archivo correcto para ejecutar en Supabase SQL Editor es:

**`fix_mensajes_table.sql`**

Este script:
1. Dropea la tabla `mensajes` vieja (la que tenía `telefono`, `direccion`, `url`, `timestamp_ms`)
2. Dropea `conversaciones` si existe
3. Crea `conversaciones` con `UNIQUE(cliente_id, telefono)`
4. Crea `mensajes` con el esquema nuevo (`conversacion_id`, `remitente`, `url_adjunto`, `wa_message_id`, `secuencia`, `estado_envio`)
5. Crea el trigger de `secuencia` autoincremental por conversación
6. Crea `mensajes_fallidos` (si no existe)
7. Configura Realtime en `mensajes` y `conversaciones`
8. Aplica políticas RLS completas

### Tablas (después de ejecutar fix_mensajes_table.sql)

| # | Tabla | Estado | Columnas principales |
|---|-------|--------|---------------------|
| 1 | `clientes` | ✅ Existe | `id` (UUID PK), `nombre`, `email` (UNIQUE), `api_key` (UNIQUE, auto-gen `bionova_`+40hex), `whatsapp_numero`, `rol` (`admin`/`cliente`), `metodo_whatsapp` (`baileys`/`cloud_api`), `activo`, `bot_activo`, `created_at` |
| 2 | `leads` | ✅ Existe | `id` (BIGINT), `cliente_id` (FK), `telefono`, `kit` (`remedios`/`suerte`), `estado` (`pagado`/`abandonado`/`esperando`/`falta`), `ofertas_enviadas`, `recibio_oferta`, `ultima_interaccion_ms`, `ultima_interaccion`, `processing` |
| 3 | `solicitudes_bot` | ✅ Existe | `id` (UUID PK), `cliente_id` (FK), `nombre_curso`, `precio_oferta`, `precio_regular`, `moneda`, `medios_pago` (JSONB), `config_json` (JSONB, incluye `api_key`), `estado` (`pendiente`/`procesando`/`entregado`), `created_at`, `procesado_at` |
| 4 | `conversaciones` | 🆕 Se crea con fix | `id` (UUID PK), `cliente_id` (FK), `telefono`, `nombre_contacto`, `ultima_actividad`, `created_at`, `UNIQUE(cliente_id, telefono)` |
| 5 | `mensajes` | 🔄 Se recrea con fix | `id` (UUID PK), `cliente_id` (FK), `conversacion_id` (FK), `wa_message_id`, `secuencia` (BIGINT autoincremental por conversación), `remitente` (`contacto`/`bot`/`agente_humano`), `tipo` (`texto`/`imagen`/`audio`/`video`/`documento`), `contenido`, `url_adjunto`, `duracion_segundos`, `estado_envio` (`pendiente`/`enviado`/`fallido`), `timestamp` (TIMESTAMPTZ), `created_at`, `UNIQUE(cliente_id, wa_message_id)` |
| 6 | `mensajes_fallidos` | 🆕 Se crea con fix | `id` (UUID PK), `cliente_id` (FK nullable), `payload_original` (JSONB), `motivo_error`, `intentos`, `resuelto`, `created_at` |

### RLS (Row Level Security)

**Funciones SQL auxiliares:**
- `get_auth_cliente_id()` — resuelve `clientes.id` desde `auth.jwt() ->> 'email'`
- `is_admin()` — verifica si `clientes.rol = 'admin'`

**Políticas por tabla:**

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `clientes` | Admin ve todo, cliente ve su fila | Público (registro) | Admin o propio cliente | — |
| `leads` | Admin ve todo, cliente ve sus leads | Admin o propio cliente | Admin o propio cliente | Solo admin |
| `solicitudes_bot` | Admin ve todo, cliente ve sus solicitudes | Authenticated + propio cliente | Solo admin | — |
| `conversaciones` | Admin ve todo, cliente ve sus conversaciones | Admin o propio cliente | Admin o propio cliente | — |
| `mensajes` | Admin ve todo, cliente ve sus mensajes | Admin o propio cliente | Admin o propio cliente | — |
| `mensajes_fallidos` | Solo admin | Público (n8n webhooks) | Solo admin | — |

### Realtime

Habilitado por `ALTER PUBLICATION supabase_realtime ADD TABLE` en: `leads`, `mensajes`, `conversaciones`

### Triggers

- **`trg_clientes_api_key`** — BEFORE INSERT en `clientes`: genera `api_key` automáticamente (`bionova_` + 40 hex) si no se proporciona
- **`trg_mensajes_secuencia`** — BEFORE INSERT en `mensajes`: calcula `MAX(secuencia) + 1` para la conversación

---

## Flujos Completos de la Aplicación

### 1. Registro y Login
1. Cliente va a `/registro` → llena email, nombre, contraseña, whatsapp (opcional)
2. Supabase Auth `signUp()` crea el usuario
3. Trigger `trg_clientes_api_key` genera `api_key` única (`bionova_` + 40 hex)
4. Cliente inicia sesión en `/login` con Supabase Auth
5. Auth callback en `/auth/callback` intercambia el code por sesión

### 2. Dashboard Principal (`/`)
**Server Component** (`page.tsx`):
- `getAuthUser()` → resuelve usuario + `clientes` (con `rol`)
- `getSolicitudActiva()` → para clientes sin bot activo
- `fetchPendingCount()` → para admin (bots pendientes)
- `fetchLeads()` → scoped por cliente (admin ve todos)

**Client Component** (`dashboard.tsx`):
- `useRealtime()` → suscripción a cambios en `leads`
- `DateFilter` → filtra por período (hoy, ayer, semana, mes, todo, fecha custom)
- `KpiCards` → 4 tarjetas: total contactos, pagados, % conversión, esperando
- `RevenueCard` → revenue hoy, esta semana, este mes
- `StatusDonut` + `KitBar` → gráficos Recharts
- `ClientsTable` → tabla con filtros, búsqueda, paginación, click para ver mensajes
- `MessageViewer` → slideover cuando se clickea un lead

### 3. Estados del Dashboard según el Cliente

| Estado | Qué ve |
|--------|--------|
| `!bot_activo && !solicitudActiva` | CTA "Potencia tu negocio" + 3 features bloqueadas ("Próximamente") |
| `!bot_activo && solicitudActiva` | `BotBuildingBanner` con chatbot Lottie + frases cicladas + badge "En revisión" |
| `bot_activo == true` | Dashboard completo: KPIs + revenue + gráficos + tabla + visor de mensajes |

### 4. Admin Dashboard
- `clientes.rol = 'admin'` → ve dashboard con datos de TODOS los clientes
- Si `pendingBotsCount > 0` → `AdminBotsBanner` con chatbot Lottie + "X bots en construcción" + link a `/admin/bots`
- Header: links extra "Bots" y botón "Crear Agente"

### 5. Solicitud de Bot (`/crear-agente`)
1. Formulario: nombre curso, descripción, precios (oferta/regular), moneda, medios de pago (yape/plin/transferencia/otro), link de entrega, bonos extra, mensaje de bienvenida
2. Submit → `solicitudes_bot.insert()` con `config_json` completo (incluye `api_key` para n8n)
3. `BotBuilding` → animación Lottie del cohete (8 segundos, 5 frases escalonadas cada 1.5s)
4. Al terminar → redirect al dashboard donde ve el banner de "en construcción"

### 6. Panel Admin de Bots (`/admin/bots`)
- Protegido: solo `clientes.rol = 'admin'`
- Tabla con: negocio, curso, precio (oferta/regular tachado), fecha, estado
- Acciones por solicitud:
  - **Procesar** (pendiente → procesando): actualiza `solicitudes_bot.estado`
  - **Entregado** (→ entregado): actualiza `solicitudes_bot.estado` + `procesado_at` + `clientes.bot_activo = true`
  - **Descargar JSON**: descarga el `config_json` individual
- **Descargar todas**: ZIP con carpetas por cliente, cada una con sus JSONs
- Filtro: últimos 7 días o todas

### 7. Visor de Mensajes WhatsApp
1. Click en fila de `ClientsTable` → setea `selectedLead`
2. `MessageViewer` slideover panel (420px, full height, fixed right):
   - **Loading**: spinner "Cargando mensajes..."
   - **Empty**: ícono + "No hay mensajes para este contacto"
   - **Error**: ícono + mensaje + botón "Reintentar"
   - **Populated**: mensajes agrupados por fecha (Hoy, Ayer, fecha)
3. Busca `conversacion` por `telefono` → carga `mensajes` ordenados por `secuencia`
4. Suscripción Realtime filtrada por `conversacion_id`
5. Burbujas:
   - `remitente = 'contacto'` → izquierda, gris claro, texto oscuro
   - `remitente = 'bot'` → derecha, ámbar, texto blanco
   - `remitente = 'agente_humano'` → derecha, ámbar, con label "Agente"
6. Media: imágenes (click → `ImageLightbox` full-screen), audio (`AudioPlayer` inline), video (HTML5 player), documento (link)
7. `estado_envio = 'fallido'` → indicador rojo "Error al enviar"
8. Auto-scroll al final al cargar, botón flotante si hay mensajes nuevos mientras scrolleado arriba

---

## n8n — Integración ✅ COMPLETADA

### Estado actual (v4)
**El workflow de n8n está importado y funcionando.** El flujo `FLUJO SUERTE Y REMEDIOS` (ID `3OwwF6vlreDekIZn`) en `bright-kelpie.pikapod.net` contiene **111 nodos con 105 conexiones**, usando HTTP Requests directos a la API REST de Supabase (sin nodos comunitarios).

### Cómo guarda mensajes en Supabase
El workflow NO usa un Code node. Usa HTTP Request nodes que llaman a la RPC `insertar_mensaje` de Supabase:

**Mensajes ENTRANTES (3 nodos):**
- **Textos**: `Logging Msg Entrante` → `POST /rest/v1/rpc/insertar_mensaje` con `_direccion: "entrante"`, `_tipo` dinámico
- **Imágenes**: `Logging Imagen Entrante (Suerte/Remedios)` → misma RPC con `_tipo: "imagen"`
- **Audio**: Se transcribe primero (Groq Whisper), luego se loguea como texto

**Mensajes SALIENTES (13 nodos) — NUEVO v3/v4:**
- **5 ofertas fijas** (v3): Después de cada HTTP Request a WhatsApp (ofertas, entregas, botones). Contenido hardcodeado.
- **6 respuestas de IA** (v4): Después de cada WhatsApp nativo de los AI Agents. Contenido dinámico: `={{ $('NOMBRE_AGENTE').item.json.output }}`
- **2 pagos inválidos** (v4): Después de `Responder Pago Invalido1/3`. Contenido hardcodeado.

Todos usan `_direccion: "saliente"` → la RPC mapea a `remitente: "bot"`.

**Deduplicación (v3):**
- Nodo IF `Duplicado?` entre `Logging Msg Entrante` y `Search a row by keyword`
- Si `insertar_mensaje` retorna null (mensaje duplicado por `ON CONFLICT`), el flujo se detiene

**retryOnFail (v3):**
- 10 nodos de logging + `Resolver Cliente` + `Registrar API Invalida`
- 3 intentos máximos, 2 segundos entre intentos

La RPC hace:
1. Upsert en `conversaciones` por `(cliente_id, telefono)`
2. INSERT en `mensajes` con `remitente`, `tipo`, `contenido`, `wa_message_id`
3. `ON CONFLICT (cliente_id, wa_message_id) DO NOTHING` — previene duplicados

---

## Todas las Interfaces TypeScript

```typescript
// === src/types/client.ts ===

interface Lead {
  id: number;
  cliente_id?: string;
  telefono: string;
  kit: "remedios" | "suerte";
  estado: "pagado" | "abandonado" | "esperando" | "falta";
  ofertas_enviadas: number;
  ultima_interaccion_ms: number;
  processing: boolean;
  recibio_oferta: "recibio" | "no_recibio" | "recibiodos";
  ultima_interaccion: string;
}

interface MedioPago {
  tipo: "yape" | "plin" | "transferencia_bancaria" | "otro";
  dato: string;
  titular: string;
}

interface SolicitudBot {
  id: string;
  cliente_id: string;
  nombre_curso: string;
  descripcion_curso: string | null;
  precio_oferta: number;
  precio_regular: number;
  moneda: string;
  medios_pago: MedioPago[];
  link_entrega: string | null;
  bonos_extras: string[] | null;
  mensaje_bienvenida: string | null;
  config_json: Record<string, unknown>;
  estado: "pendiente" | "procesando" | "entregado";
  created_at: string;
  procesado_at: string | null;
}

interface Conversacion {
  id: string;
  cliente_id: string;
  telefono: string;
  nombre_contacto: string | null;
  ultima_actividad: string;
  created_at: string;
}

interface Mensaje {
  id: string;
  cliente_id: string;
  conversacion_id: string;
  wa_message_id: string;
  secuencia: number;
  remitente: "contacto" | "bot" | "agente_humano";
  tipo: "texto" | "imagen" | "audio" | "video" | "documento";
  contenido: string | null;
  url_adjunto: string | null;
  duracion_segundos: number | null;
  estado_envio: "pendiente" | "enviado" | "fallido";
  timestamp: string;
  created_at: string;
}

interface MensajeFallido {
  id: string;
  cliente_id: string | null;
  payload_original: Record<string, unknown>;
  motivo_error: string;
  intentos: number;
  resuelto: boolean;
  created_at: string;
}

// === src/lib/auth.ts ===

interface ClienteRecord {
  id: string;
  email: string;
  nombre: string;
  api_key: string;
  whatsapp_numero: string | null;
  activo: boolean;
  bot_activo: boolean;
  rol: "admin" | "cliente";
}

interface DashboardUser {
  email: string;
  cliente: ClienteRecord | null;
  isAdmin: boolean;  // derivado de cliente.rol === 'admin'
}
```

---

## Decisiones Técnicas Clave

| Decisión | Razón |
|----------|-------|
| `clientes.rol` en vez de email hardcodeado | Escalable: más admins en el futuro sin cambiar código |
| `mensajes.secuencia` autoincremental por trigger | Más confiable que ordenar por timestamp (pueden llegar desordenados) |
| `UNIQUE(cliente_id, wa_message_id)` | Previene duplicados si n8n reenvía el mismo mensaje |
| `conversaciones` como tabla separada | Agrupa mensajes por contacto, permite metadata (nombre_contacto, ultima_actividad) |
| `mensajes_fallidos` con `payload_original` JSONB | Permite reprocesar mensajes que fallaron sin perder datos |
| `service_role` key para inserts desde n8n | By-passea RLS (el webhook de n8n no tiene sesión de usuario) |
| `useRealtime` refresca todos los leads | Simple, suficiente para el volumen actual |
| Lottie con `lottie-react` | Animaciones fluidas sin depender de GIFs pesados |
| Tailwind v4 con `@import "tailwindcss"` | Sin archivo de configuración, más rápido |
| `remitente` en vez de `direccion` | Más expresivo: `contacto`/`bot`/`agente_humano` vs `entrante`/`saliente` |

---

## Dependencias (package.json)

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.12.0",
    "@supabase/supabase-js": "^2.110.0",
    "jszip": "^3.10.1",
    "lottie-react": "^2.4.1",
    "lucide-react": "^1.23.0",
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.9.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/jszip": "^3.4.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## Deploy

```bash
git add .
git commit -m "mensaje"
git push
# Vercel detecta el push a master y hace deploy automático
```

**URL de producción:** (configurada en Vercel)

---

## ⚠️ Dónde Nos Quedamos — COMPLETADO ✅

### 1. ✅ COMPLETADO: Ejecutar `fix_mensajes_table.sql` en Supabase SQL Editor
Se ejecutó `fix_mensajes_table.sql`. La tabla `mensajes` ahora tiene el esquema correcto: `conversacion_id`, `remitente`, `url_adjunto`, `wa_message_id`, `secuencia`, `estado_envio`. También se crearon `conversaciones` y `mensajes_fallidos`.

### 2. ✅ CORREGIDO: RLS y políticas de seguridad (2026-07-08 sesión 2)
- **`leads`**: Las políticas estaban abiertas (`USING true`). Ahora usan `is_admin()` y `get_auth_cliente_id()`.
- **`leads`**: Agregado a `supabase_realtime` (no estaba, `useRealtime.ts` no funcionaba).
- **`solicitudes_bot`**: Cambiado de email hardcodeado (`'admin@bionova.com'`) a `is_admin()` — escalable a múltiples admins.
- **`clientes`**: Agregadas políticas UPDATE e INSERT que faltaban.
- **`generate_api_key()`**: Creada función con loop anti-colisión + trigger `trg_clientes_api_key`.
- **`clientes`**: Agregada política pública `clientes_select_public` para que n8n pueda resolver clientes por `api_key`.
- **Script**: `fix_rls_completo.sql` contiene todas estas correcciones.

### 3. ✅ CORREGIDO: RPC `insertar_mensaje` (2026-07-08 sesión 3)
- **Problema**: Había 2 funciones con el mismo nombre. PostgreSQL elegía la vieja (5 params, OID 17860) que referenciaba columnas inexistentes (`lead_telefono`, `direccion`). Las tablas `mensajes` y `conversaciones` estaban en **0 rows**.
- **Solución**: Borrada la función vieja. Solo queda la nueva con `_tipo TEXT DEFAULT 'texto'` que usa las columnas correctas (`telefono`, `remitente`, `tipo`, `cliente_id`).
- **`leads.kit`**: Eliminado CHECK constraint `IN ('remedios', 'suerte')`. Ahora acepta cualquier curso (`char_length(kit) > 0`).

### 4. ✅ CORREGIDO: Workflow n8n multi-tenant (v1 → v2)
Archivo: **`backend-suerte-remedios-v2.json`** (97 nodos, 96 conexiones). YA importado a n8n (`3OwwF6vlreDekIZn`).
- `Cliente Config`: + campo `CURSO` (dinámico, default `"suerte"`)
- `Logging Msg Entrante`: + `_tipo` dinámico desde `Edit Fields.tipo`
- `Logging Imagen Entrante (Suerte/Remedios)`: + `_tipo: "imagen"`
- 4 `Create a row*`: `kit` ahora usa `$('Cliente Config').item.json.CURSO` (dinámico)
- `Switch1` y `Switch3`: condiciones ahora comparan contra `Cliente Config.CURSO`
- **0 nodos Supabase comunitarios** (eliminados). 18 HTTP Requests directos a API REST de Supabase con credencial `supabaseApi`.

### 5. ✅ CORREGIDO: Aislamiento de admin
El admin ahora tiene su propio dashboard aislado como cualquier cliente. Su rol `admin` solo desbloquea features extra (panel Bots, AdminBotsBanner, descarga de JSONs).

### 6. ✅ COMPLETADO: Importar workflow corregido a n8n
El archivo `backend-suerte-remedios-v2.json` fue importado exitosamente (HTTP 200) al workflow `3OwwF6vlreDekIZn` en `bright-kelpie.pikapod.net`.

### 7. ✅ COMPLETADO: Variables de entorno en n8n
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configuradas en la credencial `supabaseApi` de n8n.

### 8. ✅ COMPLETADO: Skill SKILL-HACER-BOT actualizado
`skills/SKILL-HACER-BOT.md` — Arquitectura v2 con `CURSO` dinámico, `Cliente Config` multi-campo, lectura de `solicitudes_bot` desde Supabase, generación de JSON personalizado.

---

## Sesión 2026-07-08 #2 — Corrección RLS, RPC, n8n y aislamiento admin

### Cambios en Supabase

| Cambio | Archivo/Script |
|--------|---------------|
| RLS leads corregido (ya no `USING true`) | `fix_rls_completo.sql` |
| `leads` agregado a Realtime | `fix_rls_completo.sql` |
| `solicitudes_bot` usa `is_admin()` en vez de email | `fix_rls_completo.sql` |
| `clientes` políticas UPDATE + INSERT agregadas | `fix_rls_completo.sql` |
| `generate_api_key()` + trigger `trg_clientes_api_key` | `fix_rls_completo.sql` |
| Política pública `clientes_select_public` para n8n | Ejecutado manual |
| RPC `insertar_mensaje` reescrita para esquema nuevo | Ejecutado manual |
| Columna `rol` en `clientes` asegurada | PRE-FIX manual |

### Cambios en Código (Next.js)

| Archivo | Cambio |
|---------|--------|
| `src/app/page.tsx:71` | `fetchLeads(isAdmin ? null : clienteId)` → `fetchLeads(clienteId)` |
| `src/app/page.tsx:46` | Admin ahora puede ver su propia `solicitudActiva` |
| `src/app/dashboard.tsx:39` | `scopeId` ya no es `null` para admin |
| `src/lib/auth.ts:51` | `getScopeClienteId()` ya no retorna `null` para admin |

### Cambios en n8n

| Nodo | Cambio |
|------|--------|
| `Logging Msg Entrante` | `ANON_KEY` → `SERVICE_ROLE_KEY`, + `_tipo` dinámico |
| `Logging Imagen Entrante (Suerte)` | `ANON_KEY` → `SERVICE_ROLE_KEY`, + `_tipo: "imagen"` |
| `Logging Imagen Entrante (Remedios)` | `ANON_KEY` → `SERVICE_ROLE_KEY`, + `_tipo: "imagen"` |
| `Registrar API Invalida` | `ANON_KEY` → `SERVICE_ROLE_KEY`, body corregido, header duplicado removido |

### Nuevos archivos

| Archivo | Descripción |
|---------|-------------|
| `fix_rls_completo.sql` | Script unificado de corrección RLS + Realtime + trigger API key |
| `workflow_multitenant_fixed.json` | Workflow n8n corregido (en `claude-code-n8n/`) |

---

## Sesión 2026-07-08 #3 — Fix RPC, kit dinámico, importación n8n, skill actualizado

### Problema diagnosticado
- La RPC `insertar_mensaje` tenía 2 overloads. El viejo (OID 17860, 5 params) referenciaba columnas inexistentes (`lead_telefono`, `direccion`, `updated_at`). PostgreSQL elegía ese cuando n8n mandaba 5 params.
- Resultado: `mensajes` y `conversaciones` estaban en **0 rows**. El dashboard no mostraba ningún chat.
- `leads.kit` tenía CHECK constraint hardcodeado a `'suerte'/'remedios'`. Imposible crear otros cursos.
- El `workflow_multitenant_fixed.json` usaba nodos `n8n-nodes-base.supabase` (comunitario), no instalado en PikaPod. El flujo correcto era `backend-suerte-remedios.json` que usa HTTP Request a la API REST.

### Correcciones en Supabase
| Cambio | Detalle |
|--------|---------|
| RPC `insertar_mensaje` | `DROP FUNCTION ...(_cliente_id uuid, _lead_telefono text, _direccion text, _contenido text, _wa_message_id text)`. Solo queda la nueva con `_tipo TEXT DEFAULT 'texto'` |
| `leads.kit` | `ALTER TABLE DROP CONSTRAINT leads_kit_check; ALTER TABLE ADD CONSTRAINT ... CHECK (char_length(kit) > 0)` |

### Cambios en el workflow n8n (v2)
| Cambio | Nodos |
|--------|-------|
| `Cliente Config` + `CURSO` | Campo nuevo, default `"suerte"` |
| `_tipo` en Logging | `Logging Msg Entrante` (+ dinámico), `Logging Imagen *` (+ `"imagen"`) |
| `kit` dinámico | 4 `Create a row*`: `"={{ $('Cliente Config').item.json.CURSO }}"` |
| Switch dinámicos | `Switch1`, `Switch3`: condiciones usan `Cliente Config.CURSO` |

### Cambios en el skill
| Archivo | Cambio |
|---------|--------|
| `skills/SKILL-HACER-BOT.md` | Reescrito con arquitectura v2: `Cliente Config` multi-campo, `CURSO` dinámico, lectura de `solicitudes_bot`, generación de JSON personalizado |

### Archivos nuevos/modificados
| Archivo | Descripción |
|---------|-------------|
| `backend-suerte-remedios-v2.json` | Workflow v2 (97 nodos, dinámico, YA importado a n8n) |
| `skills/SKILL-HACER-BOT.md` | Skill actualizado con arquitectura v2 |
| `FLUJO_SUERTE_Y_REMEDIOS.md` | Documentación actualizada con sección 9 |
| `avance.md` | Este archivo — actualizado |

---

## 🔄 Lo que falta hacer

### Prioridad ALTA
1. **Probar el flujo end-to-end**: Enviar un mensaje de WhatsApp al número del bot y verificar que:
   - Aparece en `mensajes` y `conversaciones` en Supabase
   - El dashboard muestra el chat en el MessageViewer
   - Las imágenes y audios se loguean correctamente
   - Los mensajes SALIENTES del bot también aparecen en el chat

2. **Skills en el proyecto n8n**: El proyecto `claude-code-n8n` tiene skills en `.claude/skills/`. Verificar que el skill `n8n-mcp-tools-expert` esté instalado para usar MCP de n8n desde Claude Code.

### Prioridad MEDIA
3. **Skill SKILL-HACER-BOT — probarlo**: Ejecutar el skill con un `config_json` real de `solicitudes_bot` y generar el primer workflow personalizado. Verificar que todos los reemplazos son correctos, incluyendo los nuevos nodos de logging saliente.

4. **Formulario crear-agente**: Actualizar `src/types/client.ts` — `Lead.kit` ya no es `"remedios" | "suerte"` sino `string`. El `KitBar` chart y `KitFilter` en la tabla también deben actualizarse para ser dinámicos.

5. **Dashboard — kit dinámico**: `KitBar` chart muestra barras "remedios" vs "suerte" hardcodeado. Debe ser dinámico según los cursos del cliente.

### Prioridad BAJA
6. **WhatsApp Cloud API**: Si el cliente usa Cloud API en vez de Baileys, el trigger y envío de mensajes cambian. El campo `clientes.metodo_whatsapp` ya existe para esto pero no se usa en el flujo.

7. **Monitoreo y alertas**: Configurar alertas si `mensajes_fallidos` crece, o si un bot deja de responder.

---

## Sesión 2026-07-08 #4 — Logging mensajes salientes, retryOnFail, deduplicación

### Motivación
El dashboard MessageViewer mostraba conversaciones incompletas: solo los mensajes ENTRANTES del contacto. Las respuestas del bot (ofertas, links de entrega, respuestas de IA) nunca se guardaban en Supabase. El chat se veía unilateral.

### v3 — Ofertas fijas + retryOnFail + Duplicado?
**Archivo:** `backend-suerte-remedios-v3.json` (103 nodos, 99 conexiones)

| Cambio | Detalle |
|--------|---------|
| `retryOnFail` | 10 nodos: todos los logging + `Resolver Cliente` + `Registrar API Invalida`. 3 intentos, 2s intervalo |
| 5 logging de ofertas | Clonados de `Logging Msg Entrante`. Después de HTTP Request2/5/6/8/11/12. `_direccion: "saliente"`, contenido hardcodeado |
| `Duplicado?` IF | Entre `Logging Msg Entrante` y `Search a row by keyword`. Si RPC retorna null → detiene flujo |
| Wiring | 2 nodos insertados entre medias (HTTP Request5→Update a row4, HTTP Request→Update a row12). Resto terminales |

### v4 — Respuestas de IA + Pagos inválidos
**Archivo:** `backend-suerte-remedios-v4.json` (111 nodos, 105 conexiones)

| Cambio | Detalle |
|--------|---------|
| 6 logging de IA | Después de cada WhatsApp nativo (`Send message*`). Contenido: `={{ $('NOMBRE_AGENTE').item.json.output }}` — dinámico |
| 2 logging pago inválido | Después de `Responder Pago Invalido1/3`. Contenido hardcodeado |
| Wiring | Insertados entre WhatsApp→Update a row (igual que v3) |

### Inventario completo de logging saliente (13 nodos)

**Ofertas fijas (v3) — contenido hardcodeado:**
- `Logging Msg Saliente (Oferta Suerte)` ← HTTP Request2, HTTP Request8
- `Logging Msg Saliente (Entrega Suerte)` ← HTTP Request5 → Update a row4
- `Logging Msg Saliente (Botones)` ← HTTP Request6
- `Logging Msg Saliente (Entrega Remedios)` ← HTTP Request → Update a row12
- `Logging Msg Saliente (Oferta Remedios)` ← HTTP Request11, HTTP Request12

**Respuestas de IA (v4) — contenido dinámico:**
- `Logging Msg Saliente (Agente Rituales Principal)` ← Send message8 → Update a row1
- `Logging Msg Saliente (Agente Rituales 1ra Oferta)` ← Send message → Update a row2
- `Logging Msg Saliente (Agente Rituales 2da Oferta)` ← Send message1 → Update a row7
- `Logging Msg Saliente (Agente Remedios Principal)` ← Send message14 → Update a row15
- `Logging Msg Saliente (Agente Remedios 1ra Oferta)` ← Send message15 → Update a row13
- `Logging Msg Saliente (Agente Remedios 2da Oferta)` ← Send message16 → Update a row14

**Pagos inválidos (v4) — contenido hardcodeado:**
- `Logging Msg Saliente (Pago Invalido 1)` ← Responder Pago Invalido1
- `Logging Msg Saliente (Pago Invalido 3)` ← Responder Pago Invalido3

### Skill actualizado
`skills/SKILL-HACER-BOT.md` — Arquitectura v4:
- Paso 3b actualizado: los 5 logging de ofertas necesitan los mismos reemplazos de contenido que sus HTTP Request padre
- Paso 3f (nuevo): los 6 logging de IA NO necesitan personalización (contenido dinámico)
- Paso 3g (nuevo): logging de pago inválido actualizar si cambia el mensaje
- 12 validaciones (eran 7)
- Inventario completo de 13 nodos de logging saliente

### Archivos nuevos/modificados
| Archivo | Descripción |
|---------|-------------|
| `build_v3.py` | Script Python que genera v3 desde v2 |
| `build_v4.py` | Script Python que genera v4 desde v3 |
| `backend-suerte-remedios-v3.json` | Workflow v3 (103 nodos) |
| `backend-suerte-remedios-v4.json` | Workflow v4 (111 nodos, desplegado en n8n) |
| `skills/SKILL-HACER-BOT.md` | Actualizado a arquitectura v4 |
| `FLUJO_SUERTE_Y_REMEDIOS.md` | Documentación actualizada con sección 10 |
| `avance.md` | Este archivo — actualizado |

### Lección aprendida
Al hacer inventario de nodos que envían mensajes, buscar por **tipo de nodo** (`whatsApp`, `httpRequest`) además de por URL (`graph.facebook.com`). En v3 solo busqué por URL y omití 6 WhatsApp nativos + 2 HTTP Request sin logging.

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/page.tsx` | Server Component | Entry point: fetch leads, auth, solicitudes, pending bots |
| `src/app/dashboard.tsx` | Client Component | Dashboard completo con estados, gráficos, tabla, visor |
| `src/app/login/page.tsx` | Client Component | Login Supabase Auth |
| `src/app/registro/page.tsx` | Client Component | Registro con signUp |
| `src/app/crear-agente/page.tsx` | Client Component | Formulario solicitud bot + BotBuilding animation |
| `src/app/admin/bots/page.tsx` | Server Component | Fetch solicitudes para admin |
| `src/app/admin/bots/bots-client.tsx` | Client Component | UI del panel de bots |
| `src/components/dashboard/header.tsx` | Component | Header con Tu ID, navegación, logout |
| `src/components/dashboard/date-filter.tsx` | Component | Filtro por período + calendario |
| `src/components/dashboard/kpi-cards.tsx` | Component | 4 tarjetas KPI |
| `src/components/dashboard/revenue-card.tsx` | Component | Revenue hoy/semana/mes |
| `src/components/dashboard/bot-building.tsx` | Component | 3 en 1: BotBuilding + BotBuildingBanner + AdminBotsBanner |
| `src/components/dashboard/charts/status-donut.tsx` | Component | Donut chart (Recharts) |
| `src/components/dashboard/charts/kit-bar.tsx` | Component | Bar chart (Recharts) |
| `src/components/dashboard/table/clients-table.tsx` | Component | Tabla leads con click para mensajes |
| `src/components/dashboard/table/status-badge.tsx` | Component | Badges de estado |
| `src/components/dashboard/table/table-filters.tsx` | Component | Filtros dropdown + search |
| `src/components/dashboard/table/table-pagination.tsx` | Component | Paginación |
| `src/components/dashboard/messages/message-viewer.tsx` | Component | Slideover chat WhatsApp |
| `src/components/dashboard/messages/image-lightbox.tsx` | Component | Overlay full-screen imágenes |
| `src/components/dashboard/messages/audio-player.tsx` | Component | Player audio inline |
| `src/components/ui/card.tsx` | Component | Card wrapper |
| `src/hooks/useRealtime.ts` | Hook | Supabase Realtime para leads |
| `src/lib/auth.ts` | Lib | getAuthUser, getScopeClienteId, getSolicitudActiva |
| `src/lib/date.ts` | Lib | Fecha Lima, filtros por período, revenue semanal/mensual |
| `src/lib/supabase/client.ts` | Lib | Browser client Supabase |
| `src/lib/supabase/server.ts` | Lib | Server client Supabase |
| `src/types/client.ts` | Types | TODAS las interfaces TypeScript |
| `supabase_schema.sql` | SQL | Schema completo (versión inicial — puede fallar si tablas existen) |
| `fix_mensajes_table.sql` | SQL | Script para dropear y recrear mensajes con esquema correcto |
| `fix_rls_completo.sql` | SQL | **NUEVO** — Corrección RLS + Realtime + trigger API key |
| `n8n_integracion_guide.md` | Docs | Guía para pegar Code node en workflows n8n |
| `avance.md` | Docs | Este archivo — documentación completa |
| `public/animations/robot-building.json` | Lottie | Cohete/avión para loading screen |
| `public/animations/live-chatbot.json` | Lottie | Chatbot animado para banners |
| `money.svg` | Asset | Ícono revenue (en repo, no usado en componentes) |

---

## Sesión 2026-07-18/19 — Formulario dinámico, precios custom, infraestructura

### Cambios en Supabase (migraciones)

| Cambio | Detalle |
|--------|---------|
| `solicitudes_bot.precio_2da_oferta` | Nueva columna numeric para precio de cierre |
| `solicitudes_bot.whatsapp_token` | Nueva columna text |
| `solicitudes_bot.whatsapp_phone_number_id` | Nueva columna text |
| `solicitudes_bot.groq_api_key` | Nueva columna text |
| `solicitudes_bot.imgbb_api_key` | Nueva columna text |
| `solicitudes_bot.n8n_url` | Nueva columna text |
| `solicitudes_bot.n8n_api_key` | Nueva columna text |
| `leads.kit` CHECK | Reparado: `char_length(kit) > 0` (acepta cualquier curso) |

### Cambios en tipos (`src/types/client.ts`)

- `Lead.kit`: `"remedios" | "suerte"` → `string`
- `KitFilter`: `"remedios" | "suerte" | "todos"` → `string | "todos"`
- `SolicitudBot` y `SolicitudBotInsert`: + `precio_2da_oferta`, + 6 campos infra

### Cambios en formulario (`/crear-agente`)

Formulario reorganizado en 2 secciones:

**Sección Curso:**
- Nombre, descripción, precios (2x2: moneda/oferta, real/2da oferta)
- Medios de pago, link, bonos, bienvenida

**Sección Infraestructura:**
- API Key BioNova: pre-llenada con botón copiar
- WhatsApp Token, WhatsApp Phone ID (requerido), Groq API Key (req), ImgBB (req), n8n URL (req), n8n API Key (req)
- Cada campo con guía de dónde obtenerlo

### Cambios en tabla de leads

- Columna Teléfono: ícono de teléfono + burbuja de chat (siempre visible con opacidad 40%)
- Texto "Toca un numero para ver el chat"
- Filtro de kit: opciones dinámicas desde datos reales (no hardcodeado)

### Cambios en gráficos

- **KitBar**: agrupación dinámica por cualquier kit, 8 colores rotativos, ordenado por count descendente

### Cambios en panel admin (`/admin/bots`)

- **Bug fix**: server component ya no filtra por 7 días (causaba discrepancia con el banner)
- Precio muestra: `MONEDA oferta → MONEDA 2da_oferta` + `MONEDA regular` tachado
- Nueva columna **Infra**: 5 dots (Bot, CPU, Imagen, Webhook, Key) verde=OK, rojo=falta

### Commits

| Commit | Descripción |
|--------|-------------|
| `237f146` | feat: precios dinamicos, cursos personalizados y kit dinamico |
| `51e7fc0` | fix: panel admin bots no mostraba solicitudes antiguas |
| `cabe4a5` | feat: formulario completo con infraestructura y api_key pre-llenada |

### Pendiente próxima sesión

1. ~~Crear script `solicitud_to_clientes.py`~~ ✅ COMPLETADO (2026-07-21) — `bots-clientes/solicitud_to_clientes.py`
2. Probar el flujo end-to-end: formulario → admin → clientes.json → Claude Code (SKILL-HACER-BOT) → install_all.py → bot activo
3. ~~Agregar el placeholder `{{PRECIO_CIERRE}}` a `SKILL-HACER-BOT.md`~~ ✅ Ya estaba documentado (30 ocurrencias en workflow_base.json)

---
## Sesión 2026-07-21 — Pipeline completo + `solicitud_to_clientes.py` ✅

### Script creado

**Archivo:** `C:\Users\Lazz.p\Desktop\bots-clientes\solicitud_to_clientes.py`

Convierte `solicitudes_bot` (estado='procesando') → `clientes.json`. Soporta modo Supabase (lee directo de la DB con service_role) y modo archivo (desde JSON descargado del panel). Idempotente: si la `api_key_bionova` ya existe, actualiza en vez de duplicar.

### Pipeline de instalación

```
FASE 1: solicitud_to_clientes.py      → Conversión mecánica (Supabase → clientes.json)
FASE 2: Claude Code + SKILL-HACER-BOT → Personalización creativa (saludos, prompts, ofertas)
FASE 3: install_all.py                → Instalación mecánica (POST a PikaPods + activate)
```

### Documentación unificada

Creado `proyecto-completo.md` en `claude-code-n8n/` que une los 3 proyectos (bionova-dashboard, bots-clientes, flujo n8n).

### Listo para prueba end-to-end

El admin solo necesita: entrar a `/admin/bots` → click "Procesar" → abrir Claude Code en `bots-clientes\` → decir "ejecuta el pipeline completo".
