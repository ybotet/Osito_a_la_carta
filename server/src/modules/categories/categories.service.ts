import { findAllCategories } from './categories.repository.js';
import type { CategoryRow } from './categories.repository.js';
import { categoriesResponseSchema } from './categories.schema.js';
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

export { listCategories };

export type ListCategoriesResult = ReturnType<typeof listCategories>;
