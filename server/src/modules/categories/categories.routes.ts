import { Router } from 'express';
import { idParamSchema, readAcceptLanguage } from '../../shared/http.js';
import {
  createCategory,
  listCategories,
  updateCategoryById,
} from './categories.service.js';
import {
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from './categories.schema.js';

const categoriesRouter = Router();

categoriesRouter.get('/categories', (req, res) => {
  res.json(listCategories(readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces el alta es publica.
categoriesRouter.post('/categories', (req, res) => {
  const body = createCategoryBodySchema.parse(req.body);

  res.status(201).json(createCategory(body, readAcceptLanguage(req)));
});

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces la edicion es publica.
categoriesRouter.put('/categories/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateCategoryBodySchema.parse(req.body);

  res.json(updateCategoryById(id, body, readAcceptLanguage(req)));
});

export { categoriesRouter };

export default categoriesRouter;
