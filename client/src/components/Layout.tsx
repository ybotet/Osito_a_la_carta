import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
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
 * **Los enlaces van a las rutas que ya existen.** `/menu`, `/login` y `/register` son reales:
 * el carrito sigue **deshabilitado** en vez de apuntar a un `/cart` (T-053) que todavía no
 * existe, porque un enlace a una ruta inexistente es un 404 con el logo de la web y es peor
 * que un botón que se ve desactivado. Ese botón es lo que cambia T-053.
 */
const Layout = () => {
  const { t } = useTranslation();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
          {/*
            El "logo" es el nombre de la app enlazado a la portada. **No se inventa un logotipo de
            imagen**: el proyecto no tiene ningún asset de marca y descargable sería inventar la
            identidad visual, que es justo lo que se decide con el diseño, no aquí. Cuando exista
            el asset, este `Link` es el sitio donde va.
          */}
          <Link to="/" className="text-lg font-bold">
            {t('app.title')}
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

              <Button variant="ghost" size="sm" disabled>
                {t('nav.cart')}
              </Button>

              {/*
                El enlace a `/login` se habilitó en T-044, cuando la ruta ya existía. Va como
                `Button asChild` con un `Link` dentro, igual que el del menú, para que hereden
                las mismas clases y no se desincronicen al cambiar el `Button`.
              */}
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t('nav.login')}</Link>
              </Button>

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
