import pool from '../config/db.js';

/**
 * Capa de acceso a datos (DAL) para USUARIO.
 */

export async function findAll() {
  const result = await pool.query('SELECT * FROM USUARIO ORDER BY NOMBRE ASC');
  return result.rows;
}

export async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM USUARIO WHERE LOWER(EMAIL) = LOWER($1)', [email]);
  return result.rows[0] || null;
}

export async function insert({ email, nombre, rol }) {
  const result = await pool.query(
    'INSERT INTO USUARIO (EMAIL, NOMBRE, ROL) VALUES (LOWER($1), $2, $3) RETURNING *',
    [email, nombre, rol]
  );
  return result.rows[0];
}

export async function update(email, { nombre, rol }) {
  const result = await pool.query(
    'UPDATE USUARIO SET NOMBRE = $1, ROL = $2 WHERE LOWER(EMAIL) = LOWER($3) RETURNING *',
    [nombre, rol, email]
  );
  return result.rows[0] || null;
}

export async function deleteByEmail(email) {
  const result = await pool.query('DELETE FROM USUARIO WHERE LOWER(EMAIL) = LOWER($1) RETURNING *', [email]);
  return result.rows[0] || null;
}
