import pool from '../config/db.js';

/**
 * Capa de acceso a datos (DAL) para CLIENTE.
 */

export async function findAll() {
  const result = await pool.query('SELECT * FROM CLIENTE ORDER BY CLIENTE_ID ASC');
  return result.rows;
}

export async function findById(clienteId) {
  const result = await pool.query('SELECT * FROM CLIENTE WHERE CLIENTE_ID = $1', [clienteId]);
  return result.rows[0] || null;
}

export async function insert({ clienteId, nombre, telefono, email }) {
  let query;
  let params;

  if (clienteId) {
    query = 'INSERT INTO CLIENTE (CLIENTE_ID, NOMBRE, TELEFONO, EMAIL) VALUES ($1, $2, $3, $4) RETURNING *';
    params = [clienteId, nombre, telefono || null, email || null];
  } else {
    query = 'INSERT INTO CLIENTE (NOMBRE, TELEFONO, EMAIL) VALUES ($1, $2, $3) RETURNING *';
    params = [nombre, telefono || null, email || null];
  }

  const result = await pool.query(query, params);
  return result.rows[0];
}

export async function update(clienteId, { nombre, telefono, email }) {
  const result = await pool.query(
    'UPDATE CLIENTE SET NOMBRE = $1, TELEFONO = $2, EMAIL = $3 WHERE CLIENTE_ID = $4 RETURNING *',
    [nombre, telefono || null, email || null, clienteId]
  );
  return result.rows[0] || null;
}

export async function deleteById(clienteId) {
  const result = await pool.query('DELETE FROM CLIENTE WHERE CLIENTE_ID = $1 RETURNING *', [clienteId]);
  return result.rows[0] || null;
}
