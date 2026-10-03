import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import type { UserRole } from '../db/schema.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors.js';
import { accessClaimsSchema } from '../modules/auth/auth.schema.js';

/**
 * Lo que un middleware deja en `req.user`. **No incluye el `passwordHash` ni
 * `preferredLang`:** es lo mínimo que necesitan las rutas para autorizar (quién es y si es
 * admin) y así el hash no puede propagarse por los handlers.
 *
 * `role` reutiliza el tipo de la columna (`UserRole`), de modo que los dos sitios que deciden
 * qué es un rol admin no pueden separarse.
 */
type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

/**
 * Augmentación de los tipos de Express, que es la forma oficial de añadir propiedades a
 * `Request` (`@types/express` lee el namespace global `Express`).
 *
 * **`user` es opcional a propósito.** Marcarlo como obligatorio haría que TypeScript
 * garantizase `req.user` en **todas** las rutas, incluidas las públicas, donde no existe:
 * el tipo mentiría y el fallo aparecería en runtime, en producción, con un `undefined`
 * inesperado. Con `user?`, cada handler que lo use sabe que tiene que comprobarlo, que es
 * exactamente lo que quiere decir "puede no haber sesión".
 *
 * El nombre `user` (y no `auth`) es el que usan los middlewares de la mayoría de frameworks
 * de Node, y el que leen las rutas cuando necesitan algo más que el rol.
 */
// El augment de Express es un namespace por definición: no hay forma de escribirlo sin él,
// así que la regla se desactiva aquí y solo aquí.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Esquema del valor de `Authorization`, más tolerante que una comparación literal.
 *
 * RFC 6750 dice que el **esquema** (`bearer`) no distingue mayúsculas, así que `Bearer`,
 * `bearer` y `BEARER` valen igual, y el resto del header es el token. Se compara en
 * minúsculas en lugar de con `startsWith('Bearer ')`, que rechazaría `bearer` sin motivo:
 * algunos clientes y `curl` lo escriben así.
 */
const BEARER_SCHEME = 'bearer ';

/**
 * Saca el token de la cabecera `Authorization`, o `undefined` si no hay uno utilizable.
 *
 * Se comporta como `readAcceptLanguage` con `Accept-Language`: un header puede venir
 * repetido y Express lo tipa como `string | string[]`, así que se toma el primero. Los tres
 * casos que devuelven `undefined` (sin header, con otro esquema, o `Bearer` sin token)
 * acabarán todos en el mismo 401, que es lo que deben tener en común.
 */
const readBearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  const raw = Array.isArray(header) ? header[0] : header;

  if (raw === undefined || !raw.toLowerCase().startsWith(BEARER_SCHEME)) {
    return undefined;
  }

  const token = raw.slice(BEARER_SCHEME.length).trim();

  return token.length > 0 ? token : undefined;
};

/**
 * 401 con `code: 'UNAUTHORIZED'`, el mismo para todos los motivos por los que una petición
 * no puede autenticarse: sin cabecera, con un esquema que no es `Bearer`, con un token que no
 * existe, con firma que no cuadra, caducado, o con claims que no son los de un access token.
 *
 * Unificarlos es lo correcto: distinguirlos diría a quien va probando qué ha fallado, y el
 * cliente solo necesita una cosa, "no estoy autenticado".
 */
const unauthorized = (): never => {
  throw new UnauthorizedError(
    'Se requiere un access token valido',
    'UNAUTHORIZED',
  );
};

/**
 * Verifica el access token de la petición y devuelve el usuario que lleva dentro.
 *
 * **Las comprobaciones son tres y en este orden**, siguiendo la decisión que quedó
 * registrada en T-041:
 *
 * 1. **La firma, con `JWT_SECRET` y `algorithms: ['HS256']` explícito.** Un refresh token
 *    (firmado con `JWT_REFRESH_SECRET`) muere aquí sin llegar a mirar nada más, y sin ese
 *    `algorithms` `jsonwebtoken` se fiaría del algoritmo que declare la cabecera del token.
 * 2. **El `type`, que tiene que ser `access`.** Es lo que impide que un token de 7 días se
 *    use como credencial de una ruta protegida.
 * 3. **El shape de los claims con Zod**, porque `jwt.verify` devuelve `string | JwtPayload`
 *    y porque un token sin `role` no permite autorizar nada.
 *
 * **El `role` se cree del token, sin consultar la base**, y es una decisión con fecha de
 * caducidad: si se degrada a un admin o se le cambia el idioma, su token sigue valiendo hasta
 * 15 minutos (o hasta 7 días si el cliente lo va renovando con el refresh). La forma más
 * corta de cerrarlo del todo es releer el usuario en `requireAdmin` (o en `requireAuth`),
 * que ya tiene `findUserById` disponible; está anotado en MEMORY como deuda conocida.
 *
 * Las credenciales **no se comparan con nada** ni se registra nada de este token: los 401
 * pasan por el `errorHandler`, que ya los deja en `logger.warn` con su `code` y su ruta.
 */
const readAuthUser = (req: Request): AuthUser => {
  const token = readBearerToken(req);

  if (token === undefined) {
    return unauthorized();
  }

  let payload: string | jwt.JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return unauthorized();
  }

  const claims = accessClaimsSchema.safeParse(payload);

  if (!claims.success) {
    return unauthorized();
  }

  const id = Number(claims.data.sub);

  if (!Number.isInteger(id) || id <= 0) {
    return unauthorized();
  }

  return { id, email: claims.data.email, role: claims.data.role };
};

/**
 * Middleware de autenticación: exige un access token válido y deja su contenido en
 * `req.user`.
 *
 * **Lanza el error en vez de llamar a `next(error)`**, igual que hacen los handlers de las
 * rutas con `schema.parse(...)`: Express envuelve la llamada al middleware en `try/catch` y
 * manda lo capturado al `errorHandler`, que es quien sabe convertir un `AppError` en su
 * status y su `code`. Es el mismo camino que ya recorre un 400 de validación.
 */
const requireAuth: RequestHandler = (req, _res, next) => {
  req.user = readAuthUser(req);

  next();
};

/**
 * Segunda mitad de `requireAdmin`: con la sesión ya resuelta, exige que sea admin.
 *
 * Va separada porque es la comprobación que se puede reutilizar sola (por ejemplo, para una
 * ruta que solo necesite "es admin" y ya tenga el usuario de otra parte).
 */
const adminOnly: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ForbiddenError('Se requiere rol de administrador', 'FORBIDDEN');
  }

  next();
};

/**
 * Middleware de autorización de admin: **es `requireAuth` seguido de `adminOnly`**, y por eso
 * un cliente sin token recibe 401 y uno con token de cliente recibe 403. Ese orden importa:
 * un 403 para quien no está autenticado confirmaría que la ruta existe y que lo que falta es
 * el rol, que es justo el dato que no hay que darle.
 *
 * Se compone llamando a `requireAuth` y usando la continuación que nos da, y funciona porque
 * `requireAuth` es síncrono: o llama a `next()` después de dejar `req.user`, o lanza y el
 * `try/catch` de Express se encarga. El envoltorio existe solo por los tipos: la tercera
 * posición de un `RequestHandler` es de tipo `NextFunction`, que espera `next` y no un
 * middleware completo, así que un `RequestHandler` de cuatro parámetros no se puede pasar
 * ahí directamente. Los errores no se pasan a mano por la misma razón que en `requireAuth`:
 * los captura el `errorHandler`.
 */
const requireAdmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, () => {
    adminOnly(req, res, next);
  });
};

export { requireAdmin, requireAuth };

export type { AuthUser };
