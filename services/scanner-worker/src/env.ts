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

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

const scannerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ARBITRUM_RPC_URL: z.string().url(),
  AAVE_V3_ARBITRUM_POOL_ADDRESS: addressSchema,
  AAVE_V3_HF_THRESHOLD: z.coerce.number().positive().default(1),
  AAVE_V3_DISCOVERY_BLOCK_WINDOW: z.coerce.number().int().positive().default(250000),
  AAVE_V3_DISCOVERY_MAX_LOGS: z.coerce.number().int().positive().default(2000),
  AAVE_V3_WATCH_TARGET_LIMIT: z.coerce.number().int().positive().default(150),
});

export interface ScannerEnv {
  readonly databaseUrl: string;
  readonly arbitrumRpcUrl: string;
  readonly aaveV3ArbitrumPoolAddress: `0x${string}`;
  readonly aaveV3HealthFactorThreshold: number;
  readonly aaveV3DiscoveryBlockWindow: bigint;
  readonly aaveV3DiscoveryMaxLogs: number;
  readonly aaveV3WatchTargetLimit: number;
}

export function getScannerEnv(): ScannerEnv {
  const parsed = scannerEnvSchema.parse(process.env);

  return {
    databaseUrl: parsed.DATABASE_URL,
    arbitrumRpcUrl: parsed.ARBITRUM_RPC_URL,
    aaveV3ArbitrumPoolAddress: parsed.AAVE_V3_ARBITRUM_POOL_ADDRESS as `0x${string}`,
    aaveV3HealthFactorThreshold: parsed.AAVE_V3_HF_THRESHOLD,
    aaveV3DiscoveryBlockWindow: BigInt(parsed.AAVE_V3_DISCOVERY_BLOCK_WINDOW),
    aaveV3DiscoveryMaxLogs: parsed.AAVE_V3_DISCOVERY_MAX_LOGS,
    aaveV3WatchTargetLimit: parsed.AAVE_V3_WATCH_TARGET_LIMIT,
  };
}
