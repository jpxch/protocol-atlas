import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

export interface DatabaseClientOptions {
  readonly databaseUrl: string;
  readonly maxConnections?: number;
}

export function createPgPool(options: DatabaseClientOptions): Pool {
  return new Pool({
    connectionString: options.databaseUrl,
    max: options.maxConnections ?? 10,
  });
}

export function createDatabaseClient(options: DatabaseClientOptions) {
  const pool = createPgPool(options);

  return drizzle({
    client: pool,
    schema,
  });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

export function createDatabaseConnection(options: DatabaseClientOptions) {
  const pool = createPgPool(options);
  const db = drizzle({
    client: pool,
    schema,
  });

  return {
    db,
    pool,
  };
}
