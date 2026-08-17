import { Router } from "express";

import * as healthController from "./health.controller.ts";

// Test/monitoring endpoint used to confirm the backend is running:
//   GET /health     -> liveness  (process up)
//   GET /health/db  -> readiness (database reachable)
const router = Router();

router.get("/", healthController.getHealth);
router.get("/db", healthController.getDatabaseHealth);

export default router;
