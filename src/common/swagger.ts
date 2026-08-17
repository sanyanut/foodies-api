import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { env } from "../config/env.ts";

extendZodWithOpenApi(z);

// Central OpenAPI registry. Each module registers its own schemas/paths here;
// for now only the health check is documented. `bearerAuth` is pre-declared so
// the future private endpoints can reference it.
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const HealthSchema = registry.register(
  "Health",
  z.object({
    status: z.string(),
    uptime: z.number(),
    timestamp: z.string(),
  }),
);

registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Liveness probe — is the API process up?",
  responses: {
    200: {
      description: "API is running",
      content: { "application/json": { schema: HealthSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/health/db",
  tags: ["Health"],
  summary: "Readiness probe — can the API reach PostgreSQL?",
  responses: {
    200: { description: "Database reachable" },
    503: { description: "Database unreachable" },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Foodies API",
      version: "1.0.0",
      description:
        "REST API for the Foodies app. Currently: dev server + database wired up (BackEnd tasks 1 & 2). Endpoint groups are added incrementally.",
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  });
}
