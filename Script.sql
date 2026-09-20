--------------------------------------------------------------------------------
-- CREACIÓN DE USUARIO Y ESQUEMA BASE
--------------------------------------------------------------------------------

-- Crea el usuario de aplicación (ajustar contraseña si es necesario)
CREATE USER TALLERPRO360 IDENTIFIED BY "ChangeMe_2025!"
  DEFAULT TABLESPACE USERS
  TEMPORARY TABLESPACE TEMP
  QUOTA UNLIMITED ON USERS;

GRANT CREATE SESSION TO TALLERPRO360;
GRANT CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER, CREATE VIEW, CREATE PROCEDURE TO TALLERPRO360;

ALTER SESSION SET CURRENT_SCHEMA = TALLERPRO360;

--------------------------------------------------------------------------------
-- SECUENCIAS
--------------------------------------------------------------------------------
CREATE SEQUENCE SEQ_OT START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_OT_ITEM START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_EVENT_LOG START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_NOTIFY_LOG START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

--------------------------------------------------------------------------------
-- TABLAS PRINCIPALES
--------------------------------------------------------------------------------

-- Tabla de Órdenes de Trabajo (montos en CLP enteros)
CREATE TABLE OT (
  OT_ID        VARCHAR2(24)   PRIMARY KEY,
  CLIENTE_ID   VARCHAR2(20)   NOT NULL,
  PATENTE      VARCHAR2(10)   NOT NULL,
  DESCRIPCION  VARCHAR2(200),
  TOTAL        NUMBER(12,0)   DEFAULT 0 CHECK (TOTAL >= 0),
  CREATED_AT   TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_AT   TIMESTAMP
);

