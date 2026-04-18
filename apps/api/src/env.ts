import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../..');

config({
  path: path.join(workspaceRoot, '.env'),
});

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4000),
});

export type ApiEnv = z.infer<typeof envSchema>;

export function getEnv(): ApiEnv {
  return envSchema.parse(process.env);
}
