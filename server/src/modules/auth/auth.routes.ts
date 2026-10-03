import { Router } from 'express';
import { loginUser, refreshAccessToken, registerUser } from './auth.service.js';
import {
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from './auth.schema.js';

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

/**
 * Login. **200 con los dos tokens y el usuario**, sin hash (lo decide
 * `loginResponseSchema`).
 *
 * No toca `Accept-Language` por el mismo motivo que el registro: aquí no hay contenido
 * multi-idioma que localizar. El idioma del usuario viene en `user.preferredLang`, que es
 * de donde el frontend debe sacarlo.
 */
authRouter.post('/auth/login', (req, res) => {
  const body = loginBodySchema.parse(req.body);

  res.json(loginUser(body));
});

/**
 * Renovación del access token. **200 con `{ accessToken }` y nada más**: el refresh token
 * no se renueva (haría falta una tabla para revocar el anterior, decisión de T-045) y el
 * usuario ya lo tiene en el cliente.
 *
 * **401 `INVALID_REFRESH_TOKEN` para cualquier problema con el token**, incluido que haya
 * caducado: para el cliente es la misma situación (la sesión terminó) y es el código que
 * T-046 tendrá que reconocer para limpiar la sesión en Zustand.
 */
authRouter.post('/auth/refresh', (req, res) => {
  const body = refreshBodySchema.parse(req.body);

  res.json(refreshAccessToken(body));
});

export { authRouter };

export default authRouter;
