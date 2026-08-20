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

export const RecipeIngredientInputSchema = z.object({
  ingredientId: z.string().trim().min(1, "Ingredient ID is required"),
  measure: z
    .string()
    .trim()
    .min(1, "Measure is required")
    .max(10, "Measure max length is 10 characters"),
});

export const CreateRecipeBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description max length is 200"),
  instructions: z
    .string()
    .trim()
    .min(1, "Instructions are required")
    .max(1000, "Instructions max length is 1000"),
  time: z
    .string()
    .transform((v) => Number.parseInt(v, 10))
    .pipe(z.number().int().min(1, "Cooking time must be at least 1 minute")),
  categoryId: z.string().trim().min(1, "Category ID is required"),
  areaId: z.string().trim().min(1, "Area ID is required"),
  ingredients: z
    .string()
    .transform((val, ctx) => {
      try {
        return JSON.parse(val);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid JSON format for ingredients",
        });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .array(RecipeIngredientInputSchema)
        .min(1, "At least one ingredient is required")
        .max(30, "Maximum 30 ingredients allowed"),
    ),
});

export const GetOwnRecipesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, "page must be >= 1")),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : 9))
    .pipe(z.number().int().min(1).max(9, "limit must be <= 9")),
});

export const DeleteRecipeParamsSchema = z.object({
  id: z.string().trim().min(1, "Recipe ID is required"),
});

export type SearchRecipesQuery = z.infer<typeof SearchRecipesQuerySchema>;
export type GetPopularRecipesQuery = z.infer<
  typeof GetPopularRecipesQuerySchema
>;
export type GetRecipeByIdParams = z.infer<typeof GetRecipeByIdParamsSchema>;
export type RecipeIngredientInput = z.infer<typeof RecipeIngredientInputSchema>;
export type CreateRecipeBody = z.infer<typeof CreateRecipeBodySchema>;
export type GetOwnRecipesQuery = z.infer<typeof GetOwnRecipesQuerySchema>;
export type DeleteRecipeParams = z.infer<typeof DeleteRecipeParamsSchema>;
