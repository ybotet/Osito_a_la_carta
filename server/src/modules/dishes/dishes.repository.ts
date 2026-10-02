import { and, asc, count, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { categories, dishes, orderItems, pageViews } from '../../db/schema.js';
import type { NewDish } from '../../db/schema.js';
import type { CreateDishBody, UpdateDishBody } from './dishes.schema.js';

const dishProjection = {
  id: dishes.id,
  imageUrl: dishes.imageUrl,
  price: dishes.price,
  isAvailable: dishes.isAvailable,
  nameEs: dishes.nameEs,
  nameRu: dishes.nameRu,
  nameEn: dishes.nameEn,
  descEs: dishes.descEs,
  descRu: dishes.descRu,
  descEn: dishes.descEn,
  ingredientsEs: dishes.ingredientsEs,
  ingredientsRu: dishes.ingredientsRu,
  ingredientsEn: dishes.ingredientsEn,
  categoryId: categories.id,
  categorySlug: categories.slug,
  categoryNameEs: categories.nameEs,
  categoryNameRu: categories.nameRu,
  categoryNameEn: categories.nameEn,
};

const findAvailableDishes = () =>
  db
    .select(dishProjection)
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(eq(dishes.isAvailable, 1))
    .orderBy(asc(categories.sortOrder), asc(dishes.id))
    .all();

const findAvailableDishById = (id: number) =>
  db
    .select(dishProjection)
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(and(eq(dishes.id, id), eq(dishes.isAvailable, 1)))
    .get();

const categoryExists = (id: number) =>
  db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .get() !== undefined;

const insertDish = (body: CreateDishBody) =>
  db
    .insert(dishes)
    .values({
      categoryId: body.categoryId,
      imageUrl: body.imageUrl,
      price: body.price,
      nameEs: body.nameEs,
      nameRu: body.nameRu,
      nameEn: body.nameEn,
      descEs: body.descEs,
      descRu: body.descRu,
      descEn: body.descEn,
      ingredientsEs: body.ingredientsEs,
      ingredientsRu: body.ingredientsRu,
      ingredientsEn: body.ingredientsEn,
      isAvailable: 1,
    })
    .returning({ id: dishes.id })
    .get();

/**
 * Traduce el body parcial a columnas de Drizzle. Solo copia las claves presentes:
 * con `exactOptionalPropertyTypes` una clave `undefined` en `.set()` intentaría
 * escribir NULL sobre columnas `NOT NULL`, y el `UPDATE` no distingue "no lo
 * mandaste" de "mándalo a NULL". Se escribe campo a campo, en vez de recorrer el
 * objeto con `Object.entries`, para que un campo nuevo del schema no se cuele en el
 * `UPDATE` sin revisión y los tipos sigan siendo comprobados.
 */
const toUpdatePatch = (body: UpdateDishBody): Partial<NewDish> => ({
  ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
  ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
  ...(body.price !== undefined && { price: body.price }),
  ...(body.nameEs !== undefined && { nameEs: body.nameEs }),
  ...(body.nameRu !== undefined && { nameRu: body.nameRu }),
  ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
  ...(body.descEs !== undefined && { descEs: body.descEs }),
  ...(body.descRu !== undefined && { descRu: body.descRu }),
  ...(body.descEn !== undefined && { descEn: body.descEn }),
  ...(body.ingredientsEs !== undefined && {
    ingredientsEs: body.ingredientsEs,
  }),
  ...(body.ingredientsRu !== undefined && {
    ingredientsRu: body.ingredientsRu,
  }),
  ...(body.ingredientsEn !== undefined && {
    ingredientsEn: body.ingredientsEn,
  }),
});

const updateDish = (id: number, body: UpdateDishBody) =>
  db
    .update(dishes)
    .set(toUpdatePatch(body))
    .where(eq(dishes.id, id))
    .returning({ id: dishes.id })
    .get();

/**
 * Borrado lógico: la fila se conserva y solo se marca como no disponible. Los pedidos
 * ya hechos la referencian (`order_items.dish_id`), así que un `DELETE` real dejaría
 * historial apuntando a platos inexistentes. El `WHERE` no filtra por
 * `is_available`, porque repetir el borrado sobre uno ya borrado debe ser un no-op y no
 * un error: decide la fila a tocar el servicio, que lanza el 404.
 */
const softDeleteDish = (id: number) =>
  db
    .update(dishes)
    .set({ isAvailable: 0 })
    .where(eq(dishes.id, id))
    .returning({ id: dishes.id })
    .get();

/**
 * Igual que `findAvailableDishById` pero **sin** el filtro de disponibilidad. Existe
 * para poder volver a habilitar un plato ya deshabilitado, que por definición no
 * aparece en ninguna consulta que filtre por `is_available`.
 */
const findDishById = (id: number) =>
  db
    .select(dishProjection)
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(eq(dishes.id, id))
    .get();

const setDishAvailability = (id: number, isAvailable: boolean) =>
  db
    .update(dishes)
    .set({ isAvailable: isAvailable ? 1 : 0 })
    .where(eq(dishes.id, id))
    .returning({ id: dishes.id })
    .get();

/**
 * Borra la fila de verdad. Solo es viable si nada la referencia: las dos tablas que la
 * apuntan están en `NO ACTION`, así que SQLite aborta el `DELETE` si hay historial. El
 * servicio comprueba los conteos antes y responde 409, para que el error sea un mensaje
 * de API y no una excepción de constraint.
 */
const purgeDish = (id: number) =>
  db.delete(dishes).where(eq(dishes.id, id)).run();

/**
 * Cuántos registros bloquean el purgado. Se cuentan por separado porque no es lo mismo
 * un plato que aparece en un pedido (historial comercial) que uno que solo se ha
 * visitado (estadísticas), y el 409 los distingue para que el mensaje sea accionable.
 */
const countDishReferences = (id: number) => ({
  orderItems:
    db
      .select({ total: count() })
      .from(orderItems)
      .where(eq(orderItems.dishId, id))
      .get()?.total ?? 0,
  pageViews:
    db
      .select({ total: count() })
      .from(pageViews)
      .where(eq(pageViews.dishId, id))
      .get()?.total ?? 0,
});

export {
  categoryExists,
  countDishReferences,
  findAvailableDishById,
  findAvailableDishes,
  findDishById,
  insertDish,
  purgeDish,
  setDishAvailability,
  softDeleteDish,
  updateDish,
};

export type DishRow = ReturnType<typeof findAvailableDishes>[number];
