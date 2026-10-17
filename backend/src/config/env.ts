import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.preprocess(
    (v) => (typeof v === 'string' && v.length > 0 ? v : undefined),
    z.string().url().optional(),
  ),
  SPA_ORIGIN: z.string().url(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  HOST: z.string().default('127.0.0.1'),
  SEED_ANCHOR_DATE: z.preprocess(
    (v) => (typeof v === 'string' && v.length > 0 ? v : undefined),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  if (parsed.data.NODE_ENV === 'production') {
    if (
      process.env.JWT_SECRET?.includes('trocar') ||
      process.env.JWT_REFRESH_SECRET?.includes('trocar')
    ) {
      console.error('Production requires secure JWT secrets');
      process.exit(1);
    }
  }
  cached = parsed.data;
  return cached;
}
