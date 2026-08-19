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

// ── Areas schemas ─────────────────────────────────────────────────────────────

const AreaSchema = registry.register(
  "Area",
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

// ── Areas paths ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/areas",
  tags: ["Areas"],
  summary: "Get all areas",
  responses: {
    200: {
      description: "List of areas",
      content: { "application/json": { schema: z.array(AreaSchema) } },
    },
  },
});

// ── Categories schemas ────────────────────────────────────────────────────────

const CategorySchema = registry.register(
  "Category",
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

// ── Categories paths ──────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["Categories"],
  summary: "Get all categories",
  responses: {
    200: {
      description: "List of categories",
      content: { "application/json": { schema: z.array(CategorySchema) } },
    },
  },
});

// ── Users schemas ─────────────────────────────────────────────────────────────

const UserProfileSchema = registry.register(
  "UserProfile",
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().nullable(),
    recipesCount: z.number().int(),
    favoritesCount: z.number().int(),
    followersCount: z.number().int(),
    followingCount: z.number().int(),
  }),
);

const PublicUserProfileSchema = registry.register(
  "PublicUserProfile",
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().nullable(),
    recipesCount: z.number().int(),
    followersCount: z.number().int(),
    isFollowedByMe: z.boolean(),
  }),
);

const UserShortSchema = registry.register(
  "UserShort",
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().nullable(),
    isFollowedByMe: z.boolean(),
  }),
);

const PaginatedUsersSchema = registry.register(
  "PaginatedUsers",
  z.object({
    users: z.array(UserShortSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
);

const AvatarResponseSchema = registry.register(
  "AvatarResponse",
  z.object({
    avatarUrl: z.string().url(),
  }),
);

// ── Users paths ───────────────────────────────────────────────────────────────

const userIdParam = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string" as const },
  description: "Target user cuid",
};

const pageParam = {
  name: "page",
  in: "query" as const,
  required: false,
  schema: { type: "integer" as const, default: 1 },
};

const limitParam = {
  name: "limit",
  in: "query" as const,
  required: false,
  schema: { type: "integer" as const, default: 5 },
};

const bearerSecurity = [{ bearerAuth: [] }];

const unauthorizedResponse = {
  description: "Unauthorized — token missing or invalid",
};
const notFoundResponse = { description: "User not found" };

registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["Users"],
  summary: "Get current user profile",
  security: bearerSecurity,
  responses: {
    200: {
      description: "Current user profile with counters",
      content: { "application/json": { schema: UserProfileSchema } },
    },
    401: unauthorizedResponse,
  },
});

registry.registerPath({
  method: "get",
  path: "/users/me/following",
  tags: ["Users"],
  summary: "Get users the current user follows",
  security: bearerSecurity,
  parameters: [pageParam, limitParam],
  responses: {
    200: {
      description: "Paginated list of followed users",
      content: { "application/json": { schema: PaginatedUsersSchema } },
    },
    401: unauthorizedResponse,
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/me/avatar",
  tags: ["Users"],
  summary: "Update current user avatar",
  security: bearerSecurity,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              avatar: { type: "string", format: "binary" },
            },
            required: ["avatar"],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Avatar updated — returns new URL",
      content: { "application/json": { schema: AvatarResponseSchema } },
    },
    400: { description: "No file provided or invalid file type" },
    401: unauthorizedResponse,
  },
});

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Get public profile of another user",
  security: bearerSecurity,
  parameters: [userIdParam],
  responses: {
    200: {
      description: "Public user profile",
      content: { "application/json": { schema: PublicUserProfileSchema } },
    },
    401: unauthorizedResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: "get",
  path: "/users/{id}/followers",
  tags: ["Users"],
  summary: "Get followers of a user",
  security: bearerSecurity,
  parameters: [userIdParam, pageParam, limitParam],
  responses: {
    200: {
      description: "Paginated list of followers with isFollowedByMe flag",
      content: { "application/json": { schema: PaginatedUsersSchema } },
    },
    401: unauthorizedResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: "post",
  path: "/users/{id}/follow",
  tags: ["Users"],
  summary: "Follow a user",
  security: bearerSecurity,
  parameters: [userIdParam],
  responses: {
    201: { description: "Successfully followed" },
    400: { description: "Cannot follow yourself" },
    401: unauthorizedResponse,
    404: notFoundResponse,
    409: { description: "Already following this user" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/users/{id}/follow",
  tags: ["Users"],
  summary: "Unfollow a user",
  security: bearerSecurity,
  parameters: [userIdParam],
  responses: {
    204: {
      description:
        "Unfollowed (idempotent — safe to call even if not following)",
    },
    401: unauthorizedResponse,
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Foodies API",
      version: "1.0.0",
      description: "REST API for the Foodies app.",
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  });
}
