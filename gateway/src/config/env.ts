import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  SERVER1_URL: z.string().url(),
  SERVER2_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LOG_FORMAT: z.string().default('dev'),
  TRUSTED_GATEWAY_HEADER: z.string().min(1).default('x-skillbridge-gateway'),
  TRUSTED_GATEWAY_SECRET: z.string().min(8, 'TRUSTED_GATEWAY_SECRET must be at least 8 characters')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid gateway environment variables');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
