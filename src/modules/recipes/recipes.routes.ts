import { Router } from "express";
import { validateQuery } from "../../middleware/validate.ts";
import { SearchRecipesQuerySchema } from "./recipes.schemas.ts";
import * as recipesController from "./recipes.controller.ts";

const router = Router();

router.get(
  "/",
  validateQuery(SearchRecipesQuerySchema),
  recipesController.searchRecipes,
);

export default router;
