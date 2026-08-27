import { Router } from "express";
import authenticate from "../../middleware/authenticate.ts";
import { uploadSingle } from "../../middleware/upload.ts";
import { validateParams, validateQuery } from "../../middleware/validate.ts";
import { UserIdParamSchema, PaginationQuerySchema } from "./users.schemas.ts";
import * as usersController from "./users.controller.ts";

const router = Router();

router.use(authenticate);

router.get("/me", usersController.getMyProfile);

router.get(
  "/me/following",
  validateQuery(PaginationQuerySchema),
  usersController.getFollowing,
);

router.patch(
  "/me/avatar",
  uploadSingle("avatar"),
  usersController.updateAvatar,
);

router.get(
  "/:id/recipes",
  validateParams(UserIdParamSchema),
  validateQuery(PaginationQuerySchema),
  usersController.getUserRecipes,
);

router.get(
  "/:id",
  validateParams(UserIdParamSchema),
  usersController.getUserProfile,
);

router.get(
  "/:id/followers",
  validateParams(UserIdParamSchema),
  validateQuery(PaginationQuerySchema),
  usersController.getFollowers,
);

router.post(
  "/:id/follow",
  validateParams(UserIdParamSchema),
  usersController.followUser,
);

router.delete(
  "/:id/follow",
  validateParams(UserIdParamSchema),
  usersController.unfollowUser,
);

export default router;
