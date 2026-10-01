import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  dishesResponseSchema,
} from './dishes.schema.js';
import type { Language } from './dishes.schema.js';
import { findAvailableDishes } from './dishes.repository.js';
import type { DishRow } from './dishes.repository.js';

const isSupportedLanguage = (value: string): value is Language =>
  (LANGUAGES as readonly string[]).includes(value);

const resolveLanguage = (header: string | undefined): Language => {
  if (header === undefined) {
    return DEFAULT_LANGUAGE;
  }

  const preferred = header
    .split(',')
    .map((part) => {
      const [rawTag = '', ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith('q='));

      const parsed =
        quality === undefined ? 1 : Number.parseFloat(quality.slice(2));

      return {
        tag: rawTag.trim().toLowerCase(),
        quality: Number.isNaN(parsed) ? 0 : parsed,
      };
    })
    .filter((candidate) => candidate.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of preferred) {
    const [base = ''] = candidate.tag.split('-');

    if (isSupportedLanguage(base)) {
      return base;
    }
  }

  return DEFAULT_LANGUAGE;
};

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

const listDishes = (acceptLanguage: string | undefined) => {
  const language = resolveLanguage(acceptLanguage);

  const payload = findAvailableDishes().map((row) => {
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
  });

  return { language, dishes: dishesResponseSchema.parse(payload) };
};

export { listDishes, resolveLanguage };

export type ListDishesResult = ReturnType<typeof listDishes>;
