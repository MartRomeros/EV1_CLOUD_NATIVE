import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'db',
  POSTGRES_DB: process.env.POSTGRES_DB || 'DB_CLOUD',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'PossGAdmin',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  SEARCH_PATH: process.env.POSTGRES_SEARCH_PATH || 'tallerpro360,public',
  AUTH_REQUIRED: process.env.AUTH_REQUIRED === 'true',
  AZURE_TENANT_ID: process.env.AZURE_TENANT_ID || '639a8b7f-479a-4d37-9418-bad57badccb1',
  AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || '952083c2-4584-4dec-a3d3-5b0077da3e8f',
};
