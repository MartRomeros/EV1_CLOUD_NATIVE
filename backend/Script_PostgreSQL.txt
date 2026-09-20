--------------------------------------------------------------------------------
-- CREACIÓN DE USUARIO Y ESQUEMA BASE (PostgreSQL)
--------------------------------------------------------------------------------

-- Crea el rol de aplicación (ajustar contraseña si es necesario)
CREATE ROLE tallerpro360 LOGIN PASSWORD 'ChangeMe_2025!';

-- En PostgreSQL no existen tablespaces "USERS/TEMP" por defecto como en Oracle;
-- si se requiere un tablespace específico, crearlo antes y referenciarlo aquí.
-- ALTER ROLE tallerpro360 SET default_tablespace = 'pg_default';

-- Crea el esquema y lo asigna como propietario al rol (equivalente a QUOTA UNLIMITED)
CREATE SCHEMA AUTHORIZATION tallerpro360;

-- Otorga privilegios de conexión y creación de objetos
GRANT CONNECT ON DATABASE postgres TO tallerpro360;
GRANT USAGE, CREATE ON SCHEMA tallerpro360 TO tallerpro360;

-- Fija el search_path para la sesión (equivalente a ALTER SESSION SET CURRENT_SCHEMA)
SET search_path TO tallerpro360;

--------------------------------------------------------------------------------
-- SECUENCIAS
--------------------------------------------------------------------------------
CREATE SEQUENCE seq_ot        START WITH 1 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE seq_ot_item   START WITH 1 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE seq_event_log START WITH 1 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE seq_notify_log START WITH 1 INCREMENT BY 1 NO CYCLE;

--------------------------------------------------------------------------------
-- TABLAS PRINCIPALES
--------------------------------------------------------------------------------

-- Tabla de Órdenes de Trabajo (montos en CLP enteros)
CREATE TABLE ot (
  ot_id        VARCHAR(24)    PRIMARY KEY,
  cliente_id   VARCHAR(20)    NOT NULL,
  patente      VARCHAR(10)    NOT NULL,
  descripcion  VARCHAR(200),
  total        NUMERIC(12,0)  DEFAULT 0 CHECK (total >= 0),
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at   TIMESTAMP
);

