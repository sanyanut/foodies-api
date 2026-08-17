import prisma from "../../prisma/prisma.ts";

// Business logic for the health module. Verifies the database is reachable by
// issuing a trivial query.
export const checkDatabase = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};
