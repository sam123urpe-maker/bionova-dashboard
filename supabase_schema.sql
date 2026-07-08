-- ============================================================================
-- BioNova Dashboard - Esquema Completo de Supabase
-- ============================================================================
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- 1. EXTENSIÓN UUID (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLA: clientes
-- ============================================================================
-- Si la tabla ya existe, solo agregamos las columnas nuevas.
-- Si no existe, la creamos completa.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
    CREATE TABLE clientes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      whatsapp_numero TEXT,
      rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
      metodo_whatsapp TEXT DEFAULT 'baileys' CHECK (metodo_whatsapp IN ('baileys', 'cloud_api')),
      activo BOOLEAN DEFAULT true,
      bot_activo BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- Si la tabla ya existe, agregar columnas que falten
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'clientes' AND column_name = 'rol') THEN
      ALTER TABLE clientes ADD COLUMN rol TEXT NOT NULL DEFAULT 'cliente'
        CHECK (rol IN ('admin', 'cliente'));
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'clientes' AND column_name = 'metodo_whatsapp') THEN
      ALTER TABLE clientes ADD COLUMN metodo_whatsapp TEXT DEFAULT 'baileys'
        CHECK (metodo_whatsapp IN ('baileys', 'cloud_api'));
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'clientes' AND column_name = 'bot_activo') THEN
      ALTER TABLE clientes ADD COLUMN bot_activo BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- Asegurar que el admin tenga rol 'admin'
UPDATE clientes SET rol = 'admin' WHERE email = 'admin@bionova.com';

-- ============================================================================
-- 3. FUNCIÓN: Generar api_key automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TRIGGER AS $$
DECLARE
  key_exists BOOLEAN;
  new_key TEXT;
BEGIN
  LOOP
    -- formato: bionova_ + 32 caracteres hexadecimales aleatorios
    new_key := 'bionova_' || encode(gen_random_bytes(20), 'hex');
    SELECT EXISTS(SELECT 1 FROM clientes WHERE api_key = new_key) INTO key_exists;
    EXIT WHEN NOT key_exists;
  END LOOP;
  NEW.api_key := new_key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-generar api_key al insertar (solo si no se pasa una manualmente)
DROP TRIGGER IF EXISTS trg_clientes_api_key ON clientes;
CREATE TRIGGER trg_clientes_api_key
  BEFORE INSERT ON clientes
  FOR EACH ROW
  WHEN (NEW.api_key IS NULL)
  EXECUTE FUNCTION generate_api_key();

-- ============================================================================
-- 4. TABLA: leads
-- ============================================================================
-- Si no existe, crearla. Si existe, no la tocamos (ya tiene datos).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    CREATE TABLE leads (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
      telefono TEXT NOT NULL,
      kit TEXT NOT NULL CHECK (kit IN ('remedios', 'suerte')),
      estado TEXT NOT NULL DEFAULT 'esperando'
        CHECK (estado IN ('pagado', 'abandonado', 'esperando', 'falta')),
      ofertas_enviadas INTEGER DEFAULT 0,
      processing BOOLEAN DEFAULT false,
      recibio_oferta TEXT DEFAULT 'no_recibio'
        CHECK (recibio_oferta IN ('recibio', 'no_recibio', 'recibiodos')),
      ultima_interaccion TIMESTAMPTZ,
      ultima_interaccion_ms BIGINT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX idx_leads_cliente ON leads(cliente_id);
    CREATE INDEX idx_leads_telefono ON leads(telefono);
    CREATE INDEX idx_leads_ultima ON leads(ultima_interaccion_ms DESC);
  END IF;
END $$;

-- ============================================================================
-- 5. TABLA: solicitudes_bot
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'solicitudes_bot') THEN
    CREATE TABLE solicitudes_bot (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      nombre_curso TEXT NOT NULL,
      descripcion_curso TEXT,
      precio_oferta NUMERIC(10,2) NOT NULL,
      precio_regular NUMERIC(10,2) NOT NULL,
      moneda TEXT NOT NULL DEFAULT 'PEN',
      medios_pago JSONB NOT NULL DEFAULT '[]',
      link_entrega TEXT,
      bonos_extras JSONB,
      mensaje_bienvenida TEXT,
      config_json JSONB NOT NULL DEFAULT '{}',
      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'procesando', 'entregado')),
      created_at TIMESTAMPTZ DEFAULT now(),
      procesado_at TIMESTAMPTZ
    );
    CREATE INDEX idx_solicitudes_cliente ON solicitudes_bot(cliente_id);
    CREATE INDEX idx_solicitudes_estado ON solicitudes_bot(estado);
  END IF;
END $$;

-- ============================================================================
-- 6. TABLA: conversaciones (NUEVA)
-- ============================================================================
-- Agrupa mensajes por conversación con un contacto único por cliente.
CREATE TABLE IF NOT EXISTS conversaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  telefono TEXT NOT NULL,
  nombre_contacto TEXT,
  ultima_actividad TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, telefono)
);

CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente ON conversaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_telefono ON conversaciones(telefono);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultima ON conversaciones(ultima_actividad DESC);

