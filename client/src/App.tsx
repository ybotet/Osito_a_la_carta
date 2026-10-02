import { useTranslation } from 'react-i18next';

/**
 * Portada y banco de pruebas de las claves de T-030.
 *
 * **Los botones de idioma que hubo aquí se fueron en T-033**: los sustituyó el
 * `LanguageSwitcher` del navbar, que además es el que persiste la elección. Lo que queda es
 * la lista de claves de los tres idiomas, que sirve para comprobar a simple vista que
 * `changeLanguage` repinta sin recargar.
 */
function App() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-col items-center gap-6 p-4">
      <h1 className="text-center text-3xl font-bold">{t('app.title')}</h1>

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
