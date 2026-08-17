import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../config/env.ts";

// JWT helpers. Access and refresh tokens are signed with SEPARATE secrets.
// A unique `jti` on every token guarantees two tokens issued in the same second
// are still distinct strings — important because a user may hold several refresh
// tokens at once (one per device/browser) and each is stored & unique in the DB.

export const signAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });

export const verifyAccessToken = (token: string): jwt.JwtPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;

export const verifyRefreshToken = (token: string): jwt.JwtPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;

// Expiry timestamp for the DB row, derived from the token's exp claim.
export const refreshTokenExpiryDate = (token: string): Date => {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (decoded?.exp) return new Date(decoded.exp * 1000);
  // Fallback: 7 days from now.
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};
