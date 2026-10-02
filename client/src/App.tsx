import { useTranslation } from 'react-i18next';

/**
 * Texto fijo de la tarea T-030, para comprobar que `i18n.changeLanguage('ru')` cambia lo
 * que se ve sin recargar. Lo consume `App`, que es la página real.
 *
 * Los botones de idioma están aquí a propósito y no en un componente de navegación: son el
 * mecanismo de verificación del criterio de T-030, no una pieza de la interfaz final.
 */
function App() {
  const { t, i18n } = useTranslation();

  return (
    <main className="mt-10 flex flex-col items-center gap-6">
      <h1 className="text-center text-3xl font-bold">{t('app.title')}</h1>

      <nav className="flex gap-4">
        <button
          type="button"
          className="underline"
          onClick={() => void i18n.changeLanguage('es')}
        >
          {t('nav.menu')}
        </button>
        <button
          type="button"
          className="underline"
          onClick={() => void i18n.changeLanguage('ru')}
        >
          {t('nav.cart')}
        </button>
        <button
          type="button"
          className="underline"
          onClick={() => void i18n.changeLanguage('en')}
        >
          {t('nav.login')}
        </button>
      </nav>

      <section className="flex flex-col items-center gap-2 text-sm">
        <p>{t('menu.title')}</p>
        <p>{t('menu.loading')}</p>
        <p>{t('menu.empty')}</p>
        <p>{t('cart.add')}</p>
        <p>{t('cart.remove')}</p>
        <p>{t('cart.total')}</p>
        <p>{t('cart.checkout')}</p>
        <p>{t('nav.logout')}</p>
      </section>
    </main>
  );
}

export default App;
