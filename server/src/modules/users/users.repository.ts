import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';

type UserRow = {
  id: number;
  email: string;
  role: 'customer' | 'admin';
  preferredLang: 'es' | 'ru' | 'en';
  name: string | null;
  phone: string | null;
  deliveryAddress: string | null;
  emailVerified: number;
  createdAt: number;
};

/**
 * Proyección pública de usuarios para el panel de admin: **nunca el `passwordHash`**.
 *
 * `passwordHash` se omite del `select` a propósito, como en `auth.repository.ts`. Aquí
 * es aún más importante: el panel de admin itera sobre múltiples usuarios, así que una
 * proyección incorrecta arrastraría el hash de todos en una sola respuesta.
 */
const publicUserProjection = {
  id: users.id,
  email: users.email,
  role: users.role,
  preferredLang: users.preferredLang,
  name: users.name,
  phone: users.phone,
  deliveryAddress: users.deliveryAddress,
  emailVerified: users.emailVerified,
  createdAt: users.createdAt,
};

/**
 * Lista todos los usuarios para el panel de admin.
 *
 * Devuelve la proyección pública (sin `passwordHash`), ordenada por `createdAt` descendente.
 */
const findAllUsers = (): UserRow[] =>
  db
    .select(publicUserProjection)
    .from(users)
    .orderBy((users) => users.createdAt)
    .all();

export { findAllUsers };
export type { UserRow };