-- ============================================================================
-- 7. TABLA: mensajes (NUEVA - esquema completo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  wa_message_id TEXT NOT NULL,
  secuencia BIGINT NOT NULL DEFAULT 0,
  remitente TEXT NOT NULL CHECK (remitente IN ('contacto', 'bot', 'agente_humano')),
  tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'imagen', 'audio', 'video', 'documento')),
  contenido TEXT,
  url_adjunto TEXT,
  duracion_segundos INTEGER,
  estado_envio TEXT NOT NULL DEFAULT 'enviado'
    CHECK (estado_envio IN ('pendiente', 'enviado', 'fallido')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, wa_message_id)
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id, secuencia);
CREATE INDEX IF NOT EXISTS idx_mensajes_cliente ON mensajes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_timestamp ON mensajes(timestamp DESC);

-- ============================================================================
-- 8. FUNCIÓN + TRIGGER: secuencia autoincremental por conversación
-- ============================================================================
CREATE OR REPLACE FUNCTION set_mensaje_secuencia()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(secuencia), 0) + 1
    INTO NEW.secuencia
    FROM mensajes
    WHERE conversacion_id = NEW.conversacion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mensajes_secuencia ON mensajes;
CREATE TRIGGER trg_mensajes_secuencia
  BEFORE INSERT ON mensajes
  FOR EACH ROW
  EXECUTE FUNCTION set_mensaje_secuencia();

-- ============================================================================
-- 9. TABLA: mensajes_fallidos (NUEVA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mensajes_fallidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  payload_original JSONB NOT NULL,
  motivo_error TEXT NOT NULL,
  intentos INTEGER DEFAULT 0,
  resuelto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fallidos_resuelto ON mensajes_fallidos(resuelto, created_at);
CREATE INDEX IF NOT EXISTS idx_fallidos_cliente ON mensajes_fallidos(cliente_id);

-- ============================================================================
-- 10. HABILITAR SUPABASE REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- ============================================================================
-- 11. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Función auxiliar: obtener el cliente_id del usuario autenticado
-- Resuelve clientes.email = auth.jwt() ->> 'email'
CREATE OR REPLACE FUNCTION get_auth_cliente_id()
RETURNS UUID AS $$
DECLARE
  cid UUID;
BEGIN
  SELECT id INTO cid
    FROM clientes
    WHERE email = auth.jwt() ->> 'email';
  RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar: saber si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clientes
    WHERE email = auth.jwt() ->> 'email'
      AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- clientes ----
-- Cada cliente solo ve/edita su propia fila. Admin ve todas.
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clientes_select ON clientes;
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

-- INSERT permitido para registro público (sin auth) y para admin
DROP POLICY IF EXISTS clientes_insert ON clientes;
CREATE POLICY clientes_insert ON clientes FOR INSERT
  WITH CHECK (true);  -- el registro lo hace supabase auth signUp

-- ---- leads ----
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_select ON leads;
CREATE POLICY leads_select ON leads FOR SELECT
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS leads_insert ON leads;
CREATE POLICY leads_insert ON leads FOR INSERT
  WITH CHECK (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS leads_update ON leads;
CREATE POLICY leads_update ON leads FOR UPDATE
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS leads_delete ON leads;
CREATE POLICY leads_delete ON leads FOR DELETE
  USING (is_admin());

-- ---- solicitudes_bot ----
ALTER TABLE solicitudes_bot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS solicitudes_select ON solicitudes_bot;
CREATE POLICY solicitudes_select ON solicitudes_bot FOR SELECT
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS solicitudes_insert ON solicitudes_bot;
CREATE POLICY solicitudes_insert ON solicitudes_bot FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS solicitudes_update ON solicitudes_bot;
CREATE POLICY solicitudes_update ON solicitudes_bot FOR UPDATE
  USING (is_admin());

-- ---- conversaciones ----
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conv_select ON conversaciones;
CREATE POLICY conv_select ON conversaciones FOR SELECT
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS conv_insert ON conversaciones;
CREATE POLICY conv_insert ON conversaciones FOR INSERT
  WITH CHECK (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS conv_update ON conversaciones;
CREATE POLICY conv_update ON conversaciones FOR UPDATE
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

-- ---- mensajes ----
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msgs_select ON mensajes;
CREATE POLICY msgs_select ON mensajes FOR SELECT
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS msgs_insert ON mensajes;
CREATE POLICY msgs_insert ON mensajes FOR INSERT
  WITH CHECK (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

DROP POLICY IF EXISTS msgs_update ON mensajes;
CREATE POLICY msgs_update ON mensajes FOR UPDATE
  USING (
    is_admin()
    OR cliente_id = get_auth_cliente_id()
  );

-- ---- mensajes_fallidos ----
ALTER TABLE mensajes_fallidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fallidos_select ON mensajes_fallidos;
CREATE POLICY fallidos_select ON mensajes_fallidos FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS fallidos_insert ON mensajes_fallidos;
CREATE POLICY fallidos_insert ON mensajes_fallidos FOR INSERT
  WITH CHECK (true);  -- cualquiera puede reportar un fallo (incluso sin auth vía n8n)

DROP POLICY IF EXISTS fallidos_update ON mensajes_fallidos;
CREATE POLICY fallidos_update ON mensajes_fallidos FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- 12. VERIFICACIÓN
-- ============================================================================
-- Confirmar que todas las tablas existan:
SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('clientes', 'leads', 'solicitudes_bot', 'conversaciones', 'mensajes', 'mensajes_fallidos')
  ORDER BY table_name;
