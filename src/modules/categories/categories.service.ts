import prisma from "../../prisma/prisma.ts";

export const getAllCategories = () =>
  prisma.category.findMany({ orderBy: { name: "asc" } });
