import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
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

categoriesRouter.post('/categories', requireAdmin, (req, res) => {
  const body = createCategoryBodySchema.parse(req.body);

  res.status(201).json(createCategory(body, readAcceptLanguage(req)));
});

categoriesRouter.put('/categories/:id', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateCategoryBodySchema.parse(req.body);

  res.json(updateCategoryById(id, body, readAcceptLanguage(req)));
});

categoriesRouter.delete('/categories/:id', requireAdmin, (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  deleteCategory(id);

  // 204 sin cuerpo: se usa `end()` y no `json()`, que emitiría un body que la
  // especificación del status prohíbe. Por eso esta ruta no toca `Accept-Language`.
  res.status(204).end();
});

export { categoriesRouter };

export default categoriesRouter;
