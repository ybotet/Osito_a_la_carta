import { env } from './config/index.js';
import pino from 'pino';

const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
});

export { logger };

export default logger;
