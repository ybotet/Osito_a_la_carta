import { Router } from 'express';
import { listDishes } from './dishes.service.js';

const dishesRouter = Router();

dishesRouter.get('/dishes', (req, res) => {
  const acceptLanguage = req.headers['accept-language'];

  res.json(
    listDishes(
      Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage,
    ),
  );
});

export { dishesRouter };

export default dishesRouter;
