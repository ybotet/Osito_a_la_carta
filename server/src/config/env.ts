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
  /**
   * Destinatarios del chef. Puede ser un solo email o una lista separada por
   * coma, para que el producto pueda notificar a más de una persona sin
   * cambiar el schema (el dueño pidió que el correo del chef fuera
   * yaiselbotet@gmail.com y que hubiera al menos otro). Se normaliza quitando
   * espacios y se descartan los vacíos.
   */
  CHEF_EMAIL: z
    .string({ required_error: REQUIRED })
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0),
    )
    .refine(
      (emails) =>
        emails.length > 0 &&
        emails.every((email) => z.string().email().safeParse(email).success),
      { message: 'Debe ser al menos un email valido' },
    ),

  TELEGRAM_BOT_TOKEN: z
    .string({ required_error: REQUIRED })
    .min(1, { message: REQUIRED })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),
  TELEGRAM_CHAT_ID: z
    .string({ required_error: REQUIRED })
    .min(1, { message: REQUIRED })
    .refine(rejectPlaceholder, { message: PLACEHOLDER_MESSAGE }),

  /**
   * Origen público del sitio, sin barra final. Es lo que convierte la ruta relativa que se
   * guarda en `dishes.image_url` (`/uploads/dishes/x.jpg`) en la URL absoluta que se
   * devuelve al cliente, de modo que cambiar de dominio es cambiar esta variable y no
   * reescribir filas.
   */
  PUBLIC_ORIGIN: z
    .string({ required_error: REQUIRED })
    .url({
      message: 'Debe ser una URL absoluta, p. ej. https://osito.tudominio.com',
    })
    .refine((value) => !value.endsWith('/'), {
      message: 'Sin barra final',
    }),

  /**
   * Directorio donde se escriben las imágenes subidas.
   *
   * **No tiene default a propósito.** El valor por defecto sería algo dentro del repo, y en
   * la VPS las imágenes tienen que vivir fuera del árbol del proyecto (`/var/www/osito/uploads`)
   * para que un despliegue no las borre y para que no se mezclen con el código. Obligar a
   * declararlo deja esa decisión explícita en el `.env` en vez de deducirla de dónde se
   * ejecuta el proceso.
   */
  UPLOADS_DIR: z.string({ required_error: REQUIRED }).min(1, {
    message: 'Requerida: directorio donde se guardan las imagenes',
  }),
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
