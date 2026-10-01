import { z } from 'zod';

const LANGUAGES = ['es', 'ru', 'en'] as const;

const DEFAULT_LANGUAGE = 'es';

const categorySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
});

const dishSchema = z.object({
  id: z.number().int(),
  imageUrl: z.string(),
  price: z.number(),
  name: z.string(),
  description: z.string(),
  ingredients: z.string(),
  category: categorySchema,
});

const dishesResponseSchema = z.array(dishSchema);

const createDishBodySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  imageUrl: z.string().url(),
  price: z.number().positive(),
  nameEs: z.string().trim().min(1),
  nameRu: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  descEs: z.string().trim().min(1),
  descRu: z.string().trim().min(1),
  descEn: z.string().trim().min(1),
  ingredientsEs: z.string().trim().min(1),
  ingredientsRu: z.string().trim().min(1),
  ingredientsEn: z.string().trim().min(1),
});

export {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  categorySchema,
  createDishBodySchema,
  dishSchema,
  dishesResponseSchema,
};

export type Language = (typeof LANGUAGES)[number];
export type Category = z.infer<typeof categorySchema>;
export type Dish = z.infer<typeof dishSchema>;
export type DishesResponse = z.infer<typeof dishesResponseSchema>;
export type CreateDishBody = z.infer<typeof createDishBodySchema>;
