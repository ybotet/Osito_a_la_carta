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

export {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  categorySchema,
  dishSchema,
  dishesResponseSchema,
};

export type Language = (typeof LANGUAGES)[number];
export type Category = z.infer<typeof categorySchema>;
export type Dish = z.infer<typeof dishSchema>;
export type DishesResponse = z.infer<typeof dishesResponseSchema>;
