import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { ChainKey } from "@protocol-atlas/core";

export const scanRuns = pgTable(
  "scan_runs",
  {
    id: text("id").primaryKey(),
    scannerKey: text("scanner_key").notNull(),
    protocolKey: text("protocol_key").notNull(),
    chain: text("chain").$type<ChainKey>().notNull(),
    status: text("status").$type<"started" | "completed" | "failed">().notNull(),
    opportunitiesFound: integer("opportunities_found").notNull().default(0),
    metadata: jsonb("metadata").$type<Readonly<Record<string, unknown>>>(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
  },
  (table) => ({
    scanRunsChainIdx: index("scan_runs_chain_idx").on(table.chain),
    scanRunsStatusIdx: index("scan_runs_status_idx").on(table.status)
  })
);