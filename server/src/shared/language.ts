import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
} from '../modules/dishes/dishes.schema.js';
import type { Language } from '../modules/dishes/dishes.schema.js';

export { DEFAULT_LANGUAGE, LANGUAGES };

export type { Language };

const isSupportedLanguage = (value: string): value is Language =>
  (LANGUAGES as readonly string[]).includes(value);

/**
 * Resuelve el idioma de la petición a partir del header `Accept-Language`.
 *
 * El header **no** es un idioma, es una lista ponderada: los navegadores mandan
 * `es-ES,es;q=0.9,en;q=0.8`. Por eso se parte por comas, se lee el peso `q=` de cada
 * entrada, se descartan los `q=0` (que significan "no lo quiero") y se ordena por peso
 * descendente. El subtag se recorta antes del guion, de modo que `ru-RU` resuelve a `ru`.
 * Si nada coincide con un idioma soportado, cae al idioma por defecto.
 */
const resolveLanguage = (header: string | undefined): Language => {
  if (header === undefined) {
    return DEFAULT_LANGUAGE;
  }

  const preferred = header
    .split(',')
    .map((part) => {
      const [rawTag = '', ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith('q='));

      const parsed =
        quality === undefined ? 1 : Number.parseFloat(quality.slice(2));

      return {
        tag: rawTag.trim().toLowerCase(),
        quality: Number.isNaN(parsed) ? 0 : parsed,
      };
    })
    .filter((candidate) => candidate.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of preferred) {
    const [base = ''] = candidate.tag.split('-');

    if (isSupportedLanguage(base)) {
      return base;
    }
  }

  return DEFAULT_LANGUAGE;
};

export { resolveLanguage };
