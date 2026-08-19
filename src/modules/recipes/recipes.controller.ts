import { Request, Response, NextFunction } from "express";
import * as recipesService from "./recipes.service.ts";
import { SearchRecipesQuery } from "./recipes.schemas.ts";
import { getPopularRecipes, GetRecipeById } from "./recipes.service.ts";

// GET /recipes
export async function searchRecipes(
  req: Request,
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
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { limit } = res.locals.query;

    const recipes = await getPopularRecipes(limit);

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

    const recipe = await GetRecipeById(id);

    if (!recipe) {
      res.status(404).json({ message: "Recipe not found" });
      return;
    }

    res.status(200).json(recipe);
  } catch (error: unknown) {
    next(error);
  }
}
