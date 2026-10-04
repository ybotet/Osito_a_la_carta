import { createRequire } from 'node:module';
import { Router } from 'express';
import { findServerPackageJson } from '../../shared/project-paths.js';

const require = createRequire(import.meta.url);

/**
 * Versión del paquete, leída del `package.json` del workspace.
 *
 * **El `createRequire` se mantiene** (decisión de T-003: `resolveJsonModule` no vale aquí
 * porque el `package.json` está fuera de `include` y meterlo en el bundle lo congelaría en
 * el build), pero **la ruta ya no se cuenta por niveles**: se busca el `package.json`
 * subiendo desde el módulo. Con el `require('../../../package.json')` de siempre, el cambio de
 * `rootDir` de T-044 dejó el fichero dos niveles más abajo y el módulo de health no arrancaba
 * con `MODULE_NOT_FOUND` en el build de producción.
 *
 * Si el `package.json` no apareciera, `version` sería `null` en vez de tumbar el arranque: es
 * un dato informativo del health check y no merece la pena que tumbe el servidor.
 */
const packageJson = require(findServerPackageJson() ?? 'package.json') as {
  version?: string;
};

const STARTED_AT = Date.now();

const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
    version: packageJson.version ?? null,
  });
});

export { healthRouter };

export default healthRouter;
