import prisma from "../prisma/prisma.ts";

// Housekeeping for the refresh_tokens table. The auth layer will call these
// so stale/rotated tokens do not accumulate:
//   - deleteExpiredRefreshTokens : drop every token past its expiry (run on a
//     schedule or opportunistically on login/refresh).
//   - revokeRefreshToken         : delete a single token (logout / rotation).
//   - revokeAllForUser           : delete every token for a user (logout-all).

export const deleteExpiredRefreshTokens = () =>
  prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });

export const revokeRefreshToken = (token: string) =>
  prisma.refreshToken.deleteMany({ where: { token } });

export const revokeAllForUser = (userId: string) =>
  prisma.refreshToken.deleteMany({ where: { userId } });
