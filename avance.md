# BioNova Dashboard — Documentación de Avance

> Última actualización: 2026-07-08

## Resumen del Proyecto

BioNova es una plataforma SaaS multi-tenant para automatizar ventas de cursos digitales vía WhatsApp. Los clientes (negocios) se registran, obtienen una API key única (`bionova_...`), y envían una solicitud para que se les arme un bot vendedor 24/7. El admin procesa las solicitudes, arma los bots en n8n, y los entrega. Cada cliente tiene su dashboard con KPIs, gráficos, tabla de leads, revenue, y visor de conversaciones de WhatsApp.

**Stack:** Next.js 16.2.10 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Supabase (Auth, DB, Realtime) + Vercel (deploy) + n8n (workflows de WhatsApp)

**Repositorio:** `https://github.com/sam123urpe-maker/bionova-dashboard.git`

---

## Estructura del Proyecto

```
bionova-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Server component, fetches leads y auth
│   │   ├── dashboard.tsx               # Client component, dashboard principal
│   │   ├── globals.css                 # Tailwind v4 import
│   │   ├── layout.tsx                  # Root layout
│   │   ├── login/page.tsx              # Login con Supabase Auth
│   │   ├── registro/page.tsx           # Registro (signUp + auto-genera api_key)
│   │   ├── crear-agente/page.tsx       # Formulario de solicitud de bot
│   │   ├── admin/bots/
│   │   │   ├── page.tsx                # Server component, fetch solicitudes
│   │   │   └── bots-client.tsx         # Panel admin de bots (procesar/entregar/descargar)
│   │   └── auth/callback/route.ts      # Supabase auth callback
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── header.tsx              # Header con logo, "Tu ID", bots link, logout
│   │   │   ├── date-filter.tsx         # Filtro por fecha (hoy, ayer, semana, mes, calendario)
│   │   │   ├── kpi-cards.tsx           # KPIs (contactos, pagados, conversión, esperando)
│   │   │   ├── revenue-card.tsx        # Revenue (hoy, semana, mes) con S/.
│   │   │   ├── bot-building.tsx        # 3 componentes:
│   │   │   │                           #   - BotBuilding (loading screen 8s con Lottie rocket)
│   │   │   │                           #   - BotBuildingBanner (banner cliente: chatbot Lottie)
│   │   │   │                           #   - AdminBotsBanner (banner admin: bots pendientes)
│   │   │   ├── charts/
│   │   │   │   ├── status-donut.tsx    # Gráfico donut de estados
│   │   │   │   └── kit-bar.tsx         # Gráfico de barras por kit
│   │   │   ├── table/
│   │   │   │   ├── clients-table.tsx   # Tabla de leads con filtros, paginación, click para ver mensajes
│   │   │   │   ├── status-badge.tsx    # Badge de estado (pagado/abandonado/esperando/falta)
│   │   │   │   ├── table-filters.tsx   # Filtros dropdown + búsqueda
│   │   │   │   └── table-pagination.tsx # Paginación
│   │   │   └── messages/
│   │   │       ├── message-viewer.tsx  # Slideover panel de chat (mensajes, imágenes, audio, video)
│   │   │       ├── image-lightbox.tsx  # Overlay full-screen para ver imágenes
│   │   │       └── audio-player.tsx    # Player de audio inline para notas de voz
│   │   └── ui/
│   │       └── card.tsx                # Componente Card reutilizable
│   ├── hooks/
│   │   └── useRealtime.ts              # Hook de Supabase Realtime para leads
│   ├── lib/
│   │   ├── auth.ts                     # getAuthUser, getScopeClienteId, getSolicitudActiva
│   │   ├── date.ts                     # Utilidades de fecha (Lima timezone, filtros por período)
│   │   └── supabase/
│   │       ├── client.ts               # Cliente browser de Supabase
│   │       └── server.ts               # Cliente server de Supabase
│   └── types/
│       └── client.ts                   # Interfaces: Lead, Mensaje, Conversacion, SolicitudBot, etc.
├── public/
│   ├── logo.png
│   └── animations/
│       ├── robot-building.json         # Lottie: cohete/avión de papel (loading screen)
│       └── live-chatbot.json           # Lottie: chatbot animado (banners del dashboard)
├── supabase_schema.sql                 # ESQUEMA COMPLETO de la base de datos
├── package.json
└── tsconfig.json
```

