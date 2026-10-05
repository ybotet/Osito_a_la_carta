import { DEFAULT_LANGUAGE, i18n } from '../lib/i18n';
import { useAuthStore } from '../store/auth';
import { ApiError, requestJson } from './http';
import type { RequestOptions } from './http';

/**
 * El `fetch` del cliente: el único sitio por el que salen peticiones.
 *
 * **Envuelve a `api/http.ts` y no lo sustituye**, porque las dos cosas que hace son distintas
 * y se separan bien: `requestJson` sabe leer el cuerpo y traducir un fallo a `ApiError` con su
 * `code` (T-044), y esto es lo que sabe de sesión. Si las dos vivieran en el mismo fichero,
 * todo lo que no tiene que ver con tokens arrastraría la lógica de renovarlos.
 *
 * **Por qué un wrapper y no un interceptor de `window.fetch`.** Parchear el `fetch` global es
 * invisible: nadie lee el fichero y ve que las peticiones llevan token, y un `fetch` que se
 * llama desde un módulo que no debería (o desde las herramientas de desarrollo del navegador)
 * también lo lleva. Con un wrapper explícito, la ruta de una petición se lee en el sitio que
 * la escribe.
 *
 * Lo que añade sobre `requestJson`:
 *
 * 1. `Authorization: Bearer <accessToken>` cuando hay sesión.
 * 2. `Accept-Language` con el idioma actual de `i18n`.
 * 3. La renovación: un 401 `UNAUTHORIZED` se reintenta **una sola vez** con un access nuevo, y
 *    si la renovación falla se limpia la sesión y se lleva al login.
 */

/** Ruta de renovación. Se pide aquí, pero **por debajo** de este wrapper (ver `renewAccessToken`). */
const REFRESH_PATH = '/api/auth/refresh';

const LOGIN_PATH = '/login';

/**
 * El `code` del 401 de `requireAuth` (T-043). **Se decide por `code` y no por `status`, y no es
 * un detalle:** hay tres 401 distintos en la API y con el mismo status.
 *
 * - `UNAUTHORIZED`: el access no valió (sin cabecera, con firma que no cuadra o caducado). Es el
 *   único que se puede renovar.
 * - `INVALID_CREDENTIALS`: el login falló. **No se renueva nunca**, porque "el access caducó" y
 *   "la contraseña está mal" son dos cosas que piden respuestas opuestas: renovar un login
 *   fallido dejaría al usuario en la página de login con un token nuevo inútil.
 * - `INVALID_REFRESH_TOKEN`: el refresh caducó a los 7 días o está manipulado. Para el cliente es
 *   la misma situación (la sesión se acabó) y T-042 los unifica a propósito.
 *
 * Si se comprobara el `status`, un login con contraseña incorrecta dispararía la renovación, y
 * como no hay sesión que renovar tiraría la sesión del usuario y lo devolvería al login: un
 * bucle de recarga por teclear mal la contraseña.
 */
const UNAUTHORIZED_CODE = 'UNAUTHORIZED';

/**
 * El idioma que se manda en `Accept-Language`, que es el que decide qué columnas multi-idioma
 * lee el backend (`resolveLanguage`).
 *
 * **Va aquí y no como parámetro de cada función.** Si cada módulo lo pasara, el idioma de la
 * interfaz y el del contenido podrían separarse: la pantalla en ruso con los platos en
 * español. Leyéndolo de `i18n` en el momento de la petición no puede haber desfase, porque es
 * el mismo valor que la pantalla está pintando.
 *
 * Un llamador puede sobrescribir la cabecera pasándola en `headers` (gana la suya), que es lo
 * que necesitan las pruebas que quieren fijar un idioma.
 */
const currentLanguage = (): string =>
  i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE;

const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.code === UNAUTHORIZED_CODE;

/**
 * La renovación en curso, para **compartirla entre llamadas simultáneas**.
 *
 * Sin esto, un `401` de tres queries que salen a la vez dispara tres renovaciones. No es solo
 * un desperdicio: el refresh token **no se renueva** (decisión de T-041/T-042, porque hacerlo
 * exigiría una tabla de tokens revocados), así que las tres llamadas serían válidas y las tres
 * escribirían el access nuevo en el store. La que llegue última gana, y las peticiones que se
 * reintentaron con tokens distintos pueden acabar usando uno que ya no es el del store.
 *
 * Guardar la promesa y no un booleano hace que la segunda y la tercera llamada se enganchen a
 * la primera: una sola petición al servidor y un solo `setSession`.
 */
let pendingRenewal: Promise<string> | null = null;

