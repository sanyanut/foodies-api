import type { Request, Response, NextFunction } from "express";
import * as ingredientsService from "./ingredients.service.ts";

export const getIngredients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ingredients = await ingredientsService.getAllIngredients();
    res.status(200).json(ingredients);
  } catch (error) {
    next(error);
  }
};
