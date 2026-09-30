import { env } from './config/index.js';
import express from 'express';
import { logger } from './logger.js';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(env.PORT, () => {
  logger.info(`Server starting on port ${env.PORT}`);
});

export { app };

export default app;
