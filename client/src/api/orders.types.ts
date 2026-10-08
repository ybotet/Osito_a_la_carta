/**
 * Forma de la respuesta de `POST /api/orders`, tal y como la devuelve el backend.
 *
 * El backend manda el envoltorio `{ language, order }` y `language` es el idioma con el
 * que resolvió la petición. El item trae `name` ya localizado, no las tres columnas.
 */
export type ApiOrderItem = {
  dishId: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ApiOrder = {
  id: number;
  userId: number;
  status: string;
  total: number;
  customerNote: string | null;
  createdAt: number;
  items: ApiOrderItem[];
};

export type ApiOrderEnvelope = {
  language: string;
  order: ApiOrder;
};

export type ApiOrdersListEnvelope = {
  language: string;
  orders: ApiOrder[];
};

/**
 * Pedido en la respuesta de admin (GET /api/admin/orders).
 * Incluye userEmail y no viene envuelto en { language, orders }.
 */
export type ApiAdminOrder = ApiOrder & {
  userEmail: string;
};
