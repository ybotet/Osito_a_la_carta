import pino from 'pino';

const LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

const DEFAULT_LOG_LEVEL: LogLevel = 'info';

const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

const resolveLogLevel = (): LogLevel => {
  const raw = process.env.LOG_LEVEL;

  if (raw === undefined) {
    return DEFAULT_LOG_LEVEL;
  }

  return isLogLevel(raw) ? raw : DEFAULT_LOG_LEVEL;
};

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: resolveLogLevel(),
  ...(isProduction
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
