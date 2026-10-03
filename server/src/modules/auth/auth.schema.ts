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

/**
 * Body de `POST /api/auth/refresh`: el token y nada más.
 *
 * El token viene en el body y no en la cabecera `Authorization` a propósito: es una
 * petición que el cliente hace **precisamente cuando ya no puede usar el `Authorization`
 ***, porque el access ha caducado. Meterlo en la cabecera obligaría al interceptor
 * (T-046) a montar una petición "a pelo" solo para esta ruta.
 *
 * **Se recorta con `.trim()`** porque un salto de línea al copiar y pegar es un fallo de
 * cliente muy común y no puede hacer válido un token inválido: un JWT no puede tener
 * espacios, así que quitar los del borde no cambia nada del contenido firmado.
 */
const refreshBodySchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, { message: 'El refresh token no puede estar vacio' }),
});

/**
 * Lo que exige el endpoint a un token **ya verificado con la firma**: que sea de tipo
 * refresh y que traiga `sub`.
 *
 * **Se valida con Zod aunque el token venga firmado por el servidor**, y no por
 * desconfianza del firmante sino porque `jwt.verify` devuelve `string | JwtPayload`: un
 * token firmado cuyo payload sea una cadena suelta no tiene `.type` ni `.sub`, y sin
 * esta comprobación el código leería `undefined` y buscaría un usuario por un id
 * indefinido en lugar de responder un 401 claro. El `z.literal('refresh')` es además la
 * segunda barrera que exige T-043: un access token ya falla antes, en la firma, porque
 * está hecho con `JWT_SECRET`.
 */
const refreshClaimsSchema = z.object({
  sub: z.string().min(1),
  type: z.literal('refresh'),
});

/**
 * Lo que `requireAuth` (T-043) exige a un access token **ya verificado con la firma**.
 *
 * Vive aquí, y no en `middleware/auth.ts`, junto al `refreshClaimsSchema` y al código que
 * **firma** el token: el que escribe el payload y el que lo lee tienen que mirar la misma
 * definición, o un cambio en uno se rompe en el otro sin que nada avise.
 *
 * **`email` y `role` son obligatorios, no opcionales**, porque el middleware no puede
 * autorizar sin saber quién es el usuario: un token sin ellos se rechaza con 401 en vez de
 * dejar `req.user` a medias.
 */
const accessClaimsSchema = z.object({
  sub: z.string().min(1),
  type: z.literal('access'),
  email: z.string().min(1),
  role: z.enum(['customer', 'admin']),
});

/**
 * Respuesta del refresh: **solo el access token nuevo**, ni refresh token ni usuario.
 *
 * El refresh token **no se renueva**: hacerlo exigiría guardar los tokens emitidos para
 * poder revocar el anterior (rotación real), y eso es una tabla nueva que sigue siendo
 * decisión de T-045. El usuario tampoco se devuelve porque el cliente ya lo tiene del
 * login y lo tiene guardado en Zustand; incluirlo aquí obligaría al frontend a
 * sobrescribirlo en cada renovación.
 */
const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
});

export {
  accessClaimsSchema,
  loginBodySchema,
  loginResponseSchema,
  refreshBodySchema,
  refreshClaimsSchema,
  refreshResponseSchema,
  registerBodySchema,
  userSchema,
};

export type AccessClaims = z.infer<typeof accessClaimsSchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type RefreshClaims = z.infer<typeof refreshClaimsSchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
