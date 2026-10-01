import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { categories, dishes } from '../../db/schema.js';
import type { CreateDishBody } from './dishes.schema.js';

const dishProjection = {
  id: dishes.id,
  imageUrl: dishes.imageUrl,
  price: dishes.price,
  nameEs: dishes.nameEs,
  nameRu: dishes.nameRu,
  nameEn: dishes.nameEn,
  descEs: dishes.descEs,
  descRu: dishes.descRu,
  descEn: dishes.descEn,
  ingredientsEs: dishes.ingredientsEs,
  ingredientsRu: dishes.ingredientsRu,
  ingredientsEn: dishes.ingredientsEn,
  categoryId: categories.id,
  categorySlug: categories.slug,
  categoryNameEs: categories.nameEs,
  categoryNameRu: categories.nameRu,
  categoryNameEn: categories.nameEn,
};

const findAvailableDishes = () =>
  db
    .select(dishProjection)
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(eq(dishes.isAvailable, 1))
    .orderBy(asc(categories.sortOrder), asc(dishes.id))
    .all();

const findAvailableDishById = (id: number) =>
  db
    .select(dishProjection)
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(and(eq(dishes.id, id), eq(dishes.isAvailable, 1)))
    .get();

const categoryExists = (id: number) =>
  db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .get() !== undefined;

const insertDish = (body: CreateDishBody) =>
  db
    .insert(dishes)
    .values({
      categoryId: body.categoryId,
      imageUrl: body.imageUrl,
      price: body.price,
      nameEs: body.nameEs,
      nameRu: body.nameRu,
      nameEn: body.nameEn,
      descEs: body.descEs,
      descRu: body.descRu,
      descEn: body.descEn,
      ingredientsEs: body.ingredientsEs,
      ingredientsRu: body.ingredientsRu,
      ingredientsEn: body.ingredientsEn,
      isAvailable: 1,
    })
    .returning({ id: dishes.id })
    .get();

export {
  categoryExists,
  findAvailableDishById,
  findAvailableDishes,
  insertDish,
};

export type DishRow = ReturnType<typeof findAvailableDishes>[number];
