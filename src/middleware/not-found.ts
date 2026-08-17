import type { Request, Response } from "express";

// 404 handler — must be registered after all routes.
export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};
