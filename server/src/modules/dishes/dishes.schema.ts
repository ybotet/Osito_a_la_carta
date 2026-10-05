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

/**
 * `imageUrl` acepta **las dos formas** y no solo URLs, a diferencia de lo que fijaba la
 * validación de T-020.
 *
 * Las imágenes se sirven desde la propia VPS, así que lo natural es guardar la ruta
 * (`/uploads/dishes/x.jpg`) y componer la URL absoluta con `PUBLIC_ORIGIN` al responder.
 * Guardar la absoluta en la fila ataría cada registro a un dominio, y cambiar de dominio
 * obligaría a reescribirlas todas.
 *
 * La absoluta se sigue aceptando para no invalidar lo que ya hay: el seed de T-015 guarda
 * `https://placehold.co/600x400/...` y esas filas existen en la base de datos actual. Quien
 * trae una URL absoluta la recibe intacta; quien trae una relativa la convierte
 * `toAbsoluteImageUrl` en la respuesta.
 *
 * `z.string().url()` solo, además, rechazaría una ruta relativa sin decir por qué.
 */
const imageUrlSchema = z
  .string()
  .trim()
  .min(1, { message: 'Requerida' })
  .refine(
    (value) => {
      if (value.startsWith('/')) {
        // Relativa: solo bajo el prefijo de subidas, para que la columna no pueda apuntar a
        // rutas arbitrarias del servidor (`/etc/passwd` o rutas fuera de la carpeta).
        return value.startsWith('/uploads/dishes/');
      }

      return z.string().url().safeParse(value).success;
    },
    { message: 'Debe ser una URL absoluta o una ruta /uploads/dishes/...' },
  );

const createDishBodySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  imageUrl: imageUrlSchema,
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
  imageUrlSchema,
  updateDishBodySchema,
};

export type Language = (typeof LANGUAGES)[number];
export type AvailabilityBody = z.infer<typeof availabilityBodySchema>;
export type Category = z.infer<typeof categorySchema>;
export type Dish = z.infer<typeof dishSchema>;
export type DishesResponse = z.infer<typeof dishesResponseSchema>;
export type CreateDishBody = z.infer<typeof createDishBodySchema>;
export type UpdateDishBody = z.infer<typeof updateDishBodySchema>;
