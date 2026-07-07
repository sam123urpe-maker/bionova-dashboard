# BioNova Dashboard

Panel de administracion para visualizar leads del bot de WhatsApp BioNova (kits "remedios" y "suerte").

## Stack

- Next.js (App Router) + TypeScript
- Supabase JS + Realtime
- Tailwind CSS
- Recharts + Lucide Icons
- Vercel (deploy)

## Setup

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase
npm run dev
```

## Deploy en Vercel

1. Conecta el repo a Vercel
2. Agrega las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

El dashboard no requiere autenticacion — solo comparte el link de Vercel de forma privada.
