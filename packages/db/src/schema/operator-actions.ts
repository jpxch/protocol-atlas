import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export type OperatorActionType = 'rescan' | 'refresh-review' | 'simulate' | 'approve' | 'skip';

export const operatorActions = pgTable(
  'operator_actions',
  {
    id: text('id').primaryKey(),
    opportunityId: text('opportunity_id').notNull(),
    actionType: text('action_type').$type<OperatorActionType>().notNull(),
    requestedBy: text('requested_by').notNull(),
    status: text('status').$type<'requested' | 'accepted' | 'completed' | 'failed'>().notNull(),
    note: text('note'),
    metadata: jsonb('metadata').$type<Readonly<Record<string, unknown>>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    operatorActionsOpportunityIdx: index('operator_actions_opportunity_idx').on(
      table.opportunityId,
    ),
    operatorActionsCreatedAtIdx: index('operator_actions_created_at_idx').on(table.createdAt),
  }),
);
