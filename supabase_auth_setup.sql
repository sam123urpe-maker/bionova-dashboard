-- ============================================
-- BioNova: Auth Trigger + RLS Setup
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- 1. Trigger: Auto-crear fila en clientes cuando se registra un nuevo usuario
--    Usa ON CONFLICT DO NOTHING para ser idempotente (admin ya tiene fila)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.clientes (email, nombre, activo)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Eliminar trigger si ya existe (por si acaso)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. RLS en clientes: usuarios autenticados leen solo su propio registro
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política SELECT: usuario ve solo su registro (por email)
DROP POLICY IF EXISTS "clientes_select_own" ON public.clientes;
CREATE POLICY "clientes_select_own" ON public.clientes
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- 3. RLS en leads: usuarios autenticados solo ven leads de su cliente_id
-- (se aplica cuando el webapp consulta con el anon key via REST)
-- Nota: el admin ve todo via service_role en server components
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Si la tabla leads NO tiene RLS habilitado todavía, se habilita arriba
-- Si YA tiene RLS, las políticas existentes no se tocan (pueden ser para anon/service_role)
-- Agregamos una policy para authenticated users si se necesita en el futuro:
-- DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
-- CREATE POLICY "leads_select_own" ON public.leads
--   FOR SELECT
--   TO authenticated
--   USING (cliente_id IN (
--     SELECT id FROM public.clientes WHERE email = auth.jwt() ->> 'email'
--   ));

-- 4. Permisos para que el trigger function pueda insertar en clientes
GRANT INSERT ON public.clientes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- Verificación (ejecutar al final)
-- ============================================
SELECT 'Trigger creado correctamente' AS status;

-- ============================================
-- BACKFILL (opcional)
-- Asignar todas las leads existentes al admin (cliente_id del admin)
-- ============================================
UPDATE public.leads
SET cliente_id = (SELECT id FROM public.clientes WHERE email = 'admin@bionova.com')
WHERE cliente_id IS NULL;

-- ============================================
-- CONFIGURACION MANUAL EN SUPABASE DASHBOARD
-- ============================================
-- 1. Ir a Authentication > Settings > Email
--    - Habilitar "Enable email provider"
--    - En "Email Auth", activar "Magic Link"
--    - Configurar Site URL: http://localhost:3000
--    - Agregar Redirect URLs: http://localhost:3000/auth/callback
--
-- 2. (Opcional) Crear el usuario admin manualmente:
--    - Ir a Authentication > Users > Add User
--    - Email: admin@bionova.com
--    - El usuario recibira un magic link al iniciar sesion desde /login
--    - O usar la pagina /registro con admin@bionova.com para crear el auth user
--      (el trigger detectara que la fila clientes ya existe y no duplicara)
--
-- 3. Para produccion, cambiar Site URL y Redirect URLs al dominio real
