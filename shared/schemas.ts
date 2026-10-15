import { z } from 'zod';

/**
 * Esquemas de auth compartidos entre el servidor y el cliente.
 *
 * **Viven aquí y no en el módulo de auth del servidor porque los dos lados tienen que
 * validar exactamente lo mismo.** El servidor es quien rechaza (400 `VALIDATION_ERROR`), pero
 * el formulario puede detectar el mismo error antes de gastar una petición; si las reglas
 * estuvieran escritas dos veces, el formulario acabaría aceptando algo que la API rechaza y
 * el usuario vería un 400 sin explicación. Una regla, un sitio.
 *
 * **Los mensajes se inyectan, no se escriben aquí.** Este fichero lo leen dos mundos con
 * lenguas distintas: el servidor responde en español (los `code` de error son los que el
 * frontend usa para decidir) y el cliente tiene que pintar el mensaje en es/ru/en. Por eso
 * cada esquema es una **fábrica** que recibe sus textos en vez de llevar los suyos: quien
 * llama decide el idioma y las reglas no cambian. Si el mensaje viviera aquí, el cliente
 * tendría que traducir un texto ya construido.
 *
 * Nota de build: el servidor importa este fichero por ruta relativa. Eso exige que los
 * ficheros de `shared/` estén en su `include` y que su `rootDir` suba a la raíz del
 * repositorio, porque `rootDir: ./src` daba TS6059 ("not under rootDir"). Lo mismo con el
 * `start`, que apunta ahora a `dist/server/src/app.js`. Decisión del dueño del 2026-10-04.
 */

/**
 * Límite de bcrypt: **72 bytes**, no 72 caracteres.
 *
 * Se exporta porque los dos lados lo necesitan y no solo la regla: el servidor lo usa en su
 * mensaje de error y el cliente lo interpola en su traducción. Si el número viviera escrito
 * en dos textos, cambiarlo aquí dejaría un mensaje diciendo 72 cuando el límite fuera otro, y
 * ese mensaje es justo lo que el usuario lee cuando su contraseña no entra.
 */
const BCRYPT_MAX_BYTES = 72;

/**
 * Textos que el llamante inyecta en los esquemas de entrada. Hay uno por regla con mensaje,
 * y ninguno más: si una regla no necesita texto (un `trim`, un `toLowerCase`) no se expone un
 * hueco para rellenarlo, porque un mensaje que nadie usa es ruido.
 *
 * Los tipos se escriben a mano y no se derivan de los esquemas (`z.infer` no sirve aquí: los
 * mensajes entran, no salen). La consecuencia es que **añadir una regla con mensaje obliga a
 * añadir el campo a este tipo**, y como el servidor y el cliente construyen el objeto de
 * mensajes, los dos lados rompen a compilar en lugar de dejar un `undefined` al usuario.
 */
type RegisterBodyMessages = {
  emailMax: string;
  emailFormat: string;
  passwordMin: string;
  passwordOnlySpaces: string;
  passwordTooLong: string;
};

type LoginBodyMessages = {
  emailMax: string;
  emailFormat: string;
  passwordRequired: string;
};

/**
 * Email: se normaliza a minúsculas y sin espacios **antes** de validarse, y el límite se
 * mide en caracteres (254, el máximo de una dirección) no en bytes.
 *
 * El motivo es el mismo que en T-040 y sigue siendo la razón de que esto sea una regla
 * compartida y no una convención de cada lado: `users.email` es `UNIQUE` y el `UNIQUE` de
 * SQLite sobre `TEXT` distingue mayúsculas. Sin normalizar, `Ana@ejemplo.com` y
 * `ana@ejemplo.com` serían dos usuarios distintos y el 409 no detectaría el duplicado. El 409
 * solo es fiable si "el mismo email" está definido de una sola forma, y ahora esa forma está
 * en un único sitio.
 */
const createEmailSchema = (
  messages: Pick<RegisterBodyMessages, 'emailMax' | 'emailFormat'>,
) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { message: messages.emailMax })
    .email({ message: messages.emailFormat });

