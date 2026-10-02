import { Router } from 'express';
import { idParamSchema, readAcceptLanguage } from '../../shared/http.js';
import {
  createCategory,
  deleteCategory,
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

// Falta `requireAdmin`: se conecta en T-043. Hasta entonces es publico.
categoriesRouter.delete('/categories/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  deleteCategory(id);

  // 204 sin cuerpo: se usa `end()` y no `json()`, que emitiría un body que la
  // especificación del status prohíbe. Por eso esta ruta no toca `Accept-Language`.
  res.status(204).end();
});

export { categoriesRouter };

export default categoriesRouter;
