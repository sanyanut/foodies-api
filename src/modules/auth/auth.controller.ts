import type { CookieOptions, Request, Response } from "express";
import createHttpError from "http-errors";

import { isProduction } from "../../config/env.ts";
import { refreshTokenExpiryDate } from "../../utils/tokens.ts";
import * as authService from "./auth.service.ts";
import type { LoginInput, RegisterInput } from "./auth.schemas.ts";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/auth",
};

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...refreshTokenCookieOptions,
    maxAge: Math.max(
      0,
      refreshTokenExpiryDate(refreshToken).getTime() - Date.now(),
    ),
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);
};

const authResponseBody = ({
  user,
  accessToken,
}: Awaited<ReturnType<typeof authService.login>>) => ({
  user,
  accessToken,
});

const refreshTokenFromCookie = (req: Request) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw createHttpError(401, "Refresh token required");
  }

  return refreshToken;
};

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(201).json(authResponseBody(result));
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json(authResponseBody(result));
};

export const refresh = async (req: Request, res: Response) => {
  const result = await authService.refresh(refreshTokenFromCookie(req));
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json({ accessToken: result.accessToken });
};

export const logout = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createHttpError(401, "Authentication required");
  }

  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
    | string
    | undefined;
  await authService.logout(refreshToken);
  clearRefreshTokenCookie(res);
  res.status(204).send();
};
