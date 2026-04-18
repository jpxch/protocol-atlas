import type { DatabaseClient } from '../client.js';
import { auditEvents } from '../schema/audit-events.js';
import { operatorActions, type OperatorActionType } from '../schema/operator-actions.js';

export interface CreateOperatorActionInput {
  readonly opportunityId: string;
  readonly actionType: OperatorActionType;
  readonly requestedBy: string;
  readonly note?: string | null;
}

export async function createOperatorAction(db: DatabaseClient, input: CreateOperatorActionInput) {
  const actionId = crypto.randomUUID();
  const auditId = crypto.randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(operatorActions).values({
      id: actionId,
      opportunityId: input.opportunityId,
      actionType: input.actionType,
      requestedBy: input.requestedBy,
      status: 'requested',
      note: input.note ?? null,
      metadata: {},
      createdAt: now,
    });

    await tx.insert(auditEvents).values({
      id: auditId,
      entityType: 'operator_action',
      entityId: actionId,
      eventType: 'operator_action_requested',
      actorId: input.requestedBy,
      data: {
        opportunityId: input.opportunityId,
        actionType: input.actionType,
        note: input.note ?? null,
      },
      createdAt: now,
    });
  });

  return {
    id: actionId,
    opportunityId: input.opportunityId,
    actionType: input.actionType,
    requestedBy: input.requestedBy,
    status: 'requested' as const,
    createdAt: now.toISOString(),
  };
}
