import pool from './db.js';

/**
 * Inicializa las secuencias y tablas de la base de datos si no existen.
 * Detecta previamente si las tablas ya fueron creadas para evitar ejecuciones DDL redundantes.
 */
export async function initDb() {
  let retries = 5;
  while (retries > 0) {
    try {
      // 1. Detectar si la tabla principal 'ot' ya existe
      const checkResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE LOWER(table_name) = 'ot'
        ) AS table_exists;
      `);

      const tablesExist = checkResult.rows[0]?.table_exists === true;

      if (tablesExist) {
        console.log('[DB] Tablas detectadas en la base de datos. Se omite la creación del esquema.');
        return;
      }

      console.log('[DB] Tablas no detectadas. Inicializando esquema y tablas...');

      // 2. Crear secuencias y tablas si no existen
      await pool.query(`
        CREATE SEQUENCE IF NOT EXISTS seq_ot START 1;
        
        CREATE TABLE IF NOT EXISTS OT (
          OT_ID        VARCHAR(24)    DEFAULT 'OT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_ot')::text, 6, '0') PRIMARY KEY,
          CLIENTE_ID   VARCHAR(20)    NOT NULL,
          PATENTE      VARCHAR(10)    NOT NULL,
          DESCRIPCION  VARCHAR(200),
          TOTAL        NUMERIC(12,0)  DEFAULT 0 CHECK (TOTAL >= 0),
          CREATED_AT   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UPDATED_AT   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS OT_ITEM (
          ITEM_ID      SERIAL         PRIMARY KEY,
          OT_ID        VARCHAR(24)    NOT NULL,
          CONCEPTO     VARCHAR(40)    NOT NULL,
          CANTIDAD     NUMERIC(10,2)  NOT NULL CHECK (CANTIDAD > 0),
          PRECIO_UNIT  NUMERIC(12,0)  NOT NULL CHECK (PRECIO_UNIT >= 0),
          SUBTOTAL     NUMERIC(12,0)  GENERATED ALWAYS AS (ROUND(CANTIDAD * PRECIO_UNIT)) STORED,
          CREATED_AT   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT FK_OT_ITEM__OT FOREIGN KEY (OT_ID) REFERENCES OT(OT_ID) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS OT_EVENT (
          EVENT_ID     SERIAL         PRIMARY KEY,
          OT_ID        VARCHAR(24),
          EVENT_TYPE   VARCHAR(40)    NOT NULL,
          PAYLOAD_JSON TEXT           NOT NULL,
          CREATED_AT   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS NOTIFY_LOG (
          LOG_ID       SERIAL         PRIMARY KEY,
          OT_ID        VARCHAR(24),
          CLIENTE_ID   VARCHAR(20),
          CANAL        VARCHAR(20)    CHECK (CANAL IN ('email','sms','push')),
          PAYLOAD_JSON TEXT           NOT NULL,
          CREATED_AT   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      console.log('[DB] Esquema y tablas (OT, OT_ITEM, etc.) inicializados exitosamente.');
      break;
    } catch (err) {
      retries -= 1;
      console.error(`[DB] Error al verificar o inicializar base de datos (${retries} reintentos restantes):`, err.message);
      if (retries === 0) {
        console.error('[DB] No fue posible conectar o inicializar la base de datos tras 5 intentos.');
        break;
      }
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

export default initDb;
