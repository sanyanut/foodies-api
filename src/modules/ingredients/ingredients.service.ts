import prisma from "../../prisma/prisma.ts";

export const getAllIngredients = () =>
  prisma.ingredient.findMany({ orderBy: { name: "asc" } });
