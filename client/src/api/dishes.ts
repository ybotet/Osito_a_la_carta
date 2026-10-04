import { requestJson } from './http';
import type { ApiDishesResponse, ApiDishResponse } from './dishes.types.js';

/**
 * El error de la API y el `fetch` común viven en `api/http.ts` desde T-044, cuando el login
 * necesita lo mismo que los platos (leer el cuerpo y traducir el fallo a `ApiError` con su
 * `code`). Este módulo ya no los declara; solo habla de platos.
 *
 * **Las llamadas pasan `Accept-Language` como cabecera y no como parámetro suelto** porque el
 * idioma lo decide quien llama: el de la interfaz (`i18n.language`) y el del contenido tienen
 * que ser el mismo, o el usuario ve la pantalla en ruso con los platos en español.
 *
 * `requestJson` no añade `Authorization` todavía: eso es T-046.
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
  (await requestJson('/api/dishes', {
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
  (await requestJson(`/api/dishes/${id}`, {
    headers: { 'Accept-Language': acceptLanguage },
    signal,
  })) as ApiDishResponse;
