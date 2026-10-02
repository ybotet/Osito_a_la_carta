import { Router } from 'express';
import { readAcceptLanguage } from '../../shared/http.js';
import { createCategory, listCategories } from './categories.service.js';
import { createCategoryBodySchema } from './categories.schema.js';

const categoriesRouter = Router();

categoriesRouter.get('/categories', (req, res) => {
  res.json(listCategories(readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces el alta es publica.
categoriesRouter.post('/categories', (req, res) => {
  const body = createCategoryBodySchema.parse(req.body);

  res.status(201).json(createCategory(body, readAcceptLanguage(req)));
});

export { categoriesRouter };

export default categoriesRouter;
