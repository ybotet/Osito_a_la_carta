# MEMORY.md — Bitácora de decisiones y trabajo

> Este archivo es la memoria del proyecto. Todo agente lo lee al empezar
> y lo actualiza al terminar. Nunca se borra contenido: solo se agrega.
> Última actualización: 2026-10-05

---

## Cómo usar este archivo

- **Leer**: al iniciar cualquier tarea, busca entradas relacionadas con 
  los módulos que vas a tocar.
- **Escribir**: al terminar, agrega una entrada con el formato de abajo.
- **Nunca borrar**: si una decisión se revierte, se agrega una entrada nueva 
  explicando el cambio. El historial es valioso.

---

## Formato de entrada

### [fecha] — [T-XXX] [título corto de la tarea]
**Estado:** completada | bloqueada | parcial

**Qué se hizo:**
- Bullet 1
- Bullet 2

**Cómo se hizo:**
- Archivos creados/modificados (rutas)
- Decisiones técnicas tomadas
- Dependencias agregadas (y por qué)

**Por qué se hizo así:**
- Motivo de la decisión principal
- Alternativas descartadas y por qué

**Impacto en otras tareas:**
- Tareas que dependen de esto
- Tareas que quedan bloqueadas
- Cambios que afectan a otras partes del código

**Pendientes / deuda técnica:**
- Cosas que quedaron sin hacer (y por qué)
- Refactors que se posponen

---

## Estado actual del proyecto

> Snapshot rápido. Fuente de verdad del avance: `docs/TASKLIST.md`.

**Completadas:** T-001 (estructura de carpetas), T-002 (server con TS estricto),
T-003 (client con Vite + React + TS), T-004 (proxy /api + endpoint de health),
T-005 (Tailwind CSS 4 en el cliente), T-006 (ESLint 10 + Prettier 3),
T-007 (logger pino con pino-pretty en desarrollo),
T-008 (validación de env con Zod), T-009 (módulo de health), y el ajuste de
`engines.node` a `^20.19.0 || ^22.13.0 || >=24`.

**Estado del árbol:**

```
osito_a_la_carta/
├── server/
│   ├── package.json          # type: module, scripts dev/build/start/typecheck
│   ├── tsconfig.json         # strict + NodeNext
│   └── src/
│       ├── app.ts            # instancia Express + routers bajo /api + listen
│       ├── logger.ts         # pino: pretty en dev, JSON en prod, nivel de env
│       ├── config/
│       │   ├── index.ts      # barrel: reexporta env
│       │   └── env.ts        # validación Zod; process.exit(1) si falta algo
│       └── modules/
│           └── health/
│               └── health.routes.ts   # GET /health (montado en /api)
├── client/
│   ├── package.json          # dev/build/preview/typecheck, React 19
│   ├── tsconfig.json         # project references → app + node
│   ├── tsconfig.app.json     # strict + flags
│   ├── tsconfig.node.json    # strict, cubre vite.config.ts
│   ├── vite.config.ts        # plugin-react + tailwindcss() + proxy /api (:3000)
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx           # <h1 class="mt-10 text-center text-3xl font-bold">
│       ├── index.css          # @import 'tailwindcss'  (Tailwind 4, CSS-first)
│       └── pages/ components/ api/ hooks/ store/ locales/ lib/   (vacías)
├── shared/
│   ├── types.ts              # vacío
│   └── schemas.ts            # vacío
├── docs/                     # SPEC, AGENT, TASKLIST, PROMPTS, MEMORY
├── .prettierrc.json          # compartido: 2 espacios, single quotes, semi
├── .prettierignore           # excluye docs/ y README.md
├── node_modules/             # hoisteado por workspaces npm
├── package.json              # raíz, workspaces: ["server", "client"]
├── package-lock.json
├── .env.example
└── .gitignore
```

**Linting y formato:** ESLint 10 con flat config, tools en la raíz y
`eslint.config.js` separado en cada workspace. Prettier 3 con config único
compartido. Desde la raíz funcionan: `npm run lint`, `npm run lint:fix`,
`npm run format`, `npm run format:check`, `npm run typecheck`, `npm run dev`.

**Backend: ya arranca y responde.** `server/src/app.ts` hace `app.listen(PORT)` y expone
`GET /api/health` → `{ status: 'ok', timestamp }`. Todavía **no** hay validación de env con
Zod, así que `PORT` se lee directo de `process.env` con default `3000` (eso cambia en T-008).

**El proxy de Vite funciona.** Con ambos servidores arriba,
`http://localhost:5173/api/health` devuelve el mismo JSON que `http://localhost:3000/api/health`.

**Estilos:** Tailwind **4.3.3** vía plugin `@tailwindcss/vite`. No hay
`tailwind.config.js`, ni `postcss`, ni `autoprefixer`. El tema se configura con
`@theme` dentro de `client/src/index.css`. No existen las directivas `@tailwind`
de la versión 3.

**Comandos que sí funcionan hoy:**
- `cd server && npm run dev` — Express en `http://localhost:3000` (funciona)
- `cd server && npx tsc --noEmit` — typecheck
- `cd server && npm run build` — compila a `server/dist/`
- `cd server && npm start` — corre `dist/app.js`
- `cd client && npm run dev` — Vite en `http://localhost:5173` (funciona)
- `cd client && npx tsc -b --noEmit` — typecheck del cliente

**Para probar el flujo completo hacen falta las dos terminales:**
```bash
cd server && npm run dev   # terminal 1 → :3000
cd client && npm run dev   # terminal 2 → :5173
```

**Versiones instaladas (verificadas con `npm ls --workspaces`):**
react 19.3.0 · react-dom 19.3.0 · vite 8.3.1 · @vitejs/plugin-react 6.1.1 ·
typescript 5.9.3 (**una sola versión para todo el monorepo**) · express 5.2.1 ·
pino 9.14.0 · zod 3.25.76 · @types/node 22.20.4

**Variables de entorno:** `server/src/config/env.ts` valida con Zod **al importarse** y
hace `process.exit(1)` con un mensaje en español si algo falta. Usa
`process.loadEnvFile()` de Node 22, **no `dotenv`** (no está instalado).
- El `.env` vive en la **raíz** del proyecto, no en `server/`.
- Exporta `env` con `NODE_ENV`, `PORT` (ya `number`), `LOG_LEVEL`, `DATABASE_URL`,
  `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`,
  `MAILGUN_FROM` (objeto `{ raw, email }`), `CHEF_EMAIL`, `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`, más los derivados `MAILGUN_FROM_EMAIL` e `isProduction`.
- `app.ts` y `logger.ts` ya leen de `env`; ninguno toca `process.env` directamente.
- **En producción se rechazan los valores de ejemplo de `.env.example`**
  (marcadores: `tudominio`, `cambia-esto`, `changeme`, `change-me`, `placeholder`).
  En desarrollo se permiten a propósito, para poder arrancar recién clonado el repo.

Routers:** se montan con `app.use('/api', xRouter)` y **definen la ruta sin el
prefijo** (`healthRouter.get('/health', ...)`), de modo que `/api` vive en un solo
sitio y los routers futuros no lo repiten. El primero es `health`; devuelve
`{ status, timestamp, uptime, version }`.

**Logging:** `server/src/logger.ts` exporta una instancia de pino ya configurada.
- `env.isProduction` → transporte `pino-pretty` con `colorize`, hora `HH:MM:ss`.
- producción → **JSON puro**, sin transporte (pino-pretty no se carga).
- nivel leído de `env.LOG_LEVEL` (validado por Zod, default `info`).

**Pendientes de infraestructura:**
- El `package.json` raíz **no tiene script `test`**. T-093 (vitest en server) debe
  añadirlo, siguiendo el patrón de `lint`/`typecheck`.
- No hay `.env` real; solo `.env.example` en la raíz. T-008 validará las variables.

---

## Decisiones arquitectónicas clave

> Sección acumulativa. Cada decisión importante se documenta una vez
> y se referencia desde las entradas de tareas.

### 2026-10-05 — El carrito guarda una copia del plato, y sus cantidades solo admiten valores válidos para T-051
**Contexto:** T-050 tenía que crear el store de carrito (Zustand + `persist`) y conectarlo a los
botones de `DishCard` y `DishDetail`, que T-032 había dejado sin `onClick` a propósito. El
enunciado fijaba `items: Array<{ dishId, name, price, quantity, imageUrl }>` y cinco acciones.

**Decisión:** el item guarda el nombre, el precio y la imagen **como copia del momento en que se
añade**; hay **una línea por plato** (`addItem` sube la cantidad en vez de añadir línea) y
`updateQuantity(dishId, 0)` **quita la línea** en lugar de guardarla con cero. `totalItems` y
`totalPrice` son **selectores**, no campos del estado, y el total redondea a céntimos.

**Por qué se guarda la copia del plato y no solo el `dishId`:** con solo el id, T-053 tendría que
pedir cada plato para poder pintar "Sopa x2" y cuánto cuesta, y serían N peticiones para N líneas
de un carrito que el usuario está mirando.

**Por qué `quantity` no puede ser 0:** T-051 define el body del pedido como
`items: Array<{ dishId: number, quantity: number min 1 }>`. Si el carrito admitiera 0, cada
consumidor tendría que filtrar antes de mandar el pedido y ese filtro acabaría en la página. Haciendo
que 0 quite la línea, la garantía la da el tipo. Los controles de cantidad de T-053 generan
precisamente esa llamada cuando el usuario baja de 1, que es el momento en que la línea desaparece
de la lista.

**Por qué los totales son selectores:** es el mismo criterio que `useIsAuthenticated` (T-045).
Guardados habría que mantenerlos sincronizados a mano en cada `set`, y se quedarían viejos al
rehidratar desde un `localStorage` de una versión anterior. Además **devuelven primitivos** porque
un selector que devolviera un array daría referencia nueva en cada render y re-renderizaría en
bucle.

**Consecuencias:**
- **El precio del carrito es solo para pintar.** El que se cobra lo recalcula T-051 con los
  precios actuales y el pedido solo manda `{ dishId, quantity }`. Si el chef cambia un precio entre
  que el usuario añade y confirma, se cobra el nuevo.
- **Los nombres del carrito son los del idioma en que se añadió.** Al reañadir se refrescan con
  los del plato que llega, así que volver a añadir es lo que hace que un carrito en español pase a
  ruso. Está anotado porque es lo que hay que contestar si alguien se queja.
- **T-053 tiene todo lo que necesita** y habilita el `nav.cart` del navbar, hoy deshabilitado. Y
  **`clearCart` va después de confirmar**, no antes: si el `POST /api/orders` falla, el carrito tiene
  que seguir lleno para poder reintentar.

### 2026-10-05 — Toda petición del cliente pasa por `apiRequest`, y los 401 se distinguen por `code`
**Contexto:** T-046 tenía que añadir `Authorization` y `Accept-Language` a las llamadas del
frontend, renovar el access cuando caducara y cerrar sesión si eso tampoco funcionaba. El
proyecto ya tenía `api/http.ts` con el `fetch` común y el `ApiError`, pero sin nada de sesión:
los módulos de `api/` pasaban `Accept-Language` a mano y ninguno mandaba token.

**Decisión:** `client/src/api/client.ts` es **el único `fetch` del cliente**, y todos los
módulos de `api/` pasan por `apiRequest`. Envuelve a `requestJson` (que sigue siendo el que
sabe leer el cuerpo y sacar el `code` del error) y añade lo que es de sesión. El 401 que dispara
la renovación es **`code === 'UNAUTHORIZED'`**, y solo si la petición llevaba `Authorization`.

**Por qué por `code` y no por `status`:** la API tiene **tres** 401 distintos y con el mismo
status: `UNAUTHORIZED` (el access no valió, el único renovable), `INVALID_CREDENTIALS` (login
fallido) e `INVALID_REFRESH_TOKEN` (refresh caducado o manipulado). Comprobar el status haría
que **una contraseña incorrecta intentara renovar la sesión**, que no encontraría nada que
renovar, cerraría la sesión del usuario y lo devolvería al login: un bucle de recarga por
teclear mal la contraseña. Es la razón por la que T-042 unifica a propósito los fallos del
refresh (el cliente no puede distinguirlos, y no debe intentarlo).

**Por qué un wrapper explícito y no parchear `window.fetch`:** parchear el global es invisible.
Nadie lee el fichero y ve que las peticiones llevan token, y un `fetch` llamado desde un módulo
que no debería, o desde las herramientas de desarrollo del navegador, también lo llevaría. Con
un wrapper, la ruta de una petición se lee en el sitio que la escribe.

**Consecuencias:**
- **Los módulos de `api/` que vengan (T-051 a T-055, y los del panel del chef) deben usar
  `apiRequest`.** Usar `requestJson` es un error silencioso: la petición sale sin token y sin
  renovación, y solo falla cuando la ruta protegida responde 401.
- **T-093 (vitest) tiene su primer caso bueno aquí:** access caducado → 401 → renovación → la
  petición sale bien sin que el llamador haga nada. Necesita dos peticiones encadenadas, que es
  justo lo que `renderToStaticMarkup` no cubre.
- **La renovación se comparte entre llamadas simultáneas** mediante una promesa a nivel de
  módulo, porque el refresh token no se renueva: sin eso, tres 401 simultáneos harían tres
  renovaciones válidas escribiendo tres access distintos en el store.
- **El reintento es uno solo**, para que un backend con la hora desfasada no entre en bucle de
  renovaciones.
- **`dishes.ts` sigue pasando `Accept-Language` como parámetro** aunque el wrapper lo ponga: el
  idioma va también en la `queryKey` de TanStack Query, y si solo lo leyera el wrapper, clave y
  cabecera podrían tomar decisiones distintas y la caché devolvería otra traducción.

### 2026-10-05 — Las imágenes se alojan en la VPS, y en la BD se guarda la ruta relativa
**Contexto:** TASKLIST tenía abierta la pregunta de dónde alojar las imágenes de los platos
(VPS local frente a un servicio externo). El dueño decidió **VPS local**, y pidió que cambiar
de dominio no obligara a tocar datos.

**Decisión:** las imágenes viven en el disco de la VPS, en `UPLOADS_DIR`, que en producción
está **fuera del repositorio** (`/var/www/osito/uploads`). En la columna `dishes.image_url` se
guarda la **ruta relativa** (`/uploads/dishes/<uuid>.<ext>`), y la respuesta de la API compone
la **URL absoluta** anteponiendo `PUBLIC_ORIGIN`. Nginx sirve ese directorio con un `alias`;
`express.static` solo interviene en desarrollo.

**Por qué el dominio no se guarda en la fila:** es una variable de despliegue. Si la columna
guardara `https://dominio/uploads/...`, cambiar de dominio obligaría a reescribir todos los
registros. Con `PUBLIC_ORIGIN`, cambiar de dominio es cambiar una variable del `.env`, y así se
comprobó: el mismo servidor compilado, con otro `PUBLIC_ORIGIN`, devuelve otra URL sin tocar
la base de datos.

**Por qué se aceptan las dos formas en el schema:** `imageUrl` pasó de `z.string().url()` a un
esquema que acepta absoluta **o** relativa bajo `/uploads/dishes/`. Cambiar a solo relativa
habría invalidado el seed de T-015, que guarda `https://placehold.co/600x400/...` en las filas
que ya existen. Quien trae una absoluta la recibe intacta; quien trae una relativa la compone.
Las relativas se limitan a `/uploads/dishes/` para que la columna no pueda apuntar a rutas
arbitrarias del servidor.

**Consecuencias:**
- **T-095 (Nginx) necesita `location /uploads/ { alias /var/www/osito/uploads/; }`** además
  del proxy de `/api`. Sin él, en producción las imágenes dan 404 aunque el backend esté bien.
- **T-096 (backup) solo copia `osito.db`:** las imágenes quedan fuera del backup y hay que
  añadir `UPLOADS_DIR`.
- **La validación de T-020 sobre `imageUrl` cambia**; sus tests hay que revisarlos.
- **Las URLs de imagen viajan ya absolutas** al cliente (`GET /api/dishes`, `/api/dishes/:id`),
  así que `DishCard`, `DishDetail`, el carrito y el detalle de pedido no necesitan cambios.

### 2026-10-04 — Las reglas de validación compartidas viven en `shared/` y los mensajes no
**Contexto:** T-044 tenía que validar el formulario de registro y login con las mismas reglas
que aplica el servidor, y el enunciado pedía "reutilizar los schemas de `shared/schemas.ts`",
que era un fichero de 0 bytes. Los schemas estaban en `server/src/modules/auth/auth.schema.ts`,
con los mensajes en español dentro del esquema.

**Decisión:** las **reglas** (normalización del email, mínimo de contraseña, límite de bytes)
viven en `shared/schemas.ts` como **fábricas que reciben los mensajes**:
`createRegisterBodySchema(mensajes)` y `createLoginBodySchema(mensajes)`. El servidor las llama
con sus textos en español; el cliente, con los suyos sacados de `t()`. Y para que el servidor
pueda importarlas, su `rootDir` pasa a ser la raíz del repositorio y `shared/` entra en el
`include` (con `rootDir: ./src` el import daba TS6059).

**Por qué los mensajes se inyectan y no se traducen dentro del fichero:** un texto escrito en el
esquema obliga al cliente a traducir algo ya construido, y para eso necesitaría un diccionario
de errores por `code`. Con los mensajes inyectados, cada lado escribe en su idioma y las
reglas no se duplican.

**Consecuencias:**
- El `dist` del servidor es ahora `dist/server/src/...` + `dist/shared/...`: `npm start` y el
  `script` de PM2 (T-094) son `dist/server/src/app.js`.
- Los caminos que se resolvían contando niveles (`resolve(moduleDir, '../../..')`) dejaron de
  funcionar; ahora se buscan subiendo en `server/src/shared/project-paths.ts`.
- **Los schemas de respuesta no se movieron**: se quedan en el servidor, donde se ejecutan con
  `parse` sobre lo que se serializa, y el cliente los replica en `client/src/api/*.types.ts`.

### 2026-10-03 — Los JWT llevan claim `type` y se firman con secretos distintos
**Contexto:** T-041 tenía que emitir dos tokens con la misma librería (`jsonwebtoken`) y el mismo
formato, y ambos son cadenas que `jwt.verify()` acepta sin mirar más que la firma.

**Decisión:** los dos tokens llevan un claim **`type`** (`'access'` | `'refresh'`) y **se firman
con secretos distintos**: el access con `env.JWT_SECRET` y el refresh con
`env.JWT_REFRESH_SECRET`. Además, `email` y `role` van **solo** en el access, y `sub` es el `id`
del usuario **en texto** (lo que JWT exige).
Decidido el 2026-10-03 en T-041.

**Por qué:**
- **Sin `type`, un refresh token vale como credencial en cualquier ruta protegida.** Si
  `requireAuth` (T-043) solo verifica la firma, aceptaría el token de 7 días igual que el de 15
  minutos, y caducar el access no serviría para nada. Es la diferencia entre un refresh y un
  bypass.
- **Los secretos distintos son la segunda barrera, no la primera.** El claim ya los separa; tener
  firmas distintas hace que un refresh no se pueda colar como access **ni siquiera comprobando mal
  el claim**: la verificación con `JWT_SECRET` falla antes de mirar el `type`. Verificado en T-041:
  los dos rechazos dan `invalid signature`.
- **El refresh no lleva datos del usuario porque T-042 los relee de la base**, que es lo que
  permite que un token de 7 días siga siendo válido aunque el email o el rol hayan cambiado.

**Consecuencias a tener en cuenta al implementar:**
- **T-042 (`POST /api/auth/refresh`)**: `jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms:
  ['HS256'] })` **y** comprobar `payload.type === 'refresh'`, y releer el usuario por `sub`.
  `TokenExpiredError` distingue "caducado" de "no válido" para poder responder 401 en los dos casos.
- **T-043 (`requireAuth`)**: `jwt.verify(token, env.JWT_SECRET, …)`, comprobar
  `payload.type === 'access'` y sacar el usuario de `sub` (con `Number()`, porque es texto).
  **`algorithms: ['HS256']` siempre explícito**: sin esa opción, `jsonwebtoken` acepta el algoritmo
  que diga la cabecera del token y es el punto de entrada clásico de los ataques de JWT.
- **T-045** (Zustand + `localStorage`) guarda los dos tokens; no hay cookies, así que no hay
  `httpOnly` ni CSRF que organizar con el access.
- Si algún día se cambia `JWT_SECRET`, **todos los access tokens emitidos quedan inválidos de
  golpe** (y con él las sesiones en el navegador). Cambiar `JWT_REFRESH_SECRET` pasa lo mismo con
  los refresh. Es el comportamiento correcto, pero conviene saberlo antes de rotar un secreto en
  producción.

### 2026-10-03 — El email de `users` se normaliza en el borde, no en la base
**Contexto:** T-040 tenía que rechazar el email duplicado con un 409, y `users.email` es
`text unique`. El `UNIQUE` de SQLite sobre `TEXT` **distingue mayúsculas**, así que "comprobar si
ya existe" y "no tener dos cuentas con la misma casilla" son cosas distintas.

**Decisión:** el email se normaliza en el **schema** (`trim().toLowerCase()`) antes de validar, y
por tanto el servicio, el repositorio y la tabla reciben y guardan siempre la misma forma.
Decidido el 2026-10-03 en T-040.

**Por qué en el schema y no en el servicio:** es el único sitio por el que pasan **todas** las
entradas, incluidas las de las tareas futuras. Si normalizara el servicio, cualquier endpoint
nuevo que se olvide de hacerlo volvería a tener el problema, y el 409 de dos endpoints distintos
dejaría de significar lo mismo.

**Por qué no las otras dos opciones:**
- **`lower(email) = lower(?)` en el `WHERE`**: obligaría a duplicar la normalización en cada
  escritura y quedaría un `SELECT` que no coincide con el `UNIQUE` de la columna, que sigue
  distinguiendo mayúsculas: la integridad real quedaría en manos de la aplicación.
- **`email COLLATE NOCASE`**: sería la solución de verdad (la restricción de la base), pero exige
  **migración**. Cuando haga falta, es una migración nueva y no un cambio de schema en sitio
  (AGENTE.md §2.4).

**Consecuencias a tener en cuenta:**
- El `details` del 409 devuelve el email **ya normalizado**, que es lo que hay en la tabla.
- **Cualquier endpoint futuro que escriba `users.email` tiene que usar `emailSchema`** (o al menos
  el mismo `trim().toLowerCase()`). T-045/T-046 (cambiar email desde el perfil) y el panel del
  chef (T-08x) son los sitios donde esto puede volver a romperse.

### 2026-10-01 — `resolveLanguage` vive en `shared/language.ts`, no en un servicio
**Contexto:** T-020 lo dejó en `dishes.service.ts` con la nota de que, cuando apareciera la
segunda implementación, convendría moverlo a un módulo compartido. T-025 es esa segunda
implementación (`GET /api/categories` también se localiza por `Accept-Language`).
**Decisión:** `server/src/shared/language.ts` exporta `resolveLanguage`, `LANGUAGES`,
`DEFAULT_LANGUAGE` y el tipo `Language`. `dishes.service.ts` **ya no lo define ni lo
reexporta**: lo importa de `shared`.
**Alternativas consideradas:** (a) duplicar el parseo en el servicio de categorías;
(b) importarlo desde `dishes.service.ts` sin moverlo; (c) moverlo a `shared/language.ts`.
**Motivo:** (a) deja dos listas de idiomas y dos implementaciones de los pesos `q` que hay
que mantener en un sitio solo: el día que se añadiera un idioma o se corrigiera un caso del
header, se tocaría una y se olvidaría la otra, y los dos endpoints se pondrían a responder
idiomas distintos. (b) crea una dependencia inversa: el módulo de categorías dependería
del de platos para algo que no tiene que ver con platos, y cualquier futuro servicio
(distinto de dishes) tendría que importar un servicio de platos para leer un header.
**Consecuencias:**
- **El idioma se importa de `shared/language.ts`, no de `dishes.service.ts`.** La entrada de
  T-021 que decía "`resolveLanguage` sigue en el servicio de dishes: T-025 debe seguir
  reutilizándolo" queda **superada por esta**: el reutilizarla sí, pero desde `shared`. Las
  entradas anteriores no se borran, se leen con esta encima.
- `LANGUAGES` y `DEFAULT_LANGUAGE` siguen exportándose desde `dishes.schema.ts` (para no
  mover el schema entero), y `shared/language.ts` los reexporta para quien los necesite. Es
  un reexport real, no una copia: si se añade un idioma al schema, el compartido lo ve.
- **Cualquier endpoint nuevo que localice debe usar `resolveLanguage` de `shared`.** Si
  aparece una tercera implementación, el sitio natural es este archivo.
- `readAcceptLanguage` (leer el header crudo) vive aparte, en `shared/http.ts`. Los dos
  hacen cosas distintas: uno lee el header, otro decide el idioma. No conviene mezclarlos.

