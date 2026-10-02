import type { Request } from 'express';
import { z } from 'zod';

/**
 * Lee el header `Accept-Language`. Express lo tipa como `string | string[] |
 * undefined` porque un header puede repetirse, y en ese caso basta con el
 * primero.
 */
const readAcceptLanguage = (req: Request): string | undefined => {
  const header = req.headers['accept-language'];

  return Array.isArray(header) ? header[0] : header;
};

/**
 * Params de una ruta con `:id`. Centralizado porque todas las rutas de recurso
 * comparten la misma forma y el mismo criterio de validación.
 */
const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export { idParamSchema, readAcceptLanguage };
