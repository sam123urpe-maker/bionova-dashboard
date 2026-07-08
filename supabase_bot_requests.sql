-- ============================================
-- BioNova: Solicitudes de Bot + Multi-tenant
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- 1. AGREGAR COLUMNA bot_activo A clientes
-- ============================================
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS bot_activo boolean DEFAULT false;

-- Los clientes existentes con leads ya tienen bot activo
UPDATE public.clientes
SET bot_activo = true
WHERE id IN (SELECT DISTINCT cliente_id FROM public.leads WHERE cliente_id IS NOT NULL);

-- ============================================
-- 2. CREAR TABLA solicitudes_bot
-- ============================================
CREATE TABLE IF NOT EXISTS public.solicitudes_bot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_curso text NOT NULL,
  descripcion_curso text,
  precio_oferta numeric NOT NULL,
  precio_regular numeric NOT NULL,
  moneda text NOT NULL DEFAULT 'PEN',
  medios_pago jsonb NOT NULL,
  link_entrega text,
  bonos_extras jsonb,
  mensaje_bienvenida text,
  config_json jsonb NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'procesando', 'entregado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  procesado_at timestamptz
);

-- ============================================
-- 3. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON public.solicitudes_bot(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes_bot(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created ON public.solicitudes_bot(created_at DESC);

-- ============================================
-- 4. RLS: Habilitar
-- ============================================
ALTER TABLE public.solicitudes_bot ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS: INSERT - cualquier authenticated puede insertar
--     SOLO con su propio cliente_id
-- ============================================
DROP POLICY IF EXISTS "solicitudes_insert_own" ON public.solicitudes_bot;
CREATE POLICY "solicitudes_insert_own" ON public.solicitudes_bot
  FOR INSERT
  TO authenticated
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM public.clientes
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- ============================================
-- 6. RLS: SELECT - solo admin ve todas las filas
--     Los clientes normales NO pueden leer esta tabla
-- ============================================
DROP POLICY IF EXISTS "solicitudes_select_admin" ON public.solicitudes_bot;
CREATE POLICY "solicitudes_select_admin" ON public.solicitudes_bot
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@bionova.com');

-- ============================================
-- 7. RLS: UPDATE - solo admin
-- ============================================
DROP POLICY IF EXISTS "solicitudes_update_admin" ON public.solicitudes_bot;
CREATE POLICY "solicitudes_update_admin" ON public.solicitudes_bot
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@bionova.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@bionova.com');

-- ============================================
-- 8. PERMISOS
-- ============================================
GRANT INSERT ON public.solicitudes_bot TO authenticated;
GRANT SELECT ON public.solicitudes_bot TO authenticated;
GRANT UPDATE ON public.solicitudes_bot TO authenticated;

-- ============================================
-- 9. FUNCIÓN: Verificar si un cliente tiene
--    solicitud activa (pendiente o procesando)
-- ============================================
CREATE OR REPLACE FUNCTION public.cliente_tiene_solicitud_activa(cliente_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.solicitudes_bot
    WHERE cliente_id = cliente_uuid
      AND estado IN ('pendiente', 'procesando')
  );
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Tablas y RLS creadas correctamente' AS status;
