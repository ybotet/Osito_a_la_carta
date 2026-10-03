import { Router } from 'express';
import { registerUser } from './auth.service.js';
import { registerBodySchema } from './auth.schema.js';

const authRouter = Router();

/**
 * Alta de cliente. **201 con la representación pública del usuario, nunca el hash**: el
 * shape de la respuesta (`userSchema`) no contempla `passwordHash`, así que sale por
 * construcción y no por acordarse de quitarlo.
 *
 * No toca `Accept-Language` a diferencia de platos y categorías: el usuario no tiene
 * contenido multi-idioma que localizar, solo un `preferredLang` que el cliente ya manda
 * en el body.
 */
authRouter.post('/auth/register', (req, res) => {
  const body = registerBodySchema.parse(req.body);

  res.status(201).json(registerUser(body));
});

export { authRouter };

export default authRouter;
