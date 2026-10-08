import { z } from 'zod';

/**
 * Body para registrar una página vista.
 * `dishId` es opcional porque no todas las páginas son de platos (ej. /menu, /orders).
 * `path` es obligatorio para saber qué ruta visitó el usuario.
 */
export const pageViewBodySchema = z.object({
  dishId: z.number().int().positive().optional(),
  path: z.string().min(1),
});

export type PageViewBody = z.infer<typeof pageViewBodySchema>;