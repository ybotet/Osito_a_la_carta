import { apiRequest } from './client';
import type { ApiAuthUser } from './auth.types.js';

/**
 * Lista todos los usuarios (solo admin).
 *
 * El backend responde 401 sin token y 403 con token de cliente.
 * Devuelve un array de `ApiAuthUser` (sin `passwordHash`).
 */
export const listAdminUsers = async (
  options?: { silent?: boolean },
): Promise<ApiAuthUser[]> =>
  (await apiRequest('/api/admin/users', {
    silent: options?.silent,
  })) as ApiAuthUser[];
