import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ApiDish } from '../api/dishes.types';

/**
 * Clave del `localStorage`. Distinta de la de la sesión (`osito-auth`) y de la del idioma
 * (`i18nextLng`), porque vaciar el carrito no puede cerrar la sesión de quien está comprando.
 */
const STORAGE_KEY = 'osito-cart';

/**
 * Lo que el enunciado llama `dish` al añadir: **el plato entero de la API, no un `dishId`.**
 *
 * El carrito guarda `name`, `price` e `imageUrl` **para poder pintar la línea sin volver a
 * pedir nada**. Con solo el `dishId` habría que pedir el plato entero para poder escribir "Sopa
 * x2" y cuánto cuesta, y en T-053 eso serían N peticiones para pintar N líneas.
 */
type AddableDish = Pick<ApiDish, 'id' | 'name' | 'price' | 'imageUrl'>;

/**
 * Una línea del carrito.
 *
 * **`name` e `imageUrl` son una copia del momento en que se añadió, y eso tiene una
 * consecuencia visible**: si el plato se añadió en español y el usuario cambia a ruso, el
 * carrito enseña el nombre en español. Es aceptable y es lo que espera un carrito real, pero
 * está anotado porque el día que alguien se queje de "el carrito sale en español" ya está
 * explicado aquí.
 *
 * **`price` es solo para pintar.** El precio que se cobra lo recalcula el backend en T-051
 * ("calcula total con precios actuales") y el pedido solo manda `{ dishId, quantity }`. Si el
 * chef cambia un precio entre que el usuario mete el plato y confirma, se cobra el nuevo: lo que
 * se guarda aquí nunca es la fuente del total.
 */
