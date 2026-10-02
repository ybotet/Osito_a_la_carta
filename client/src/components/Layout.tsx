import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Envoltorio de todas las páginas: el navbar arriba y el hueco donde se pinta la ruta
 * activa (T-033).
 *
 * **Va como ruta padre en `main.tsx` y no envolviendo `<Routes>` a mano**, con `<Outlet />`
 * dentro y sin props. Es el patrón de `react-router` para un layout compartido: cada página
 * deja de decidir qué chrome lleva encima, y añadir una ruta nueva es añadir un `<Route>`
 * dentro y nada más. Si mañana `/menu/:id` (T-034) necesita el navbar, ya lo tiene.
 *
 * **El navbar es mínimo a propósito.** Solo lleva el título, que enlaza a la portada, y el
 * selector de idioma. Los enlaces de menú, carrito y sesión están en `locales` desde T-030,
 * pero los que se pinten son cosa de T-035, que es la tarea de estilos base; añadirlos aquí
 * sería hacer diseño antes de que exista el criterio que lo fija.
 */
const Layout = () => {
  const { t } = useTranslation();

  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
          {/*
            `max-w-5xl` y `mx-auto` son los mismos que usa el `<main>` de `Menu`, para que el
            título del navbar y el título de la página queden en la misma columna vertical en
            lugar de empezar en sitios distintos.
          */}
          <Link to="/" className="text-lg font-bold">
            {t('app.title')}
          </Link>

          {/*
            El `<nav>` lleva el `aria-label` y no el `role="group"` del selector, porque lo
            que se quiere anunciar es "esto es la navegación del sitio", no "esto es un grupo
            de botones".
          */}
          <nav aria-label={t('nav.main')}>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <Outlet />
    </>
  );
};

export default Layout;
