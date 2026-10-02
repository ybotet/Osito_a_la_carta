import {
  categoryExists,
  countDishReferences,
  findAvailableDishById,
  findAvailableDishes,
  findDishById,
  insertDish,
  purgeDish as removeDish,
  setDishAvailability as applyDishAvailability,
  softDeleteDish,
  updateDish as applyDishUpdate,
} from './dishes.repository.js';
import type { DishRow } from './dishes.repository.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../shared/errors.js';
import { dishSchema, dishesResponseSchema } from './dishes.schema.js';
import type {
  CreateDishBody,
  Language,
  UpdateDishBody,
} from './dishes.schema.js';
import { resolveLanguage } from '../../shared/language.js';

const localize = (row: DishRow, language: Language) => {
  switch (language) {
    case 'ru':
      return {
        name: row.nameRu,
        description: row.descRu,
        ingredients: row.ingredientsRu,
        categoryName: row.categoryNameRu,
      };
    case 'en':
      return {
        name: row.nameEn,
        description: row.descEn,
        ingredients: row.ingredientsEn,
        categoryName: row.categoryNameEn,
      };
    case 'es':
      return {
        name: row.nameEs,
        description: row.descEs,
        ingredients: row.ingredientsEs,
        categoryName: row.categoryNameEs,
      };
  }
};

const toResponse = (row: DishRow, language: Language) => {
  const localized = localize(row, language);

  return {
    id: row.id,
    imageUrl: row.imageUrl,
    price: row.price,
    name: localized.name,
    description: localized.description,
    ingredients: localized.ingredients,
    category: {
      id: row.categoryId,
      slug: row.categorySlug,
      name: localized.categoryName,
    },
  };
};

const listDishes = (acceptLanguage: string | undefined) => {
  const language = resolveLanguage(acceptLanguage);

  const payload = findAvailableDishes().map((row) => toResponse(row, language));

  return { language, dishes: dishesResponseSchema.parse(payload) };
};

const getDish = (id: number, acceptLanguage: string | undefined) => {
  const language = resolveLanguage(acceptLanguage);
  const row = findAvailableDishById(id);

  if (row === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  return { language, dish: dishSchema.parse(toResponse(row, language)) };
};

const createDish = (
  body: CreateDishBody,
  acceptLanguage: string | undefined,
) => {
  if (!categoryExists(body.categoryId)) {
    throw new BadRequestError('Category not found', 'CATEGORY_NOT_FOUND', {
      categoryId: body.categoryId,
    });
  }

  const language = resolveLanguage(acceptLanguage);
  const created = insertDish(body);
  const row = findAvailableDishById(created.id);

  if (row === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', {
      id: created.id,
    });
  }

  return { language, dish: dishSchema.parse(toResponse(row, language)) };
};

const updateDish = (
  id: number,
  body: UpdateDishBody,
  acceptLanguage: string | undefined,
) => {
  if (body.categoryId !== undefined && !categoryExists(body.categoryId)) {
    throw new BadRequestError('Category not found', 'CATEGORY_NOT_FOUND', {
      categoryId: body.categoryId,
    });
  }

  if (findAvailableDishById(id) === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  // Un body vacío no produce ningún `SET`; se salta el UPDATE en vez de dejar que
  // Drizzle genere un `UPDATE ... SET` sin columnas. El 404 de arriba ya lo resolvió.
  if (Object.keys(body).length > 0) {
    applyDishUpdate(id, body);
  }

  const language = resolveLanguage(acceptLanguage);
  const row = findAvailableDishById(id);

  if (row === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  return { language, dish: dishSchema.parse(toResponse(row, language)) };
};

/**
 * Deshabilita un plato (lo que hace `DELETE /api/dishes/:id` desde T-024).
 * `findAvailableDishById` solo ve platos disponibles, así que uno ya deshabilitado
 * responde 404 igual que uno que nunca existió: es la decisión de no revelar qué platos
 * hubo. Para recuperarlo está `PATCH .../availability`, que sí busca sin ese filtro.
 */
const deleteDish = (id: number) => {
  if (findAvailableDishById(id) === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  softDeleteDish(id);
};

/**
 * Habilita o deshabilita un plato, tenga o no historial. Solo se ve con `findDishById`,
 * que no filtra por disponibilidad: un plato deshabilitado es invisible para el resto
 * del módulo, así que sin esta consulta no habría forma de recuperarlo.
 */
const setDishAvailability = (
  id: number,
  isAvailable: boolean,
  acceptLanguage: string | undefined,
) => {
  if (findDishById(id) === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  applyDishAvailability(id, isAvailable);

  const language = resolveLanguage(acceptLanguage);
  const updated = findDishById(id);

  if (updated === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  return { language, dish: dishSchema.parse(toResponse(updated, language)) };
};

/**
 * Purga física: borra la fila y el plato deja de existir. Solo para platos ya
 * deshabilitados y sin historial, por los dos 409 de aquí. Devuelve void porque la ruta
 * responde 204.
 */
const purgeDish = (id: number) => {
  const row = findDishById(id);

  if (row === undefined) {
    throw new NotFoundError('Dish not found', 'DISH_NOT_FOUND', { id });
  }

  if (row.isAvailable === 1) {
    throw new ConflictError(
      'Dish must be disabled before purging',
      'DISH_STILL_AVAILABLE',
      { id },
    );
  }

  const references = countDishReferences(id);

  if (references.orderItems > 0 || references.pageViews > 0) {
    throw new ConflictError(
      'Dish cannot be purged because it has history',
      'DISH_HAS_HISTORY',
      { id, ...references },
    );
  }

  removeDish(id);
};

export {
  createDish,
  deleteDish,
  getDish,
  listDishes,
  purgeDish,
  setDishAvailability,
  updateDish,
};

export type CreateDishResult = ReturnType<typeof createDish>;
export type GetDishResult = ReturnType<typeof getDish>;
export type ListDishesResult = ReturnType<typeof listDishes>;
export type SetDishAvailabilityResult = ReturnType<typeof setDishAvailability>;
export type UpdateDishResult = ReturnType<typeof updateDish>;
