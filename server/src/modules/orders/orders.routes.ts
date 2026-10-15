import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../../shared/errors.js';
import { readAcceptLanguage } from '../../shared/http.js';
import { createOrder, createGuestOrder, getOrderById, listOrders, getOrderByTrackingToken } from './orders.service.js';
import { createOrderBodySchema, createGuestOrderBodySchema } from './orders.schema.js';

const ordersRouter = Router();

/**
 * Alta de pedido para usuario autenticado. **Protegida con `requireAuth`**.
 */
ordersRouter.post('/orders', requireAuth, (req, res) => {
  const body = createOrderBodySchema.parse(req.body);
  const user = req.user;

  if (user === undefined) {
    throw new UnauthorizedError(
      'Se requiere un access token valido',
      'UNAUTHORIZED',
    );
  }

  res.status(201).json(createOrder(user.id, body, readAcceptLanguage(req), user.email));
});

/**
 * Alta de pedido para invitado (sin autenticación).
 *
 * Requiere: items, guestName, guestPhone, guestEmail, deliveryAddress.
 * Opcional: customerNote.
 * Genera un trackingToken (UUID) para que el invitado pueda consultar su pedido.
 * Devuelve 201 con `{ language, order }` incluyendo el trackingToken.
 */
ordersRouter.post('/orders/guest', (req, res) => {
  const body = createGuestOrderBodySchema.parse(req.body);
  res.status(201).json(createGuestOrder(body, readAcceptLanguage(req)));
});

/**
 * Historial del usuario autenticado. **Protegida con `requireAuth`**.
 */
ordersRouter.get('/orders', requireAuth, (req, res) => {
  const user = req.user;

  if (user === undefined) {
    throw new UnauthorizedError(
      'Se requiere un access token valido',
      'UNAUTHORIZED',
    );
  }

  res.status(200).json(listOrders(user.id, readAcceptLanguage(req)));
});

/**
 * Consulta de pedido por trackingToken (para invitados, sin auth).
 *
 * GET /api/orders/track/:token
 * Debe ir antes de GET /orders/:id para evitar que Express la trate como un id.
 * Devuelve 200 con `{ language, order, contactEmail }` o 404 si no existe.
 */
ordersRouter.get('/orders/track/:token', (req, res) => {
  const token = req.params.token;

  if (!token || token.length !== 36) {
    throw new BadRequestError(
      'Token de seguimiento inválido',
      'VALIDATION_ERROR',
    );
  }

  const order = getOrderByTrackingToken(token, readAcceptLanguage(req));

  if (order === undefined) {
    throw new NotFoundError('edido no encontrado', 'ORDER_NOT_FOUND', { token });
  }

  res.status(200).json(order);
});

/**
 * Detalle de un pedido concreto para usuario autenticado.
 */
ordersRouter.get('/orders/:id', requireAuth, (req, res) => {
  const user = req.user;
  const rawId = req.params.id;
  const orderId = Number(rawId);

  if (user === undefined) {
    throw new UnauthorizedError(
      'Se requiere un access token valido',
      'UNAUTHORIZED',
    );
  }

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new BadRequestError(
      'El id del pedido debe ser un entero positivo',
      'VALIDATION_ERROR',
    );
  }

  const order = getOrderById(user.id, orderId, readAcceptLanguage(req));

  if (order === undefined) {
    throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND', {
      id: orderId,
    });
  }

res.status(200).json(order);
});

export { ordersRouter };

export default ordersRouter;
