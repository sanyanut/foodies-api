import type { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service.ts";
import type { PaginationQuery } from "./users.schemas.ts";

// GET users/me
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await usersService.getMyProfile(req.user!.id as string);
    res.status(200).json(result);
  } catch (e: unknown) {
    next(e);
  }
}

// GET /users/me/following
export async function getFollowing(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = res.locals.query as PaginationQuery;
    const result = await usersService.getFollowing(req.user!.id as string, page, limit);
    res.status(200).json(result);
  } catch (e: unknown) {
    next(e);
  }
}

// PATCH /users/me/avatar
export async function updateAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Avatar file is required" });
    }

    const result = await usersService.updateAvatar(
      req.user!.id as string,
      req.file!,
    );
    res.status(200).json(result);
  } catch (e: unknown) {
    next(e);
  }
}

// GET /users/:id
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await usersService.getUserProfile(
      req.user!.id as string,
      req.params.id as string,
    );
    res.status(200).json(result);
  } catch (e: unknown) {
    next(e);
  }
}

//GET /users/:id/followers
export async function getFollowers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = res.locals.query as PaginationQuery;
    const result = await usersService.getFollowers(
      req.user!.id as string,
      req.params.id as string,
      page,
      limit,
    );
    res.status(200).json(result);
  } catch (e: unknown) {
    next(e);
  }
}

// POST /users/:id/follow
export async function followUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await usersService.followUser(
      req.user!.id as string,
      req.params.id as string,
    );
    res.status(201).json({ message: "Successfully followed" });
  } catch (e: unknown) {
    next(e);
  }
}

// DELETE /users/:id/follow
export async function unfollowUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await usersService.unfollowUser(
      req.user!.id as string,
      req.params.id as string,
    );
    res.status(204).send();
  } catch (e: unknown) {
    next(e);
  }
}
