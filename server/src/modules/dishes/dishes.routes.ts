import { Router } from 'express';
import { idParamSchema, readAcceptLanguage } from '../../shared/http.js';
import {
  createDish,
  deleteDish,
  getDish,
  listDishes,
  purgeDish,
  setDishAvailability,
  updateDish,
} from './dishes.service.js';
import {
  availabilityBodySchema,
  createDishBodySchema,
  updateDishBodySchema,
} from './dishes.schema.js';

const dishesRouter = Router();

dishesRouter.get('/dishes', (req, res) => {
  res.json(listDishes(readAcceptLanguage(req)));
});

dishesRouter.get('/dishes/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  res.json(getDish(id, readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces el alta es publica.
dishesRouter.post('/dishes', (req, res) => {
  const body = createDishBodySchema.parse(req.body);

  res.status(201).json(createDish(body, readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces la edicion es publica.
dishesRouter.put('/dishes/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateDishBodySchema.parse(req.body);

  res.json(updateDish(id, body, readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces el borrado es publico.
dishesRouter.delete('/dishes/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  deleteDish(id);

  // 204 sin cuerpo: se usa `end()` y no `json()`, que emitiría un body que la
  // especificación del status prohíbe.
  res.status(204).end();
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces es publico.
dishesRouter.patch('/dishes/:id/availability', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { isAvailable } = availabilityBodySchema.parse(req.body);

  res.json(setDishAvailability(id, isAvailable, readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces es publico.
dishesRouter.delete('/dishes/:id/permanent', (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  purgeDish(id);

  res.status(204).end();
});

export { dishesRouter };

export default dishesRouter;
