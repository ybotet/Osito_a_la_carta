import { db } from '../../db/client.js';
import { pageViews } from '../../db/schema.js';

/**
 * Inserta una visita a página.
 *
 * `userId` puede ser `null` (usuario anónimo). `dishId` también puede ser `null`
 * (páginas que no son de un plato concreto). `path` es la ruta visitada.
 * `viewedAt` es el timestamp Unix en segundos.
 */
const insertPageView = (values: {
  userId: number | null;
  dishId: number | null;
  path: string;
  viewedAt: number;
}): void => {
  db.insert(pageViews)
    .values({
      userId: values.userId,
      dishId: values.dishId,
      path: values.path,
      viewedAt: values.viewedAt,
    })
    .run();
};

export { insertPageView };