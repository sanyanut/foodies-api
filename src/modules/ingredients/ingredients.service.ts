import prisma from "../../prisma/prisma.ts";

export const getAllIngredients = async () => {
  return await prisma.ingredient.findMany();
};