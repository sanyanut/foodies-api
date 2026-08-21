import bcrypt from "bcrypt";
import createHttpError from "http-errors";

import prisma from "../../prisma/prisma.ts";
import {
  refreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/tokens.ts";
import {
  deleteExpiredRefreshTokens,
  revokeRefreshToken,
} from "../../utils/refresh-tokens.ts";
import type { LoginInput, RegisterInput } from "./auth.schemas.ts";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type UserWithPassword = PublicUser & {
  password: string;
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

const userWithPasswordSelect = {
  ...publicUserSelect,
  password: true,
} as const;

const toPublicUser = (user: UserWithPassword): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

const createSession = async (user: PublicUser) => {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiryDate(refreshToken),
    },
  });

  return { user, accessToken, refreshToken };
};

export const register = async (input: RegisterInput) => {
  await deleteExpiredRefreshTokens();

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw createHttpError(409, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
      },
      select: publicUserSelect,
    });

    return createSession(user);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw createHttpError(409, "Email already in use");
    }
    throw error;
  }
};

export const login = async (input: LoginInput) => {
  await deleteExpiredRefreshTokens();

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: userWithPasswordSelect,
  });

  if (!user) {
    throw createHttpError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw createHttpError(401, "Invalid email or password");
  }

  return createSession(toPublicUser(user));
};

export const refresh = async (refreshToken: string) => {
  await deleteExpiredRefreshTokens();

  let userId: string;
  try {
    const payload = verifyRefreshToken(refreshToken);
    if (typeof payload.sub !== "string") {
      throw createHttpError(401, "Invalid refresh token payload");
    }
    userId = payload.sub;
  } catch (error) {
    if (createHttpError.isHttpError(error)) throw error;
    throw createHttpError(401, "Invalid or expired refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    select: { userId: true },
  });

  if (!storedToken || storedToken.userId !== userId) {
    throw createHttpError(401, "Invalid or expired refresh token");
  }

  await revokeRefreshToken(refreshToken);

  const accessToken = signAccessToken(userId);
  const newRefreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId,
      expiresAt: refreshTokenExpiryDate(newRefreshToken),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

// Log out the current session only — revoke the refresh token carried by this
// device's cookie (TZ: "deletes the active session"). Other devices stay in.
// A missing token is a no-op so logout is idempotent.
export const logout = async (refreshToken: string | undefined) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
};
