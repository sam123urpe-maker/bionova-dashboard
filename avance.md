# BioNova Dashboard — Documentación de Avance Completo

> Última actualización: **2026-07-08** — Sesión de reconstrucción de BD y documentación

---

## Resumen del Proyecto

BioNova es una plataforma SaaS multi-tenant para automatizar ventas de cursos digitales vía WhatsApp. Los clientes (negocios) se registran, obtienen una API key única (`bionova_...`), y envían una solicitud para que se les arme un bot vendedor 24/7. El admin procesa las solicitudes, arma los bots en n8n, y los entrega. Cada cliente tiene su dashboard con KPIs, gráficos, tabla de leads, revenue, y visor de conversaciones de WhatsApp.

**Stack:** Next.js 16.2.10 (App Router) + React 19.2.4 + TypeScript 5 + Tailwind CSS v4 + Supabase (Auth, DB, Realtime) + Vercel (auto-deploy) + n8n (workflows WhatsApp en Pikapod)

**Repositorio:** `https://github.com/sam123urpe-maker/bionova-dashboard.git`

**n8n:** `https://bright-kelpie.pikapod.net` (workflow ID: `3OwwF6vlreDekIZn`)

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

## n8n — Integración Pendiente ⚠️

### Estado actual
**El n8n NO fue configurado.** Las herramientas MCP de n8n no estaban disponibles en la sesión. Se escribió una guía detallada pero el código no se pegó en los workflows.

### Lo que hay que hacer

**Archivo de referencia:** `n8n_integracion_guide.md`

En cada workflow de n8n (suerte, remedios):

1. **Agregar variables de entorno** en n8n:
   - `SUPABASE_URL` = `https://xxxxxxxxxxxx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = tu service_role key de Supabase

2. **Agregar un Code node** después de cada mensaje recibido y después de cada mensaje enviado, con el código JavaScript de `n8n_integracion_guide.md`. El código:
   - Hace upsert en `conversaciones` (por `cliente_id` + `telefono`)
   - Inserta en `mensajes` con `wa_message_id` único (previene duplicados)
   - Si falla, guarda en `mensajes_fallidos` el `payload_original` completo

3. **Asegurar que los datos** que llegan al Code node incluyan: `cliente_id`, `telefono`, `wa_message_id`, `remitente`, `tipo`, `contenido`, `url_adjunto` (si es media)

4. ~~**Timezone fix**~~ ✅ aplicar `$now.setZone('America/Lima').toISOString()` — ya ajustado

### Mapeo de datos para el Code node

| Campo | Valor para mensaje entrante | Valor para mensaje saliente |
|-------|----------------------------|----------------------------|
| `cliente_id` | ID del cliente dueño del número | El mismo |
| `telefono` | Número del contacto que escribió | El mismo |
| `wa_message_id` | ID del mensaje de WhatsApp recibido | ID de confirmación al enviar |
| `remitente` | `"contacto"` | `"bot"` |
| `tipo` | `"texto"` / `"imagen"` / `"audio"` / `"video"` / `"documento"` | El mismo |
| `contenido` | Texto del mensaje o caption | Texto enviado por el bot |
| `url_adjunto` | URL de la imagen/audio/video | URL si el bot envió media |
| `duracion_segundos` | Duración del audio/video | La misma |
| `estado_envio` | `"enviado"` | `"enviado"` o `"fallido"` |
| `timestamp` | ISO 8601 con timezone Lima | El mismo |

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

## ⚠️ Dónde Nos Quedamos — PENDIENTE

### 1. 🚨 URGENTE: Ejecutar `fix_mensajes_table.sql` en Supabase SQL Editor
El script dropea la tabla `mensajes` vieja (con `telefono`, `direccion`, `url`, `timestamp_ms`) y la recrea con el esquema correcto (`conversacion_id`, `remitente`, `url_adjunto`, `wa_message_id`, `secuencia`, `estado_envio`). También crea `conversaciones` y `mensajes_fallidos`.

**Sin esto, el visor de mensajes NO va a funcionar** porque el código espera las columnas nuevas.

### 2. 🚨 URGENTE: Configurar n8n para guardar mensajes
Seguir la guía en **`n8n_integracion_guide.md`**:
- Agregar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como variables de entorno en n8n
- Pegar el Code node JS después de cada mensaje recibido y enviado en los workflows "suerte" y "remedios"
- Verificar que los datos que llegan al Code node tengan: `cliente_id`, `telefono`, `wa_message_id`, `remitente`, `tipo`, `contenido`

**Sin esto, no hay datos en `mensajes`** → el visor se queda vacío.

### 3. ~~Timezone fix en n8n~~ ✅ COMPLETADO
~~Cambiar `$now.setZone('America/Lima').toFormat('yyyy-LL-dd HH:mm:ss')` por `$now.setZone('America/Lima').toISOString()`~~ → Ya ajustado por el usuario.

### 4. Próxima sesión: conectar n8n MCP
Para que pueda modificar los workflows directamente desde Claude Code, necesito que el MCP de n8n esté configurado y conectado. Sin eso, solo puedo escribir guías.

---

## Resumen de Archivos en el Repositorio

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
| `fix_mensajes_table.sql` | SQL | **Script CORRECTO para ejecutar ahora** (dropea y recrea mensajes) |
| `n8n_integracion_guide.md` | Docs | Guía para pegar Code node en workflows n8n |
| `avance.md` | Docs | Este archivo — documentación completa |
| `public/animations/robot-building.json` | Lottie | Cohete/avión para loading screen |
| `public/animations/live-chatbot.json` | Lottie | Chatbot animado para banners |
| `money.svg` | Asset | Ícono revenue (en repo, no usado en componentes) |
