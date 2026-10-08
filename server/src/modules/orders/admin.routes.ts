import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { BadRequestError } from '../../shared/errors.js';
import { readAcceptLanguage } from '../../shared/http.js';
import { listAdminOrders } from './orders.service.js';

const adminOrdersRouter = Router();

/**
 * GET /api/admin/orders
 *
 * Lista todos los pedidos (solo admin).
 * Requiere rol admin (requireAdmin = requireAuth + adminOnly).
 * Query opcional: ?status=pending|preparing|sent|delivered|cancelled
 * Responde 200 con array de pedidos con userEmail, items localizados, ordenados por createdAt DESC.
 */
adminOrdersRouter.get('/admin/orders', requireAdmin, (req, res) => {
  const status = req.query.status as string | undefined;
  const validStatuses = ['pending', 'preparing', 'sent', 'delivered', 'cancelled'] as const;

  if (status !== undefined && !validStatuses.includes(status as typeof validStatuses[number])) {
    throw new BadRequestError(
      'Status inválido',
      'VALIDATION_ERROR',
      { validStatuses },
    );
  }

  const orders = listAdminOrders(readAcceptLanguage(req), status);
  res.status(200).json(orders);
});

export { adminOrdersRouter };

export default adminOrdersRouter;