import { z } from "zod";

export const SearchRecipesQuerySchema = z.object({
  category: z.string().optional(),
  area: z.string().optional(),
  ingredient: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v) : 1))
    .pipe(z.number().int().min(1, "page must be >= 1")),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v) : 12))
    .pipe(z.number().int().min(1).max(12, "limit must be <= 12")),
});

export const GetPopularRecipesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v) : 4))
    .pipe(z.number().int().min(1).max(4, "limit must be <= 4")),
});

export const GetRecipeByIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Recipe ID is required"),
});

export type SearchRecipesQuery = z.infer<typeof SearchRecipesQuerySchema>;
export type GetPopularRecipesQuery = z.infer<
  typeof GetPopularRecipesQuerySchema
>;
export type GetRecipeByIdParams = z.infer<typeof GetRecipeByIdParamsSchema>;
