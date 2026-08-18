import express from "express";
import type { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import createHttpError from "http-errors";

import { allowedOrigins, isProduction } from "./config/env.ts";
import logger from "./common/logger.ts";
import { generateOpenApiDocument } from "./common/swagger.ts";
import { apiLimiter } from "./middleware/rate-limiter.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { notFound } from "./middleware/not-found.ts";
import healthRoutes from "./modules/health/health.routes.ts";
import areasRouter from './modules/areas/areas.routes.ts';
import usersRoutes from "./modules/users/users.routes.ts";

// Build and configure the Express application (BackEnd task 1: "spin up the dev
// server — wire up modules, configure CORS, add an error handler"). The app is
// exported without calling listen() so tests can import it directly.
export function createApp() {
  const app = express();

  // Trust the platform proxy (Render) so rate-limit & req.ip work correctly.
  app.set("trust proxy", 1);

  // ── Security & infrastructure middleware ──
  app.use(helmet());
  app.use(
    cors({
      // Empty whitelist => reflect any origin ("*" for development). When
      // ALLOWED_ORIGINS is set, only those origins are allowed.
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.length === 0 ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(createHttpError(403, "Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(apiLimiter);

  app.use(express.json());
  app.use(cookieParser());

  // ── Routes ──
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "Foodies API",
      status: "ok",
      // Swagger is disabled in production, so only advertise it elsewhere.
      ...(isProduction ? {} : { docs: "/api-docs" }),
      health: "/health",
    });
  });

  app.use("/health", healthRoutes);
  app.use("/areas", areasRouter);
  app.use("/users", usersRoutes);

  // ── API documentation (Swagger UI) ──
  // Never expose the API docs in production — mount them only outside prod.
  if (!isProduction) {
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(generateOpenApiDocument()),
    );
  }

  // ── 404 + centralised error handling (must come last) ──
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
