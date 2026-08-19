import prisma from "../../prisma/prisma.ts";

export const getAllCategories = async () => {
  return await prisma.category.findMany();
};
