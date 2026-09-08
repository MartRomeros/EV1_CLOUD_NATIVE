const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'DB_CLOUD',
  password: process.env.POSTGRES_PASSWORD || 'PossGAdmin',
  port: process.env.POSTGRES_PORT || 5432,
});

// Initialize DB table with retry logic
async function initDb() {
  let retries = 5;
  while (retries) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          nombre VARCHAR(100),
          apellido VARCHAR(100),
          email VARCHAR(100) UNIQUE,
          password VARCHAR(100)
        );
      `);
      console.log("Database table initialized successfully.");
      break;
    } catch (err) {
      console.error("Database not ready, retrying in 3 seconds...");
      retries -= 1;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}
// initDb();

// Create
app.post('/usuario', async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuario (nombre, apellido, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, email, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read all
app.get('/usuario', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read one
app.get('/usuario/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update
app.put('/usuario/:id', async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  try {
    const result = await pool.query(
      'UPDATE usuario SET nombre = $1, apellido = $2, email = $3, password = $4 WHERE id = $5 RETURNING *',
      [nombre, apellido, email, password, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete
app.delete('/usuario/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM usuario WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
