import dotenv from 'dotenv';
import path from 'path';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || process.env.API_PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '7blocks_crm_super_secret_jwt_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '7blocks_crm_refresh_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || '7BLOCKS Sales <sales@7blocks.com>',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || ''
};
