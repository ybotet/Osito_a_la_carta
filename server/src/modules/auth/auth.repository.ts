import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import type { NewUser } from '../../db/schema.js';

/**
 * Columnas que se devuelven al cliente. `passwordHash` queda fuera del `returning` a
 * propósito: aunque el `INSERT` acabara devolviendo la fila entera por defecto, esta
 * proyección es la que decide qué sale, y el hash no está en ella.
 */
const publicUserProjection = {
  id: users.id,
  email: users.email,
  role: users.role,
  preferredLang: users.preferredLang,
};

/**
 * ¿Existe ya ese email? Es la comprobación que decide el 409.
 *
 * **Llega el email ya normalizado** (el schema lo pasa a minúsculas): si esta función
 * normalizara por su cuenta y el `INSERT` no, la comprobación y el guardado dejarían de
 * hablar del mismo email y el 409 sería falso en unos casos. La normalización vive en un
 * solo sitio, el schema.
 *
 * Se consulta por `email` y no por un `LIKE` o un `lower()` en SQL: la columna se
 * guarda normalizada, así que la igualdad es exacta y el `UNIQUE` de la columna coincide
 * con esta comprobación.
 *
 * La carrera entre dos registros simultáneos con el mismo email la cubre el `UNIQUE` de
 * la columna, no esta función: dos peticiones que pasan el `SELECT` a la vez acabarían
 * dando el mismo error de SQLite. Con better-sqlite3 el servicio es **síncrono de
 * principio a fin** (el `hashSync` de bcrypt también lo es), así que en la práctica no
 * hay hueco entre comprobar e insertar. Es un invariante a mantener: en el día que el
 * hash pase a ser asíncrono, esta comprobación deja de bastar y habrá que capturar el
 * error del `UNIQUE`. Ver la nota del servicio.
 */
const emailExists = (email: string) =>
  db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get() !== undefined;

/**
 * Inserta el usuario y devuelve la fila pública con el `id` ya asignado.
 *
 * **`role` lo fija esta función a `customer` y no se acepta del body** (mismo criterio que
 * T-022 con `isAvailable`): quien se registra no decide si es admin. `preferredLang` sí
 * viene del body porque es el idioma que el usuario está viendo, no un permiso.
 *
 * `.returning()` evita el `SELECT` de lectura posterior: el `INSERT` de SQLite ya
 * devuelve la fila insertada.
 */
const insertUser = (
  values: Pick<NewUser, 'email' | 'passwordHash' | 'preferredLang'>,
) =>
  db
    .insert(users)
    .values({
      email: values.email,
      passwordHash: values.passwordHash,
      role: 'customer',
      preferredLang: values.preferredLang,
    })
    .returning(publicUserProjection)
    .get();

export { emailExists, insertUser };
