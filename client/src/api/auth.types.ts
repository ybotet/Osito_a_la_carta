/**
 * Formas de las respuestas de `/api/auth/*`, tal y como las devuelve el backend.
 *
 * **Viven en `api/` y no en `store/` porque son la forma del cable, no la del estado.** El
 * `user` que guarda el store es exactamente el objeto que viene dentro de la respuesta del
 * login, y no una versión recortada: si el backend añadiera un campo, el tipo lo
 * recordaría al compilar en vez de dejar que el campo llegue sin typear.
 *
 * Se replican aquí en vez de importarse del servidor a propósito. T-044 mueve a
 * `shared/schemas.ts` los schemas que **escriben** (los bodies del registro y del login),
 * porque esas reglas tienen que ser las mismas en los dos lados o el formulario aceptaría
 * algo que la API rechaza. Los schemas de **respuesta** se quedan en el servidor, donde se
 * ejecutan con `parse` sobre lo que se va a serializar; el cliente no puede compartirlos sin
 * importar código de `server/`, y un tipo que solo se comprueba al compilar el cliente deja
 * al backend sin comprobar. Estos tipos son la sombra que el cliente asume, y se verifican
 * contra el backend en cada prueba de T-044.
 */
export type ApiUserRole = 'customer' | 'admin';

export type ApiPreferredLang = 'es' | 'ru' | 'en';

/**
 * El usuario público: **nunca el `passwordHash`**, porque el backend no lo serializa
 * (`userSchema` no lo contempla), y porque un tipo que no lo menciona tampoco puede
 * acabarlo guardando en el `localStorage` por accidente.
 */
export type ApiAuthUser = {
  id: number;
  email: string;
  role: ApiUserRole;
  preferredLang: ApiPreferredLang;
};

/**
 * Respuesta de `POST /api/auth/login`: los dos tokens y el usuario.
 *
 * Los dos tokens porque son de distinta caducidad y el cliente los necesita por separado:
 * el access va en la cabecera `Authorization` de cada petición y el refresh solo se usa
 * para renovarlo (T-046). `POST /api/auth/register` **no** devuelve tokens, solo el
 * usuario: quien registra tiene que entrar después.
 */
export type ApiLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: ApiAuthUser;
};
