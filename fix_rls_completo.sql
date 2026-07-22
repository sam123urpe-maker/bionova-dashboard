-- ============================================================================
-- BioNova - Fix completo: RLS + Realtime + Trigger API Key
-- Ejecutar en Supabase SQL Editor
-- ============================================================================
-- n8n NO se afecta: usa service_role key que bypassea todo el RLS
-- ============================================================================

-- ============================================================================
-- 1. POLÍTICAS DE LEADS (cerrar agujero de seguridad)
--    PROBLEMA: lectura_anon, insert_leads, update_leads tenían USING (true)
--    SOLUCIÓN: admin ve/todo, cliente solo lo suyo. n8n con service_role no se afecta.
-- ============================================================================

DROP POLICY IF EXISTS lectura_anon ON leads;
DROP POLICY IF EXISTS insert_leads ON leads;
DROP POLICY IF EXISTS update_leads ON leads;

CREATE POLICY leads_select ON leads FOR SELECT
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

CREATE POLICY leads_insert ON leads FOR INSERT
  WITH CHECK (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

CREATE POLICY leads_update ON leads FOR UPDATE
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

CREATE POLICY leads_delete ON leads FOR DELETE
  USING (is_admin());

-- ============================================================================
-- 2. AGREGA LEADS A REALTIME
--    PROBLEMA: useRealtime.ts se suscribe a leads pero no estaba en la publicación
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- ============================================================================
-- 3. CORREGIR POLÍTICAS DE solicitudes_bot (email hardcodeado → rol)
--    PROBLEMA: usaba email = 'admin@bionova.com' en vez de is_admin()
--    Si mañana hay 2 admins, no funcionaría. Con rol es escalable.
-- ============================================================================

DROP POLICY IF EXISTS solicitudes_select_admin ON solicitudes_bot;
CREATE POLICY solicitudes_select ON solicitudes_bot FOR SELECT
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS solicitudes_update_admin ON solicitudes_bot;
CREATE POLICY solicitudes_update ON solicitudes_bot FOR UPDATE
  USING (is_admin());

-- Renombrar insert para consistencia (la lógica original era correcta)
DROP POLICY IF EXISTS solicitudes_insert_own ON solicitudes_bot;
CREATE POLICY solicitudes_insert ON solicitudes_bot FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND cliente_id = get_auth_cliente_id()
  );

-- ============================================================================
-- 4. CREAR generate_api_key() + TRIGGER (estaba ausente)
--    PROBLEMA: solo existía el default de columna (32 hex, sin loop anti-colisión)
--    SOLUCIÓN: función con loop + 40 hex como dice la documentación
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TRIGGER AS $$
DECLARE
  key_exists BOOLEAN;
  new_key TEXT;
BEGIN
  LOOP
    new_key := 'bionova_' || encode(gen_random_bytes(20), 'hex');
    SELECT EXISTS(SELECT 1 FROM clientes WHERE api_key = new_key) INTO key_exists;
    EXIT WHEN NOT key_exists;
  END LOOP;
  NEW.api_key := new_key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clientes_api_key ON clientes;
CREATE TRIGGER trg_clientes_api_key
  BEFORE INSERT ON clientes
  FOR EACH ROW
  WHEN (NEW.api_key IS NULL)
  EXECUTE FUNCTION generate_api_key();

-- ============================================================================
-- 5. POLÍTICAS FALTANTES EN clientes
--    PROBLEMA: solo existía clientes_select_own (SELECT), faltaban UPDATE e INSERT
-- ============================================================================

DROP POLICY IF EXISTS clientes_select_own ON clientes;
CREATE POLICY clientes_select ON clientes FOR SELECT
  USING (
    is_admin()
    OR id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS clientes_update ON clientes;
CREATE POLICY clientes_update ON clientes FOR UPDATE
  USING (
    is_admin()
    OR id = get_auth_cliente_id()
  )
  WITH CHECK (
    is_admin()
    OR id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS clientes_insert ON clientes;
CREATE POLICY clientes_insert ON clientes FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 6. VERIFICACIÓN FINAL
-- ============================================================================

-- Tablas en Realtime
SELECT '✅ REALTIME' AS check_type,
       string_agg(tablename, ', ') AS tablas
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('leads', 'mensajes', 'conversaciones');

-- Políticas por tabla
SELECT '✅ POLICIES' AS check_type,
       tablename,
       count(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clientes', 'leads', 'solicitudes_bot', 'conversaciones', 'mensajes', 'mensajes_fallidos')
GROUP BY tablename
ORDER BY tablename;

-- Funciones auxiliares
SELECT '✅ FUNCTIONS' AS check_type,
       string_agg(proname, ', ') AS funciones
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('is_admin', 'get_auth_cliente_id', 'set_mensaje_secuencia', 'generate_api_key', 'handle_new_user');

SELECT '✅ Fix completo aplicado. n8n no se afecta (usa service_role).' AS resultado;
