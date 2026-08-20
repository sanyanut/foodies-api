import prisma from "../../prisma/prisma.ts";
import createHttpError from "http-errors";
import type { Prisma } from "../../../generated/prisma/client.ts";
import { uploadImageBuffer } from "../../common/cloudinary.ts";
import type {
  SearchRecipesQuery,
  GetOwnRecipesQuery,
  GetPopularRecipesQuery,
  CreateRecipeBody,
} from "./recipes.schemas.ts";

export async function searchRecipes(query: SearchRecipesQuery) {
  const { category, area, ingredient, page, limit } = query;

  const skip = (page - 1) * limit;
  const where: Prisma.RecipeWhereInput = {};

  if (category) where.categoryId = category;
  if (area) where.areaId = area;
  if (ingredient) {
    where.ingredients = { some: { ingredientId: ingredient } };
  }

  const [recipes, total] = await prisma.$transaction([
    prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        area: true,
        owner: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipe.count({ where }),
  ]);

  return {
    data: recipes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPopularRecipes(query: GetPopularRecipesQuery) {
  const { limit } = query;

  return prisma.recipe.findMany({
    take: limit,
    orderBy: {
      favoritedBy: {
        _count: "desc",
      },
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      owner: {
        select: {
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: { favoritedBy: true },
      },
    },
  });
}

export async function getRecipeById(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: {
      id: id,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      area: {
        select: { id: true, name: true },
      },
      ingredients: {
        include: {
          ingredient: true,
        },
      },
      owner: {
        select: { name: true, avatar: true },
      },
    },
  });

  if (!recipe) {
    throw createHttpError(404, "Recipe not found");
  }

  return recipe;
}

export async function createRecipe(
  ownerId: string,
  data: CreateRecipeBody,
  fileBuffer: Buffer,
) {
  const thumbUrl = await uploadImageBuffer(fileBuffer, "recipes");

  return prisma.recipe.create({
    data: {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      time: data.time,
      categoryId: data.categoryId,
      areaId: data.areaId,
      ownerId,
      thumb: thumbUrl,
      ingredients: {
        create: data.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          measure: ing.measure,
        })),
      },
    },
    include: {
      category: { select: { id: true, name: true } },
      area: { select: { id: true, name: true } },
      ingredients: {
        include: { ingredient: true },
      },
    },
  });
}

export async function getOwnRecipes(
  ownerId: string,
  query: GetOwnRecipesQuery,
) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where: Prisma.RecipeWhereInput = { ownerId };

  const [recipes, total] = await prisma.$transaction([
    prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true },
        },
        area: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipe.count({ where }),
  ]);

  return {
    data: recipes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function deleteRecipe(ownerId: string, recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw createHttpError(404, "Recipe not found");
  }

  if (recipe.ownerId !== ownerId) {
    throw createHttpError(403, "You can only delete your own recipes");
  }

  await prisma.recipe.delete({
    where: { id: recipeId },
  });

  return { message: "Recipe deleted successfully", id: recipeId };
}

export async function addFavorite(userId: string, recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw new Error("NOT_FOUND");
  }

  return await prisma.favorite.create({
    data: {
      userId,
      recipeId,
    },
  });
}