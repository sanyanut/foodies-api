import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.ts";

// Smoke tests that confirm the boilerplate server is wired up correctly.
// These do not require a database connection.
describe("GET /", () => {
  it("returns the API info payload", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Foodies API");
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /health", () => {
  it("returns liveness status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});

describe("unknown route", () => {
  it("returns 404 with an error body", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });
});
