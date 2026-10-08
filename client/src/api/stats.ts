import { apiRequest } from './client.js';

/**
 * Registra una visita a página (pageview).
 *
 * Endpoint público: no requiere autenticación, pero si hay sesión la adjunta
 * automáticamente mediante `apiRequest`. `dishId` es opcional.
 * Responde 204 sin body.
 */
export const recordPageView = async (
  dishId: number | undefined,
  path: string,
): Promise<void> => {
  await apiRequest('/api/stats/pageview', {
    method: 'POST',
    body: JSON.stringify({ dishId, path }),
  });
};

/**
 * Obtiene las estadísticas del usuario autenticado.
 *
 * Requiere autenticación. Devuelve:
 * - topViewedDishes: top 5 platos más vistos
 * - topOrderedDishes: top 5 platos más pedidos
 * - totalOrders: total de pedidos
 * - totalSpent: total gastado
 * - memberSince: fecha de registro en ISO string
 */
export const fetchStats = async (): Promise<{
  topViewedDishes: Array<{ dishId: number; name: string; views: number }>;
  topOrderedDishes: Array<{ dishId: number; name: string; count: number }>;
  totalOrders: number;
  totalSpent: number;
  memberSince: string;
}> => {
  const response = await apiRequest('/api/stats/me', { method: 'GET' });
  return response as {
    topViewedDishes: Array<{ dishId: number; name: string; views: number }>;
    topOrderedDishes: Array<{ dishId: number; name: string; count: number }>;
    totalOrders: number;
    totalSpent: number;
    memberSince: string;
  };
};