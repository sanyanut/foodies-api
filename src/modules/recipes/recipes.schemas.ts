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

export type SearchRecipesQuery = z.infer<typeof SearchRecipesQuerySchema>;
