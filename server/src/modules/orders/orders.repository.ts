import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { dishes, orderItems, orders, users } from '../../db/schema.js';

/**
 * Lo que el servicio necesita de cada plato pedido: **el precio actual** (que es lo que se
 * cobra y lo que se congela en `order_items.unit_price`) y las tres columnas de nombre
 * para poder localizarlos sin volver a consultar.
 *
 * El filtro por `is_available = 1` va **aquí y no en el servicio**, por el mismo motivo que
 * en T-020: un plato retirado tiene que ser invisible para todo lo que lee el menú y los
 * pedidos, y poner el filtro en la consulta hace que no se pueda olvidar en un sitio.
 */
const orderableDishProjection = {
  id: dishes.id,
  price: dishes.price,
  nameEs: dishes.nameEs,
  nameRu: dishes.nameRu,
  nameEn: dishes.nameEn,
};

const orderProjection = {
  id: orders.id,
  userId: orders.userId,
  status: orders.status,
  total: orders.total,
  customerNote: orders.customerNote,
  createdAt: orders.createdAt,
};

const orderItemProjection = {
  id: orderItems.id,
  orderId: orderItems.orderId,
  dishId: orderItems.dishId,
  quantity: orderItems.quantity,
  unitPrice: orderItems.unitPrice,
  nameEs: dishes.nameEs,
  nameRu: dishes.nameRu,
  nameEn: dishes.nameEn,
};

/**
 * Precios y nombres de los platos disponibles entre los ids pedidos, en una sola
 * consulta. Que sea una y no N es lo que hace que el total se calcule con los precios de
 * un mismo instante: si se consultara plato a plato, un cambio de precio entre medias
 * podría dar dos líneas con precios de momentos distintos.
 *
 * **Los ids se reciben ya deduplicados** por el schema (un `refine` rechaza el mismo
 * `dishId` dos veces), así que el `inArray` no necesita defensivas de lista vacía: el
 * schema exige al menos un elemento.
 *
 * La comparación de "todos existen y están disponibles" la hace el servicio sobre el
 * resultado: si faltan ids, es un 400 con la lista de los que no están.
 */
const findOrderableDishesByIds = (ids: number[]) =>
  db
    .select(orderableDishProjection)
    .from(dishes)
    .where(and(inArray(dishes.id, ids), eq(dishes.isAvailable, 1)))
    .all();

/**
 * Inserta el pedido y sus líneas **en una transacción**, y devuelve el `id` del pedido.
 *
 * **El `status` lo fija esta función a `pending` y no se acepta del body**, igual que
 * `isAvailable` en T-022 y `role` en T-040: el estado de un pedido lo mueve el panel del
 * chef (T-082), no quien lo crea. `total` y `unit_price` tampoco se aceptan: los calcula
 * el servicio con los precios actuales.
 *
 * **El `INSERT` de `order_items` va dentro de la misma transacción a propósito.** Un pedido
 * sin líneas no significa nada (no se puede ni saber qué se pidió ni cuánto vale), y
 * como el driver es síncrono no hace falta nada más para que no quede a medias: o entran
 * las dos escrituras o no entra ninguna. Por eso el `db.transaction` es el sitio natural
 * y no hace falta un `try/catch`: si algo lanza dentro, Drizzle hace el `ROLLBACK`.
 *
 * `db.transaction` con el driver síncrono de better-sqlite3 **exige un método terminal en
 * cada sentencia**: aquí `.returning(...).get()` y `.run()`. Sin ellos, la sentencia no
 * se ejecuta y no falla (gotcha de MEMORY).
 */
