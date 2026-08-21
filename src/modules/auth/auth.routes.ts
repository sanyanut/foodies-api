import { Router } from "express";

import authenticate from "../../middleware/authenticate.ts";
import { authLimiter } from "../../middleware/rate-limiter.ts";
import { validateBody } from "../../middleware/validate.ts";
import * as authController from "./auth.controller.ts";
import { loginSchema, registerSchema } from "./auth.schemas.ts";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authenticate, authController.logout);

export default router;
