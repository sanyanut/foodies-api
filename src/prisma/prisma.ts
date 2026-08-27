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

// Render's EXTERNAL Postgres host (…​.render.com) or any URL asking for SSL
// requires TLS; localhost and Render's INTERNAL network do not. Enable SSL only
// for those remote hosts (rejectUnauthorized:false accepts Render's managed cert).
const connectionString = env.DATABASE_URL;
const requiresSsl =
  /\.render\.com/.test(connectionString) || /sslmode=/.test(connectionString);

const adapter = new PrismaPg({
  connectionString,
  ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const prisma = new PrismaClient({ adapter });

export default prisma;
