import type { DatabaseClient } from "../client.js";
import { scanRuns } from "../schema/scan-runs.js";

export interface CreateScanRunInput {
  readonly id: string;
  readonly scannerKey: string;
  readonly protocolKey: string;
  readonly chain: string;
  readonly startedAt: string;
}

export interface CompleteScanRunInput {
  readonly id: string;
  readonly status: "completed" | "failed";
  readonly opportunitiesFound: number;
  readonly completedAt: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function createScanRun(
  db: DatabaseClient,
  input: CreateScanRunInput
): Promise<void> {
  await db.insert(scanRuns).values({
    id: input.id,
    scannerKey: input.scannerKey,
    protocolKey: input.protocolKey,
    chain: input.chain as typeof scanRuns.$inferInsert.chain,
    status: "started",
    opportunitiesFound: 0,
    metadata: {},
    startedAt: new Date(input.startedAt),
    completedAt: null
  });
}

export async function completeScanRun(
  db: DatabaseClient,
  input: CompleteScanRunInput
): Promise<void> {
  await db
    .update(scanRuns)
    .set({
      status: input.status,
      opportunitiesFound: input.opportunitiesFound,
      metadata: input.metadata ?? {},
      completedAt: new Date(input.completedAt)
    })
    .where(eq(scanRuns.id, input.id));
}

import { eq } from "drizzle-orm";