const insertOrderWithItems = (values: {
  userId: number;
  total: number;
  customerNote: string | null;
  items: { dishId: number; quantity: number; unitPrice: number }[];
}) =>
  db.transaction((tx) => {
    const order = tx
      .insert(orders)
      .values({
        userId: values.userId,
        status: 'pending',
        total: values.total,
        customerNote: values.customerNote,
      })
      .returning({ id: orders.id })
      .get();

    tx.insert(orderItems)
      .values(
        values.items.map((item) => ({
          orderId: order.id,
          dishId: item.dishId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      )
      .run();

    return { id: order.id };
  });

/**
 * Relee el pedido recién creado con sus líneas para la respuesta.
 *
 * Existe para no tener que construir la respuesta con lo que el servicio ya sabe: el
 * `id`, el `created_at` y los nombres solo están en la base, y devolverlos leídos evita
 * que la respuesta y la fila puedan divergir. Es el mismo patrón que `createDish` en
 * T-022.
 *
 * El `JOIN` a `dishes` es **`inner` porque no puede quedar colgando**: el purgado de
 * T-029b devuelve 409 si el plato tiene `order_items`, así que un plato de un pedido
 * nunca desaparece de la tabla.
 */
const findOrderWithItems = (id: number) => {
  const order = db
    .select(orderProjection)
    .from(orders)
    .where(eq(orders.id, id))
    .get();

  if (order === undefined) {
    return undefined;
  }

  const items = db
    .select(orderItemProjection)
    .from(orderItems)
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id))
    .all();

  return { order, items };
};

/**
 * Devuelve un pedido con sus líneas **solo si pertenece al usuario**.
 *
 * **El ownership lo resuelve el repositorio**, no el servicio: el `WHERE` combina
 * `orders.id = ?` y `orders.user_id = ?`, así que no hay forma de que un cambio en la
 * consulta devuelva un pedido de otro usuario sin que el servicio se entere.
 *
 * Si el pedido no existe o no es del usuario, devuelve `undefined`: el servicio lo
 * traduce a 404 para no revelar si el pedido existe o no.
 */
const findOrderWithItemsForUser = (orderId: number, userId: number) => {
  const order = db
    .select(orderProjection)
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .get();

  if (order === undefined) {
    return undefined;
  }

  const items = db
    .select(orderItemProjection)
    .from(orderItems)
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(eq(orderItems.orderId, orderId))
    .orderBy(asc(orderItems.id))
    .all();

  return { order, items };
};

/**
 * Lista los pedidos de un usuario con sus líneas y los nombres de los platos,
 * ordenados por `created_at` descendente.
 *
 * **El JOIN a `dishes` es `inner` y no puede quedar colgando:** T-029b impide purgar un
 * plato con historial, así que todo `order_items.dish_id` tiene su fila en `dishes`.
 *
 * **Los items vienen con las tres columnas de nombre** (`nameEs`, `nameRu`, `nameEn`).
 * El servicio es quien decide cuál pintar según el idioma de la petición, igual que
 * hace `findOrderWithItems` al leer un pedido concreto.
 */
const findOrdersByUserId = (userId: number) => {
  const userOrders = db
    .select(orderProjection)
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .all();

  if (userOrders.length === 0) {
    return [];
  }

  const orderIds = userOrders.map((o) => o.id);
  const items = db
    .select(orderItemProjection)
    .from(orderItems)
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(asc(orderItems.id))
    .all();

  return userOrders.map((order) => ({
    order,
    items: items.filter((item) => item.orderId === order.id),
  }));
};

/**
 * Obtiene todos los pedidos para el panel de admin, con info del usuario e items.
 *
 * Opcionalmente filtra por status. Ordenados por createdAt DESC.
 *
 * **Incluye JOIN a `users` para el email** y JOIN a `order_items` + `dishes` para los items.
 * Los nombres de platos vienen en los 3 idiomas igual que en `findOrdersByUserId`.
 */
const findAllOrdersForAdmin = (status?: string) => {
  const whereClause =
    status !== undefined ? and(eq(orders.status, status as 'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled')) : undefined;

  const allOrders = db
    .select({
      ...orderProjection,
      userEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .all();

  if (allOrders.length === 0) {
    return [];
  }

  const orderIds = allOrders.map((o) => o.id);
  const items = db
    .select(orderItemProjection)
    .from(orderItems)
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(asc(orderItems.id))
    .all();

  return allOrders.map((order) => ({
    order,
    items: items.filter((item) => item.orderId === order.id),
  }));
};

/**
 * Actualiza el estado de un pedido.
 *
 * Devuelve el pedido actualizado con sus items, o `undefined` si no existe.
 */
const updateOrderStatus = (
  id: number,
  status: 'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled',
) => {
  const result = db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .run();

  if (result.changes === 0) {
    return undefined;
  }

  const order = db
    .select(orderProjection)
    .from(orders)
    .where(eq(orders.id, id))
    .get();

  if (order === undefined) {
    return undefined;
  }

  const items = db
    .select(orderItemProjection)
    .from(orderItems)
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id))
    .all();

  return { order, items };
};

export { findOrderWithItems, findOrderWithItemsForUser, findOrderableDishesByIds, insertOrderWithItems, findOrdersByUserId, findAllOrdersForAdmin, updateOrderStatus };

export type OrderableDishRow = ReturnType<
  typeof findOrderableDishesByIds
>[number];
export type OrderRow = NonNullable<
  ReturnType<typeof findOrderWithItems>
>['order'];
export type OrderItemRow = NonNullable<
  ReturnType<typeof findOrderWithItems>
>['items'][number];
export type UserOrderRow = NonNullable<
  ReturnType<typeof findOrdersByUserId>
>[number];
export type AdminOrderRow = NonNullable<
  ReturnType<typeof findAllOrdersForAdmin>
>[number];
