import { z } from 'zod';
import { loadEnvFile } from '../shared/project-paths.js';

const LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
] as const;

loadEnvFile();

const REQUIRED = 'Requerida';

const PLACEHOLDER_MARKERS = [
  'tudominio',
  'cambia-esto',
  'cambia-esto-otro',
  'changeme',
  'change-me',
  'placeholder',
  'no-reply@tudominio.com',
] as const;

const isProductionEnv = process.env.NODE_ENV === 'production';

const hasPlaceholder = (value: string): boolean =>
  isProductionEnv &&
  PLACEHOLDER_MARKERS.some((marker) => value.toLowerCase().includes(marker));

const rejectPlaceholder = (value: string): boolean => !hasPlaceholder(value);

const PLACEHOLDER_MESSAGE =
  'Tiene el valor de ejemplo de .env.example. Genera uno real con: openssl rand -hex 32';

const emailWithOptionalName = z
  .string({ required_error: REQUIRED })
  .min(3)
  .refine(
    (value) => {
      const email = value.includes('<')
        ? value.slice(value.indexOf('<') + 1, value.indexOf('>'))
        : value;
      return z.string().email().safeParse(email.trim()).success;
    },
    {
      message:
        'Debe ser un email valido, opcionalmente con formato "Nombre <email>"',
    },
  )
  .transform((value) => ({
    raw: value,
    email: (value.includes('<')
      ? value.slice(value.indexOf('<') + 1, value.indexOf('>'))
      : value
    ).trim(),
  }));

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

  DATABASE_URL: z.string({ required_error: REQUIRED }).min(1, {
    message: 'Requerida: ruta del archivo SQLite',
  }),

  JWT_SECRET: z
    .string({ required_error: REQUIRED })
    .min(32, { message: 'Debe tener al menos 32 caracteres' })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),
  JWT_REFRESH_SECRET: z
    .string({ required_error: REQUIRED })
    .min(32, { message: 'Debe tener al menos 32 caracteres' })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),

  MAILGUN_API_KEY: z
    .string({ required_error: REQUIRED })
    .min(1, { message: REQUIRED })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),
  MAILGUN_DOMAIN: z
    .string({ required_error: REQUIRED })
    .min(1, { message: REQUIRED })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),
  MAILGUN_FROM: emailWithOptionalName.refine(
    (value) => rejectPlaceholder(value.raw),
    { message: PLACEHOLDER_MESSAGE },
  ),
  CHEF_EMAIL: z
    .string({ required_error: REQUIRED })
    .email({ message: 'Debe ser un email valido' })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),

  TELEGRAM_BOT_TOKEN: z
    .string({ required_error: REQUIRED })
    .min(1, { message: REQUIRED })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),
  TELEGRAM_CHAT_ID: z
    .string({ required_error: REQUIRED })
    .min(1, { message: REQUIRED })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),
});

const formatIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
    .join('\n');

const parseEnv = (): z.infer<typeof envSchema> => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    process.stderr.write(
      [
        '',
        'ERROR: Variables de entorno invalidas o faltantes.',
        '',
        formatIssues(result.error),
        '',
        'Copia .env.example a .env y completa los valores.',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }

  return result.data;
};

const parsed = parseEnv();

const env = {
  ...parsed,
  MAILGUN_FROM_EMAIL: parsed.MAILGUN_FROM.email,
  isProduction: parsed.NODE_ENV === 'production',
} as const;

export { env, envSchema };

export type Env = z.infer<typeof envSchema> & {
  MAILGUN_FROM_EMAIL: string;
  isProduction: boolean;
};

export default env;