/**
 * Pide un access nuevo y lo guarda en el store.
 *
 * **No pasa por este wrapper**, y por eso no puede entrar en bucle: si la renovación se
 * pidiera con el mismo `apiRequest` que reintenta los 401, un 401 del refresh dispararía otro
 * refresh, indefinidamente. Usa `requestJson` directamente.
 *
 * **Vuelve a leer el store después del `await`** y compara el refresh token con el que usó. Si
 * mientras se pedía la renovación el usuario cerró sesión (o el login le devolvió otro token),
 * guardar el access nuevo resucitaría una sesión que ya se había terminado. Es una carrera real
 * aunque improbable: entre el `await` y el `setSession` cabe un clic en "salir".
 *
 * El `user` es necesario porque `setSession` lo pide (T-045 lo hace así a propósito, para que no
 * se pueda guardar medio sesión). Si no hay `user` la sesión está incompleta y no se renueva.
 */
const renewAccessToken = async (): Promise<string> => {
  const { refreshToken, user } = useAuthStore.getState();

  if (refreshToken === null || user === null) {
    throw new ApiError(
      401,
      'INVALID_REFRESH_TOKEN',
      'No hay refresh token en la sesion',
    );
  }

  const payload = (await requestJson(REFRESH_PATH, {
    method: 'POST',
    body: { refreshToken },
  })) as { accessToken?: unknown };

  const state = useAuthStore.getState();

  if (state.refreshToken !== refreshToken) {
    throw new ApiError(
      401,
      'INVALID_REFRESH_TOKEN',
      'La sesion cambio mientras se renovaba el token',
    );
  }

  if (
    typeof payload.accessToken !== 'string' ||
    payload.accessToken.length === 0
  ) {
    throw new ApiError(
      502,
      'INVALID_RESPONSE',
      'La renovacion no devolvio un access token',
    );
  }

  state.setSession(user, payload.accessToken, refreshToken);

  return payload.accessToken;
};

/**
 * Devuelve un access válido, renewing si hace falta, y **una sola renovación a la vez**.
 *
 * El `finally` devuelve la promesa a `null` pase lo que pase, para que un fallo no deje el
 * wrapper clavado: si no, después de un 401 con refresh caducado todas las peticiones siguientes
 * recibirían el mismo rechazo sin llegar a pedir nada.
 */
const getValidAccessToken = (): Promise<string> => {
  pendingRenewal ??= renewAccessToken().finally(() => {
    pendingRenewal = null;
  });

  return pendingRenewal;
};

/**
 * Cierra la sesión y lleva al login.
 *
 * **`window.location` y no `useNavigate`:** esto no es un componente de React, así que no hay
 * hook que usar, y el store vive fuera del árbol. La recarga tiene un efecto secundario que
 * resulta conveniente: vacía la caché de TanStack Query, así que no quedan en memoria datos
 * de la sesión anterior.
 *
 * **No se redirige si ya se está en `/login`**, para no recargar la página del login en un
 * bucle. Con la comprobación de `code` de arriba ese caso es raro, pero una recarga infinita
 * sería el peor modo de fallo posible.
 */
const endSessionAndRedirect = (): void => {
  useAuthStore.getState().clearSession();

  if (
    typeof window === 'undefined' ||
    window.location.pathname === LOGIN_PATH
  ) {
    return;
  }

  window.location.assign(LOGIN_PATH);
};

/**
 * Hace la petición con el token y el idioma, y renueva el access si el 401 lo pide.
 *
 * **El reintento es exactamente uno.** Si la petición renewed volviera a dar 401, el error se
 * propaga sin volver a renovar: un token que el servidor acepta y luego rechaza no se arregla
 * pidiendo otro, y sin este límite un backend con la hora desfasada entraría en bucle de
 * renovaciones.
 *
 * **Solo se renueva si la petición llevaba `Authorization`.** Un 401 sin token no es una sesión
 * caducada: es que la petición no iba autenticada, como el login. Sin esta comprobación, un
 * login con contraseña incorrecta intentaría renovar y, al no haber sesión, cerraría la del
 * usuario y lo tiraría al login.
 *
 * La renovación fallida se traduce en el **error original**, no en el de la renovación: quien
 * llama ya está esperando el fallo de su petición, y el `ApiError` del refresh se registraría
 * como un error ajeno. Lo que sí se hace antes es limpiar la sesión y redirigir, que es lo que
 * la deja en un estado coherente.
 */
const apiRequest = async (
  path: string,
  options: RequestOptions = {},
): Promise<unknown> => {
  const { accessToken } = useAuthStore.getState();

  const headers = {
    'Accept-Language': currentLanguage(),
    ...(accessToken !== null && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  try {
    return await requestJson(path, { ...options, headers });
  } catch (error) {
    const canRenew = accessToken !== null && isUnauthorized(error);

    if (!canRenew) {
      throw error;
    }

    let renewed: string;

    try {
      renewed = await getValidAccessToken();
    } catch {
      endSessionAndRedirect();

      throw error;
    }

    return requestJson(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${renewed}` },
    });
  }
};

export { apiRequest, currentLanguage };
export type { RequestOptions };
