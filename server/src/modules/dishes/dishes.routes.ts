import { Router } from 'express';
import { z } from 'zod';
import { createDish, getDish, listDishes } from './dishes.service.js';
import { createDishBodySchema } from './dishes.schema.js';

const dishParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const readAcceptLanguage = (header: string | string[] | undefined) =>
  Array.isArray(header) ? header[0] : header;

const dishesRouter = Router();

dishesRouter.get('/dishes', (req, res) => {
  res.json(listDishes(readAcceptLanguage(req.headers['accept-language'])));
});

dishesRouter.get('/dishes/:id', (req, res) => {
  const { id } = dishParamsSchema.parse(req.params);

  res.json(getDish(id, readAcceptLanguage(req.headers['accept-language'])));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces el alta es publica.
dishesRouter.post('/dishes', (req, res) => {
  const body = createDishBodySchema.parse(req.body);

  res
    .status(201)
    .json(createDish(body, readAcceptLanguage(req.headers['accept-language'])));
});

export { dishesRouter };

export default dishesRouter;