/**
 * Contraseña del **registro**: mínimo 8, no solo espacios y 72 bytes como mucho.
 *
 * **No se aplica `.trim()`**, a diferencia del email: recortar una contraseña cambia el
 * secreto en silencio, y el login comparará la cadena tal cual llegó. Si el alta recortara y
 * el login no, una contraseña con un espacio al final se registraría sin él y luego no
 * entraría. En vez de recortar, se rechaza la que solo tenga espacios: sin esa comprobación
 * ocho espacios pasarían el `min(8)`.
 *
 * **El límite se mide en bytes porque es lo que ve bcrypt**, que corta a 72 bytes sin
 * avisar: dos contraseñas que coincidan en sus primeros 72 bytes producen el mismo hash y las
 * dos entran. Con `z.string().max(72)` una contraseña de 72 caracteres cirílicos o con `ñ`
 * pasaría el filtro y seguiría truncándose por dentro.
 *
 * **Los bytes se cuentan con `TextEncoder` y no con `Buffer.byteLength`**, que es lo que usaba
 * el servidor antes de que este fichero fuera compartido. `Buffer` no existe en el navegador
 * y `zodResolver` ejecutaría esta regla en cada tecleo: con `Buffer` el formulario entero
 * reventaría con "Buffer is not defined" en cuanto el usuario escribiera una contraseña. Los
 * dos cuentan bytes UTF-8, así que el número que sale es el mismo y bcrypt recibe el mismo
 * límite.
 */
const createPasswordSchema = (
  messages: Pick<
    RegisterBodyMessages,
    'passwordMin' | 'passwordOnlySpaces' | 'passwordTooLong'
  >,
) => {
  const utf8Length = new TextEncoder();

  return z
    .string()
    .min(8, { message: messages.passwordMin })
    .refine((value) => value.trim().length >= 8, {
      message: messages.passwordOnlySpaces,
    })
    .refine((value) => utf8Length.encode(value).length <= BCRYPT_MAX_BYTES, {
      message: messages.passwordTooLong,
    });
};

/**
 * Body de `POST /api/auth/register`.
 *
 * **`role` no está en el schema, y esa es la decisión de seguridad de T-040:** no se acepta
 * desde el cliente, lo fija el repositorio a `customer`. Zod descarta las claves desconocidas
 * por defecto, así que mandar `{ "role": "admin" }` no da error ni cambia nada.
 *
 * `preferredLang` es obligatorio en los dos lados aunque la columna tenga `default 'es'`:
 * se prefiere que el cliente diga con qué idioma se registra en vez de que el servidor adivine
 * (SPEC §7.2).
 */
const createRegisterBodySchema = (messages: RegisterBodyMessages) =>
  z.object({
    email: createEmailSchema(messages),
    password: createPasswordSchema(messages),
    preferredLang: z.enum(['es', 'ru', 'en']),
  });

/**
 * Body de `POST /api/auth/login`: dos campos y nada más.
 *
 * **La contraseña aquí solo se exige que no esté vacía, y no se reutiliza la regla del
 * registro, a propósito.** El login no responde "¿esta.cumple las reglas?", sino
 * "¿son estas las credenciales?": aplicar el `min(8)` haría que una demasiado
 * corta devolviera 400 en vez del 401 `INVALID_CREDENTIALS` que el cliente tiene que saber
 * pintar ("usuario o contraseña incorrectos").
 */
const createLoginBodySchema = (messages: LoginBodyMessages) =>
  z.object({
    email: createEmailSchema(messages),
    password: z.string().min(1, { message: messages.passwordRequired }),
  });

/**
 * Body de `POST /api/orders/guest` (T-098a). Campos de contacto y entrega del invitado.
 *
 * **`guestEmail` es opcional**, pero si se provee debe ser válido: el backend usa el email
 * del usuario autenticado cuando hay sessión, y para invitados es una forma alternativa de
 * contacto que no es obligatoria.
 *
 * **`guestPhone` y `deliveryAddress` obligatorios**: son los datos mínimos para entregar.
 * **`guestName` obligatorio**: identifica al cliente en el panel del chef.
 */
const createGuestOrderBodySchema = (messages: GuestOrderBodyMessages) =>
  z.object({
    items: z
      .array(
        z.object({
          dishId: z.number().int().positive(),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1, { message: messages.itemsMin }),
    customerNote: z.string().trim().max(500).optional(),
    guestName: z
      .string()
      .trim()
      .min(2, { message: messages.nameMin })
      .max(100, { message: messages.nameMax }),
    guestPhone: z
      .string()
      .trim()
      .min(5, { message: messages.phoneMin })
      .max(20, { message: messages.phoneMax }),
    guestEmail: z
      .string()
      .trim()
      .email({ message: messages.emailFormat })
      .max(254, { message: messages.emailMax })
      .optional(),
    deliveryAddress: z
      .string()
      .trim()
      .min(5, { message: messages.addressMin })
      .max(500, { message: messages.addressMax }),
  });

type GuestOrderBodyMessages = {
  itemsMin: string;
  nameMin: string;
  nameMax: string;
  phoneMin: string;
  phoneMax: string;
  emailFormat: string;
  emailMax: string;
  addressMin: string;
  addressMax: string;
};

export {
  BCRYPT_MAX_BYTES,
  createGuestOrderBodySchema,
  createLoginBodySchema,
  createRegisterBodySchema,
  type GuestOrderBodyMessages,
  type LoginBodyMessages,
  type RegisterBodyMessages,
};
