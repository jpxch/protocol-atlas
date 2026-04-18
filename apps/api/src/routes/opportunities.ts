import type { FastifyInstance } from "fastify";
import type { DatabaseClient } from "@protocol-atlas/db";
import { listOpportunities } from "@protocol-atlas/db";

export async function registerOpportunityRoutes(
  app: FastifyInstance,
  db: DatabaseClient
) {
  app.get("/opportunities", async () => {
    const items = await listOpportunities(db);

    return {
      items,
      count: items.length
    };
  });
}