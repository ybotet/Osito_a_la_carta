import { z } from 'zod';

/**
 * Límite de bcrypt: **72 bytes**, no 72 caracteres.
 *
 * bcrypt corta la contraseña a los 72 bytes y no avisa, así que dos contraseñas que
 * coincidan en los primeros 72 bytes producen el mismo hash y las dos entran. Es un
 * fallo de seguridad silencioso, no una molestia de validación, así que el body se
 * rechaza en el borde en vez de dejar que el corte pase desapercibido.
 *
 * El límite se mide en bytes porque es lo que ve bcrypt: con `z.string().max(72)`
 * una contraseña de 72 caracteres cirílicos o con `ñ` passaría el filtro y seguiría
 * truncándose por dentro.
 */
const BCRYPT_MAX_BYTES = 72;

/**
 * El email se normaliza a minúsculas y sin espacios antes de validarse.
 *
 * **El motivo no es la estética: es que `users.email` es `UNIQUE` y el `UNIQUE` de
 * SQLite sobre `TEXT` distingue mayúsculas.** Sin normalizar, `Ana@ejemplo.com` y
 * `ana@ejemplo.com` serían dos usuarios distintos con, en la práctica, la misma
 * casilla, y el segundo podría registrarse sin que el 409 lo detecte. El 409 solo
 * es fiable si "el mismo email" está definido de una sola forma.
 *
 * Se normaliza en el schema y no en el servicio, igual que hizo T-026 con el `slug`:
 * la comprobación del 409 y el `INSERT` reciben exactamente el mismo valor, y no
 * puede haber una diferencia entre lo que se comprueba y lo que se guarda.
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, { message: 'El email no puede superar los 254 caracteres' })
  .email({ message: 'El email no tiene un formato valido' });

/**
 * Contraseña: mínimo 8 y sin recorte silencioso.
 *
 * **No se aplica `.trim()`**, a diferencia del email: recortar una contraseña cambia
 * el secreto en silencio, y el login (T-041) comparará la cadena tal cual llegó. Si el
 * alta recortara y el login no, una contraseña con un espacio al final se registraría
 * sin él y luego no entraría. En vez de recortar, se **rechaza** la que solo tenga
 * espacios: sin esta comprobación, ocho espacios pasarían el `min(8)` y serían una
 * contraseña válida.
 */
const passwordSchema = z
  .string()
  .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  .refine((value) => value.trim().length >= 8, {
    message: 'La contraseña no puede ser solo espacios',
  })
  .refine((value) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_BYTES, {
    message: `La contraseña no puede superar los ${BCRYPT_MAX_BYTES} bytes`,
  });

/**
 * Body de `POST /api/auth/register`.
 *
 * **`role` no está en el schema, y esa es la decisión de seguridad de la tarea:** no se
 * acepta desde el cliente, lo fija el repositorio a `customer` (como T-022 con
 * `isAvailable`). Zod descarta las claves desconocidas por defecto, así que mandar
 * `{ "role": "admin" }` no da error ni cambia nada: se ignora. Un admin se crea con
 * `npm run db:seed:admin`.
 *
 * `preferredLang` es **obligatorio**, tal y como lo pedía el enunciado, aunque la
 * columna tenga `default 'es'` en la base. Se prefiere que el cliente diga con qué
 * idioma se registra en vez de que el servidor adivine: es el idioma que el usuario
 * está viendo en ese momento, y el que SPEC §7.2 manda guardar.
 */
const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  preferredLang: z.enum(['es', 'ru', 'en']),
});

/**
 * Lo que sale del endpoint. **El `passwordHash` no está en el schema a propósito:** si
 * el shape de la respuesta no lo contempla, no hay forma de devolverlo por accidente
 * aunque alguien lo añada al `select` del repositorio más adelante.
 *
 * Se valida en runtime con `parse` (no solo en compilación) como en el resto de
 * módulos, para que una fila mal formada reviente en esta capa y no llegue al cliente.
 */
const userSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  role: z.enum(['customer', 'admin']),
  preferredLang: z.enum(['es', 'ru', 'en']),
});

/**
 * Body de `POST /api/auth/login`: dos campos y nada más.
 *
 * **Reutiliza `emailSchema`, con su normalización a minúsculas.** Es lo que hace que un
 * usuario pueda escribir `  Ana@Ejemplo.com ` y entrar igual que si hubiera escrito
 * `ana@ejemplo.com`: el login busca por el mismo valor con el que se guardó, y ese valor
 * lo decidió T-040 en el mismo sitio.
 *
 * **La contraseña aquí solo se exige que no esté vacía, y no se reutiliza `passwordSchema`
 * a propósito.** El login no responde "¿esta contraseña cumple las reglas?", sino
 * "¿son estas las credenciales?". Aplicar el `min(8)` y el límite de 72 bytes haría que
 * una contraseña demasiado corta devolviera 400 en vez de 401 `INVALID_CREDENTIALS`, que
 * es lo que el cliente tiene que saber pintar ("usuario o contraseña incorrectos"), y
 * mezclaría las reglas del registro con las de la autenticación.
 */
const loginBodySchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { message: 'La contraseña no puede estar vacía' }),
});

/**
 * Respuesta del login: los dos tokens y el usuario **sin hash**, que es el mismo
 * `userSchema` del registro. El frontend guarda los tokens y ya tiene el usuario, así que
 * no necesita una llamada extra para pintarlo.
 *
 * Se valida en runtime con `parse`, como en el resto del módulo.
 */
const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: userSchema,
});

export { loginBodySchema, loginResponseSchema, registerBodySchema, userSchema };

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
