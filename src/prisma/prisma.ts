// Database connection setup.
//
// A single PrismaClient instance is created here and imported everywhere the
// app talks to PostgreSQL. It uses the `@prisma/adapter-pg` driver adapter so
// the same client works locally, in Docker, and on Render.
//
// Note: the Prisma schema + migrations live in the project-root `prisma/`
// folder; this module only holds the runtime client instance.
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env.ts";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

export default prisma;
