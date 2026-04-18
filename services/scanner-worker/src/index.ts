import { getScannerEnv } from './env.js';
import { runAaveV3HealthFactorWatchScanner } from './scanners/aave-v3-health-factor-watch.js';

async function main() {
  const env = getScannerEnv();

  await runAaveV3HealthFactorWatchScanner(env);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
