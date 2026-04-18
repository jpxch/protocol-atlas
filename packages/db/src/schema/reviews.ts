import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { ReviewSource, ReviewVerdict } from "@protocol-atlas/core";

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id").notNull(),
    source: text("source").$type<ReviewSource>().notNull(),
    verdict: text("verdict").$type<ReviewVerdict | null>(),
    summary: text("summary"),
    data: jsonb("data").$type<Readonly<Record<string, unknown>>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    reviewsOpportunityIdx: index("reviews_opportunity_idx").on(table.opportunityId)
  })
);