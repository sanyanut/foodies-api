import app from "./app.ts";
import { env } from "./config/env.ts";
import logger from "./common/logger.ts";
import prisma from "./prisma/prisma.ts";

// Process entry point: verify the database connection, then start listening.
async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL");
  } catch (error) {
    logger.error({ error }, "Failed to connect to the database");
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(
      `Foodies API running on http://localhost:${env.PORT} (docs: /api-docs)`,
    );
  });

  // Graceful shutdown — close HTTP server and DB pool on termination signals.
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();
