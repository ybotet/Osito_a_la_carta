import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import es from '../locales/es.json';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

/**
 * Los tres idiomas del proyecto. La lista está en la variable y no repartida por los
 * ficheros porque tiene que servir para dos cosas: los `resources` y la lista de idiomas
 * admitidos que se le pasa al detector. Si los sitios se separan, añadir un idioma obliga a
 * acordarse de los dos.
 *
 * **El orden es el orden de preferencia del proyecto** (español, ruso, inglés): el español
 * es el idioma por defecto de `users.preferred_lang` en el esquema y el fallback del
 * backend. El detector usa el primero de la lista que encuentre en el navegador.
 */
const LANGUAGES = ['es', 'ru', 'en'] as const;

const DEFAULT_LANGUAGE = 'es';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      ru: { translation: ru },
      en: { translation: en },
    },
    /**
     * Se importan los JSON en vez de usar `backend` para no abrir una petición HTTP por
     * idioma en el arranque. Las traducciones van en el bundle: son cuatro claves por
     * idioma y es lo que evita un waterfall de red antes de pintar nada.
     */
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...LANGUAGES],
    /**
     * `nonExplicitSupportedLngs` hace que `ru-RU` se resuelva a `ru` y no se descarte por
     * no estar en la lista. Sin esto, un navegador o un sistema en `es-419` se quedaría
     * sin traducción y caería al fallback, que es el mismo resultado pero saltándose los
     * idiomas intermedios. Es el equivalente en el cliente de lo que ya hace
     * `resolveLanguage` en `server/src/shared/language.ts`.
     */
    nonExplicitSupportedLngs: true,
    /**
     * **`localStorage` va antes que `navigator`** (decisión del dueño el 2026-10-02, en
     * T-033): si el usuario ya eligió idioma en la web, ese idioma gana aunque su navegador
     * diga otro. Es lo que piden el criterio de T-033 y el paso 2 del flujo de idioma de
     * SPEC §7.2.
     *
     * **El orden es una prioridad real, no un "usa el otro si este no está".**
     * `detect()` del detector **concatena** lo que encuentra en el orden dado y i18next se
     * queda con el primer idioma de esa lista que soporte (`getBestMatchFromCodes`). Con
     * `navigator` delante, `localStorage` no llegaría a mirarse nunca, porque
     * `navigator.language` siempre existe; medido en T-033, además, el idioma descartado
     * llegaba a **escribirse encima** del que el usuario había elegido.
     *
     * Sin elección guardada manda el navegador, y si el navegador tampoco dice nada,
     * `fallbackLng`. La clave es `i18nextLng`, el `lookupLocalStorage` por defecto del
     * paquete; `caches` es lo que hace que `changeLanguage` la escriba sola.
     */
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      /**
       * React ya escapa al renderizar, y escapar dos veces rompería los textos con
       * acentos o apóstrofos en lugar de arreglarlos. Es la opción que react-i18next
       * recomienda explícitamente.
       */
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export { i18n, LANGUAGES, DEFAULT_LANGUAGE };
