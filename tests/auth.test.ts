import bcrypt from "bcrypt";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, users, refreshTokens } = vi.hoisted(() => {
  const users: Array<Record<string, any>> = [];
  const refreshTokens: Array<Record<string, any>> = [];

  const pickUser = (
    user: Record<string, any>,
    select?: Record<string, boolean>,
  ) => {
    if (!select) return { ...user };

    return Object.fromEntries(
      Object.entries(select)
        .filter(([, enabled]) => enabled)
        .map(([key]) => [key, user[key]]),
    );
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(async ({ where, select }: any) => {
        const user = users.find(
          (candidate) =>
            (where.email && candidate.email === where.email) ||
            (where.id && candidate.id === where.id),
        );

        return user ? pickUser(user, select) : null;
      }),
      create: vi.fn(async ({ data, select }: any) => {
        if (users.some((user) => user.email === data.email)) {
          const error = new Error("Unique constraint violation") as Error & {
            code?: string;
          };
          error.code = "P2002";
          throw error;
        }

        const user = {
          id: `user-${users.length + 1}`,
          avatar: null,
          ...data,
        };
        users.push(user);

        return pickUser(user, select);
      }),
    },
    refreshToken: {
      create: vi.fn(async ({ data }: any) => {
        const refreshToken = {
          id: `refresh-${refreshTokens.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        refreshTokens.push(refreshToken);
        return refreshToken;
      }),
      deleteMany: vi.fn(async (args?: any) => {
        const before = refreshTokens.length;
        const where = args?.where;

        if (where?.expiresAt?.lt) {
          const cutoff = where.expiresAt.lt.getTime();
          for (let i = refreshTokens.length - 1; i >= 0; i -= 1) {
            if (refreshTokens[i].expiresAt.getTime() < cutoff) {
              refreshTokens.splice(i, 1);
            }
          }
        } else if (where?.userId) {
          for (let i = refreshTokens.length - 1; i >= 0; i -= 1) {
            if (refreshTokens[i].userId === where.userId) {
              refreshTokens.splice(i, 1);
            }
          }
        } else if (where?.token) {
          for (let i = refreshTokens.length - 1; i >= 0; i -= 1) {
            if (refreshTokens[i].token === where.token) {
              refreshTokens.splice(i, 1);
            }
          }
        } else {
          refreshTokens.splice(0, refreshTokens.length);
        }

        return { count: before - refreshTokens.length };
      }),
    },
    $queryRaw: vi.fn(async () => 1),
  };

  return { prismaMock, users, refreshTokens };
});

vi.mock("../src/prisma/prisma.ts", () => ({
  default: prismaMock,
}));

import app from "../src/app.ts";

beforeEach(async () => {
  users.splice(0, users.length);
  refreshTokens.splice(0, refreshTokens.length);
  vi.clearAllMocks();

  users.push({
    id: "seed-user",
    name: "Foodies user",
    email: "user@gmail.com",
    avatar: null,
    password: await bcrypt.hash("password123", 10),
  });
});

describe("POST /auth/register", () => {
  it("creates a user and returns auth tokens", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Jane Foodie",
      email: "Jane@Example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      id: "user-2",
      name: "Jane Foodie",
      email: "jane@example.com",
      avatar: null,
    });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0].token).toBe(res.body.refreshToken);
  });

  it("returns 409 when email is already in use", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Existing User",
      email: "user@gmail.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already in use");
  });

  it("validates request body", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "J",
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });
});

describe("POST /auth/login", () => {
  it("returns auth tokens for valid credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "user@gmail.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: "seed-user",
      name: "Foodies user",
      email: "user@gmail.com",
      avatar: null,
    });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(refreshTokens).toHaveLength(1);
  });

  it("returns 401 for invalid credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "user@gmail.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });
});

describe("POST /auth/logout", () => {
  it("requires an access token", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("revokes the authenticated user's refresh tokens", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: "user@gmail.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(204);
    expect(refreshTokens).toHaveLength(0);
  });
});
