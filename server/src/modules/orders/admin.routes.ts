import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../../shared/errors.js';
import { readAcceptLanguage } from '../../shared/http.js';
import { listAdminOrders, updateOrderStatusAdmin, getAdminOrderById } from './orders.service.js';

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

/**
 * GET /api/admin/orders/:id
 *
 * Obtiene el detalle de un pedido específico (solo admin).
 * Devuelve el pedido con userEmail, items localizados, etc.
 */
adminOrdersRouter.get('/admin/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError(
      'ID de pedido inválido',
      'VALIDATION_ERROR',
      { id: req.params.id },
    );
  }

  const order = getAdminOrderById(id, readAcceptLanguage(req));

  if (order === undefined) {
    throw new NotFoundError('Pedido no encontrado', 'ORDER_NOT_FOUND', { id });
  }

  res.status(200).json(order);
});

/**
 * PATCH /api/admin/orders/:id/status
 *
 * Actualiza el estado de un pedido (solo admin).
 * Body: { status: 'pending'|'preparing'|'sent'|'delivered'|'cancelled' }
 * Valida transiciones permitidas:
 *   pending → preparing | cancelled
 *   preparing → sent | cancelled
 *   sent → delivered | cancelled
 *   delivered → (final)
 *   cancelled → (final)
 * Si la transición es inválida: 400 con code 'INVALID_TRANSITION'.
 * Devuelve el pedido actualizado.
 */
adminOrdersRouter.patch('/admin/orders/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError(
      'ID de pedido inválido',
      'VALIDATION_ERROR',
      { id: req.params.id },
    );
  }

  const { status } = req.body as { status?: string };

  if (status === undefined) {
    throw new BadRequestError(
      'Falta el campo status',
      'VALIDATION_ERROR',
      { status },
    );
  }

  const order = updateOrderStatusAdmin(id, status, readAcceptLanguage(req));
  res.status(200).json(order);
});

export { adminOrdersRouter };

export default adminOrdersRouter;