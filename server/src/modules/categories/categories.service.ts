import {
  categorySlugExists,
  countCategoryDishes,
  findAllCategories,
  findCategoryById,
  insertCategory,
  purgeCategory,
  updateCategory,
} from './categories.repository.js';
import type { CategoryRow } from './categories.repository.js';
import {
  categoriesResponseSchema,
  categoryEnvelopeSchema,
} from './categories.schema.js';
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
} from './categories.schema.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import type { Language } from '../../shared/language.js';
import { resolveLanguage } from '../../shared/language.js';

const localize = (row: CategoryRow, language: Language) => {
  switch (language) {
    case 'ru':
      return { name: row.nameRu };
    case 'en':
      return { name: row.nameEn };
    case 'es':
      return { name: row.nameEs };
  }
};

const toResponse = (row: CategoryRow, language: Language) => ({
  id: row.id,
  slug: row.slug,
  name: localize(row, language).name,
});

/**
 * Devuelve `{ language, categories }`, el mismo envoltorio que usa `GET /api/dishes`.
 * Se mantiene la forma por coherencia en la API: quien consume un listado de contenido
 * localizado siempre puede saber con qué idioma se resolvió la petición.
 */
const listCategories = (acceptLanguage: string | undefined) => {
  const language = resolveLanguage(acceptLanguage);

  const payload = findAllCategories().map((row) => toResponse(row, language));

  return { language, categories: categoriesResponseSchema.parse(payload) };
};

/**
 * Crea la categoría y devuelve la fila ya localizada al idioma de la misma petición, con
 * la misma forma que devuelve el listado. Un POST no necesita que el cliente vuelva a
 * pedir la categoría: si devolviera solo el id, el frontend tendría que hacer un GET
 * extra (o reconstruir el nombre a mano) para pintar lo que acaba de crear.
 */
const createCategory = (
  body: CreateCategoryBody,
  acceptLanguage: string | undefined,
) => {
  if (categorySlugExists(body.slug)) {
    throw new ConflictError(
      `Ya existe una categoria con el slug "${body.slug}"`,
      'CATEGORY_SLUG_TAKEN',
      { slug: body.slug },
    );
  }

  const language = resolveLanguage(acceptLanguage);
  const row = insertCategory(body);

  return categoryEnvelopeSchema.parse({
    language,
    category: toResponse(row, language),
  });
};

/**
 * Actualiza los campos que vengan en el body y devuelve la categoría ya localizada.
 *
 * **El 404 va antes que el 409 del slug.** Es deliberado: si el id no existe, el slug
 * recibido es irrelevante, y responder 409 sugeriría que el conflicto es real cuando la
 * petición no tenía ni a dónde aplicarse. Todos los guards se resuelven antes de tocar
 * datos, para que un 409 no deje la categoría a medio actualizar.
 *
 * El chequeo de slug excluye la propia fila (`excludeId`), de modo que reenviar el slug
 * sin cambios no se considera un conflicto consigo mismo.
 */
const updateCategoryById = (
  id: number,
  body: UpdateCategoryBody,
  acceptLanguage: string | undefined,
) => {
  if (findCategoryById(id) === undefined) {
    throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND', { id });
  }

  if (body.slug !== undefined && categorySlugExists(body.slug, id)) {
    throw new ConflictError(
      `Ya existe una categoria con el slug "${body.slug}"`,
      'CATEGORY_SLUG_TAKEN',
      { slug: body.slug },
    );
  }

  // Un body vacío no produce ningún `SET`; se salta el UPDATE en vez de dejar que
  // Drizzle genere un `UPDATE ... SET` sin columnas. El 404 de arriba ya lo resolvió.
  if (Object.keys(body).length > 0) {
    updateCategory(id, body);
  }

  const language = resolveLanguage(acceptLanguage);
  const row = findCategoryById(id);

  if (row === undefined) {
    throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND', { id });
  }

  return categoryEnvelopeSchema.parse({
    language,
    category: toResponse(row, language),
  });
};

/**
 * Borra la categoría, pero solo si no tiene platos asociados. Es un borrado **físico**,
 * no lógico como el de platos: el criterio descarta el borrado en cascada, así que no
 * puede haber una categoría "borrada" con dishes colgando, y sin historial propio (los
 * pedidos apuntan a platos) no hay nada que conservar. La categoría queda liberada de
 * verdad y no necesita migración para poder recuperarse.
 *
 * El 404 va antes que el 409 por el mismo motivo que en el PUT: si el id no existe, el
 * conteo de platos es irrelevante.
 *
 * **Un dish deshabilitado cuenta igual que uno disponible**, porque la fila sigue
 * apuntando a la categoría. Quien quiera vaciarla tiene que purgar los platos
 * deshabilitados, no basta con ocultarlos del menú.
 */
const deleteCategory = (id: number) => {
  if (findCategoryById(id) === undefined) {
    throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND', { id });
  }

  const totalDishes = countCategoryDishes(id);

  if (totalDishes > 0) {
    throw new ConflictError(
      'Category cannot be deleted because it has dishes',
      'CATEGORY_HAS_DISHES',
      { id, totalDishes },
    );
  }

  purgeCategory(id);
};

export { createCategory, deleteCategory, listCategories, updateCategoryById };

export type CreateCategoryResult = ReturnType<typeof createCategory>;
export type ListCategoriesResult = ReturnType<typeof listCategories>;
export type UpdateCategoryResult = ReturnType<typeof updateCategoryById>;
