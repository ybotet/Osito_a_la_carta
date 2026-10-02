/**
 * Forma de la respuesta de `GET /api/dishes`, tal y como la devuelve el backend.
 *
 * El backend manda el envoltorio `{ language, dishes }` y `language` es el idioma con el
 * que resolvió la petición, no un dato del plato. Aquí se tipa porque el cliente no tiene
 * ninguna otra forma de saber si lo que ve es la traducción o el original.
 *
 * Solo se declaran los campos que esta página usa. El endpoint devuelve también
 * `category` con `id`, `slug` y `name` ya localizado, que es lo que necesita T-031/T-032
 * para agrupar el menú; se incluye ya para no tener que ampliar el tipo al llegar.
 *
 * Vive en `types.ts` y no en el fichero que hace el `fetch`: si compartieran nombre, el
 * `import type` del propio módulo se resolvería a sí mismo y TypeScript no encontraría los
 * tipos. Es un error silencioso hasta que aparece el `TS2459`.
 */
export type ApiCategory = {
  id: number;
  slug: string;
  name: string;
};

export type ApiDish = {
  id: number;
  imageUrl: string;
  price: number;
  name: string;
  description: string;
  ingredients: string;
  category: ApiCategory;
};

export type ApiDishesResponse = {
  language: string;
  dishes: ApiDish[];
};

/**
 * Forma de la respuesta de `GET /api/dishes/:id`.
 *
 * **El envoltorio es el mismo que el del listado**, `{ language, ... }`, y no un objeto pelado:
 * es la convención que fijó la decisión arquitectónica "los endpoints de listado devuelven
 * `{ language, data }`". El backend lo construye en `getDish`, que devuelve
 * `{ language, dish }`.
 *
 * `dish` es el mismo `ApiDish` del listado, porque ambos salen del mismo `toResponse` del
 * servidor y por eso los dos tipos no pueden divergir.
 */
export type ApiDishResponse = {
  language: string;
  dish: ApiDish;
};
