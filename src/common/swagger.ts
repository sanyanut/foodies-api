import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { env } from "../config/env.ts";
import { maximum } from "zod/mini";
import { response } from "express";

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
// ── Ingredients schemas ───────────────────────────────────────────────────────

const IngredientSchema = registry.register(
  "Ingredient",
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    img: z.string().nullable(),
  }),
);

// ── Ingredients paths ─────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/ingredients",
  tags: ["Ingredients"],
  summary: "Get all ingredients",
  responses: {
    200: {
      description: "List of ingredients",
      content: { "application/json": { schema: z.array(IngredientSchema) } },
    },
  },
});
// ── Testimonials schemas ──────────────────────────────────────────────────────

const TestimonialSchema = registry.register(
  "Testimonial",
  z.object({
    id: z.string(),
    testimonial: z.string(),
    ownerId: z.string(),
    createdAt: z.string(),
  }),
);

// ── Testimonials paths ────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/testimonials",
  tags: ["Testimonials"],
  summary: "Get all testimonials",
  responses: {
    200: {
      description: "List of testimonials",
      content: { "application/json": { schema: z.array(TestimonialSchema) } },
    },
  },
});

// ── Recipes schemas ───────────────────────────────────────────────────────────────

const RecipeSchema = registry.register(
  "Recipe",
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    instructions: z.string().optional(),
    thumb: z.string().nullable(),
    time: z.number().nullable(),
    categoryId: z.string(),
    areaId: z.string().nullable(),
    createdAt: z.string().optional(),
  }),
);

