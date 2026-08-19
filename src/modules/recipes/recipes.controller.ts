import { Request, Response, NextFunction } from "express";
import * as recipesService from "./recipes.service.ts";
import { SearchRecipesQuery } from "./recipes.schemas.ts";

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
