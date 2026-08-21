import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import * as recipesController from "../../src/modules/recipes/recipes.controller.ts";
import * as recipesService from "../../src/modules/recipes/recipes.service.ts";

vi.mock("../../src/modules/recipes/recipes.service.ts", () => ({
  searchRecipes: vi.fn(),
  getPopularRecipes: vi.fn(),
  getRecipeById: vi.fn(),
  createRecipe: vi.fn(),
  getOwnRecipes: vi.fn(),
  deleteRecipe: vi.fn(),
}));

describe("Recipes Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "owner-1" },
      params: {},
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      locals: { query: {} },
    };
    next = vi.fn();
  });

  describe("searchRecipesController", () => {
    it("should return search results and 200 status", async () => {
      res.locals = { query: { page: 1, limit: 12 } };
      const mockResult = { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      // @ts-ignore
      vi.mocked(recipesService.searchRecipes).mockResolvedValue(mockResult);

      await recipesController.searchRecipesController(req as Request, res as Response, next);

      expect(recipesService.searchRecipes).toHaveBeenCalledWith({ page: 1, limit: 12 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Test error");
      // @ts-ignore
      vi.mocked(recipesService.searchRecipes).mockRejectedValue(error);

      await recipesController.searchRecipesController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getPopularRecipesController", () => {
    it("should return popular recipes and 200 status", async () => {
      res.locals = { query: { limit: 4 } };
      const mockRecipes = [{ id: "r1" }];
      // @ts-ignore
      vi.mocked(recipesService.getPopularRecipes).mockResolvedValue(mockRecipes);

      await recipesController.getPopularRecipesController(req as Request, res as Response, next);

      expect(recipesService.getPopularRecipes).toHaveBeenCalledWith({ limit: 4 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRecipes);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Test error");
      // @ts-ignore
      vi.mocked(recipesService.getPopularRecipes).mockRejectedValue(error);

      await recipesController.getPopularRecipesController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getRecipeByIdController", () => {
    it("should return recipe and 200 status", async () => {
      req.params = { id: "r1" };
      const mockRecipe = { id: "r1", title: "Borscht" };
      // @ts-ignore
      vi.mocked(recipesService.getRecipeById).mockResolvedValue(mockRecipe);

      await recipesController.getRecipeByIdController(req as Request, res as Response, next);

      expect(recipesService.getRecipeById).toHaveBeenCalledWith("r1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRecipe);
    });

    it("should call next with error if recipe not found", async () => {
      req.params = { id: "missing" };
      const error = createHttpError(404, "Recipe not found");
      // @ts-ignore
      vi.mocked(recipesService.getRecipeById).mockRejectedValue(error);

      await recipesController.getRecipeByIdController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createRecipeController", () => {
    it("should create recipe and return 201 status", async () => {
      req.body = { title: "Borscht" };
      req.file = { buffer: Buffer.from("test") } as Express.Multer.File;
      const mockRecipe = { id: "r1", title: "Borscht" };
      // @ts-ignore
      vi.mocked(recipesService.createRecipe).mockResolvedValue(mockRecipe);

      await recipesController.createRecipeController(req as Request, res as Response, next);

      expect(recipesService.createRecipe).toHaveBeenCalledWith(
        "owner-1",
        req.body,
        req.file.buffer,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockRecipe);
    });

    it("should call next with 400 error if photo is missing", async () => {
      req.body = { title: "Borscht" };
      req.file = undefined;

      await recipesController.createRecipeController(req as Request, res as Response, next);

      expect(recipesService.createRecipe).not.toHaveBeenCalled();
      const errorArg = vi.mocked(next).mock.calls[0][0];
      expect(errorArg).toMatchObject({ status: 400, message: "Recipe photo is required" });
    });

    it("should call next with error if service throws", async () => {
      req.file = { buffer: Buffer.from("test") } as Express.Multer.File;
      const error = new Error("Test error");
      // @ts-ignore
      vi.mocked(recipesService.createRecipe).mockRejectedValue(error);

      await recipesController.createRecipeController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getOwnRecipesController", () => {
    it("should return own recipes and 200 status", async () => {
      res.locals = { query: { page: 1, limit: 9 } };
      const mockResult = { data: [], total: 0, page: 1, limit: 9, totalPages: 0 };
      // @ts-ignore
      vi.mocked(recipesService.getOwnRecipes).mockResolvedValue(mockResult);

      await recipesController.getOwnRecipesController(req as Request, res as Response, next);

      expect(recipesService.getOwnRecipes).toHaveBeenCalledWith("owner-1", { page: 1, limit: 9 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Test error");
      // @ts-ignore
      vi.mocked(recipesService.getOwnRecipes).mockRejectedValue(error);

      await recipesController.getOwnRecipesController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteRecipeController", () => {
    it("should delete recipe and return 200 status", async () => {
      req.params = { id: "r1" };
      const mockResult = { message: "Recipe deleted successfully", id: "r1" };
      // @ts-ignore
      vi.mocked(recipesService.deleteRecipe).mockResolvedValue(mockResult);

      await recipesController.deleteRecipeController(req as Request, res as Response, next);

      expect(recipesService.deleteRecipe).toHaveBeenCalledWith("owner-1", "r1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with 403 error if not the owner", async () => {
      req.params = { id: "r1" };
      const error = createHttpError(403, "You can only delete your own recipes");
      // @ts-ignore
      vi.mocked(recipesService.deleteRecipe).mockRejectedValue(error);

      await recipesController.deleteRecipeController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
