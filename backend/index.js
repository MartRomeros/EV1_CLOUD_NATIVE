const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'DB_CLOUD',
  password: process.env.POSTGRES_PASSWORD || 'PossGAdmin',
  port: process.env.POSTGRES_PORT || 5432,
  options: '-c search_path=tallerpro360,public',
});

// Initialize DB table with retry logic and schema adapted from Script.sql
async function initDb() {
  let retries = 5;
  while (retries) {
    try {
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
      console.log("Database tables (OT, OT_ITEM, etc.) initialized successfully.");
      break;
    } catch (err) {
      console.error("Database not ready or error creating schema, retrying in 3 seconds...", err.message);
      retries -= 1;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}
initDb();

// ==========================================
// ENDPOINTS PARA ÓRDENES DE TRABAJO (OT)
// ==========================================

// 1. Crear OT
app.post('/ot', async (req, res) => {
  const { cliente_id, patente, descripcion, total } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO OT (CLIENTE_ID, PATENTE, DESCRIPCION, TOTAL) VALUES ($1, $2, $3, $4) RETURNING *',
      [cliente_id, patente, descripcion, total || 0]
    );
    
    const ot = result.rows[0];
    
    // Generar evento (simulación de trigger)
    await pool.query(
      'INSERT INTO OT_EVENT (OT_ID, EVENT_TYPE, PAYLOAD_JSON) VALUES ($1, $2, $3)',
      [ot.ot_id, 'OtCreada', JSON.stringify({ eventType: 'OtCreada', otId: ot.ot_id, total: ot.total })]
    );

    res.status(201).json(ot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Obtener todas las OT
app.get('/ot', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM OT ORDER BY CREATED_AT DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Obtener una OT específica
app.get('/ot/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM OT WHERE OT_ID = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'OT no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Actualizar una OT
app.put('/ot/:id', async (req, res) => {
  const { cliente_id, patente, descripcion, total } = req.body;
  try {
    const result = await pool.query(
      'UPDATE OT SET CLIENTE_ID = $1, PATENTE = $2, DESCRIPCION = $3, TOTAL = $4, UPDATED_AT = CURRENT_TIMESTAMP WHERE OT_ID = $5 RETURNING *',
      [cliente_id, patente, descripcion, total, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'OT no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Eliminar una OT
app.delete('/ot/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM OT WHERE OT_ID = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'OT no encontrada' });
    res.json({ message: 'OT eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINTS PARA ÍTEMS DE LA OT (OT_ITEM)
// ==========================================

// Crear ítem para una OT
app.post('/ot/:id/items', async (req, res) => {
  const { concepto, cantidad, precio_unit } = req.body;
  const ot_id = req.params.id;
  try {
    // Verificar que OT existe
    const otCheck = await pool.query('SELECT OT_ID FROM OT WHERE OT_ID = $1', [ot_id]);
    if (otCheck.rows.length === 0) return res.status(404).json({ error: 'OT no encontrada' });

    const result = await pool.query(
      'INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES ($1, $2, $3, $4) RETURNING *',
      [ot_id, concepto, cantidad, precio_unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener ítems de una OT
app.get('/ot/:id/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM OT_ITEM WHERE OT_ID = $1 ORDER BY CREATED_AT ASC', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener resumen de OT (v_ot_resumen)
app.get('/resumen', async (req, res) => {
  try {
    const query = `
      SELECT
        o.OT_ID, o.CLIENTE_ID, o.PATENTE, o.DESCRIPCION, o.TOTAL, o.CREATED_AT,
        COUNT(i.ITEM_ID) AS N_ITEMS,
        COALESCE(SUM(i.SUBTOTAL), 0) AS SUBTOTAL_CALC
      FROM OT o
      LEFT JOIN OT_ITEM i ON i.OT_ID = o.OT_ID
      GROUP BY o.OT_ID, o.CLIENTE_ID, o.PATENTE, o.DESCRIPCION, o.TOTAL, o.CREATED_AT
      ORDER BY o.CREATED_AT DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
