import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { BadRequestError } from '../../shared/errors.js';
import { idParamSchema, readAcceptLanguage } from '../../shared/http.js';
import {
  createDish,
  deleteDish,
  getDish,
  listDishes,
  purgeDish,
  setDishAvailability,
  setDishImage,
  updateDish,
} from './dishes.service.js';
import {
  availabilityBodySchema,
  createDishBodySchema,
  updateDishBodySchema,
} from './dishes.schema.js';
import {
  toStoredImageUrl,
  toUploadError,
  uploadDishImage,
} from './dishes.uploads.js';

const dishesRouter = Router();

// Las dos lecturas siguen siendo públicas a propósito desde T-043: el menú es de cualquiera,
// también sin sesión.
dishesRouter.get('/dishes', (req, res) => {
  res.json(listDishes(readAcceptLanguage(req)));
});

dishesRouter.get('/dishes/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  res.json(getDish(id, readAcceptLanguage(req)));
});

dishesRouter.post('/dishes', requireAdmin, (req, res) => {
  const body = createDishBodySchema.parse(req.body);

  res.status(201).json(createDish(body, readAcceptLanguage(req)));
});

dishesRouter.put('/dishes/:id', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateDishBodySchema.parse(req.body);

  res.json(updateDish(id, body, readAcceptLanguage(req)));
});

dishesRouter.delete('/dishes/:id', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  deleteDish(id);

  // 204 sin cuerpo: se usa `end()` y no `json()`, que emitiría un body que la
  // especificación del status prohíbe.
  res.status(204).end();
});

dishesRouter.patch('/dishes/:id/availability', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { isAvailable } = availabilityBodySchema.parse(req.body);

  res.json(setDishAvailability(id, isAvailable, readAcceptLanguage(req)));
});

/**
 * `multipart/form-data` con un único fichero en el campo `image`. Es la **única** ruta del
 * proyecto que no recibe JSON: `express.json()` no lo lee, y por eso multer va como
 * middleware explícito en esta ruta y no globalmente.
 *
 * **El error de multer se pasa a `next()` y no se lanza aquí.** Este callback lo ejecuta
 * multer de forma asíncrona, cuando `diskStorage` ha terminado de escribir y decide abortar,
 * y fuera de él no está el `try/catch` que Express pone alrededor de la llamada al
 * middleware: un `throw` ahí es una excepción sin manejar que tumba el proceso. Por eso
 * `toUploadError` devuelve el error en vez de lanzarlo, y por eso el 400 llega al cliente en
 * vez de un `ECONNRESET`. El 404 y el 400 del handler de abajo sí se lanzan, porque ese
 * código corre dentro del `try/catch` de Express, como el resto de handlers del proyecto.
 *
 * `req.resume()` descarta el resto del cuerpo antes de responder: al abortar, multer deja
 * bytes sin leer en el socket, y sin vaciarlos Node cierra la conexión en vez de enviar la
 * respuesta.
 */
dishesRouter.post(
  '/dishes/:id/image',
  requireAdmin,
  (req, res, next) => {
    uploadDishImage.single('image')(req, res, (error?: unknown) => {
      if (error !== undefined && error !== null) {
        req.resume();
        next(toUploadError(error));

        return;
      }

      next();
    });
  },
  (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    if (req.file === undefined) {
      // Cubre los dos casos que dejan el `req.file` vacío y que desde aquí no se pueden
      // separar: que no venga fichero, o que venga con un tipo que el `fileFilter` rechaza
      // (multer termina sin error en los dos casos). El `code` es el mismo porque la
      // diferencia es de diagnóstico, no de manejo: en ambos hay que volver a mandar la
      // imagen y no reintentar.
      throw new BadRequestError(
        'Se esperaba un unico fichero de imagen (jpeg, png, webp o avif) en el campo "image"',
        'IMAGE_REQUIRED',
      );
    }

    const imageUrl = toStoredImageUrl(req.file.filename);

    res.status(200).json(setDishImage(id, imageUrl, readAcceptLanguage(req)));
  },
);

dishesRouter.delete('/dishes/:id/permanent', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  purgeDish(id);

  res.status(204).end();
});

export { dishesRouter };

export default dishesRouter;
