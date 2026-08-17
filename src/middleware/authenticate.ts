import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}

// Authorization middleware — verifies the Bearer access token and attaches the
// decoded payload to `req.user`. Wired up here for the future private routes.
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw createHttpError(401, "Authentication required");
  }

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    next();
  } catch {
    throw createHttpError(401, "Invalid or expired token");
  }
};

export default authenticate;
