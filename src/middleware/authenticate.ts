import createHttpError from "http-errors";
import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../utils/tokens.ts";

type AuthenticatedUser = {
  id: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Verifies the Authorization: Bearer <token> header and exposes the user id.
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw createHttpError(401, "Authentication required");
  }

  const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token || rest.length > 0) {
    throw createHttpError(401, "Invalid authorization header");
  }

  try {
    const payload = verifyAccessToken(token);
    if (typeof payload.sub !== "string") {
      throw createHttpError(401, "Invalid token payload");
    }

    req.user = { id: payload.sub };
    next();
  } catch (error) {
    if (createHttpError.isHttpError(error)) throw error;
    throw createHttpError(401, "Invalid or expired token");
  }
};

export default authenticate;