-- Tabla de Ítems (subtotal en CLP entero con redondeo, columna generada STORED)
CREATE TABLE ot_item (
  item_id      NUMERIC        PRIMARY KEY,
  ot_id        VARCHAR(24)    NOT NULL,
  concepto     VARCHAR(40)    NOT NULL,
  cantidad     NUMERIC(10,2)  NOT NULL CHECK (cantidad > 0),
  precio_unit  NUMERIC(12,0)  NOT NULL CHECK (precio_unit >= 0),
  subtotal     NUMERIC(12,0)  GENERATED ALWAYS AS (ROUND(cantidad * precio_unit)) STORED,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ot_item
  ADD CONSTRAINT fk_ot_item__ot
  FOREIGN KEY (ot_id) REFERENCES ot(ot_id)
  ON DELETE CASCADE;

-- Tabla de eventos consumidos desde Kafka (payload JSON de auditoría)
CREATE TABLE ot_event (
  event_id     NUMERIC        PRIMARY KEY,
  ot_id        VARCHAR(24),
  event_type   VARCHAR(40)    NOT NULL,
  payload_json TEXT           NOT NULL,   -- usar JSONB si se requiere validar/consultar el JSON
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabla de notificaciones consumidas desde RabbitMQ (payload JSON)
CREATE TABLE notify_log (
  log_id       NUMERIC        PRIMARY KEY,
  ot_id        VARCHAR(24),
  cliente_id   VARCHAR(20),
  canal        VARCHAR(20)    CHECK (canal IN ('email','sms','push')),
  payload_json TEXT           NOT NULL,   -- usar JSONB si se requiere validar/consultar el JSON
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- ÍNDICES
--------------------------------------------------------------------------------
CREATE INDEX idx_ot_created_at ON ot (created_at);
CREATE INDEX idx_ot_item_ot    ON ot_item (ot_id);
CREATE INDEX idx_event_ot      ON ot_event (ot_id);
CREATE INDEX idx_notify_ot     ON notify_log (ot_id);

--------------------------------------------------------------------------------
-- TRIGGERS (PostgreSQL requiere función + trigger por separado)
--------------------------------------------------------------------------------

-- Genera OT_ID automáticamente y actualiza timestamps
CREATE OR REPLACE FUNCTION biu_ot() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ot_id IS NULL THEN
      NEW.ot_id := 'OT-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY') || '-' || LPAD(NEXTVAL('seq_ot')::TEXT, 6, '0');
    END IF;
    IF NEW.created_at IS NULL THEN
      NEW.created_at := CURRENT_TIMESTAMP;
    END IF;
  END IF;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER biu_ot
BEFORE INSERT OR UPDATE ON ot
FOR EACH ROW
EXECUTE FUNCTION biu_ot();

-- Asigna EVENT_ID automáticamente desde la secuencia
CREATE OR REPLACE FUNCTION bi_ot_event() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_id IS NULL THEN
    NEW.event_id := NEXTVAL('seq_event_log');
  END IF;
  IF NEW.created_at IS NULL THEN
    NEW.created_at := CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bi_ot_event
BEFORE INSERT ON ot_event
FOR EACH ROW
EXECUTE FUNCTION bi_ot_event();

-- Asigna LOG_ID automáticamente desde la secuencia
CREATE OR REPLACE FUNCTION bi_notify_log() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.log_id IS NULL THEN
    NEW.log_id := NEXTVAL('seq_notify_log');
  END IF;
  IF NEW.created_at IS NULL THEN
    NEW.created_at := CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bi_notify_log
BEFORE INSERT ON notify_log
FOR EACH ROW
EXECUTE FUNCTION bi_notify_log();

-- NOTA: OT_ITEM.ITEM_ID no tenía trigger explícito en el script original;
-- si se desea autogenerar igual que los otros IDs, se puede agregar:
--
-- CREATE OR REPLACE FUNCTION bi_ot_item() RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.item_id IS NULL THEN
--     NEW.item_id := NEXTVAL('seq_ot_item');
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER bi_ot_item
-- BEFORE INSERT ON ot_item
-- FOR EACH ROW
-- EXECUTE FUNCTION bi_ot_item();

--------------------------------------------------------------------------------
-- VISTA RESUMEN DE ÓRDENES
--------------------------------------------------------------------------------

-- Vista resumen de OT con cantidad de ítems y subtotal calculado (CLP enteros)
CREATE OR REPLACE VIEW v_ot_resumen AS
SELECT
  o.ot_id,
  o.cliente_id,
  o.patente,
  o.descripcion,
  o.total,
  o.created_at,
  COUNT(i.item_id)  AS n_items,
  SUM(i.subtotal)   AS subtotal_calc
FROM ot o
LEFT JOIN ot_item i ON i.ot_id = o.ot_id
GROUP BY o.ot_id, o.cliente_id, o.patente, o.descripcion, o.total, o.created_at;

--------------------------------------------------------------------------------
-- DATOS DE EJEMPLO (CLP sin decimales y cantidades enteras)
--------------------------------------------------------------------------------

-- Inserta dos órdenes de trabajo de ejemplo
INSERT INTO ot (cliente_id, patente, descripcion, total)
VALUES ('CLI-001','XXYY11','Mantención 10k', 62000);

DO $$
DECLARE
  v_ot1 VARCHAR(24);
BEGIN
  SELECT ot_id INTO v_ot1
  FROM ot
  WHERE cliente_id = 'CLI-001' AND patente = 'XXYY11'
  FETCH FIRST 1 ROWS ONLY;

  INSERT INTO ot_item (item_id, ot_id, concepto, cantidad, precio_unit)
  VALUES (NEXTVAL('seq_ot_item'), v_ot1, 'MO-HH', 2, 25000);

  INSERT INTO ot_item (item_id, ot_id, concepto, cantidad, precio_unit)
  VALUES (NEXTVAL('seq_ot_item'), v_ot1, 'FILTRO-ACEITE', 1, 12000);

  INSERT INTO ot_event (event_id, ot_id, event_type, payload_json)
  VALUES (NEXTVAL('seq_event_log'), v_ot1, 'OtCreada',
          '{"eventType":"OtCreada","otId":"' || v_ot1 || '","total":62000}');

  INSERT INTO notify_log (log_id, ot_id, cliente_id, canal, payload_json)
  VALUES (NEXTVAL('seq_notify_log'), v_ot1, 'CLI-001', 'email',
          '{"type":"NotificarClienteOtCreada","otId":"' || v_ot1 || '"}');
END;
$$;

COMMIT;

INSERT INTO ot (cliente_id, patente, descripcion, total)
VALUES ('CLI-002','BBCC22','Cambio pastillas freno', 80000);

DO $$
DECLARE
  v_ot2 VARCHAR(24);
BEGIN
  SELECT ot_id INTO v_ot2
  FROM ot
  WHERE cliente_id = 'CLI-002' AND patente = 'BBCC22'
  FETCH FIRST 1 ROWS ONLY;

  INSERT INTO ot_item (item_id, ot_id, concepto, cantidad, precio_unit)
  VALUES (NEXTVAL('seq_ot_item'), v_ot2, 'PASTILLA-FRENO-DEL', 1, 55000);

  INSERT INTO ot_item (item_id, ot_id, concepto, cantidad, precio_unit)
  VALUES (NEXTVAL('seq_ot_item'), v_ot2, 'MO-HH', 1, 25000);
END;
$$;

COMMIT;

--------------------------------------------------------------------------------
-- CONSULTAS DE VERIFICACIÓN
--------------------------------------------------------------------------------
SELECT * FROM v_ot_resumen ORDER BY created_at DESC;
SELECT * FROM ot_event    ORDER BY created_at DESC FETCH FIRST 5 ROWS ONLY;
SELECT * FROM notify_log  ORDER BY created_at DESC FETCH FIRST 5 ROWS ONLY;
