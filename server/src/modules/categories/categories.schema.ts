import { z } from 'zod';

/**
 * Una categoría tal como la ve el cliente: la identidad y el slug van siempre en claro
 * (son datos, no texto traducible) y el nombre se resuelve al idioma de la petición antes
 * de salir. Se valida en runtime con `parse`, no solo en compilación, para que una fila
 * mal formada reviente en esta capa y no llegue al cliente.
 */
const categorySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
});

const categoriesResponseSchema = z.array(categorySchema);

export { categoriesResponseSchema, categorySchema };

export type Category = z.infer<typeof categorySchema>;
export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;
