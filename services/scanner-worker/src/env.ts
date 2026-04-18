import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

const scannerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ARBITRUM_RPC_URL: z.string().url(),
  AAVE_V3_ARBITRUM_POOL_ADDRESS: addressSchema,
  AAVE_V3_WATCHLIST: z.string().min(1),
  AAVE_V3_HF_THRESHOLD: z.coerce.number().positive().default(1),
});

export interface ScannerEnv {
  readonly databaseUrl: string;
  readonly arbitrumRpcUrl: string;
  readonly aaveV3ArbitrumPoolAddress: `0x${string}`;
  readonly aaveV3Watchlist: readonly `0x${string}`[];
  readonly aaveV3HealthFactorThreshold: number;
}

export function getScannerEnv(): ScannerEnv {
  const parsed = scannerEnvSchema.parse(process.env);

  const watchlist = parsed.AAVE_V3_WATCHLIST.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  for (const address of watchlist) {
    addressSchema.parse(address);
  }

  return {
    databaseUrl: parsed.DATABASE_URL,
    arbitrumRpcUrl: parsed.ARBITRUM_RPC_URL,
    aaveV3ArbitrumPoolAddress: parsed.AAVE_V3_ARBITRUM_POOL_ADDRESS as `0x${string}`,
    aaveV3Watchlist: watchlist as `0x${string}`[],
    aaveV3HealthFactorThreshold: parsed.AAVE_V3_HF_THRESHOLD,
  };
}
