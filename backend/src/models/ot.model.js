import pool from '../config/db.js';

/**
 * Capa de acceso a datos (DAL) para Órdenes de Trabajo (OT) e Ítems.
 */

// Obtiene todas las órdenes con el resumen de ítems agregados (para el listado principal y vista resumen)
export async function findAllWithSummary() {
  const query = `
    SELECT
      o.OT_ID, o.CLIENTE_ID, o.PATENTE, o.DESCRIPCION, o.TOTAL, o.CREATED_AT,
      COUNT(i.ITEM_ID)::int AS N_ITEMS,
      COALESCE(SUM(i.SUBTOTAL), 0)::numeric AS SUBTOTAL_CALC
    FROM OT o
    LEFT JOIN OT_ITEM i ON i.OT_ID = o.OT_ID
    GROUP BY o.OT_ID, o.CLIENTE_ID, o.PATENTE, o.DESCRIPCION, o.TOTAL, o.CREATED_AT
    ORDER BY o.CREATED_AT DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

// Obtiene todas las filas de OT
export async function findAll() {
  const result = await pool.query('SELECT * FROM OT ORDER BY CREATED_AT DESC');
  return result.rows;
}

// Obtiene una OT por su identificador
export async function findById(otId, client = pool) {
  const result = await client.query('SELECT * FROM OT WHERE OT_ID = $1', [otId]);
  return result.rows[0] || null;
}

// Obtiene los ítems asociados a una OT
export async function findItemsByOtId(otId, client = pool) {
  const result = await client.query('SELECT * FROM OT_ITEM WHERE OT_ID = $1 ORDER BY CREATED_AT ASC', [otId]);
  return result.rows;
}

// Inserta una cabecera de OT (soporta cliente de transacción)
export async function insertOt(client, { clienteId, patente, descripcion, total = 0 }) {
  const result = await client.query(
    'INSERT INTO OT (CLIENTE_ID, PATENTE, DESCRIPCION, TOTAL) VALUES ($1, $2, $3, $4) RETURNING *',
    [clienteId, patente, descripcion, total]
  );
  return result.rows[0];
}

// Inserta un ítem de OT (soporta cliente de transacción)
export async function insertOtItem(client, { otId, concepto, cantidad, precioUnit }) {
  const result = await client.query(
    'INSERT INTO OT_ITEM (OT_ID, CONCEPTO, CANTIDAD, PRECIO_UNIT) VALUES ($1, $2, $3, $4) RETURNING *',
    [otId, concepto, cantidad, precioUnit]
  );
  return result.rows[0];
}

// Inserta un evento de auditoría de OT
export async function insertOtEvent(client, { otId, eventType, payloadJson }) {
  const result = await client.query(
    'INSERT INTO OT_EVENT (OT_ID, EVENT_TYPE, PAYLOAD_JSON) VALUES ($1, $2, $3) RETURNING *',
    [otId, eventType, payloadJson]
  );
  return result.rows[0];
}

// Actualiza una cabecera de OT
export async function updateOt(otId, { clienteId, patente, descripcion, total }) {
  const result = await pool.query(
    'UPDATE OT SET CLIENTE_ID = $1, PATENTE = $2, DESCRIPCION = $3, TOTAL = $4, UPDATED_AT = CURRENT_TIMESTAMP WHERE OT_ID = $5 RETURNING *',
    [clienteId, patente, descripcion, total, otId]
  );
  return result.rows[0] || null;
}

// Elimina una OT por su identificador
export async function deleteOt(otId) {
  const result = await pool.query('DELETE FROM OT WHERE OT_ID = $1 RETURNING *', [otId]);
  return result.rows[0] || null;
}