-- Tabla de Ítems (SUBTOTAL en CLP entero con redondeo)
CREATE TABLE OT_ITEM (
  ITEM_ID      NUMBER         PRIMARY KEY,
  OT_ID        VARCHAR2(24)   NOT NULL,
  CONCEPTO     VARCHAR2(40)   NOT NULL,
  CANTIDAD     NUMBER(10,2)   NOT NULL CHECK (CANTIDAD > 0),
  PRECIO_UNIT  NUMBER(12,0)   NOT NULL CHECK (PRECIO_UNIT >= 0),
  SUBTOTAL     NUMBER(12,0)   GENERATED ALWAYS AS (ROUND(CANTIDAD * PRECIO_UNIT)) VIRTUAL,
  CREATED_AT   TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

ALTER TABLE OT_ITEM
  ADD CONSTRAINT FK_OT_ITEM__OT
  FOREIGN KEY (OT_ID) REFERENCES OT(OT_ID)
  ON DELETE CASCADE;

-- Tabla de eventos consumidos desde Kafka (payload JSON de auditoría)
CREATE TABLE OT_EVENT (
  EVENT_ID     NUMBER         PRIMARY KEY,
  OT_ID        VARCHAR2(24),
  EVENT_TYPE   VARCHAR2(40)   NOT NULL,
  PAYLOAD_JSON CLOB           NOT NULL,
  CREATED_AT   TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- Tabla de notificaciones consumidas desde RabbitMQ (payload JSON)
CREATE TABLE NOTIFY_LOG (
  LOG_ID       NUMBER         PRIMARY KEY,
  OT_ID        VARCHAR2(24),
  CLIENTE_ID   VARCHAR2(20),
  CANAL        VARCHAR2(20)   CHECK (CANAL IN ('email','sms','push')),
  PAYLOAD_JSON CLOB           NOT NULL,
  CREATED_AT   TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- ÍNDICES
--------------------------------------------------------------------------------
CREATE INDEX IDX_OT_CREATED_AT ON OT (CREATED_AT);
CREATE INDEX IDX_OT_ITEM_OT ON OT_ITEM (OT_ID);
CREATE INDEX IDX_EVENT_OT ON OT_EVENT (OT_ID);
CREATE INDEX IDX_NOTIFY_OT ON NOTIFY_LOG (OT_ID);

--------------------------------------------------------------------------------
-- TRIGGERS
--------------------------------------------------------------------------------

-- Genera OT_ID automáticamente y actualiza timestamps
CREATE OR REPLACE TRIGGER BIU_OT
BEFORE INSERT OR UPDATE ON OT
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    IF :NEW.OT_ID IS NULL THEN
      :NEW.OT_ID := 'OT-' || TO_CHAR(SYSTIMESTAMP, 'YYYY') || '-' || LPAD(SEQ_OT.NEXTVAL, 6, '0');
    END IF;
    IF :NEW.CREATED_AT IS NULL THEN
      :NEW.CREATED_AT := SYSTIMESTAMP;
    END IF;
  END IF;
  :NEW.UPDATED_AT := SYSTIMESTAMP;
END;
/
SHOW ERRORS

-- Asigna EVENT_ID automáticamente desde la secuencia
CREATE OR REPLACE TRIGGER BI_OT_EVENT
BEFORE INSERT ON OT_EVENT
FOR EACH ROW
BEGIN
  IF :NEW.EVENT_ID IS NULL THEN
    :NEW.EVENT_ID := SEQ_EVENT_LOG.NEXTVAL;
  END IF;
  IF :NEW.CREATED_AT IS NULL THEN
    :NEW.CREATED_AT := SYSTIMESTAMP;
  END IF;
END;
/
SHOW ERRORS

-- Asigna LOG_ID automáticamente desde la secuencia
CREATE OR REPLACE TRIGGER BI_NOTIFY_LOG
BEFORE INSERT ON NOTIFY_LOG
FOR EACH ROW
BEGIN
  IF :NEW.LOG_ID IS NULL THEN
    :NEW.LOG_ID := SEQ_NOTIFY_LOG.NEXTVAL;
  END IF;
  IF :NEW.CREATED_AT IS NULL THEN
    :NEW.CREATED_AT := SYSTIMESTAMP;
  END IF;
END;
/
SHOW ERRORS

--------------------------------------------------------------------------------
-- VISTA RESUMEN DE ÓRDENES
--------------------------------------------------------------------------------

-- Vista resumen de OT con cantidad de ítems y subtotal calculado (CLP enteros)
CREATE OR REPLACE VIEW V_OT_RESUMEN AS
SELECT
  o.OT_ID,
  o.CLIENTE_ID,
  o.PATENTE,
  o.DESCRIPCION,
  o.TOTAL,
  o.CREATED_AT,
  COUNT(i.ITEM_ID)        AS N_ITEMS,
  SUM(i.SUBTOTAL)         AS SUBTOTAL_CALC
FROM OT o
LEFT JOIN OT_ITEM i ON i.OT_ID = o.OT_ID
GROUP BY o.OT_ID, o.CLIENTE_ID, o.PATENTE, o.DESCRIPCION, o.TOTAL, o.CREATED_AT;

--------------------------------------------------------------------------------
-- DATOS DE EJEMPLO (CLP sin decimales y cantidades enteras)
--------------------------------------------------------------------------------

-- Inserta dos órdenes de trabajo de ejemplo
INSERT INTO OT (CLIENTE_ID, PATENTE, DESCRIPCION, TOTAL)
VALUES ('CLI-001','XXYY11','Mantención 10k', 62000);

DECLARE
  v_ot1 VARCHAR2(24);
BEGIN
  SELECT OT_ID INTO v_ot1
  FROM OT
  WHERE CLIENTE_ID='CLI-001' AND PATENTE='XXYY11'
  FETCH FIRST 1 ROWS ONLY;

  INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES (v_ot1, 'MO-HH', 2, 25000);
  INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES (v_ot1, 'FILTRO-ACEITE', 1, 12000);

  INSERT INTO OT_EVENT (OT_ID, EVENT_TYPE, PAYLOAD_JSON)
  VALUES (v_ot1, 'OtCreada', '{"eventType":"OtCreada","otId":"'||v_ot1||'","total":62000}');

  INSERT INTO NOTIFY_LOG (OT_ID, CLIENTE_ID, CANAL, PAYLOAD_JSON)
  VALUES (v_ot1, 'CLI-001', 'email', '{"type":"NotificarClienteOtCreada","otId":"'||v_ot1||'"}');
END;
/
COMMIT;

INSERT INTO OT (CLIENTE_ID, PATENTE, DESCRIPCION, TOTAL)
VALUES ('CLI-002','BBCC22','Cambio pastillas freno', 80000);

DECLARE
  v_ot2 VARCHAR2(24);
BEGIN
  SELECT OT_ID INTO v_ot2
  FROM OT
  WHERE CLIENTE_ID='CLI-002' AND PATENTE='BBCC22'
  FETCH FIRST 1 ROWS ONLY;

  INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES (v_ot2, 'PASTILLA-FRENO-DEL', 1, 55000);
  INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES (v_ot2, 'MO-HH', 1, 25000);
END;
/
COMMIT;

--------------------------------------------------------------------------------
-- CONSULTAS DE VERIFICACIÓN
--------------------------------------------------------------------------------
SELECT * FROM V_OT_RESUMEN ORDER BY CREATED_AT DESC;
SELECT * FROM OT_EVENT ORDER BY CREATED_AT DESC FETCH FIRST 5 ROWS ONLY;
SELECT * FROM NOTIFY_LOG ORDER BY CREATED_AT DESC FETCH FIRST 5 ROWS ONLY;