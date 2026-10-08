import { db } from '../../db/client.js';
import { pageViews, dishes, orders, orderItems, users } from '../../db/schema.js';
import { eq, desc, count, sum } from 'drizzle-orm';

/**
 * Inserta una visita a página.
 *
 * `userId` puede ser `null` (usuario anónimo). `dishId` también puede ser `null`
 * (páginas que no son de un plato concreto). `path` es la ruta visitada.
 * `viewedAt` es el timestamp Unix en segundos.
 */
const insertPageView = (values: {
  userId: number | null;
  dishId: number | null;
  path: string;
  viewedAt: number;
}): void => {
  db.insert(pageViews)
    .values({
      userId: values.userId,
      dishId: values.dishId,
      path: values.path,
      viewedAt: values.viewedAt,
    })
    .run();
};

/**
 * Obtiene los 5 platos más vistos por el usuario.
 */
const getTopViewedDishes = (userId: number, language: 'es' | 'ru' | 'en') => {
  const nameCol = language === 'ru' ? dishes.nameRu : language === 'en' ? dishes.nameEn : dishes.nameEs;

  return db
    .select({
      dishId: pageViews.dishId,
      name: nameCol,
      views: count(pageViews.id),
    })
    .from(pageViews)
    .innerJoin(dishes, eq(pageViews.dishId, dishes.id))
    .where(eq(pageViews.userId, userId))
    .groupBy(pageViews.dishId, nameCol)
    .orderBy(desc(count(pageViews.id)))
    .limit(5)
    .all();
};

/**
 * Obtiene los 5 platos más pedidos por el usuario.
 */
const getTopOrderedDishes = (userId: number, language: 'es' | 'ru' | 'en') => {
  const nameCol = language === 'ru' ? dishes.nameRu : language === 'en' ? dishes.nameEn : dishes.nameEs;

  return db
    .select({
      dishId: orderItems.dishId,
      name: nameCol,
      count: sum(orderItems.quantity),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(eq(orders.userId, userId))
    .groupBy(orderItems.dishId, nameCol)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(5)
    .all();
};

/**
 * Obtiene estadísticas agregadas del usuario.
 */
const getUserStats = (userId: number) => {
  const totalOrders = db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(eq(orders.userId, userId))
    .get();

  const totalSpent = db
    .select({ total: sum(orders.total) })
    .from(orders)
    .where(eq(orders.userId, userId))
    .get();

  const memberSince = db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return {
    totalOrders: totalOrders?.count ?? 0,
    totalSpent: totalSpent?.total ?? 0,
    memberSince: memberSince?.createdAt ?? 0,
  };
};

export { insertPageView, getTopViewedDishes, getTopOrderedDishes, getUserStats };