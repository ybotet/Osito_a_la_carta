import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/index.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors.js';
import { emailExists, findUserByEmail, insertUser } from './auth.repository.js';
import { loginResponseSchema, userSchema } from './auth.schema.js';
import type { LoginBody, RegisterBody } from './auth.schema.js';

/**
 * 10 rounds, los mismos que usa `db:seed:admin`. Es el coste de hashear una contraseña
 * en `bcryptjs`; el trabajo real ocurre al hacer el `compare` del login (T-041), así que
 * bajarlo solo haría la base más débil, no el arranque más rápido.
 */
const BCRYPT_ROUNDS = 10;

/**
 * Registra un cliente y devuelve su representación pública.
 *
 * **El 409 va antes de hashear, a propósito.** `bcrypt.hashSync` con 10 rounds cuesta
 * decenas de milisegundos y es CPU puro: hashear la contraseña de alguien que ya existe
 * solo para acabar respondiendo 409 es tiempo de CPU regalado a quien pueda mandar
 * peticiones repetidas con un email ocupado.
 *
 * **El servicio es deliberadamente síncrono.** Con better-sqlite3 la comprobación del
 * email y el `INSERT` se ejecutan en el mismo tick de Node, así que entre "no existe" y
 * "lo inserto" no cabe otra petición: el `UNIQUE` de la columna es una red de seguridad,
 * no la vía normal. Ese invariante **depende de que no haya ningún `await` en medio**:
 * el día que el hash pase a `bcrypt.hash` (asíncrono, para no bloquear el event loop
 * durante los ~100 ms del hash) hay que capturar el `SQLITE_CONSTRAINT_UNIQUE` y
 * traducirlo a este mismo 409, o dos registros simultáneos con el mismo email devolverán
 * un 500.
 */
const registerUser = (body: RegisterBody) => {
  if (emailExists(body.email)) {
    throw new ConflictError(
      'Ya existe un usuario con ese email',
      'EMAIL_TAKEN',
      {
        email: body.email,
      },
    );
  }

  const passwordHash = bcrypt.hashSync(body.password, BCRYPT_ROUNDS);

  return userSchema.parse(
    insertUser({
      email: body.email,
      passwordHash,
      preferredLang: body.preferredLang,
    }),
  );
};

export { registerUser };

export type RegisterResult = ReturnType<typeof registerUser>;

/**
 * Caducidades del enunciado: 15 minutos el access y 7 días el refresh.
 *
 * Se escriben como cadenas porque es lo que espera `jsonwebtoken` (`expiresIn` acepta
 * `'15m'`, `'7d'`, `'2h'` o un número de segundos). Con números habría que convertirlas
 * a segundos a mano en cada llamada y es fácil equivocarse.
 */
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

/**
 * Hash de relleno para igualar tiempos cuando el email no existe.
 *
 * **El 401 es el mismo en los dos fallos, pero el tiempo de respuesta no lo era:** si el
 * email no existe se devolvía el 401 sin pasar por bcrypt (~10 ms medidos) y si existía se
 * comparaba de verdad (~100 ms medidos). Esa diferencia de 10x permite a quien fuera
 * enumerar qué emails están registrados, que es información de la base de datos y no del
 * formulario.
 *
 * Se compara igualmente contra este hash para que ambos caminos cuesten lo mismo. El
 * hash es de una frase que **no es la contraseña de nadie** y está generado con los mismos
 * 10 rounds; solo sirve para gastar CPU. Si algún día cambia `BCRYPT_ROUNDS`, hay que
 * volver a generarlo (`bcrypt.hashSync('...', 10)`) o el relleno costará otra cosa.
 */
const DUMMY_PASSWORD_HASH =
  '$2b$10$yFKywo69IFc2AgGKphZTA.UWj.7H5rO4nfLRxtLgE.U7RZfqIz7kq';

/**
 * Claims de los tokens.
 *
 * **`type` es lo que distingue un token del otro** y no es opcional: sin él, un refresh
 * token (7 días) serviría como credencial para cualquier ruta protegida, porque
 * `requireAuth` (T-043) solo verifica la firma. Con el claim, T-043 puede exigir
 * `type === 'access'` y T-042 exigir `type === 'refresh'`.
 *
 * `sub` es el `id` del usuario **como texto**, que es lo que JWT exige; quien lo lea
 * tiene que volver a convertirlo con `Number(...)`.
 *
 * `email` y `role` van solo en el access token, porque son lo que el servidor necesita en
 * cada petición sin tener que ir a la base de datos. El precio es que un cambio de rol (por
 * ejemplo, alguien promocionado a admin) **no se ve hasta que el access caduque**, como máximo 15
 * minutos. Está anotado para T-043, que es quien decide qué comprueba de los claims.
 */
type TokenPayload = {
  type: 'access' | 'refresh';
  email?: string;
  role?: string;
};

const signAccessToken = (user: {
  id: number;
  email: string;
  role: string;
}): string => {
  const payload: TokenPayload = {
    type: 'access',
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: ACCESS_TOKEN_TTL,
  });
};

/**
 * El refresh token **se firma con `JWT_REFRESH_SECRET`, no con `JWT_SECRET`.** Es lo que
 * hace que un token de refresco no pueda aceptarse como access token aunque el claim
 * `type` se comprobara mal: son firmas distintas, hechas con secretos distintos, así que la
 * verificación con `JWT_SECRET` falla directamente.
 *
 * Solo lleva `sub` y `type`: el resto de datos del usuario se releen de la base cuando se
 * renueva (T-042), que además es lo que permite que un refresh siga siendo válido aunque
 * el email o el rol hayan cambiado.
 */
const signRefreshToken = (userId: number): string => {
  const payload: TokenPayload = { type: 'refresh' };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    expiresIn: REFRESH_TOKEN_TTL,
  });
};

/**
 * Autentica al usuario y devuelve los dos tokens.
 *
 * **El mensaje y el `code` del 401 son los mismos en los dos fallos** (email inexistente y
 * contraseña incorrecta). Distinguirlos diría qué emails están registrados sin dar ninguna
 * ventaja, y no hace falta para el usuario: en los dos casos la respuesta que merece es la
 * misma.
 *
 * El email llega normalizado por el schema, así que la búsqueda es exacta y no depende de
 * cómo lo haya escrito la persona.
 */
const loginUser = (body: LoginBody) => {
  const user = findUserByEmail(body.email);

  if (user === undefined) {
    bcrypt.compareSync(body.password, DUMMY_PASSWORD_HASH);

    throw new UnauthorizedError(
      'Usuario o contrasena incorrectos',
      'INVALID_CREDENTIALS',
    );
  }

  if (!bcrypt.compareSync(body.password, user.passwordHash)) {
    throw new UnauthorizedError(
      'Usuario o contrasena incorrectos',
      'INVALID_CREDENTIALS',
    );
  }

  return loginResponseSchema.parse({
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      preferredLang: user.preferredLang,
    },
  });
};

export { loginUser };
