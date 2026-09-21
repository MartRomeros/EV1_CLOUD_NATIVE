import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  user: ENV.POSTGRES_USER,
  host: ENV.POSTGRES_HOST,
  database: ENV.POSTGRES_DB,
  password: ENV.POSTGRES_PASSWORD,
  port: ENV.POSTGRES_PORT,
  options: `-c search_path=${ENV.SEARCH_PATH}`,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;
