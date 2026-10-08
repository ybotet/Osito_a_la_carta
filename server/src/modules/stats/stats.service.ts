import { insertPageView } from './stats.repository.js';
import { pageViewBodySchema, type PageViewBody } from './stats.schema.js';
import { BadRequestError } from '../../shared/errors.js';

/**
 * Registra una página vista.
 *
 * Endpoint público: no requiere autenticación, pero si hay sesión válida
 * registra el `userId` del usuario. `dishId` es opcional.
 * Devuelve 204 sin body.
 */
const recordPageView = (
  userId: number | null,
  body: PageViewBody,
): void => {
  const parsed = pageViewBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestError(
      'Body inválido',
      'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors,
    );
  }

  const { dishId, path } = parsed.data;

  insertPageView({
    userId,
    dishId: dishId ?? null,
    path,
    viewedAt: Math.floor(Date.now() / 1000),
  });
};

export { recordPageView };