---

## Base de Datos (Supabase)

Ejecutar `supabase_schema.sql` en el SQL Editor de Supabase para crear/actualizar todas las tablas.

### Tablas

| Tabla | Descripción | Columnas clave |
|-------|-------------|----------------|
| `clientes` | Cuentas de negocio/clientes | `id` (UUID), `nombre`, `email`, `api_key` (auto-gen: `bionova_` + 40 hex), `rol` (admin/cliente), `whatsapp_numero`, `bot_activo`, `metodo_whatsapp` |
| `leads` | Contactos/leads de WhatsApp | `id`, `cliente_id`, `telefono`, `kit`, `estado`, `ofertas_enviadas`, `recibio_oferta`, `ultima_interaccion_ms` |
| `solicitudes_bot` | Solicitudes de creación de bots | `id` (UUID), `cliente_id`, `nombre_curso`, `precios`, `medios_pago`, `config_json`, `estado` (pendiente/procesando/entregado) |
| `conversaciones` | Agrupa mensajes por contacto | `id` (UUID), `cliente_id`, `telefono`, `UNIQUE(cliente_id, telefono)` |
| `mensajes` | Mensajes individuales de WhatsApp | `id` (UUID), `conversacion_id`, `wa_message_id`, `secuencia` (autoincremental), `remitente` (contacto/bot/agente_humano), `tipo` (texto/imagen/audio/video/documento), `url_adjunto`, `estado_envio` |
| `mensajes_fallidos` | Mensajes que fallaron al procesar | `payload_original` (JSONB), `motivo_error`, `intentos`, `resuelto` |

### RLS (Row Level Security)

- **Función `get_auth_cliente_id()`**: Resuelve `clientes.email = auth.jwt() ->> 'email'`
- **Función `is_admin()`**: Verifica si `clientes.rol = 'admin'`
- **Todas las tablas** tienen RLS habilitado con políticas SELECT/INSERT/UPDATE basadas en `is_admin()` o `cliente_id = get_auth_cliente_id()`
- `mensajes_fallidos`: solo admin puede ver/editar, cualquiera puede insertar (para webhooks de n8n)
- `clientes`: INSERT público para registro, SELECT/UPDATE limitado a propio usuario o admin

### Realtime

Habilitado en: `leads`, `mensajes`, `conversaciones`

---

## Flujos de la Aplicación

### 1. Registro y Login
1. Cliente se registra en `/registro` con email, nombre, contraseña, whatsapp (opcional)
2. Supabase Auth crea el usuario + trigger genera `api_key` única (`bionova_...`)
3. Cliente inicia sesión en `/login`
4. Auth callback (`/auth/callback`) intercambia el code por sesión

### 2. Dashboard Principal (`/`)
- **Server component** (`page.tsx`): fetch leads, auth user, solicitud activa, pending bots count
- **Client component** (`dashboard.tsx`):
  - Suscripción Realtime a leads (actualiza KPIs, gráficos, tabla en vivo)
  - Filtro por fecha: Hoy, Ayer, Esta semana, Este mes, Todo (o fecha personalizada con calendario)
  - KPIs: contactos totales, pagados, tasa de conversión, esperando
  - Revenue: hoy, esta semana, este mes
  - Gráficos: donut de estados, barras por kit
  - Tabla de leads con filtros, búsqueda y paginación

### 3. Solicitud de Bot (`/crear-agente`)
1. Cliente llena formulario: nombre curso, descripción, precios, medios de pago, link de entrega, bonos, mensaje de bienvenida
2. Se envía a `solicitudes_bot` con `config_json` completo (incluye `api_key` para n8n)
3. Animación Lottie de "construyendo" (cohete, 8 segundos, frases escalonadas)
4. Redirect al dashboard donde ve el banner de "bot en construcción"

### 4. Panel Admin de Bots (`/admin/bots`)
- Solo accesible si `clientes.rol = 'admin'`
- Tabla de solicitudes pendientes/procesando (últimos 7 días o todas)
- Acciones: Descargar JSON individual, Descargar todas (ZIP), Marcar como "Procesando", Marcar como "Entregado"
- Al marcar "Entregado", se actualiza `clientes.bot_activo = true` y el cliente ve su dashboard completo

