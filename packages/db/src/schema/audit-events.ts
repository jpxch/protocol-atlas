import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    eventType: text("event_type").notNull(),
    actorId: text("actor_id"),
    data: jsonb("data").$type<Readonly<Record<string, unknown>>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    auditEventsEntityIdx: index("audit_events_entity_idx").on(table.entityType, table.entityId),
    auditEventsCreatedAtIdx: index("audit_events_created_at_idx").on(table.createdAt)
  })
);