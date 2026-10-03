import bcrypt from 'bcryptjs';
import { ConflictError } from '../../shared/errors.js';
import { emailExists, insertUser } from './auth.repository.js';
import { userSchema } from './auth.schema.js';
import type { RegisterBody } from './auth.schema.js';

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
