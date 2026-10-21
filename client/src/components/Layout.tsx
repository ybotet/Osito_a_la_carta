import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useAuthStore, useAuthHydrated } from '../store/auth';
import { Button } from './ui/button';
import ThemeSwitcher from './ThemeSwitcher';

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
type NavButtonProps = {
  onClick?: () => void;
  full?: boolean;
};

/**
 * Enlaces del navbar extraídos en una función para reutilizar entre el menú
 * de escritorio (inline) y el panel de móvil (colapsable). El `onClick`
 * opcional cierra el menú móvil tras navegar. `full` ajusta ancho y alineación
 * para botones de ancho completo en el panel móvil.
 */
const NavLinks = ({ onClick, full = false }: NavButtonProps) => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(
    (state) => state.user !== null && state.accessToken !== null,
  );
  const isAdmin = useAuthStore((state) => state.user?.role) === 'admin';

  const buttonClass = full ? 'w-full justify-start' : '';

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={onClick}
      >
        <Link to="/menu">{t('nav.menu')}</Link>
      </Button>

      {isAuthenticated && (
        <>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={onClick}
          >
            <Link to="/orders">{t('nav.orders')}</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={onClick}
          >
            <Link to="/stats">{t('nav.stats')}</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={onClick}
          >
            <Link to="/cart">{t('nav.cart')}</Link>
          </Button>
        </>
      )}

      {isAdmin && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={buttonClass}
          onClick={onClick}
        >
          <Link to="/admin/orders">{t('nav.admin')}</Link>
        </Button>
      )}

      {isAdmin && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={buttonClass}
          onClick={onClick}
        >
          <Link to="/admin/categories">{t('nav.adminCategories')}</Link>
        </Button>
      )}

      {isAdmin && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={buttonClass}
          onClick={onClick}
        >
          <Link to="/admin/users">{t('nav.adminUsers')}</Link>
        </Button>
      )}

      {!isAuthenticated && (
        <>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={onClick}
          >
            <Link to="/orders">{t('nav.guestOrders')}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={onClick}
          >
            <Link to="/cart">{t('nav.cart')}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={onClick}
          >
            <Link to="/login">{t('nav.login')}</Link>
          </Button>
        </>
      )}
    </>
  );
};

const Layout = () => {
  const { t } = useTranslation();

  /**
   * Espera a que el store de auth termine de rehidratar de localStorage.
   * Evita flashes de contenido (navbar/login) mientras el store se inicializa.
   */
  const isHydrated = useAuthHydrated();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b bg-background/95 backdrop-blur ${
          isHydrated ? '' : 'invisible h-0 overflow-hidden pointer-events-none'
        }`}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
          {/*
            Logo de la app: imagen + nombre. Enlazado a la portada ("/").
            La imagen está en /public/images/osito.jpg.
          */}
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold"
            aria-label={t('app.title')}
          >
            <img
              src="/images/osito.jpg"
              alt=""
              className="h-8 w-8 rounded-lg object-cover"
              aria-hidden="true"
            />
            <span>{t('app.title')}</span>
          </Link>

          {/*
            Botón hamburguesa: visible solo en móvil (md:hidden). En desktop
            el menú se muestra inline. `size="icon"` con `h-10 w-10` asegura
            40 px de touch target en móvil.
          */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:hidden"
            aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Menú de escritorio: oculto en móvil */}
          <nav aria-label={t('nav.main')} className="hidden md:block">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <NavLinks />
              <UserMenu />
              <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </nav>
        </div>

        {/*
          Panel móvil: se muestra encima del resto cuando `isMenuOpen`.
          Cada enlace cierra el menú al navegar.
        */}
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t bg-background/95 backdrop-blur"
          >
            <div className="flex flex-col gap-2 p-4">
              <div className="flex flex-col gap-1">
                <NavLinks full onClick={() => setIsMenuOpen(false)} />
              </div>

              <div className="flex items-center gap-2 py-2">
                <UserMenu />
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        )}
      </header>

      <Outlet />
    </>
  );
};

export default Layout;
