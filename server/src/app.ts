import { env } from './config/index.js';
import express from 'express';
import { logger } from './logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { dishesRouter } from './modules/dishes/dishes.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { UPLOADS_URL_PREFIX } from './modules/dishes/dishes.uploads.js';
import { errorHandler, notFoundHandler } from './shared/error.middleware.js';

const app = express();

app.use(express.json({ limit: '100kb' }));

/**
 * Sirve las imágenes subidas en **desarrollo**.
 *
 * En producción este bloque sobra: Nginx monta `UPLOADS_URL_PREFIX` con un `alias` a
 * `UPLOADS_DIR` y hace proxy de `/api`, así que los ficheros no pasan por Node. Aquí sí hace
 * falta, porque en local no hay Nginx y sin esto el `<img>` del menú daría 404.
 *
 * Va **después** de `express.json()` pero antes de los routers y del `notFoundHandler`: si
 * fuera después, una imagen inexistente caería en el 404 de la API en vez de en el de
 * `express.static`, que es el que corresponde.
 *
 * `fallthrough: true` es el valor por defecto y es lo correcto: si el fichero no existe en
 * disco se sigue al `notFoundHandler`, de modo que `GET /uploads/dishes/x.jpg` inexistente da
 * 404 en JSON como el resto de la API, en vez de un 404 de página estática.
 */
app.use(
  UPLOADS_URL_PREFIX,
  express.static(env.UPLOADS_DIR, { fallthrough: true, index: false }),
);

app.use('/api', healthRouter);
app.use('/api', dishesRouter);
app.use('/api', categoriesRouter);
app.use('/api', authRouter);
app.use('/api', ordersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server starting on port ${env.PORT}`);
});

export { app };

export default app;
