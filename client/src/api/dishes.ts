import type { ApiDishesResponse, ApiDishResponse } from './dishes.types.js';

/**
 * Error de la API con su código y su status, para que la página pueda distinguirlos. Sin
 * esto, un 404 y un 500 serían el mismo error genérico y el usuario vería el mismo mensaje
 * para dos fallos que requieren acciones distintas.
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

/**
 * Hace la petición y devuelve el cuerpo ya parseado, o lanza `ApiError`.
 *
 * **El cuerpo no se valida con Zod.** El cliente no tiene `zod` y meterlo sería una dependencia
 * nueva sin necesidad: el backend ya valida lo que va a serializar (`dishSchema.parse` en el
 * servicio), así que un 200 con un cuerpo inesperado solo puede venir de un proxy o de una caché,
 * no del código de la aplicación. El `INVALID_RESPONSE` de abajo cubre ese caso.
 *
 * **El idioma lo decide quien llama, no esta función.** El idioma de la interfaz
 * (`i18n.language`) y el del contenido tienen que ser el mismo: si la pantalla está en ruso y
 * el backend contesta con los nombres en español, el usuario ve una mezcla. Se pasa como
 * parámetro en vez de leer `i18n` aquí porque quien llama ya lo tiene de `useTranslation` y así
 * esta función no depende del singleton de i18n, que es lo que la hace comprobable sin montar
 * React.
 */
const requestJson = async (
  path: string,
  acceptLanguage: string,
  signal?: AbortSignal,
): Promise<unknown> => {
  const response = await fetch(path, {
    headers: { 'Accept-Language': acceptLanguage },
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

/**
 * Pide los platos al backend en el idioma indicado.
 *
 * El backend responde 404 con `DISH_NOT_FOUND` o `CATEGORY_NOT_FOUND` y 400 con
 * `VALIDATION_ERROR`; los tres llegan traducidos a `ApiError` con su código.
 */
export const fetchDishes = async (
  acceptLanguage: string,
  signal?: AbortSignal,
): Promise<ApiDishesResponse> =>
  (await requestJson(
    '/api/dishes',
    acceptLanguage,
    signal,
  )) as ApiDishesResponse;

/**
 * Pide un plato concreto en el idioma indicado.
 *
 * **El `id` se pasa ya validado desde la página**, y no como `string` de la ruta, para que esta
 * función no tenga que decidir qué es un id válido. El backend responde 404 con
 * `DISH_NOT_FOUND` cuando no existe **o cuando está deshabilitado**, que es la decisión de
 * T-021: un plato retirado no se distingue de uno que nunca existió. También 400 con
 * `VALIDATION_ERROR` si el id no es un entero positivo.
 */
export const fetchDishById = async (
  id: number,
  acceptLanguage: string,
  signal?: AbortSignal,
): Promise<ApiDishResponse> =>
  (await requestJson(
    `/api/dishes/${id}`,
    acceptLanguage,
    signal,
  )) as ApiDishResponse;
