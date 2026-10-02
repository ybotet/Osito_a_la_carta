import type { ApiDishesResponse } from './dishes.types.js';

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
 * Pide los platos al backend en el idioma indicado.
 *
 * **`acceptLanguage` es obligatorio y lo decide quien llama, no esta función.** El idioma
 * de la interfaz (`i18n.language`) y el del contenido tienen que ser el mismo: si la
 * pantalla está en ruso y el backend contesta con los nombres en español, el usuario ve
 * una mezcla. Se pasa como parámetro en vez de leer `i18n` aquí porque quien llama ya lo
 * tiene de `useTranslation` y así esta función no depende del singleton de i18n, que es
 * lo que la hace comprobable sin montar React.
 *
 * El backend responde 404 con `DISH_NOT_FOUND` o `CATEGORY_NOT_FOUND` y 400 con
 * `VALIDATION_ERROR`; aquí se traducen los dos casos a `ApiError`. Si la respuesta no es
 * JSON válido se devuelve un `ApiError` genérico en vez de propagar el error de parseo,
 * que en el mensaje no diría nada de la petición que lo provocó.
 */
export const fetchDishes = async (
  acceptLanguage: string,
  signal?: AbortSignal,
): Promise<ApiDishesResponse> => {
  const response = await fetch('/api/dishes', {
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
        `La peticion a /api/dishes fallo con status ${response.status}`,
    );
  }

  if (payload === null || typeof payload !== 'object') {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'La respuesta no es un objeto JSON',
    );
  }

  return payload as ApiDishesResponse;
};
