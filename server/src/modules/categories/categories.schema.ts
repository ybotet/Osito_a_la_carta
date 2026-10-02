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

/**
 * `slug` es la clave estable de la categoría: se usa en filtros y URLs, así que se
 * normaliza a minúsculas y se rechazan espacios y acentos en vez de limpiarlos en
 * silencio. Un slug con `Ñ` o con espacios convertiría una URL fea en una más fea y
 * rompería la comparación con el `slug` que mande el frontend.
 */
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'El slug solo puede tener minusculas, digitos y guiones, sin guiones al inicio o al final',
  });

/**
 * `sortOrder` es opcional con default 0: el alta no debería obligar a decidir el orden
 * del menú, que es justo lo que permite reordenar después sin migrar (decisión de A-001).
 */
const createCategoryBodySchema = z.object({
  slug: slugSchema,
  nameEs: z.string().trim().min(1),
  nameRu: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
});

export { categoriesResponseSchema, categorySchema, createCategoryBodySchema };

export type Category = z.infer<typeof categorySchema>;
export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;
export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
