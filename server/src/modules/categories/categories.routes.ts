import { Router } from 'express';
import { readAcceptLanguage } from '../../shared/http.js';
import { listCategories } from './categories.service.js';

const categoriesRouter = Router();

categoriesRouter.get('/categories', (req, res) => {
  res.json(listCategories(readAcceptLanguage(req)));
});

export { categoriesRouter };

export default categoriesRouter;
