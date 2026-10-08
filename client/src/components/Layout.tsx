import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useAuthStore } from '../store/auth';
import { Button } from './ui/button';

/**
   * Envoltorio de todas las páginas: el navbar arriba y el hueco donde se pinta la ruta
   * activa (T-033, con el navbar terminado en T-035).
   *
   * **Va como ruta padre en `main.tsx` y no envolviendo `<Routes>` a mano**, con `<Outlet />`
   * dentro y sin props. Es el patrón de `react-router` para un layout compartido: cada página
   * deja de decidir qué chrome lleva encima, y añadir una ruta nueva es añadir un `<Route>`
   * dentro y nada más.
   *
   * **Los enlaces del navbar son `Button` con `asChild` y un `Link` dentro**, no `Link` con
   * clases de botón a mano. Es la forma que `asChild` existe para: un `<button>` no puede
   * contener un enlace, así que la alternativa era copiar las clases del botón en cada enlace y
   * que se desincronizasen al primer cambio de variante.
   *
   * **El botón del carrito se habilitó en T-053**: `/cart` ya existe y funciona, así que el
   * enlace ya no lleva `disabled`. El de órdenes (`/orders`) es nuevo y va al historial de
   * pedidos (T-054).
   *
   * **El enlace de iniciar sesión es condicional (T-048).** Con sesión, lo sustituyen el email del
   * usuario y el botón de cerrar sesión, que están en `UserMenu`. La condición se decide aquí y en
   * `UserMenu` con el mismo criterio, para que no puedan contradecirse.
   */
const Layout = () => {
  const { t } = useTranslation();

  /**
   * Decide si se pinta el enlace de iniciar sesión. **Es el mismo criterio que usa `UserMenu`**
   * (`user` y `accessToken` los dos), y no un atajo: si los dos componentes decidieran distinto,
   * aparecería "Iniciar sesión" al lado del email de quien ya está dentro.
   *
   * Lee el estado del store y no un `useIsAuthenticated` importado, porque en `Layout` hace falta
   * además poder distinguir "sin sesión" de "con sesión" en el JSX.
   */
  const isAuthenticated = useAuthStore(
    (state) => state.user !== null && state.accessToken !== null,
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
          {/*
            Logo de la app: imagen + nombre. Enlazado a la portada ("/").
            La imagen está en /public/images/osito.jpg.
          */}
          <Link to="/" className="flex items-center gap-2 text-lg font-bold" aria-label={t('app.title')}>
            <img
              src="/images/osito.jpg"
              alt=""
              className="h-8 w-8 rounded-lg object-cover"
              aria-hidden="true"
            />
            <span>{t('app.title')}</span>
          </Link>

          <nav aria-label={t('nav.main')}>
            {/*
              `flex-wrap` porque en móvil el grupo de idioma y los tres enlaces no caben en una
              sola línea, y forzar el salto con un `hidden md:flex` escondería el selector de
              idioma justo en la pantalla más estrecha.
            */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/menu">{t('nav.menu')}</Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link to="/cart">{t('nav.cart')}</Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link to="/orders">{t('nav.orders')}</Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link to="/stats">{t('nav.stats')}</Link>
              </Button>

              {/*
                El enlace a `/login` se habilitó en T-044, cuando la ruta ya existía. Va como
                `Button asChild` con un `Link` dentro, igual que el del menú, para que hereden
                las mismas clases y no se desincronicen al cambiar el `Button`.

                **Solo se pinta sin sesión.** En T-048 este hueco pasó a ser condicional: con
                sesión lo sustituyen el email del usuario y el botón de cerrar sesión, que están
                en `UserMenu`. Mostrar "Iniciar sesión" junto al nombre de quien ya está dentro
                sería contradictorio, y un usuario que ve su email ya sabe que tiene sesión.
              */}
              {!isAuthenticated && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
              )}

              <UserMenu />

              <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <Outlet />
    </>
  );
};

export default Layout;
