import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/index.js';
import { accessClaimsSchema } from '../auth/auth.schema.js';
import { recordPageView, getUserStatsData } from './stats.service.js';
import { pageViewBodySchema } from './stats.schema.js';

const statsRouter = Router();

/**
 * POST /api/stats/pageview
 *
 * Endpoint público para registrar una visita a página.
 * Si hay access token válido, registra el userId; si no, userId = null.
 * Body: { dishId?: number, path: string }
 * Responde 204 sin body.
 */
statsRouter.post('/stats/pageview', (req, res) => {
  // Intentar leer el usuario si hay token, pero no fallar si no hay
  let userId: number | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const BEARER_SCHEME = 'bearer ';
    if (raw.toLowerCase().startsWith(BEARER_SCHEME)) {
      const token = raw.slice(BEARER_SCHEME.length).trim();
      if (token.length > 0) {
        // Intentar verificar el token sin lanzar error
        try {
          const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
          const claims = accessClaimsSchema.safeParse(payload);
          if (claims.success) {
            const id = Number(claims.data.sub);
            if (Number.isInteger(id) && id > 0) {
              userId = id;
            }
          }
        } catch {
          // Token inválido: ignorar, userId queda null
        }
      }
    }
  }

  const body = pageViewBodySchema.parse(req.body);
  recordPageView(userId, body);
  res.status(204).end();
});

/**
 * GET /api/stats/me
 *
 * Estadísticas agregadas del usuario autenticado.
 * Requiere access token válido (requireAuth).
 * Devuelve: topViewedDishes, topOrderedDishes, totalOrders, totalSpent, memberSince.
 */
statsRouter.get('/stats/me', requireAuth, (req, res) => {
  const user = req.user;

  if (user === undefined) {
    // No debería ocurrir porque requireAuth ya valida, pero por tipado
    throw new Error('Usuario no encontrado en request');
  }

  const stats = getUserStatsData(user.id, req.headers['accept-language'] as string | undefined);
  res.status(200).json(stats);
});

export { statsRouter };

export default statsRouter;