import { z } from "zod";

export const UserIdParamSchema = z.object({
  id: z
    .string({ error: "User id is required" })
    .min(1, "User id must not be empty")
    .regex(/^[a-z0-9]+$/, "User id must be a valid cuid"),
});

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v) : 1))
    .pipe(z.number().int().min(1, "page must be ≥ 1")),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v) : 5))
    .pipe(z.number().int().min(1).max(100, "limit must be ≤ 100")),
});

export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
