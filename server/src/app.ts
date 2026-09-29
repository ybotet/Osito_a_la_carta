import express from 'express';
import { logger } from './logger.js';

const PORT = process.env.PORT ?? '3000';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Server starting on port ${PORT}`);
});

export { app };

export default app;
