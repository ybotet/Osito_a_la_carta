import {
  findOrderWithItems,
  findOrderWithItemsForUser,
  findOrderableDishesByIds,
  findOrdersByUserId,
  insertOrderWithItems,
} from './orders.repository.js';
import type { OrderItemRow, OrderRow } from './orders.repository.js';
import { BadRequestError, NotFoundError } from '../../shared/errors.js';
import type { Language } from '../../shared/language.js';
import { resolveLanguage } from '../../shared/language.js';
import { orderEnvelopeSchema, ordersListEnvelopeSchema } from './orders.schema.js';
import type { CreateOrderBody } from './orders.schema.js';

/**
 * Redondea a céntimos. El precio viene de SQLite por `real`, así que es coma flotante:
 * sin redondear, 3 unidades de 11,90 darían 35.700000000000003 como total, y ese número
 * es el que se cobra, el que ve el chef en el correo (T-062) y el que se compara con el
 * total del carrito. Es el mismo criterio que el `selectTotalPrice` de T-050, que redondea
 * por el mismo motivo, y conviene que los dos coincidan: si no, el cliente ve un total y
 * se le cobra otro.
 */
const roundToCents = (value: number): number => Math.round(value * 100) / 100;

const localize = (row: OrderItemRow, language: Language) => {
  switch (language) {
    case 'ru':
      return row.nameRu;
    case 'en':
      return row.nameEn;
    case 'es':
      return row.nameEs;
  }
};

