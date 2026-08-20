import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import * as recipesService from "./recipes.service.ts";
import type {
  SearchRecipesQuery,
  CreateRecipeBody,
  GetOwnRecipesQuery,
  GetPopularRecipesQuery,
} from "./recipes.schemas.ts";

// GET /recipes
export async function searchRecipesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = res.locals.query as SearchRecipesQuery;

    const result = await recipesService.searchRecipes(query);

    res.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
}

// GET /recipes/popular
export async function getPopularRecipesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = res.locals.query as GetPopularRecipesQuery;

    const recipes = await recipesService.getPopularRecipes(query);

    res.status(200).json(recipes);
  } catch (error: unknown) {
    next(error);
  }
}

//GET /recipes/:id
export async function getRecipeByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const recipe = await recipesService.getRecipeById(id);

    res.status(200).json(recipe);
  } catch (error: unknown) {
    next(error);
  }
}

// POST /recipes
export async function createRecipeController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id as string;
    const body = req.body as CreateRecipeBody;

    if (!req.file) {
      throw createHttpError(400, "Recipe photo is required");
    }

    const recipe = await recipesService.createRecipe(
      userId,
      body,
      req.file?.buffer,
    );
    res.status(201).json(recipe);
  } catch (error: unknown) {
    next(error);
  }
}

// GET /recipes/own
export async function getOwnRecipesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id as string;
    const query = res.locals.query as GetOwnRecipesQuery;

    const result = await recipesService.getOwnRecipes(userId, query);
    res.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
}

// DELETE /recipes/:id
export async function deleteRecipeController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id as string;
    const id = req.params.id as string;

    const result = await recipesService.deleteRecipe(userId, id);
    res.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
