import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4000),
});

export type ApiEnv = z.infer<typeof envSchema>;

export function getEnv(): ApiEnv {
  return envSchema.parse(process.env);
}
