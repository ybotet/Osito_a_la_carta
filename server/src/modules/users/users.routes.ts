import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { findAllUsers } from './users.repository.js';

const adminUsersRouter = Router();

/**
 * GET /api/admin/users
 *
 * Lista todos los usuarios (solo admin).
 *
 * Requiere `requireAdmin` (requireAuth + adminOnly): 401 sin token, 403 con token de cliente.
 * Devuelve un array con la proyección pública de cada usuario (sin `passwordHash`).
 */
adminUsersRouter.get('/admin/users', requireAdmin, (_req, res) => {
  const allUsers = findAllUsers();

  res.status(200).json(allUsers);
});

export { adminUsersRouter };

export default adminUsersRouter;
