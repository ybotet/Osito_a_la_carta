import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
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

dishesRouter.delete('/dishes/:id/permanent', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  purgeDish(id);

  res.status(204).end();
});

export { dishesRouter };

export default dishesRouter;
