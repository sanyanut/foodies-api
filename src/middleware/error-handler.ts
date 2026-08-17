import type { NextFunction, Request, Response } from "express";

import logger from "../common/logger.ts";

// Centralised error handler. Maps known error shapes (body-parser, multer,
// http-errors, Prisma) to clean HTTP responses and hides internals on 500s.
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error({ err }, err?.message ?? "Unhandled error");

  // Malformed JSON body
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Validation failed",
      details: { body: ["Invalid JSON format in request body"] },
    });
  }

  // Multer upload errors (file too large, unexpected field, etc.)
  if (err?.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }

  // http-errors / anything carrying a 4xx status
  if (err?.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  // Prisma known request errors
  switch (err?.code) {
    case "P2025":
      return res.status(404).json({ error: "Resource not found" });
    case "P2002":
      return res.status(409).json({ error: "Unique constraint violation" });
    case "P2003":
      return res.status(400).json({ error: "Foreign key constraint failed" });
  }

  return res.status(500).json({ error: "Internal server error" });
};
