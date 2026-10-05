import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../../config/index.js';
import { BadRequestError } from '../../shared/errors.js';

/**
 * Subida de imágenes de platos.
 *
 * **En la base de datos solo se guarda la ruta relativa** (`/uploads/dishes/x.jpg`), nunca la
 * URL absoluta. La razón es que el dominio es una variable de despliegue: si la columna
 * guardara `https://osito.tudominio.com/...`, cambiar de dominio obligaría a reescribir cada
 * fila. `toAbsoluteImageUrl` la compone en la respuesta a partir de `PUBLIC_ORIGIN`.
 *
 * Los ficheros van a `UPLOADS_DIR`, que en la VPS está **fuera del repositorio**
 * (`/var/www/osito/uploads`): un `git pull` o un build no los tocan y no se mezclan con el
 * código. Esa carpeta la sirve Nginx directamente con un `alias`, y `express.static` solo
 * hace falta en desarrollo, donde no hay Nginx delante.
 */

/** Prefijo público con el que se montan los ficheros. Es también el que va en la columna. */
const UPLOADS_URL_PREFIX = '/uploads';

const DISHES_SUBDIR = 'dishes';

/**
 * Formatos aceptados. La lista es explícita en vez de fiarse solo de la extensión porque
 * multer no inspecciona el contenido: el filtro decide por `mimetype`, que es lo que el
 * cliente declara, y por extensión, que es lo que acabará en el nombre del fichero.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
} as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * 5 MB. Es un límite deliberadamente holgado para una foto de móvil, y existe para que un
 * `multipart` gigante no llene el disco de la VPS: sin `limits.fileSize`, multer acepta lo
 * que le manden y el límite solo aparece en el código de Nginx, que es más tarde.
 */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const dishesDir = (): string => join(env.UPLOADS_DIR, DISHES_SUBDIR);

/**
 * Crea el directorio de destino si falta.
 *
 * Se hace de forma perezosa en vez de en el arranque porque el `UPLOADS_DIR` de la VPS lo
 * provisioning lo prepara (con su `user` de PM2), y un arranque que muere porque el
 * directorio aún no existe haría la app inarrancable justo después de un despliegue.
 */
const ensureDishesDir = (): string => {
  const dir = dishesDir();

  mkdirSync(dir, { recursive: true });

  return dir;
};

/**
 * Nombre del fichero: **UUID, nunca el nombre que envía el cliente.** El nombre original se
 * descarta porque es del cliente y pasar por él abriría la puerta a `../`, aChoques de
 * nombres y a extensiones ejecutables. Con UUID no hay colisión y el path no se puede
 * manipular. La extensión sale del `mimetype` declarado, que el filtro ya validó.
 */
const buildStoredFileName = (mimetype: string): string => {
  const extension = EXTENSION_BY_MIME[mimetype as AllowedMimeType] ?? '.bin';

  return `${randomUUID()}${extension}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      cb(null, ensureDishesDir());
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    cb(null, buildStoredFileName(file.mimetype));
  },
});

/**
 * Filtro de tipo. Rechaza con `cb(null, false)` en vez de lanzar `AppError` a propósito:
 * `fileFilter` se ejecuta **antes** de que multer abra el stream de destino, y lanzar desde
 * ahí deja el `req` a medio construir para un `errorHandler` que espera un error de la
 * aplicación.
 *
 * La consecuencia es que multer termina sin error y **sin** `req.file`, igual que si no
 * hubiera llegado nada. Por eso la ruta no puede distinguir los dos casos leyendo `req.file`,
 * y el mensaje tiene que cubrir ambos: se rechaza un tipo no permitido y no se trata como
 * "no has mandado nada". El 400 en sí sí es el correcto en los dos casos.
 */
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = (ALLOWED_MIME_TYPES as readonly string[]).includes(
    file.mimetype,
  );

  cb(null, allowed);
};

const uploadDishImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

/**
 * Convierte lo que hay en la columna en lo que se devuelve al cliente.
 *
 * Una ruta que ya es absoluta se devuelve tal cual: es lo que permite que el seed y los
 * registros existentes sigan apuntando a `placehold.co` sin migrarlos. Solo se antepone
 * `PUBLIC_ORIGIN` a las relativas, que son las que genera este módulo.
 */
const toAbsoluteImageUrl = (imageUrl: string): string => {
  if (!imageUrl.startsWith('/')) {
    return imageUrl;
  }

  return `${env.PUBLIC_ORIGIN}${imageUrl}`;
};

/**
 * Ruta pública (la que se guarda en la BD) a partir del nombre del fichero en disco.
 * Es la operación inversa de quitar `UPLOADS_DIR` al servir, y es el único punto donde se
 * compone el prefijo, para que no se disperse por el código.
 */
const toStoredImageUrl = (fileName: string): string =>
  `${UPLOADS_URL_PREFIX}/${DISHES_SUBDIR}/${fileName}`;

/**
 * Traduce los errores de multer a la capa de errores de la aplicación.
 *
 * Sin esto, `MulterError` no es un `AppError` y llegaría al `errorHandler` como un 500:
 * un fichero demasiado grande o de un tipo no permitido son **fallos del cliente** y tienen
 * que salir como 400, no como error del servidor.
 *
 * **Devuelve el error y no lo lanza, y es obligatorio que sea así.** Se llama dentro del
 * `callback` de multer, que corre de forma asíncrona (cuando `diskStorage` termina de
 * escribir y aborta): ahí fuera el `try/catch` que Express pone alrededor de la llamada al
 * middleware, que es lo que captura los `throw` de los handlers, y el proceso moría con la
 * excepción sin manejar. El cliente no recibía el 400 sino un `ECONNRESET` por la conexión
 * caída. Devolviéndolo, la ruta lo pasa a `next(error)` y sí llega al `errorHandler`.
 *
 * Un error que no es de multer (permisos, disco lleno) se devuelve tal cual para que lo
 * traduzca el `errorHandler` como un 500: no es culpa del cliente.
 */
const toUploadError = (error: unknown): unknown => {
  if (!(error instanceof multer.MulterError)) {
    return error;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new BadRequestError(
      'La imagen supera el tamano maximo de 5 MB',
      'IMAGE_TOO_LARGE',
      { maxBytes: MAX_FILE_SIZE_BYTES },
    );
  }

  if (
    error.code === 'LIMIT_FILE_COUNT' ||
    error.code === 'LIMIT_UNEXPECTED_FILE'
  ) {
    return new BadRequestError(
      'Se esperaba un unico archivo en el campo "image"',
      'INVALID_IMAGE_UPLOAD',
      { field: error.field },
    );
  }

  return new BadRequestError(
    'No se pudo procesar la imagen subida',
    'INVALID_IMAGE_UPLOAD',
    { reason: error.code },
  );
};

export {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UPLOADS_URL_PREFIX,
  ensureDishesDir,
  toAbsoluteImageUrl,
  toStoredImageUrl,
  toUploadError,
  uploadDishImage,
};
