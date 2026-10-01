import { env } from './config/index.js';
import express from 'express';
import { logger } from './logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { dishesRouter } from './modules/dishes/dishes.routes.js';

const app = express();

app.use('/api', healthRouter);
app.use('/api', dishesRouter);

app.listen(env.PORT, () => {
  logger.info(`Server starting on port ${env.PORT}`);
});

export { app };

export default app;
