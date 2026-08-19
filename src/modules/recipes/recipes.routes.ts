import { Router } from "express";
import { validateQuery } from "../../middleware/validate.ts";
import { SearchRecipesQuerySchema } from "./recipes.schemas.ts";
import * as recipesController from "./recipes.controller.ts";
import { getPopularRecipesController } from "./recipes.controller.ts";
import { GetPopularRecipesQuerySchema } from "./recipes.schemas.ts";

const router = Router();

router.get(
  "/",
  validateQuery(SearchRecipesQuerySchema),
  recipesController.searchRecipes,
);

router.get(
  "/popular",
  validateQuery(GetPopularRecipesQuerySchema),
  getPopularRecipesController,
);

export default router;
