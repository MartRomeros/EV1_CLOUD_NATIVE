import pool from '../config/db.js';

/**
 * Capa de acceso a datos (DAL) para CATALOGO (Servicios y Repuestos).
 */

export async function findAll() {
  const result = await pool.query('SELECT * FROM CATALOGO ORDER BY CONCEPTO ASC');
  return result.rows;
}

export async function findByConcepto(concepto) {
  const result = await pool.query('SELECT * FROM CATALOGO WHERE CONCEPTO = $1', [concepto]);
  return result.rows[0] || null;
}

export async function insert({ concepto, descripcion, precioUnit, categoria }) {
  const result = await pool.query(
    'INSERT INTO CATALOGO (CONCEPTO, DESCRIPCION, PRECIO_UNIT, CATEGORIA) VALUES ($1, $2, $3, $4) RETURNING *',
    [concepto, descripcion, precioUnit, categoria]
  );
  return result.rows[0];
}

export async function update(concepto, { descripcion, precioUnit, categoria }) {
  const result = await pool.query(
    'UPDATE CATALOGO SET DESCRIPCION = $1, PRECIO_UNIT = $2, CATEGORIA = $3 WHERE CONCEPTO = $4 RETURNING *',
    [descripcion, precioUnit, categoria, concepto]
  );
  return result.rows[0] || null;
}

export async function deleteByConcepto(concepto) {
  const result = await pool.query('DELETE FROM CATALOGO WHERE CONCEPTO = $1 RETURNING *', [concepto]);
  return result.rows[0] || null;
}
