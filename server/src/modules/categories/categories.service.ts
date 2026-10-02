import {
  categorySlugExists,
  findAllCategories,
  insertCategory,
} from './categories.repository.js';
import type { CategoryRow } from './categories.repository.js';
import {
  categoriesResponseSchema,
  categorySchema,
} from './categories.schema.js';
import type { CreateCategoryBody } from './categories.schema.js';
import { ConflictError } from '../../shared/errors.js';
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

  return categorySchema.parse(toResponse(row, language));
};

export { createCategory, listCategories };

export type CreateCategoryResult = ReturnType<typeof createCategory>;
export type ListCategoriesResult = ReturnType<typeof listCategories>;
