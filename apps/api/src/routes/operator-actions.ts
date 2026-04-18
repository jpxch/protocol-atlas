import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '@protocol-atlas/db';
import { createOperatorAction } from '@protocol-atlas/db';

const operatorActionBodySchema = z.object({
  opportunityId: z.string().min(1),
  actionType: z.enum(['rescan', 'refresh-review', 'simulate', 'approve', 'skip']),
  requestedBy: z.string().min(1),
  note: z.string().trim().min(1).optional(),
});

export async function registerOperatorActionRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.post('/operator-actions', async (request, reply) => {
    const body = operatorActionBodySchema.parse(request.body);

    const record = await createOperatorAction(db, {
      opportunityId: body.opportunityId,
      actionType: body.actionType,
      requestedBy: body.requestedBy,
      note: body.note ?? null,
    });

    reply.code(201);

    return {
      status: 'requested',
      data: record,
    };
  });
}
