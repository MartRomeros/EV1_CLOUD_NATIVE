import pool from './db.js';

/**
 * Inicializa las secuencias y tablas de la base de datos si no existen.
 * Es completamente idempotente y siembra datos iniciales de prueba si las tablas están vacías.
 */
export async function initDb() {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('[DB] Verificando e inicializando tablas en PostgreSQL...');

      // 1. Crear secuencias y tablas principales si no existen
      await pool.query(`
        -- Secuencias
        CREATE SEQUENCE IF NOT EXISTS seq_ot START 1;
        CREATE SEQUENCE IF NOT EXISTS seq_cliente START 1;

        -- Tabla CLIENTE
        CREATE TABLE IF NOT EXISTS CLIENTE (
          CLIENTE_ID   VARCHAR(20)   DEFAULT 'CLI-' || LPAD(nextval('seq_cliente')::text, 3, '0') PRIMARY KEY,
          NOMBRE       VARCHAR(100)  NOT NULL,
          TELEFONO     VARCHAR(30),
          EMAIL        VARCHAR(100),
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        -- Tabla CATALOGO (Servicios y Repuestos)
        CREATE TABLE IF NOT EXISTS CATALOGO (
          CONCEPTO     VARCHAR(40)   PRIMARY KEY,
          DESCRIPCION  VARCHAR(200)  NOT NULL,
          PRECIO_UNIT  NUMERIC(12,0) NOT NULL CHECK (PRECIO_UNIT >= 0),
          CATEGORIA    VARCHAR(20)   NOT NULL CHECK (CATEGORIA IN ('mano_obra', 'repuesto')),
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        -- Tabla USUARIO
        CREATE TABLE IF NOT EXISTS USUARIO (
          EMAIL        VARCHAR(100)  PRIMARY KEY,
          NOMBRE       VARCHAR(100)  NOT NULL,
          ROL          VARCHAR(20)   NOT NULL CHECK (ROL IN ('admin', 'mecanico', 'recepcion')),
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        -- Tabla OT (Órdenes de Trabajo)
        CREATE TABLE IF NOT EXISTS OT (
          OT_ID        VARCHAR(24)   DEFAULT 'OT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('seq_ot')::text, 6, '0') PRIMARY KEY,
          CLIENTE_ID   VARCHAR(20)   NOT NULL,
          PATENTE      VARCHAR(10)   NOT NULL,
          DESCRIPCION  VARCHAR(200),
          TOTAL        NUMERIC(12,0) DEFAULT 0 CHECK (TOTAL >= 0),
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UPDATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabla OT_ITEM
        CREATE TABLE IF NOT EXISTS OT_ITEM (
          ITEM_ID      SERIAL        PRIMARY KEY,
          OT_ID        VARCHAR(24)   NOT NULL,
          CONCEPTO     VARCHAR(40)   NOT NULL,
          CANTIDAD     NUMERIC(10,2) NOT NULL CHECK (CANTIDAD > 0),
          PRECIO_UNIT  NUMERIC(12,0) NOT NULL CHECK (PRECIO_UNIT >= 0),
          SUBTOTAL     NUMERIC(12,0) GENERATED ALWAYS AS (ROUND(CANTIDAD * PRECIO_UNIT)) STORED,
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT FK_OT_ITEM__OT FOREIGN KEY (OT_ID) REFERENCES OT(OT_ID) ON DELETE CASCADE
        );

        -- Tabla OT_EVENT (Auditoría / Kafka)
        CREATE TABLE IF NOT EXISTS OT_EVENT (
          EVENT_ID     SERIAL        PRIMARY KEY,
          OT_ID        VARCHAR(24),
          EVENT_TYPE   VARCHAR(40)   NOT NULL,
          PAYLOAD_JSON TEXT          NOT NULL,
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        -- Tabla NOTIFY_LOG (Notificaciones / RabbitMQ)
        CREATE TABLE IF NOT EXISTS NOTIFY_LOG (
          LOG_ID       SERIAL        PRIMARY KEY,
          OT_ID        VARCHAR(24),
          CLIENTE_ID   VARCHAR(20),
          CANAL        VARCHAR(20)   CHECK (CANAL IN ('email','sms','push')),
          PAYLOAD_JSON TEXT          NOT NULL,
          CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 2. Sembrar datos iniciales si las tablas están vacías
      await seedInitialData();

      console.log('[DB] Inicialización de esquema y tablas finalizada exitosamente.');
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

async function seedInitialData() {
  // Clientes
  const clienteCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM CLIENTE');
  if (clienteCount.rows[0].cnt === 0) {
    console.log('[DB-SEED] Sembrando clientes iniciales...');
    await pool.query(`
      INSERT INTO CLIENTE (CLIENTE_ID, NOMBRE, TELEFONO, EMAIL) VALUES
      ('CLI-001', 'Juan Pérez', '+56 9 1111 1111', 'juan.perez@example.com'),
      ('CLI-002', 'María López', '+56 9 2222 2222', 'maria.lopez@example.com');
      
      SELECT setval('seq_cliente', 2, true);
    `);
  }

  // Catálogo
  const catalogoCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM CATALOGO');
  if (catalogoCount.rows[0].cnt === 0) {
    console.log('[DB-SEED] Sembrando catálogo inicial...');
    await pool.query(`
      INSERT INTO CATALOGO (CONCEPTO, DESCRIPCION, PRECIO_UNIT, CATEGORIA) VALUES
      ('MO-HH', 'Mano de obra (hora hombre)', 25000, 'mano_obra'),
      ('FILTRO-ACEITE', 'Filtro de aceite', 12000, 'repuesto'),
      ('PASTILLA-FRENO-DEL', 'Pastillas de freno delanteras', 55000, 'repuesto');
    `);
  }

  // Usuarios
  const usuarioCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM USUARIO');
  if (usuarioCount.rows[0].cnt === 0) {
    console.log('[DB-SEED] Sembrando usuarios iniciales...');
    await pool.query(`
      INSERT INTO USUARIO (EMAIL, NOMBRE, ROL) VALUES
      ('man.carvajalc@duocuc.cl', 'Manuel Carvajal', 'admin'),
      ('martin.romero@duocuc.cl', 'Martín Romero', 'mecanico');
    `);
  }

  // OT inicial de prueba si está vacía
  const otCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM OT');
  if (otCount.rows[0].cnt === 0) {
    console.log('[DB-SEED] Sembrando órdenes de trabajo de prueba iniciales...');
    const otRes = await pool.query(`
      INSERT INTO OT (CLIENTE_ID, PATENTE, DESCRIPCION, TOTAL)
      VALUES ('CLI-001', 'XXYY11', 'Mantención 10k', 62000)
      RETURNING OT_ID;
    `);
    const otId = otRes.rows[0].ot_id;
    await pool.query(`
      INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES
      ($1, 'MO-HH', 2, 25000),
      ($1, 'FILTRO-ACEITE', 1, 12000);
    `, [otId]);
  }
}

export default initDb;
