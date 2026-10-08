import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ApiAuthUser } from '../api/auth.types';

/**
 * Clave del `localStorage`. Va con prefijo de la app para no colisionar con nada del
 * `i18nextLng` (que usa `localStorage` desde T-030) ni con lo que escriba T-046.
 */
const STORAGE_KEY = 'osito-auth';

/**
 * Estado de sesión: lo mínimo para falar con la API y para pintar quién es.
 *
 * **Los tokens son parte del estado y no un cierre del `fetch`.** El backend no tiene
 * sesiones ni cookies (`POST /api/auth/login` devuelve el token en el cuerpo y nada más
 * crea cookie), así que el token vive en el cliente y tiene que poder leerse desde un sitio
 * que no sea un componente: T-046 lo necesitará para renovar el access, y eso se hace con
 * `useAuthStore.getState()`, no con un hook.
 */
type AuthState = {
  user: ApiAuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setSession: (
    user: ApiAuthUser,
    accessToken: string,
    refreshToken: string,
  ) => void;
  clearSession: () => void;
};

/**
 * El estado vacío. Es una función y no un objeto compartido porque `persist` lo reutiliza
 * para rehidratar: un objeto constante podría quedar mutado por un `set` y entonces la
 * rehidratación escribiría encima con valores ya tocados.
 */
const initialState = (): Pick<
  AuthState,
  'user' | 'accessToken' | 'refreshToken' | '_hasHydrated'
> => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  _hasHydrated: false,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState(),

      /**
       * Marca que la rehidratación ha terminado.
       */
      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      /**
       * Guarda una sesión completa de golpe y no campo a campo a propósito: los tres van
       * siempre juntos (los devuelve juntos el login) y una sesión con `user` pero sin token,
       * o al revés, no significa nada. Con una sola llamada no se puede quedar a medias.
       */
      setSession: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
      },

      /**
       * Vacía la sesión en memoria. **Con `persist`, esto también borra el `localStorage`**,
       * que es lo que hace falta para cerrar sesión de verdad: si solo se limpiara el estado,
       * al recargar la página volvería la sesión de antes.
       */
      clearSession: () => {
        set(initialState());
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      /**
       * Se persiste **solo el dato**, no el estado entero. Las acciones no se guardarían
       * igual porque `JSON.stringify` las omite, pero dejarlo escrito evita que alguien añada
       * un campo derivado y acabe persistiéndolo sin darse cuenta.
       */
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      /**
       * Callback que se ejecuta cuando la rehidratación termina.
       * Marca `_hasHydrated = true` para que la UI sepa que ya puede confiar en el estado.
       */
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/**
 * Selector que indica si la rehidratación ya terminó.
 * Útil para evitar flashes de contenido mientras el store se rehidrata de localStorage.
 */
export const useAuthHydrated = (): boolean =>
  useAuthStore((state) => state._hasHydrated);

/**
 * Si hay sesión: **derivado de `user` y `accessToken`, no un booleano en el estado.**
 *
 * El enunciado pedía `isAuthenticated` como derivado, y esto es lo que significa en Zustand:
 * se calcula donde se usa, con un selector, en vez de guardarlo. Guardarlo obligaría a
 * mantenerlo sincronizado a mano en `setSession` y en `clearSession`, y el día que se añada
 * una tercera forma de cambiar el estado el booleano se queda viejo y la interfaz creería que
 * hay sesión con el store vacío. Con el selector no hay nada que sincronizar.
 *
 * Exige **los dos**: hay `accessToken` sin `user` cuando el token se renovó (T-046) y hay
 * `user` sin token cuando la sesión se limpió a medias. Ninguno de los dos casos es una
 * sesión usable.
 */
export const useIsAuthenticated = (): boolean =>
  useAuthStore((state) => state.user !== null && state.accessToken !== null);
