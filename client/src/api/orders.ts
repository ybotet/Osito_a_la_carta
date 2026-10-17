import { apiRequest } from './client';
import type {
  ApiOrderEnvelope,
  ApiOrdersListEnvelope,
  ApiAdminOrder,
} from './orders.types.js';

/**
 * Crea un pedido con los items del carrito.
 *
 * El backend valida disponibilidad, calcula el total con los precios actuales y escribe
 * el pedido y sus líneas en una transacción. Devuelve el pedido ya leído de la base,
 * con los nombres de los platos localizados al idioma de la petición.
 */
export const createOrder = async (
  items: { dishId: number; quantity: number }[],
  customerNote?: string,
  options?: { silent?: boolean },
): Promise<ApiOrderEnvelope> =>
  (await apiRequest('/api/orders', {
    method: 'POST',
    body: { items, customerNote },
    silent: options?.silent,
  })) as ApiOrderEnvelope;

/**
 * Crea un pedido como invitado (sin autenticación).
 *
 * El backend genera un trackingToken (UUID v4) que permite consultar el pedido
 * sin autenticación. Devuelve `{ language, order }` con el trackingToken.
 */
export const createGuestOrder = async (
  body: {
    items: { dishId: number; quantity: number }[];
    customerNote?: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    deliveryAddress: string;
  },
  options?: { silent?: boolean },
): Promise<ApiOrderEnvelope> =>
  (await apiRequest('/api/orders/guest', {
    method: 'POST',
    body,
    silent: options?.silent,
  })) as ApiOrderEnvelope;

/**
 * Lista los pedidos del usuario autenticado, ordenados por `created_at` descendente.
 *
 * El backend devuelve `{ language, orders }`, donde cada pedido trae sus líneas con el
 * nombre del plato ya localizado al idioma de la petición.
 */
export const listOrders = async (
  options?: { silent?: boolean },
): Promise<ApiOrdersListEnvelope> =>
  (await apiRequest('/api/orders', {
    silent: options?.silent,
  })) as ApiOrdersListEnvelope;

/**
 * Devuelve el detalle de un pedido concreto del usuario autenticado.
 *
 * El backend responde 404 si el pedido no existe o no pertenece al usuario del token,
 * sin revelar cuál de los dos es.
 */
export const fetchOrderById = async (
  orderId: number,
  options?: { silent?: boolean },
): Promise<ApiOrderEnvelope> =>
  (await apiRequest(`/api/orders/${orderId}`, {
    silent: options?.silent,
  })) as ApiOrderEnvelope;

/**
 * Consulta un pedido por trackingToken (para invitados, sin autenticación).
 *
 * Devuelve `{ language, order, contactEmail }` o 404 si no existe.
 */
export const fetchOrderByToken = async (
  token: string,
  options?: { silent?: boolean },
): Promise<ApiOrderEnvelope & { contactEmail?: string }> =>
  (await apiRequest(`/api/orders/track/${encodeURIComponent(token)}`, {
    silent: options?.silent,
  })) as ApiOrderEnvelope & { contactEmail?: string };

/**
 * Lista todos los pedidos (solo admin).
 *
 * Query opcional: `?status=pending|preparing|sent|delivered|cancelled`
 * Devuelve array de `ApiAdminOrder` (con userEmail, sin envoltorio language).
 */
export const listAdminOrders = async (
  status?: string,
  options?: { silent?: boolean },
): Promise<ApiAdminOrder[]> => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return (await apiRequest(`/api/admin/orders${query}`, {
    silent: options?.silent,
  })) as ApiAdminOrder[];
};

/**
 * Devuelve el detalle de un pedido (solo admin).
 *
 * El backend devuelve el pedido con userEmail, items localizados, etc.
 */
export const fetchAdminOrderById = async (
  orderId: number,
  options?: { silent?: boolean },
): Promise<ApiAdminOrder> =>
  (await apiRequest(`/api/admin/orders/${orderId}`, {
    silent: options?.silent,
  })) as ApiAdminOrder;

/**
 * Actualiza el estado de un pedido (solo admin).
 *
 * Body: { status: 'pending'|'preparing'|'sent'|'delivered'|'cancelled' }
 * Valida transiciones permitidas en el backend.
 * Devuelve el pedido actualizado.
 */
export const updateAdminOrderStatus = async (
  orderId: number,
  status: string,
  options?: { silent?: boolean },
): Promise<ApiAdminOrder> =>
  (await apiRequest(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status },
    silent: options?.silent,
  })) as ApiAdminOrder;
