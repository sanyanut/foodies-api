import type { NextFunction, Request, Response } from "express";
import type { ZodType, ZodError } from "zod";

// Turn a Zod error into a `{ field: [messages] }` map for a consistent 400 body.
const formatIssues = (error: ZodError): Record<string, string[]> => {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    (details[key] ??= []).push(issue.message);
  }
  return details;
};

const respondWithValidationError = (res: Response, error: ZodError) =>
  res.status(400).json({ error: "Validation failed", details: formatIssues(error) });

export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return respondWithValidationError(res, result.error);
    req.body = result.data;
    next();
  };

export const validateParams =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return respondWithValidationError(res, result.error);
    next();
  };

export const validateQuery =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return respondWithValidationError(res, result.error);
    next();
  };
