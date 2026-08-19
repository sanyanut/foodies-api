import prisma from "../../prisma/prisma.ts";
import { SearchRecipesQuery } from "./recipes.schemas.ts";

export async function searchRecipes(query: SearchRecipesQuery) {
  const { category, area, ingredient, page, limit } = query;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (category) where.categoryId = category;
  if (area) where.areaId = area;
  if (ingredient) {
    where.ingredient = { some: { ingredientId: ingredient } };
  }

  const [recipes, total] = await prisma.$transaction([
    prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        area: true,
      },
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
