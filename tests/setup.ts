// Vitest global setup — provide safe defaults so the app (and its env
// validation) can be imported in tests without a real .env / database.
// The health liveness test never touches the DB, so a placeholder URL is fine.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/foodies_test?schema=public";
process.env.JWT_ACCESS_SECRET ??= "test_access_secret";
process.env.JWT_REFRESH_SECRET ??= "test_refresh_secret";
