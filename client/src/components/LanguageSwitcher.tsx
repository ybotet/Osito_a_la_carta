import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../lib/i18n';
import { Button } from './ui/button';

/**
 * Selector de idioma del navbar (T-033).
 *
 * **Un botón por idioma, sobre el `Button` de shadcn que ya existía.** Se descartaron el
 * dropdown de shadcn y los `<select>`: el dropdown oficial es un wrapper sobre
 * `@radix-ui/react-dropdown-menu`, que el proyecto no tiene y que no se quiso añadir, y un
 * `<select>` nativo no deja marcar el activo con la variante del botón. Con tres botones se
 * cumple el criterio sin ninguna dependencia nueva y el idioma activo se ve de un vistazo.
 *
 * **La lista sale de `LANGUAGES`, no de un array escrito aquí.** Es la misma constante que
 * alimenta `supportedLngs` y los `resources`, así que añadir un idioma no obliga a acordarse
 * de este componente.
 *
 * **No hay `useEffect` ni escritura a mano en `localStorage`.** La persistencia la hace el
 * detector que ya está configurado en `lib/i18n.ts`: `changeLanguage` dispara
 * `cacheUserLanguage` y guarda en la clave `i18nextLng`. Si este componente escribiera
 * `localStorage` por su cuenta habría dos fuentes de verdad para el mismo dato.
 *
 * **El idioma activo se marca por dos vías y no por el color solo:** por la variante del
 * botón (`default` frente a `outline`) y por `aria-current`, que es lo que anuncia un lector
 * de pantalla. `lang` en cada botón hace que el nombre accesible se pronuncie en su propio
 * idioma, que es el motivo de que el nombre accesible sea un endónimo y no el código.
 */
const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  /**
   * `resolvedLanguage` y no `language`: con `nonExplicitSupportedLngs` el primero ya viene
   * resuelto a `es` / `ru` / `en`, mientras que el segundo puede ser `es-ES` si el detector
   * entregó el idioma del navegador sin resolver. Es la misma expresión que usa `Menu` para
   * el `Accept-Language`.
   */
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={t('language.label')}
    >
      {LANGUAGES.map((language) => {
        const isActive = language === activeLanguage;

        return (
          <Button
            key={language}
            type="button"
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            aria-current={isActive}
            lang={language}
            /**
             * Lo que se ve es el código ISO en mayúsculas (`ES`), que es idéntico en los
             * tres idiomas y por eso no necesita traducción. Lo que se **anuncia** es el
             * endónimo desde `t()`, porque "ES" a secas no le dice nada a quien usa un
             * lector de pantalla.
             */
            aria-label={t(`language.${language}`)}
            // `void` porque `changeLanguage` devuelve una promesa: el click no la espera y
            // un rechazo sin capturar se comería como un error no manejado en consola.
            onClick={() => void i18n.changeLanguage(language)}
          >
            {language.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
