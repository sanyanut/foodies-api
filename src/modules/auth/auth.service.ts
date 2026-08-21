import bcrypt from "bcrypt";
import createHttpError from "http-errors";

import prisma from "../../prisma/prisma.ts";
import {
  refreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
} from "../../utils/tokens.ts";
import {
  deleteExpiredRefreshTokens,
  revokeAllForUser,
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

export const logout = async (userId: string) => {
  await revokeAllForUser(userId);
};
