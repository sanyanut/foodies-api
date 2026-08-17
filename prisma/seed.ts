// Database seed — loads the Foodies dataset (converted from the provided CSVs)
// into PostgreSQL. Run with: `npm run seed` (requires a migrated database).
//
// The JSON files in ./seed-data preserve the original ObjectId ids, so all
// relationships (recipe -> owner / category / area / ingredients, testimonials,
// etc.) resolve without remapping. Recipes reference category & area by NAME,
// which we map to their ids here.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcrypt";

import prisma from "../src/prisma/prisma.ts";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "seed-data");

const load = async <T>(file: string): Promise<T> =>
  JSON.parse(await readFile(join(dataDir, file), "utf-8")) as T;

type UserRow = { id: string; name: string; email: string; avatar: string | null };
type NamedRow = { id: string; name: string };
type IngredientRow = { id: string; name: string; description: string | null; img: string | null };
type RecipeRow = {
  id: string;
  title: string;
  categoryName: string;
  areaName: string | null;
  instructions: string;
  description: string | null;
  thumb: string | null;
  preview: string | null;
  time: number | null;
  ownerId: string;
};
type RecipeIngredientRow = { recipeId: string; ingredientId: string; measure: string | null };
type TestimonialRow = { id: string; ownerId: string; testimonial: string };

const DEFAULT_PASSWORD = "password123";

async function main() {
  console.log("Seeding Foodies database...");

  const [users, categories, areas, ingredients, recipes, recipeIngredients, testimonials] =
    await Promise.all([
      load<UserRow[]>("users.json"),
      load<NamedRow[]>("categories.json"),
      load<NamedRow[]>("areas.json"),
      load<IngredientRow[]>("ingredients.json"),
      load<RecipeRow[]>("recipes.json"),
      load<RecipeIngredientRow[]>("recipe_ingredients.json"),
      load<TestimonialRow[]>("testimonials.json"),
    ]);

  // Clean slate — order matters because of foreign keys.
  await prisma.follow.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.area.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.category.createMany({ data: categories });
  await prisma.area.createMany({ data: areas });
  await prisma.ingredient.createMany({ data: ingredients });
  console.log(
    `Reference data: ${categories.length} categories, ${areas.length} areas, ${ingredients.length} ingredients`,
  );

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await prisma.user.createMany({
    data: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      password: hashedPassword,
    })),
  });
  console.log(`Users: ${users.length} (default password: "${DEFAULT_PASSWORD}")`);

  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const areaIdByName = new Map(areas.map((a) => [a.name, a.id]));

  await prisma.recipe.createMany({
    data: recipes.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      instructions: r.instructions,
      thumb: r.thumb,
      preview: r.preview,
      time: r.time,
      categoryId: categoryIdByName.get(r.categoryName)!,
      areaId: r.areaName ? (areaIdByName.get(r.areaName) ?? null) : null,
      ownerId: r.ownerId,
    })),
  });
  await prisma.recipeIngredient.createMany({ data: recipeIngredients });
  console.log(
    `Recipes: ${recipes.length} with ${recipeIngredients.length} ingredient links`,
  );

  await prisma.testimonial.createMany({
    data: testimonials.map((t) => ({ id: t.id, ownerId: t.ownerId, testimonial: t.testimonial })),
  });
  console.log(`Testimonials: ${testimonials.length}`);

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
