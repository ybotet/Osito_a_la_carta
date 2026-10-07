import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { UnauthorizedError } from '../../shared/errors.js';
import { readAcceptLanguage } from '../../shared/http.js';
import { createOrder, listOrders } from './orders.service.js';
import { createOrderBodySchema } from './orders.schema.js';

const ordersRouter = Router();

/**
 * Alta de pedido. **Protegida con `requireAuth`**: es la primera escritura del API que
 * pertenece a un cliente y no a un admin, y el `userId` sale del token, nunca del body.
 * Sin sesión, 401 `UNAUTHORIZED`; con un access caducado, también (y es el 401 que T-046
 * sabe renovar, porque lleva su `code`).
 *
 * **201 con el pedido completo ya localizado** (`{ language, order }`), y no solo el id:
 * el frontend acaba de crear esto y tiene que pintar la confirmación y el detalle sin
 * tener que hacer una segunda llamada. Es el mismo motivo por el que `POST /api/dishes` y
 * `POST /api/categories` devuelven la entidad creada y no su identificador.
 *
 * **No dispara notificaciones todavía:** eso es T-063, que colgará de este servicio. Aquí
 * no hay ninguna dependencia de Mailgun ni de Telegram, y por eso el endpoint responde lo
 * mismo aunque esas variables no estén configuradas.
 */
ordersRouter.post('/orders', requireAuth, (req, res) => {
  const body = createOrderBodySchema.parse(req.body);
  // `requireAuth` ha dejado el usuario en `req.user`, y el tipo lo marca como opcional
  // porque las rutas públicas no lo tienen. Esta comprobación es solo para el compilador:
  // si `requireAuth` falló, nunca se llega a este handler. Aun así lanza el mismo
  // `UnauthorizedError` con el mismo `code` que el middleware, y no un `Error` suelto: si
  // algún día el orden de los middlewares cambiara, el cliente vería un 401 y no un 500
  // con la respuesta vacía.
  const user = req.user;

  if (user === undefined) {
    throw new UnauthorizedError(
      'Se requiere un access token valido',
      'UNAUTHORIZED',
    );
  }

  res.status(201).json(createOrder(user.id, body, readAcceptLanguage(req)));
});

/**
 * Historial del usuario autenticado. **Protegida con `requireAuth`**: sin sesión, 401
 * `UNAUTHORIZED`; con un access caducado, también (y es el 401 que T-046 sabe renovar).
 *
 * **200 con `{ language, orders }`**, donde cada pedido trae sus líneas con el nombre del
 * plato ya localizado al idioma de la petición. Es el mismo envoltorio que usa el POST
 * para la respuesta de un pedido concreto, así que la API no tiene dos convenciones para
 * lo mismo.
 *
 * **Solo devuelve los pedidos del usuario del token.** El `userId` sale de `req.user`
 * (fijado por `requireAuth`), nunca del body ni de los params: un cliente no puede pedir
 * el historial de otro usuario aunque conozca su id.
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

export { ordersRouter };

export default ordersRouter;
