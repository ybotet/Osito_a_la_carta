import { z } from 'zod';

/**
 * Límite de la nota del cliente. Lo fija el enunciado de T-051 y vive en una constante
 * (y no en el `.max()` suelto) porque es el mismo número que hay que citar en el mensaje
 * de error: si mañana cambia, el mensaje y la validación cambian juntos.
 */
const MAX_CUSTOMER_NOTE_LENGTH = 500;

const ORDER_STATUSES = [
  'pending',
  'preparing',
  'sent',
  'delivered',
  'cancelled',
] as const;

/**
 * Una línea del pedido que manda el cliente: **solo el id del plato y la cantidad**, nunca
 * el precio. El precio lo pone el servidor con el valor que hay en `dishes.price` en el
 * momento del pedido, que es lo que SPEC §6 llama `unitPrice` ("precio al momento del
 * pedido"). Aceptar el precio del body dejaría que el cliente dijera cuánto paga.
 *
 * **`dishId` y `quantity` son `z.number()` sin `coerce`, a diferencia del `:id` de las
 * rutas de recurso.** Ahí el `coerce` tiene sentido porque el valor llega de la URL, que
 * siempre es texto; aquí llega de un JSON que el propio frontend construye con números. Un
 * `coerce` en este punto aceptaría `"3"` y también `true` (que en JS es 1), y un carrito
 * con un tipo equivocado pasaría por el filtro en vez de rechazarse en el borde.
 */
const orderItemInputSchema = z.object({
  dishId: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

/**
 * Body de `POST /api/orders`.
 *
 * **`items` no admite el mismo plato dos veces.** El carrito de T-050 garantiza una línea
 * por plato (`addItem` sube la cantidad en vez de añadir línea), así que un duplicado
 * solo puede venir de un cliente escrito a mano. Se rechaza en vez de fusionar porque
 * fusionar en silencio haría que el pedido se guardara con un desglose distinto del que
 * el cliente calculó, sin que nadie se entere: es mejor un 400 explícito.
 *
 * **`status` y `total` no están en el schema, y es la misma decisión de seguridad que en
 * T-022 con `isAvailable`:** quien pide no decide en qué estado entra el pedido ni cuánto
 * cuesta. Zod descarta las claves desconocidas, así que `{"status": "delivered"}` se
 * ignora en lugar de aceptarse.
 */
const createOrderBodySchema = z.object({
  items: z
    .array(orderItemInputSchema)
    .min(1, { message: 'El pedido debe tener al menos un plato' })
    .refine(
      (items) =>
        new Set(items.map((item) => item.dishId)).size === items.length,
      { message: 'No se puede repetir el mismo plato en un pedido' },
    ),
  customerNote: z
    .string()
    .trim()
    .max(MAX_CUSTOMER_NOTE_LENGTH, {
      message: `La nota no puede superar los ${MAX_CUSTOMER_NOTE_LENGTH} caracteres`,
    })
    .optional(),
});

/**
 * Una línea del pedido **tal como la ve el cliente**, con el nombre del plato ya resuelto
 * al idioma de la petición.
 *
 * El nombre no está en `order_items` (SPEC §6 solo guarda `dishId`, `quantity` y
 * `unitPrice`): se saca con un JOIN a `dishes` en el momento de leer. Es correcto porque
 * el plato no se borra nunca de verdad mientras tenga historial (T-029b devuelve 409
 * `DISH_HAS_HISTORY` si tiene `order_items`), así que el JOIN nunca queda colgando.
 *
 * **No lleva `imageUrl`.** `order_items` tampoco la guarda y el enunciado de T-051 no la
 * pide: si algún día el detalle del pedido (T-055) la quiere, se añade al SELECT y a este
 * schema, composing la URL con `PUBLIC_ORIGIN` como hace el módulo de platos. Meterla
 * ahora sería un campo más que mantener sincronizado sin que nadie lo use.
 */
const orderItemSchema = z.object({
  dishId: z.number().int(),
  name: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number(),
});

/**
 * El pedido completo. `customerNote` es `null` y no `undefined` cuando no hay nota,
 * porque es lo que guarda la columna y evita que el cliente tenga que distinguir "sin
 * nota" de "no me lo han mandado".
 *
 * `total` es la suma ya redondeada a céntimos de `quantity * unitPrice` de cada línea, con
 * los precios del momento del pedido: es el número que hay que cobrar y el que pintará
 * T-054 y T-055.
 */
const orderSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  status: z.enum(ORDER_STATUSES),
  total: z.number(),
  customerNote: z.string().nullable(),
  createdAt: z.number().int(),
  items: z.array(orderItemSchema),
});

/**
 * Envoltura de la lista de pedidos, con el idioma resuelto al lado.
 *
 * Sigue el mismo patrón que `orderEnvelopeSchema` y la decisión de MEMORY de que las
 * respuestas con contenido localizable incluyan el idioma. Así el cliente sabe con qué
 * idioma se resolvieron los nombres de los platos y no tiene que reparsear el header.
 */
const ordersListEnvelopeSchema = z.object({
  language: z.enum(['es', 'ru', 'en']),
  orders: z.array(orderSchema),
});

/**
 * Envoltura del pedido, con el idioma resuelto al lado.
 *
 * Se une a `language` por el mismo motivo que en T-020, T-021 y T-025: los nombres de los
 * platos dependen del idioma de la petición, así que sin decir cuál se resolvió el
 * cliente no puede saber si lo que tiene delante es la traducción o el original. Es además
 * la convención que MEMORY ya fijó para que la API no tenga dos formas de lo mismo.
 */
const orderEnvelopeSchema = z.object({
  language: z.enum(['es', 'ru', 'en']),
  order: orderSchema,
});

export {
  MAX_CUSTOMER_NOTE_LENGTH,
  ORDER_STATUSES,
  createOrderBodySchema,
  orderEnvelopeSchema,
  ordersListEnvelopeSchema,
  orderItemInputSchema,
  orderItemSchema,
  orderSchema,
};

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderEnvelope = z.infer<typeof orderEnvelopeSchema>;
export type OrdersListEnvelope = z.infer<typeof ordersListEnvelopeSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
