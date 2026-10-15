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
): Promise<ApiOrderEnvelope> =>
  (await apiRequest('/api/orders', {
    method: 'POST',
    body: { items, customerNote },
  })) as ApiOrderEnvelope;

/**
 * Crea un pedido como invitado (sin autenticación).
 *
 * El backend genera un trackingToken (UUID v4) que permite consultar el pedido
 * sin autenticación. Devuelve `{ language, order }` con el trackingToken.
 */
export const createGuestOrder = async (body: {
  items: { dishId: number; quantity: number }[];
  customerNote?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  deliveryAddress: string;
}): Promise<ApiOrderEnvelope> =>
  (await apiRequest('/api/orders/guest', {
    method: 'POST',
    body,
  })) as ApiOrderEnvelope;

/**
 * Lista los pedidos del usuario autenticado, ordenados por `created_at` descendente.
 *
 * El backend devuelve `{ language, orders }`, donde cada pedido trae sus líneas con el
 * nombre del plato ya localizado al idioma de la petición.
 */
export const listOrders = async (): Promise<ApiOrdersListEnvelope> =>
  (await apiRequest('/api/orders')) as ApiOrdersListEnvelope;

/**
 * Devuelve el detalle de un pedido concreto del usuario autenticado.
 *
 * El backend responde 404 si el pedido no existe o no pertenece al usuario del token,
 * sin revelar cuál de los dos es.
 */
export const fetchOrderById = async (
  orderId: number,
): Promise<ApiOrderEnvelope> =>
  (await apiRequest(`/api/orders/${orderId}`)) as ApiOrderEnvelope;

/**
 * Consulta un pedido por trackingToken (para invitados, sin autenticación).
 *
 * Devuelve `{ language, order, contactEmail }` o 404 si no existe.
 */
export const fetchOrderByToken = async (
  token: string,
): Promise<ApiOrderEnvelope & { contactEmail?: string }> =>
  (await apiRequest(`/api/orders/track/${encodeURIComponent(token)}`)) as ApiOrderEnvelope & { contactEmail?: string };

/**
 * Lista todos los pedidos (solo admin).
 *
 * Query opcional: `?status=pending|preparing|sent|delivered|cancelled`
 * Devuelve array de `ApiAdminOrder` (con userEmail, sin envoltorio language).
 */
export const listAdminOrders = async (
  status?: string,
): Promise<ApiAdminOrder[]> => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return (await apiRequest(`/api/admin/orders${query}`)) as ApiAdminOrder[];
};

/**
 * Devuelve el detalle de un pedido (solo admin).
 *
 * El backend devuelve el pedido con userEmail, items localizados, etc.
 */
export const fetchAdminOrderById = async (
  orderId: number,
): Promise<ApiAdminOrder> =>
  (await apiRequest(`/api/admin/orders/${orderId}`)) as ApiAdminOrder;

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
): Promise<ApiAdminOrder> =>
  (await apiRequest(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status },
  })) as ApiAdminOrder;
