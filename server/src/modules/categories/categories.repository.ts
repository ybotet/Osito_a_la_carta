import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { categories } from '../../db/schema.js';
import type { NewCategory } from '../../db/schema.js';
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
} from './categories.schema.js';

const categoryProjection = {
  id: categories.id,
  slug: categories.slug,
  nameEs: categories.nameEs,
  nameRu: categories.nameRu,
  nameEn: categories.nameEn,
};

/**
 * Trae todas las categorías del menú. El orden es `sort_order` y después `id`: el
 * primero es el que define el admin con `sortOrder` y el segundo solo desempata, para
 * que el resultado sea estable y reproducible.
 *
 * **No hay filtro de disponibilidad**: `categories` no tiene columna `is_available`
 * (solo la tiene `dishes`), y SPEC §6 define `Category` con `id`, `slug`, los tres
 * nombres y `sortOrder`. Ocultar una categoría del menú, si alguna vez hace falta, es
 * una columna nueva en una migración nueva.
 */
const findAllCategories = () =>
  db
    .select(categoryProjection)
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all();

/**
 * Comprueba el slug contra **todas** las categorías, no solo contra el menú visible.
 * `categories` no tiene `is_available`, así que no hay versión deshabilitada que se
 * pueda reutilizar el slug sin romper la unicidad a nivel de base de datos.
 *
 * `excludeId` existe para el PUT: al renombrar, la categoría que se está editando ya
 * tiene ese slug y no cuenta como conflicto. Sin la excepción, un PUT que reenvíe el
 * slug sin cambios se rechazaría a sí mismo con un 409 absurdo.
 *
 * Existe además un `UNIQUE` en la columna: esta comprobación existe para devolver un
 * 409 con el mensaje de la API, y no para garantizar la integridad. Con dos peticiones
 * simultáneas, la que pierda la carrera recibe el error del UNIQUE de SQLite.
 */
const categorySlugExists = (slug: string, excludeId?: number) =>
  db
    .select({ id: categories.id })
    .from(categories)
    .where(
      excludeId === undefined
        ? eq(categories.slug, slug)
        : and(eq(categories.slug, slug), ne(categories.id, excludeId)),
    )
    .get() !== undefined;

const findCategoryById = (id: number) =>
  db
    .select(categoryProjection)
    .from(categories)
    .where(eq(categories.id, id))
    .get();

/**
 * Traduce el body parcial a columnas de Drizzle. Solo copia las claves presentes: con
 * `exactOptionalPropertyTypes` una clave `undefined` en `.set()` intentaría escribir NULL
 * sobre columnas `NOT NULL`. Se escribe campo a campo, en vez de recorrer el objeto con
 * `Object.entries`, para que un campo nuevo del schema no se cuele en el `UPDATE` sin
 * revisión. Mismo criterio que `toUpdatePatch` en platos.
 */
const toUpdatePatch = (body: UpdateCategoryBody): Partial<NewCategory> => ({
  ...(body.slug !== undefined && { slug: body.slug }),
  ...(body.nameEs !== undefined && { nameEs: body.nameEs }),
  ...(body.nameRu !== undefined && { nameRu: body.nameRu }),
  ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
  ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
});

const updateCategory = (id: number, body: UpdateCategoryBody) =>
  db
    .update(categories)
    .set(toUpdatePatch(body))
    .where(eq(categories.id, id))
    .returning(categoryProjection)
    .get();

/**
 * `sortOrder` se resuelve con `?? 0` y no con el default de Zod: el body ya viene
 * validado, y si en algún momento `sortOrder` se hace opcional pero distinguido de
 * "no enviado" de "enviado", el `??` deja pasar la decisión a la capa de repositorio en
 * vez de dejar un default escondido dentro del schema.
 */
const insertCategory = (body: CreateCategoryBody) =>
  db
    .insert(categories)
    .values({
      slug: body.slug,
      nameEs: body.nameEs,
      nameRu: body.nameRu,
      nameEn: body.nameEn,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning(categoryProjection)
    .get();

export {
  categorySlugExists,
  findAllCategories,
  findCategoryById,
  insertCategory,
  updateCategory,
};

export type CategoryRow = ReturnType<typeof findAllCategories>[number];