const PaginatedRecipesSchema = registry.register(
  "PaginatedRecipes",
  z.object({
    data: z.array(RecipeSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
);

export const CreateRecipeBodySchema = registry.register(
  "CreateRecipeBody",
  z.object({
    title: z.string().openapi({ example: "Delicious Pasta" }),
    description: z
      .string()
      .openapi({ example: "Simple and fast homemade recipe" }),
    instructions: z
      .string()
      .openapi({ example: "Boil water, cook pasta, mix with sauce." }),
    time: z.number().int().min(1).openapi({ example: 15 }),
    categoryId: z.string().openapi({
      description: "Valid Category ID from /categories",
      example: "6462a6cd4c3d0ddd28897f8a",
    }),
    areaId: z.string().openapi({
      description: "Valid Area ID from /areas",
      example: "6462a6f04c3d0ddd28897f9c",
    }),
    ingredients: z.string().openapi({
      description:
        "JSON stringified array of ingredients: [{ ingredientId, measure }]",
      example: JSON.stringify([
        {
          ingredientId: "640c2dd963a319ea671e365b",
          measure: "200g",
        },
      ]),
    }),
    thumb: z.string().openapi({
      type: "string",
      format: "binary",
      description: "Recipe image file",
    }),
  }),
);

const DeletedRecipeResponseSchema = registry.register(
  "DeleteRecipeResponse",
  z.object({
    message: z.string(),
    id: z.string(),
  }),
);

// ── Recipes params ──────────────────────────────────────────────────────────────────

const categoryParam = {
  name: "category",
  in: "query" as const,
  required: false,
  schema: { type: "string" as const },
  description: "Recipe category ID",
};

const areaParam = {
  name: "area",
  in: "query" as const,
  required: false,
  schema: { type: "string" as const },
  description: "Region ID",
};

const ingredientParam = {
  name: "ingredient",
  in: "query" as const,
  required: false,
  schema: { type: "string" as const },
  description: "Ingredient ID",
};

const recipeSearchLimitParam = {
  name: "limit",
  in: "query" as const,
  required: false,
  schema: { type: "integer" as const, default: 12, maximum: 12 },
  description: "Number of recipes per page (max 12)",
};

const popularLimitParam = {
  name: "limit",
  in: "query" as const,
  required: false,
  schema: { type: "integer" as const, default: 4, maximum: 4 },
  description: "Number of popular recipes to return (max 4)",
};

const ownLimitParam = {
  name: "limit",
  in: "query" as const,
  required: false,
  schema: { type: "integer" as const, default: 9, maximum: 9 },
  description: "Number of own recipes per page (max 9)",
};

const recipeIdParams = {
  name: "id",
  in: "path" as const,
  required: true,
  description: "Unique identifier of the recipe",
  schema: { type: "string" as const },
};

const recipeNotFoundResponse = { description: "Recipe not found" };

// ── Recipes paths ───────────────────────────────────────────────────────────────────

// GET /recipes
registry.registerPath({
  method: "get",
  path: "/recipes",
  tags: ["Recipes"],
  summary: "Search and paginate recipes",
  parameters: [
    categoryParam,
    areaParam,
    ingredientParam,
    pageParam,
    recipeSearchLimitParam,
  ],
  responses: {
    200: {
      description: "Paginated list of recipes",
      content: { "application/json": { schema: PaginatedRecipesSchema } },
    },
    400: {
      description: "Validation error (invalid query parameters)",
    },
  },
});

// GET /recipes/popular
registry.registerPath({
  method: "get",
  path: "/recipes/popular",
  tags: ["Recipes"],
  summary: "Get popular recipes",
  description:
    "Return a list of recipes sorted by the number of times they were added to favorites.",
  parameters: [popularLimitParam],
  responses: {
    200: {
      description: "List of popular recipes",
      content: { "application/json": { schema: z.array(RecipeSchema) } },
    },
    400: {
      description: "Validation error (limit is greater than 4)",
    },
  },
});

// GET /recipes/own
registry.registerPath({
  method: "get",
  path: "/recipes/own",
  tags: ["Recipes"],
  summary: "Get own recipes",
  description:
    "Return a paginated list of recipes created by the authenticated user",
  security: bearerSecurity,
  parameters: [pageParam, ownLimitParam],
  responses: {
    200: {
      description: "Paginated list of user's own recipes",
      content: { "application/json": { schema: PaginatedRecipesSchema } },
    },
    401: unauthorizedResponse,
  },
});

// POST /recipes
registry.registerPath({
  method: "post",
  path: "/recipes",
  tags: ["Recipes"],
  summary: "Create a new recipe",
  description:
    "Create a new recipe an optional photo upload. Requires authentication.",
  security: bearerSecurity,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateRecipeBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Recipe created successfully",
      content: { "application/json": { schema: RecipeSchema } },
    },
    400: { description: "Validation error (missing fields or invalid data" },
    401: unauthorizedResponse,
  },
});

// GET /recipes/{id}
registry.registerPath({
  method: "get",
  path: "/recipes/{id}",
  tags: ["Recipes"],
  summary: "Get recipe by ID",
  description:
    "Return detailed information about a specific recipe, including its ingredients.",
  parameters: [recipeIdParams],
  responses: {
    200: {
      description: "Detailed recipe information",
      content: { "application/json": { schema: RecipeSchema } },
    },
    400: { description: "Validation error (empty ID)" },
    404: { description: "Recipe not found" },
  },
});

// DELETE /recipes/{id}
registry.registerPath({
  method: "delete",
  path: "/recipes/{id}",
  tags: ["Recipes"],
  summary: "Delete own recipe",
  description:
    "Delete a recipe by ID/ Only the author can delete their recipe.",
  security: bearerSecurity,
  parameters: [recipeIdParams],
  responses: {
    200: {
      description: "Recipe deleted successfully",
      content: { "application/json": { schema: DeletedRecipeResponseSchema } },
    },
    400: { description: "Validation error (empty ID)" },
    401: unauthorizedResponse,
    403: {
      description: "Forbidden (attempting to delete someone else's recipe)",
    },
    404: recipeNotFoundResponse,
  },
});

// POST /recipes/{id}/favorite
registry.registerPath({
  method: "post",
  path: "/recipes/{id}/favorite",
  tags: ["Recipes"],
  summary: "Add recipe to favorites",
  description: "Add a recipe to the authenticated user's favorite list.",
  security: bearerSecurity,
  parameters: [recipeIdParams],
  responses: {
    201: { description: "Recipe added to favorites" },
    400: { description: "Validation error (invalid ID format)" },
    401: unauthorizedResponse,
    404: recipeNotFoundResponse,
    409: { description: "Recipe is already in favorites" },
  },
});

// DELETE /recipes/{id}/favorite
registry.registerPath({
  method: "delete",
  path: "/recipes/{id}/favorite",
  tags: ["Recipes"],
  summary: "Remove recipe from favorites",
  description: "Remove a recipe from the authenticated user's favorite list.",
  security: bearerSecurity,
  parameters: [recipeIdParams],
  responses: {
    200: { description: "Recipe removed from favorites" },
    400: { description: "Validation error (invalid ID format)" },
    401: unauthorizedResponse,
    404: recipeNotFoundResponse,
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
