import prisma from "../../prisma/prisma.ts";

export const getAllAreas = async () => {
  return await prisma.area.findMany();
};