type CartItem = {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

/**
 * La cantidad mínima de una línea. El enunciado de T-051 pide `quantity: number min 1`, así que
 * una cantidad de 0 o negativa **no es representable**: por eso `updateQuantity` quita la línea
 * en vez de guardarla con 0. Si el carrito guardara `{ dishId, quantity: 0 }`, el Confirmar
 * tendría que filtrar líneas antes de mandar el pedido, y ese filtro viviría en la página en vez
 * de estar garantizado por el tipo.
 */
const MIN_QUANTITY = 1;

/**
 * El estado vacío. Es una función y no un objeto compartido, por el mismo motivo que en el store
 * de sesión: `persist` la reutiliza para rehidratar, y un objeto constante podría quedar mutado
 * por un `set` y entonces la rehidratación escribiría encima con valores ya tocados.
 */
const initialItems = (): CartItem[] => [];

type CartState = {
  items: CartItem[];
  addItem: (dish: AddableDish) => void;
  removeItem: (dishId: number) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: initialItems(),

      /**
       * **Suma si el plato ya está, y no añade una línea nueva.** Un carrito con dos líneas del
       * mismo plato no se puede representar en la tabla de `order_items` sin decidir cuál de las
       * dos gana, así que la regla es una línea por plato y esta acción sube la cantidad.
       *
       * **Al reañadir se refrescan `name`, `price` e `imageUrl` con los del plato que llega.**
       * Reanadir un plato es decir "quiero este, ahora, como lo veo": si el nombre o el precio
       * cambiaron desde la primera vez, la línea se queda con lo viejo y el carrito enseña algo
       * que ya no existe. Y es el camino natural para que un carrito construido en español pase
       * a enseñar los nombres en ruso al cambiar de idioma.
       */
      addItem: (dish) =>
        set((state) => {
          const existing = state.items.find((item) => item.dishId === dish.id);

          if (existing === undefined) {
            return {
              items: [
                ...state.items,
                {
                  dishId: dish.id,
                  name: dish.name,
                  price: dish.price,
                  quantity: MIN_QUANTITY,
                  imageUrl: dish.imageUrl,
                },
              ],
            };
          }

          return {
            items: state.items.map((item) =>
              item.dishId === dish.id
                ? {
                    ...item,
                    name: dish.name,
                    price: dish.price,
                    imageUrl: dish.imageUrl,
                    quantity: item.quantity + 1,
                  }
                : item,
            ),
          };
        }),

      /**
       * Quita la línea entera. `removeItem` no toca `quantity`, que es lo de
       * `updateQuantity(dishId, 0)`: los dos caminos llegan al mismo sitio y quedan los dos
       * porque los dos los va a usar alguien (el "quitar" de la página del carrito y el "bajar a
       * cero" de los controles de cantidad).
       */
      removeItem: (dishId) =>
        set((state) => ({
          items: state.items.filter((item) => item.dishId !== dishId),
        })),

      /**
       * Fija la cantidad de una línea, y **quita la línea si la cantidad es menor que 1**.
       *
       * Es la regla que hace que `items` solo pueda contener cantidades válidas para T-051, en
       * vez de dejar que cada consumidor filtre. Los controles de cantidad de T-053 generan
       * precisamente esta llamada cuando el usuario baja de 1, que es el momento en que la
       * línea desaparece de la lista; que la disappearance venga de aquí y no de un `if` en el
       * componente hace que sea verdad también desde cualquier otro sitio que use el store.
       *
       * Un `dishId` que no está en el carrito no hace nada: es un "pon esta cantidad" sobre una
       * línea que no existe, y no tiene sentido inventarse el plato a partir de un id.
       */
      updateQuantity: (dishId, quantity) =>
        set((state) => {
          if (state.items.every((item) => item.dishId !== dishId)) {
            return state;
          }

          if (quantity < MIN_QUANTITY) {
            return {
              items: state.items.filter((item) => item.dishId !== dishId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.dishId === dishId ? { ...item, quantity } : item,
            ),
          };
        }),

      /**
       * Vacía el carrito entero.
       *
       * Se llama después de confirmar el pedido (T-053), **no antes**: si el `POST /api/orders`
       * falla, el carrito tiene que seguir lleno para que el usuario pueda reintentar sin
       * volver a montar el pedido a mano.
       */
      clearCart: () => {
        set({ items: initialItems() });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      /**
       * Se persiste **solo `items`**, no el estado entero. Las acciones no se guardarían igual
       * porque `JSON.stringify` las omite, pero dejarlo escrito evita que alguien añada un campo
       * derivado y acabe persistiéndolo sin darse cuenta.
       */
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/**
 * Suma las cantidades de todas las líneas: el número de platos, no el de líneas.
 *
 * **Es un selector y no un campo del estado**, por la misma razón que `useIsAuthenticated` en
 * el store de sesión: guardado en el estado habría que mantenerlo sincronizado a mano en cada
 * `set`, y se quedaría viejo en cuanto hubiera una tercera forma de cambiar el carrito. Además
 * un total guardado es justo el tipo de dato que sobrevive mal a una rehidratación desde
 * `localStorage` con datos de una versión anterior.
 *
 * Devuelve un número, no un array: un selector que devolviera un objeto o un array nuevo en cada
 * llamada daría una referencia distinta en cada render y el componente se re-renderizaría en
 * bucle. Por eso los dos selectores devuelven primitivos.
 */
const selectTotalItems = (state: CartState): number =>
  state.items.reduce((total, item) => total + item.quantity, 0);

/**
 * Suma `price * quantity` de todas las líneas.
 *
 * **Redondea a céntimos.** El precio viene de SQLite por `real`, así que es coma flotante: sin
 * redondear, tres unidades de 11,90 darían 35.700000000000003 y el carrito enseñaría un número
 * que no se lo cree nadie. `Math.round(... * 100) / 100` quita el ruido manteniendo el valor que
 * el backend va a cobrar, que T-051 calcula sobre los mismos precios.
 *
 * Con el carrito vacío devuelve **0**, no `NaN`: un carrito vacío tiene un total de cero y es lo
 * que la página del carrito enseñará.
 */
const selectTotalPrice = (state: CartState): number => {
  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return Math.round(total * 100) / 100;
};

export { selectTotalItems, selectTotalPrice };
export type { CartItem, CartState, AddableDish };
