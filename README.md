# Foodies API

Backend for the **Foodies** app — TypeScript · Express 5 · Prisma 7 · PostgreSQL.

> **Scope of this boilerplate.** Per the assignment, only the two BackEnd
> foundation tasks are implemented in code:
>
> 1. **Dev server** — modules wired up (helmet, CORS, cookie-parser, pino
>    logging, rate limiter), a central error handler and 404 handler.
> 2. **Database** — Prisma + PostgreSQL connection.
>
> The **full Prisma schema + initial migration** covers the data model for the
> _entire_ assignment (all endpoint groups), so building the actual endpoints
> later needs no schema changes. The endpoint groups themselves (`/auth`,
> `/users`, `/recipes`, …) are **not** implemented yet.

## Tech stack

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Language       | TypeScript (run directly with `tsx`)                       |
| Framework      | Express 5                                                  |
| ORM / DB       | Prisma 7 + `@prisma/adapter-pg` + PostgreSQL 18            |
| Validation     | Zod                                                        |
| Auth (ready)   | JWT access + refresh (separate secrets), bcrypt            |
| Uploads (ready)| Multer (memory) → Cloudinary                               |
| Docs           | Swagger UI + `zod-to-openapi` at `/api-docs`               |
| Logging        | pino / pino-http                                           |
| Security       | helmet, cors, express-rate-limit                           |
| Tests          | Vitest + Supertest                                         |

## Project structure

```
foodies-api/
├── prisma/
│   ├── schema.prisma          # Full data model for the whole assignment
│   ├── migrations/            # Initial migration (all tables)
│   ├── seed.ts                # Loads the dataset from seed-data/*.json
│   └── seed-data/             # Dataset converted from the provided CSVs
├── src/
│   ├── app.ts                 # Express init: middleware, routes, error handler
│   ├── server.ts              # Bootstrap: connect DB, listen, graceful shutdown
│   ├── config/env.ts          # Zod-validated environment variables
│   ├── prisma/prisma.ts       # PrismaClient instance (DB connection)
│   ├── common/                # logger, swagger, cloudinary
│   ├── middleware/            # error-handler, not-found, validate, authenticate,
│   │                          # rate-limiter, cache-control, upload
│   ├── utils/                 # tokens (JWT), refresh-token housekeeping
│   └── modules/
│       └── health/            # health.routes / .controller / .service
│                              # (the test endpoint; future modules follow this shape)
└── tests/                     # Vitest (health smoke tests)
```

The module layout (`routes` → `controller` → `service` per feature) is the
NestJS-style structure that future endpoints follow.

## Getting started (local, without Docker)

Requires Node 22+ and a reachable PostgreSQL instance.

```bash
npm install
cp .env.example .env          # then fill in the values
npm run prisma:generate       # generate the Prisma client
npm run prisma:deploy         # apply migrations to your database
npm run seed                  # (optional) load the sample dataset
npm run dev                   # start on http://localhost:3000
```

Check it works:

- `GET /` → API info
- `GET /health` → `{ "status": "ok", ... }` (liveness)
- `GET /health/db` → database reachability (readiness)
- `GET /api-docs` → Swagger UI

## Getting started (Docker — recommended for local dev)

The whole workflow can run **entirely in Docker** via npm scripts.

Backend **+** database together (builds, applies migrations, starts the API in
watch mode with hot reload):

```bash
npm run docker:dev
```

Load the sample data into the running DB:

```bash
npm run docker:seed
```

Stop everything:

```bash
npm run docker:down
```

Or, if you prefer to run the API on the host and only the **database** in Docker:

```bash
npm run docker:db        # start Postgres (detached)
npm run prisma:deploy    # apply migrations from the host
npm run dev              # run the API on the host
```

API → http://localhost:3000 · Postgres → localhost:5432.

## npm scripts

| Script                  | What it does                                     |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start with watch mode (`tsx watch`)              |
| `npm start`             | Start the server                                 |
| `npm test`              | Run the Vitest suite                             |
| `npm run typecheck`     | `tsc --noEmit`                                    |
| `npm run prisma:migrate`| Create + apply a dev migration                   |
| `npm run prisma:deploy` | Apply existing migrations (CI / prod)            |
| `npm run prisma:studio` | Open Prisma Studio                               |
| `npm run seed`          | Seed the database from `prisma/seed-data`        |
| `npm run docker:dev`    | **Backend + DB in Docker** (build, migrate, watch) |
| `npm run docker:db`     | **Only the database** in Docker (detached)       |
| `npm run docker:seed`   | Seed the DB inside the running app container      |
| `npm run docker:down`   | Stop & remove the Docker stack                   |

## Data model

Tables: `users`, `refresh_tokens`, `categories`, `areas`, `ingredients`,
`recipes`, `recipe_ingredients` (join + `measure`), `testimonials`,
`favorites` (drives recipe _popularity_), `follows` (user-follows-user graph).

IDs are `String` because the seed dataset uses the original ObjectId strings —
keeping String ids lets that data import with all relationships intact. New
rows default to a `cuid()`.

## Auth & caching notes (infrastructure ready, endpoints later)

- **JWT** — access + refresh tokens signed with separate secrets. Refresh
  tokens are stored in `refresh_tokens`; a user may hold several at once (one
  per device/browser). Helpers to prune expired/rotated tokens live in
  `src/utils/refresh-tokens.ts`.
- **CORS** — `ALLOWED_ORIGINS` is a comma-separated whitelist; leave it empty
  to allow all origins (`"*"`) during development.
- **Popular-recipes caching** — `src/middleware/cache-control.ts` sets an HTTP
  `Cache-Control` header (no Redis needed). Apply it to the future
  `GET /recipes/popular` route; the frontend polls that endpoint periodically.

## Deployment (production: Render)

Render runs the API and a managed Postgres as separate services.

- **Build command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start command:** `npm start`
- **Env vars:** set `DATABASE_URL` (Render Postgres internal URL),
  `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`
  (your Vercel URL), Cloudinary keys, and `NODE_ENV=production`.
