import { insertPageView, getTopViewedDishes, getTopOrderedDishes, getUserStats } from './stats.repository.js';
import { pageViewBodySchema, type PageViewBody } from './stats.schema.js';
import { BadRequestError } from '../../shared/errors.js';
import { resolveLanguage } from '../../shared/language.js';
import type { Language } from '../../shared/language.js';

/**
 * Registra una página vista.
 *
 * Endpoint público: no requiere autenticación, pero si hay sesión válida
 * registra el `userId` del usuario. `dishId` es opcional.
 * Devuelve 204 sin body.
 */
const recordPageView = (
  userId: number | null,
  body: PageViewBody,
): void => {
  const parsed = pageViewBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestError(
      'Body inválido',
      'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors,
    );
  }

  const { dishId, path } = parsed.data;

  insertPageView({
    userId,
    dishId: dishId ?? null,
    path,
    viewedAt: Math.floor(Date.now() / 1000),
  });
};

/**
 * Obtiene las estadísticas agregadas del usuario autenticado.
 *
 * Requiere autenticación. Devuelve:
 * - topViewedDishes: top 5 platos más vistos
 * - topOrderedDishes: top 5 platos más pedidos
 * - totalOrders: total de pedidos
 * - totalSpent: total gastado
 * - memberSince: fecha de registro en ISO string
 */
const getUserStatsData = (
  userId: number,
  acceptLanguage: string | undefined,
) => {
  const language = resolveLanguage(acceptLanguage) as Language;

  const topViewedDishes = getTopViewedDishes(userId, language).map((d) => ({
    dishId: d.dishId ?? 0,
    name: d.name,
    views: d.views,
  }));

  const topOrderedDishes = getTopOrderedDishes(userId, language).map((d) => ({
    dishId: d.dishId ?? 0,
    name: d.name,
    count: Number(d.count ?? 0),
  }));

  const { totalOrders, totalSpent, memberSince } = getUserStats(userId);

  return {
    topViewedDishes,
    topOrderedDishes,
    totalOrders,
    totalSpent: Math.round((Number(totalSpent ?? 0) * 100)) / 100,
    memberSince: new Date(memberSince * 1000).toISOString(),
  };
};

export { recordPageView, getUserStatsData };