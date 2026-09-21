import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'db',
  POSTGRES_DB: process.env.POSTGRES_DB || 'DB_CLOUD',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'PossGAdmin',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  SEARCH_PATH: process.env.POSTGRES_SEARCH_PATH || 'tallerpro360,public',
};
