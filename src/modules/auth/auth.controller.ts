import type { Request, Response } from "express";
import createHttpError from "http-errors";

import * as authService from "./auth.service.ts";
import type { LoginInput, RegisterInput } from "./auth.schemas.ts";

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  res.status(200).json(result);
};

export const logout = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw createHttpError(401, "Authentication required");
  }

  await authService.logout(userId);
  res.status(204).send();
};
