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