### 5. Visor de Mensajes WhatsApp
- Click en cualquier fila de la tabla de leads → abre slideover panel derecho
- Busca la `conversacion` por `telefono`, carga `mensajes` ordenados por `secuencia`
- Suscripción Realtime a nuevos mensajes de esa conversación
- Chat bubbles: contacto (izquierda, gris), bot (derecha, ámbar), agente humano (derecha con label)
- Soporta: texto, imágenes (click → lightbox), audio (player inline), video, documentos
- Agrupación por fecha (Hoy, Ayer, fecha completa)
- Auto-scroll al final, botón "scroll to bottom" si hay mensajes nuevos mientras scrolleado arriba
- Indicador de mensaje fallido (`estado_envio = 'fallido'`)

### 6. Estados del Dashboard por Cliente
- **Sin bot activo + sin solicitud**: CTA "Potencia tu negocio con un Agente Virtual" + features bloqueadas
- **Sin bot activo + solicitud pendiente**: Banner con chatbot Lottie + frases cicladas + "En revisión"
- **Con bot activo**: Dashboard completo con KPIs, gráficos, revenue, tabla de leads, visor de mensajes

---

## Navegación y Roles

### Cliente
- `/` — Dashboard (limitado o completo según `bot_activo`)
- `/crear-agente` — Solicitar bot
- Header: logo, "Tu ID" (api_key), contador de contactos, estado live/desconectado, email, logout

### Admin (`clientes.rol = 'admin'`)
- `/` — Dashboard completo de TODOS los clientes
- `/admin/bots` — Panel de bots (procesar solicitudes)
- `/crear-agente` — Crear agente
- Header adicional: link "Bots", botón "Crear Agente"
- Banner de bots pendientes con chatbot Lottie (si `pendingBotsCount > 0`)

---

## Integración con n8n

El workflow de n8n (`https://bright-kelpie.pikapod.net`, ID: `3OwwF6vlreDekIZn`) debe:

1. **Recibir config_json** de `solicitudes_bot` (incluye `api_key`, datos del curso, medios de pago, etc.)
2. **Identificar al cliente** por `api_key` → buscar en `clientes` por `api_key`
3. **Al recibir/enviar mensaje WhatsApp**:
   - Buscar o crear `conversacion` con `cliente_id` + `telefono`
   - Insertar en `mensajes` con `wa_message_id` único (previene duplicados), `secuencia` autoincremental
   - Si falla, insertar en `mensajes_fallidos` con `payload_original` completo
4. **Actualizar `leads`**: `ultima_interaccion_ms`, `estado`, `ofertas_enviadas`, `recibio_oferta`, etc.
5. **Timezone**: Usar `$now.setZone('America/Lima').toISOString()` para timestamps correctos (no `toFormat()` sin timezone)

---

## Decisiones Técnicas

- **`useRealtime`**: Refresca todos los leads ante cualquier cambio (no filtra por fila). Simple y suficiente para el volumen actual.
- **Mensajes**: `secuencia` autoincremental por conversación vía trigger (más confiable que ordenar por timestamp).
- **`api_key`**: Formato `bionova_` + 40 caracteres hexadecimales. Generada por trigger SQL al insertar en `clientes`.
- **Admin**: Detectado por `clientes.rol = 'admin'` (ya no por email hardcodeado).
- **Lottie**: `lottie-react` para animaciones del robot construyendo y chatbot del dashboard.
- **Estilos**: Tailwind v4 con `@import "tailwindcss"` en globals.css. Sin tailwind.config.ts.
- **Slug**: Función `slugify()` en bots-client para nombres de archivo (quita acentos, normaliza).

---

## Animaciones Lottie

| Archivo | Uso | Descripción |
|---------|-----|-------------|
| `public/animations/robot-building.json` | `BotBuilding` (loading screen) | Cohete/avión de papel volando |
| `public/animations/live-chatbot.json` | `BotBuildingBanner` + `AdminBotsBanner` | Chatbot animado con ojos, manos, burbujas de chat |

---

## Archivos a Subir (Deploy)

```bash
git add .
git commit -m "mensaje"
git push
# Vercel auto-deploy desde master
```

---

## SQL para Crear/Actualizar la BD

Ejecutar el archivo `supabase_schema.sql` completo en:
**Supabase Dashboard → SQL Editor → New Query → Pegar y ejecutar**

El script es idempotente: usa `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`, y `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`. Se puede ejecutar múltiples veces sin riesgo.
