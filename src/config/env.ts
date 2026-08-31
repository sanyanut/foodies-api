import "dotenv/config";
import { z } from "zod";

// Validate & normalise all environment variables in one place. Importing `env`
// anywhere gives fully-typed, guaranteed-present configuration.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),

  // Comma-separated whitelist. Empty => allow all origins ("*") for dev.
  ALLOWED_ORIGINS: z.string().default(""),

  // Serve the Swagger UI. Docs are always on outside production; in production
  // they stay OFF unless this is explicitly turned on (e.g. "true").
  ENABLE_DOCS: z.string().default("false"),

  POPULAR_RECIPES_CACHE_TTL: z.coerce.number().int().nonnegative().default(60),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  // Fail fast: a misconfigured environment should never start silently.
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Parsed CORS whitelist. Empty array means "allow all" (development default).
export const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Whether to mount Swagger UI. Always available outside production; in
// production only when ENABLE_DOCS is explicitly turned on.
export const docsEnabled =
  !isProduction || ["true", "1", "yes"].includes(env.ENABLE_DOCS.toLowerCase());
