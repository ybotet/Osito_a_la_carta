import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { logger } from '../../logger.js';
import { db, sqlite } from '../client.js';
import { users } from '../schema.js';

const ADMIN_EMAIL = 'chef@osito.com';
const ADMIN_PASSWORD = 'Osito*123456';
const BCRYPT_ROUNDS = 10;

const seedAdmin = (): void => {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  db.transaction((tx) => {
    const existing = tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .get();

    if (existing !== undefined) {
      tx.update(users)
        .set({ passwordHash, role: 'admin', preferredLang: 'es' })
        .where(eq(users.id, existing.id))
        .run();
      return;
    }

    tx.insert(users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        preferredLang: 'es',
      })
      .run();
  });

  const admin = db
    .select({
      email: users.email,
      role: users.role,
      preferredLang: users.preferredLang,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .get();

  if (admin === undefined) {
    throw new Error('No se pudo insertar el usuario admin');
  }

  logger.info(
    {
      email: admin.email,
      role: admin.role,
      preferredLang: admin.preferredLang,
      passwordMatches: bcrypt.compareSync(ADMIN_PASSWORD, admin.passwordHash),
      hashPrefix: admin.passwordHash.slice(0, 4),
    },
    'Seed de admin completado',
  );
};

seedAdmin();

sqlite.close();
