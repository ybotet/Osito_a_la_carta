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

/**
 * `PUT` acepta las mismas columnas que el alta, pero todas opcionales: se actualiza
 * solo lo que venga en el body. Se deriva con `.partial()` en vez de reescribir el
 * objeto para que las dos rutas no puedan divergir (si el alta cambia una regla, el
 * PUT la hereda).
 */
const updateDishBodySchema = createDishBodySchema.partial();

/**
 * Cuerpo de `PATCH /api/dishes/:id/availability`. Es el **único** sitio del API donde
 * el cliente controla la disponibilidad, y solo en este endpoint: el alta y la edición
 * siguen sin aceptarla. `z.boolean()` sin `coerce` para no convertir `"false"` (que es
 * truthy en JS) en un `true` silencioso.
 */
const availabilityBodySchema = z.object({
  isAvailable: z.boolean(),
});

export {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  availabilityBodySchema,
  categorySchema,
  createDishBodySchema,
  dishSchema,
  dishesResponseSchema,
  updateDishBodySchema,
};

export type Language = (typeof LANGUAGES)[number];
export type AvailabilityBody = z.infer<typeof availabilityBodySchema>;
export type Category = z.infer<typeof categorySchema>;
export type Dish = z.infer<typeof dishSchema>;
export type DishesResponse = z.infer<typeof dishesResponseSchema>;
export type CreateDishBody = z.infer<typeof createDishBodySchema>;
export type UpdateDishBody = z.infer<typeof updateDishBodySchema>;
