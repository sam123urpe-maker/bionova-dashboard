-- ============================================================================
-- FIX: Recrear tablas mensajes y conversaciones con el esquema correcto
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. Eliminar triggers que referencian la tabla vieja
DROP TRIGGER IF EXISTS trg_mensajes_secuencia ON mensajes;

-- 2. Eliminar políticas RLS viejas
DROP POLICY IF EXISTS msgs_select ON mensajes;
DROP POLICY IF EXISTS msgs_insert ON mensajes;
DROP POLICY IF EXISTS msgs_update ON mensajes;
DROP POLICY IF EXISTS conv_select ON conversaciones;
DROP POLICY IF EXISTS conv_insert ON conversaciones;
DROP POLICY IF EXISTS conv_update ON conversaciones;

-- 3. Dropear la tabla mensajes vieja (la que tenia telefono, direccion, url, timestamp_ms)
DROP TABLE IF EXISTS mensajes CASCADE;

-- 4. Dropear conversaciones si existe
DROP TABLE IF EXISTS conversaciones CASCADE;

-- 5. Crear conversaciones
CREATE TABLE conversaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  telefono TEXT NOT NULL,
  nombre_contacto TEXT,
  ultima_actividad TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, telefono)
);

CREATE INDEX idx_conversaciones_cliente ON conversaciones(cliente_id);
CREATE INDEX idx_conversaciones_telefono ON conversaciones(telefono);
CREATE INDEX idx_conversaciones_ultima ON conversaciones(ultima_actividad DESC);

-- 6. Crear mensajes con el esquema nuevo
CREATE TABLE mensajes (
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

CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id, secuencia);
CREATE INDEX idx_mensajes_cliente ON mensajes(cliente_id);
CREATE INDEX idx_mensajes_timestamp ON mensajes(timestamp DESC);

-- 7. Trigger para secuencia autoincremental por conversacion
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

CREATE TRIGGER trg_mensajes_secuencia
  BEFORE INSERT ON mensajes
  FOR EACH ROW
  EXECUTE FUNCTION set_mensaje_secuencia();

-- 8. Mensajes fallidos (si no existe)
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

-- 9. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversaciones;

-- 10. RLS - conversaciones
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY conv_select ON conversaciones FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
    OR cliente_id = (SELECT id FROM clientes WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY conv_insert ON conversaciones FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
    OR cliente_id = (SELECT id FROM clientes WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY conv_update ON conversaciones FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
    OR cliente_id = (SELECT id FROM clientes WHERE email = auth.jwt() ->> 'email')
  );

-- 11. RLS - mensajes
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY msgs_select ON mensajes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
    OR cliente_id = (SELECT id FROM clientes WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY msgs_insert ON mensajes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
    OR cliente_id = (SELECT id FROM clientes WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY msgs_update ON mensajes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
    OR cliente_id = (SELECT id FROM clientes WHERE email = auth.jwt() ->> 'email')
  );

-- 12. RLS - mensajes_fallidos
ALTER TABLE mensajes_fallidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY fallidos_select ON mensajes_fallidos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
  );

CREATE POLICY fallidos_insert ON mensajes_fallidos FOR INSERT
  WITH CHECK (true);

CREATE POLICY fallidos_update ON mensajes_fallidos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clientes WHERE email = auth.jwt() ->> 'email' AND rol = 'admin')
  );

-- 13. Verificar
SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('clientes', 'leads', 'solicitudes_bot', 'conversaciones', 'mensajes', 'mensajes_fallidos')
  ORDER BY table_name;
