import { apiRequest } from './client';
import type {
  ApiOrderEnvelope,
  ApiOrdersListEnvelope,
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
 * Lista los pedidos del usuario autenticado, ordenados por `created_at` descendente.
 *
 * El backend devuelve `{ language, orders }`, donde cada pedido trae sus líneas con el
 * nombre del plato ya localizado al idioma de la petición.
 */
export const listOrders = async (): Promise<ApiOrdersListEnvelope> =>
  (await apiRequest('/api/orders')) as ApiOrdersListEnvelope;
