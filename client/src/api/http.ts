/**
 * Capa HTTP común del cliente: el error de la API y el `fetch` que la hace.
 *
 * **Vivía dentro de `api/dishes.ts` y se movió aquí en T-044** cuando las llamadas de auth
 * necesitaron exactamente lo mismo (leer el cuerpo, traducir el fallo a un error con `code`).
 * Dejar el error en el módulo de platos habría hecho que `api/auth.ts` importara de
 * `api/dishes.ts`, que no dice nada de auth: la dependencia apunta al revés y un día alguien
 * tocaría el módulo de platos sin sospechar que el login se rompía.
 *
 * Lo que vive en `api/client.ts` desde T-046 y **no aquí**: el `Authorization`, el
 * `Accept-Language` y la renovación del access cuando llega un 401. Este módulo sigue siendo el
 * que sabe leer el cuerpo y traducir un fallo a `ApiError` con su `code`, que no depende de la
 * sesión. Quien llama desde `api/` usa `apiRequest`, no esta función.
 */

/**
 * Error de la API con su código y su status, para que la página pueda distinguirlos. Sin
 * esto, un 404 y un 500 serían el mismo error genérico y el usuario vería el mismo mensaje
 * para dos fallos que requieren acciones distintas.
 *
 * **El `code` es lo que hay que mirar, no el `status`.** La API responde siempre
 * `{ error, code }` (SPEC §8) y el `code` es el que distingue un 400 de validación de un 401
 * `INVALID_CREDENTIALS` o de un 409 `EMAIL_TAKEN`: tres 400/401/409 que piden cosas
 * distintas en pantalla.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  /** Se serializa con `JSON.stringify` y se manda como `application/json`. */
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * Hace la petición y devuelve el cuerpo ya parseado, o lanza `ApiError`.
 *
 * **El cuerpo no se valida con Zod.** El cliente valida lo que **envía** (el formulario, con
 * las reglas de `shared/schemas.ts`), pero lo que **vuelve** no: el backend ya valida lo que
 * va a serializar (`userSchema.parse(...)` en el servicio), así que un 200 con un cuerpo
 * inesperado solo puede venir de un proxy o de una caché, no del código de la aplicación. El
 * `INVALID_RESPONSE` de abajo cubre ese caso. Es el mismo criterio que fijó T-034 para platos
 * y no se ha cambiado por tener Zod en el cliente.
 *
 * **Un 204 sin cuerpo no es un error.** `DELETE` devuelve 204 y `response.json()` lanzaría;
 * por eso el parseo tolera que no haya cuerpo y solo se queja cuando llega algo que no es un
 * objeto JSON.
 */
const requestJson = async (
  path: string,
  options: RequestOptions = {},
): Promise<unknown> => {
  const { method = 'GET', headers = {}, body, signal } = options;

  const response = await fetch(path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(signal !== undefined && { signal }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error =
      payload !== null && typeof payload === 'object' && 'code' in payload
        ? (payload as { code: string; error?: string })
        : null;

    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.error ??
        `La peticion a ${path} fallo con status ${response.status}`,
    );
  }

  if (payload === null || typeof payload !== 'object') {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'La respuesta no es un objeto JSON',
    );
  }

  return payload;
};

export { requestJson };
export type { RequestOptions };
