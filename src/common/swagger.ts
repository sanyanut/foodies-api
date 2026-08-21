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

const RegisterRequestSchema = registry.register(
  "RegisterRequest",
  z.object({
    name: z.string().min(2).max(64),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
);
const LoginRequestSchema = registry.register(
  "LoginRequest",
  z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
);
const AuthUserSchema = registry.register(
  "AuthUser",
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
);
const AuthResponseSchema = registry.register(
  "AuthResponse",
  z.object({
    user: AuthUserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);
const ErrorSchema = registry.register(
  "Error",
  z.object({
    error: z.string(),
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

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    400: {
      description: "Validation failed",
      content: { "application/json": { schema: ErrorSchema } },
    },
    409: {
      description: "Email already in use",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Log in a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User logged in",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    400: {
      description: "Validation failed",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Invalid email or password",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Log out the authenticated user",
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "User logged out",
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: ErrorSchema } },
    },
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
        "REST API for the Foodies app. Foundation endpoints and /auth are wired up; other endpoint groups are added incrementally.",
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  });
}
