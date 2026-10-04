import { z } from 'zod';
import {
  BCRYPT_MAX_BYTES,
  createLoginBodySchema,
  createRegisterBodySchema,
} from '../../../../shared/schemas.js';
import type {
  LoginBodyMessages,
  RegisterBodyMessages,
} from '../../../../shared/schemas.js';

/**
 * Los textos que el servidor inyecta en las reglas compartidas de `shared/schemas.ts`.
 *
 * **Van aquí y no dentro del esquema para que las reglas tengan un solo sitio.** Desde T-044
 * las reglas del email y de la contraseña viven en `shared/`, porque el formulario del cliente
 * tiene que aplicar exactamente las mismas: si el formulario aceptara algo que aquí se
 * rechaza, el usuario vería un 400 de la API después de rellenar el formulario. Lo único que
 * cambia entre los dos lados es **en qué idioma se dice el error**, y eso es lo que se
 * inyecta.
 *
 * Estos textos son los mismos que tenía T-040 y T-041 escritos dentro del esquema, sin
 * cambiar ni una palabra: el `400` de la API no cambia ni de mensaje ni de `code`
 * (`VALIDATION_ERROR`) por mover las reglas. Son además la razón de que T-040 eligiera
 * español y no inglés, como sí hacen platos y categorías: el frontend acaba traduciendo
 * este texto y no tiene un diccionario de errores por `code`.
 */
const REGISTER_MESSAGES: RegisterBodyMessages = {
  emailMax: 'El email no puede superar los 254 caracteres',
  emailFormat: 'El email no tiene un formato valido',
  passwordMin: 'La contraseña debe tener al menos 8 caracteres',
  passwordOnlySpaces: 'La contraseña no puede ser solo espacios',
  passwordTooLong: `La contraseña no puede superar los ${BCRYPT_MAX_BYTES} bytes`,
};

const LOGIN_MESSAGES: LoginBodyMessages = {
  emailMax: 'El email no puede superar los 254 caracteres',
  emailFormat: 'El email no tiene un formato valido',
  passwordRequired: 'La contraseña no puede estar vacía',
};

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
 *
 * Las reglas (normalización del email, mínimo de contraseña y el límite de 72 bytes de
 * bcrypt) viven en `shared/schemas.ts` desde T-044, no aquí: son las mismas que aplica el
 * formulario del cliente.
 */
const registerBodySchema = createRegisterBodySchema(REGISTER_MESSAGES);

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
 * **La contraseña aquí solo se exige que no esté vacía, y no se reutiliza la regla del
 * registro a propósito.** El login no responde "¿esta contraseña cumple las reglas?", sino
 * "¿son estas las credenciales?". Aplicar el `min(8)` y el límite de 72 bytes haría que
 * una contraseña demasiado corta devolviera 400 en vez de 401 `INVALID_CREDENTIALS`, que
 * es lo que el cliente tiene que saber pintar ("usuario o contraseña incorrectos"), y
 * mezclaría las reglas del registro con las de la autenticación.
 *
 * Las reglas, eso sí, están en `shared/schemas.ts` (ver `createLoginBodySchema`).
 */
const loginBodySchema = createLoginBodySchema(LOGIN_MESSAGES);

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
