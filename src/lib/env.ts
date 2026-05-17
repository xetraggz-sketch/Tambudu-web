import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(1),
  ADMIN_NAME: z.string().min(1),
  NEXT_PUBLIC_DEFAULT_CITY: z.string().min(1),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = z.safeParse(envSchema, process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.issues);
    throw new Error('Invalid environment variables');
  }
  return result.data;
}

export const env = validateEnv();
