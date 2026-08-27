import { describe, it, expect, vi, beforeEach } from "vitest";
import * as recipesService from "../../src/modules/recipes/recipes.service.ts";
import prisma from "../../src/prisma/prisma.ts";
import * as cloudinary from "../../src/common/cloudinary.ts";

vi.mock("../../src/prisma/prisma.ts", () => {
  return {
    default: {
      recipe: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock("../../src/common/cloudinary.ts", () => ({
  uploadImageBuffer: vi.fn(),
}));

describe("Recipes Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchRecipes", () => {
    it("should return paginated recipes filtered by category/area/ingredient", async () => {
      const mockRecipes = [{ id: "r1" }];
      // @ts-ignore
      prisma.$transaction.mockResolvedValue([mockRecipes, 1]);

      const result = await recipesService.searchRecipes({
        category: "cat1",
        area: "area1",
        ingredient: "ing1",
        page: 1,
        limit: 12,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockRecipes,
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    });

    it("should build an empty where clause when no filters are provided", async () => {
      // @ts-ignore
      prisma.$transaction.mockImplementation(async (queries) => {
        return [[], 0];
      });

      const result = await recipesService.searchRecipes({
        page: 2,
        limit: 12,
      });

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe("getPopularRecipes", () => {
    it("should return recipes ordered by favorites count", async () => {
      const mockRecipes = [{ id: "r1", _count: { favoritedBy: 5 } }];
      // @ts-ignore
      prisma.recipe.findMany.mockResolvedValue(mockRecipes);

      const result = await recipesService.getPopularRecipes({ limit: 4 });

      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 4,
          orderBy: { favoritedBy: { _count: "desc" } },
        }),
      );
      expect(result).toEqual(mockRecipes);
    });
  });

  describe("getRecipeById", () => {
    it("should return the recipe when found", async () => {
      const mockRecipe = { id: "r1", title: "Borscht" };
      // @ts-ignore
      prisma.recipe.findUnique.mockResolvedValue(mockRecipe);

      const result = await recipesService.getRecipeById("r1");

      expect(prisma.recipe.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "r1" } }),
      );
      expect(result).toEqual(mockRecipe);
    });

    it("should throw 404 if recipe not found", async () => {
      // @ts-ignore
      prisma.recipe.findUnique.mockResolvedValue(null);

      await expect(recipesService.getRecipeById("missing")).rejects.toThrow("Recipe not found");
    });
  });

  describe("createRecipe", () => {
    it("should upload thumb and create recipe with ingredients", async () => {
      const fileBuffer = Buffer.from("test");
      // @ts-ignore
      vi.mocked(cloudinary.uploadImageBuffer).mockResolvedValue("http://image.url/thumb.jpg");
      const mockCreated = { id: "r1", title: "Borscht" };
      // @ts-ignore
      prisma.recipe.create.mockResolvedValue(mockCreated);

      const data = {
        title: "Borscht",
        description: "Tasty",
        instructions: "Cook it",
        time: 60,
        categoryId: "cat1",
        areaId: "area1",
        ingredients: [{ ingredientId: "ing1", measure: "200g" }],
      };

      const result = await recipesService.createRecipe("owner-1", data, fileBuffer);

      expect(cloudinary.uploadImageBuffer).toHaveBeenCalledWith(fileBuffer, "recipes");
      expect(prisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Borscht",
            ownerId: "owner-1",
            thumb: "http://image.url/thumb.jpg",
            ingredients: {
              create: [{ ingredientId: "ing1", measure: "200g" }],
            },
          }),
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe("getOwnRecipes", () => {
    it("should return paginated recipes scoped to the owner", async () => {
      const mockRecipes = [{ id: "r1", ownerId: "owner-1" }];
      // @ts-ignore
      prisma.$transaction.mockResolvedValue([mockRecipes, 1]);

      const result = await recipesService.getOwnRecipes("owner-1", { page: 1, limit: 9 });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockRecipes,
        total: 1,
        page: 1,
        limit: 9,
        totalPages: 1,
      });
    });
  });

  describe("deleteRecipe", () => {
    it("should delete the recipe when the caller is the owner", async () => {
      // @ts-ignore
      prisma.recipe.findUnique.mockResolvedValue({ id: "r1", ownerId: "owner-1" });

      const result = await recipesService.deleteRecipe("owner-1", "r1");

      expect(prisma.recipe.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
      expect(result).toEqual({ message: "Recipe deleted successfully", id: "r1" });
    });

    it("should throw 404 if recipe not found", async () => {
      // @ts-ignore
      prisma.recipe.findUnique.mockResolvedValue(null);

      await expect(recipesService.deleteRecipe("owner-1", "missing")).rejects.toThrow(
        "Recipe not found",
      );
      expect(prisma.recipe.delete).not.toHaveBeenCalled();
    });

    it("should throw 403 if caller is not the owner", async () => {
      // @ts-ignore
      prisma.recipe.findUnique.mockResolvedValue({ id: "r1", ownerId: "someone-else" });

      await expect(recipesService.deleteRecipe("owner-1", "r1")).rejects.toThrow(
        "You can only delete your own recipes",
      );
      expect(prisma.recipe.delete).not.toHaveBeenCalled();
    });
  });
});
