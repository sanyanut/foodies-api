import { Router } from "express";
import { validateParams, validateQuery } from "../../middleware/validate.ts";
import { SearchRecipesQuerySchema } from "./recipes.schemas.ts";
import * as recipesController from "./recipes.controller.ts";
import { getPopularRecipesController } from "./recipes.controller.ts";
import { GetPopularRecipesQuerySchema } from "./recipes.schemas.ts";
import { GetRecipeByIdParamsSchema } from "./recipes.schemas.ts";
import { getRecipeByIdController } from "./recipes.controller.ts";

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

router.get(
  "/:id",
  validateParams(GetRecipeByIdParamsSchema),
  getRecipeByIdController,
);

export default router;
