import { apiRequest } from './client';
import type {
  ApiAuthUser,
  ApiLoginResponse,
  ApiPreferredLang,
} from './auth.types.js';

/**
 * Body del registro. `preferredLang` no lo elige el usuario en un desplegable (no hay campo
 * para eso, y la navbar ya tiene el selector de idioma): es **el idioma que está viendo ahora
 * mismo**, que es lo que SPEC §7.2 manda guardar.
 */
type RegisterRequest = {
  email: string;
  password: string;
  preferredLang: ApiPreferredLang;
};

/**
 * Alta de cliente: `POST /api/auth/register`.
 *
 * **Devuelve el usuario y no una sesión**, porque así lo decidió T-040: el registro crea la
 * cuenta y nada más. Quien se registra entra después con `loginUser`, y por eso la página de
 * registro hace las dos llamadas seguidas (ver `Register.tsx`).
 *
 * Errores que el formulario tiene que distinguir: **409 `EMAIL_TAKEN`** (el email ya está
 * registrado, que no es un error de tecleo sino que tiene que llevar a "inicia sesión"), y
 * **400 `VALIDATION_ERROR**, que en el cliente casi nunca llega porque las mismas reglas están
 * en `shared/schemas.ts` y el formulario las aplica antes de enviar.
 */
const registerUser = async (body: RegisterRequest): Promise<ApiAuthUser> =>
  (await apiRequest('/api/auth/register', {
    method: 'POST',
    body,
  })) as ApiAuthUser;

/**
 * Login: `POST /api/auth/login`.
 *
 * **Único punto del cliente donde nace una sesión:** devuelve los dos tokens y el usuario, y
 * quien llama los mete en el store. La respuesta no se revalida con Zod porque el servidor ya
 * ejecuta `loginResponseSchema.parse(...)` sobre lo que va a enviar; ver el criterio en
 * `api/http.ts`.
 *
 * **Pasa por `api/client.ts` como las demás, y aquí no hay nada que renovar.** El wrapper solo
 * intenta renovar un 401 que venga con `Authorization` en la petición, y un login nunca la
 * lleva. Esa comprobación es lo que evita que una contraseña incorrecta (`INVALID_CREDENTIALS`,
 * que también es 401) dispare la renovación, cierre la sesión del usuario y lo devuelva al
 * login en bucle. Ver `api/client.ts`.
 */
const loginUser = async (body: {
  email: string;
  password: string;
}): Promise<ApiLoginResponse> =>
  (await apiRequest('/api/auth/login', {
    method: 'POST',
    body,
  })) as ApiLoginResponse;

export { loginUser, registerUser };
export type { RegisterRequest };
