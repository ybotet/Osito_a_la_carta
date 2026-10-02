import { and, asc, count, eq, ne } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { categories, dishes } from '../../db/schema.js';
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

/**
 * Cuántos platos bloquean el borrado.
 *
 * **Cuenta también los deshabilitados** (`is_available = 0`), a diferencia de
 * `findAvailableDishes`. No es un descuido: la fila sigue existiendo y sigue apuntando a
 * la categoría, así que borrarla dejaría dishes con una FK colgando. Además coincide con lo
 * que ya decidió MEMORY: un dish deshabilitado sigue contando, y la categoría se libera
 * cuando el dish se purga de verdad.
 *
 * Con el borrado físico que hace este endpoint, el conteo no es solo informativo: es la
 * condición que decide si el `DELETE` puede ocurrir. La FK está en `NO ACTION`, así que
 * SQLite abortaría el borrado igual, pero el servicio responde antes con el mensaje de la
 * API en vez de dejar escapar una excepción de constraint.
 */
const countCategoryDishes = (id: number) =>
  db
    .select({ total: count() })
    .from(dishes)
    .where(eq(dishes.categoryId, id))
    .get()?.total ?? 0;

/**
 * Borra la categoría de verdad. Solo es viable si nada la referencia (ver
 * `countCategoryDishes`): `dishes.category_id` está en `NO ACTION`, así que SQLite aborta
 * el `DELETE` si queda algún plato. A diferencia de los platos, aquí no hace falta un
 * borrado lógico porque el 409 impide llegar a esta llamada con referencias, y una
 * categoría no tiene historial propio: los pedidos apuntan a platos, no a categorías.
 */
const purgeCategory = (id: number) =>
  db.delete(categories).where(eq(categories.id, id)).run();

export {
  categorySlugExists,
  countCategoryDishes,
  findAllCategories,
  findCategoryById,
  insertCategory,
  purgeCategory,
  updateCategory,
};

export type CategoryRow = ReturnType<typeof findAllCategories>[number];
