import rateLimit from "express-rate-limit";

import { isTest } from "../config/env.ts";

// Generic API limiter applied to every route.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: () => isTest,
});

// Stricter limiter for auth endpoints (brute-force protection). Ready to be
// mounted on the /auth router when those endpoints are built.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: () => isTest,
});
