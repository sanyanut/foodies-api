import { Router } from "express";
import {
  validateParams,
  validateQuery,
  validateBody,
} from "../../middleware/validate.ts";
import { authenticate } from "../../middleware/authenticate.ts";
import upload from "../../middleware/upload.ts";
import * as recipesSchema from "./recipes.schemas.ts";
import * as recipesController from "./recipes.controller.ts";

const router = Router();

router.get(
  "/",
  validateQuery(recipesSchema.SearchRecipesQuerySchema),
  recipesController.searchRecipesController,
);

router.get(
  "/popular",
  validateQuery(recipesSchema.GetPopularRecipesQuerySchema),
  recipesController.getPopularRecipesController,
);

router.get(
  "/own",
  authenticate,
  validateQuery(recipesSchema.GetOwnRecipesQuerySchema),
  recipesController.getOwnRecipesController,
);

router.post(
  "/",
  authenticate,
  upload.single("thumb"),
  validateBody(recipesSchema.CreateRecipeBodySchema),
  recipesController.createRecipeController,
);

router.get(
  "/:id",
  validateParams(recipesSchema.GetRecipeByIdParamsSchema),
  recipesController.getRecipeByIdController,
);

router.delete(
  "/:id",
  authenticate,
  validateParams(recipesSchema.DeleteRecipeParamsSchema),
  recipesController.deleteRecipeController,
);

router.post(
  "/:id/favorite",
  authenticate,
  validateParams(recipesSchema.GetRecipeByIdParamsSchema),
  recipesController.addFavoriteController,
);

export default router;
