import { apiRequest } from './client';
import type { ApiDishesResponse, ApiDishResponse } from './dishes.types.js';

/**
 * El error de la API y el `fetch` común viven en `api/http.ts` desde T-044, cuando el login
 * necesita lo mismo que los platos (leer el cuerpo y traducir el fallo a `ApiError` con su
 * `code`). Desde T-046 las llamadas pasan por `api/client.ts`, que es el que añade
 * `Authorization`, el `Accept-Language` y la renovación del access. Este módulo ya no declara
 * nada de eso; solo habla de platos.
 *
 * **El `acceptLanguage` sigue siendo un parámetro y no lo pone el wrapper**, porque el idioma
 * va también en la `queryKey` de TanStack Query (T-031): si el wrapper lo leyera solo de `i18n`,
 * la clave y la cabecera podrían acabar tomando decisiones distintas y la caché devolvería la
 * traducción de otro idioma. Pasándolo explícito, quien pide es quien dice qué idioma quiere, y
 * la clave y la petición no pueden separarse.
 */

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
  (await apiRequest('/api/dishes', {
    headers: { 'Accept-Language': acceptLanguage },
    signal,
  })) as ApiDishesResponse;

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
  (await apiRequest(`/api/dishes/${id}`, {
    headers: { 'Accept-Language': acceptLanguage },
    signal,
  })) as ApiDishResponse;