### 2026-10-01 — Extensión: la disponibilidad tiene tres endpoints, no uno
**Contexto:** la entrada anterior ("El borrado de platos es lógico, y por integridad
referencial") terminó saying que **no** había forma de recuperar un plato y que habría que
decidir la vía antes de construirla. El dueño la decidió: **tres endpoints separados**.
**Decisión (extiende la anterior, no la reemplaza):**
| Endpoint | Efecto | Fila en BD |
| --- | --- | --- |
| `DELETE /api/dishes/:id` | deshabilita, 204 | se conserva |
| `PATCH /api/dishes/:id/availability` | habilita/deshabilita, 200 con el plato | se conserva |
| `DELETE /api/dishes/:id/permanent` | purga, 204 | **se elimina** |
**Por qué tres y no uno:** son tres decisiones de negocio distintas y con riesgos distintos.
Deshabilitar es reversible y es la operación de uso diario; recuperar es la corrección de un
error; purgar es irreversible y solo tiene sentido para un plato que ya no se quiere ver. Una
sola ruta con un parámetro tipo `?purge=true` o `?force=true` mezclaría las tres y dejaría la
operación irreversible a un parámetro de query, que es fácil dejar por defecto al construir
un cliente.
**Motivo de los 409 del purgado, decididos por el dueño:** no se purga un plato que sigue
visible (`DISH_STILL_AVAILABLE`) ni uno con historial (`DISH_HAS_HISTORY`, con
`order_items` o `page_views`). El flujo es deshabilitar → revisar → purgar. Ninguno de los
dos 409 modifica nada.
**Consecuencias:**
- **`isAvailable` se acepta en el body de `PATCH .../availability` y en ningún otro sitio.**
  Ni el POST ni el PUT lo aceptan. La vía es explícita y no colada en el body de edición.
- **Habilitar exige una consulta que no filtre por disponibilidad** (`findDishById`): un
  plato deshabilitado es invisible para todo el resto del módulo, así que sin ella el
  `PATCH` no podría ni encontrar el plato que quiere recuperar.
- **`z.boolean()` sin `coerce` en el body de disponibilidad.** `z.coerce.boolean()` convierte
  el string `"false"` en `true` porque en JS es truthy: el cliente pediría deshabilitar y el
  servidor habilitaría. Verificado que da 400.
- **T-028 ya tiene respuesta:** un dish deshabilitado sigue contando como plato asociado
  para el 409 de su categoría, porque la fila permanece. Purgado sin historial, la categoría
  queda liberada.
- Sigue **sin haber auditoría**: no se sabe quién ni cuándo deshabilitó o purgó un plato.
  `dishes` no tiene `updatedAt` ni `deletedAt`.

### 2026-10-01 — El borrado de platos es lógico, y por integridad referencial
**Contexto:** T-024 pide `DELETE /api/dishes/:id` "como borrado lógico (`isAvailable = 0`)".
El enunciado ya fijaba el mecanismo, pero no decía por qué ni qué implica para el resto del
sistema.
**Decisión:** `dishes` **nunca** se borra físicamente. Retirar un plato es
`is_available = 0`; todos los endpoints de lectura filtran por ese flag, y un plato
retirado responde 404 en GET, PUT y DELETE por igual. El `WHERE` del UPDATE es `id = ?`
sin filtrar por disponibilidad, para que el borrado sea idempotente a nivel de SQL; el 404
lo decide el servicio.
**Alternativas consideradas:** (a) `DELETE` real en la fila; (b) borrado lógico solo en
`dishes` y en cascada real para categorías; (c) borrado lógico en todos lados.
**Motivo:** `order_items.dish_id` y `page_views.dish_id` referencian `dishes.id`. Con (a),
cada pedido ya confirmado quedaría apuntando a un plato inexistente, y el panel del chef
(T-080–T-083) y las estadísticas (T-070–T-072) no podrían mostrar qué se pidió. Se comprobó
que un `order_item` sigue siendo válido con el plato en `is_available = 0`, que es
precisamente la propiedad que hace que (a) sea incorrecta. Además el precio del pedido ya
está congelado en `order_items.unit_price`, así que conservar la fila no crea ambigüedad.
**Consecuencias:**
- **Un plato retirado no se puede recuperar.** No hay endpoint para eso y no se ha
  inventado. Resucitarlo por el `PUT` exigiría aceptar `isAvailable` en el body, lo que
  contradice la decisión de T-022 y T-023. Si hace falta, hay que decidir la vía antes
  (endpoint propio o `PATCH /api/dishes/:id/availability`).
- **T-028 (`DELETE /api/categories/:id`) debe decidir explícitamente** si un plato
  retirado cuenta como "asociado" para su 409. La fila sigue existiendo, así que un
  `count` sin filtro la contaría. La lectura conservadora es contarla: evita dejar una
  categoría con platos que no aparecen en ningún sitio.
- **Un `is_available = 0` no es un estado reversible ni auditable:** `dishes` no tiene
  `updatedAt` ni `deletedAt`, así que no se sabe cuándo ni quién retiró un plato. Si el
  producto lo necesita, son columnas nuevas en una migración nueva.
- `isAvailable` **no** se acepta en el body del POST ni del PUT, en ninguno de los dos
  sentidos: ni publicar un plato oculto al crearlo, ni ocultarlo al editarlo. La única vía
  para cambiar la disponibilidad es el DELETE (y hoy no hay vuelta atrás).

### 2026-10-01 — Los helpers de HTTP transversales viven en `shared/http.ts`
**Contexto:** al pedir si los módulos deberían tener controladores, se revisó qué hay
realmente en las rutas. `dishes.routes.ts` tenía 25 líneas de código en 3 handlers, cada
uno con tres pasos (validar, llamar al servicio, responder) y **cero lógica de negocio**:
todo estaba en el servicio. La premise de la pregunta (hay lógica en las rutas) no se
sostenía.
**Decisión:** **no se crean controladores.** Se mantiene la estructura de AGENTE.md §2.2
(4 archivos) y lo que se extrae son los helpers que de verdad son transversales, a
`server/src/shared/http.ts`: `readAcceptLanguage` (leer el header `Accept-Language`) e
`idParamSchema` (params de `:id`).
**Alternativas consideradas:** (a) un `<feature>.controller.ts` por módulo; (b) extraer solo
la lógica de negocio a un controller, dejando el resto en la ruta; (c) no crear nada.
**Motivo:** (a) y (b) añaden un salto de indirección sin quitar lógica de ninguna parte: el
código que se movería son llamadas de una línea, y a cambio habría que mirar tres archivos
en vez de dos para depurar. Además contradicen AGENTE.md §2.2, que fija la estructura de
cuatro archivos y dice que las rutas solo orquestan. Lo que sí era un problema real es que
`readAcceptLanguage` e `idParamSchema` están a punto de duplicarse en T-025, T-027 y T-043,
y eso sí se resolvió.
**Consecuencias:**
- `readAcceptLanguage(req)` recibe el `Request` completo, no el valor del header, para que
  las rutas no repitan `req.headers['accept-language']`. Por dentro sigue haciendo lo mismo
  con `Array.isArray`, porque Express tipa un header repetido como `string[]`.
- `dishParamsSchema` pasó a llamarse **`idParamSchema`** al salir del módulo de platos:
  el nombre viejo mentía sobre su alcance.
- Los módulos que necesiten un schema de params distinto de `:id` lo declaran en su
  `*.schema.ts`, no en `shared/`: lo compartido es lo que es idéntico en todos.
- T-025 (`GET /api/categories`) debe usar `readAcceptLanguage` de aquí. Lo que sigue en
  `dishes.service.ts` y sigue siendo reutilizable es **`resolveLanguage`** (parsear el
  header ponderado), no `readAcceptLanguage`: uno lee el header, el otro decide el idioma.
  Cuando exista la segunda implementación, `resolveLanguage` debe mudarse también.

### 2026-10-01 — Todo contenido del menú va en tablas con columnas multi-idioma
**Contexto:** al pedir categorías de platos había que elegir dónde vivían.
**Decisión:** las categorías son una **tabla `categories` propia**, con `slug` +
`nameEs/Ru/En` + `sortOrder`, y `dishes` la referencia por FK.
**Alternativas consideradas:** (a) `dishes.category` como `text({ enum: [...] })`;
(b) `dishes.categorySlug` como texto sin FK; (c) tabla `categories` con FK.
**Motivo:** SPEC §4 ya decidió que el contenido multi-idioma va en columnas por
idioma en la BD, y AGENTE.md §2.5 obliga a que cualquier texto visible exista en los
tres idiomas. Un enum vive en el código, así que sus valores no se pueden traducir: en
la UI rusa aparecería el slug inglés o el nombre en español. La tabla además permite
`sortOrder` (reordenar el menú sin migrar) y `slug` estable para filtros y URLs, y
conserva la integridad referencial, que la opción (b) perdería.
**Consecuencia:** leer el menú exige un JOIN a `categories`, y agrupar debe ordenar por
`categories.sort_order`, no por id.

### 2026-10-01 — `categories` es un recurso con CRUD propio, no un campo editable
**Contexto:** al añadir las categorías había que decidir cómo se creaban al dar de alta
un plato.
**Decisión:** `/api/categories` es un recurso de primera clase con su propio CRUD
(T-025–T-028), con lecturas públicas y localizadas y escrituras restringidas a admin.
`POST /api/dishes` solo recibe un `categoryId` existente; no crea categorías.
**Alternativas consideradas:** (a) que `POST /api/dishes` creara la categoría al vuelo;
(b) categorías de solo lectura con ids fijos en código; (c) CRUD propio.
**Motivo:** (a) mezcla dos responsabilidades en un endpoint y no permite ni renombrar ni
reordenar el menú una vez el producto está en marcha, que es el objetivo de haber
añadido `sortOrder`. (b) obliga a migrar para cambiar el menú y no da control al admin.
**Consecuencias:** `T-026` bloquea a `T-022` (el alta de platos valida `categoryId`);
`DELETE` de una categoría con platos devuelve 409 en vez de hacer cascada, para no
perder dishes por una confirmación mal leída; y `slug` duplicado devuelve 409 en lugar
de dejar que reviente una FK.

### 2026-10-01 — Los endpoints de listado devuelven `{ language, data }`
**Contexto:** T-020 tenía que localizar por `Accept-Language` y el criterio no decía si
el array iba pelado o envuelto.
**Decisión:** las respuestas de listado localizado incluyen el idioma resuelto
(`{ language, dishes }`), no un array pelado.
**Alternativas consideradas:** (a) array directo; (b) envoltorio con el idioma resuelto.
**Motivo:** el frontend necesita saber con qué idioma se resolvió la petición para no
reparsear el header por su cuenta, y sirve de diagnóstico en logs y tests. El array
pelado obligaba a adivinar el idioma por los propios datos.
**Consecuencias:** quien consuma el endpoint debe leer `body.dishes`. T-021, T-025 y
T-051 deberían seguir el mismo patrón para no tener dos convenciones en la API. La
resolución de idioma (`resolveLanguage`) es genérica y debe **reutilizarse**, no
duplicarse; cuando exista la segunda implementación conviene moverla a un módulo
compartido en vez de dejarla en el servicio de dishes.

### 2026-10-01 — Los errores de la API se lanzan como clases, no se responden en la ruta
**Contexto:** T-021 tenía que devolver su primer 404 y no existía infraestructura de
errores, mientras AGENTE.md §2.2 pedía lanzar `AppError` / `NotFoundError`.
**Decisión:** `server/src/shared/errors.ts` define `AppError` y subclases por status, y
`error.middleware.ts` las traduce a `{ error, code }` (SPEC §8). Los servicios lanzan; los
routers no conocen errores.
**Alternativas consideradas:** (a) responder `res.status(404)` dentro del router de dishes.
**Motivo:** (a) incumple la convención de AGENTE.md §2.2 y además obliga a que cada router
reinvente el formato y el log. Con la capa compartida, cada endpoint nuevo elige una clase
y hereda el formato, el log y el no-filtrado de detalles internos gratis. Era además el
momento oportuno: T-021 era el primer endpoint que devuelve un error, así que la
convención queda fijada antes de que haya diez endpoints que la ignoren.
**Consecuencias:** `notFoundHandler` y `errorHandler` deben registrarse en `app.ts`
**después** de todos los routers, y en ese orden. `is_available = 0` se responde como 404
y no como 403, para no revelar qué platos existieron. El middleware de error necesita
sus 4 parámetros aunque `next` no se use, por lo que el `eslint.config.js` del server
acepta el prefijo `_` en parámetros no usados. El texto de los errores está en inglés y
**sin i18n**: si el frontend muestra el campo `error`, habrá que localizarlo o mapear el
`code`.

### 2026-10-01 — El body del POST se valida con Zod y el repositorio fija los defaults
**Contexto:** T-022 definía un body con nueve campos de texto multi-idioma, sin `categoryId`
y sin `isAvailable`.
**Decisión:** el schema Zod valida exactamente lo que el cliente debe poder elegir
(`categoryId`, `imageUrl`, `price` y los 9 textos), y **el repositorio fija los campos
que el cliente no controla** (`isAvailable = 1`, `createdAt` por el default del esquema).
**Alternativas consideradas:** (a) aceptar `isAvailable` en el body; (b) aceptar todo y
dejar que la BD lo ponga por defecto; (c) separar campos de entrada y de salida, como
aquí.
**Motivo:** (a) dejaría que un cliente publicara un plato ya oculto, y T-024 (borrado
lógico) es la vía prevista para eso. (b) es frágil: depende de que el default de Drizzle
no cambie nunca. Con (c) la decisión está en el repositorio y es explícita.
**Consecuencias:** los campos extra del body se descartan en silencio (Zod sin
`.strict()`), no se rechazan. `categoryId` es obligatorio porque `dishes.category_id` es
`NOT NULL` con FK; el servicio valida que la categoría exista y devuelve
`400 CATEGORY_NOT_FOUND` para que la FK no reviente como error de SQLite. T-023 debe
reutilizar este mismo schema en vez de duplicarlo.

### 2026-09-29 — npm workspaces en la raíz
**Contexto:** T-001 pide un `package.json` raíz "con workspaces si aplica".
**Decisión:** `workspaces: ["server", "client"]` con npm. `shared/` queda **fuera**
de los workspaces.
**Alternativas consideradas:** (a) sin workspaces, installs separados por carpeta;
(b) pnpm/turbo; (c) incluir `shared` como paquete.
**Motivo:** npm workspaces ya viene con Node, centraliza el lockfile y permite
`npm install` desde la raíz. `shared/` solo aporta archivos `.ts` que se importan
por ruta relativa, no es un paquete publicable: incluirlo agregaría un build
step sin beneficio.
**Consecuencias:** los `node_modules` se hoistean a la raíz (no existe
`server/node_modules`). `npm install` ejecutado dentro de `server/` sigue
respetando los workspaces. Los binarios se resuelven por el PATH que arma npm en
los scripts, así que `tsx`/`tsc` funcionan desde `server/`.

### 2026-09-29 — NodeNext + `type: module` en el backend
**Contexto:** SPEC pide Node LTS + Express + TypeScript. No define el flavor de módulos.
**Decisión:** `"type": "module"` en `server/package.json` y
`module`/`moduleResolution` = `NodeNext` en `tsconfig.json`.
**Alternativas consideradas:** CommonJS (másSimple, pero contradice el ESM moderno
y complica `import.meta`); `moduleResolution: "bundler"` (no aplica a backend Node).
**Motivo:** ESM nativo en Node LTS sin transpilar, y es lo que la especificación
espera para un proyecto TS moderno.
**Consecuencias:** **los imports relativos deben llevar extensión `.js`**
(p. ej. `import { logger } from './logger.js'`), aunque el archivo sea `.ts`.
Olvidarlo compila pero rompe en runtime.

### 2026-09-29 — Flags estrictos adicionales
**Contexto:** SPEC §8 solo exige `strict: true` y "sin `any`".
**Decisión:** además de `strict`, se activaron `noUncheckedIndexedAccess`,
`noImplicitOverride`, `noFallthroughCasesInSwitch` y `exactOptionalPropertyTypes`.
**Alternativas consideradas:** solo `strict` (mínimo exigido).
**Motivo:** `noUncheckedIndexedAccess` evita el clásico `arr[i]` que devuelve
`T | undefined` sin aviso — crítico con acceso a filas de BD y params de Express.
`exactOptionalPropertyTypes` impide tratar `prop?: T` como `T | undefined`.
**Consecuencias:** código más verboso al construir objetos opcionales. Si en algún
punto genera fricción, `exactOptionalPropertyTypes` es el flag más prescindible.

### 2026-09-29 — React 19 (desvío autorizado de SPEC.md §4)
**Contexto:** SPEC.md §4 fija "React 18 + Vite". La tarea T-003 indicaba usar
`npm create vite@latest . -- --template react-ts`, pero ese template hoy genera
React 19.3.0 (React 19.3.0 es `latest` en npm; la última 18 es 18.3.1).
**Decisión:** se usa **React 19.3.0**, según autorizó explícitamente el dueño.
SPEC.md §4 fue actualizado el 2026-09-29 (con autorización posterior explícita)
para decir "React 19 + Vite 8", y §10 registra la decisión como cerrada.
**Alternativas consideradas:** (a) pinear React 18.3.1, fiel a SPEC; (b) React 18 + Vite 7,
más conservador; (c) React 19 del template — **elegida por el dueño**.
**Motivo:** el dueño prefiere el stack actual que genera el tooling oficial, aceptando
el desajuste con SPEC.md.
**Consecuencias:** SPEC.md §4 ya no está desactualizado. Cualquier agente que lea
SPEC como fuente de verdad verá "React 19" y no intentó revertirlo. shadcn/ui y
TanStack Query soportan React 19 sin cambios.

### 2026-09-29 — TypeScript unificado a 5.9.3 en todo el monorepo
**Contexto:** el template de Vite trae `typescript ~6.0.2`; T-002 había fijado
`^5.7.3` en el server. Con npm workspaces, dos versiones de `tsc` conviven y una
queda anidada en `node_modules`, lo que hace ambiguo qué versión ejecuta `npx tsc`.
**Decisión:** declarar `^5.7.3` en **ambos** `package.json`. npm deduplica y ambos
workspaces resuelven a **5.9.3** (una sola instalación hoisteada).
**Alternativas consideradas:** (a) TS 6.0.2 solo en client; (b) subir el server a 6.0.2
—descartada, mezclaba un cambio de T-002 dentro de T-003.
**Motivo:** una sola versión hace que `npm run typecheck` en la raíz sea predecible en
T-006, y TS 5.9 es la rama que shadcn/ui, drizzle-kit y Recharts ya soportan.
**Consecuencias:** el `caret` de `^5.7.3` permite subir a 5.x sin tocar los manifests.
Si alguna dependencia exige TS 6, habrá que migrar los dos workspaces a la vez.

### 2026-09-29 — `listen` en `app.ts` (el módulo arranca al importarse)
**Contexto:** T-002 dejó `app.ts` sin `app.listen()` por requisito explícito de esa
tarea ("exporta una instancia de express, sin arrancar"). T-004 exige que el server
responda en `:3000`, y el script `dev` es `tsx watch src/app.ts`.
**Decisión:** el `listen` va **dentro de `app.ts`**, no en un `index.ts` separado.
`app.ts` sigue exportando `app` para que las pruebas de T-093 puedan importar la
instancia sin abrir un puerto.
**Alternativas consideradas:** (a) crear `src/index.ts` con el `listen` y apuntar el
script `dev` a él — más limpio por separación de responsabilidades, pero rompe el
criterio literal de T-004 ("en server/src/app.ts agrega la ruta") y añade un archivo
que SPEC §5 no contempla; (b) dejar el listen en `app.ts` — elegida.
**Motivo:** cumple el criterio de aceptación tal como está escrito y evita inventar
estructura no documentada en SPEC §5.
**Consecuencias:** **importar `app.ts` arranca un servidor como efecto secundario.**
Eso importa para T-093: los tests que importen `app` abrirán el puerto. Si molesta,
la extracción a `index.ts` es el camino natural, pero requiere actualizar SPEC §5.
Además, `PORT` se lee de `process.env` sin validar hasta T-008.

### 2026-09-29 — Tailwind 4 con plugin de Vite (CSS-first, sin config.js)
**Contexto:** el enunciado de T-005 pedía el setup clásico de Tailwind v3:
`tailwind.config.js` con `content: ['./src/**/*.{ts,tsx}']`, `postcss` + `autoprefixer`
y las directivas `@tailwind base/components/utilities`. La versión vigente es
**Tailwind 4.3.3** (la 3.4.19 está bajo el tag `v3-lts`, en mantenimiento).
**Decisión:** se instala **tailwindcss 4.3.3 + @tailwindcss/vite 4.3.3**, con
configuración CSS-first: `@import 'tailwindcss'` en `index.css` y tokens de tema
vía `@theme` dentro del mismo CSS. **Autorizado explícitamente por el dueño.**
SPEC.md §4 no fijaba versión ("Tailwind CSS"), así que no hubo que modificarlo.
**Alternativas consideradas:** (a) Tailwind 3.4.19 literal al enunciado, descartado
porque shadcn/ui ya considera legacy el modelo de v3 y obligaría a migrar en T-035;
(b) híbrido v4 + config.js vía `@config`; (c) v4 CSS-first — elegida.
**Motivo:** el plugin oficial de Vite hace el build más rápido, elimina la capa de
PostCSS por completo y es el camino que shadcn/ui prueba de forma nativa.
**Consecuencias:**
- **No existe `client/tailwind.config.js`**, pero SPEC.md §5 lo documenta en el árbol
  de carpetas. Discrepancia pendiente de corregir en SPEC (requiere autorización).
- **No hay `postcss` ni `autoprefixer`** instalados, y no hacen falta.
- **Las directivas `@tailwind` ya no existen** en v4. Si un agente las escribe,
  el CSS se rompe silenciosamente.
- Extender el tema (colores, fuentes) se hace con `@theme { --color-marca: ... }`
  en `index.css`, no en un objeto JS.
- La detección automática de clases escanea el proyecto, pero **las cadenas
  construidas dinámicamente** (`` `text-${color}-500` ``) no se detectan. Usar
  siempre clases completas.

### 2026-09-30 — `createRequire` para leer `package.json` (no `import` de JSON)
**Contexto:** T-009 pide devolver la `version` del servidor leída de `package.json`.
El `tsconfig` tiene `resolveJsonModule: true`, `module: NodeNext` y
`rootDir: "./src"`, pero `server/package.json` está **fuera** de `rootDir`.
**Decisión:** leer el JSON con **`createRequire(import.meta.url)`** desde
`modules/health/health.routes.ts`, no con `import ... with { type: 'json' }`.
**Alternativas consideradas:** (a) `import` de JSON con import attribute — probada y
descartada, ver abajo; (b) `createRequire` — elegida; (c) leer el JSON a mano con
`fs.readFileSync` + `JSON.parse` — funciona, pero `createRequire` es más directo y
respeta la caché de módulos.
**Por qué:** el import de JSON **pasa `tsc --noEmit` y `npm run build` sin errores**
pero **falla en runtime** en los dos entornos: tsc emite el `.js` en
`dist/modules/health/` y **no copia el `package.json` a `dist/`** (está fuera de
`rootDir`), dando `ERR_MODULE_NOT_FOUND`. Con tsx sobre `src/` también falló.
`createRequire` resuelve la ruta real del filesystem en runtime y funciona igual.
**Consecuencias:**
- **Verificar siempre en los dos modos de ejecución.** `tsc --noEmit` y `npm run build`
  en verde **no** garantizan que un import funky funcione al ejecutar. El error solo
  aparece con `npm start` sobre `dist/`.
- La ruta `../../../package.json` se resolvió comprobando que funciona tanto desde
  `src/modules/health/` como desde `dist/modules/health/` (misma profundidad).
- El resultado de `require` se castea a `{ version: string }`; no hay `any`.

### 2026-09-30 — Patrón de routers: prefijo en `app.ts`, ruta sin prefijo en el router
**Contexto:** AGENT.md §2.2 pide un `<feature>.routes.ts` por módulo, pero la tarea
de T-004 ya había dejado `GET /api/health` **inline en `app.ts`**.
**Decisión:** cada router se monta con `app.use('/api', xRouter)` y define sus rutas
**sin el prefijo** (`healthRouter.get('/health', ...)`). `app.ts` solo compone
`app.use(...)`, sin ninguna definición de ruta.
**Alternativas consideradas:** (a) `app.use('/api/dishes', dishesRouter)` por módulo;
(b) mantener `/api` en cada ruta del router; (c) prefijo único `/api` — elegida.
**Motivo:** con (a) cada router tendría que conocer su propio prefijo completo, y
cambiar `/api` obligaría a editar todos. Con (b) el prefijo se repite en cada archivo.
Con (c) `/api` vive en un único sitio y los routers futuros no lo mencionan.
**Consecuencias:**
- T-020, T-051, T-080 y demás siguen este patrón: `app.use('/api', xRouter)`.
- Un router es testeable de forma aislada (T-093 puede montarlo en un `express()` de
  prueba sin tocar `app.ts`).
- `healthRouter` no lleva el sufijo `/routes` en el import: se importa como
  `healthRouter` desde `./modules/health/health.routes.js`.

### 2026-09-30 — Rechazo de placeholders de `.env.example` solo en producción
**Contexto:** tras T-008 se detectó que los valores de ejemplo de `.env.example`
("cambia-esto-por-un-secreto-...") tienen más de 32 caracteres, así que pasaban
la validación de longitud y el servidor arrancaba en producción con secretos
públicos y conocidos. El dueño pidió añadir el rechazo.
**Decisión:** un `.refine()` por variable sensible comprueba si el valor contiene
alguno de los marcadores de `PLACEHOLDER_MARKERS` (`tudominio`, `cambia-esto`,
`changeme`, `change-me`, `placeholder`, `no-reply@tudominio.com`), comparando en
minúsculas. **Solo se activa cuando `NODE_ENV === 'production'`.**
**Alternativas consideradas:** (a) rechazar placeholders siempre — descartada, rompe
el arranque local recién clonado el repo, que es la forma más común de empezar;
(b) un `.superRefine()` único sobre todo el objeto en vez de un `.refine()` por
variable — se descartó por legibilidad: el error por variable es más accionable.
**Motivo:** el riesgo real es desplegar con secretos de ejemplo, no developing en
local. Bloquear el desarrollo para proteger la producción sería un mal intercambio.
**Consecuencias:**
- Los `.refine()` se evalúan en **el orden del schema**, así que el mensaje de
  longitud mínima puede no aparecer si el placeholder salta primero. Aceptable.
- **`DATABASE_URL` no tiene este refine.** No es un secreto y su valor de ejemplo
  (`./osito.db`) es inofensivo.
- `MAILGUN_FROM` se comprueba sobre `value.raw` (el string original con el nombre),
  no sobre el email extraído, porque el placeholder está en el dominio.
- Si se añade una variable sensible nueva, hay que acordarse del `.refine()`.
  La lista de marcadores está centralizada para hacerlo fácil.

### 2026-09-30 — `process.loadEnvFile()` en vez de `dotenv`
**Contexto:** T-008 pide validar variables de entorno con Zod. Falta decidir quién
lee el `.env`. La convención habitual es `dotenv`, que no está instalado.
**Decisión:** usar **`process.loadEnvFile()`**, una API nativa de Node (estable desde
Node 20.12), en lugar de agregar `dotenv` como dependencia.
**Alternativas consideradas:** (a) instalar `dotenv` — descartada, agrega una
dependencia externa para algo que Node ya resuelve; (b) `--env-file` de la CLI —
descartada, obliga a recordar el flag en cada script y no funciona con `node dist/`;
(c) `process.loadEnvFile()` — elegida.
**Motivo:** cero dependencias nuevas, que es una regla explícita del proyecto.
**Consecuencias:**
- **El `.env` está en la raíz del proyecto**, no en `server/`. La ruta se resuelve con
  `import.meta.url` subiendo tres niveles, de modo que funciona igual desde `src/` en
  desarrollo y desde `dist/` compilado.
- **Hay que comprobar `existsSync` antes de llamar**, porque `process.loadEnvFile`
  lanza una excepción si el archivo no existe.
- **No sobreescribe variables ya definidas en `process.env`.** Las variables reales del
  sistema tienen prioridad sobre el `.env`, que es justo lo que se quiere en despliegue.
- En los tests (T-093) hay que preparar el entorno **antes** de importar nada que
  dependa de `env`, porque el módulo hace `process.exit(1)` si falta una variable.

### 2026-09-30 — `MAILGUN_FROM` acepta email simple y `Nombre <email>`
**Contexto:** el enunciado de T-008 dice `MAILGUN_FROM (string, email)`, pero el
`.env.example` de T-001 tiene `MAILGUN_FROM=Osito a la carta <no-reply@tudominio.com>`.
Verificado: `z.string().email()` **rechaza** ese valor ("Invalid email").
**Decisión:** el schema acepta **ambos formatos** mediante un `refine` + `transform`.
Exporta `MAILGUN_FROM` como objeto `{ raw, email }`, más el derivado
`MAILGUN_FROM_EMAIL`. **Autorizado explícitamente por el dueño.**
**Alternativas consideradas:** (a) `z.string().email()` estricto y corregir
`.env.example` a `no-reply@tudominio.com`; (b) aceptar ambos formatos con solo
`MAILGUN_FROM`; (c) aceptar ambos y exportar el email derivado — elegida.
**Motivo:** Mailgun acepta el formato con nombre, y es lo que hace que el correo al
chef aparezca como "Osito a la carta" en lugar de una dirección cruda. Descartar el
formato con nombre perdería la marca en la notificación más importante del producto.
**Consecuencias:**
- **T-060 (Mailgun) debe enviar `env.MAILGUN_FROM.raw`**, no `.email`: Mailgun espera
  el string completo `"Nombre <email>"`.
- `env.MAILGUN_FROM_EMAIL` está disponible para cuando haga falta solo la dirección.
- El schema **no** acepta un `Nombre <email>` mal formado: el `refine` extrae lo que hay
  entre `<` y `>` y lo valida como email de verdad.

### 2026-09-30 — ESLint 10 flat config con tools en la raíz y configs por workspace
**Contexto:** T-006 pide ESLint + Prettier en `server/` y `client/` con config de
Prettier compartida. La versión vigente de ESLint es la **10**, que solo soporta
**flat config** (`eslint.config.js`); el legacy `.eslintrc.json` ya no es viable.
**Decisión:**
- Las **herramientas** (eslint, @eslint/js, typescript-eslint, globals,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, prettier) se instalan
  **una sola vez en el `package.json` raíz**.
- El **flat config va duplicado**: `server/eslint.config.js` usa `globals.node`;
  `client/eslint.config.js` usa `globals.browser` más los plugins de React
  (`react-hooks` en `recommended` y `react-refresh/only-export-components` como warn).
- **Prettier tiene un único config** en la raíz (`.prettierrc.json`): 2 espacios,
  single quotes, semi, `printWidth: 80`, `trailingComma: 'all'`, `endOfLine: 'lf'`.
- Perfil `recommended` (no `strict`, no `recommended-type-checked`).
- Scripts raíz: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `dev`,
  `dev:server`, `dev:client`, `build`. Los agregadores usan
  `npm run <script> --workspaces --if-present`.
**Alternativas consideradas:** (a) instalar las tools por duplicado en cada workspace:
descartado, duplica versiones y capa de dependencias sin ganancia; (b) un único
`eslint.config.js` en la raíz con ambos entornos: descartado, los globals de Node y
de browser no deben mezclarse en un mismo contexto; (c) perfil `recommended-type-checked`:
descartado por fricción con los flags estrictos de T-002/T-003.
**Motivo:** con npm workspaces las tools se hoistean a la raíz igualmente; declararlas
una sola vez evita el desfase de versiones. La duplicación de `eslint.config.js` es
deliberada y necesaria: cada workspace lintea un entorno distinto.
**Consecuencias:**
- **El linting no conoce los flags de `tsconfig`.** Con el perfil `recommended` no se
  lee `tsconfig.json`, así que `noUncheckedIndexedAccess` y compañía solo los
  vigila `tsc`. ESLint y TypeScript son complementarios, no intercambiables.
- **`.prettierignore` excluye `docs/` y `README.md` a propósito.** Sin eso, Prettier
  reescribe SPEC.md, TASKLIST.md y MEMORY.md enteros, generando diffs enormes y
  modificando SPEC.md sin autorización. No quitar esa exclusión.
- `npm run dev` en la raíz intercala la salida de server y client. Para salidas
  separadas usar `npm run dev:server` y `npm run dev:client` en dos terminales.
- **La versión de Node declarada en la raíz es `^20.19.0 || ^22.13.0 || >=24`**, fijada
  por el dueño el 2026-09-30. No relajar a `>=20`: ESLint 10 no arranca en 20.0-20.18.
  ESLint es la restricción más estricta del toolchain, por encima de Vite 8.

### 2026-09-29 — Project references en el tsconfig del cliente
**Contexto:** el template actual de Vite no trae un `tsconfig.json` único sino tres
archivos: `tsconfig.json` (solo `references`) + `tsconfig.app.json` + `tsconfig.node.json`.
**Decisión:** conservar esa estructura tal cual la genera Vite.
**Alternativas consideradas:** un `tsconfig.json` único y plano.
**Motivo:** es el estándar de la herramienta y separa el código de la app (DOM,
`jsx: react-jsx`) del de las herramientas (`vite.config.ts`, tipos de Node).
**Consecuencias:** el typecheck del cliente es `tsc -b --noEmit`, **no** `tsc --noEmit`.
Ojo: el backend sí usa `tsc --noEmit` porque tiene un solo tsconfig. Los dos comandos
no son intercambiables.

---

## Problemas conocidos / gotchas

> Lista viva de cosas que hay que recordar para no tropezar dos veces.

- **SQLite + Drizzle:** las migraciones no se pueden modificar una vez aplicadas.
  Si hay que corregir, crear una nueva.
- **TanStack Query devuelve `isPending` en render de servidor aunque la caché esté en error.**
  Con `prefetchQuery` para dejar el error en la caché y `refetchOnMount: false`, el
  `renderToStaticMarkup` sigue pintando el esqueleto: el observer arranca en `pending`
  porque no hay montaje real en cliente. Comprobado con una sonda mínima que hace la misma
  llamada a `useQuery`, que también devuelve `isPending`. **Sirve para los estados de carga,
  vacío y con datos, pero NO para probar la rama de error**: si se fuerza y sale skeleton,
  no significa que el código esté mal, sino que el método no puede observarlo. Para la rama
  de error hay que mirar la capa de API (que el error se lanza con su código) o usar un
  navegador de verdad. Visto en T-031.
- **Dos ficheros con el mismo nombre en la misma carpeta se pisan en silencio.** Escribir
  `api/dishes.ts` con los tipos y luego otra vez con el `fetch` deja solo el segundo, y su
  propio `import type` se resuelve a sí mismo: `TS2459 Module declares 'X' locally, but it is
  not exported`. Los tipos se fueron a `dishes.types.ts`. Visto en T-031.
- **Los enunciados dan por hecho ficheros que pueden estar vacíos.** T-032 pedía importar el
  tipo `Dish` de `shared/types.ts` y usar el `Button` de shadcn/ui: no existía ninguno de los
  dos, y el `shared/types.ts` que sí hay (en la raíz, no en el cliente) tiene **cero líneas**,
  igual que `shared/schemas.ts`. **Antes de dar por buena una referencia a un fichero,
  comprobar que tiene contenido, no solo que existe.** Un `Test-Path` da `True` sobre un
  fichero vacío y eso no es lo que se necesita. Visto en T-032.
- **Un fichero que exporta componentes y además funciones rompe el Fast Refresh.** ESLint lo
  avisa con `react-refresh/only-export-components`: al guardar, Vite deja de poder refrescar
  solo el componente y recarga el módulo entero, perdiendo el estado del resto de la pantalla.
  Solución: las funciones van a `lib/` (en T-032, `formatPrice` a `lib/format.ts`) y las
  constantes que solo usa el propio componente se dejan sin exportar. Visto en T-032.
- **`tailwind-merge` es lo que hace que una librería de componentes sea utilizable.** Sin él,
  si un componente fija `px-4` y quien lo usa pasa `px-2`, los dos sobreviven en el `class` y
  gana el que esté después en la hoja de estilos, no en el código. Con `cn` (que encadena
  `clsx` + `twMerge`), el último gana siempre. Verificado en T-032: `cn('... px-4 py-2', 'px-2')`
  devuelve la cadena sin `px-4`, y un `lg:grid-cols-3` no pisa un `grid-cols-2` sin prefijo.
- **Un Vite de una tarea anterior puede quedarse vivo y bloquear el puerto 5173.** El
  arranque nuevo falla con "Port 5173 is already in use" y no es obvious que sea propio: en
  T-031 había un `vite.js` huérfano de T-030. Antes de matar un proceso que ocupa el puerto,
  comprobar su línea de comandos con `Get-CimInstance Win32_Process`. Visto en T-031.
- **Los JSON no se importan en Node sin `with { type: 'json' }`.** En el cliente los importa
  Vite y funciona, pero un script de verificación en Node (`node archivo.mjs`) falla con
  `ERR_MODULE_NOT_FOUND` o lo trata como CommonJS si se importa sin atributo, y el error no
  señala el JSON. Además **un script con `import` fuera del proyecto no resuelve
  `node_modules`**: `better-sqlite3` da `ERR_MODULE_NOT_FOUND` aunque esté instalado, porque
  se busca desde la ruta del script y no desde el `package.json` del workspace. Para
  comprobar cosas de cliente hay que ejecutar el script **desde dentro de `client/`**.
  Visto en T-030.
- **Un `index().on()` suelto no lo detecta drizzle-kit; hay que declarar el índice en el
  callback de la tabla.** Escribir `export const dishesCategoryIdIdx = index('x').on(dishes.categoryId)`
  fuera de `sqliteTable` **compila y pasa `tsc`**, pero `drizzle-kit generate` responde "No
  schema changes, nothing to migrate" y el índice no llega nunca al SQL. La forma correcta es
  el tercer argumento de `sqliteTable`: `(table) => [index('dishes_category_id_idx').on(table.categoryId)]`.
  La señal de que falta algo es que el resumen del propio `generate` diga `dishes 0 indexes`.
  Visto en T-029.
- **El conteo que decide si se puede borrar debe contar filas, no solo las visibles.** Al
  borrar una categoría, contar solo los platos disponibles dejaría pasar categorías con
  dishes deshabilitados, y como la fila sigue existiendo el `DELETE` fallaría después por la
  FK. El conteo va sobre la tabla entera. Distinto del borrado de platos, donde el borrado
  es lógico y por eso `findAvailableDishById` sí filtra. Visto en T-028.
- **Una clave i18n sin usar es invisible para las herramientas.** En T-034 se añadió
  `dish.loading` a los tres idiomas y el esqueleto de carga no la pintaba: ni `tsc` ni ESLint ni el
  build se quejan de una clave declarada y no usada, porque el JSON de traducciones no tiene
  relación con el código que la consume. Peor que la clave muerta era el efecto: la carga era un
  silencio total. Se cazó al renderizar la página y comparar el HTML con las claves. **Cuando se
  añada una clave, hay que usarla en el mismo commit.**
- **`VariantProps<typeof buttonVariants>` sigue funcionando con el `cva` en otro fichero.** Se suele
  esperar un `TS2315` al mover un `cva` fuera del fichero que lo consume, y no es el caso aquí:
  funciona y evita escribir a mano la lista de variantes. Se comprobó moviéndolo y pasando
  `tsc --noEmit` antes de decidir. Visto en T-034.
- **Un `<a>` no puede envolver un `<button>`, y un `<button>` no puede contener un `<a>`.** Por
  eso una tarjeta con enlace y con botón de acción necesita dos enlaces (o un `stretched-link`),
  y por eso "darle aspecto de botón a un enlace" necesita las clases del botón, no el componente
  del botón. De aquí salió extraer `buttonVariants` a `button-variants.ts` en T-034, que además
  es lo que T-032 dejó escrito para ese momento.
- **`i18n.ts` se inicializa al importarse, así que una sonda en Node tiene que crear los globals
  ANTES de importar nada que lo toque.** `client/src/lib/i18n.ts` llama a `i18n.init(...)` en el
  cuerpo del módulo, y las importaciones estáticas de ESM se elevan por encima de cualquier
  `globalThis.window = ...`. Con una importación estática previa, el detector se inicializa sin
  `window`, `i18next-browser-languagedetector` **cachea para siempre** que no hay soporte de
  `localStorage` (`hasLocalStorageSupport`) y la persistencia deja de funcionar **sin ningún
  error visible**: `changeLanguage` resuelve bien el idioma y no escribe nada. Parece un bug de
  `LanguageSwitcher` y es un artefacto de la sonda. La receta que sí funciona es poner los
  `import()` dinámicos con literal **después** de crear `window`, `document` y `navigator`.
  Visto en T-033.
- **Hay una segunda copia de React en `C:\Users\ybotet\node_modules` (19.2.0) y la del proyecto es
  19.3.0.** Un script de comprobación fuera del proyecto resuelve `react-dom` desde el `node_modules`
  del usuario, el componente desde el del proyecto, y el resultado es
  `TypeError: Cannot destructure property 'basename' of ... as it is null` o
  `Invalid hook call`, sin mencionar que hay dos Reacts. Es la versión con dos copias del gotcha de
  "un script fuera del proyecto no resuelve `node_modules`", y es más difícil de ver porque el
  error no dice nada de rutas. **Ejecutar las sondas desde dentro de `client/`.** Al empaquetar con
  esbuild para ejecutarlas en Node hacen falta dos cosas más: `--format=esm` con
  `--banner:js` de `createRequire` (si no, `Dynamic require of "util" is not supported`), y
  `--target=node22`. Visto en T-033.
- **`i18next-browser-languagedetector` no devuelve "el primero que exista", sino una lista.**
  Su `detect()` recorre los detectores del array `detection.order` y **concatena** todo lo que
  encuentra en ese orden; luego i18next elige el primer código de esa lista que soporte
  (`getBestMatchFromCodes`). Por eso poner `navigator` antes que `localStorage` no es "navigator
  si el navegador dice algo y localStorage si no": es **navigator siempre**, porque en un
  navegador `navigator.language` siempre existe. Con `nonExplicitSupportedLngs` activo ni
  siquiera hace falta que coincida exacto, porque `es-ES` ya cuenta como `es`. Y como
  `changeLanguage` llama a `cacheUserLanguage` durante el arranque, el idioma perdido **se
  escribe encima** del que el usuario había elegido. Medido en T-033:

  | `detection.order` | navegador `es-ES`, guardado `ru` | resultado |
  | --- | --- | --- |
  | `['navigator', 'localStorage']` | resuelve `es` | **se pierde la elección** |
  | `['localStorage', 'navigator']` | resuelve `ru` | la elección gana |

  La lección general: **el orden de `detection.order` no es una preferencia de "fallback", es una
  prioridad real.** Antes de deducir nada de un orden, mirar `detect()` en
  `node_modules/i18next-browser-languagedetector/dist/cjs/`. Visto en T-033.
- **Un comentario que describe una opción que no está puesta es peor que ningún comentario.**
  El de `client/src/lib/i18n.ts` sobre el orden de detección mencionaba un `lng` "fijo para el
  detector" que nunca se añadió a la configuración, y su explicación del orden era justo la
  que hace imposible el criterio de T-033. Un comentario hay que revisarlo cuando cambia la
  configuración que describe, no solo cuando se escribe. Visto en T-033.
- **Un `404` de un endpoint anterior no es necesariamente una regresión.** En T-028, tras
  deshabilitar un dish con `PATCH`, su `DELETE` lógico devolvió 404 y parecía un bug
  introducido por la tarea: era el comportamiento intencionado de T-024, que usa
  `findAvailableDishById` y por tanto no ve los ya deshabilitados. Antes de "arreglar" un
  404 en un módulo vecino, comprobar contra el endpoint que lo produce.
- **Un chequeo de "unicidad" que se hace sobre la propia fila da falsos positivos.** En un
  PUT, comprobar `slug` con `SELECT ... WHERE slug = ?` hace que la categoría que se está
  editando colisione consigo misma y devuelva 409 aunque no haya conflicto real. La
  solución es
  excluir la fila editada (`ne(id, excludeId)`). Solo aplica si la columna es clave editable;
  si la clave fuera inmutable, no haría falta. Visto en T-027.
- **Borrar `osito.db-wal` DESPUÉS de aplicar una migración la deshace.** Es el error más
  destructivo de este proyecto y se cuela solo, porque `drizzle-kit migrate` informa
  "migrations applied successfully" y el índice se crea de verdad. En modo WAL las
  transacciones van primero a `osito.db-wal` y solo se vuelcan al fichero principal en un
  checkpoint; borrar el `-wal` antes de ese checkpoint las descarta, aunque la migración
  pareciera aplicada. **Síntoma:** `sqlite_master` no tiene el índice y
  `__drizzle_migrations` tiene una fila menos, pero el `.sql` y el snapshot siguen en el
  repo y `drizzle-kit generate` dice "No schema changes". **Antes de borrar los sidecars,
  hacer `PRAGMA wal_checkpoint(TRUNCATE)`**; después del checkpoint, borrarlos es seguro y
  se comprobó que la migración persiste. Pasó en T-029 y costó una reaplicación.
- **Borrar `osito.db-wal` antes de restaurar una copia de la base hace perder datos.** La
  base está en
  modo WAL, así que al copiar el fichero `osito.db` a pelo **no basta**: los sidecars que
  dejó el servidor siguen ahí y SQLite los reproduce al abrir, devolviendo los datos de las
  pruebas aunque la copia sea limpia. Orden correcto: parar el servidor, copiar `osito.db`,
  borrar `-wal` y `-shm`, y solo entonces verificar. Descubierto en T-026: la primera
  restauración "falló" en silencio y dejó 13 categorías en vez de 5.
- **Telegram Markdown:** los caracteres especiales (`_ * [ ] ( ) ~ \` > # + - = | { } . !`)
  deben escaparse en los mensajes o el envío falla silenciosamente.
- **Mailgun:** el dominio debe estar verificado antes de enviar a cualquier correo.
- **La guía de convenciones se llama `docs/AGENT.md`, no `AGENTE.md`.** Los prompts
  en `docs/PROMPTS.md` y las referencias de `docs/SPEC.md` §5 dicen `AGENTE.md`.
  Buscar `AGENT.md`. No renombrado por no tener autorización.
- **SPEC.md §4 no contiene variables de entorno.** Es la tabla de stack técnico.
  La lista canónica de variables está en `docs/PROMPTS.md` T-008.
- ~~**El backend todavía no sirve nada**~~ → **SUPERADO en T-004** (y duplicado aquí: la
  entrada vigente es la siguiente, tachada). `app.listen()` sí existe desde T-004 y el
  watcher de `tsx` sí abre el puerto. Verificado el 2026-10-02: `GET /api/health`
  responde 200.
- ~~**El backend todavía no sirve nada**~~ → **RESUELTO en T-004**: ya hace `listen`
  y expone `GET /api/health`. Ver "Estado actual del proyecto".
- **Los imports del backend necesitan extensión `.js`** (`from './logger.js'`),
  por `moduleResolution: NodeNext`. Sin ella `tsc --noEmit` **pasa** y el runtime
  falla con `ERR_MODULE_NOT_FOUND`. El typecheck no detecta este error.
- ~~**`PORT` no está validado todavía.**~~ → **SUPERADO en T-008**: `app.ts` ya hace
  `app.listen(env.PORT)` y `env.ts` lo valida con
  `z.coerce.number().int().positive().default(3000)`. Verificado el 2026-10-02 en
  `server/src/app.ts:20` y `server/src/config/env.ts:78`. No queda ningún `process.env.PORT`
  en el backend.
- **`strictPort: true` en el server de Vite es intencional.** Sin él Vite cae a
  `5174`, `5175`... si el puerto está ocupado, y el proxy `/api` y cualquier test
  que apunte a `:5173` fallarían de forma confusa y difícil de diagnosticar.
- ~~**SPEC.md §4 dice "React 18" pero el código usa React 19.3.0**~~ → **RESUELTO
  2026-09-29**: el dueño autorizó actualizar SPEC.md. §4 ahora dice "React 19 + Vite 8"
  y §10 registra la decisión. SPEC.md y el código vuelven a coincidir.
- **PowerShell rompe el flag `--template` de create-vite.**
  `npm create vite@latest <path> -- --template react-ts` ignora el flag (npm lo
  interpreta como config propia) y scaffoldea **vanilla**, no React, sin avisar.
  Usar siempre: `npx --yes create-vite@latest <path> --template react-ts`.
- **El typecheck cambia de comando entre workspaces.** Cliente: `tsc -b --noEmit`
  (project references). Backend: `tsc --noEmit` (tsconfig único). Usar el correcto
  según la carpeta.
- **El template de Vite ya no incluye `strict: true`.** Viene implícito en algunas
  configuraciones de Vite pero el `tsconfig.app.json` que genera create-vite actual
  **no lo declara**. Hay que añadirlo a mano, igual que los flags de AGENT.md.
- **Tailwind 4 no usa `tailwind.config.js` ni directivas `@tailwind`.** Es CSS-first:
  `@import 'tailwindcss'` y `@theme` dentro del CSS. SPEC.md §5 todavía lista
  `client/tailwind.config.js` en el árbol de carpetas: **esa línea está desactualizada.**
  No instalar `postcss`/`autoprefixer` salvo que una dependencia los exija.
- **Las clases de Tailwind construidas por interpolación no se detectan.**
  `` `text-${color}-500` `` no genera CSS. Escribir siempre la clase completa.
  Esto aplica a T-035 (shadcn/ui) y a cualquier badge de color por estado de pedido.
- **ESLint 10 no usa `.eslintrc.json`.** Solo flat config (`eslint.config.js`).
  Buscar un `eslint.config.js` en el workspace que se esté tocando: hay uno por
  paquete, no uno global.
- **`npm run dev` en la raíz intercala la salida de los dos servidores.** Si se
  necesita verlos por separado, usar `npm run dev:server` y `npm run dev:client`
  en terminales distintas.
- **No quitar `docs/` de `.prettierignore`.** Sin esa exclusión, `npm run format`
  reescribe SPEC.md, TASKLIST.md y MEMORY.md completos, y SPEC.md no puede
  modificarse sin autorización explícita del dueño.
- **El linting no ve los flags de `tsconfig`.** El perfil `recommended` no lee el
  tsconfig, así que `noUncheckedIndexedAccess` y el resto solo los comprueba `tsc`.
  Un archivo puede pasar ESLint y fallar `tsc`, o al revés: correr ambos.
- **`pino-pretty` es devDependency y se activa por `NODE_ENV`.** Si producción corre
  sin `NODE_ENV=production`, el logger intenta cargar un paquete que no está
  instalado y el server muere al arrancar. T-094 debe fijar `NODE_ENV=production`
  en el ecosystem de PM2.
- **El `transport` de pino escribe por un worker thread.** En tests, el output puede
  aparecer después del assertion y contaminar la salida de vitest. Para tests,
  forzar `NODE_ENV=production` o inyectar un `destination` en memoria.
- ~~**`LOG_LEVEL` con un valor inválido hace morir a pino. Por eso `logger.ts` valida
  contra una lista explícita y cae a `info`. No quitar esa validación al migrar a
  `env.LOG_LEVEL` en T-008.**~~ → **SUPERADO en T-008**: la migración ya está hecha.
  `server/src/logger.ts:5` hace `level: env.LOG_LEVEL` y `env.LOG_LEVEL` es un `z.enum` de
  los 7 niveles reales, así que un valor inválido es ahora un **error de arranque**, no un
  fallback silencioso a `info`. Verificado el 2026-10-02: `logger.ts` ya no lee
  `process.env`. La lección del predictado invertido sigue vigente abajo.
- ~~Esa validación fue movida a Zod en T-008~~ → **RESUELTO**: `env.LOG_LEVEL` es un
  `z.enum` de los 7 niveles reales, y `logger.ts` ya no lee `process.env`. Un valor
  inválido ahora es un error de arranque, no un fallback silencioso a `info`.
- **`process.loadEnvFile` lanza si el archivo no existe.** Por eso `config/env.ts`
  comprueba con `existsSync` primero. No borrar ese `if`.
- **`config/env.ts` hace `process.exit(1)` al importarse.** Cualquier test que importe
  algo que dependa de `env` puede matar el proceso de vitest entero si falta una
  variable. Preparar el entorno **antes** de los imports.
- **El `.env` está en la raíz, no en `server/`.** Buscarlo en `server/.env` es futile.
- **Zod devuelve "Required" en inglés por defecto.** Los mensajes de arranque están
  en español gracias a `required_error`/`message` personalizados en `config/env.ts`.
  Añadir una variable nueva sin esos campos reintroduce el mensaje en inglés.
- **`.refine(p)` en Zod pasa cuando `p` devuelve `true`.** El predicado debe devolver
  `true` para que el valor sea **válido**, no para rechazarlo. Por eso en
  `config/env.ts` existen las dos funciones: `hasPlaceholder()` detecta el valor malo
  y `rejectPlaceholder()` lo invierte para usarla como predicado. Confundir las dos
  invierte el guard en silencio: el schema acepta exactamente lo que debería rechazar,
  **sin error de tipos y sin fallo de test** si no se prueba el caso negativo.
  **Siempre probar el caso que debe fallar, no solo el que debe pasar.**
- **`tsx watch` no reinicia al cambiar `.env`.** Solo vigila los archivos fuente de
  `src/`. Tras editar el `.env` hay que reiniciar el proceso a mano, o el server
  sigue usando los valores antiguos.
- **`import pkg from './x.json' with { type: 'json' }` rompe en producción sin avisar.**
  Pasa `tsc --noEmit` **y** `npm run build` en verde, pero al ejecutar desde `dist/`
  lanza `ERR_MODULE_NOT_FOUND`: tsc no copia el JSON si está fuera de `rootDir`.
  Usar `createRequire` en el backend. Ver "createRequire para leer package.json".
- **Un `tsc --noEmit` en verde no prueba que el código funcione.** Durante T-009 el
  import de JSON pasó typecheck, lint, format y build, y falló en runtime. Verificar
  siempre con `npm start` sobre `dist/` cuando toque resolución de rutas o módulos.
- **El driver `better-sqlite3` de Drizzle es síncrono y no encadena nada.** Hace falta
  un método terminal explícito (`.get()`, `.all()`, `.run()`). Sin él la sentencia
  **no se ejecuta y no falla**. Además `db.insert(t).values(v).returning()` devuelve el
  builder, no un array: hace falta `.returning().get()` o `.returning().all()`, y
  destructurar el builder lanza `TypeError: object is not iterable`.
- **`db.query.*` no hidrata relaciones en `drizzle-orm@0.45.3`.** Ver la entrada de
  T-010. Usar joins explícitos en `db.select()` hasta que se verifique lo contrario.
- **`drizzle-kit` arrastra vulnerabilidades moderadas de `esbuild <=0.24.2`.**
  Es tooling de desarrollo y no entra en el bundle de runtime. No ejecutar
  `npm audit fix --force`: propone `drizzle-kit@0.18.1`, un downgrade incompatible.
- ~~**`drizzle-kit` y `client.ts` resuelven la ruta de la base por caminos distintos.**
  `db:migrate` usa `drizzle.config.ts` (`dbCredentials.url`) y `client.ts` usa
  `env.DATABASE_URL`. Hoy ambos valen `./osito.db`, pero son dos fuentes de verdad: si
  se cambia solo una, las migraciones y la aplicación apuntan a bases distintas **sin
  ningún error**. Si divergen, los síntomas aparecen como "tabla inexistente" o datos
  que no aparecen tras migrar.**~~ → **RESUELTO el 2026-10-02**: los tres lectores
  (`resolveDatabaseUrl()`, `drizzle.config.ts` y `env.DATABASE_URL`) salen ahora del mismo
  `.env`. Verificado cambiando `DATABASE_URL` a `./probe-unified.db` y comprobando que las
  tres lecturas devolvían ese valor. Antes de arreglarlo hay que saber que
  **drizzle-kit no carga el `.env` por su cuenta** y que **no se puede importar
  `config/env.ts` desde la config**; ver los dos gotchas de arriba y
  `src/db/database-url.ts`.
- **Las rutas de `drizzle.config.ts` son relativas al directorio de trabajo.**
  Ejecutar `drizzle-kit` desde la raíz del monorepo en lugar de `server/` no falla de
  forma evidente: apunta a otras rutas y a otra base. Los scripts `db:*` están en
  `server/package.json` justamente para que se ejecuten con `server/` como cwd.
- **`drizzle-kit generate` es el guard de sincronía esquema/migraciones.** Si responde
  `No schema changes, nothing to migrate`, el esquema y las migraciones están
  alineados; si genera un archivo nuevo, había un cambio de schema sin migrar.
- **`server/src/db/migrations/meta/` está en `.prettierignore` a propósito.** Son
  archivos que escribe drizzle-kit; si se reformatean, el próximo `db:generate` los
  reescribe en su formato original y `format:check` vuelve a fallar. Es el mismo
  criterio que `package-lock.json`: lo generado no se formatea a mano.
- **`db.transaction()` sí funciona con el driver síncrono de better-sqlite3.** El
  callback recibe un `tx` y hay que terminar cada sentencia con `.run()`. Es la vía
  para hacer atómico un seed. Contrasta con el resto del API de Drizzle, que no encadena
  nada en este driver: lo que funciona es `db.transaction`, no el encadenado.
- **Un script de seed debe cerrar la conexión (`sqlite.close()`) o el proceso no
  termina.** Con `journal_mode = WAL` la conexión abierta mantiene vivo el proceso y
  deja `osito.db-wal` y `osito.db-shm` sin limpiar. Ejecutado con `tsx` el síntoma es un
  comando que "termina" sin imprimir nada de salida final.
- **`npm run format:check` de la raíz incluye `.kilo/worktrees/`**, que contiene
  worktrees de Agent Manager ajenos a la tarea en curso y no trackeados por git. Puede
  salir en rojo por culpa de ellos sin que sea culpa del trabajo actual. Confirmar con
  `git status` antes de subir arreglar archivos ajenos.
- **SQLite no puede añadir una columna `NOT NULL` a una tabla con filas, ni aunque
  tenga default.** `drizzle-kit generate` produce este SQL sin avisar de que no va a
  funcionar:
  - `ALTER TABLE t ADD c integer NOT NULL` → `Cannot add a NOT NULL column with default
    value NULL`
  - `ALTER TABLE t ADD c integer NOT NULL DEFAULT 1 REFERENCES r(id)` → `Cannot add a
    REFERENCES column with non-NULL default value`
  La única forma es el **procedimiento oficial de SQLite para modificar una tabla**:
  crear una tabla nueva con el esquema definitivo, `INSERT ... SELECT` los datos,
  `DROP TABLE` la vieja y `ALTER TABLE ... RENAME`, dentro de una transacción y con
  `PRAGMA foreign_keys = OFF` alrededor. Ojo: `PRAGMA foreign_keys` es un **no-op
  dentro de una transacción**, hay que emitirlo fuera. Ver la migración `0001` del
  proyecto, que está comentada paso a paso.
- **Al hacer ese rebuild hay que comprobar que las FKs de otras tablas siguen bien.**
  `order_items` y `page_views` referencian `dishes`; durante la ventana en la que
  `dishes` está borrada quedan colgando. Verificar con `PRAGMA foreign_key_list` antes y
  después y con `PRAGMA foreign_key_check`, no suponerlo.
- **`drizzle-kit` registra las migraciones por hash en `__drizzle_migrations`.** Editar
  el SQL de una migración ya aplicada rompe el tracking (reintenta aplicarla y falla).
  Solo se puede editar una migración que **nunca se ha aplicado**, y conviene
  confirmarlo mirando el journal de la base antes de tocar nada.
- **`npm run build` de la raíz solo compila el client.** Para reconstruir el server hay
  que ejecutar `npm run build --workspace @osito/server`. Con un `dist/` obsoleto, un
  script nuevo falla con errores que parecen bugs de lógica pero en realidad son código
  viejo (en A-001 daba `NOT NULL constraint failed: dishes.category_id` porque el
  `dist` era de antes de las categorías). Si un cambio "funciona con tsx y falla con
  node dist/", **reconstruye `dist/` antes de depurar**.
- **Los seeds con FKs deben borrar en orden inverso a las dependencias.**
  `tx.delete(dishes)` antes que `tx.delete(categories)`, o la FK explota aunque el
  borrado y la inserción ocurran dentro de la misma transacción.
- **`bcryptjs` v3 cambió su API respecto a v2.** Los exports reales son
  `hashSync`, `compareSync`, `genSaltSync`, `getRounds`, `getSalt`, `truncates`,
  `setRandomFallback`, `encodeBase64`, `decodeBase64`. Si buscas `bcrypt.genSalt` +
  `bcrypt.hash` como en la v2, no está: usa `hashSync(password, rounds)`. Comprobar
  los exports (`Object.keys(require('bcryptjs'))`) antes de escribir el código.
- **Un seed sobre una tabla con `UNIQUE` debe hacer `upsert`, no `insert` a secas.**
  Un `insert` directo funciona la primera vez y revienta con
  `UNIQUE constraint failed` en cuanto se reejecuta, que en desarrollo pasa siempre.
  Buscar por la clave natural y actualizar si existe.
- **Los hashes de bcrypt no se deben loguear.** Loguear si `compare` devuelve `true` y
  el prefijo (`$2b$`) para confirmar que se hasheó, nunca el hash completo ni la
  contraseña. Nota: la contraseña del admin de seed está en claro en
  `server/src/db/seed/admin.ts` por decisión del dueño; es consciente, no un descuido.
- **`Accept-Language` no es un idioma, es una lista ponderada.** Los navegadores mandan
  algo tipo `es-ES,es;q=0.9,en;q=0.8`. Comparar el header con una igualdad (`=== 'ru'`)
  falla con casi cualquier cliente real. Lo que funciona: partir por comas, quedarse con
  la parte antes del `;`, leer el peso de `q=`, descartar los `q=0`, ordenar por peso
  descendente y quedarse con el primer idioma **soportado** por el subtag antes del
  guion (`ru-RU` → `ru`). Si ninguno coincide, al idioma por defecto.
- **`noUncheckedIndexedAccess` rompe el encadenado de `split()`.** `part.split(';')[0]`
  y `tag.split('-')[0]` devuelven `string | undefined` y `noUncheckedIndexedAccess` está
  activo en este `tsconfig`. Hay que usar desestructuración con valor por defecto
  (`const [rawTag = ''] = ...`), que además hace el código explícito.
- **Un `.mjs` en Windows no puede hacer `import` de una ruta `C:/...` absoluta.**
  Falla con `ERR_UNSUPPORTED_ESM_URL_SCHEME`. En scripts de verificación usar
  `createRequire(import.meta.url)` y `require()` para el módulo nativo.
- **Express identifica un middleware de error por su aridad, no por el tipo.** Un handler
  de error debe tener los **4 parámetros** (`err`, `req`, `res`, `next`) para que Express
  lo trate como tal; si le quitas el cuarto, deja de ser middleware de error y el `throw`
  se convierte en un 500 genérico. Por eso ESLint se queja de un parámetro que no se
  usa: el proyecto configuró `argsIgnorePattern: '^_'` en el `eslint.config.js` del
  server para marcar esos parámetros.
- **El orden de los middlewares en Express es significativo.** `notFoundHandler` debe
  ir **después** de todos los routers y `errorHandler` después de `notFoundHandler`. Si
  el de errores se registra antes, las rutas nunca llegan a él.
- **Un `throw` en un handler `sync` de Express 5 sí llega al middleware de errores.** En
  versiones anteriores hay que envolverlo a mano con `next()`; no es el caso aquí, y no
  hace falta `try/catch` alrededor de los handlers síncronos.
- **`express.json()` lanza su propio error y no es un `AppError`.** Con el body
  malformado (`{no-json`) lanza un `SyntaxError` con `status: 400` y
  `type: 'entity.parse.failed'`. Un middleware de errores que solo conozca `AppError` y
  `ZodError` lo deja pasar y responde **500**, aunque el error traiga 400. Se reconoce
  con `instanceof SyntaxError && status es number && type === 'entity.parse.failed'`.
- **Sin `express.json()`, `req.body` es `undefined` y toda validación Zod falla.** El
  fallo se ve como "todos los campos obligatorios faltan", que apunta al schema cuando
  el problema es que nadie parseó el body. Registrar el parser **antes** de los routers.
- **Un `UPDATE` parcial no puede construirse con `Object.entries` sobre el body.** Con
  `exactOptionalPropertyTypes` activo (y con columnas `NOT NULL` en SQLite), pasar el
  objeto entero a `.set()` incluye las claves ausentes como `undefined`, y el driver
  intenta escribir NULL donde no se puede. El patrón que funciona es
  `{ ...(body.x !== undefined && { x: body.x }) }` campo a campo. Además, un body con
  **todas** las claves opcionales produce `UPDATE dishes SET WHERE id = ?`, que no es SQL
  válido: hay que comprobar que queda al menos una columna y saltar el `UPDATE`. Ver T-023.
- **Un schema Zod `.partial()` hereda los refinamientos del original.** Derivar
  `updateDishBodySchema` de `createDishBodySchema.partial()` mantiene `trim().min(1)`,
  `.url()` y `.positive()` sin repetir nada, y evita que las reglas de validación del alta
  y las de la edición diverjan en silencio. Es lo que hay que hacer siempre que un endpoint
  de edición comparta campos con el de alta.
- **La comprobación de la BD al terminar de una tarea con escrituras no es opcional.** En
  T-023 las pruebas de `PUT` cambiaron precios y nombres reales, y una restauración manual
  se dejó un `name_en` pisado. Comparar una copia previa fila a fila es lo que lo
  destapó. Copiar `osito.db` antes de probar cuesta un comando y las pruebas de escritura
  siempre dejan algo detrás.
- **Un 204 no puede llevar body: hay que responder con `res.status(204).end()`.** Usar
  `res.json({...})` con 204 hace que Express espere un body que la especificación prohíbe,
  y el cliente recibe algo inconsistente o un error de enrutado. Verificado en T-024 que la
  respuesta llega con cuerpo vacío y **sin `content-type`**, que es la señal de que el 204
  salió bien. En relación: un endpoint sin body no necesita `Accept-Language`, así que el
  servicio no debe devolver nada en ese caso.
- **Un borrado lógico repetido debe ser un no-op, no un error ni un "success" vacío.** Si
  el `UPDATE` de borrado filtra por `is_available = 1` (junto con el `id`), la segunda
  llamada toca 0 filas y hay que decidir en código si eso es éxito o fallo. La salida
  limpia es: el `WHERE` va solo por `id` y la comprobación de existencia la hace el servicio
  con la consulta que ya filtra por disponibilidad. Así el 404 sale gratis y el
  repositorio no necesita saber nada de disponibilidad.
- **Borrar lógicamente no es una preferencia de estilo: es lo que mantiene el historial
  legible.** `order_items.dish_id` y `page_views.dish_id` apuntan a `dishes.id`, y
  `order_items.unit_price` congela el precio del pedido, así que conservar la fila no
  genera ambigüedad. Antes de tocar cualquier tabla a la que otras tablas referencien,
  comprobar `PRAGMA foreign_key_list` y `PRAGMA foreign_key_check` en vez de suponerlo.
- **Un `DELETE` físico sobre una tabla con FKs `NO ACTION` falla en cuanto una sola fila la
  referencia.** Comprobado: `order_items.dish_id` y `page_views.dish_id` apuntan a
  `dishes.id` con `on_delete: NO ACTION`, así que borrar un plato que solo tenga visitas
  registradas (casi todos) lanza `SQLITE_CONSTRAINT_FOREIGNKEY`, igual que si tuviera
  pedidos. La comprobación **tiene que hacerse en el servicio antes del `DELETE`**, con
  consultas de conteo, para poder responder 409 en vez de dejar que reviente el constraint.
  Comprobar primero con `PRAGMA foreign_key_list`, no suponer que "no hay pedidos, se
  puede".
- **Un recurso oculto necesita su propia consulta sin el filtro de visibilidad.**
  `findAvailableDishById` filtra por `is_available = 1`, así que un plato deshabilitado es
  invisible para el servicio entero: habilitarlo, purgarlo o auditarlo es imposible con
  esa consulta. Hace falta una gemela sin el `where`. Es el mismo motivo por el que
  `db.query.*` no hidrata relaciones y se usan joins explícitos: **la consulta decide qué
  filas existen para el código, no solo qué filas se ven.**
- **`z.coerce.boolean()` convierte `"false"` en `true`.** En JS cualquier string no vacío
  es truthy, así que un cliente que mande `{"isAvailable": "false"}` por un formulario
  deshabilitaría justo lo que quería habilitar. Para booleanos de una API JSON usar
  `z.boolean()` sin `coerce` y devolver 400 ante un string. Verificado.
- **Un 409 no debe modificar nada.** Los dos 409 del purgado (plato todavía disponible, o
  con historial) se comprueban **antes** de escribir, y se verificó que la fila sobrevive
  con `is_available = 0` intacto. Si el guard estuviera después del `UPDATE`, el 409 dejaría
  el plato a medio camino.
- **El enunciado de una tarea puede pedir filtrar por una columna que esa tabla no tiene.**
  En T-025 pedía "devuelve las categorías con `isAvailable = 1`", pero `categories` solo tiene
  `id, slug, name_es, name_ru, name_en, sort_order`: el `is_available` es de `dishes`. Se
  detectó mirando `PRAGMA table_info(categories)` y `schema.ts` antes de escribir código.
  **Un filtro pedido en el enunciado hay que contrastarlo con la tabla real**, porque puede
  venir copiado del enunciado de otro endpoint: el criterio de aceptación de la propia tarea
  (que no pedía filtrar) y SPEC §6 (que no define el campo) apuntaban en la otra dirección.
- **Probar que un `ORDER BY` usa la columna es más fácil de lo que parece, y más fácil de
  fallar.** En T-025, subir `bebidas` a 99 y bajar `sopas` a 0 **no cambió el orden**, porque
  las otras filas seguían en medio: la prueba parecía pasar sin probar nada. Lo concluyente
  fue **negar todos los `sort_order` a la vez**, que invierte la respuesta entera y eso no lo
  puede producir un orden por `id`. Añadir a la lista de pruebas: el caso negativo debe ser
  inequívoco, no solo "cambió un valor".
- **Los ids de las filas insertadas no empiezan en 1.** Las 5 categorías tienen ids 2 a 6 (el
  1 lo consumió la categoría de reserva `sin-categoria` que crea el seed y luego se borra).
  Sirve como prueba gratis de que el orden de la respuesta viene de `sort_order` y no del
  id, porque en este caso coinciden por casualidad: conviene mirar los ids reales antes de
  concluir que "el orden es correcto".
- **Cuando una función genérica se muda a `shared/`, hay que quitar el reexport del módulo
  viejo.** `dishes.service.ts` seguía exportando `resolveLanguage` por compatibilidad, y eso
  deja dos rutas públicas a lo mismo: una correcta (`shared/language.ts`) y otra que
  perpetúa la dependencia que se quería eliminar. Si alguien importa desde el sitio viejo,
  la mudanza no se ha hecho. Quitar el reexport de una vez y que el typecheck marque los
  importadores afectados.
- **`drizzle-kit` NO carga el `.env`.** Comprobado el 2026-10-02 inyectando un log
  temporal en `drizzle.config.ts`: con un `.env` correcto, `process.env.DATABASE_URL`
  llegaba como **`undefined`**. Por eso la config tiene que resolver la ruta por su cuenta
  (hoy con `resolveDatabaseUrl()`, que carga el `.env` de la raíz) y no puede confiar en
  leer `process.env` directamente. Es también el motivo de que el import desde
  `drizzle.config.ts` funcione: drizzle-kit resuelve los imports relativos, pero no ejecuta
  el cargador de `.env` que usa el resto del backend.
- **No importar `config/env.ts` desde `drizzle.config.ts`.** Se probó y funciona, pero
  `env.ts` hace `process.exit(1)` si falta cualquier variable, así que **`db:generate`
  moría pidiendo `MAILGUN_API_KEY`** para generar una migración que no tiene nada que ver
  con el correo (verificado: salía "Variables de entorno invalidas o faltantes. -
  MAILGUN_API_KEY: Requerida" y exit 1). Por eso existe
  `src/db/database-url.ts`, que resuelve **solo** `DATABASE_URL` y cae al default en vez de
  morir. Con ese diseño, `db:generate` funciona aunque falten las variables de Mailgun y
  Telegram (verificado).
- **Un script de prueba que inserta en una tabla con FK necesita una fila válida en la
  tabla padre.** Insertar un `order_item` con un `order_id` inventado falla por la FK del
  `order_id`, no por la del `dish_id`, y el error apunta al campo equivocado: parece que
  el borrado lógico rompió la integridad cuando lo que falta es el padre.
- **La comparación contra una copia previa de la base sigue pagando.** En T-024, igual que
  en T-023, la restauración manual dejó un `is_available = 0` sin querer y la comparación
  fila a fila lo detectó. Es tentador dar por hecho que "ya lo restauré" y no lo está.
- **Un `.cjs` de verificación con `await` en el nivel superior no arranca**, y un script
  escrito desde la herramienta puede llegar con la ruta acentuada corrupta si se pasa por
  `Set-Content`. Para scripts de un solo uso: envoltorio en `.mjs` con
  `createRequire(import.meta.url)`, y resolver `node_modules` por ruta relativa al `cwd`
  (los `node_modules` se hoistean a la raíz) en vez de escribir la ruta absoluta acentuada.
- **`Zod` descarta las claves ausentes de un `.partial()`**, así que `Object.keys(body)`
  sirve para saber si el body traía algo que actualizar. Si el body viene con
  `{ price: undefined }` explícito, Zod lo trata como ausente y el conteo da 0.
- **Zod por defecto descarta los campos extra del body en vez de rechazarlos.** Para que
  un campo inesperado sea un 400 hace falta `.strict()`. En `POST /api/dishes` se dejó
  sin `.strict()`, pero conviene saber que mandar `isAvailable: 0` no cambia nada: el
  repositorio lo fija en 1, no confía en el cliente.
- **Con Tailwind 4 un token nuevo del tema va en los DOS bloques de `index.css`, y el valor
  se duplica si se olvida el segundo.** En `:root` va el valor (`--primary: oklch(...)`) y en
  `@theme inline` el mapeo a utility (`--color-primary: var(--primary)`). Si falta el mapeo,
  la clase `bg-primary` **no se genera** y no hay ningún error: el CSS sale simplemente sin
  ella. Y `inline` no es decorativo: sin él Tailwind copia el valor en cada utility y cambiar
  el tema obligaría a regenerar el CSS. Visto en T-035, donde el bloque `@theme inline` no
  existía y por eso no había ningún token.
- **El alias `@/` hay que declararlo en TypeScript y en Vite, o uno de los dos miente.**
  `paths` en `tsconfig.app.json` (y en `tsconfig.json`, que es el que resuelve `tsc -b`) hace
  que `tsc` pase; `resolve.alias` en `vite.config.ts` es lo que hace que el import funcione en
  el navegador. Con solo el `paths`, el typecheck sale verde y el navegador falla con un
  import que no se encuentra. El valor sale de `import.meta.url` porque `client/package.json`
  es `"type": "module"` y `__dirname` no existe. Visto en T-035.
- **`components.json` tiene que estar en la carpeta de la app, no en la raíz del monorepo.**
  La CLI de shadcn lo busca junto al `tsconfig.json`/código de la aplicación: en la raíz
  respondía `Failed to load tsconfig.json` y desde `client/` decía que no había
  `components.json` y proponía crear uno. Se movió a `client/`. Visto en T-035.
- **Del registro de shadcn hay que retocar dos cosas en `button.tsx` o se pierde
  comportamiento.** Una, **`type="button"` por defecto**: el registro no lo pone y un
  `<button>` sin `type` dentro de un `<form>` es `submit` (con `asChild` no se aplica, porque
  el hijo puede ser un `<a>` y ahí es HTML inválido). Dos, **`buttonVariants` sin exportar**:
  el registro lo exporta, y exportarlo desde un fichero que también exporta un componente
  dispara `react-refresh/only-export-components`, que es el mismo gotcha que ya tenía T-032.
  Visto en T-035.
- **`CardTitle` es un `div`, no un `<h3>`**, aunque parezca un título: el encabezado va dentro
  si quieres la semántica. Un `<h2>` dentro de un `<h3>` tampoco vale. Visto en T-035.
- **`npm run format` desde el workspace del cliente reformatea `client/dist`.** El
  `.prettierignore` está solo en la raíz y Prettier lo busca **en el directorio desde el que
  se ejecuta**, así que desde `client/` no aplica ninguno de sus patrones. Para tocar solo
  código del cliente: `npx prettier --write src` desde `client/`, o `npm run format:check`
  desde la raíz, que es la comprobación que se usa en el checklist. Visto en T-035.
- **`npm run format:check` recorría los worktrees de `.kilo/`.** Son una copia entera del repo
  y Git los excluye por su cuenta (`.git/info/exclude`), pero Prettier no lee eso: fallaba con
  40 archivos ajenos. Se añadió `.kilo` al `.prettierignore` de la raíz. Visto en T-035.
- **Con el servidor de Vite levantándose en paralelo, `tsc` puede dar un `TS2307` fantasma.**
  Pasó una vez en T-035 con `class-variance-authority` instalado y presente en
  `node_modules`: `--traceResolution` llegaba a la carpeta del paquete y no la encontraba, y el
  mismo comando después, cinco veces seguidas, no falló ninguna, con los imports en el mismo
  orden. No es un problema del paquete ni del `paths`: si aparece, se reintenta y, si se repite
  siempre, se mira que el `node_modules` del workspace no esté a medio instalar. Visto en T-035.
- **El `UNIQUE` de SQLite sobre `TEXT` distingue mayúsculas.** `users.email` es `text unique` y
  eso significa que `Ana@ejemplo.com` y `ana@ejemplo.com` son **dos filas distintas**: la
  comprobación de "ya existe" no dispara y se registran dos usuarios con la misma casilla en la
  práctica. Por eso T-040 normaliza el email a minúsculas (y sin espacios) **en el schema**, no en
  el servicio: así la comprobación y el `INSERT` reciben el mismo valor. Un `lower()` en el `WHERE`
  o un `COLLATE NOCASE` en la columna serían las otras dos maneras de arreglarlo; la primera
  obligaría a normalizar también al escribir y la segunda es una migración.
- **bcrypt corta la contraseña a los 72 bytes y no lo dice.** Se comprobó en T-040: dos
  contraseñas distintas de 76 caracteres que compartían los 72 primeros **autentican la una
  contra la otra** (`compare` devuelve `true`). El límite es en **bytes**, no en caracteres: 40
  `ñ` son 80 bytes, así que un `z.string().max(72)` por caracteres dejaría pasar la contraseña y
  seguiría truncándose por dentro. El filtro correcto mide con `Buffer.byteLength(v, 'utf8')`.
- **Con better-sqlite3, un `SELECT` seguido de un `INSERT` no puede intercalar otra petición.**
  Los dos son síncronos y se ejecutan en el mismo tick de Node, así que un "comprobar y luego
  insertar" cubre la carrera por sí solo, sin tocar el `UNIQUE`: es lo que hace que en T-026
  (slug) y en T-040 (email) 12 peticiones simultáneas den 1 × 201 y 11 × 409. **Ese invariante
  se rompe en cuanto se mete un `await` en medio** (por ejemplo, pasar de `bcrypt.hashSync` a
  `bcrypt.hash` para no bloquear el event loop): entonces hay que capturar el
  `SQLITE_CONSTRAINT_UNIQUE` y devolver el 409 de la API, o el perdedor de la carrera se lleva un
  500.
- **Un 400 de Zod devuelve todos los issues, no solo el primero.** En T-040, una contraseña de
  siete espacios salía con dos entradas en `details` a la vez (`too_small` y el `custom` del
  refine). El frontend puede esperar la lista completa y no hace falta recorrer el body buscando
  el primer error.
- **`process.loadEnvFile()` no pisa las variables que ya existen en `process.env`.** Se comprobó
  en T-040: con `PORT=3100` en la consola, `node dist/app.js` arrancó en el 3100 aunque el
  `.env` de la raíz diga `PORT=3000`. Sirve para levantar el `dist/` en otro puerto mientras el
  `tsx watch` sigue en el suyo, y comprobar los dos modos a la vez.
- **Al probar endpoints que escriben, copia la base antes y compara después tabla por tabla,
  incluido `sqlite_sequence`.** En T-040 los `DELETE` de limpieza dejaron el autoincremental de
  `users` en 6 con la tabla vacía: la comparación de filas daba idéntica y, sin embargo, el
  siguiente alta empezaba en `id = 7`. Hay que restaurar `sqlite_sequence` a mano. Visto en T-040.
- **El test de concurrencia se hace con `fetch` en paralelo desde Node, no con `Invoke-WebRequest`
  en bucle.** PowerShell 5.1 no tiene paralelismo (`ForEach-Object -Parallel` es de la 7) y una
  petición detrás de otra no prueba la carrera: hay que disparar las N a la vez con
  `Promise.all` y contar los códigos de respuesta. Visto en T-040 (y en T-026).
- **Un `compare` de bcrypt a 10 rounds cuesta ~100 ms con `bcryptjs`, y eso se nota desde fuera.**
  Medido en T-041: el login correcto de un usuario real tarda ~103 ms de mediana, y una petición
  que ni siquiera llega a bcrypt (un 400 de validación) responde en ~10 ms. **Un 10x de diferencia
  es lo que permite enumerar qué emails están registrados**, aunque el mensaje y el `code` sean
  idénticos: el tiempo también filtra. La solución es comparar igualmente contra un hash de
  relleno cuando el usuario no existe, y con 15 peticiones intercaladas por grupo la diferencia de
  medianas bajó a 5 ms.
- **`jsonwebtoken` no distribuye sus tipos:** hace falta `@types/jsonwebtoken` aparte, y es
  dependencia de desarrollo. Además es un paquete CommonJS, así que desde este proyecto (ESM con
  `verbatimModuleSyntax`) el import tiene que ser por defecto, `import jwt from 'jsonwebtoken'`,
  como con `bcryptjs`. Sus exports son `sign`, `verify`, `decode`, `JsonWebTokenError`,
  `TokenExpiredError` y `NotBeforeError`.
- **En `jsonwebtoken`, `subject` es obligatorio como texto:** `sub: user.id` con un número falla el
  type, hay que `String(user.id)`; y quien lo lea después tiene que hacer `Number()`, porque JWT no
  sabe que ahí va un id.
- **Para comparar tiempos hacen falta dos cosas, o el resultado no sirve de nada:** las muestras
  **intercaladas** (un existing, un missing, un existing...) y saber leer la mediana en vez de la
  media. En T-041 la media salía 38 ms por dos picos sueltos del servidor (uno era la primera
  petición en frío, 737 ms) mientras la mediana marcaba 5 ms.
- **`VACUUM INTO 'ruta.db'` hace una copia consistente de la base en un solo comando**, sin
  tener que acordarse de copiar también el `-wal` y el `-shm` de una base en WAL. Útil antes de
  probar endpoints que escriben, sobre todo si las consultas de comparación van a abrir la copia.
  Visto en T-041.
- **Un token renovado en el mismo segundo que el login es byte a byte idéntico al del login.** La
  firma de un JWT es un HMAC determinista sobre la carga útil, así que mismo `sub` + mismo `iat` +
  mismo secreto = mismo token. Visto en T-042, y es una sorpresa fácil cuando se prueba el
  endpoint recién autenticado y se compara el token "nuevo" con el viejo esperando que cambie.
- **`jsonwebtoken` no deja firmar un payload que sea una cadena con `expiresIn`.** Da
  `invalid expiresIn option for string payload`, porque el `exp` solo tiene sentido en un objeto.
  Para probar ese caso (token firmado sin claims, que `verify` devuelve como `string` y no como
  `JwtPayload`) hay que firmarlo **sin** opciones. Visto en T-042.
- **Nada de rutas calculadas con `resolve(moduleDir, '../../..')`.** Todo lo que se busca a
  partir de la ubicación del módulo (el `.env`, el `package.json` del health) tiene que
  **subir buscando el fichero**. T-044 movió el `rootDir` del servidor a la raíz del
  repositorio, y con el `resolve` fijo pasaron de tres niveles a cinco: el `.env` dejó de
  encontrarse (el servidor moría con "Copia .env.example a .env") y el módulo de health
  reventó con `MODULE_NOT_FOUND`. Está en `server/src/shared/project-paths.ts`. Visto en T-044.
- **`Buffer` no existe en el navegador.** Los schemas de `shared/schemas.ts` se ejecutan
  también en el cliente con `zodResolver`, y el `Buffer.byteLength` que usaba el servidor para
  medir la contraseña en bytes habría dado "Buffer is not defined" al escribir en el
  formulario. Ahora usa `TextEncoder`, que funciona en los dos lados y cuenta UTF-8 igual.
  Visto en T-044.
- **Un esquema que se comparte no puede llevar dentro su propio `*/`.** Escribir
  `shared/**/*.ts` dentro de un comentario de bloque lo cierra antes de tiempo y el resto del
  fichero se parsea como código (`TS1160: Unterminated template literal` y errores en cascada
  que apuntan a líneas equivocadas). Se escribe "los ficheros de `shared/`". Visto en T-044.
- **Con `renderToStaticMarkup`, un store de Zustand se ve en su estado inicial.** React usa
  `getInitialState()` como snapshot de servidor, así que un componente que use un selector
  devuelve `false` aunque el store tenga la sesión rehidratada del `localStorage`. Para
  comprobarlo hay que mirar `getState()` (o montar en cliente). En el navegador no pasa: el
  store se rehidrata al cargar el módulo, antes del primer render. Visto en T-045.
- **`tsx` no lee el `jsx: react-jsx` del cliente.** `client/tsconfig.json` es un fichero de
  referencias sin `compilerOptions`, así que un script de verificación que importe un `.tsx`
  del cliente compila JSX con el runtime clásico y falla con `React is not defined`. Se
  arregla con `npx tsx --tsconfig ./tsconfig.app.json script.tsx`. Visto en T-044 y T-045.

---

## Historial de entradas

> Las entradas se agregan aquí en orden cronológico inverso (la más reciente arriba).

### 2026-10-04 — T-044 Páginas `/login` y `/register`
**Estado:** completada

**Qué se hizo:**
- `client/src/pages/Login.tsx` y `client/src/pages/Register.tsx` con React Hook Form y
  `zodResolver`, rutas `/login` y `/register` dentro del layout y el enlace del navbar
  habilitado.
- `client/src/api/auth.ts` (`registerUser`, `loginUser`) y `client/src/api/http.ts`, donde se
  movieron `ApiError` y `requestJson` para que auth y platos no dependan uno del otro.
- **Las reglas de validación del email y la contraseña se movieron a `shared/schemas.ts`**,
  que hasta ahora era un fichero de 0 bytes, y las dos sides los importan.

**Cómo se hizo:**
- **T-045 se hizo primero**, por decisión del dueño: T-044 tenía que guardar los tokens en un
  store que no existía.
- `shared/schemas.ts` expone **fábricas** (`createRegisterBodySchema`,
  `createLoginBodySchema`) que reciben los mensajes. Las reglas se comparten; los textos son de
  cada lado: el servidor responde en español (T-040) y el cliente en es/ru/en.
- `server/tsconfig.json`: `rootDir` a `".."` y `shared/` en el `include`, porque `rootDir: ./src`
  daba **TS6059** al importar de `shared/`. `npm start` pasó a `dist/server/src/app.js`.
- `server/src/shared/project-paths.ts`: el `.env` y el `package.json` se buscan **subiendo en
  el árbol** en vez de contando niveles, porque el cambio de `rootDir` los dejó a otra
  distancia (ver gotchas).
- Dependencias del enunciado: `react-hook-form`, `@hookform/resolvers` y `zod` en el cliente.
- 21 claves i18n nuevas en los tres idiomas.

**Por qué se hizo así:**
- **Tras registrarse la página entra sola.** `POST /api/auth/register` devuelve solo el
  usuario, sin tokens (T-040), así que hace `register` y luego `login` con las mismas
  credenciales. Cumple el criterio ("redirige a `/menu` autenticado") sin tocar el endpoint.
- **El error va en línea con `role="alert"`, no en un toast:** `toast` es de T-092 por decisión
  registrada del dueño, y un aviso que desaparece a los cinco segundos deja sin pista a quien
  navega con teclado.
- **Los mensajes se eligen por `code`, no se pinta el `error` del backend.** El backend
  responde en español; con `INVALID_CREDENTIALS` y `EMAIL_TAKEN` hay clave propia en es/ru/en.
- **El esquema se construye dentro del componente con `useMemo`**, no en el módulo: los
  mensajes salen de `t()` y así cambiar de idioma rehace el esquema con los textos nuevos.
- **`ApiError` no se quedó en `api/dishes.ts`:** si `api/auth.ts` importara de ahí, la
  dependencia apuntaría al revés y tocar el módulo de platos rompería el login sin que se
  viera.
- **`requestJson` no añade `Authorization` ni renueva el token:** eso es T-046, que ya tiene
  el punto de enganche en `api/http.ts`.

**Impacto en otras tareas:**
- **T-046** envuelve `requestJson`: solo faltan `Authorization`, el refresh automático y
  `Accept-Language`.
- **T-092** sigue instalando `toast` y `dropdown-menu`; estas páginas ya tienen dónde enseñar
  el error cuando llegue.
- **El `dist` del servidor cambió de layout.** `npm start` y el `script` de PM2 de T-094 son
  ahora `dist/server/src/app.js`; `docs/PROMPTS.md` ya está actualizado.
- Cerrar sesión sigue sin sitio en la interfaz (es de T-045/T-046), y **SPEC §7.2 paso 2**
  (actualizar `preferred_lang` al cambiar el idioma con sesión) sigue pendiente porque no hay
  endpoint para eso.

**Pendientes / deuda técnica:**
- **Los cuerpos de respuesta no se validan con Zod en el cliente**, solo lo que se envía. Es el
  mismo criterio de T-034: el backend valida lo que serializa.
- **El texto del backend solo está traducido si el cliente tiene clave para su `code`.** Un
  `code` nuevo que no aparezca en los JSON se pintaría en el idioma en que lo escriba el
  servidor.

---

### 2026-10-03 — T-042 `POST /api/auth/refresh`
**Estado:** completada

**Qué se hizo:**
- Renovación del access token a partir de un refresh token válido, con 401
  `INVALID_REFRESH_TOKEN` para cualquier otro caso.

**Cómo se hizo:**
- **Sin ficheros nuevos y sin dependencias nuevas:** se ampliaron los cuatro ficheros del módulo
  (`auth.schema.ts` + `refreshBodySchema`, `refreshClaimsSchema`, `refreshResponseSchema`;
  `auth.repository.ts` + `findUserById`; `auth.service.ts` + `verifyRefreshToken`,
  `invalidRefreshToken` y `refreshAccessToken`; `auth.routes.ts` + la ruta).
- `jwt.verify` con `algorithms: ['HS256']` explícito, como exigía la decisión promovida en T-041.
  **Ese `algorithms` no es opcional:** sin él, `jsonwebtoken` acepta el algoritmo que declare la
  cabecera del token.

**Por qué se hizo así:**
- **El token va en el body y no en la cabecera `Authorization`:** es la única petición que el
  cliente hace cuando ya no puede usar esa cabecera porque el access ha caducado.
- **El shape del payload se valida con Zod aunque el token esté firmado**, por dos razones que se
  refuerzan: `jwt.verify` devuelve `string | JwtPayload` (un token con payload de tipo string no
  tiene `.sub` ni `.type`, y sin esa comprobación el código leería `undefined` en vez de responder
  401), y el `z.literal('refresh')` es la segunda barrera del `type` que fijó T-041.
- **`safeParse` y el fallo se traduce a 401, no a 400.** Para el cliente el token no valió; un 400
  de validación aquí sería un error de programación, no de credenciales.
- **El mismo 401 para todo** (caducado, firma inválida, `type` equivocado, `sub` inválido, usuario
  borrado): para el cliente es la misma situación, la sesión terminó. El `catch` también traga el
  error de base de datos, para que una caída de `users` produzca el 401 conocido en vez de un 500
  que dejaría al usuario sin explicación.
- **El usuario se relee de la base por `sub`** y no se copia del token: el `role` del access nuevo
  tiene que ser el de ahora, y una cuenta borrada no debe poder renovar con un token aún vivo.
- **La respuesta es solo `{ accessToken }`.** El refresh no se renueva y el `user` no se devuelve:
  rotar de verdad exige una tabla de tokens revocados (decisión de T-045) y el cliente ya tiene
  el usuario en Zustand.

**Impacto en otras tareas:**
- **T-043 (`requireAuth`)** sigue siendo la pieza que falta: hasta que exista, los tokens se
  emiten pero ninguna ruta los comprueba. Le toca exigir `type === 'access'`, verificar con
  `JWT_SECRET` y decidir si se fía del `role` del token o va a la base.
- **T-046 (interceptor)**: este 401 es el que le dice "cierra la sesión", y es **el mismo `code`
    cuando el refresh ha caducado a los 7 días** que cuando el token está manipulado. No hay forma de
    distinguirlos por diseño, así que el cliente no debe intentar renovar en bucle: un 401 en
    `/auth/refresh` significa limpiar sesión y, como mucho, llevar al login.
- **T-045 (sesión)**: persiste los dos tokens; si algún día rota el refresh, el endpoint tiene que
  devolver el nuevo refresh token además del access.

**Pendientes / deuda técnica:**
- **No hay rotación ni revocación:** el mismo refresh token sirve para renovar hasta que caduca,
  y no hay forma de invalidarlo antes (verificado: tres renovaciones seguidas con el mismo token
  dan 200, y al borrar la cuenta el mismo token da 401). Es la misma deuda que dejó T-041.
- **Un token renovado en el mismo segundo que el login es byte a byte idéntico** al del login
  (misma carga útil → misma firma HMAC). No es un fallo, pero no hay que esperar un token siempre
  distinto.

---

### 2026-10-03 — T-041 `POST /api/auth/login`
**Estado:** completada

**Qué se hizo:**
- Autenticación por email y contraseña con `bcrypt.compare`, 401 `INVALID_CREDENTIALS` si falla y
  emisión de los dos tokens (access 15 min, refresh 7 días) firmados con secretos distintos.

**Cómo se hizo:**
- **Sin ficheros nuevos:** se ampliaron los cuatro del módulo que creó T-040
  (`auth.schema.ts` + `loginBodySchema`/`loginResponseSchema`, `auth.repository.ts` +
  `findUserByEmail`, `auth.service.ts` + `loginUser`, `auth.routes.ts` + `POST /auth/login`).
- Modificados: `server/package.json` y `package-lock.json` con `jsonwebtoken@9.0.3` y
  `@types/jsonwebtoken@9.0.10` (solo desarrollo).
- `findUserByEmail` es exactamente la función que T-040 dejó anotada como pendiente para esta
  tarea: `SELECT` con `passwordHash`, `role` y `preferredLang`, con su propia proyección
  `authUserProjection`, separada de la pública.

**Por qué se hizo así:**
- **La dependencia sí estaba autorizada:** el enunciado nombra `jsonwebtoken` explícitamente, que
  es justo el motivo por el que T-035 se detuvo (allí el enunciado pedía componentes sin nombrar
  Radix, que además estaba denegado). `@types/jsonwebtoken` es inevitable porque el paquete no
  distribuye tipos. Comprobado con `npm audit` que `jsonwebtoken` no aparece en ninguna
  vulnerabilidad; los 4 avisos moderados del repo son de `drizzle-kit → esbuild` y son previos.
- **El claim `type` (`'access' | 'refresh'`)** es la pieza de la que dependen T-042 y T-043; sin él
  un refresh token serviría como credencial en cualquier ruta protegida. Ver "Decisiones
  arquitectónicas clave".
- **El refresh se firma con `JWT_REFRESH_SECRET` y el access con `JWT_SECRET`.** El enunciado solo
  pedía "secretos desde env"; usar los dos a propósito es lo que hace que cada token solo valga
  para lo suyo. Verificado: uno no verifica con el secreto del otro.
- **`email` y `role` solo en el access.** El refresh no los lleva, así que T-042 tiene que releer
  el usuario de la base al renovar (que además es lo correcto: así un refresh sigue valiendo si el
  rol ha cambiado).
- **El login reutiliza `emailSchema` con su normalización, pero no `passwordSchema`.** El login
  responde "¿son estas las credenciales?", no "¿cumple las reglas?": con el `min(8)` del registro
  una contraseña corta daría 400 en vez del 401 que el cliente tiene que pintar.
- **`compareSync` y no `hash` asíncrono**, para conservar el invariante síncrono que decidió
  T-040. El coste medido es que el login bloquea el event loop ~100 ms.

**Impacto en otras tareas:**
- **T-042 (refresh)**: verificar con `JWT_REFRESH_SECRET`, exigir `type === 'refresh'` y releer el
  usuario de la base. Con `TokenExpiredError` se distingue "caducado" de "no válido".
- **T-043 (`requireAuth`/`requireAdmin`)**: verificar con `JWT_SECRET`, exigir
  `type === 'access'` y decidir si se fía del `role` del token (cuesta 0) o va a la base (cuesta 1
  query). Si se fía del token, un cambio de rol tarda hasta 15 min en aplicarse; está anotado en el
  propio `auth.service.ts`.
- **T-045 (Zustand + `localStorage`)**: los dos tokens se persisten; no hay cookies, así que no
  hay `httpOnly` que organizar ni CSRF que evitar con el access.
- **T-046 (interceptor)**: el 401 del access ya viene con `code: 'INVALID_CREDENTIALS'`
  distinguished de un `VALIDATION_ERROR`, así que el interceptor puede usar `code` y no el texto.
- **T-093 (vitest)**: los secretos se leen de `env` al importar el módulo, así que los tests
  tienen que preparar el entorno antes (el aviso ya estaba en la entrada de T-008).

**Pendientes / deuda técnica:**
- **No hay logout real:** los refresh tokens son sin estado (no hay tabla donde revocarlos), así
  que cerrar sesión solo deja de renovar, y el token sigue siendo válido hasta que caduca a los 7
  días. Una revocación de verdad exige tabla de tokens o una columna `token_version` en `users`,
  y eso es una migración nueva. Decisión pendiente para T-045.
- **El login bloquea el event loop ~100 ms** con `bcryptjs` a 10 rounds. Con `bcrypt` nativo sería
  varias veces menos, pero T-013 ya decidió `bcryptjs` para no tener compilación nativa. Si algún
  día moleste, es el sitio donde mirar (y el cambio obliga a lo de T-040).

---

### 2026-10-03 — T-040 `POST /api/auth/register`
**Estado:** completada

**Qué se hizo:**
- Alta de cliente con email único, hash bcrypt y 409 `EMAIL_TAKEN` si el email ya existe.
- Primer módulo de `auth/` y el primero que escribe en `users`.

**Cómo se hizo:**
- Creados: `server/src/modules/auth/auth.schema.ts`, `auth.repository.ts`, `auth.service.ts`,
  `auth.routes.ts`. Modificado: `server/src/app.ts` (monta `authRouter` en `/api`).
- Estructura de cuatro ficheros según AGENTE.md §2.2, como `dishes` y `categories`.
  **Sin dependencias nuevas:** `bcryptjs` ya estaba desde T-013 y Zod es el validador del proyecto.
- `201` con `{ id, email, role, preferredLang }`; la ruta define `/auth/register` sin prefijo
  (convención de T-009/T-020).

**Por qué se hizo así:**
- **El email se normaliza a minúsculas en el schema.** El `UNIQUE` de SQLite sobre `TEXT`
  distingue mayúsculas, así que sin normalizar `Ana@ejemplo.com` y `ana@ejemplo.com` serían dos
  usuarios con la misma casilla en la práctica y el 409 no dispararía. Va en el schema, no en el
  servicio, como el `slug` de T-026: la comprobación y el `INSERT` reciben el mismo valor.
- **`role` no se acepta del body** (lo fija el repositorio a `customer`), igual que T-022 con
  `isAvailable`. Zod descarta claves desconocidas, así que `{"role":"admin"}` se ignora.
- **`passwordHash` no está en el shape de la respuesta** ni en la proyección del `.returning()`:
  así no sale ni por descuido, en vez de depender de acordarse de quitarlo.
- **Contraseña rechazada por encima de 72 bytes** (el punto donde bcrypt corta en silencio) y
  **sin `.trim()`**, pero rechazando la que sea solo espacios. Recortar cambiaría el secreto
  respecto de lo que comparará el login de T-041, y ocho espacios pasarían un `min(8)` pelado.
- **`preferredLang` obligatorio**, tal como lo pedía el enunciado, aunque la columna tenga
  `default 'es'`: SPEC §7.2 quiere que el idioma guardado sea el que el usuario está viendo.

**Impacto en otras tareas:**
- **T-041 (login)** necesita `findUserByEmail` con `passwordHash`, `role` y `preferredLang`, y
  un `bcrypt.compare` (**con `bcryptjs`, no `bcrypt`**, como ya decidió T-013). Aquí solo se
  creó `emailExists`, porque leer la fila completa no lo necesita nadie todavía.
- **T-043** ya tiene dónde colgar `requireAuth`: el módulo `auth` existe y las clases de error
  (`UnauthorizedError`, `ForbiddenError`) ya estaban en `shared/errors.ts` desde T-021.
- **T-045 / T-046 (sesión)** arrastran lo que SPEC §7.2 paso 2 ya-avía pendiente: el alta es hoy
  el único camino que fija `preferredLang`, y actualizarla al cambiar de idioma sigue sin endpoint.
- **T-044 (formularios)** ya tiene `Input` y `Label` (de T-035); este endpoint es su `submit`.

**Pendientes / deuda técnica:**
- **Invariante síncrono, escrito también en el propio `auth.service.ts`:** mientras el hash sea
  `hashSync`, entre `emailExists` y `INSERT` no cabe otra petición, y por eso el 409 por
  comprobación cubre la carrera (probado: 12 POST simultáneos → 1 × 201 y 11 × 409). Si el hash
  pasa a `bcrypt.hash` (asíncrono, para no bloquear el event loop ~100 ms), hay que **capturar
  el `SQLITE_CONSTRAINT_UNIQUE` y devolver el mismo 409**, o dos registros simultáneos con el
  mismo email darán 500.
- Los mensajes de error siguen en inglés o español según el módulo y sin i18n; el frontend
  tendrá que traducir por `code`, no por `error`.

---

### 2026-10-03 — T-035 Estilos base con Tailwind + shadcn/ui
**Estado:** completada (retoma la entrada del 2026-10-02, que sigue intacta más abajo)

**Qué se hizo:**
- El tema de shadcn/ui en `client/src/index.css`: tokens `:root` + mapeo `@theme inline`.
- Los componentes del registro en `src/components/ui/`: `button` (con `Slot`, `asChild` y
  `type="button"`), `card`, `input` y `label`.
- `DishCard`, `Layout`, `Menu` y `DishDetail` migrados a esos componentes; navbar con enlaces
  reales; `components.json` movido a `client/`; alias `@/` declarado en `tsconfig` y en Vite.

**Cómo se hizo:**
- Creados: `client/src/components/ui/card.tsx`, `input.tsx`, `label.tsx`.
- Modificados: `client/src/components/ui/button.tsx`, `client/src/index.css`,
  `DishCard.tsx`, `Layout.tsx`, `pages/Menu.tsx`, `pages/DishDetail.tsx`,
  `client/vite.config.ts`, `client/tsconfig.app.json`, `client/tsconfig.json`,
  `client/package.json`, `.prettierignore`. Borrado: `client/src/components/ui/button-variants.ts`.
- Movido: `components.json` de la raíz a `client/`.
- Dependencias añadidas (con autorización del dueño): `@radix-ui/react-slot` (lo necesita el
  `Button` oficial para `asChild`), `@radix-ui/react-label` (solo para `Label`) y
  `tw-animate-css` (animaciones de los overlays; hoy todavía sin usar).
- `buttonVariants` dejó de exportarse y `ui/button-variants.ts` se borró: con el `Button`
  oficial, `asChild` sustituye al apaño que T-034 necesitó para dar estilo de botón a un enlace.

**Por qué se hizo así:**
- **El enunciado ("instalar y configurar shadcn/ui") describía un trabajo que ya estaba hecho a
  medias.** shadcn/ui no se instala: la CLI copia ficheros. T-032 ya había copiado `Button`,
  `cn` y las dependencias; lo que faltaba de verdad era el tema, del que dependía todo lo demás.
- **`@theme inline` y no `tailwind.config.js`:** T-005 decidió que con Tailwind 4 la
  configuración es CSS-first. Crear el fichero de config ahora sería contradecir una decisión
  cerrada, y AGENTE.md §1 prohíbe reabrir decisiones de SPEC.
- **Los tokens son la paleta `stone` literal de Tailwind,** no valores inventados: así
  `bg-muted` y un `bg-stone-100` de T-032 a T-334 son el mismo color y la UI no se desincroniza.
- **Solo tema claro:** el producto no tiene modo oscuro, así que el bloque `.dark` sería código
  muerto.
- **`toast` y `dropdown-menu` no se instalaron:** son 4 archivos más con dependencias de Radix
  que T-033 ya había denegado, y su consumidor es T-092. Se decidió por partes; está en
  "Decisiones resueltas" de `TASKLIST.md`.

**Impacto en otras tareas:**
- **T-092** es quien instala `toast` y `dropdown-menu`, y quien pide `@radix-ui/react-toast` y
  `lucide-react` con motivo.
- **T-044** tiene ya `Input` y `Label`; solo falta `react-hook-form` con su `zodResolver`.
- **T-053** y **T-044** solo tienen que quitar el `disabled` de sus botones del navbar.
- **T-091 (responsive)** hereda los breakpoints de aquí (`sm:grid-cols-2`, `md:grid-cols-2` y el
  `flex-wrap` del navbar).
- La CLI de shadcn **ya funciona** desde `client/`, que era el bloqueo registrado el 2026-10-02.

**Pendientes / deuda técnica:**
- `tw-animate-css` está instalada y ningún componente la usa todavía; la usarán los overlays.
- **No se ha verificado el aspecto en un navegador de verdad** (el proyecto no tiene navegador
  automatizado). Se comprobó el CSS generado en el build y servido por Vite: los tokens se
  emiten y `.bg-primary` compila a `background-color: var(--primary)`.
- `input` y `label` no tienen consumidor hasta T-044; es deliberado, no código muerto por error.

---

### 2026-10-01 — A-001 Categorías de platos (tabla `categories`)
**Estado:** completada

**Qué se hizo:**
- Nueva tabla `categories` (`id`, `slug` unique, `nameEs/Ru/En`, `sortOrder`) y
  `dishes.categoryId` como FK `NOT NULL`, en `server/src/db/schema.ts`.
- Migración `0001_broad_the_stranger.sql`, **reescrita a mano** (ver gotcha).
- `server/src/db/seed/dishes.ts` crea 5 categorías y reparte los 5 platos:
  sopas, pastas, ensaladas, postres y bebidas.
- `docs/SPEC.md` §6 actualizado con la tabla `Category` y el nuevo campo en `Dish`,
  **con autorización explícita del dueño del proyecto**.

**Por qué se hizo así:**
- Tabla separada en vez de enum en `dishes`: el proyecto es multi-idioma desde el día 1
  (SPEC §4, AGENTE.md §2.5) y un enum en código impediría traducir el nombre. Así hay
  `slug` estable para filtros y URLs, nombres en los tres idiomas y `sortOrder` para
  reordenar el menú sin migrar.
- Los platos preexistentes se asignan a una categoría de reserva `sin-categoria`
  (sort_order 999), porque una migración no puede saber a qué categoría pertenecía cada
  uno. El seed los recrea bien.
- El seed borra `dishes` antes que `categories` por la FK, y resuelve los ids de
  categoría por `slug` desde lo recién insertado, con un error claro si un slug no
  existe. Declara los platos con `Omit<NewDish,'categoryId'> & { categorySlug }` en
  vez de intersecar con `NewDish`, que ya exige `categoryId` y daba error de tipos.

**Comprobado:**
- La migración aplica **tanto en una base con 5 platos como en una vacía**. Esto es
  lo importante: la versión que generaba drizzle-kit a secas fallaba en la base con
  datos.
- 5 categorías ordenadas, 5 platos con categoría, 0 sin categoría, 0 slugs duplicados,
  `PRAGMA foreign_key_check` limpio y `category_id` rechazando ids inexistentes.
- Las FKs de `order_items` y `page_views` hacia `dishes` siguen intactas tras el rebuild.
- Seed idempotente (5 y 5 tras reejecutar) y `db:generate` sin cambios pendientes.

**Impacto en otras tareas:**
- T-020 (`GET /api/dishes`) necesita un JOIN a `categories` para devolver el nombre ya
  localizado, y si agrupa debe ordenar por `categories.sort_order`, no por id.
- T-031/T-032 ya tienen las 5 categorías con nombre en los tres idiomas para pintar el
  menú agrupado.
- T-022/T-023 (alta/edición de platos) deberán exigir `categoryId`, y **no existe
  endpoint de categorías**: hay que decidir si admin elige un id fijo o si se añade un
  CRUD de categorías. Pendiente de decisión del dueño.

**Pendientes / deuda técnica:**
- `dishes.category_id` no tiene índice. Como el CRUD de categorías ya está decidido
  (T-025–T-028) y agrupar o filtrar el menú por categoría es un caso de uso real, se
  dejó planificado como la tarea **T-029** en TASKLIST.md.

### 2026-10-02 — Deuda acumulada hasta T-025: gotchas obsoletos, numeración y ruta de la BD
**Estado:** completada.

**Qué se hizo:**
- Tres gotchas que describían código inexistente, marcados como superados (no borrados).
- Las referencias a mis T-030/T-031 corregidas a **T-029a/T-029b**.
- Unificada la ruta de la base de datos: nuevo `server/src/db/database-url.ts`, usado por
  `drizzle.config.ts` y por `src/db/client.ts`.

**Por qué se hizo así:**
- **Los gotchas obsoletos eran actively dañinos, no solo ruido.** Decían que `PORT` se leía
  sin validar, que `LOG_LEVEL` caía a `info` con un fallback, y que el backend no abría
  puerto. Los tres son falsos: `app.ts:20` hace `app.listen(env.PORT)`, `logger.ts:5` usa
  `env.LOG_LEVEL` (que es un `z.enum`) y `/api/health` responde 200. Un agente que los leyera
  concluiría que el código está mal. Se **tacharon con la evidencia concreta** en vez de
  borrarse, para que se vea qué cambió y cuándo.
- **Se respetó la regla de no borrar entradas**, aunque se nauseó "borrar y reescribir":
  el propio prompt del proyecto dice que MEMORY solo se agrega. Se usó el formato
  `~~tachado~~ → RESUELTO/SUPERADO` que ya usan otras entradas del archivo.
- **La numeración la cambió el dueño al renumerar el TASKLIST**: mis dos tareas de
  disponibilidad pasaron de T-030/T-031 a **T-029a/T-029b**, y los T-030/T-031 actuales son
  otras tareas distintas (react-i18next y `/menu`). Solo se corrigieron las cabeceras de mis
  entradas; las menciones a T-031/T-032 que hablan del frontend se dejaron como estaban
  porque siguen siendo correctas.
- **Unificar la ruta de la BD no es "importar `env.ts` en la config", y se comprobó por
  qué no.** Dos restricciones reales, ambas medidas:
  1. **drizzle-kit no carga el `.env`**: con un `.env` correcto, `process.env.DATABASE_URL`
     llegaba a `drizzle.config.ts` como `undefined`. Leer `process.env` ahí habría caído
     siempre al default y seguido divergiendo en silencio, que es exactamente el bug.
  2. **Importar `config/env.ts` funciona pero rompe**: `env.ts` hace `process.exit(1)` si
     falta cualquier variable, y se comprobó que **`db:generate` moría pidiendo
     `MAILGUN_API_KEY`** para generar una migración. Eso es una regresión real.
  La solución es un resolvedor mínimo que lee **solo** `DATABASE_URL` y cae al default sin
  morir. `env.DATABASE_URL` se conserva en `env.ts`: sigue validando el entorno al arrancar
  la app, que sí necesita todas las variables.

**Comprobado:**
- `db:generate` y `db:migrate` funcionan con el `.env` completo.
- **`db:generate` funciona con el `.env` sin `MAILGUN_API_KEY` ni `TELEGRAM_BOT_TOKEN`**
  (exit 0), que es la regresión que el diseño anterior habría introducido.
- **Las tres lecturas coinciden:** poniendo `DATABASE_URL=./probe-unified.db`,
  `resolveDatabaseUrl()`, `drizzle.config.ts` y `env.DATABASE_URL` devolvieron las tres el
  valor nuevo. Ese es el criterio de aceptación real de esta deuda.
- `typecheck`, `lint`, `format` y `build` en verde; endpoints de dishes y categories
  respondiendo con normalidad tras el cambio de `client.ts`; base sin cambios
  (6 dishes, 5 categorías, 1 usuario) y `foreign_key_check` limpio.

**Impacto en otras tareas:**
- **T-094 (PM2) y T-096 (backup)** pueden confiar en una sola variable para la ruta de la
  base. El backup diario seguirá siendo correcto porque la app y las migraciones ya no
  pueden apuntar a sitios distintos.
- T-029 (índice de `dishes.category_id`) necesita un `db:generate` que funcione; ahora no
  depende de tener Mailgun y Telegram configurados, lo que importa en un entorno limpio.
- **Lo que NO se tocó, a propósito:** la autorización (T-043), los mensajes de error sin
  i18n y la ausencia de `updatedAt` siguen pendientes. Son deuda real, pero de tareas
  futuras o de frontend que todavía no existe; se irán resolviendo al llegar.

**Pendientes / deuda técnica:**
- Sigue sin haber auditoría de quién cambia la disponibilidad de un plato, y `dishes` no
  tiene `updatedAt`. Sin decidir si hace falta.
- `env.DATABASE_URL` y `resolveDatabaseUrl()` leen la misma variable pero por caminos
  distintos a propósito. Si algún día se añade otra forma de apuntar a la base (por
  ejemplo una URL absoluta en producción), hay que revisar los dos sitios.

### 2026-10-01 — T-025 `GET /api/categories`
**Estado:** completada.

**Qué se hizo:**
- Módulo `categories` con los cuatro archivos de AGENTE.md §2.2 (`routes`, `service`,
  `repository`, `schema`), montado con `app.use('/api', categoriesRouter)`.
- `server/src/shared/language.ts`, donde se muda `resolveLanguage` (estaba en
  `dishes.service.ts`).
- Respuesta `{ language, categories }`, cada elemento con `id`, `slug` y `name` localizado.

**Por qué se hizo así:**
- **El enunciado pedía filtrar por `isAvailable = 1` y esa columna no existe en
  `categories`.** Comprobado en la base (`id, slug, name_es, name_ru, name_en, sort_order`),
  en `schema.ts` (el único `isAvailable` es el de `dishes`) y en SPEC §6, que define
  `Category` sin ningún campo de disponibilidad. El dueño decidió devolver **las 5
  categorías sin filtro**. Ojo: **el enunciado de la tarea estaba mal en ese punto** y el
  criterio de aceptación de TASKLIST no pedía filtrar. Si algún día hay que ocultar una
  categoría del menú, es una columna nueva y una migración nueva.
- **`resolveLanguage` se mudó a `shared/language.ts`.** MEMORY lo pidió explícitamente en
  T-020 ("cuando exista la segunda implementación conviene moverla a un módulo
  compartido") y en T-021 ("`resolveLanguage` sigue en el servicio de dishes: T-025 debe
  seguir reutilizándolo"). Esta era la segunda implementación. Se **eliminó** del servicio
  de platos y ya no se reexporta: el idioma se saca de `shared`, no de un servicio
  concreto. Duplicar el parseo del header era la alternativa y habría significado dos
  listas de idiomas y dos pesos `q` que mantener en un sitio solo.
- **La respuesta usa el envoltorio `{ language, categories }`**, igual que
  `GET /api/dishes`. El enunciado decía "devuelve las categorías"; se mantiene la forma
  por coherencia, ya que el frontend necesita saber con qué idioma se resolvió.
- **El orden es `sort_order` y luego `id`**, no solo por `id`: `sortOrder` existe
  justamente para que el admin reordene el menú sin migrar.

**Comprobado:**
- Sin header → `es`; `ru` → `Супы и бульоны, Паста и рис, Салаты, Десерты, Напитки`;
  `en` → `Soups and broths, Pasta and rice, Salads, Desserts, Drinks`. Textos distintos
  entre sí, cirílico real, ningún nombre vacío.
- **El `sortOrder` manda, demostrado de forma concluyente:** negando todos los `sort_order`
  la respuesta se invierte por completo, algo que ordenar por `id` jamás daría. Además los
  ids son 2-6, no 1-5, así que el orden de salida no coincide con el de ids.
- **14 cabeceras `Accept-Language`, 0 fallos**: sin header, `ru`, `en`, `RU`, `ru-RU`,
  `ru-RU,ru;q=0.9,en;q=0.8`, `en;q=0.8,ru;q=0.9`, `fr-FR,fr;q=0.9`, `de;q=0.9,en-US;q=0.7`,
  `ru;q=0`, `*`, vacío y `xx;q=abc,ru`.
- **Regresión tras mover `resolveLanguage`:** `GET /api/dishes` sigue localizando bien en
  es/ru/en, el detalle y los 404 intactos, `/api/health` en 200.
- `typecheck`, `lint` y formato en verde; los dos modos (`tsx` y `node dist/app.js`)
  idénticos. Base verificada fila a fila contra copia previa: sin cambios.

**Impacto en otras tareas:**
- **T-026–T-028 (CRUD de categorías) dejan de depender de un endpoint inexistente.** Este
  era el getter que el admin necesitaba para elegir categoría; hasta ahora `POST /api/dishes`
  exigía un `categoryId` que había que saber de memoria.
- T-031/T-032 pueden pintar los grupos con el nombre ya localizado.
- **Este GET es público y lo seguirá siendo**, también con `requireAdmin` en T-043: es
  lectura de menú, igual que `GET /api/dishes`. Solo las escrituras se protegen.
- T-029 (índice de `dishes.category_id`) sigue pendiente y ya es más relevante: el menú
  agrupado por categoría consulta dishes con filtro por esa columna.

**Pendientes / deuda técnica:**
- No hay forma de ocultar una categoría del menú (no existe la columna). Anotado, no
  comprometido.
- El `name` de este endpoint y el de `dish.category.name` en `GET /api/dishes` salen de la
  misma fila, así que no pueden divergir; si alguien cachea uno y no el otro, la UI
  mostrará nombres viejos.

### 2026-10-01 — T-029a y T-029b `PATCH .../availability` y `DELETE .../permanent`
> **Nota de numeración (2026-10-02):** estas dos tareas se crearon como T-030 y T-031 y
> el dueño las renumeró después a **T-029a** (habilitar/deshabilitar) y **T-029b** (purgar).
> Los T-030 y T-031 actuales del TASKLIST son otras tareas (react-i18next y la página
> `/menu`).
**Estado:** completadas **a medias en cuanto a autorización**: los tres endpoints de
escritura sobre platos siguen públicos hasta que T-043 conecte `requireAdmin`.

**Qué se hizo:**
- `PATCH /api/dishes/:id/availability` con `{ isAvailable: boolean }`: habilita o
  deshabilita un plato y devuelve 200 con el plato ya localizado.
- `DELETE /api/dishes/:id/permanent`: purga física, devuelve 204 sin body.
- Repositorio: `findDishById` (sin filtro de disponibilidad), `setDishAvailability`,
  `purgeDish` y `countDishReferences`. Servicio: `setDishAvailability` y `purgeDish`.
- `availabilityBodySchema` en `dishes.schema.ts`. Ningún archivo nuevo.

**Por qué se hizo así:**
- **Son tres endpoints con responsabilidades separadas**, por petición del dueño. Antes
  solo había `DELETE` (que deshabilita) y no había ni vuelta atrás ni borrado real:
  - `DELETE /api/dishes/:id` → deshabilita, la fila se conserva (T-024).
  - `PATCH /api/dishes/:id/availability` → habilita/deshabilita, la fila se conserva.
  - `DELETE /api/dishes/:id/permanent` → purga, **la fila desaparece**.
- **El purgado lleva dos 409, decididos por el dueño:** `DISH_STILL_AVAILABLE` si el plato
  sigue visible, y `DISH_HAS_HISTORY` si hay `order_items` o `page_views`. El flujo es
  deshabilitar → revisar → purgar, y ningún 409 modifica nada.
- **Los conteos se hacen en el servicio y no se intenta el `DELETE`.** No es hipotético:
  `order_items.dish_id` y `page_views.dish_id` están en `on_delete: NO ACTION`, así que
  SQLite aborta el `DELETE` en cuanto una sola tabla referencia el plato. Se comprobó en
  una base desechable que falla incluso con **solo `page_views`** y ningún pedido. Haciendo
  la comprobación antes, el cliente recibe un mensaje de API en vez de una excepción.
- **Los conteos van separados en `details`** (`{ id, orderItems, pageViews }`) porque no es
  lo mismo un plato con historial comercial que uno solo visitado.
- **Habilitar necesita una consulta que no filtre por disponibilidad.** `findDishById` es
  `findAvailableDishById` sin el `where is_available`: un plato deshabilitado es invisible
  para todo el resto del módulo, así que sin esta consulta no se podría recuperar.
- **`availabilityBodySchema` usa `z.boolean()` sin `coerce`.** Con `z.coerce.boolean()` el
  string `"false"` es truthy en JS y se convertiría en "habilitar" cuando el cliente quería
  deshabilitar. Verificado que `"false"`, `1`, `null`, `{}` y JSON malformado dan 400.
- **`isAvailable` no se acepta en el POST ni en el PUT.** El PATCH es el único sitio del
  API donde el cliente controla la disponibilidad, y ahora por una vía explícita y no
  colada en el body de edición.

**Comprobado:**
- Ciclo completo: deshabilitar (204, sale del listado, `is_available = 0`) → recuperar
  (200, vuelve al listado, `is_available = 1`) → deshabilitar → purgar (204, **la fila ya
  no existe**, `count` de 6 a 5, `GET` del purgado 404).
- Los dos 409, con y sin pedidos: con 1 pedido + 1 visita, y con **solo 1 visita**. En
  ambos casos la fila sobrevive con `is_available = 0` y no se toca nada.
- 404 en purgar y en PATCH sobre id inexistente; 400 en `:id` inválido.
- `typecheck`, `lint` y formato en verde; los dos modos (`tsx` y `node dist/app.js`) con
  resultados idénticos.
- **Base verificada y restaurada:** estas pruebas borran filas de verdad, así que se copió
  la base antes y se comparó al terminar. Se repusieron los platos purgados y la tabla
  quedó idéntica, con `foreign_key_check` limpio.

**Impacto en otras tareas:**
- **T-043 debe añadir `requireAdmin` a los tres endpoints.** El purgado es el más
  peligroso: **no desplegar antes de T-043**.
- **T-028 (`DELETE /api/categories/:id`) ya tiene respuesta:** un dish deshabilitado sigue
  contando como plato asociado para su 409, porque la fila permanece. Purgado el dish
  deshabilitado y sin historial, la categoría queda liberada. Flujo natural: purgar, luego
  borrar la categoría.
- T-051 (`POST /api/orders`) debe seguir rechazando platos deshabilitados.
- La ausencia de `updatedAt` se nota más aquí: no se sabe **cuándo** se deshabilitó ni
  **cuándo** se purgó un plato. Sigue sin resolverse.

**Pendientes / deuda técnica:**
- Falta la autorización (T-043) en los tres endpoints de escritura.
- No hay registro de quién hizo cada cambio de disponibilidad: sin `users` involvement ni
  campo de auditoría. Aceptado de momento, pero es lo primero que faltaría en multiusuario.
- Los mensajes de error siguen sin i18n, como en T-021 a T-024.

### 2026-10-01 — T-024 `DELETE /api/dishes/:id` (borrado lógico)
**Estado:** completada **a medias en cuanto a autorización**: el borrado de platos es
público hasta que T-043 conecte `requireAdmin`. Es la vía más destructiva de las tres
escrituras y por eso la nota es la importante de esta entrada.

**Qué se hizo:**
- `DELETE /api/dishes/:id` que marca `is_available = 0` y responde **204 sin body**.
- `softDeleteDish` en el repositorio, `deleteDish` en el servicio, y la ruta en
  `dishes.routes.ts`. Ningún archivo nuevo.

**Por qué se hizo así:**
- **El servicio comprueba la existencia con `findAvailableDishById`, que ya filtra por
  `is_available = 1`.** Por eso un plato ya borrado responde 404 igual que uno que nunca
  existió, sin código extra: es la misma decisión de T-021 de no revelar qué platos
  hubo, y hace el DELETE idempotente desde fuera.
- **El `WHERE` del UPDATE es `id = ?` a secas, sin filtrar por `is_available`.** Si
  filtrara, borrar un plato ya borrado tocaría 0 filas y la segunda llamada devolvería algo
  distinto de la primera. Que el UPDATE sea inocuo en ese caso y que el 404 lo decida el
  servicio son responsabilidades separadas: el repositorio no necesita saber si el plato
  existe.
- **El servicio no devuelve nada y la ruta responde 204 con `end()`, no `json()`.** Un
  `json()` emitiría un body que un 204 prohíbe. No se construyó una respuesta "por si
  acaso": `Accept-Language` es irrelevante en un endpoint sin body.
- **Borrado lógico, no `DELETE` real**, y esto no es solo una preferencia: `order_items` y
  `page_views` referencian `dishes.id`. Comprobado que un `order_item` sigue siendo válido
  apuntando a un plato con `is_available = 0` (`foreign_key_check` limpio y el
  `unit_price` conservado). Un `DELETE` real dejaría el historial apuntando a platos
  inexistentes, que es justo lo que un panel de pedidos necesita para seguir siendo legible.

**Comprobado:**
- Criterio: `DELETE` → 204 con cuerpo vacío y sin `content-type`; la lista pasó de 6 a 5
  platos; la fila sigue en la BD con `is_available = 0` y precio, `name_ru`,
  `created_at` y `category_id` intactos. `count(dishes)` sigue en 6: **0 filas eliminadas**.
- 404 en los tres casos: plato inexistente, plato ya borrado e `:id` inválido
  (`abc`, `0` → 400 `VALIDATION_ERROR`).
- Colaterales: tras el borrado, `GET /api/dishes/2` y `PUT /api/dishes/2` dan 404, y el
  listado sigue localizándose en `ru`, `en` y sin header. `POST` de T-022 sigue creando
  platos borrables, y su borrado también marca `is_available = 0`.
- `typecheck`, `lint` y formato en verde; los dos modos (`tsx` y `node dist/app.js`) con
  resultados idénticos.
- **Base verificada sin residuos:** copia previa y comparación fila a fila de `dishes`, más
  el conteo de las otras seis tablas. Todo idéntico a como estaba.

**Impacto en otras tareas:**
- **T-043 debe añadir `requireAdmin` a este DELETE.** Cualquiera que alcance la API puede
  borrar platos: **no desplegar antes de T-043**.
- **No existe forma de restaurar un plato borrado**, y no se ha inventado ninguna. Resucitar
  con el `PUT` exigiría aceptar `isAvailable` en el body, lo que rompe la decisión de
  T-022 y T-023 de que el cliente no controla la disponibilidad. Si el chef necesita
  recuperar un plato por error, hay que decidir antes la vía (endpoint propio o
  `PATCH .../availability`).
- **T-028 (`DELETE /api/categories/:id`) debe decidir si un plato borrado lógicamente cuenta
  como "asociado"** para su 409. La fila sigue existiendo, así que un `count` sin filtro
  la contaría. Es la lectura conservadora (no deja categorías con platos invisibles) pero
  conviene que se confirme de forma explícita.
- T-031/T-032 no necesitan cambios: el listado filtraba por `is_available = 1` desde T-020.

**Pendientes / deuda técnica:**
- Falta la autorización (T-043).
- No hay `updatedAt` en `dishes`: el borrado lógico no deja constancia de **cuándo** se
  retiró un plato ni **quién** lo hizo (el `created_at` es de creación). Si más adelante
  hace falta auditar el menú, habrá que añadir columnas en una migración nueva.
- Los mensajes de error siguen sin i18n, como en T-021, T-022 y T-023.

### 2026-10-01 — T-023 `PUT /api/dishes/:id`
**Estado:** completada **a medias en cuanto a autorización**: la edición de platos es
pública hasta que T-043 conecte `requireAdmin`. Igual que en T-022, y así queda anotado.

**Qué se hizo:**
- `PUT /api/dishes/:id` con validación Zod del body y del `id`, devuelve 200 con el plato
  ya actualizado y localizado según `Accept-Language`, reutilizando `toResponse` de T-020.
- `updateDishBodySchema` en `dishes.schema.ts` y `updateDish` en el repositorio, el
  servicio y el router. Ningún archivo nuevo.

**Por qué se hizo así:**
- **`updateDishBodySchema` es `createDishBodySchema.partial()`, no una copia.** La entrada
  anterior de T-022 lo exigía expresamente ("T-023 debe reutilizar este mismo schema en vez
  de duplicarlo"), y hay una razón de fondo: si el alta cambia una regla (`price` positiva,
  `trim().min(1)`, URL válida), el PUT la hereda sola. Escribir los campos opcionales a
  mano crea dos listas que se divergen en silencio, y el síntoma aparece como un 400 en un
  endpoint que nadie tocó.
- **Actualización parcial, no reemplazo.** Solo se escribe lo que llega en el body. Con
  `.partial()` + un `SET` construido a mano, un `PUT {"price": 12.5}` no toca nombre,
  descripción, ingredientes ni imagen. Comprobado comparando el plato antes y después.
- **`categoryId` sigue siendo opcional pero se valida si viene**, devolviendo
  `400 CATEGORY_NOT_FOUND` como en el alta, para que la FK no reviente como error de SQLite.
- **Un body vacío devuelve 200 sin escribir.** Se comprueba la existencia y se salta el
  `UPDATE`, porque `UPDATE dishes SET WHERE id = ?` no es SQL válido. **No se inventó un 400**
  para ese caso: el enunciado solo pedía el 404 y no hay regla previa que obligue. Si se
  quiere como error, son tres líneas.
- **`is_available = 0` responde 404 también en el PUT**, igual que en el GET, por la misma
  decisión de T-021 de no revelar qué platos existieron.

**Comprobado:**
- Criterio: `PUT {"price": 9.99}` → 200 con `price: 9.99` en la respuesta y confirmado en la
  BD con el nombre y la categoría intactos; `PUT /api/dishes/999999` → 404
  `DISH_NOT_FOUND` con `details: { id: 999999 }`.
- No se pisan los campos ausentes: `PUT {"price": 12.5}` no cambió ninguno de los otros
  cuatro campos de la respuesta.
- Validación: `price` 0 / -5 / `"mucho"`, `imageUrl` no URL, `nameEs: "   "`, `id` `abc` y
  `0` → 400. JSON malformado → 400 `INVALID_JSON`. `categoryId: 9999` → 400
  `CATEGORY_NOT_FOUND`; `categoryId: 3` → 200 y cambia de categoría. Campos extra se
  descartan (`{"hack": "x"}` → 200).
- Localización del PUT comprobada en `es`, `ru` y `en`, y el cirilico guardado con los
  code points correctos.
- POST de T-022 sigue funcionando, también sobre un plato recién creado.
- `typecheck`, `lint` y formato en verde; los dos modos (`tsx` y `node dist/app.js`) con
  resultados idénticos. `/api/health` en 200 y el 404 global en `NOT_FOUND`.
- **Base de datos verificada sin residuos:** copia previa y comparación fila a fila al
  terminar. Los 5 platos del seed quedaron idénticos, incluidos los precios tocados.

**Impacto en otras tareas:**
- **T-043 debe añadir `requireAdmin` a este PUT.** Mientras tanto cualquiera que alcance la
  API puede editar platos: **no desplegar antes de T-043**, igual que con el alta.
- T-024 (borrado lógico) no necesita tocar el PUT: `isAvailable` sigue sin aceptarse en el
  body. Lo decide el endpoint de borrado.
- T-027 (`PUT /api/categories/:id`) es el mismo patrón aplicado a otro recurso: derivar el
  schema con `.partial()` y validar el slug antes de escribir.

**Pendientes / deuda técnica:**
- Falta la autorización (T-043).
- Los mensajes de error siguen sin i18n, como se dejó constancia en T-021 y T-022.

### 2026-10-01 — T-022 `POST /api/dishes`
**Estado:** completada **a medias en cuanto a autorización**: el alta de platos es
pública hasta que T-043 conecte `requireAdmin`. Es lo que pedía la tarea, y así queda
anotado.

**Qué se hizo:**
- `POST /api/dishes` con validación Zod del body, devuelve 201 con el plato creado ya
  localizado según `Accept-Language`, reutilizando `toResponse` de T-020.
- `createDishBodySchema` en `dishes.schema.ts`: `categoryId`, `imageUrl` (URL), `price`
  (> 0) y los 9 campos de texto con `trim().min(1)`.
- `app.ts` registra `express.json({ limit: '100kb' })` antes de los routers.
- `error.middleware.ts` reconoce el error de JSON malformado y responde 400.

**Por qué se hizo así:**
- **`categoryId` es obligatorio en el body.** El cuerpo que definía la tarea no lo
  incluía, pero `dishes.category_id` es `NOT NULL` con FK, y ya se había documentado que
  T-026 debía ir antes que T-022. El dueño decidió exigirlo, con lo que **T-026 deja de
  bloquear a T-022**. El servicio además comprueba que la categoría exista y devuelve
  `400 CATEGORY_NOT_FOUND`, para no dejar que la FK reviente como error de SQLite.
- **`isAvailable` lo fija el repositorio en 1, no el body.** Probado mandando
  `isAvailable: 0`: se guardó 1. El cliente no decide si un plato nace disponible; eso
  es de T-024.
- **Los campos extra se descartan, no se rechazan** (Zod sin `.strict()`): no lo pedía el
  criterio y es más tolerante con clientes.

**Comprobado:**
- 201 con el plato creado (en `es` y en `ru`), y el plato aparece ya en el listado y en su
  detalle, con `category_id`, `is_available = 1` y `created_at` correctos.
- 10 casos de body inválido, todos 400 con detalle de Zod: falta `categoryId`, categoría
  inexistente, `price` 0 / negativo / no numérico, `imageUrl` no URL, `nameEs` vacío,
  `nameRu` solo espacios, campo faltante.
- Los GET de T-020/T-021 no se rompieron y `/api/health` sigue en 200.
- Verificado en los dos modos (`tsx` y `node dist/app.js`).

**Impacto en otras tareas:**
- **T-043 debe añadir `requireAdmin` a este POST.** Mientras tanto cualquiera que alcance
  la API puede crear platos: **no desplegar antes de T-043**. El criterio de 401 y 403
  sigue pendiente.
- T-023 (`PUT`) reutilizará `createDishBodySchema` más el `id` de los params.
- T-093: los 400 de Zod llegan con los issues en `details`; ese es el formato que espera
  el frontend para mostrar errores de validación.

**Pendientes / deuda técnica:**
- Falta la autorización (T-043).
- Falta `GET /api/categories` (T-025) para que el admin pueda elegir categoría en un
  formulario; hasta entonces el id se escribe a mano.
- Los mensajes de error (`Invalid request`, `Dish not found`, ...) siguen sin i18n, igual
  que se dejó constancia en T-021.

### 2026-10-01 — T-021 `GET /api/dishes/:id` e infraestructura de errores
**Estado:** completada

**Qué se hizo:**
- `GET /api/dishes/:id` con la misma localización que T-020 y 404
  `{ error: 'Dish not found', code: 'DISH_NOT_FOUND' }`.
- **Capa de errores compartida** en `server/src/shared/`:
  - `errors.ts`: `AppError` base con `statusCode` y `code`, más `NotFoundError` (404),
    `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403) y
    `ConflictError` (409).
  - `error.middleware.ts`: traduce `AppError` a `{ error, code }` (SPEC §8), `ZodError`
    a `400 VALIDATION_ERROR` con los issues, y lo desconocido a `500 INTERNAL_ERROR`
    sin filtrar detalles internos. Incluye `notFoundHandler` para rutas inexistentes.
- `app.ts` monta `notFoundHandler` y luego `errorHandler`, después de los routers.
- `:id` validado con Zod (`z.coerce.number().int().positive()`).

**Por qué se hizo así:**
- El dueño decidió crear la capa de errores en esta tarea en vez de responder el 404
  desde el router. T-021 era el primer endpoint que devuelve un error y AGENTE.md §2.2
  pide lanzar errores como clases propias: hacerlo a mano en la ruta habría dejado esa
  convención incumplida justo la primera vez que aplicaba.
- **El servicio lanza `NotFoundError` y el router no sabe nada de errores**, que es la
  separación que pide AGENTE.md §2.2 y hace el servicio testeable sin Express.
- **`is_available = 0` devuelve el mismo 404 que "no existe", no un 403.** Para un
  cliente público un plato retirado no se distingue de uno que nunca existió, y además
  evita filtrar qué platos hubo.
- Se respetó la indicación de T-020 de **no duplicar la lógica de idioma**: se extrajo
  `toResponse(row, language)`, y lista y detalle comparten `localize` sin tocarlo.

**Comprobado:**
- `200` con el plato correcto en `ru` y en `es`; `404` con el cuerpo exacto del criterio.
- `abc`, `0`, `-3` y `1.5` devuelven `400 VALIDATION_ERROR`; `999999999` devuelve 404.
- Con un plato puesto en `is_available = 0`, el detalle da 404 y la lista lo omite;
  restaurado, vuelve a 200. Base sin dejar cambios.
- Con una fila corrupta (`category_id` inexistente) el `innerJoin` la descarta y se
  devuelve un 404 limpio: el cuerpo no contiene ruta de BD, SQL ni nombres de tabla.
- Verificado en los dos modos (`tsx` y `node dist/app.js`), con resultados idénticos.

**Impacto en otras tareas:**
- T-022/T-023 y T-026/T-027/T-028 ya pueden lanzar `NotFoundError` y `ConflictError`:
  solo deben elegir el código. Los 409 de slug duplicado y de borrado con platos ya
  estaban decididos y la clase existe.
- T-040/T-043 tienen `UnauthorizedError` y `ForbiddenError` para sus 401 y 403.
- T-093 necesita montar `errorHandler` para probar errores, igual que en producción.

**Pendientes / deuda técnica:**
- No hay `VALIDATION_ERROR` en i18n: el mensaje es fijo en inglés (`Invalid request`,
  `Dish not found`). Si el frontend muestra el `error` crudo habrá que localizarlo o
  mapear el `code` a los tres idiomas. Es una decisión pendiente, no un descuido.
- No hay tests automatizados todavía; la verificación de esta tarea fue con peticiones
  reales. Corresponde a T-093.

### 2026-10-01 — T-020 `GET /api/dishes` con localización por `Accept-Language`
**Estado:** completada

**Qué se hizo:**
- Módulo `server/src/modules/dishes/` con los cuatro archivos que marca AGENTE.md §2.2:
  `dishes.routes.ts`, `dishes.service.ts`, `dishes.repository.ts` y
  `dishes.schema.ts` (Zod para la respuesta).
- `app.ts` monta `app.use('/api', dishesRouter)`, siguiendo el patrón de `healthRouter`.
- Filtra `is_available = 1`, hace JOIN a `categories` y devuelve el contenido en es/ru/en
  con default `es`.

**Por qué se hizo así:**
- **Respuesta `{ language, dishes }` en vez de un array pelado.** El frontend necesita
  saber con qué idioma se resolvió la petición sin volver a parsear el header, y sirve de
  diagnóstico. Si el cliente espera un array, se quita el envoltorio.
- **Se incluye `category: { id, slug, name }` ya localizada**, aunque no estaba en el
  criterio. MEMORY ya exigía el JOIN para este endpoint y T-031/T-032 necesitan la
  categoría para el menú agrupado. Todos los campos pedidos están presentes; la categoría
  es un añadido.
- **JOIN `inner`, no `left`**: como `category_id` es `NOT NULL` el resultado es idéntico y
  el `leftJoin` solo ocultaría datos corruptos.
- **Orden por `categories.sortOrder` y luego `dishes.id`**, para que el menú salga en el
  orden que defina el admin, que es el motivo de existir `sortOrder`.
- **Resolución completa del header `Accept-Language`**: lista ponderada, se descarta
  `q=0`, se ordena por peso y se elige el primer idioma soportado por su subtag antes del
  guion. Un `=== 'ru'` habría fallado con casi cualquier cliente real.
- El schema Zod **valida en runtime** (`dishesResponseSchema.parse`), no solo en
  compilación: una fila mal formada revienta en la capa correcta en vez de colarse al
  cliente.

**Comprobado:**
- `curl` real: `ru` devuelve los 5 en ruso, sin header en español, `en` en inglés.
- 12 casos límite del header, incluidos `ru-RU`, `en;q=0.8,ru;q=0.9` (gana el de mayor
  peso), `de;q=0.9,en-US;q=0.7` (salta el no soportado), `ru;q=0`, `*`, mayúsculas,
  header vacío y `q` no numérico.
- Filtro de disponibilidad probado ocultando un plato real: 4 resultados y el nombre
  desaparece; restaurado, 5. Base sin dejar cambios.
- `GET /api/health` sigue en 200 y las rutas inexistentes en 404.
- Verificado en los **dos modos**: `tsx src/app.ts` y `node dist/app.js` tras
  `npm run build`, con resultados idénticos.

**Impacto en otras tareas:**
- T-031 puede consumir el endpoint tal cual y agrupar por `category`.
- **T-025 debe reutilizar la resolución de idioma.** `resolveLanguage` está exportado
  desde `dishes.service.ts`; cuando exista la segunda implementación conviene moverlo a
  un módulo compartido en vez de duplicarlo.
- T-021 (`GET /api/dishes/:id`) reutilizará el `localize` y el mismo JOIN: no duplicar
  el `switch` de idioma.
- T-024 (borrado lógico) tiene su caso de prueba con `is_available = 0`.
- T-093 puede montar `dishesRouter` en un `express()` de prueba sin abrir puerto.

**Pendientes / deuda técnica:**
- `resolveLanguage` vive en el servicio de dishes aunque es lógica genérica. Se moverá
  cuando T-025 lo necesite; hasta entonces está exportado para evitar la copia.
- La respuesta **no** incluye `createdAt` ni el slug del plato (no existe). Si el
  frontend acaba ordenando por fecha, habrá que añadir `createdAt` a la selección.
- Las columnas de `dishes` y `categories` siguen sin índice más allá de los
  `UNIQUE`. Con 5 filas da igual; `T-029` ya cubre `category_id`.

### 2026-10-01 — T-013 Seed del usuario admin
**Estado:** completada

**Qué se hizo:**
- `server/src/db/seed/admin.ts`: inserta `admin@osito.local` con la contraseña hasheada
  con **bcryptjs, 10 rounds**, `role = 'admin'` y `preferredLang = 'es'`.
- Script `db:seed:admin` en `server/package.json`, **separado** de `db:seed` (que sigue
  siendo solo el de platos).
- Dependencias `bcryptjs@^3.0.3` (runtime) y `@types/bcryptjs@^2.4.6` (dev),
  instaladas con autorización explícita del dueño.

**Por qué se hizo así:**
- **`bcryptjs` en lugar de `bcrypt`**: es JavaScript puro, sin compilación nativa ni
  herramientas de build, lo que importa en el despliegue con PM2 y Systemd (SPEC §4).
  Además es la librería que pedía la tarea.
- **Upsert en vez de `insert` a secas**: si el admin ya existe actualiza
  `passwordHash`, `role` y `preferredLang`. Verificado ejecutando el script tres veces:
  `users` sigue con 1 fila. Con un `insert` simple, la segunda ejecución fallaría con
  `UNIQUE constraint failed: users.email`.
- El hash se genera dentro de la transacción y el log publica `passwordMatches` y el
  prefijo del hash, nunca el hash ni la contraseña.
- `throw` si el usuario no aparece tras escribir, para que el seed no termine "en
  verde" sin haber insertado nada.

**Patrón de seeds (actualizado con T-013):**
- Cada seed es un módulo que trabaja al importarse y **termina cerrando `sqlite.close()`**.
- Sentencias terminadas en `.run()`; varias agrupadas con `db.transaction()`, que sí
  funciona en este driver síncrono.
- Deben ser **idempotentes**: `dishes` se borra y se reinserta; el admin hace upsert.
- Funcionan tanto con `tsx src/db/seed/<x>.ts` como compilados en `dist/db/seed/`.
- Cada seed tiene su propio script npm, no hay seed único que los encadene.

**Comprobado:**
- `SELECT` directo: 1 fila, `role='admin'`, `preferred_lang='es'`.
- Hash de 60 caracteres con prefijo `$2b$` y 10 rounds (`bcrypt.getRounds`),
  `compareSync` con la contraseña correcta `true` y con una incorrecta `false`, y el
  hash no contiene la contraseña en claro.
- Idempotencia (3 ejecuciones → 1 fila) y convivencia con `db:seed`: tras
  `db:migrate` + `db:seed` + `db:seed:admin` sobre base vacía quedan 1 usuario,
  5 platos y 5 categorías.
- Ejecución desde `dist/` tras `npm run build`. `typecheck`, `lint` y formato en verde.

**Impacto en otras tareas:**
- T-040–T-043 (auth) ya tienen un admin real para probar `requireAdmin` y los 403.
- T-022/T-023 y T-026–T-028 dependen de ese 403 para sus criterios.
- **T-041/T-042 (JWT) usarán `bcrypt.compare` al validar el login**, con `bcryptjs` y
  no `bcrypt`, para no acabar con dos librerías de hashing en el bundle. La dependencia
  ya está instalada.
- T-094 (PM2) tendrá que ejecutar `db:seed` y `db:seed:admin` por separado durante el
  despliegue, al ser scripts distintos.

**Pendientes / deuda técnica:**
- **La contraseña `OsitoAdmin123!` está en claro en `server/src/db/seed/admin.ts`**, que
  se versiona, por decisión explícita del dueño al definir la tarea. Quien clone el repo
  conoce la credencial del admin. Para producción lo correcto es leerla de una variable
  de entorno y generar el hash en el primer arranque. No se cambió porque la tarea pedía
  exactamente esa contraseña; queda registrado como decisión consciente.
- Cada seed necesita su propio comando npm: preparar un entorno nuevo implica correr
  `db:migrate`, `db:seed` y `db:seed:admin`. Un seed único sería cómodo, pero no se
  construyó porque ninguna tarea lo pedía y habría que decidir el orden.

### 2026-10-01 — Decisión: las categorías tendrán CRUD propio
**Estado:** decisión tomada, pendiente de implementar (T-025–T-028)

**Qué se decidió:**
- El dueño eligió un **CRUD completo de categorías** en vez de que `POST /api/dishes`
  escribiera directamente en la tabla `categories` con un id fijo.
- Quedó repartido en cinco tareas: `T-025` (GET público y localizado), `T-026` (POST),
  `T-027` (PUT), `T-028` (DELETE) y `T-029` (índice en `dishes.category_id`).

**Por qué:**
- Con la tabla `categories` ya creada, la alternativa habría sido hacer que el alta de
  platos creara categorías. Se descartó porque mezcla dos responsabilidades en un
  endpoint y porque no deja forma de renombrar una categoría ni reordenar el menú una
  vez el producto esté en marcha, que era justamente el objetivo de A-001.

**Restricciones para quien lo implemente:**
- **Orden: `T-026` antes que `T-022`.** `POST /api/dishes` validará `categoryId`, así
  que el alta de platos queda bloqueada hasta que exista forma de crear categorías.
  Es la única dependencia dura entre esas tareas.
- `GET /api/categories` es público y se localiza por `Accept-Language` como
  `GET /api/dishes`: los nombres de categoría son texto visible y AGENTE.md §2.5 exige
  los tres idiomas. La UI los necesita para el menú agrupado.
- `slug` se valida con Zod y devuelve **409** si ya existe, para que un duplicado no
  llegue como error de FK opaco.
- `DELETE /api/categories/:id` **no** hace cascada: devuelve **409** si hay platos
  asociados. Perder dishes por una confirmación mal leída es peor que obligar a
  reasignarlos primero.

### 2026-10-01 — T-012 Seed de 5 platos en 3 idiomas
**Estado:** completada

**Qué se hizo:**
- `server/src/db/seed/dishes.ts`: inserta 5 platos de comida casera (sopa, pasta,
  ensalada rusa/olivier, tarta de manzana y compota) con nombre, descripción e
  ingredientes traducidos de verdad a es/ru/en, precio entre 5 y 25, `isAvailable = 1`
  e `imageUrl` de placeholder.
- Script `db:seed` en `server/package.json`.

**Por qué se hizo así:**
- El seed **borra `dishes` y reinserta dentro de una transacción**, en vez de solo
  insertar. Así `npm run db:seed` es idempotente y se puede reejecutar sin duplicar
  filas; verificado ejecutándolo dos veces, el conteo sigue en 5. Con un `insert`
  simple, el criterio "5 filas" solo se cumpliría en la primera ejecución.
- `imageUrl` incluye color por plato (`/600x400/<bg>/<fg>?text=<Label>`) para que los
  cinco se distingan en `/menu` sin salir del placeholder. La etiqueta va en inglés y
  corta porque placehold.co no renderiza bien caracteres no ASCII en `text=`.
- El script cierra `sqlite.close()` al final. Sin eso, WAL mantiene vivo el proceso.
- Log con `logger.info` de pino, nunca `console.log`.

**Patrón de seeds (sirve para T-013):**
- Cada seed es un módulo que hace su trabajo al importarse y **termina cerrando la
  conexión**, no solo exportando funciones.
- En este driver hay que terminar cada sentencia con `.run()`; para agrupar varias
  en una unidad atómica, `db.transaction((tx) => { ... })`, que sí funciona.
- Cada seed se ejecuta tanto con `tsx src/db/seed/<x>.ts` como compilado en
  `dist/db/seed/<x>.js`, porque `tsc` compila todo `src/`. Verificado en ambos modos.

**Comprobado:**
- 5 filas con los 9 campos de texto por idioma poblados, leídos directamente de la
  base y no del log del script. Un validador recorre las filas y falla ante campo
  vacío, `TODO`/`placeholder`, precio fuera de rango o `isAvailable != 1`.
- Las URLs de placeholder responden HTTP 200.
- Idempotencia, ejecución desde `src/` y desde `dist/`, `typecheck` y `lint` en verde.

**Impacto en otras tareas:**
- T-020 (`GET /api/dishes`) ya tiene datos contra los que probar la localización por
  `Accept-Language`: los 5 platos tienen los tres idiomas poblados.
- T-024 (borrado lógico, `isAvailable = 0`) tiene un caso claro: poner uno de los 5 a 0
  y comprobar que `/menu` lo oculta.
- T-031 y T-032 (frontend) podrán usar estas imágenes de placeholder sin esperar a
  fotografía real.
- **T-013 (seed de admin) necesita `bcrypt`, que no está instalado.** Queda pendiente de
  autorización explícita. Además, cuando exista, habrá que decidir si `db:seed` pasa a
  ser un runner que invoque los dos seeds o si se registra un script aparte: ahora
  `db:seed` apunta solo a `seed/dishes.ts`.

**Pendientes / deuda técnica:**
- Los datos del seed están en la base de desarrollo y son de ejemplo; `osito.db` está
  en `.gitignore`, así que cada entorno debe correr `db:migrate` + `db:seed` para
  reproducirlo.
- `npm run format:check` de la raíz sigue en rojo por `.kilo/worktrees/`, que es ajeno
  a esta tarea. Conviene ignorar ese directorio en `.prettierignore` cuando se decida,
  pero no se tocó aquí por no ser parte del alcance.

### 2026-10-01 — T-011 Migración inicial aplicada + scripts de base de datos
**Estado:** completada

**Qué se hizo:**
- Añadidos `db:generate`, `db:migrate` y `db:studio` a `server/package.json`, que
  delegan en `drizzle-kit`.
- `npm run db:migrate` crea `server/osito.db` con las 6 tablas y
  `__drizzle_migrations` con 1 entrada. No hizo falta ningún archivo nuevo: el
  esquema y la migración ya venían de T-010.
- Añadido `server/src/db/migrations/meta` a `.prettierignore` y reformateados
  `schema.ts`, `client.ts` y `drizzle.config.ts`, para cerrar una regresión de
  `format:check` que venía de T-010.

**Por qué se hizo así:**
- Los scripts van en `server/package.json` y no en la raíz del monorepo. Motivo doble:
  la tarea los pedía en el server, y `drizzle.config.ts` usa rutas relativas
  (`./src/db/schema.ts`, `./src/db/migrations`, `./osito.db`) que solo resuelven bien
  con `server/` como directorio de trabajo. Delegarlos desde la raíz exigiría además
  fijar el cwd, que es justo lo que los scripts del workspace evitan.
- No se creó `db:seed`: pertenece a T-012 y T-013, y `docs/AGENTE.md` §4 prohíbe
  dejar archivos que pertenecen a otra tarea.

**Comprobado:**
- `db:migrate` es idempotente (reejecutarlo no falla ni duplica).
- `db:generate` responde `No schema changes, nothing to migrate`: esquema y
  migraciones están en sincronía y no se genera una segunda migración.
- El server arranca contra la base creada, confirmando que `client.ts` y
  `db:migrate` apuntan al mismo archivo.
- `npm run typecheck` y `npm run lint` pasan en `server/`.

**Impacto en otras tareas:**
- T-012 y T-013 pueden correr los seeds sobre esta base. Recordar el detalle del
  driver síncrono registrado en T-010: cada `insert` necesita `.run()`.
- Los delegadores `db:*` desde la raíz del monorepo que menciona `docs/AGENTE.md` §7
  **siguen sin crearse**; quedan para la tarea que cierre los scripts del monorepo.

**Pendientes / deuda técnica:**
- `drizzle.config.ts` y `client.ts` resuelven la ruta de la base por fuentes
  distintas (`dbCredentials.url` vs `env.DATABASE_URL`). Hoy coinciden, pero es una
  divergencia silenciosa pendiente de unificar. Ver gotcha en la sección superior.
- `server/osito.db` está en `.gitignore` (`*.db`, `*.db-wal`, `*.db-shm`), así que
  cada entorno debe ejecutar `npm run db:migrate` antes de arrancar. Conviene
  dejarlo explícito en el README de despliegue cuando exista.

### 2026-10-01 — T-010 Schema Drizzle (SQLite)
**Estado:** completada

**Qué se hizo:**
- `server/src/db/schema.ts` con las 6 entidades de SPEC: `users`, `dishes`, `orders`,
  `order_items`, `page_views`, `notification_logs`, más los tipos `*` y `New*`
  derivados con `$inferSelect`/`$inferInsert`.
- `server/src/db/client.ts`: instancia Drizzle sobre `better-sqlite3`, leyendo
  `env.DATABASE_URL`, con los pragmas `journal_mode=WAL` y `foreign_keys=ON`.
  Exporta `db` y `sqlite`.
- `server/drizzle.config.ts` (dialecto SQLite, schema `./src/db/schema.ts`,
  salida `./src/db/migrations`) y la migración
  `0000_worthless_scarlet_spider.sql`, generada y aplicada.
- Dependencias en `server/`: `drizzle-orm@^0.45.3`, `better-sqlite3@^13.0.3`,
  `drizzle-kit@^0.31.11`, `@types/better-sqlite3@^9.6.0`.
- `engines.node` de la raíz subida a `^22.13.0 || >=24` porque
  `better-sqlite3@13` requiere Node 22.

**Convenciones de schema (SPEC §4):**
- Tablas en plural y `snake_case`; propiedades TS en `camelCase`.
- Timestamps: `integer` con `default(sql\`(unixepoch())\`)`.
- Precios y totales: `real`.
- Enums: `text({ enum: [...] })` — `role`, `preferred_lang`, `status`, `channel`.
- `dishes` guarda los tres idiomas en columnas separadas (`name_es/ru/en`,
  `desc_es/ru/en`, `ingredients_es/ru/en`), no en JSON.

**Por qué se hizo así:**
- El schema **no exporta `relations()`**, a propósito. La API relacional
  `db.query.*` no hidrata filas en `0.45.3`: se probaron tres formas de declarar las
  relaciones (`relations()` por callback, objeto plano con claves `xRelations`, objeto
  plano anidado bajo `relations`) y las tres devuelven `undefined` o el propio builder.
  El diagnóstico aísla el fallo: `extractTablesRelationalConfig` **sí** extrae las
  relaciones (`a→[bs]`, `b→[a]`), luego el problema está en el consumo de `with`.
  Se prefirió joins explícitos en `db.select()`, que funcionan, antes que dejar código
  que compila y devuelve datos incorrectos.
- Se exportan `sqlite` y `db` desde `client.ts` porque los tests necesitarán cerrar la
  conexión (`sqlite.close()`) y porque los pragmas son parte del contrato de la app.

**Impacto en otras tareas:**
- T-011 puede cerrarse sin trabajo adicional: la migración inicial ya está generada y
  aplicada. Basta con `npx drizzle-kit migrate` sobre una base nueva.
- T-012 (seed) debe popular los 9 campos de texto por idioma de `dishes` y terminar
  cada `insert` con `.run()`, porque el driver no encadena.
- T-020 y T-051 usarán `db.select()` con joins, no `db.query`.

**Pendientes / deuda técnica:**
- Las columnas de clave ajena no tienen índice; SQLite no los crea solo. Aceptable
  para el volumen del MVP, pero conviene indexar `orders.user_id`,
  `order_items.order_id`, `order_items.dish_id`, `page_views.user_id/dish_id` y
  `notification_logs.order_id` si las consultas de pedidos crecen.
- 4 vulnerabilidades moderadas de `esbuild` vía `drizzle-kit` (solo dev). No hay
  actualización compatible propuesta por `npm audit` sin forzar un downgrade.

### 2026-09-30 — T-009 Módulo de health
**Estado:** completada

**Qué se hizo:**
- `server/src/modules/health/health.routes.ts` con `GET /health`.
- `app.ts` monta el router con `app.use('/api', healthRouter)` y deja de definir rutas.
- Respuesta: `{ status, timestamp, uptime, version }`.

**Cómo se hizo:**
- Creado: `server/src/modules/health/health.routes.ts`.
- Modificado: `server/src/app.ts`.
- Sin dependencias nuevas.
- Decisiones: "createRequire para leer package.json" y "Patrón de routers: prefijo en
  app.ts, ruta sin prefijo en el router".

**Por qué se hizo así:**
- El enunciado pedía explícitamente la estructura `modules/health/health.routes.ts` y
  registrar el router en `app.ts`. La ruta inline que dejó T-004 se movió al router;
  la tarea anterior ya lo había anotado como deuda temporal.
- El router define `/health` y el prefijo `/api` vive en el `app.use`. Así `/api` está
  en un solo sitio y los routers futuros no lo repiten.
- `version` se lee con `createRequire` en vez de importar el JSON: ver más abajo, la
  alternativa fallaba en runtime.

**Impacto en otras tareas:**
- T-020, T-051, T-080, T-070 y demás siguen el patrón `app.use('/api', xRouter)`.
- T-093 puede montar `healthRouter` en una instancia de Express de prueba sin abrir
  un puerto, y afirmar sobre `version` comparando con el `package.json` real.
- T-094 (PM2) no necesita cambios: sigue usando el script `start` existente.

**Pendientes / deuda técnica:**
- `health.routes.ts` no tiene `health.service.ts` ni `health.schema.ts`. AGENT.md §2.2
  describe esa estructura para módulos con lógica; health es un caso trivial de
  lectura sin acceso a datos, así que un solo archivo es proporcional a la tarea.
  Si se le añade comprobación de BD (health profundo), ahí sí tendría sentido el service.
- `uptime` se reinicia en cada reinicio del proceso, como es lógico. Si Nginx o un
  balanceador necesita una sonda que sobreviva reinicios, habría que persistir el
  arranque.

---

### 2026-09-30 — Guard de placeholders en `.env` (endurecimiento de T-008)
**Estado:** completada

**Qué se hizo:**
- Rechazo de los valores de ejemplo de `.env.example` al arrancar en producción.
- Sin dependencias nuevas, sin archivos nuevos: todo dentro de `config/env.ts`.

**Cómo se hizo:**
- Modificado: `server/src/config/env.ts` (constantes `PLACEHOLDER_MARKERS`,
  `isProductionEnv`, `hasPlaceholder`, `rejectPlaceholder` y un `.refine()` por
  variable sensible).
- Decisión: "Rechazo de placeholders de `.env.example` solo en producción".

**Por qué se hizo así:**
- Los placeholders de `.env.example` tienen >32 caracteres, así que pasaban la
  validación de longitud de `JWT_SECRET`. El servidor arrancaba en producción con
  secretos públicos.
- **La primera implementación estaba invertida y no hacía nada.** Escribí
  `rejectPlaceholder` devolviendo `true` cuando detectaba el placeholder, y lo usé
  como predicado de `.refine()`. En Zod, `.refine(p)` acepta cuando `p` es `true`,
  así que el guard **aceptaba exactamente lo que debía rechazar**. Pasaba el typecheck
  y no daba error de sintaxis: solo se detectaba probando el caso negativo.
  Se corrigió separando `hasPlaceholder()` (detecta) de `rejectPlaceholder()`
  (invierte para el predicado).
- El guard se limita a producción a propósito: en desarrollo los valores de ejemplo
  son necesarios para arrancar recién clonado el repo, y no son un riesgo real.

**Impacto en otras tareas:**
- T-093 (tests) hereda el `process.exit(1)`: si los tests corren con `NODE_ENV=production`
  y hay placeholders, el proceso muere. Usar `NODE_ENV=test` en el entorno de test.
- T-094 (PM2) arranca con `NODE_ENV=production`, así que el guard estará activo en el
  VPS: es exactamente la protección buscada.
- T-093/T-094: al añadir variables sensibles nuevas, acordarse del `.refine()`.

**Pendientes / deuda técnica:**
- `DATABASE_URL` no tiene guard de placeholder (no es secreto, y su valor de ejemplo
  es inofensivo). Si algún día la ruta apunta a algo sensible, revisarlo.
- La lista `PLACEHOLDER_MARKERS` es una lista negra. Un placeholder con otra
  redacción pasaría el filtro. Es aceptable para este alcance; una lista blanca
  (rechazar cualquier valor que no tenga forma de secreto) sería más robusta.

---

### 2026-09-30 — T-008 Validación de variables de entorno con Zod
**Estado:** completada

**Qué se hizo:**
- `server/src/config/env.ts` con schema Zod de 12 variables, carga del `.env` y
  salida con mensaje claro si falta algo.
- `app.ts` y `logger.ts` dejan de leer `process.env` y consumen `env`.
- `config/index.ts` deja de ser un placeholder y pasa a ser un barrel.

**Cómo se hizo:**
- Creado: `server/src/config/env.ts`.
- Modificados: `server/src/config/index.ts`, `server/src/app.ts`, `server/src/logger.ts`.
- **Sin dependencias nuevas**: `process.loadEnvFile()` de Node 22 en lugar de `dotenv`.
- Decisiones: "process.loadEnvFile() en vez de dotenv" y "MAILGUN_FROM acepta email
  simple y `Nombre <email>`".

**Por qué se hizo así:**
- `dotenv` habría sido la dependencia obvia, pero el proyecto prioriza no agregar
  dependencias sin necesidad y Node ya resuelve esto.
- La ruta del `.env` se resuelve con `import.meta.url` subiendo tres niveles, para que
  funcione igual en `src/` (tsx) y en `dist/` (node compilado), sin depender del cwd.
- Los mensajes de Zod se personalizan al español porque la salida de arranque es lo
  primero que ve quien despliega, y "Required" en inglés encajaba mal.
- `PORT` usa `z.coerce.number()`, así que llega como `number` y no como string. Todos
  los consumidores lo tratan como número.

**Impacto en otras tareas:**
- T-041/T-042 (JWT) usarán `env.JWT_SECRET` y `env.JWT_REFRESH_SECRET` (min 32 chars
  ya garantizado por el schema).
- T-060 (Mailgun) debe enviar **`env.MAILGUN_FROM.raw`**, no `.email`.
- T-061 (Telegram) usará `env.TELEGRAM_BOT_TOKEN` y `env.TELEGRAM_CHAT_ID`.
- T-010 (Drizzle) usará `env.DATABASE_URL` como ruta del archivo SQLite.
- T-093 (tests) **debe preparar el entorno antes de importar nada** que dependa de
  `env`, o el `process.exit(1)` matará vitest.
- T-094 (PM2) deberá pasar las variables por el `env` de PM2 o por un `.env` real en
  la raíz; como `loadEnvFile` no sobreescribe `process.env`, las variables de PM2 ganan.

**Pendientes / deuda técnica:**
- No hay `.env` en el repositorio (correcto: está en `.gitignore`). Hay que crearlo
  con `cp .env.example .env` antes de arrancar, y con secretos reales.
- Los secretos del `.env.example` son marcadores de posición: el backend no valida que
  no sean los de ejemplo, solo que tengan 32 caracteres. Podría añadirse un `.refine`
  que rechace valores conocidos de ejemplo; no se hizo por no inventar alcance.
- No hay validación cruzada (p. ej. que `MAILGUN_FROM` y `CHEF_EMAIL` no sean el mismo
  dominio en producción). Se considera sobreusado para esta fase.

---

### 2026-09-30 — T-007 Logger con pino
**Estado:** completada

**Qué se hizo:**
- `server/src/logger.ts` configurado: pino-pretty con colores en desarrollo,
  JSON puro en producción, nivel leído de `LOG_LEVEL` con default `info`.
- Validación de `LOG_LEVEL` contra la lista de niveles reales de pino.

**Cómo se hizo:**
- Modificado: `server/src/logger.ts`. **`server/src/app.ts` no se tocó**: ya llamaba
  a `logger.info('Server starting on port <PORT>')` desde T-004.
- Sin archivos nuevos y sin dependencias nuevas: `pino` y `pino-pretty` ya estaban
  instaladas en T-002 (esta tarea termina de pagar esa decisión).
- Decisiones:
  - Transporte `pino-pretty` solo si `NODE_ENV !== 'production'`, con spread
    condicional del objeto de opciones. En producción no se carga.
  - `pino-pretty` se referencia **por string** en `transport.target`, no se importa.
    Es lo que exige el API de pino: el worker lo resuelve en runtime.
  - `LOG_LEVEL` se valida con un type guard contra
    `trace|debug|info|warn|error|fatal|silent`; si no coincide, se usa `info`.

**Por qué se hizo así:**
- `app.ts` ya tenía la llamada al logger desde T-004 porque ese criterio exigía
  "loggear al arrancar". Configurar `logger.ts` fue suficiente; no hizo falta tocar
  el servidor.
- El fallback a `info` evita que un typo en `LOG_LEVEL` (p. ej. `LOG_LEVEL=debugg`)
  tumbe el proceso al arrancar con un error de pino poco descriptivo. Un log con
  nivel equivocado es molesto; un server que no arranca, no.
- Se usa el nivel por defecto `info` en vez de `debug` porque `debug` en producción
  puede filtrar datos de pedidos.

**Impacto en otras tareas:**
- T-008 debe leer `env.LOG_LEVEL` de Zod en lugar de `process.env.LOG_LEVEL`, pero
  **conservar la validación contra la lista de niveles**. `config/env.ts` puede
  reutilizar el type guard o declarar su propio enum de Zod; lo que no debe hacer
  es aceptar cualquier string.
- T-093 (tests) debe tener en cuenta que `transport` de pino usa un worker thread:
  el output puede llegar fuera de orden y contaminar la salida de vitest.
- T-094 (PM2) **debe** fijar `NODE_ENV=production` en el ecosystem, porque
  `pino-pretty` es devDependency y fallaría al cargarse en un despliegue real.
- T-092 (manejo de errores) usará este logger para el middleware de errores.

**Pendientes / deuda técnica:**
- No hay request id ni correlación entre logs. En Fase 8 (panel del chef) podría
  ser útil para rastrear un pedido concreto en los logs.
- `logger.ts` lee `process.env` directamente en lugar de pasar por `config/env.ts`,
  que es deuda temporal hasta T-008.
- Sigue sin existir un middleware que loggee cada request (AGENT.md no lo pide, así
  que no se añadió por no inventar alcance).

---

### 2026-09-30 — Ajuste de `engines.node` en el package.json raíz
**Estado:** completada

**Qué se hizo:**
- `engines.node` pasó de `">=20"` a `"^20.19.0 || ^22.13.0 || >=24"`.

**Cómo se hizo:**
- Modificado: `package.json` (raíz), un solo campo.
- Sin archivos nuevos, sin dependencias nuevas, sin cambios de código.

**Por qué se hizo así:**
- T-006 dejó anotada la discrepancia: el proyecto declaraba `>=20`, pero ESLint 10
  exige `^20.19.0 || ^22.13.0 || >=24`. Con Node 20.0-20.18 el linting no funcionaría.
- Se adoptó **la restricción de ESLint**, la más estricta del toolchain, en vez de la
  de Vite 8 (`^20.19.0 || >=22.12.0`). Declarar el mínimo real del toolchain completo
  es más útil que declarar el de una sola herramienta: si Vite se actualiza subiendo
  su mínimo, el `engines` Warn pero no rompe.
- Alternativa descartada: mantener `>=20` y confiar en que nadie use una versión
  antigua. Se eligió declarar el requisito real para que `npm install` avise.

**Impacto en otras tareas:**
- Ninguna tarea del TASKLIST cambia. T-094 (despliegue PM2 en VPS) sí se ve afectada:
  el VPS debe correr Node 20.19+, 22.13+ o 24+. Si el VPS está en Node 20.11, habrá
  que actualizar Node **antes** de desplegar, no durante.

**Pendientes / deuda técnica:**
- Ninguna.

---

### 2026-09-30 — T-006 ESLint + Prettier en server y client
**Estado:** completada

**Qué se hizo:**
- ESLint 10 con flat config en ambos workspaces (Node en server, browser + plugins React en client).
- Prettier 3 con configuración compartida única en la raíz.
- 9 scripts nuevos en el `package.json` raíz, incluidos `lint` y `format`.

**Cómo se hizo:**
- Archivos creados: `.prettierrc.json`, `.prettierignore`, `server/eslint.config.js`,
  `client/eslint.config.js`.
- Modificados: `package.json` (raíz), `server/package.json`, `client/package.json`
  (scripts `lint` y `format` en cada workspace).
- Dependencias (con autorización del dueño), todas en la raíz: `eslint@^10.11.0`,
  `@eslint/js@^10.0.1`, `typescript-eslint@^8.71.0`, `globals@^17.12.0`,
  `eslint-plugin-react-hooks@^7.1.1`, `eslint-plugin-react-refresh@^0.5.7`,
  `prettier@^3.9.9`. Las peer deps se verificaron **antes** de instalar.
- Decisión: ver "ESLint 10 flat config con tools en la raíz y configs por workspace".

**Por qué se hizo así:**
- ESLint 10 solo soporta flat config, así que `.eslintrc.json` no era una opción.
- Las tools van en la raíz porque npm workspaces las hoistea igualmente; declararlas
  en los dos paquetes solo generaría desfase de versiones.
- `eslint.config.js` está duplicado porque server y client lintean entornos distintos
  (`globals.node` vs `globals.browser` + React). El enunciado pedía "el mismo Prettier",
  no "el mismo ESLint": Prettier sí es único y compartido.
- Se eligió `recommended` sobre `recommended-type-checked` para no duplicar el trabajo
  de `tsc` ni pelearse con los flags estrictos ya fijados en T-002 y T-003.

**Impacto en otras tareas:**
- AGENT.md §9 exige `npm run lint` y `npm run typecheck` antes de cerrar cada tarea:
  ambos existen y funcionan desde la raíz a partir de ahora.
- T-035 (shadcn/ui) genera componentes en archivos nuevos; el lint ya los revisará
  cuando se creen, sin configuración adicional.
- T-093 debe añadir el script `test` al `package.json` raíz, siguiendo el patrón
  `--workspaces --if-present` de `lint` y `typecheck`.
- T-090 (PWA) y T-091 (responsive) no requieren cambios de configuración de lint.

**Pendientes / deuda técnica:**
- ~~`engines.node` decía `>=20`~~ → **RESUELTO el 2026-09-30**: ahora es
  `^20.19.0 || ^22.13.0 || >=24`. Ver la entrada de ese ajuste más abajo.
- No hay regla de lint que prohíba `console.log` en el backend, que AGENT.md §4
  prohíbe explícitamente. T-007 podría añadir `no-console` cuando se cierre el logger.
- No hay `eslint-plugin-import` ni reglas de orden de imports, aunque AGENT.md §2.1
  pide "imports ordenados: externos → internos → relativos". Se aplica a mano.

---

### 2026-09-29 — T-005 Tailwind CSS 4 en el cliente
**Estado:** completada (confirmación visual del dueño pendiente)

**Qué se hizo:**
- Tailwind 4.3.3 instalado con el plugin `@tailwindcss/vite`.
- `index.css` reducido a `@import 'tailwindcss'`.
- `App.tsx` con `<h1 class="mt-10 text-center text-3xl font-bold">Osito a la carta</h1>`.

**Cómo se hizo:**
- Modificados: `client/vite.config.ts` (se añadió `tailwindcss()` al array de plugins),
  `client/src/index.css` (sustituido por completo), `client/src/App.tsx`,
  `client/package.json`. Sin archivos nuevos.
- Dependencias agregadas (con autorización del dueño): `tailwindcss@^4.3.3` y
  `@tailwindcss/vite@^4.3.3`, ambas devDependencies. Ambas justificadas por SPEC §4.
- Decisión: ver "Tailwind 4 con plugin de Vite (CSS-first, sin config.js)".

**Por qué se hizo así:**
- El enunciado describía el setup de Tailwind v3, que ya no es el vigente. Se optó por
  la versión 4 con autorización explícita en lugar de fijar una versión en mantenimiento.
- Las clases se ordenaron como `mt-10 text-center text-3xl font-bold` (layout, luego
  tipografía) para que el criterio de aceptación sea legible de un vistazo.

**Impacto en otras tareas:**
- T-035 (shadcn/ui) debe usar el esquema CSS-first: los tokens del tema se redefinen
  con `@theme` en `index.css`, no en un `tailwind.config.js`. Es el punto de mayor
  fricción probable de todo el proyecto.
- T-091 (responsive) tiene todas las utilities disponibles desde ahora.
- T-006 (ESLint/Prettier) no se ve afectado; no hay configuración de PostCSS que mantener.

**Pendientes / deuda técnica:**
- **SPEC.md §5 documenta `client/tailwind.config.js`, que ya no existe con Tailwind 4.**
  Corregir SPEC requiere autorización del dueño.
- `App.tsx` sigue con el texto hardcodeado, sin pasar por i18n. Esto viola AGENT.md §2.3
  pero es lo que pide el criterio de T-005; se corrige en T-030.
- El tema de Tailwind está sin personalizar: sin colores de marca, sin fuentes.
  Se definirá con `@theme` cuando se conozca la identidad visual.

---

### 2026-09-29 — T-004 Proxy de Vite + endpoint de health
**Estado:** completada

**Qué se hizo:**
- Proxy `/api` → `http://localhost:3000` en el server de Vite.
- Ruta `GET /api/health` en `server/src/app.ts` que devuelve
  `{ status: 'ok', timestamp: <ISO> }`.
- `app.listen(PORT)` para que el backend quede accesible.
- Log de arranque con pino: `Server starting on port 3000`.

**Cómo se hizo:**
- Modificados: `client/vite.config.ts`, `server/src/app.ts`. Sin archivos nuevos
  y sin dependencias nuevas.
- Decisiones: ver "listen en app.ts (el módulo arranca al importarse)" en la sección
  de decisiones arquitectónicas.
- `PORT` se lee de `process.env.PORT ?? '3000'` sin Zod; la validación llega en T-008.
- `strictPort: true` para que Vite no caiga a otro puerto si `:5173` está ocupado.

**Por qué se hizo así:**
- El `listen` contradice explícitamente lo que T-002 pedía ("sin arrancar"), pero sin
  él el criterio de T-004 (server en `:3000`) es imposible. T-004 prevalece.
- Se puso la ruta directamente en `app.ts` porque así lo pide el enunciado de T-004.
  T-009 la moverá a `src/modules/health/health.routes.ts` con su propio router, que
  es donde debe vivir según AGENT.md §2.2.
- `changeOrigin: true` incluido desde el inicio: hoy es inocuo, pero hace falta cuando
  se validen orígenes en el backend.

**Impacto en otras tareas:**
- T-007 ajusta el nivel y el formato del log de arranque.
- T-008 sustituye `process.env.PORT` por `env.PORT` validado con Zod.
- T-009 extrae la ruta de `app.ts` al módulo `health` y añade `uptime` y `version`.
- T-005 y T-035 no se ven afectados; el proxy no interfiere con HMR.
- T-093 debe tener en cuenta que importar `app.ts` abre el puerto 3000.

**Pendientes / deuda técnica:**
- `PORT` sin validar: si alguien exporta `PORT=abc`, `app.listen` falla con una
  excepción poco descriptiva. T-008 lo resuelve.
- La ruta vive en `app.ts` y no en un router por módulo. Es deuda temporal
  hasta T-009.
- `app.listen` sin manejar `EADDRINUSE` ni apagado limpio (SIGTERM/SIGINT).
  Relevante para T-094 (PM2), que necesitará un `process.on('SIGTERM')`.

---

### 2026-09-29 — Actualización de SPEC.md §4 (React 19)
**Estado:** completada

**Qué se hizo:**
- SPEC.md §4: la fila Frontend pasó de "React 18 + Vite" a "React 19 + Vite 8".
- SPEC.md encabezado: `Última actualización: [fecha]` → `2026-09-29`.
- SPEC.md §10: se registren como decisiones cerradas React 19 y TypeScript unificado.

**Cómo se hizo:**
- Modificado: `docs/SPEC.md` (3 ediciones puntuales), `docs/MEMORY.md`.
- Editadas también las entradas previas de MEMORY.md y TASKLIST.md que decían que
  SPEC.md estaba desactualizado, para eliminar la contradicción.

**Por qué se hizo así:**
- El dueño autorizó explícitamente la edición de SPEC.md, que por norma requería
  autorización previa. Se hizo el cambio mínimo: solo lo que el código ya refleja.
- No se tocó la sección 5 (estructura de carpetas): la de `client/` sigue describiendo
  `index.html`, `vite.config.ts`, `tailwind.config.js` y `package.json`, pero ahora
  falta `tsconfig*.json` en el árbol documentado. Esa omisión es preexistente y
  corresponde a la tarea que inicialice el cliente con su toolchain completa.

**Impacto en otras tareas:**
- SPEC.md vuelve a ser fuente de verdad coherente con el código. Los agentes ya no
  deberían intentar "corregir" React 19 de vuelta a React 18.

**Pendientes / deuda técnica:**
- SPEC.md §5 no lista `client/tsconfig*.json` en el árbol de carpetas. Cosmético.

---

### 2026-09-29 — T-003 Client con Vite + React + TypeScript
**Estado:** completada

**Qué se hizo:**
- Scaffold de `client/` con Vite 8 + React 19 + TypeScript 5.9.3.
- `tsconfig` con project references y `strict` activado a mano.
- Estructura `src/` con las 7 carpetas vacías que pide SPEC §5.
- `App.tsx` mínimo con `<h1>Osito a la carta</h1>`.

**Cómo se hizo:**
- Archivos creados: `client/index.html`, `client/vite.config.ts`, `client/tsconfig.json`,
  `client/tsconfig.app.json`, `client/tsconfig.node.json`, `client/src/main.tsx`,
  `client/src/App.tsx`, `client/src/index.css`, más las carpetas
  `client/src/{pages,components,api,hooks,store,locales,lib}/`.
  Modificado: `client/package.json`.
- Dependencias agregadas (con autorización): `react`, `react-dom` (runtime);
  `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node` (dev). Todas justificadas por SPEC §4 y por el template oficial.
- Decisiones: ver "React 19 (desvío autorizado de SPEC.md §4)", "TypeScript unificado
  a 5.9.3" y "Project references en el tsconfig del cliente".

**Por qué se hizo así:**
- El scaffold se generó en un directorio temporal con `npx create-vite` y se copiaron
  solo los archivos necesarios, en vez de correr el comando dentro de `client/`.
  Motivo: el directorio ya contenía un `package.json` de T-001 y create-vite habría
  prompted para sobrescribirlo o abortado por directorio no vacío.
- Se descartaron del template `App.css`, `assets/`, `public/vite.svg`, `README.md`,
  `.oxlintrc.json` y el `.gitignore` propio del client: el `.gitignore` raíz ya cubre
  esos patrones, y oxlint entraría en conflicto con el ESLint + Prettier de T-006.
- `main.tsx` valida `document.getElementById('root')` con un guard explícito en vez
  del `!` non-null assertion del template, por coherencia con la regla de "sin `any`"
  y por `strict` real.

**Impacto en otras tareas:**
- T-004 modifica `client/vite.config.ts` para el proxy `/api`.
- T-005 reemplaza `client/src/index.css` por las directivas de Tailwind.
- T-006 añade ESLint + Prettier y los scripts raíz (`dev:client`, `lint`, `typecheck`).
- T-030 sustituye el texto hardcodeado de `App.tsx` por `t('app.title')` con i18n.
- Nota: `App.tsx` tiene hoy un texto visible hardcodeado, technically en contra de
  AGENT.md §2.3, pero es exactamente lo que pide el criterio de T-003. Se corrige en T-030.

**Pendientes / deuda técnica:**
- Las 7 carpetas de `src/` están vacías y **git no trackea directorios vacíos**.
  Si desaparecen al clonar, recrearlas antes de T-030.
- `index.css` tiene estilos base mínimos que T-005 reemplazará por completo.

---

### 2026-09-29 — T-001 Estructura de carpetas
**Estado:** completada

**Qué se hizo:**
- `server/` y `client/` con `package.json` mínimo (sin dependencias).
- `shared/types.ts` y `shared/schemas.ts` vacíos.
- `package.json` raíz con npm workspaces.
- `.env.example` y `.gitignore`.

**Cómo se hizo:**
- Archivos creados: `package.json`, `server/package.json`, `client/package.json`,
  `shared/types.ts`, `shared/schemas.ts`, `.env.example`, `.gitignore`.
- Decisiones: workspaces `["server", "client"]`, `shared/` fuera de workspaces
  (ver "Decisiones arquitectónicas clave"). `server/package.json` ya declara
  `"type": "module"` porque T-002 lo exige.
- `.env.example` usa la lista de variables de `docs/PROMPTS.md` T-008.

**Por qué se hizo así:**
- El prompt pedía "variables de SPEC.md sección 4", pero esa sección es la tabla de
  stack técnico y no lista variables. Se usó la lista canónica de T-008, que es
  la que valida `config/env.ts` en T-008.

**Impacto en otras tareas:**
- T-002 arranca con el `package.json` ya declarado como ESM.
- El `package.json` raíz sin scripts: T-003 y T-006 los agregan.

**Pendientes / deuda técnica:**
- Ninguna.

---

### 2026-09-29 — T-002 Server con TypeScript estricto
**Estado:** completada

**Qué se hizo:**
- `server/tsconfig.json` en modo strict con resolución NodeNext.
- `server/src/app.ts` exporta una instancia de Express sin arrancarla.
- `server/src/logger.ts` con `pino()` base.
- `server/src/config/index.ts` como placeholder.
- Dependencias base instaladas.

**Cómo se hizo:**
- Archivos creados: `server/tsconfig.json`, `server/src/app.ts`,
  `server/src/logger.ts`, `server/src/config/index.ts`; modificado
  `server/package.json` (scripts + deps).
- Dependencias: `express`, `zod`, `pino` (runtime); `typescript`, `tsx`,
  `@types/node`, `@types/express`, `pino-pretty` (dev). Todas justificadas por
  SPEC §4. `pino-pretty` queda instalado pero **sin configurar** hasta T-007.
- Decisiones: ver "npm workspaces", "NodeNext + type: module" y "Flags estrictos
  adicionales" en la sección de decisiones.

**Por qué se hizo así:**
- `app.ts` no lleva `app.listen()` porque T-002 lo exige explícitamente ("sin
  arrancar"). El listen real se agrega en T-004/T-007.
- `logger.ts` se creó sin configurar para no adelantarle trabajo a T-007.

**Impacto en otras tareas:**
- T-004, T-007 y T-009 se apoyan en esta instancia de Express.
- T-007 reconfigura `src/logger.ts`.
- T-008 crea `src/config/env.ts` dentro de `config/`.
- Los imports relativos en el backend **deben** llevar extensión `.js`.

**Pendientes / deuda técnica:**
- `logger.ts` es un `pino()` sin opciones: sin niveles, sin transporte, sin formato.
  Es intencional hasta T-007, pero si alguien importa el logger antes de esa tarea
  verá JSON plano sinPretty.
- `config/index.ts` solo hace `export {}`; no exporta nada todavía.

---

### 2026-10-02 — T-026 `POST /api/categories`
**Estado:** parcial (criterio de autorización pendiente de T-043)

**Qué se hizo:**
- `POST /api/categories` que crea una categoría: valida el body con Zod, comprueba que el
  `slug` no exista y responde 201 con la categoría ya localizada.
- Body: `slug` + `nameEs` + `nameRu` + `nameEn` obligatorios, `sortOrder` opcional.
- 409 `CATEGORY_SLUG_TAKEN` si el `slug` ya existe, comprobado antes de insertar.

**Cómo se hizo:**
- Modificados los cuatro archivos que T-025 ya había creado; **ninguno nuevo**:
  - `server/src/modules/categories/categories.schema.ts`: `createCategoryBodySchema` y el
    `slugSchema` con `.trim().toLowerCase()` y regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
  - `server/src/modules/categories/categories.repository.ts`: `categorySlugExists` e
    `insertCategory` con `.returning(categoryProjection)`. Se extrajo `categoryProjection`
    para no repetir la lista de columnas.
  - `server/src/modules/categories/categories.service.ts`: `createCategory(body, acceptLanguage)`.
  - `server/src/modules/categories/categories.routes.ts`: la ruta, con 201.
- Sin dependencias nuevas. `ConflictError` venía ya disponible en `shared/errors.ts`.

**Por qué se hizo así:**
- **El 401/403 del criterio no se implementó: `requireAdmin` es T-043 y no existe.** Se
  comprobó antes de escribir código: no existe `src/modules/auth`, `jsonwebtoken` no está
  instalado (solo `bcryptjs`) y nada emite un JWT. Implementar la autorización aquí habría
  significado montar la infraestructura de T-040/T-041/T-042 dentro de T-026, mezclando
  tareas. El dueño lo decidió así y la ruta lleva el mismo comentario que las otras
  escrituras: "Falta `requireAdmin`: se conecta en T-043".
- **El `slug` se normaliza y se valida en vez de limpiarse en silencio.** El slug es clave de
  filtro y de URL; si el backend "arreglara" `Niños` de una forma y el frontend enviara
  otra, la comparación fallaría sin error visible. Rechazar con 400 hace que el conflicto se
  vea en el cliente, que es donde se puede corregir.
- **El 201 devuelve la fila localizada, no solo el id.** Con solo el id, el frontend tendría
  que hacer un GET extra o reconstruir el nombre a mano para pintar lo que acaba de crear.
- **`sortOrder` es opcional con default 0** para no obligar a decidir el orden del menú en el
  alta, que es justo lo que permite reordenar después.

**Impacto en otras tareas:**
- **T-022 queda desbloqueado**: el alta de platos ya tiene dónde elegir `categoryId`.
- T-027 y T-028 pueden reutilizar `categorySlugExists`; T-028 necesitará además contar
  platos asociados para su 409, como hizo `purgeDish` con `orderItems` y `pageViews`.
- **T-043 tiene que proteger esta ruta.** Hasta entonces la API sigue sin ninguna escritura
  protegida: T-022, T-023, T-024, T-029a, T-029b y esta.
- T-027 debe decidir si el PUT admite cambiar el `slug`, y rechazarlo en vez de ignorarlo
  si no lo admite.

**Pendientes / deuda técnica:**
- El 401/403 de T-026, a resolver en T-043.
- La comprobación de slug duplicado es una carrera benigna: la integridad la garantiza el
  `UNIQUE` de la columna, no el `SELECT` previo.

---

### 2026-10-02 — T-027 `PUT /api/categories/:id`
**Estado:** parcial (criterio de autorización pendiente de T-043)

**Qué se hizo:**
- `PUT /api/categories/:id` que actualiza `slug`, los tres nombres y `sortOrder`, todos
  opcionales, y devuelve la categoría ya localizada.
- 404 `CATEGORY_NOT_FOUND` si el id no existe, 409 `CATEGORY_SLUG_TAKEN` si el slug nuevo
  está ocupado, 200 sin escribir si el body está vacío.
- **Se corrigió la respuesta de `POST /api/categories` (de T-026)** para que use el mismo
  sobre `{ language, category }`.

**Cómo se hizo:**
- Modificados los cuatro archivos del módulo, **ninguno nuevo**:
  - `categories.schema.ts`: `updateCategoryBodySchema` (derivada con `.partial()`) y
    `categoryEnvelopeSchema`.
  - `categories.repository.ts`: `findCategoryById`, `toUpdatePatch`, `updateCategory`, y
    `excludeId` opcional en `categorySlugExists`.
  - `categories.service.ts`: `updateCategoryById`.
  - `categories.routes.ts`: la ruta PUT.
- Sin dependencias nuevas.

**Por qué se hizo así:**
- **El 401/403 del criterio no se implementó: `requireAdmin` es T-043 y sigue sin existir.**
  Se comprobó antes de escribir código: no hay `src/modules/auth`, ni `jsonwebtoken` en
  `package.json`, ni nada que emita un JWT. Se dejó anotado igual que en las cinco
  escrituras anteriores.
- **El PUT admite cambiar el `slug`.** T-026 había dejado esta decisión pendiente y el
  criterio de T-027 no la menciona. Se derivó el schema con `.partial()` como ya hace
  `updateDishBodySchema`, en vez de mantener un schema paralelo; y se prefirió admitir el
  cambio con 409 antes que rechazarlo con 400, porque rechazarlo obligaría a un schema
  distinto solo para eso.
- **`excludeId` en `categorySlugExists` es imprescindible, no opcional.** Sin él, un PUT
  que reenvíe el slug sin cambios se rechaza a sí mismo con un 409 absurdo. Es la única
  forma de distinguir "este slug es mío" de "otro ya lo tiene".
- **El 404 se comprueba antes que el 409.** Si el id no existe, el slug recibido es
  irrelevante; devolver 409 sugeriría un conflicto que no hay.
- **Se corrigió el defecto de T-026.** Su POST devolvía la categoría suelta sin `language`,
  mientras que en dishes toda escritura devuelve `{ language, dish }`. Como el nombre
  depende del idioma de la petición, el sobre no es decoración: sin él el cliente no sabe
  si lo que ve es la traducción o el original. No había cliente que lo consumiera
  (`client/src` no menciona categorías), así que el cambio no rompe nada.

**Impacto en otras tareas:**
- T-028 puede usar `findCategoryById` para el 404 y necesita contar platos por categoría
  para su 409; no reutiliza el PUT.
- **T-043 tiene que proteger esta ruta: son ya siete las escrituras sin proteger**
  (T-022, T-023, T-024, T-026, T-027, T-029a, T-029b).
- El frontend, cuando exista, debe leer `category.name` dentro del sobre, igual que `dish`.

**Pendientes / deuda técnica:**
- El 401/403 de T-027, a resolver en T-043.
- `POST /api/categories` cambió de forma en esta tarea; si algún test futuro se escribió
  contra la forma de T-026, hay que actualizarlo.

---

### 2026-10-02 — T-028 `DELETE /api/categories/:id`
**Estado:** parcial (criterio de autorización pendiente de T-043)

**Qué se hizo:**
- `DELETE /api/categories/:id` que borra la categoría si no tiene platos asociados, y
  responde 204 sin cuerpo cuando lo consigue.
- 409 `CATEGORY_HAS_DISHES` con `{ id, totalDishes }` si tiene platos, 404
  `CATEGORY_NOT_FOUND` si el id no existe.

**Cómo se hizo:**
- Modificados `categories.routes.ts`, `categories.service.ts` y `categories.repository.ts`.
  **Ningún archivo nuevo y ningún cambio de schema**, que es la diferencia con un borrado
  lógico.
- Sin dependencias nuevas.

**Por qué se hizo así:**
- **El borrado es físico, no lógico, y esto lo decidió el dueño.** MEMORY había dejado la
  pregunta abierta en dos sitios ("debe decidir explícitamente si un dish deshabilitado
  cuenta") y el criterio de T-028 solo fijaba el 409. Se descartó el borrado lógico porque
  `categories` **no tiene `is_available`**: hacerlo exigiría una migración nueva, y dejaría
  los platos de esa categoría visibles pero sin grupo al que pertenecer. Al ser físico,
  el 409 garantiza que nunca quedan referencias colgando.
- **Un dish deshabilitado cuenta para el 409**, respetando lo que MEMORY ya había decidido.
  `countCategoryDishes` no filtra por `is_available`, al contrario que `findAvailableDishes`.
- **El conteo es la condición del borrado, no un dato informativo.** La FK está en
  `NO ACTION`, así que SQLite abortaría igual, pero comprobar antes convierte la excepción de
  constraint en un mensaje de API. Mismo patrón que `purgeDish` en T-029b.
- **El 404 se comprueba antes que el 409**, como en el PUT: con un id inexistente el conteo
  no significa nada.
- **El 401/403 no se implementó: `requireAdmin` es T-043 y sigue sin existir.** Se dejó
  anotado como en las siete escrituras anteriores.

**Impacto en otras tareas:**
- **Con T-028 queda cerrado el CRUD de categorías (T-025–T-028) y con él `A-001`.**
- **T-043 tiene que proteger esta ruta: son ya ocho las escrituras sin proteger** (T-022,
  T-023, T-024, T-026, T-027, T-028, T-029a, T-029b).
- T-029 (índice en `dishes.category_id`) beneficia a este módulo: `countCategoryDishes` es
  un `COUNT` por categoría, el segundo consumidor de esa columna aparte de los listados.
- El admin no tiene forma de consultar cuántos platos tiene una categoría antes de
  borrarla; solo lo descubre por el 409, que ya incluye `totalDishes`.

**Pendientes / deuda técnica:**
- El 401/403 de T-028, a resolver en T-043.
- Sigue sin haber forma de listar los platos de una categoría concreta (`GET
  /api/dishes?category=`), que es lo que un admin querría antes de un borrado bloqueado.
- **Se cumple lo que la entrada de T-027 anticipaba:** T-028 usa `findCategoryById` para el
  404 y cuenta platos por categoría para el 409, sin reutilizar nada del PUT.

---

### 2026-10-02 — T-029 Índice en `dishes.category_id`
**Estado:** completada

**Qué se hizo:**
- Índice `dishes_category_id_idx` sobre `dishes(category_id)`, con su migración aplicada.
- `EXPLAIN QUERY PLAN` pasa de `SCAN dishes` a `SEARCH dishes USING INDEX` al filtrar por
  categoría, y a `SEARCH ... USING COVERING INDEX` en el `COUNT`.

**Cómo se hizo:**
- `server/src/db/schema.ts`: la tabla `dishes` pasa a la forma con callback para declarar el
  índice: `(table) => [index('dishes_category_id_idx').on(table.categoryId)]`. Se importa
  `index` de `drizzle-orm/sqlite-core`.
- `server/src/db/migrations/0002_unusual_the_hand.sql` (nuevo), generado con
  `npm run db:generate`. Contenido: un único `CREATE INDEX`.
- `server/src/db/migrations/meta/0002_snapshot.json` y `_journal.json`, generados por la
  misma herramienta.
- **No se tocó ninguna migración ya aplicada**, según la regla de MEMORY de que no se
  modifican una vez aplicadas: 0000 y 0001 siguen intactas.
- Sin dependencias nuevas.

**Por qué se hizo así:**
- **El índice se declara en el callback de la tabla, no suelto.** La primera versión
  (`export const dishesCategoryIdIdx = index(...).on(dishes.categoryId)`) **compilaba y
  pasaba `tsc`**, pero `drizzle-kit generate` dijo "No schema changes" y el resumen decía
  `dishes 0 indexes`. Es el fallo silencioso más fácil de no ver en esta tarea.
- **Migración generada, no escrita a mano.** Un `CREATE INDEX` manual dentro de un `.sql`
  dejaría el schema de TypeScript diciendo una cosa y la base otra; el snapshot de
  `meta/` dejaría de reflejar la realidad.
- **Se implementa solo lo que pedía el enunciado.** El criterio pedía únicamente el índice, y el
  filtro por categoría ya existe en el código (`countCategoryDishes` de T-028), así que no
  hizo falta tocar ningún endpoint.

**Impacto en otras tareas:**
- **Con T-029 se cierra la parte de A-001 que quedaba**: el CRUD de categorías (T-025 a
  T-028) y el índice que lo hace escalable. Sigue pendiente `GET /api/dishes?category=`, que
  es el consumidor natural del índice y sigue sin existir (anotado en T-028).
- T-029 era también la tarea que T-028 señaló como segundo consumidor de `category_id`.
- No cambia ningún contrato de API: es invisible para el cliente.

**Pendientes / deuda técnica:**
- **El índice no acelera `SELECT *` con pocas categorías.** Medido a 4 000 platos y 5
  categorías (800 por categoría), el `COUNT` mejora de 118 ms a 95 ms, pero un `SELECT *` por
  categoría sale **más lento** con índice (457 ms vs 308 ms): al devolver las filas
  completas hay que ir a buscar cada una, y con el 20 % de la tabla en la categoría el
  `SCAN` compensa. A escala realista (40 000 platos, 200 categorías) el `COUNT` sí mejora
  de 46 ms a 24 ms. El índice es el de la tarea pedida y el correcto para el `COUNT`, pero
  conviene saber que con pocas categorías y muchos platos por categoría el listado
  completo puede no ganar.
- `dishes.is_available` sigue sin índice. No se ha pedido, y con el menú entero en pantalla
  el `SCAN` es lo razonable.

---

### 2026-10-02 — T-035 Estilos base con Tailwind + shadcn/ui (`bloqueada`)
**Estado:** bloqueada (a la espera de decisión del dueño; no se ha escrito código)

**Qué se hizo:**
- Revisión del estado real de shadcn en el proyecto y de lo que pide cada componente del
  enunciado. Sin código nuevo.

**Cómo se hizo:**
- Leídos `components.json`, `client/src/index.css`, `components/ui/button.tsx`,
  `components/Layout.tsx`, `client/package.json` y las entradas de T-032 a T-034.
- Se probó la CLI de verdad: `npx shadcn@latest add ... --dry-run` desde la raíz y desde
  `client/`. Se consultó el registro oficial de shadcn para las dependencias de cada componente.
- Archivos tocados: solo `docs/TASKLIST.md` y `docs/MEMORY.md`.

**Por qué se hizo así:**
- **shadcn/ui ya está instalado.** T-032 lo montó a mano (`components.json`, `cn`, `Button`,
  `clsx`/`tailwind-merge`/`class-variance-authority`) y T-033/T-034 lo han usado. Lo que queda
  no es un `init` sino **terminar la parte que quedó a medias**: los tokens del tema, que
  `index.css` no tiene y que T-005 ya había avisado de que había que revisar.
- **Bloqueo 1 — la CLI no encuentra la aplicación, y el fallo viene de T-032.** `components.json`
  está en la **raíz** del monorepo y la app en `client/`. Desde la raíz, `shadcn add` responde
  `Failed to load tsconfig.json` (en la raíz no hay `tsconfig.json`); desde `client/` responde
  que no hay `components.json` y propone crearlo. La entrada de T-032 afirma que el fichero
  "deja la CLI lista para añadir componentes sin reconfigurar", y **eso no se cumple tal como
  está puesto**: habría que moverlo a `client/`.
- **Bloqueo 2 — dependencias nuevas, con Radix ya denegado.** Según el registro oficial:
  `card` e `input` no piden nada; `label` pide `@radix-ui/react-label`; el `button` oficial pide
  `@radix-ui/react-slot`; `dropdown-menu` pide `@radix-ui/react-dropdown-menu` y `lucide-react`;
  `toast` pide `@radix-ui/react-toast` y `lucide-react`. Además los overlays usan utilidades de
  `tw-animate-css`, que no viene con Tailwind 4. **Radix se denegó en T-033** para el dropdown del
  selector de idioma, así que instalar `@radix-ui/react-dropdown-menu` ahora es lo mismo que se
  denegó, aplicado a otro componente.
- **Bloqueo 3 — no cabe en una tarea.** Los seis componentes del enunciado son **7 archivos
  nuevos** (`card`, `input`, `label`, `dropdown-menu`, y `toast` que trae `toast.tsx`,
  `toaster.tsx` y `hooks/use-toast.ts`), y AGENTE.md §1 limita a 5 archivos nuevos por tarea.
- Alternativas descartadas: (a) hacer los 7 archivos igualmente, que incumple el límite de
  AGENTE.md; (b) reescribir a mano `label`/`dropdown-menu`/`toast` para no instalar Radix, que
  contradice la decisión de T-032 de usar shadcn de verdad en vez de imitarlo.

**Impacto en otras tareas:**
- **T-035 sigue pendiente de una respuesta**; nada más depende de este bloqueo.
- **T-044 (formularios de `/login` y `/register`)** necesita `input` y `label`, así que si se
  aprueban vendrán justo en la tarea que los usa.
- **T-092 (`ErrorBoundary` + toasts)** es el consumidor natural de `toast`; instalarlo en T-035
  lo deja sin usar.
- **T-091 (responsive)** depende del criterio visual de esta tarea: los breakpoints que se
  fijen aquí son los que se.uspto después.

**Pendientes / deuda técnica:**
- `client/src/index.css` sigue con una sola línea (`@import 'tailwindcss'`). Cuando se añadan
  los tokens, los componentes que ya usen `stone-*` seguirán funcionando igual: por eso se puede
  añadir el tema sin reescribir de golpe toda la UI.
- El `Button` actual es de shadcn en apariencia pero no es el de shadcn: no tiene `asChild`, y por
  eso T-034 tuvo que extraer `buttonVariants` para poder dar estilo de botón a un enlace.

---

### 2026-10-02 — T-034 Página `/menu/:id`
**Estado:** completada

**Qué se hizo:**
- Página de detalle `/menu/:id` con imagen grande, nombre, descripción completa, ingredientes,
  precio localizado, botón de "añadir al carrito" y enlace de vuelta al menú.
- `fetchDishById` y su tipo `ApiDishResponse`, y enlaces desde la tarjeta del menú.

**Cómo se hizo:**
- Nuevos: `client/src/pages/DishDetail.tsx` y `client/src/components/ui/button-variants.ts`.
  Modificados: `client/src/api/dishes.ts`, `api/dishes.types.ts`,
  `client/src/components/DishCard.tsx`, `client/src/components/ui/button.tsx`,
  `client/src/main.tsx` y los tres JSON de `locales`.
- **Ninguna dependencia añadida.**
- 5 claves nuevas en los tres idiomas: `nav.backToMenu`, `dish.loading`, `dish.notFound`,
  `dish.error`, `dish.ingredients`.

**Por qué se hizo así:**
- **La forma de la respuesta se verificó contra el backend antes de escribir código.** Con `curl`
  al servidor en marcha, `GET /api/dishes/:id` devuelve **`{ language, dish }`**, no un objeto
  pelado, y el `dish` es el mismo que viaja en el listado. `ApiDishResponse` reproduce el
  envoltorio de la convención "los endpoints devuelven `{ language, data }`" en vez de inventar
  una tercera forma.
- **`buttonVariants` se movió a `button-variants.ts`.** La deuda que dejó T-032 era que el
  `Button` no admite `asChild`, y sin eso no puede envolver un `<Link>`; además un `<button>` no
  puede contener un enlace. Extraer las variantes es literalmente lo que T-032 dejó escrito para
  el momento en que hiciera falta, y evita que el navbar y los botones se separen por estilo.
  **La deuda de `asChild` queda resuelta sin Radix**, cuya instalación ya se había denegado en
  T-033.
- **El `id` de la ruta se valida en la página antes de preguntar.** `useParams` da una cadena, y
  mandar `NaN` al backend para un `/menu/abc` es un viaje para un error que ya se sabe. Se
  comprueba con `Number.isInteger`, la misma regla que aplica `idParamSchema` en el servidor.
- **`DISH_NOT_FOUND` y "el plato no existe" comparten mensaje, pero no con todos los errores.** El
  404 del backend también sale para un plato deshabilitado (decisión de T-021, no revelar qué
  platos existieron); cualquier otro error muestra el mensaje de fallo de la API para que el
  usuario no piense que le han borrado un plato.
- **La tarjeta enlaza con la imagen y con el nombre, no con toda la tarjeta.** Un `<a>` no puede
  envolver al `<button>` de "añadir al carrito". Dos enlaces al mismo destino agrandan la zona
  pulsable sin inventar un `stretched-link`.
- **`DishDetail` es página y no una segunda versión de `DishCard`.** La tarjeta resume dentro de
  un `<li>`; el detalle es una imagen grande y el texto sin truncar. La descripción aquí no lleva
  `line-clamp-2`, al revés que en la tarjeta.
- **La respuesta no se valida con Zod en el cliente.** El cliente no tiene `zod` y el backend ya
  valida lo que serializa (`dishSchema.parse`); un 200 con cuerpo raro solo puede venir de un
  proxy. Mismo criterio que `fetchDishes`.

**Impacto en otras tareas:**
- **T-050 (carrito)** tiene sus dos puntos de enganche: los botones de `DishCard` y de
  `DishDetail`. Se dejaron sin `onClick` a propósito.
- **T-035 (estilos base)** hereda un `Button` con variantes ya compartibles con los enlaces; lo
  que sigue pendiente son los tokens del tema y el aspecto del navbar.
- **T-053 y T-055** pueden reutilizar `buttonVariants` para sus enlaces.
- No se ha creado ningún endpoint: todo sale de `GET /api/dishes/:id`, que existía desde T-021.

**Pendientes / deuda técnica:**
- **La rama de error de la página no se ha visto renderizada.** Con la caché calentada con el 404
  real, `renderToStaticMarkup` sigue pintando el esqueleto por el motivo del gotcha de TanStack
  de T-031. Lo comprobable está comprobado (el `ApiError` con 404 y `DISH_NOT_FOUND`, y el
  componente que pinta `dish.notFound` renderizado por la vía del `id` inválido); lo que falta es
  un navegador de verdad. Es la misma razón por la que T-093 (tests) necesita un runner con DOM.
- La página no enseña la categoría del plato. El endpoint la manda (`category.name`, ya
  localizado) y la tarjeta tampoco la enseña; si el diseño la quiere, es una línea en los dos.

---

### 2026-10-02 — T-033 Selector de idioma en navbar
**Estado:** completada (retoma la entrada bloqueada de T-033 del mismo día)

**Qué se hizo:**
- `LanguageSwitcher` con un botón por idioma (ES / RU / EN) que llama a `i18n.changeLanguage`,
  marca el activo por variante del `Button` y por `aria-current`, y persiste la elección en
  `localStorage` a través del detector.
- `Layout` como ruta padre de `/` y `/menu`: navbar con el selector y `<Outlet />` para la ruta
  activa.
- Corregido el orden de detección de `client/src/lib/i18n.ts` y el comentario que lo describía.

**Cómo se hizo:**
- Nuevos: `client/src/components/LanguageSwitcher.tsx`, `client/src/components/Layout.tsx`.
  Modificados: `client/src/lib/i18n.ts`, `client/src/main.tsx`, `client/src/App.tsx` y los tres
  JSON de `locales`.
- **Ninguna dependencia añadida.** El enunciado pedía «tres botones o dropdown» y el dropdown de
  shadcn es un wrapper sobre `@radix-ui/react-dropdown-menu`: su instalación se autorizó y se
  denegó, así que el selector son tres botones sobre el `Button` de T-032.
- 5 claves nuevas en los tres idiomas: `nav.main`, `language.label`, `language.es`, `language.ru`,
  `language.en`.

**Por qué se hizo así:**
- **Se corrigió una decisión previa, con permiso.** T-030 decidió `detection.order:
  ['navigator', 'localStorage']`, y el criterio de T-033 es incompatible con ella: medido, con el
  navegador en `es-ES` y `ru` en `localStorage`, i18next resolvía `es` y además **sobrescribía** la
  elección guardada. Al invertir el orden, con autorización del dueño, `localStorage` pasa a ir
  primero, la elección gana y, sin elección guardada, el navegador sigue mandando. La entrada de
  T-030 **no se ha borrado**: esto la sustituye y explica por qué.
- **`detect()` concatena, no elige el primero que exista.** Recorre los detectores del array y
  junta todo lo que encuentra en ese orden; luego i18next se queda con el primer idioma de esa
  lista que soporte. Poner `navigator` delante no es un fallback: es prioridad absoluta, porque
  `navigator.language` siempre existe. Por eso `localStorage` no llegaba ni a mirarse.
- **El componente no persiste a mano.** `changeLanguage` ya dispara `cacheUserLanguage` sobre la
  clave `i18nextLng`; escribirla también desde el componente sería una segunda fuente de verdad.
- **La lista sale de `LANGUAGES`,** la constante que `lib/i18n.ts` exporta y que ya alimenta
  `supportedLngs` y los `resources`. Un array escrito en el componente sería una tercera lista que
  se desincroniza al añadir un idioma.
- **Lo visible es el código ISO y lo que se anuncia es el endónimo.** El código es igual en los
  tres idiomas y no necesita traducción; el endónimo (`Español`, `Русский`, `English`) es lo único
  que le sirve a alguien cuya interfaz está en un idioma que no lee, que es el caso de uso de este
  selector. **Los tres ficheros de traducciones llevan por eso los mismos endónimos** y solo se
  traduce `language.label`; no es una traducción olvidada.
- **`Layout` es ruta padre, no un wrapper de `<Routes>`.** Con `<Outlet />` y sin props, cada
  página deja de decidir qué chrome lleva encima y una ruta nueva solo añade un `<Route>`.
- **El navbar se queda mínimo.** Los enlaces de menú, carrito y sesión están en `locales` desde
  T-030 pero no se pintan: decidir eso es el criterio de T-035.

**Impacto en otras tareas:**
- **T-035 (estilos base) hereda el navbar** y decide qué enlaces se pintan. Los tokens del tema de
  shadcn siguen sin estar en `index.css`, así que navbar y botones usan clases de Tailwind
  directas.
- **T-034 (`/menu/:id`) no toca el layout:** su ruta queda dentro de la de `Layout` automáticamente.
- **T-045 y el paso 2 de SPEC §7.2** (`preferredLang` en BD) siguen pendientes: no hay sesión ni
  endpoint de usuario. Cuando existan tendrán que **escribir** el idioma elegido, porque hoy la
  elección vive solo en el navegador.
- El selector no hace ninguna petición: el contenido se relocaliza porque `Menu` mete el idioma en
  la `queryKey`, como decidió T-031.

**Pendientes / deuda técnica:**
- El endónimo de cada idioma es un `aria-label`, no texto visible: en la interfaz siempre se ven los
  códigos. Si el dueño quiere los nombres a la vista, es una línea más y las claves ya existen.
- La elección de idioma no se propaga a `users.preferred_lang` (SPEC §7.2) ni entre pestañas del
  mismo navegador. Lo segundo se resolvería con el evento `storage`, que hoy nadie escucha.
- La comprobación de T-033 se hizo en Node con `window.localStorage` simulado, no en un navegador
  real. Es la misma limitación que arrastra T-031: en un navegador de verdad habría que comprobar
  además que el botón recibe el foco visible y que `Enter` y `Espacio` lo activan.

---

### 2026-10-02 — T-033 Selector de idioma en navbar (`bloqueada`)
**Estado:** bloqueada (a la espera de decisión del dueño; no se ha escrito código)

**Qué se hizo:**
- Revisión del enunciado de T-033 contra el estado real del cliente. Sin código nuevo.

**Cómo se hizo:**
- Revisados `client/src/lib/i18n.ts`, `App.tsx`, `main.tsx`, `components/ui/button.tsx`,
  `locales/{es,ru,en}.json` y el código de `i18next-browser-languagedetector@8.2.1`.
- Se midió el comportamiento del detector con `i18next@26.4.2`, simulando `window.localStorage`
  y `navigator` para comparar los dos órdenes de detección posibles.
- Archivos tocados: solo `docs/TASKLIST.md` y `docs/MEMORY.md`.

**Por qué se hizo así:**
- **El criterio de T-033 («al recargar, mantiene el idioma elegido») es imposible con la
  decisión de T-030** (`detection.order: ['navigator', 'localStorage']`). Medido, con el
  navegador en `es-ES` y `ru` ya guardado en `localStorage`:

  | `detection.order` | Resuelve | `localStorage` al final |
  | --- | --- | --- |
  | `['navigator', 'localStorage']` (actual) | **`es`** | **`es-ES`: se pierde la elección** |
  | `['localStorage', 'navigator']` | **`ru`** | `ru`: se conserva |

  Con el orden invertido y **sin** elección guardada sigue resolviendo `es` por el navegador, que
  es justo lo que se quería al decidir el orden en T-030.
- **El bloqueo es de proceso, no de código:** cumplir el criterio exige revertir una decisión
  arquitectónica ya registrada en esta bitácora, y la regla es preguntar antes de revertir.
- Alternativas descartadas: (a) escribir el componente y "arreglar" el orden después, que deja
  T-033 marcada como hecha sin que su criterio se cumpla; (b) montar un `localStorage` propio
  paralelo al detector, que duplicaría la persistencia y añadiría una segunda fuente de verdad.

**Impacto en otras tareas:**
- **T-033 sigue pendiente de una respuesta.** El componente, el `Layout` y los botones de
  verificación de `App.tsx` no se han tocado: nada depende de este bloqueo más que T-035.
- **T-035 (navbar y estilos base)** hereda la misma configuración: un navbar que ofrezca
  idiomas tiene que respetar el orden de detección que se decida aquí.
- **T-045 (sesión con Zustand) y el paso 2 de SPEC §7.2** siguen sin poder tocar
  `users.preferred_lang`: no hay sesión ni endpoint de usuario. Cuando existan, la sincronización
  tendrá que escribir el idioma que el usuario elija y no solo leerlo.
- El `localStorage` que escribe el detector es la clave `i18nextLng`, por defecto del paquete.

**Pendientes / deuda técnica:**
- El comentario de `client/src/lib/i18n.ts` que explica el orden de detección habla de un
  `lng` "fijo para el detector" que **no existe en la configuración**: describe una opción que
  no está puesta. Debería corregirse al cerrar T-033, diga lo que diga la decisión.
- Los botones de idioma de `App.tsx` siguen siendo los provisionales de T-030; T-033 los quita.

---

### 2026-10-02 — T-030 `react-i18next` en el cliente
**Estado:** completada

**Qué se hizo:**
- `react-i18next` configurado con `es`, `ru` y `en`, un JSON por idioma con 12 claves, e
  importación de la configuración en `main.tsx`.
- `App.tsx` pasa a usar `t()` en vez de texto fijo.

**Cómo se hizo:**
- Nuevos: `client/src/locales/{es,ru,en}.json` y `client/src/lib/i18n.ts`.
- Modificados: `client/package.json`, `package-lock.json`, `client/src/main.tsx`,
  `client/src/App.tsx`.
- **Dependencias instaladas con permiso explícito del dueño:** `i18next@26.4.2`,
  `react-i18next@17.0.15`, `i18next-browser-languagedetector@8.2.1`, en `@osito/client`.
  `npm audit`: 0 vulnerabilidades.

**Por qué se hizo así:**
- **Los JSON se importan, no se piden por HTTP.** `i18next-http-backend` haría una petición
  por idioma en el arranque y, con las peticiones yendo por el proxy `/api`, atravesaría
  Nginx en producción. Con doce claves por idioma no compensa.
- **`nonExplicitSupportedLngs: true` es lo que hace que la lista de idiomas sirva de algo.**
  Es el equivalente en el cliente de `resolveLanguage` en el backend: sin ello, un navegador
  en `ru-RU` no está literalmente en la lista y se cae al fallback en vez de usar el ruso.
- **El orden de detección es `navigator` antes que `localStorage`**, al revés del defecto
  típico. Si `localStorage` fuera primero, el usuario quedaría congelado en el idioma de su
  última visita aunque su navegador dijera otro; con `navigator` primero, la elección
  explícita de T-033 puede ganar cuando exista.
- **`escapeValue: false`** porque React ya escapa al renderizar y doble escapado rompe
  acentos.
- **Los botones de idioma de `App.tsx` son de verificación, no de interfaz.** T-033 los
  sustituye por el selector real del navbar; está anotado en la tarea para que nadie los
  interprete como diseño terminado.

**Impacto en otras tareas:**
- **T-033 ya tiene la infraestructura:** `caches: ['localStorage']` y el orden de detección
  están puestos; solo falta el componente y quitar los botones provisionales.
- T-031 y T-032 ya pueden usar `t()` sin configurar nada más.
- **El idioma de la UI y el del contenido pasan a ser el mismo `i18n.language`,** que es lo
  que hace que el `Accept-Language` que manda el cliente coincida con lo que ve el usuario.
  Ninguna tarea anterior lo fijó.
- Cuando exista T-050, `users.preferred_lang` tendrá que fijar el idioma con
  `changeLanguage` al iniciar sesión, y no solo el detector del navegador.

**Pendientes / deuda técnica:**
- `changeLanguage('EN')` en mayúsculas cae al fallback en vez de resolver a `en`. No rompe
  nada, pero el idioma debe pasarse en minúsculas. El detector del navegador nunca entrega
  mayúsculas, así que solo afecta a código propio.
- Los archivos de traducción no tienen todavía tipo derivado: un `t('clave.inexistente')`
  compila igual. Derivar los tipos del JSON es la forma de que TypeScript avise.

---

### 2026-10-02 — T-031 Página `/menu` con TanStack Query
**Estado:** completada

**Qué se hizo:**
- Página `/menu` que consume `GET /api/dishes` con TanStack Query, manda el `Accept-Language`
  del idioma activo, y muestra un grid responsive con los cuatro estados: carga (skeleton),
  error, vacío y datos.
- `QueryClientProvider` y `BrowserRouter` montados en `main.tsx`, con rutas `/` y `/menu`.
- Clave `menu.error` añadida a los tres idiomas de `locales`.

**Cómo se hizo:**
- Nuevos: `client/src/pages/Menu.tsx`, `client/src/api/dishes.ts` (fetch) y
  `client/src/api/dishes.types.ts` (tipos). Modificados: `client/src/main.tsx` y los tres
  JSON de traducciones.
- Dependencias instaladas con permiso explícito del dueño: `@tanstack/react-query@5.104.1` y
  `react-router-dom@7.18.4`. `npm audit`: 0 vulnerabilidades.

**Por qué se hizo así:**
- **El idioma va dentro de la `queryKey`.** Sin eso, TanStack serviría la caché de la petición
  anterior al cambiar de idioma y la pantalla se quedaría en el idioma viejo hasta que se
  recargara. Con el idioma en la clave cada idioma tiene su entrada y volver al anterior no
  repregunta.
- **`fetchDishes` recibe el idioma por parámetro y no lee `i18n`.** Quien llama ya lo tiene de
  `useTranslation`; así la función no depende del singleton y se puede comprobar sin montar
  React.
- **El precio se formatea con `Intl.NumberFormat` en el idioma de la respuesta.** El separador
  cambia entre idiomas y el precio llega ya localizado; `toFixed` daría un número descuadrado.
- **`staleTime: 30_000` y `retry` en su valor por defecto.** El menú cambia poco, y con
  `staleTime: 0` cada montaje repregunta. El retry por defecto ayuda con fallos de red
  transitorios.
- **Los tipos van en `dishes.types.ts`, no en el fichero que hace el fetch.** Escribí los dos
  con el nombre `dishes.ts` y el segundo sobrescribió al primero: el `import type` del propio
  módulo se resolvía a sí mismo y TypeScript daba `TS2459`. Separarlos evitó el conflicto.
- **El plato basura de la base se borró antes de verificar**, por indicación del dueño.

**Impacto en otras tareas:**
- **T-032 puede extraerse la tarjeta casi hecha:** `DishCard` dentro de `Menu.tsx` ya pinta
  imagen con `alt`, nombre, descripción, ingredientes y precio localizado. Es mover código.
- **T-033 tiene lo difícil montado:** provider de React Query y router en `main.tsx`.
- **No hay navegación todavía:** `/menu` se llega escribiendo la URL. El navbar es cosa de T-033.
- El endpoint ya devuelve `category` con nombre localizado y `ApiDish` ya lo tipa: agrupar el
  menú por categoría no necesita cambios en la API.
- Sigue sin existir `GET /api/dishes?category=`, que es el consumidor natural del índice de
  T-029.

**Pendientes / deuda técnica:**
- **El estado de error no se ha verificado en un navegador.** El camino de API sí (404 →
  `ApiError` con `CATEGORY_NOT_FOUND`), pero el render del mensaje no, porque no hay navegador
  automatizado en el proyecto y `renderToStaticMarkup` no refleja el estado de error. Ver gotcha.
- Sin navegación, así que `/menu` no se enlaza desde `/`.

---

### 2026-10-02 — T-032 Componente `DishCard` (+ Button de shadcn/ui)
**Estado:** completada

**Qué se hizo:**
- `DishCard` con imagen 4:3, nombre, descripción truncada, ingredientes, precio localizado y
  botón de "añadir al carrito". Grid de 1 columna en móvil y 3 en desktop.
- Infraestructura de shadcn/ui montada: `Button` con variantes, helper `cn`,
  `components.json` y las tres dependencias.

**Cómo se hizo:**
- Nuevos: `client/src/components/DishCard.tsx`, `client/src/components/ui/button.tsx`,
  `client/src/lib/utils.ts`, `client/src/lib/format.ts`, `components.json`.
- Modificado: `client/src/pages/Menu.tsx`, que ya no tiene tarjeta propia y usa el componente.
- Dependencias con permiso del dueño: `clsx@2.1.1`, `tailwind-merge@3.7.0`,
  `class-variance-authority@0.7.1`. `npm audit`: 0 vulnerabilidades.

**Por qué se hizo así:**
- **El enunciado daba por hecho un tipo `Dish` en `shared/types.ts` que no existe.** Ese
  `shared/types.ts` está en la raíz y está vacío, igual que `shared/schemas.ts`. Se usa
  `ApiDish` de `api/dishes.types.ts`, que es la definición real de lo que devuelve el endpoint.
  Duplicar el tipo en un `shared/` del cliente habría creado dos verdades que pueden divergir.
- **shadcn/ui se montó de verdad en vez de imitarlo.** Un `<button>` con clases de Tailwind no
  habría sido shadcn y T-033 habría tenido que tomar esa decisión más tarde.
- **`DishCard` es un `<article>` y la lista aporta el `<li>`.** Un componente que impone su
  contexto no se puede usar suelto; así `Menu` envuelve y `DishCard` se reutiliza en un
  detalle o en un carrusel sin tocarlo.
- **`language` llega por props en vez de leerse de `i18n` dentro del componente**, igual que en
  `fetchDishes`: mantiene el componente libre del singleton y comprobable sin red.
- **`line-clamp-2` en vez de un truncado por altura.** El texto llega localizado y cambia de
  longitud por idioma; con altura fija las tarjetas quedarían desiguales.
- **`formatPrice` va en `lib/` y `buttonVariants` no se exporta**, porque un fichero que
  exporta componentes y funciones rompe el Fast Refresh. Con eso ESLint queda sin avisos.

**Impacto en otras tareas:**
- **T-033 puede montar el navbar sobre `Button`**, con variantes y tamaños ya definidos.
- `components.json` deja la CLI de shadcn lista para añadir componentes sin reconfigurar.
- **El botón no hace nada todavía**: no hay carrito detrás, llegan con las tareas del carrito,
  y por eso no se le pasa `onClick`.
- El `cn` está disponible para cualquier componente futuro, que es la forma correcta de
  sobrescribir utilidades desde fuera de un componente.

**Pendientes / deuda técnica:**
- **`index.css` solo tiene `@import 'tailwindcss'`.** Los tokens del tema de shadcn no están, y
  el `Button` por eso usa clases de Tailwind directas. Si se quiere el tema completo, hay que
  añadir los tokens y cambiar el botón a usarlos.
- **`formatPrice` exige idioma no vacío** y lanza `RangeError` si se le pasa `''`: es
  intencionado, para que un fallo así se delate en lugar de quedar tapado por un valor por
  defecto.
- El botón es `<button>` y no acepta `asChild` como el de shadcn oficial, así que no sirve
  todavía para envolver un `<a>` o un `Link`.

---

### 2026-10-04 — T-043 `requireAuth` y `requireAdmin`
**Estado:** completada

**Qué se hizo:**
- `server/src/middleware/auth.ts` con los dos middlewares y el augment de tipos de `Request`.
- Las **seis escrituras de platos** y las **tres de categorías** pasan por `requireAdmin`.
  Ya no queda ninguna escritura pública en la API.

**Cómo se hizo:**
- Un solo fichero nuevo y **sin dependencias nuevas** (`jsonwebtoken` ya venía de T-041).
  `auth.schema.ts` pasó a exportar `accessClaimsSchema`, que hasta ahora solo se usaba dentro
  del módulo de auth.
- Verificación con peticiones reales en dev y contra el build de `dist/`, y limpieza de los
  datos de prueba (usuario, plato y categoría) dejando los contadores de `sqlite_sequence`
  como estaban.

**Por qué se hizo así:**
- **`requireAdmin` es `requireAuth` + comprobación de rol, en ese orden.** El criterio lo fija:
  sin token 401 y con token de cliente 403. Al revés, el 403 le confirmaría a quien no tiene
  sesión que la ruta existe y que lo único que le falta es el rol.
- **Tres comprobaciones del token, en orden: firma (`JWT_SECRET` con `algorithms: ['HS256']`
  explícito), `type === 'access'` y shape de los claims con Zod.** Es la decisión que
  promovieron T-041 y T-042: los refresh tokens mueren en la primera, y el `type` impide que
  uno de 7 días sirva de credencial. Sin `algorithms` explícito, `jsonwebtoken` se fía del
  algoritmo que declare la cabecera del token.
- **Un único 401 para todos los fallos de autenticación**, con mensaje y `code` iguales.
  Distinguirlos ("caducado" frente a "firma inválida") diría a quien va probando qué ha
  fallado en el servidor.
- **El esquema se compara en minúsculas** (`'bearer '`): RFC 6750 dice que el esquema no
  distingue mayúsculas, y comparar con `startsWith('Bearer ')` rechazaría `bearer` sin motivo.
- **Los middlewares lanzan en vez de llamar a `next(error)`,** igual que los handlers con
  `schema.parse(...)`: Express envuelve la llamada en `try/catch` y el `errorHandler` —que ya
  traduce un `AppError` a status y `code`— se encarga. Es el mismo camino que recorre un 400.
- **`req.user` es opcional (`user?`) a propósito.** Marcarlo obligatorio haría que TypeScript
  garantizase una sesión en todas las rutas, incluidas las públicas, donde no existe: el tipo
  mentiría y el fallo aparecería en producción. `AuthUser` excluye `passwordHash` y
  `preferredLang` para que el hash no pueda propagarse por los handlers.
- **El envoltorio de `requireAdmin` existe solo por los tipos:** la tercera posición de un
  `RequestHandler` es `NextFunction`, y un `RequestHandler` de cuatro parámetros no encaja ahí.
- **Se protegieron las tres escrituras de categorías aunque el prompt base solo nombrara las de
  platos**, porque T-026, T-027 y T-028 dejaron su parte de 401/403 explícitamente pendiente
  de T-043 por decisión del dueño. Era el último sitio donde se podía escribir sin sesión.

**Impacto en otras tareas:**
- **T-044, T-045 y T-046** tienen ya el 401 que deben manejar: sin cabecera, con cabecera
  inválida y con access caducado es el mismo `code: 'UNAUTHORIZED'`, así que T-046 lo
  distingue de `INVALID_CREDENTIALS` y `INVALID_REFRESH_TOKEN` por `code`, que es único en
  cada caso. El `code: 'FORBIDDEN'` del 403 es el primero que ve un cliente.
- **El panel del chef (Fase 8)** ya puede llamar a las escrituras con el access token sin que
  haga falta nada más: no queda ninguna escritura pública.

**Pendientes / deuda técnica:**
- **El `role` se cree del token, sin releer el usuario.** Un admin degradado a customer, o una
  cuenta borrada, conservan el acceso hasta que caduca el access (15 min, o 7 días si el
  cliente lo renueva). El arreglo es `findUserById` en `requireAdmin` —como ya hace
  `/auth/refresh`— y no se hizo aquí porque convierte un middleware síncrono en uno que toca
  la base en cada escritura.
- **Sin respuestas a `WWW-Authenticate`.** El 401 es correcto por código y mensaje, pero la
  RFC 6750 pide esa cabecera en el desafío; se puede añadir sin tocar el contrato.
- **`requireAuth` no se usa todavía en ninguna ruta** (solo como mitad de `requireAdmin`):
  existe para las rutas que necesiten sesión sin ser de admin, que todavía no hay.
- `alg: none`, `sub` no numérico, payload de tipo string, esquema `Basic`, `Bearer` sin token
  y cabeceras repetidas dan 401: comprobado, no hay que volver a mirarlo.

---

### 2026-10-04 — T-045 Store de sesión con Zustand
**Estado:** completada

**Qué se hizo:**
- `client/src/store/auth.ts`: store de Zustand con `user`, `accessToken`, `refreshToken`,
  `setSession`, `clearSession` y el derivado `useIsAuthenticated()`, persistido en
  `localStorage` con el middleware `persist`.
- `client/src/api/auth.types.ts`: los tipos de la forma de cable de `/api/auth/*`.
- Se instaló `zustand@5.0.15`, la dependencia que nombra el enunciado de la tarea.

**Por qué se hizo así:**
- **T-045 se hizo antes que T-044, por decisión del dueño.** T-044 tenía que "guardar los
  tokens en el store de Zustand (T-045)" y el store no existía; hacerlo a medias dentro de
  T-044 habría mezclado dos tareas.
- **`isAuthenticated` es un selector, no un booleano en el estado.** "Derivado" en Zustand
  significa calcularlo donde se usa. Guardarlo obligaría a mantenerlo sincronizado a mano en
  cada `set` y se quedaría viejo en cuanto hubiera una tercera forma de cambiar el estado.
- **`clearSession` también borra el `localStorage`.** Es lo que hace falta para cerrar sesión
  de verdad: limpiando solo el estado, la sesión vuelve al recargar.
- **`partialize` persiste solo los tres campos de dato**, no el estado entero.
- **Los tokens viven en el estado** porque el backend no tiene sesiones ni cookies, y T-046
  los leerá con `useAuthStore.getState()` desde fuera de React.
- **`ApiAuthUser` está en `api/auth.types.ts`:** es la forma del cable, no el estado. Los
  schemas de **respuesta** se quedan en el servidor, donde se validan con `parse` sobre lo que
  se serializa; los de **entrada** son los que T-044 lleva a `shared/schemas.ts`, porque esas
  reglas tienen que coincidir en los dos lados.

**Impacto en otras tareas:**
- T-044 ya tiene dónde guardar la sesión; T-046 tiene lo que necesita para renovar el access
  sin React.
- **SPEC §7.2 sigue pendiente** en su paso 2 y no es de esta tarea: no existe endpoint para
  actualizar `preferred_lang`, así que la elección de idioma sigue solo en el navegador.

**Pendientes / deuda técnica:**
- **Los tokens en `localStorage` son legibles desde cualquier XSS.** Es la arquitectura
  decidida (SPEC §4 y el enunciado de T-045), pero conviene saber que es el punto débil de la
  sesión; una cookie `httpOnly` lo evitaría y sería un cambio de backend.
- **No hay forma de invalidar el refresh token desde el cliente** (misma deuda de T-041/T-042):
  `clearSession` limpia el navegador, no el token.

---

### 2026-10-05 — T-047 Alojamiento de imágenes en la VPS + subida
**Estado:** completada

**Qué se hizo:**
- Las imágenes de platos se alojan **en la propia VPS** (decisión del dueño, que cerró la
  pregunta que TASKLIST tenía abierta). Los ficheros se escriben en `UPLOADS_DIR`, fuera del
  repositorio en producción, y se sirven en `/uploads`.
- `POST /api/dishes/:id/image` (solo admin): `multipart/form-data`, un fichero en el campo
  `image`, escritura en disco con nombre UUID y actualización de `dishes.image_url`.
- La columna guarda la **ruta relativa** (`/uploads/dishes/<uuid>.jpg`) y la respuesta compone
  la **URL absoluta** con `PUBLIC_ORIGIN`.
- `PUBLIC_ORIGIN` y `UPLOADS_DIR` añadidas a `config/env.ts` (con Zod) y a `.env.example`.
- `express.static` monta `/uploads` **solo como comodidad de desarrollo**: en producción los
  sirve Nginx con un `alias`.
- Se instaló `multer@2.4.0` y `@types/multer@2.0.0`.

**Por qué se hizo así:**
- **Relativa en la BD y absoluta en la respuesta, en vez de absoluta en la BD.** El dominio es
  una variable de despliegue. Guardando la URL absoluta en la fila, cambiar de dominio
  obligaría a reescribir todos los registros; con `PUBLIC_ORIGIN` es cambiar una variable. Es
  justo lo que pidió el dueño al elegir esta opción, y se comprobó levantando el servidor
  compilado con `PUBLIC_ORIGIN=https://osito-dist.example.com`: la respuesta cambió y la fila
  no.
- **`UPLOADS_DIR` no tiene valor por defecto.** Un default sería algo dentro del repo, y en la
  VPS las imágenes tienen que vivir fuera del árbol para que un despliegue no las borre.
- **Nombres UUID, nunca el nombre que envía el cliente.** `multer` no valida el `mimetype`
  contra el contenido: usar el nombre original abriría la puerta a `../`, a choques y a
  extensiones ejecutables.
- **Límite de 5 MB y cuatro formatos (jpeg, png, webp, avif), lista explícita.** Sin
  `limits.fileSize`, multer acepta lo que le manden y el único límite queda en Nginx, que
  responde más tarde.
- **En producción los ficheros no pasan por Node.** Nginx los sirve con un `alias`; el
  `express.static` del código es para desarrollo, donde no hay Nginx delante.

**Cómo se hizo:**
- Creado `server/src/modules/dishes/dishes.uploads.ts`: configuración de multer, filtro de
  tipo, `toAbsoluteImageUrl`, `toStoredImageUrl` y traducción de errores de multer.
- Modificados `dishes.schema.ts` (nuevo `imageUrlSchema`), `dishes.service.ts` (URL absoluta
  en `toResponse`, nuevo `setDishImage`), `dishes.routes.ts` (la ruta nueva),
  `app.ts` (el `express.static`), `config/env.ts`, `.env.example` y `.gitignore` (`uploads/`).

**Impacto en otras tareas:**
- **T-095 (Nginx) necesita un `location` más**, aparte del proxy de `/api`:
  `location /uploads/ { alias /var/www/osito/uploads/; }`. Sin él, en producción las imágenes
  dan 404 aunque el backend esté bien.
- **T-096 (backup) solo copia `osito.db` y se queda corto**: las imágenes quedan fuera del
  backup. Hay que añadir `UPLOADS_DIR` al script o las fotos no se respaldan.
- **La validación de `imageUrl` de T-020 cambió.** De `z.string().url()` (solo absoluta) a un
  esquema que acepta las dos formas. Los tests que verificaban "imageUrl no URL → 400" hay que
  revisarlos; ahora `/etc/passwd` y `/uploads/secreto.jpg` siguen dando 400, pero
  `/uploads/dishes/x.jpg` ya no.
- **T-053 y T-055 (carrito y detalle de pedido) copian la `imageUrl` del plato.** Les sirve
  tal cual, así que reciben la URL absoluta y no necesitan cambios.

**Pendientes / deuda técnica:**
- **No hay limpieza de ficheros huérfanos.** Si un chef sube una imagen y luego el `UPDATE`
  falla, el fichero queda en disco sin referencia. Igual con el purgado de un plato: la fila
  desaparece pero su imagen se queda.
- **No hay miniaturas ni recompresión.** Una foto de móvil de 4 MB se guarda tal cual. Cuando
  el número de platos crezca, `sharp` para generar una versión pequeña es el siguiente paso.
- **No hay formulario de subida en el panel del chef.** El endpoint existe pero hay que
  llamarlo por `curl` o Postman hasta que haya UI (el panel del chef es T-080 a T-083, que hoy
  son solo de pedidos).
- **El `fileFilter` no puede distinguir "no hay fichero" de "tipo no permitido"**: en los dos
  casos multer termina sin error y sin `req.file`. Se resolvió con un mensaje y un `code` que
  cubren ambos, no con dos respuestas distintas.

**Gotchas descubiertos en esta tarea:**
- **Lanzar un error dentro del callback de multer tumba el proceso entero.** El `callback` que
  multer invoca corre de forma asíncrona, cuando `diskStorage` ha terminado de escribir y
  decide abortar, y **fuera** del `try/catch` que Express pone alrededor de la llamada al
  middleware. Un `throw` ahí es una excepción sin manejar: el servidor moría y el cliente veía
  un `ECONNRESET` en vez del 400. Por eso `toUploadError` **devuelve** el error y la ruta lo
  pasa a `next(error)`, que sí llega al `errorHandler`. Los `throw` de los handlers normales
  (el 404, el 400) no tienen ese problema porque corren dentro del `try/catch` de Express.
- **`multer@2.0.2` tiene 8 avisos de DoS de severidad alta** (limitación de tamaño de fichero
  evitable, agotamiento de recursos, nombres de campo anidados). Instalada por error la
  primera vez; `npm audit` lo detectó y se subió a `2.4.0`, que los resuelve. Quedan 4 avisos
  `moderate` de `esbuild`, que vienen de `drizzle-kit` y son previos a esta tarea.
- **`req.resume()` antes de responder es necesario cuando multer aborta.** Al cortar el stream
  quedan bytes sin leer en el socket y, sin vaciarlos, Node cierra la conexión en vez de enviar
  la respuesta.
- **`UPLOADS_DIR` es una ruta relativa al `cwd`, no al `.env`.** Con `UPLOADS_DIR=./uploads` en
  desarrollo, la carpeta sale donde se ejecutó el proceso: al arrancar desde `server/` es
  `server/uploads`, y desde la raíz es `<raíz>/uploads`. Comprobado.

---

### 2026-10-05 — T-046 Wrapper de `fetch` con `Authorization`, idioma y renovación
**Estado:** completada

**Qué se hizo:**
- `client/src/api/client.ts`: `apiRequest`, el `fetch` único del cliente. Añade
  `Authorization: Bearer <accessToken>` cuando hay sesión, `Accept-Language` con el idioma de
  `i18n`, y renueva el access cuando la API responde 401 `UNAUTHORIZED`, reintentando **una
  sola vez**. Si la renovación falla, limpia la sesión y lleva a `/login`.
- `api/dishes.ts` y `api/auth.ts` pasan por `apiRequest`. `api/http.ts` queda como la capa que
  sabe leer el cuerpo y traducir un fallo a `ApiError` con su `code`.

**Por qué se hizo así:**
- **Un wrapper explícito en vez de parchear `window.fetch`.** Parchear el global es invisible:
  nadie lee el fichero y ve que las peticiones llevan token, y un `fetch` llamado desde un
  módulo que no debería (o desde las herramientas de desarrollo del navegador) también lo
  llevaría. Con un wrapper, la ruta de una petición se lee en el sitio que la escribe.
- **Envuelve a `requestJson` y no lo sustituye.** Lo que sabe de sesión y lo que sabe leer el
  cuerpo y sacar el `code` son dos cosas distintas; en un solo fichero, todo lo que no tiene que
  ver con tokens arrastraría la lógica de renovarlos.
- **El 401 se decide por `code === 'UNAUTHORIZED'`, no por el status**, y no es un detalle: hay
  **tres** 401 distintos en la API y con el mismo status. `UNAUTHORIZED` es el access que no
  valió, `INVALID_CREDENTIALS` es un login fallido y `INVALID_REFRESH_TOKEN` es un refresh
  caducado o manipulado. Si se comprobara el status, **una contraseña incorrecta dispararía la
  renovación**, que no encontraría sesión que renovar, cerraría la del usuario y lo devolvería al
  login: un bucle de recarga por teclear mal la contraseña. Es la razón de que T-042 unifique a
  propósito los fallos del refresh (quien llega tarde lo leerá como que el status bastaba).
- **Solo se renueva si la petición llevaba `Authorization`.** Un 401 sin token no es una sesión
  caducada: es que la petición no iba autenticada, como el login.
- **El reintento es exactamente uno.** Si la petición renovada volviera a dar 401, el error se
  propaga sin renovar otra vez. Sin ese límite, un backend con la hora desfasada entraría en
  bucle de renovaciones.
- **La renovación se pide con `requestJson`, por debajo del wrapper**, para que un 401 del
  refresh no pueda disparar otro refresh.
- **Las renovaciones simultáneas se comparten con una promesa a nivel de módulo.** Tres queries
  que salen a la vez y fallan con 401 harían tres renovaciones; como el refresh token **no se
  renueva** (decisión de T-041/T-042), las tres valdrían y las tres escribirían un access
  distinto en el store. La que llegue última gana, y las peticiones reintentadas con tokens
  distintos pueden acabar usando uno que ya no es el del store.
- **`window.location` y no `useNavigate`** para el redirect: el wrapper no es un componente de
  React y el store vive fuera del árbol. La recarga tiene un efecto secundario que conviene:
  vacía la caché de TanStack Query, así que no quedan datos de la sesión anterior en memoria. No
  se redirige si ya se está en `/login`, para no recargar el login en bucle.
- **El reintento propaga el error original, no el de la renovación.** Quien llama ya está
  esperando el fallo de su petición; el `ApiError` del refresh se leería como un error ajeno.
  Antes sí se limpia la sesión y se redirige, que es lo que la deja coherente.
- **`Accept-Language` lo pone el wrapper leyendo `i18n`, pero `dishes.ts` lo sigue pasando como
  parámetro.** El idioma va también en la `queryKey` de TanStack Query (T-031), y si el wrapper
  lo leyera solo de `i18n` la clave y la cabecera podrían tomar decisiones distintas y la caché
  devolvería la traducción de otro idioma. Lo que gana es la cabecera del llamador, así que las
  dos se pueden fijar en los tests.
- **El store se relee después del `await` de la renovación** y se compara el refresh token con el
  usado: si mientras tanto el usuario cerró sesión, guardar el access nuevo resucitaría una
  sesión ya terminada. Entre el `await` y el `setSession` cabe un clic en "salir".

**Cómo se hizo:**
- Creado `client/src/api/client.ts`. Modificados `api/dishes.ts` y `api/auth.ts` (importan el
  wrapper) y `api/http.ts` (solo un comentario que decía que esto estaba pendiente).
- Sin dependencias nuevas. Se usa `useAuthStore.getState()` desde fuera de React, que es
  exactamente para lo que T-045 lo dejó preparado.

**Verificación:**
- `typecheck`, `lint`, `prettier` y `build` limpios.
- **El criterio se comprobó contra el servidor de verdad, con un access caducado de verdad**:
  firmado con el `JWT_SECRET` del proyecto y `expiresIn: '-1m'`, no simulando el 401. La misma
  petición da 401 sin el wrapper y 400 `IMAGE_REQUIRED` con él (el 401 se renueva y el reintento
  llega al final), con una sola llamada a `/api/auth/refresh`. El token que queda en el store es
  distinto del caducado, tiene `type: 'access'` y el mismo `sub`/`role`, y el servidor lo acepta.
- **Tres peticiones protegidas simultáneas hacen UNA sola renovación.** Tres lecturas públicas
  hacen cero, que es lo correcto: no hay 401 que renovar.
- Con refresh token inválido: propaga `401 UNAUTHORIZED`, deja store y `localStorage` con los
  tres campos a `null`, y redirige a `/login`.
- Con login y contraseña incorrecta: `401 INVALID_CREDENTIALS`, **no** redirige y **no** borra la
  sesión. Es el caso que motivó decidir por `code`.
- `Accept-Language` sigue a `i18n`: con `ru`, `en` y `es` salen `ru`, `en` y `es`.
- Se usó `POST /api/dishes/:id/image` sin fichero como ruta protegida de prueba: pasa
  `requireAdmin` y muere en el 400 de multer **sin escribir nada**. La BD quedó sin cambios y
  `integrity_check` en `ok`.

**Impacto en otras tareas:**
- **`api/orders.ts` y los módulos de `api/` que vengan (T-051 a T-055) tienen que usar
  `apiRequest`, no `requestJson`**, o se quedan sin token y sin renovación. Es el contrato que
  fija esta tarea, y la razón de que el módulo se llamara `client.ts` y no `interceptor.ts`.
- **T-093 (vitest) tiene aquí su primer caso bueno:** un 401 con el access caducado se renueva y
  la petición sale bien sin que el llamador haga nada. Es justo lo que `renderToStaticMarkup`
  no puede cubrir (gotcha de T-031), porque necesita dos peticiones encadenadas.
- El 403 `FORBIDDEN` (rol insuficiente) **no** dispara renovación, y no debería: el token es
  válido, lo que falta es permiso.

**Pendientes / deuda técnica:**
- **Cerrar sesión sigue sin sitio en la interfaz.** El wrapper limpia la sesión cuando no puede
  renovar, pero el botón de "salir" del navbar (`nav.logout` existe desde T-030) no está. Sigue
  sin tarea que lo haga: es cosa de T-092 o de la página que lo use.
- **La renovación no se cancela.** Si tarda y el usuario navega o recarga, la respuesta llega
  igual: el `signal` de TanStack Query no se propaga a la petición de refresh. Afecta sobre todo
  a una recarga de página en mitad de una renovación.
- **Una renovación fallida por red (sin respuesta) cierra la sesión**, porque el wrapper no
  distingue "el refresh caducó" de "no hubo red". Con el backend caído, un usuario con sesión
  válida pierde la sesión. Es un fallo a favor de la seguridad, pero no del usuario.

**Gotchas descubiertos en esta tarea:**
- **Un 401 se decide por `code`, nunca por `status`.** Ya está en la decisión de T-042 y en
  varios sitios de este archivo, pero T-046 es donde se paga de verdad: hay tres 401 con el mismo
  status y solo uno es renovable.
- **Node no resuelve rutas relativas en `fetch`**, como el navegador. Al verificar el wrapper
  fuera de un navegador hay que anteponer el origen, o todo falla con `Invalid URL`. No es un
  problema del código de producción (que solo corre en el navegador), pero sí de cualquier
  prueba que lo ejecute en Node.

---

### 2026-10-05 — T-050 Store de carrito con Zustand + persist
**Estado:** completada

**Qué se hizo:**
- `client/src/store/cart.ts`: `items` persistido en `localStorage` bajo la clave `osito-cart`, con
  `addItem`, `removeItem`, `updateQuantity`, `clearCart` y los selectores `selectTotalItems` y
  `selectTotalPrice`.
- Los botones de "añadir al carrito" de `DishCard` y `DishDetail`, que T-032 dejó sin `onClick` a
  propósito, ya escriben en el store.

**Por qué se hizo así:**
- **El item guarda `name`, `price` e `imageUrl`, y no solo el `dishId`** (lo que pedía el
  enunciado). Con solo el `dishId`, T-053 tendría que pedir cada plato para poder pintar "Sopa x2" y
  su precio: N peticiones para N líneas.
- **`updateQuantity(dishId, 0)` quita la línea en vez de guardarla con 0.** T-051 pide
  `quantity: number min 1`, así que la cantidad mínima se hace **representable en el tipo**, no
  un filtro que cada consumidor tenga que acordarse de poner. Los controles de cantidad de T-053
  generan exactamente esta llamada cuando el usuario baja de 1, que es cuando la línea desaparece
  de la lista.
- **`removeItem` y `updateQuantity` se quedan los dos** aunque acaben en el mismo sitio: los usan
  dos sitios distintos (el "quitar" de la página del carrito y el "bajar a cero" de los
  controles).
- **`totalItems` y `totalPrice` son selectores, no campos del estado**, por el mismo motivo que
  `useIsAuthenticated` en T-045: guardados habría que sincronizarlos a mano en cada `set`, y se
  quedarían viejos al rehidratar desde un `localStorage` de una versión anterior. **Devuelven
  primitivos a propósito:** un selector que devolviera un array daría una referencia nueva en cada
  render y el componente se re-renderizaría en bucle.
- **`totalPrice` redondea a céntimos.** El precio viene de SQLite por `real`, así que es coma
  flotante: sin redondear, 3 x 11,90 daría 35.700000000000003 en pantalla.
- **`price` guardado es solo para pintar.** El precio que se cobra lo recalcula T-051 con los
  precios actuales y el pedido solo manda `{ dishId, quantity }`; si el chef cambia un precio
  entre que el usuario añade y confirma, se cobra el nuevo.
- **Al reañadir un plato se refrescan `name`, `price` e `imageUrl`.** Reanadir es decir "quiero
  este, ahora, como lo veo": si el nombre o el precio cambiaron, la línea se queda con lo viejo y
  el carrito enseña algo que ya no existe.
- **El botón enseña la cantidad del plato y cambia a `outline` si ya está en el carrito.** La
  página `/cart` (T-053) no existe todavía, así que **el número al lado del botón es la única señal
  de que el clic hizo algo**: un botón que reacciona sin cambiar nada en la pantalla deja al
  usuario sin saber si falló.
- **`aria-label` en el botón**, porque un número dentro de un `<button>` no se anuncia con
  contexto: sin eso un usuario de lector oye "Añadir al carrito" y no oye que ya hay tres.
- **Los hooks de `DishDetail` van arriba del todo**, no junto al botón: la página tiene tres
  salidas tempranas, y un hook debajo de un `return` no se ejecuta en el primer render y sí en
  los siguientes.

**Cómo se hizo:**
- Creado `client/src/store/cart.ts` con `create` + `persist`, `partialize` a solo `items` y
  `initialItems()` como función (mismo criterio que el store de sesión).
- Modificados `DishCard.tsx` y `DishDetail.tsx`: el selector de cantidad y el `onClick`.
- Sin dependencias nuevas y sin claves i18n nuevas: `cart.add` ya existía desde T-030.

**Verificación:**
- `typecheck`, `lint`, `prettier` y `build` limpios.
- **El criterio (mantener el carrito tras recargar) comprobado por rehidratación real**: se
  escribió en `localStorage`, se vació el store en memoria, y un **módulo nuevo del store**
  reconstruyó el mismo carrito **sin llamar a `rehydrate()` a mano**, que es lo que pasa al cargar
  la página. Coincidencia exacta con lo que había, nombres en cirílico incluidos.
- `addItem` del mismo plato suma cantidad: añadir 1, 2 y 1 deja 2 líneas y `totalItems` 3 (unidades,
  no líneas). `updateQuantity(1, 0)` quita la línea; sobre un `dishId` inexistente no inventa nada.
  `clearCart` deja los totales en 0, no `NaN`.
- Se persiste solo `items`. El selector de las tarjetas se comprobó contra estado real.

**Impacto en otras tareas:**
- **T-051 ya tiene el contrato:** solo se manda `{ dishId, quantity }`, y `quantity >= 1` está
  garantizado por el tipo del store, no por un filtro en la página.
- **T-053 (página `/cart`) tiene todo**: `items`, `removeItem`, `updateQuantity`, `clearCart` y los
  dos selectores. El `nav.cart` del navbar, hoy **deshabilitado**, es lo que esa tarea habilita.
- **`clearCart` va después de confirmar el pedido, no antes**: si el `POST /api/orders` falla, el
  carrito tiene que seguir lleno para poder reintentar sin rehacer el pedido a mano.

**Pendientes / deuda técnica:**
- **El carrito no se vacía al cerrar sesión.** Con `persist` y una clave distinta de `osito-auth`,
  compartir navegador entre dos cuentas dejaría el carrito de una a la vista de la otra. No es
  grave (el pedido es del usuario que confirma, y T-051 valida disponibilidad y precios), pero es
  una decisión implícita que T-053 debería tener en cuenta si decide vaciarlo.
- **Los nombres del carrito son los del idioma en que se añadió el plato.** Documentado en el
  store: es lo que hay que contestar si alguien se queja de que "el carrito sale en español"
  después de cambiar a ruso.

**Gotchas descubiertos en esta tarea:**
- **`renderToStaticMarkup` no puede comprobar nada que dependa de un store de Zustand con estado
  rehidratado**, no solo del booleano de la sesión: React usa `getInitialState()` como snapshot de
  servidor, así que un selector que lee `items` devuelve el estado inicial (carrito vacío) aunque
  el store tenga líneas. **Un botón que pinta la cantidad sale idéntico con 0 y con 3 unidades**,
  y parece un bug de `addItem` cuando el bug es del método de verificación. Es el gotcha de T-045
  aplicado al carrito, y la forma de salir es comprobar el selector contra `getState()`.

---

## Convenciones de este archivo

- Una entrada por tarea completada, bloqueada o parcialmente completada.
- Si una tarea se retoma después de estar bloqueada, se agrega una entrada nueva 
  referenciando la anterior (no se edita la vieja).
- Las decisiones arquitectónicas se promueven a la sección superior cuando 
  afectan a más de un módulo.
- Los "gotchas" se agregan en cuanto se descubren, sin esperar a terminar la tarea.