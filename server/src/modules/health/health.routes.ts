import { createRequire } from 'node:module';
import { Router } from 'express';

const require = createRequire(import.meta.url);

const packageJson = require('../../../package.json') as { version: string };

const STARTED_AT = Date.now();

const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
    version: packageJson.version,
  });
});

export { healthRouter };

export default healthRouter;
