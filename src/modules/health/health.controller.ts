import type { Request, Response } from "express";

import { checkDatabase } from "./health.service.ts";

// Liveness — the process is up and serving requests. No DB dependency.
export const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

// Readiness — the process can reach PostgreSQL.
export const getDatabaseHealth = async (_req: Request, res: Response) => {
  const up = await checkDatabase();
  res.status(up ? 200 : 503).json({
    status: up ? "ok" : "degraded",
    database: up ? "up" : "down",
  });
};