const toResponse = (
  order: OrderRow,
  items: OrderItemRow[],
  language: Language,
) => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  total: order.total,
  customerNote: order.customerNote,
  createdAt: order.createdAt,
  items: items.map((item) => ({
    dishId: item.dishId,
    name: localize(item, language),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
});

/**
 * Crea un pedido: valida que los platos estén disponibles, calcula el total con los
 * precios **actuales** y escribe el pedido y sus líneas en una transacción.
 *
 * **El precio lo pone el servidor, nunca el cliente.** El body solo trae `{ dishId,
 * quantity }` (igual que decidió T-050 para el carrito) y `unitPrice` sale de
 * `dishes.price` en el momento de la llamada. Es lo que SPEC §6 llama "precio al momento
 * del pedido" y es lo que hace que el `price` guardado en el carrito no tenga valor de
 * verdad: si el chef cambia un precio entre que el usuario añade y confirma, se cobra el
 * nuevo.
 *
 * **Un plato que no existe o está deshabilitado es 400 `DISH_UNAVAILABLE`, no 404.** Es
 * deliberado y es lo contrario que hace T-021 con `GET /api/dishes/:id`, donde un plato
 * retirado responde 404 para no revelar qué hubo. Aquí la diferencia es que el cliente
 * **ya tiene el plato en el carrito y necesita saber cuál quitar**: si el 404 fuera por
 * plato, un pedido con tres platos y uno retired tendría que fallar entero y el usuario
 * no sabría cuál es. Por eso se responde con la lista de los ids que no están
 * disponibles, y el mensaje no distingue entre "no existe" y "deshabilitado", que es
 * además la misma información que da la lista de ids que faltan.
 *
 * **El total se calcula con una sola consulta de precios**, no plato a plato: así todos
 * los `unitPrice` de un pedido salen del mismo instante. Y se redondea a céntimos, con el
 * mismo criterio que el total del carrito (T-050), para que lo que ve el usuario y lo que
 * se cobra coincidan.
 *
 * **La escritura entera va en `db.transaction` (dentro del repositorio)**: o entra el
 * pedido con todas sus líneas, o no entra nada. Un pedido sin líneas sería inservible y
 * además dejaría un total que no corresponde a nada.
 *
 * Devuelve `{ language, order }` con el pedido ya leído de la base y localizado al idioma
 * de la petición, que es la convención que MEMORY fijó para toda respuesta con contenido
 * traducible. Los nombres salen de un JOIN a `dishes`, que no puede quedar colgando: el
 * purgado de T-029b devuelve 409 si el plato tiene `order_items`.
 */
/**
 * Lista los pedidos del usuario autenticado, con sus líneas ya localizadas.
 *
 * **Solo devuelve los pedidos del `userId` que recibe.** El ownership lo resuelve el
 * repositorio con `WHERE orders.user_id = ?`, no el servicio: así no hay forma de que un
 * cambio en la consulta devuelva pedidos de otro usuario sin que el servicio se entere.
 *
 * El orden es `created_at DESC`, que es lo que pide el criterio: los pedidos más nuevos
 * salen primero, que es lo que espera el usuario en un historial.
 *
 * Devuelve `{ language, orders }`, el mismo envoltorio que usa `createOrder` para la
 * respuesta de un pedido concreto. Los nombres de los platos se resuelven con la misma
 * función `localize` y el mismo idioma de la petición.
 */
const listOrders = (userId: number, acceptLanguage: string | undefined) => {
  const language = resolveLanguage(acceptLanguage);
  const ordersData = findOrdersByUserId(userId);

  return ordersListEnvelopeSchema.parse({
    language,
    orders: ordersData.map(({ order, items }) =>
      toResponse(order, items, language),
    ),
  });
};

/**
 * Devuelve un pedido concreto del usuario autenticado.
 *
 * **El ownership lo resuelve el repositorio con `WHERE orders.id = ? AND orders.user_id = ?`,
 * no el servicio.** Así no hay forma de que un cambio en la consulta devuelva un pedido de
 * otro usuario sin que el servicio se entere.
 *
 * Si el pedido no existe o no es del usuario, devuelve `undefined` y la ruta responde 404:
 * no se revela si el pedido existe o no, igual que hace T-021 con `GET /api/dishes/:id`.
 *
 * Devuelve `{ language, order }`, el mismo envoltorio que `createOrder` para la respuesta
 * de un pedido concreto. Los nombres de los platos se resuelven con la misma función
 * `localize` y el mismo idioma de la petición.
 */
const getOrderById = (userId: number, orderId: number, acceptLanguage: string | undefined) => {
  const reloaded = findOrderWithItemsForUser(orderId, userId);

  if (reloaded === undefined) {
    return undefined;
  }

  const language = resolveLanguage(acceptLanguage);

  return orderEnvelopeSchema.parse({
    language,
    order: toResponse(reloaded.order, reloaded.items, language),
  });
};

const createOrder = (
  userId: number,
  body: CreateOrderBody,
  acceptLanguage: string | undefined,
) => {
  const requestedIds = body.items.map((item) => item.dishId);
  const available = findOrderableDishesByIds(requestedIds);
  const priceByDishId = new Map(available.map((dish) => [dish.id, dish.price]));

  // Los ids que no vienen en `available` son los que no existen o están deshabilitados. Se
  // compara con la lista pedida y no con `available.length` para poder decir **cuáles**
  // son: el 404 de "el pedido entero no vale" no le sirve de nada a quien tiene el
  // carrito lleno.
  const unavailableIds = requestedIds.filter((id) => !priceByDishId.has(id));

  if (unavailableIds.length > 0) {
    throw new BadRequestError(
      'Uno o varios platos ya no estan disponibles',
      'DISH_UNAVAILABLE',
      { dishIds: unavailableIds },
    );
  }

  const items = body.items.map((item) => ({
    dishId: item.dishId,
    quantity: item.quantity,
    // `unavailableIds` ya garantiza que el precio existe para todo id pedido, y el
    // `refine` del schema garantiza que no hay repetidos. El `?? 0` está para que el
    // compilador no exija una aserción: si algún día se llegara aquí sin precio, la
    // línea valdría 0 y el total no cuadraría, en vez de romperse al leer.
    unitPrice: priceByDishId.get(item.dishId) ?? 0,
  }));

  const total = roundToCents(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );

  const created = insertOrderWithItems({
    userId,
    total,
    // Una nota vacía o de solo espacios se guarda como `NULL` y no como `''`: la
    // columna es nullable y `NULL` significa "no dijo nada" sin ambigüedad, mientras que
    // una cadena vacía haría que el frontend tuviera que distinguir dos cosas iguales.
    customerNote:
      body.customerNote === undefined || body.customerNote.length === 0
        ? null
        : body.customerNote,
    items,
  });

  const reloaded = findOrderWithItems(created.id);

  if (reloaded === undefined) {
    throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND', {
      id: created.id,
    });
  }

  const language = resolveLanguage(acceptLanguage);

  return orderEnvelopeSchema.parse({
    language,
    order: toResponse(reloaded.order, reloaded.items, language),
  });
};

export { createOrder, listOrders, getOrderById };

export type CreateOrderResult = ReturnType<typeof createOrder>;
export type ListOrdersResult = ReturnType<typeof listOrders>;
export type GetOrderByIdResult = ReturnType<typeof getOrderById>;
