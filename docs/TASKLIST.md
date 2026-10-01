# TASKLIST.md — Osito a la carta

> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completada · `[!]` bloqueada
> Última actualización: [fecha]

---

## Fase 0 — Setup del proyecto

- [x] **T-001**: Crear estructura de carpetas `server/`, `client/`, `shared/`, `docs/`
  - Criterio: existen las carpetas y cada una con su `package.json` (donde aplique).
- [x] **T-002**: Inicializar `server/` con TypeScript estricto
  - Criterio: `tsc --noEmit` pasa sin errores.
- [x] **T-003**: Inicializar `client/` con Vite + React + TypeScript
  - Criterio: `npm run dev` en client levanta la app en `:5173`.
- [x] **T-004**: Configurar proxy de Vite `/api` → `http://localhost:3000`
  - Criterio: una llamada a `/api/health` devuelve `{ status: 'ok' }`.
- [x] **T-005**: Configurar Tailwind en `client/`
  - Criterio: una clase de Tailwind se aplica visualmente en `App.tsx`.
- [x] **T-006**: Configurar ESLint + Prettier en `server/` y `client/`
  - Criterio: `npm run lint` pasa sin errores en ambos.
- [x] **T-007**: Configurar `pino` como logger en `server/`
  - Criterio: el logger imprime JSON estructurado al arrancar.
- [x] **T-008**: Configurar validación de variables de entorno con Zod
  - Criterio: si falta una variable requerida, el server no arranca y explica cuál.
- [x] **T-009**: Crear endpoint `GET /api/health`
  - Criterio: responde `{ status: 'ok', timestamp }`.

---

## Fase 1 — Base de datos

- [x] **T-010**: Definir schema Drizzle en `server/src/db/schema.ts`
  - Entidades: `User`, `Dish`, `Order`, `OrderItem`, `PageView`, `NotificationLog`.
  - Criterio: `drizzle-kit generate` produce una migración válida.
- [x] **T-011**: Aplicar migración inicial
  - Criterio: archivo `osito.db` creado con todas las tablas.
- [x] **T-012**: Script de seed con 5 platos de ejemplo en 3 idiomas
  - Criterio: `SELECT` devuelve 5 filas con datos en es / ru / en.
- [x] **T-013**: Script de seed con 1 usuario admin
  - Criterio: existe un usuario `admin@osito.local` con contraseña hasheada.
- [x] **A-001** (añadida 2026-10-01): Categorías de platos
  - Petición del dueño: organizar el menú por categoría (sopas, ensaladas, caldos...).
  - Criterio: `categories` con nombre en es/ru/en y `dishes.category_id`; `SELECT`
    devuelve los 5 platos agrupados por categoría.

---

## Fase 2 — API de platos

- [x] **T-020**: `GET /api/dishes` con localización por `Accept-Language`
  - Criterio: con `Accept-Language: ru` devuelve nombres en ruso.
- [x] **T-021**: `GET /api/dishes/:id`
  - Criterio: devuelve 404 si no existe.
- [x] **T-022**: `POST /api/dishes` (solo admin)
  - Criterio: rechaza con 401 sin token, con 403 si no es admin. **Nota: la parte de
    autorización queda pendiente de T-043; ver "Impacto" abajo.**
- [ ] **T-023**: `PUT /api/dishes/:id` (solo admin)
- [ ] **T-024**: `DELETE /api/dishes/:id` (solo admin) — borrado lógico (`isAvailable = 0`)
- [ ] **T-025**: `GET /api/categories` (público)
  - Criterio: devuelve las categorías en es/ru/en según `Accept-Language`, ordenadas por
    `sortOrder`, con `slug` e `id`.
- [ ] **T-026**: `POST /api/categories` (solo admin)
  - Criterio: rechaza con 401 sin token, con 403 si no es admin; 409 si el `slug` ya existe.
  - Nota: **debe implementarse antes que T-022**, porque `POST /api/dishes` exige
    `categoryId`.
- [ ] **T-027**: `PUT /api/categories/:id` (solo admin)
  - Criterio: permite renombrar los tres idiomas y cambiar `sortOrder`.
- [ ] **T-028**: `DELETE /api/categories/:id` (solo admin)
  - Criterio: rechaza con 409 si la categoría tiene platos asociados. Se descarta el
    borrado en cascada para no perder dishes por un error de un clic; quien quiera
    vaciarla antes, borra o reasigna los platos.
- [ ] **T-029**: Índice en `dishes.category_id`
  - Criterio: migración aplicada y `EXPLAIN QUERY PLAN` usa el índice al filtrar por
    categoría. Pendiente de A-001: agrupar y filtrar el menú por categoría ya es un caso
    de uso real y la columna no está indexada.

---

## Fase 3 — Frontend: menú y multi-idioma

- [ ] **T-030**: Configurar `react-i18next` con `es.json`, `ru.json`, `en.json`
  - Criterio: cambiar idioma cambia textos sin recargar.
- [ ] **T-031**: Página `/menu` que consume `GET /api/dishes`
  - Criterio: muestra todos los platos disponibles.
- [ ] **T-032**: Componente `DishCard` (imagen, nombre, descripción, ingredientes, precio)
  - Criterio: se ve correctamente en móvil y desktop.
- [ ] **T-033**: Selector de idioma en navbar, persistido en `localStorage`
  - Criterio: al recargar, mantiene el idioma elegido.
- [ ] **T-034**: Página `/menu/:id` con detalle del plato
  - Criterio: muestra todos los datos del plato y botón "agregar al carrito".
- [ ] **T-035**: Estilos base con Tailwind + shadcn/ui (botones, cards, navbar)
  - Criterio: UI coherente y responsive.

---

## Fase 4 — Autenticación

- [ ] **T-040**: `POST /api/auth/register` con validación Zod
  - Criterio: rechaza email duplicado con error claro.
- [ ] **T-041**: `POST /api/auth/login` (devuelve access + refresh token)
  - Criterio: access token expira en 15 min, refresh en 7 días.
- [ ] **T-042**: `POST /api/auth/refresh`
  - Criterio: renueva access token con refresh válido.
- [ ] **T-043**: Middleware `requireAuth` y `requireAdmin`
  - Criterio: rutas protegidas devuelven 401 sin token.
- [ ] **T-044**: Páginas `/login` y `/register` en frontend
  - Criterio: el formulario usa React Hook Form + Zod.
- [ ] **T-045**: Store de sesión con Zustand + persistencia en `localStorage`
  - Criterio: al recargar, la sesión se mantiene si el token es válido.
- [ ] **T-046**: Interceptor de fetch que añade `Authorization` y maneja 401
  - Criterio: si el access expira, hace refresh automático.

---

## Fase 5 — Carrito y pedidos

- [ ] **T-050**: Store de carrito con Zustand persistido en `localStorage`
  - Criterio: agregar, quitar y modificar cantidades funciona tras recargar.
- [ ] **T-051**: `POST /api/orders` con validación Zod y transacción
  - Criterio: crea `Order` + `OrderItem` atómicamente.
- [ ] **T-052**: `GET /api/orders` (historial del usuario autenticado)
  - Criterio: solo devuelve pedidos del propio usuario.
- [ ] **T-053**: Página `/cart` con resumen y botón "confirmar pedido"
  - Criterio: redirige a `/orders/:id` tras confirmar.
- [ ] **T-054**: Página `/orders` con historial de pedidos
  - Criterio: muestra estado, fecha y total de cada pedido.
- [ ] **T-055**: Página `/orders/:id` con detalle del pedido
  - Criterio: muestra platos, cantidades y total.

---

## Fase 6 — Notificaciones al chef

- [ ] **T-060**: Módulo `notifications` con servicio de correo (Mailgun)
  - Criterio: enviar correo de prueba desde un script.
- [ ] **T-061**: Módulo `notifications` con servicio de Telegram
  - Criterio: enviar mensaje de prueba desde un script.
- [ ] **T-062**: Plantilla HTML del pedido para el correo
  - Criterio: incluye platos, cantidades, total y nota del cliente.
- [ ] **T-063**: Disparar ambas notificaciones en paralelo al crear pedido
  - Criterio: un fallo en un canal no bloquea el otro.
- [ ] **T-064**: Registrar resultado en `NotificationLog`
  - Criterio: cada envío (éxito o fallo) queda registrado.
- [ ] **T-065**: Reintento automático una vez si falla el envío
  - Criterio: si el primer intento falla, se reintenta y se registra el resultado final.

---

## Fase 7 — Estadísticas del usuario

- [ ] **T-070**: `POST /api/stats/pageview` al visitar detalle de plato
  - Criterio: registra `userId` (si hay sesión) y `dishId`.
- [ ] **T-071**: `GET /api/stats/me` con agregados del usuario
  - Criterio: devuelve platos más vistos, más pedidos y total gastado.
- [ ] **T-072**: Página `/stats` con gráficos (Recharts)
  - Criterio: muestra al menos 2 gráficos y un resumen numérico.

---

## Fase 8 — Panel del chef

- [ ] **T-080**: `GET /api/admin/orders` (todos los pedidos, solo admin)
  - Criterio: rechaza con 403 si no es admin.
- [ ] **T-081**: Página `/admin/orders` con actualización automática
  - Criterio: los pedidos nuevos aparecen sin recargar (polling cada 10s).
- [ ] **T-082**: `PATCH /api/admin/orders/:id/status` para cambiar estado
  - Criterio: solo permite transiciones válidas (`pending → preparing → sent → delivered`).
- [ ] **T-083**: Vista de detalle de pedido para el chef
  - Criterio: muestra datos del cliente, platos y nota.

---

## Fase 9 — Pulido y despliegue

- [ ] **T-090**: PWA con `vite-plugin-pwa`
  - Criterio: la app es instalable en móvil.
- [ ] **T-091**: Responsive completo en móvil, tablet y desktop
  - Criterio: todas las páginas son usables desde 360px de ancho.
- [ ] **T-092**: Manejo global de errores en frontend (ErrorBoundary + toasts)
  - Criterio: un error de red muestra un mensaje claro, no pantalla blanca.
- [ ] **T-093**: Tests básicos de flujos críticos (registro, pedido, notificación)
  - Criterio: `npm run test` pasa.
- [ ] **T-094**: Configurar PM2 en el VPS
  - Criterio: `pm2 status` muestra la app corriendo y con arranque automático.
- [ ] **T-095**: Configurar Nginx como proxy inverso + Let's Encrypt
  - Criterio: la app responde por HTTPS en el dominio configurado.
- [ ] **T-096**: Script de backup diario de `osito.db`
  - Criterio: cron ejecuta `cp osito.db backups/osito-$(date).db` cada día.

---

## Decisiones pendientes

- ¿Polling o SSE para el panel del chef? → **T-081** (decisión al llegar a la tarea).
- ¿Cuántos reintentos de notificación y con qué backoff? → **T-065**.
- ¿Dónde alojar las imágenes de los platos? (VPS local vs. servicio externo) → decidir antes de **T-022**.
- ¿Rate limiting en endpoints públicos? → evaluar en **T-092**.
- ~~¿Cómo crear categorías al dar de alta un plato?~~ → **Resuelto 2026-10-01**: el
  dueño decidió un CRUD completo (`T-026`/`T-027`/`T-028`) en vez de un id fijo. Ver
  "Decisiones resueltas" más abajo.

### 2026-10-01 — T-013 (setup)
- Archivos creados: `server/src/db/seed/admin.ts`.
  Modificados: `server/package.json` (script `db:seed:admin`, dependencia `bcryptjs`,
  dependencia de desarrollo `@types/bcryptjs`), `package-lock.json`.
- Dependencias instaladas **con autorización explícita del dueño**, que es lo que pedía
  la tarea: `bcryptjs@^3.0.3` (runtime) y `@types/bcryptjs@^2.4.6` (solo desarrollo).
  Se eligió `bcryptjs` y no `bcrypt` porque es JavaScript puro: no necesita compilación
  nativa ni herramientas de build en el VPS, que importa para el despliegue con PM2.
- Criterio verificado con un `SELECT` directo a la base, no solo con el log del script:
  1 fila en `users`, `email = admin@osito.local`, `role = 'admin'`,
  `preferred_lang = 'es'`, 1 usuario con `role='admin'`.
- La contraseña queda hasheada de verdad, comprobado sobre el valor almacenado:
  hash de 60 caracteres con prefijo `$2b$`, **10 rounds** (`bcrypt.getRounds`),
  `bcrypt.compare` con la contraseña correcta devuelve `true` y con una incorrecta
  `false`, y el hash no contiene la contraseña en claro.
- **Decisión técnica: el seed hace `upsert`, no `insert` a secas.** Si el admin ya
  existe, actualiza `passwordHash`, `role` y `preferredLang` en vez de fallar con el
  `UNIQUE constraint failed: users.email`. Verificado ejecutándolo **tres veces
  seguidas**: `users` sigue teniendo 1 fila y el login continúa funcionando. Sin esto,
  el seed solo servía la primera vez y cualquier reejecución en desarrollo rompía.
- Decisión tomada: `db:seed:admin` es un **script aparte** que coexiste con
  `db:seed` (que sigue siendo solo el de platos). Esto cierra la ambigüedad que
  MEMORY dejó abierta en T-012. Consecuencia asumida: preparar un entorno nuevo
  requiere correr `db:migrate`, `db:seed` y `db:seed:admin`; no hay un seed único
  que lo haga todo.
- Decisión tomada: el hash se genera **dentro** de la transacción y el script loguea
  `passwordMatches: true` y `hashPrefix`, nunca el hash ni la contraseña. El `throw` si
  el usuario no aparece tras insertar evita que un seed "termine bien" sin haber escrito
  nada.
- Gotcha registrado: **`bcryptjs` v3 expone una API distinta a la v2** (`hashSync`,
  `compareSync`, `getRounds`, `truncates`, `setRandomFallback`). No trae
  `import bcrypt from 'bcryptjs'` con los mismos helpers de siempre, así que conviene
  mirar los exports antes de escribir código. Ver detalle en `docs/MEMORY.md`.
- Verificación adicional: el script corre correctamente **desde `dist/`** tras
  `npm run build` (`node dist/db/seed/admin.js`), igual que el seed de platos.
- `npm run typecheck`, `npm run lint` y el formato pasan. Sin `console.log` ni `TODO`.
- **Aviso de seguridad:** la contraseña `OsitoAdmin123!` está **en claro dentro de
  `server/src/db/seed/admin.ts`**, que sí se versiona. Es inherente al criterio de la
  tarea, pero conviene tenerlo presente: quien clone el repo conoce la contraseña del
  admin. Para producción habría que leerla de una variable de entorno y generar el
  hash en el primer arranque, no dejarla en el código. **No se ha cambiado** porque
  la tarea pedía explícitamente esa contraseña; queda anotado aquí como decisión
  consciente, no como descuido.
- Impacto en otras tareas:
  - T-040–T-043 (auth) ya tienen un admin real contra el que probar `requireAdmin` y
    el 403 de los endpoints de escritura.
  - T-022/T-023 y `T-026`–`T-028` (escrituras de platos y categorías) dependen del
    403 de admin para sus criterios.
  - **T-041/T-042 (JWT) necesitarán un `bcrypt.compare` al validar el login.** La
    dependencia ya está instalada, así que no hará falta pedirla otra vez. Confirmar que
    usan `bcryptjs` y no `bcrypt`, para no tener dos librerías de hashing en el bundle.
  - T-094 (PM2) deberá ejecutar los seeds durante el despliegue; como `db:seed` y
    `db:seed:admin` son scripts distintos, el pipeline de despliegue necesita los dos.

### 2026-10-01 — T-020 `GET /api/dishes` con localización por `Accept-Language`
- Archivos creados: `server/src/modules/dishes/dishes.routes.ts`, `dishes.service.ts`,
  `dishes.repository.ts`, `dishes.schema.ts`. Modificado: `server/src/app.ts`
  (monta `app.use('/api', dishesRouter)`).
- Estructura de cuatro archivos según `docs/AGENTE.md` §2.2. La ruta solo orquesta,
  el servicio resuelve el idioma y localiza, el repositorio hace el JOIN y el filtro, y
  `dishes.schema.ts` valida la respuesta con Zod.
- Criterio verificado con `curl` real contra el servidor en marcha:
  - `Accept-Language: ru` devuelve los 5 nombres en ruso
    (`Овощной суп`, `Паста с томатами`, `Оливье`, `Яблочный пирог`, `Фруктовый компот`).
  - Sin header devuelve en español (`Sopa de verduras`, ...), con `language: "es"`.
  - `Accept-Language: en` devuelve los 5 en inglés.
- **Decisión técnica: la respuesta es `{ language, dishes }`, no un array pelado.**
  Se añade `language` para que el frontend sepa con qué idioma se resolvió la petición y
  no tenga que volver a parsear el header; también sirve de diagnóstico. Si el cliente
  espera un array, hay que quitar el envoltorio.
- **La respuesta incluye `category: { id, slug, name }` ya localizado**, aunque el
  criterio de la tarea solo enumeraba `id, imageUrl, price, name, description,
  ingredients`. Motivo: MEMORY ya exigía el JOIN a `categories` para este endpoint, y
  T-031/T-032 necesitan la categoría para pintar el menú agrupado. Los campos pedidos
  están todos presentes, la categoría es un añadido. Si se prefiere la respuesta mínima,
  se quita `category` del servicio y del schema.
- **Decisión técnica: el JOIN es `inner`, no `left`.** Como `dishes.category_id` es
  `NOT NULL`, un `leftJoin` daría idéntico resultado y solo ocultaría datos corruptos.
- **Decisión técnica: se ordena por `categories.sortOrder` y luego `dishes.id`,** no solo
  por `dishes.id`. Así el menú sale en el orden que el admin defina, que es justamente
  para lo que sirve `sortOrder` (decisión de A-001).
- La resolución del header `Accept-Language` es deliberadamente más completa que un
  `=== 'ru'`, porque los navegadores reales envían varios idiomas con pesos. Casos
  probados de verdad, todos correctos:
  - `ru-RU` → ru (se queda con el idioma base, no la región)
  - `ru-RU,ru;q=0.9,en;q=0.8` → ru
  - `en;q=0.8,ru;q=0.9` → **ru** (gana el de mayor `q`, no el primero de la lista)
  - `fr-FR,fr;q=0.9` → es (idioma no soportado, cae al default)
  - `de;q=0.9,en-US;q=0.7` → en (salta el no soportado y coge el siguiente)
  - `ru;q=0` → es (un `q=0` significa "no lo quiero", se descarta)
  - `*` → es, header vacío → es, `RU` en mayúsculas → ru
  - `xx;q=abc,ru` → ru (`q` no numérico se trata como calidad 0, no rompe nada)
- El filtro de disponibilidad se probó **ocultando un plato de verdad**: puesto
  `is_available = 0` el dishes responde 4 y el nombre desaparece; restaurado, vuelve a
  5. La base quedó como estaba.
- El schema Zod valida la respuesta en runtime (`dishesResponseSchema.parse`), no solo
  en compilación: si una fila viene con un campo unexpectedly mal formado, revienta en
  la capa correcta en vez de colarse al cliente.
- `GET /api/health` sigue respondiendo 200 y una ruta inexistente sigue dando 404: el
  router nuevo se montó sin romper el existente.
- Verificado en los **dos modos**: con `tsx src/app.ts` y con `node dist/app.js` tras
  `npm run build`, con resultados idénticos. `typecheck`, `lint` y formato en verde.
- Impacto en otras tareas:
  - **T-031** puede consumir este endpoint tal cual y agrupar por `category`.
  - **T-025** (`GET /api/categories`) debe reutilizar el mismo criterio de resolución de
    idioma. `resolveLanguage` está exportado desde `dishes.service.ts`; lo correcto es
    moverlo a un módulo compartido cuando exista la segunda implementación.
  - T-021 (`GET /api/dishes/:id`) reutilizará `localize` y el mismo JOIN; conviene no
    duplicar el `switch` de idioma.
  - T-024 (borrado lógico) tiene su caso de prueba: poner `is_available = 0` y
    comprobar que el plato desaparece de la lista.
  - T-093 (tests) puede montar `dishesRouter` en un `express()` de prueba sin abrir
    puerto, como ya se hacía con `healthRouter`.

### 2026-10-01 — T-021 `GET /api/dishes/:id` + infraestructura de errores
- Archivos creados: `server/src/shared/errors.ts`, `server/src/shared/error.middleware.ts`.
  Modificados: `dishes.repository.ts`, `dishes.service.ts`, `dishes.routes.ts`,
  `server/src/app.ts`, `server/eslint.config.js`.
- Criterio verificado con peticiones reales: `GET /api/dishes/1` devuelve **200** con el
  plato, en ruso con `Accept-Language: ru` y en español sin header; `GET /api/dishes/9999`
  devuelve **404** con `{ error: 'Dish not found', code: 'DISH_NOT_FOUND' }` exactamente
  como lo pedía la tarea.
- **Decisión de alcance (la pidió el dueño): se creó la capa de errores**, en vez de
  responder el 404 a mano en el router. T-021 es el primer endpoint que devuelve un error
  y AGENTE.md §2.2 pide lanzar errores como clases propias, así que responder `404` desde
  la ruta habría dejado esa convención incumplida justo en la primera vez que aplica.
- Lo que trae la capa, ya en `server/src/shared/`:
  - `errors.ts`: `AppError` (base, con `statusCode` y `code`) y las subclases
    `NotFoundError` (404), `BadRequestError` (400), `UnauthorizedError` (401),
    `ForbiddenError` (403) y `ConflictError` (409).
  - `error.middleware.ts`: traduce cualquier `AppError` a `{ error, code }` conforme a
    SPEC §8, convierte un `ZodError` en `400 VALIDATION_ERROR` con los issues, y deja
    los errores desconocidos en `500 INTERNAL_ERROR` **sin filtrar detalles internos**.
  - `notFoundHandler` para rutas inexistentes, que devuelve `{ error: 'Not found',
    code: 'NOT_FOUND' }` en JSON en vez del HTML por defecto de Express.
- **El servicio lanza `NotFoundError`; el router no sabe nada de errores.** Es la
  separación que pide AGENTE.md §2.2 y hace que el servicio sea testeable sin Express.
- **El `:id` se valida con Zod** (`z.coerce.number().int().positive()`). Comprobado:
  `abc`, `0`, `-3` y `1.5` devuelven `400 VALIDATION_ERROR`, no un 500 ni una consulta
  con basura. `999999999` sí llega a la BD y devuelve 404, que es lo correcto.
- **Decisión técnica: `is_available = 0` devuelve el mismo 404 que "no existe"**, no un
  403. Probado ocultando un plato real: el detalle responde 404 y además desaparece de
  la lista. Motivo: para un cliente público, un plato retirado no se distingue de uno que
  nunca existió, y evita filtrar qué platos hubo.
- **El JOIN `inner` sigue pagando bien:** se probó con una fila corrupta
  (`category_id` inexistente) y el `innerJoin` la descarta, así que un dato roto produce
  un 404 limpio en lugar de un 500 con detalles de SQLite. Se comprobó además que el
  cuerpo del error no contiene ni la ruta de la BD ni SQL ni nombres de tabla.
- Se respetó la indicación de MEMORY de **no duplicar la lógica de idioma**: se extrajo
  `toResponse(row, language)` y ahora tanto la lista como el detalle usan el mismo
  `localize`. `localize` no se tocó.
- Gotcha registrado: **Express identifica un middleware de error por tener 4 parámetros,
  aunque el cuarto no se use**, así que ESLint se quejaba de `_next`. Se configuró
  `argsIgnorePattern: '^_'` en `server/eslint.config.js`, que además documenta la
  convención del prefijo `_` que el proyecto ya usaba en `health.routes.ts`.
- `typecheck`, `lint` y formato en verde; verificado en los dos modos (`tsx` y
  `node dist/app.js`), con resultados idénticos.
- Impacto en otras tareas:
  - **T-022/T-023/T-026/T-027/T-028 ya pueden lanzar `NotFoundError`, `ConflictError` y
    `ForbiddenError`** y solo deben elegir el código. El 409 para slug duplicado y el 409
    al borrar una categoría con platos ya estaba decidido; la clase existe.
  - **T-040/T-043**: `UnauthorizedError` y `ForbiddenError` cubren los 401 y 403 de sus
    criterios.
  - T-093 (tests) puede montar el router sin middleware global si quiere, pero para
    probar errores necesita `errorHandler` montado, igual que en producción.
  - `resolveLanguage` sigue en el servicio de dishes: T-025 debe seguir reutilizándolo.

### 2026-10-01 — T-022 `POST /api/dishes`
- Archivos modificados: `server/src/modules/dishes/dishes.schema.ts`,
  `dishes.repository.ts`, `dishes.service.ts`, `dishes.routes.ts`,
  `server/src/app.ts` (añade `express.json()`), `server/src/shared/error.middleware.ts`.
- Criterio verificado con peticiones reales: un `POST` con body válido devuelve **201**
  con el plato creado (ya localizado según `Accept-Language`), y un body inválido
  devuelve **400** con el detalle de Zod en `details`.
- **Conflicto resuelto antes de escribir código:** el body que definía la tarea no
  incluía `categoryId`, pero `dishes.category_id` es `NOT NULL` con FK a `categories`, y
  ya se había documentado que T-026 debía ir antes que T-022 por eso. El dueño decidió
  **exigir `categoryId` en el body**, así que el schema Zod lo pide y el servicio
  comprueba además que la categoría exista. El curl de ejemplo necesita el campo extra.
  `T-026` ya no bloquea a esta tarea.
- **El body lleva `categoryId` (positivo, entero), `imageUrl` (URL válida),
  `price` (mayor que 0) y los 9 campos de texto con `trim().min(1)`.** El `trim()`
  importa: sin él un nombre de solo espacios pasaba la validación. Probado que `"   "`
  da 400.
- **Decisión técnica: `isAvailable` se fija en 1 dentro del repositorio, no se acepta
  del body.** Probado mandando `isAvailable: 0` en el JSON: se guardó 1. El cliente no
  controla si un plato nace disponible; eso lo decide T-024 (borrado lógico).
- **Los campos extra del body se descartan.** Zod los ignora por defecto, así que
  mandar `hack: 'x'` da 201 sin guardar nada raro. No se usó `.strict()`, porque el
  criterio no lo pedía y es más permisivo con clientes que evolved de lo contrario.
- **Bug real encontrado y corregido: un body JSON malformado devolvía 500 en vez de
  400.** `express.json()` lanza un `SyntaxError` con `status: 400` y
  `type: 'entity.parse.failed'`, que no es `AppError` ni `ZodError`, así que se colaba
  en la rama de "error no controlado". Se añadió `isBodyParseError` al middleware y ahora
  `{no-json` responde `400 INVALID_JSON`. Verificado con JSON truncado y con
  `Content-Type` equivocado.
- `app.ts` ahora lleva `app.use(express.json({ limit: '100kb' }))`; sin él `req.body`
  era `undefined` y toda validación fallaba. El límite evita que un body enorme agote
  memoria.
- Comprobado además: el plato creado aparece en el listado y en su detalle, con
  `category_id` correcto, `is_available = 1` y `created_at` relleno por el default del
  esquema; y los GET de T-020/T-021 no se rompieron (lista 5, detalle correcto, health
  200).
- `typecheck`, `lint` y formato en verde; verificado en los dos modos (`tsx` y
  `node dist/app.js`), con resultados idénticos.
- **Impacto en otras tareas:**
  - **T-043 tiene que añadir `requireAdmin` a este POST.** Hasta entonces el alta de
    platos es **pública**: cualquiera que alcance la API puede crear platos. Es
    exactamente lo que pidió la tarea, pero conviene no desplegar antes de T-043. El
    criterio de "401 sin token / 403 si no es admin" sigue **pendiente**, y así queda
    anotado en la tarea.
  - T-023 (`PUT`) reutilizará `createDishBodySchema` como base, añadiendo el `id` en los
    params.
  - T-024 (`DELETE` lógico) seguirá usando `is_available = 0`; el POST no lo expone.
  - T-025–T-028 (categorías) ya no bloquean a T-022, pero `GET /api/categories` sigue
    haciendo falta para que el admin elija una categoría en el formulario.
  - T-093: los 400 de Zod llegan como `details` con los issues de Zod; es el formato que
    deberá esperar el frontend al mostrar errores de validación.

---

## Decisiones resueltas

> Decisiones ya tomadas que no hay que volver a abrir. Se anotan para que un agente
> que llegue tarde no vuelva a plantear la pregunta.

### 2026-10-01 — Las categorías tienen CRUD propio, no un id fijo
**Origen:** pendiente abierto por **A-001**, al añadir la tabla `categories`.
**Decisión del dueño:** crear el endpoint de categorías con CRUD completo
(`T-025`–`T-028`) en lugar de que `POST /api/dishes` usara un id de categoría fijo.

**Por qué:** con la tabla `categories` ya existente, la alternativa era hacer que el
alta de platos escribiera directamente en `categories` desde `T-022`. Se descartó
porque mezcla dos responsabilidades en un endpoint y porque no da forma de renombrar
una categoría ni reordenar el menú una vez creado el producto. Un CRUD propio deja
`dishes` centrado en platos y además habilita la reorderedación (`sortOrder`) desde
la interfaz, que era el objetivo original de A-001.

**Consecuencias a tener en cuenta al implementar:**
- **Orden de ejecución: `T-026` antes que `T-022`.** `POST /api/dishes` validará
  `categoryId`, así que sin forma de crear categorías el alta de platos queda
  bloqueada. Es la única dependencia dura entre estas tareas.
- `T-025` es público y **localizado por `Accept-Language`**, igual que `GET /api/dishes`:
  los nombres de categoría son texto visible al usuario y AGENTE.md §2.5 exige los tres
  idiomas. La UI los necesita para pintar el menú agrupado (T-031/T-032).
- `POST`/`PUT` validan `slug` con Zod y devuelven 409 si ya existe, para que un
  duplicado no produzca un error de FK opaco.
- `DELETE` **no** hace cascada sobre `dishes`: devuelve 409 si hay platos asociados.
  Es más seguro que perder dishes por una confirmación mal leída.
- Todas las rutas de escritura pasan por `requireAdmin` (`T-043`).

---

## Notas de progreso

> Aquí los agentes anotan decisiones, bloqueos y aprendizajes. Una entrada por tarea completada o bloqueada.

### 2026-09-29 — T-001 (setup)
- Creado: `server/package.json`, `client/package.json` (mínimos, sin dependencias),
  `shared/types.ts` y `shared/schemas.ts` (vacíos), `.env.example`, `.gitignore`
  y `package.json` raíz.
- Decisión tomada: el `package.json` raíz usa **npm workspaces** con `["server", "client"]`.
  `shared/` queda fuera de workspaces porque solo aporta archivos `.ts` que se importan
  por ruta relativa (no es un paquete publicable).
- Decisión tomada: `server/package.json` ya declara `"type": "module"` porque T-002 lo exige.
- Duda resuelta: el prompt de T-001 pedía "variables de SPEC.md sección 4", pero esa sección
  es la tabla de stack técnico y **no lista variables de entorno**. Se usaron las variables
  canónicas de `docs/PROMPTS.md` T-008 (PORT, NODE_ENV, LOG_LEVEL, DATABASE_URL, JWT_SECRET,
  JWT_REFRESH_SECRET, MAILGUN_*, CHEF_EMAIL, TELEGRAM_*). Si el dueño prefiere otra lista,
  corregir antes de T-008.
- Discrepancia detectada: la guía de convenciones está en `docs/AGENT.md`, no `docs/AGENTE.md`
  como lo indican SPEC/PROMPTS. No se modificó el nombre.
- El `package.json` raíz todavía **no** tiene scripts (`dev`, `lint`, `typecheck`, `build`, `test`).
  Se agregarán en T-002 (dev/typecheck del server), T-003 (dev del client) y T-006 (lint/format).
- Impacto en otras tareas: ninguna dependencia instalada todavía, según lo pedido.

### 2026-09-29 — T-002 (setup)
- Archivos creados: `server/tsconfig.json`, `server/src/app.ts`, `server/src/logger.ts`,
  `server/src/config/index.ts`. Dependencias instaladas y añadidas a `server/package.json`.
- Criterio verificado: `npx tsc --noEmit` pasa sin errores y `npx tsx src/app.ts` carga el
  módulo sin abrir el puerto (no hay `app.listen`).
- Decisión tomada: `module`/`moduleResolution` = **NodeNext**, coherente con `"type": "module"`.
  Esto obliga a escribir imports relativos con extensión `.js` (p. ej. `./logger.js`).
- Decisión tomada: se activaron flags adicionales de strict: `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch` y `exactOptionalPropertyTypes`.
  `exactOptionalPropertyTypes` puede obligar a propagar `prop?: T` en vez de `prop: T | undefined`
  al construir objetos; ajustar en T-008 si incomoda.
- Decisión tomada: `src/logger.ts` se creó ya con `pino()` base (sin opciones) porque la
  estructura lo exige. La configuración por entorno y `pino-pretty` quedan para **T-007**;
  no se-forward-dejó configuración adelantada para no mezclar tareas.
- Decisión tomada: `src/config/index.ts` existe como punto de extensión para el barrel de configuración.
  `config/env.ts` (validación Zod) se crea en **T-008**.
- Nota: `npm install` se ejecutó desde `server/`, pero por los workspaces de la raíz los
  paquetes se hoistean a `<raíz>/node_modules` y se creó `<raíz>/package-lock.json`. Es el
  comportamiento esperado; no hay `node_modules` dentro de `server/`.
- No se agregó ninguna ruta: `app.ts` solo exporta la instancia de Express.
- Impacto en otras tareas: T-004 y T-009 colgarán routers sobre esta instancia; T-007
  reconfigurará `src/logger.ts`. El `package.json` raíz sigue sin scripts (`dev`, `lint`,
  `typecheck`) — se completan en T-003/T-006.

### 2026-09-29 — T-003 (setup)
- Archivos creados: `client/index.html`, `client/vite.config.ts`, `client/tsconfig.json`,
  `client/tsconfig.app.json`, `client/tsconfig.node.json`, `client/src/main.tsx`,
  `client/src/App.tsx`, `client/src/index.css`, y las carpetas vacías
  `client/src/{pages,components,api,hooks,store,locales,lib}`. Modificado `client/package.json`.
- Criterio verificado: `npm run dev` levanta Vite en `http://localhost:5173` (HTTP 200) y
  `App.tsx` se sirve con el texto "Osito a la carta". `npx tsc -b --noEmit` en client y
  `npx tsc --noEmit` en server pasan ambos.
- **Decisión del dueño:** se usa **React 19.3.0**, no React 18. `create-vite@latest
  --template react-ts` ya no genera React 18. **SPEC.md §4 fue actualizado** el
  2026-09-29 con autorización explícita del dueño: ahora dice "React 19 + Vite 8" y
  §10 registra la decisión como cerrada. SPEC.md y el código ya coinciden.
- Decisión tomada: **TypeScript unificado a 5.9.3** en todo el monorepo (el template traía
  ~6.0.2, el server ya tenía ^5.7.3). Se declares `^5.7.3` en ambos package.json y npm
  deduplica una sola instalación. Así `npx tsc` se comporta igual en los dos workspaces.
- Decisión tomada: se conserva la estructura de **tsconfig con project references**
  (`tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json`) que genera el template.
  El `strict` se aplicó manualmente porque el template actual **no lo trae activado**:
  se añadió `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- Decisión tomada: `exactOptionalPropertyTypes` **no** se activó en el client (sí está en el
  server). Motivo: con las librerías de UI que llegan en T-005/T-035 (Tailwind, shadcn/ui)
  suele generar falsos positivos al tipar props. Es el flag prescindible del backend.
- Decisión tomada: se eliminaron del template los archivos de demo no usados
  (`App.css`, `assets/`, `public/vite.svg`, `README.md`, `.oxlintrc.json`, `.gitignore`
  del client) y los scripts `lint`/`build` con oxlint. El linting es tarea de **T-006**
  (ESLint + Prettier); dejar oxlint habría creado un conflicto de herramientas.
- Gotcha registrado: en PowerShell, `npm create vite@latest <path> -- --template react-ts`
  ignora `--template` (npm se lo come como config propia) y scaffoldea **vanilla**, no React.
  Hay que usar `npx --yes create-vite@latest <path> --template react-ts`.
- Impacto en otras tareas: T-004 añade el proxy `/api` en `vite.config.ts`; T-005 añade
  Tailwind y reemplaza `index.css`; T-006 añade ESLint/Prettier y los scripts raíz
  (`dev:client`, `lint`, `typecheck`); T-030 reemplaza el texto de `App.tsx` por `t('app.title')`.

### 2026-09-29 — T-004 (setup)
- Archivos modificados: `client/vite.config.ts` y `server/src/app.ts`. Ningún archivo nuevo.
- Criterio verificado de extremo a extremo: con ambos servidores arriba,
  `http://localhost:5173/api/health` devolvió `{"status":"ok","timestamp":"2026-09-29T21:45:52.612Z"}`
  y el acceso directo a `http://localhost:3000/api/health` devolvió lo mismo.
  `npx tsc --noEmit` (server) y `npx tsc -b --noEmit` (client) pasan ambos.
- **Cambio de alcance respecto a T-002:** `app.ts` ahora hace `app.listen(PORT)` en el
  arranque del módulo. T-002 lo dejó explícitamente sin arrancar, pero el criterio de
  T-004 exige el server en `:3000`, así que el `listen` es indispensable. Sigue exportando
  `app` para que las pruebas de T-093 puedan importar la instancia.
- Decisión tomada: `PORT` se lee de `process.env.PORT ?? '3000'` **sin validación Zod todavía**;
  la validación con Zod llega en **T-008**, que sustituirá esta línea por `env.PORT`.
  Se usó el env directo para no adelantar trabajo de T-008.
- Decisión tomada: `strictPort: true` en el server de Vite. Sin esto, Vite cae
  automáticamente a `5174`, `5175`... si el puerto está ocupado, y el proxy y los
  tests que apunten a `:5173` fallarían de forma confusa. Fallar rápido es preferible.
- Decisión tomada: `changeOrigin: true` en el proxy. Sin él, Express recibe
  `Host: localhost:5173` en vez del original; hoy es inocuo, pero lo necesitará
  cuando haya CORS/origins validados en T-008+.
- Gotcha registrado: el import `./logger.js` lleva extensión `.js` aunque el archivo sea
  `.ts` — requisito de `moduleResolution: NodeNext` de T-002. Sin la extensión,
  `tsc --noEmit` pasa pero el runtime revienta con `ERR_MODULE_NOT_FOUND`.
- Impacto en otras tareas: T-007 sustituye el `logger.info` directo por el nivel/config
  definitivos; T-008 mueve el puerto a `env.PORT` validado; T-009 movdrá la ruta de
  `app.ts` a `src/modules/health/health.routes.ts` con un router propio.

### 2026-09-29 — T-005 (setup)
- Archivos modificados: `client/vite.config.ts` (plugin de Tailwind), `client/src/index.css`
  (sustituido por completo), `client/src/App.tsx` (clases de Tailwind).
  Modificado: `client/package.json` (2 devDependencies). Ningún archivo nuevo.
- Criterio verificado: `npm run build` genera `dist/assets/index-*.css` de 4.82 kB que
  contiene las cuatro utilities usadas (`.mt-10`, `.text-3xl`, `.font-bold`, `.text-center`).
  `npx tsc -b --noEmit` pasa. El dev server sirve `index.css` como `text/css` y `App.tsx`
  con las clases aplicadas. Pendiente la confirmación visual del dueño en el navegador.
- **Decisión del dueño (desvía del enunciado):** se instala **Tailwind 4.3.3** con el plugin
  `@tailwindcss/vite`, **no** Tailwind 3. El enunciado pedía `tailwind.config.js`,
  postcss + autoprefixer y las directivas `@tailwind base/components/utilities`; ese es el
  modelo de Tailwind v3, que ya no es el vigente. SPEC.md §4 solo dice "Tailwind CSS" sin
  fijar versión, así que no hubo que modificarlo.
- Consecuencia del desvío: **no existe `client/tailwind.config.js`**, no se instalaron
  `postcss` ni `autoprefixer`, y `index.css` usa `@import 'tailwindcss'` en lugar de las
  directivas `@tailwind`. La configuración de tema se hace en CSS con `@theme` dentro de
  `index.css`. T-035 (shadcn/ui) requerirá revisar los tokens del tema.
- Gotcha registrado: SPEC.md §5 documenta `client/tailwind.config.js` como parte del árbol
  esperado. Con Tailwind 4 ese archivo ya no existe. Actualizar SPEC §5 requiere
  autorización del dueño; queda anotado aquí y en MEMORY.md.
- Impacto en otras tareas: T-035 (shadcn/ui) debe usar el esquema de tema CSS-first de
  Tailwind 4; T-090 (PWA) no se ve afectado; T-091 (responsive) aprovecha las utilities
  de Tailwind ya disponibles.

### 2026-09-30 — T-006 (setup)
- Archivos creados: `.prettierrc.json`, `.prettierignore`, `server/eslint.config.js`,
  `client/eslint.config.js`. Modificados: `package.json` (raíz, 7 devDeps + 9 scripts),
  `server/package.json` y `client/package.json` (scripts `lint` y `format`).
- Criterio verificado: `npm run lint` desde la raíz pasa **sin errores y con exit 0** en
  ambos workspaces. `npm run typecheck` también pasa (exit 0). `npm run format:check`
  reporta "All matched files use Prettier code style".
- Dependencias agregadas (con autorización del dueño), todas en el **package.json raíz**
  para no duplicarlas: `eslint@^10.11.0`, `@eslint/js@^10.0.1`,
  `typescript-eslint@^8.71.0`, `globals@^17.12.0`, `eslint-plugin-react-hooks@^7.1.1`,
  `eslint-plugin-react-refresh@^0.5.7`, `prettier@^3.9.9`. Verifiqué las peer deps
  antes de instalar: typescript-eslint 8.71 acepta ESLint ^10 y TS <6.1 (tenemos 5.9.3);
  react-hooks 7.1.1 acepta ESLint ^10; react-refresh 0.5.7 pide ^9 || ^10.
- Decisión tomada: **flat config** (`eslint.config.js`) y no el legacy `.eslintrc.json`.
  ESLint 10 solo soporta flat config; el formato viejo ya no es una opción viable.
- Decisión tomada: **las herramientas viven en la raíz, las configs en cada workspace.**
  `eslint.config.js` está duplicado a propósito: el server usa `globals.node` y el
  client `globals.browser` más los plugins de React. Un único config no serviría.
  `.prettierrc.json` sí es compartido y único, como pide el enunciado.
- Decisión tomada: se usó el perfil **`recommended`**, no `strict` ni
  `recommended-type-checked`, para no pelearse con `exactOptionalPropertyTypes` y con
  los flags de T-002/T-003. El typecheck estricto ya lo aporta `tsc`.
- Decisión tomada: `.prettierignore` excluye `docs/` y `README.md`. Prettier intentaba
  reformatear SPEC.md, TASKLIST.md, MEMORY.md y AGENT.md, lo que generaría diffs
  enormes en archivos que se editan a mano. SPEC.md además no se puede tocar sin
  autorización, y un reformateo automático cuenta como modificación.
- Gotcha registrado: `npm run dev` en la raíz usa `--workspaces --if-present`, que
  lanza server y client **en paralelo intercalando su salida en la misma terminal**.
  Para distinguirlos conviene usar `npm run dev:server` y `npm run dev:client` en dos
  terminales (ambos scripts añadidos en esta tarea).
- Impacto en otras tareas: AGENT.md §9 exige que `npm run lint` y `npm run typecheck`
  pasen antes de cerrar cualquier tarea; ambos existen y funcionan desde la raíz desde
  ahora. T-093 deberá añadir el script `test` al `package.json` raíz, que aún no existe.

### 2026-09-30 — Ajuste de `engines.node` (fuera de T-006)
- Modificado: `package.json` (raíz), campo `engines.node`: `">=20"` → `"^20.19.0 || ^22.13.0 || >=24"`.
- Motivo: ESLint 10 exige `^20.19.0 || ^22.13.0 || >=24` y Vite 8 exige
  `^20.19.0 || >=22.12.0`. Se adoptó la restricción de ESLint por ser la más estricta.
  Con Node 20.0-20.18 el linting no habría arrancado.
- Verificado: `npm run lint` y `npm run typecheck` siguen pasando con exit 0 en Node v22.15.0.
- Impacto en otras tareas: **T-094 (PM2 en VPS) queda condicionada** — el servidor debe
  correr Node 20.19+, 22.13+ o 24+. Si el VPS está en una versión anterior, hay que
  actualizar Node **antes** de desplegar, no durante.

### 2026-09-30 — T-007 (setup)
- Archivos modificados: `server/src/logger.ts`. `server/src/app.ts` **no necesitó cambios**:
  ya llamaba a `logger.info('Server starting on port <PORT>')` desde T-004, con el logger
  aún sin configurar. Configurar `logger.ts` bastó para cumplir el requisito.
- Criterio verificado con el server arrancando de verdad:
  - Desarrollo (`NODE_ENV` sin definir): `[15:04:10] INFO: Server starting on port 3000`,
    con colores y hora legible.
  - Producción (`NODE_ENV=production`): `{"level":30,"time":1790769910322,"pid":12544,
    "hostname":"Botet","msg":"Server starting on port 3000"}` — JSON puro.
  - `LOG_LEVEL=debug` muestra debug + info + error.
  - `LOG_LEVEL=error` oculta debug e info, solo deja error.
  - `LOG_LEVEL=basura` (inválido) cae a `info` sin romper.
  - `npx tsc --noEmit` y `npm run lint` pasan.
- Decisión tomada: **niveles validados contra una lista explícita** (`trace|debug|info|
  warn|error|fatal|silent`) y fallback a `info` si `LOG_LEVEL` no coincide. Sin esa
  validación, un `LOG_LEVEL` mal escrito hace que pino lance al arrancar y el server
  muera con un error poco claro. Preferible caer a `info` y seguir arrancando.
- Decisión tomada: el transporte `pino-pretty` se activa solo cuando `NODE_ENV !== 'production'`,
  mediante spread condicional del objeto de opciones. Así en producción **no se carga**
  pino-pretty (es devDependency) y no hay coste de arranque.
- Decisión tomada: `pino-pretty` no se importa, se referencia por **string** en
  `transport.target`. Es lo que exige el API de pino: el worker lo resuelve en runtime.
- Gotcha registrado: `pino-pretty` es **devDependency**. Si alguien despliega en producción
  con `NODE_ENV` sin definir, el transporte se intenta cargar y falla. T-094 debe
  garantizar `NODE_ENV=production` en el ecosystem de PM2; ya está previsto en el
  prompt de T-094 (`env: NODE_ENV=production`).
- Gotcha registrado: con `transport`, pino escribe por un **worker thread**. En tests
  (T-093) el output puede llegar después del assertion y ensuciar la salida. Para
  tests conviene forzar `NODE_ENV=production` o inyectar un destination de memoria.
- Impacto en otras tareas: T-093 (tests) debe tener en cuenta el worker thread de pino-pretty;
  T-094 (PM2) debe fijar `NODE_ENV=production`; T-008 sustituirá la lectura directa de
  `process.env` por `env.LOG_LEVEL` validado con Zod, manteniendo la lista de niveles.

### 2026-09-30 — T-008 (setup)
- Archivos creados: `server/src/config/env.ts`. Modificados: `server/src/config/index.ts`
  (ahora es un barrel real, ya no `export {}`), `server/src/app.ts` y `server/src/logger.ts`
  (pasan a consumir `env`).
- Criterio verificado ejecutando el server de verdad:
  - **Sin `.env`**: sale con código 1 y lista las 9 variables faltantes en español,
    terminando con "Copia .env.example a .env y completa los valores."
  - **Con `.env` completo**: arranca, loguea `Server starting on port 3000` con formato
    pretty y `/api/health` responde `{"status":"ok",...}`. `PORT` llega como `number` 3000.
  - El `.env` de prueba se **eliminó** al terminar; `git check-ignore` confirma que
    `.gitignore:5` lo cubre.
- Dependencias: **ninguna nueva**. Se usa `process.loadEnvFile()` de Node 22 en lugar de
  `dotenv`, que no está instalado. Node ya lo trae y evita una dependencia.
- **Decisión del dueño:** `MAILGUN_FROM` acepta **dos formatos**, email simple y
  `Nombre <email>`, en vez de `z.string().email()` estricto. Motivo: el `.env.example`
  de T-001 usa el formato con nombre y Zod lo rechazaba (verificado). Se exportan
  `MAILGUN_FROM.raw` (el string completo, que es lo que usa Mailgun) y
  `MAILGUN_FROM_EMAIL` (solo el email, extraído y validado).
- Decisión tomada: **los mensajes de error de Zod están en español** vía
  `required_error` y `message` personalizados. Por defecto Zod devuelve "Required" en
  inglés, lo que mezclaba idiomas en la salida de arranque.
- Decisión tomada: **`env.ts` se carga al importarse** y llama a `process.exit(1)` si
  falla la validación. La ruta del `.env` se resuelve con `import.meta.url` subiendo
  tres niveles (`config/` → `src/` → `server/` → raíz), por lo que funciona igual
  desde `src/` en desarrollo y desde `dist/` compilado.
- Gotcha registrado: `process.loadEnvFile` **lanza si el archivo no existe**, por eso se
  comprueba con `existsSync` antes. También ignora líneas vacías y comentarios.
- Gotcha registrado: `process.loadEnvFile` **no sobreescribe** variables ya presentes en
  `process.env`, así que las variables reales del sistema tienen prioridad sobre el
  `.env`. Es el comportamiento deseado en despliegue.
- Impacto en otras tareas: T-041/T-042 (JWT) usan `env.JWT_SECRET` y
  `env.JWT_REFRESH_SECRET`; T-060 (Mailgun) usa `env.MAILGUN_FROM.raw` y
  `env.MAILGUN_FROM_EMAIL`; T-061 (Telegram) usa `env.TELEGRAM_*`. T-093 (tests) deberá
  definir un `.env` o setear `process.env` antes de importar nada que dependa de `env`,
  porque el módulo hace `process.exit(1)` si falta algo.

### 2026-09-30 — Guard de placeholders en `.env` (endurecimiento de T-008)
- Modificado: `server/src/config/env.ts` únicamente. Sin dependencias ni archivos nuevos.
- Contexto: los placeholders de `.env.example` tienen más de 32 caracteres, así que
  pasaban la validación de longitud de `JWT_SECRET` y el servidor arrancaba en
  producción con secretos públicos. El dueño pidió cerrarlo.
- Criterio verificado en los 4 escenarios, arrancando el server de verdad:
  - Producción + placeholders → **exit 1**, lista las 8 variables rechazadas.
  - Producción + secretos reales → arranca, log JSON, `/api/health` responde ok.
  - Desarrollo + placeholders → arranca, log pretty, `/api/health` responde ok.
  - `DATABASE_URL` queda sin guard (no es secreto).
- Decisión tomada: el guard **solo se activa con `NODE_ENV === 'production'`**. En
  desarrollo se permiten a propósito, para poder arrancar recién clonado el repo sin
  tener que inventar secretos.
- **Bug encontrado y corregido durante la implementación:** la primera versión estaba
  invertida. `rejectPlaceholder` devolvía `true` al detectar el placeholder y se usaba
  como predicado de `.refine()`, pero en Zod `.refine(p)` acepta cuando `p` es `true`.
  El guard **aceptaba lo que debía rechazar**, sin error de tipos ni de sintaxis: solo
  se detectó al ejecutar el caso negativo. Se corrigió separando `hasPlaceholder()`
  (detecta) de `rejectPlaceholder()` (invierte para el predicado).
- Gotcha registrado: `tsx watch` **no reinicia al cambiar `.env`**, porque solo vigila
  los archivos de `src/`. Hay que reiniciar el proceso a mano tras editar el `.env`.
- Gotcha registrado: en Zod `.refine(p)` el predicado debe devolver `true` para que
  el valor sea **válido**. Nombrar mal el predicado invierte el guard en silencio.
- Impacto en otras tareas: T-093 (tests) debe correr con `NODE_ENV=test` para que el
  guard no mate vitest; T-094 (PM2) arranca con `NODE_ENV=production`, que es
  exactamente la protección buscada.

### 2026-09-30 — T-009 (setup)
- Archivos creados: `server/src/modules/health/health.routes.ts`.
  Modificado: `server/src/app.ts` (la ruta inline se movió al router y se montó con
  `app.use('/api', healthRouter)`).
- Criterio verificado en **los dos modos de ejecución**:
  - Desarrollo (`npm run dev`, tsx sobre `src/`):
    `{"status":"ok","timestamp":"2026-09-30T15:18:03.033Z","uptime":22,"version":"0.1.0"}`
  - Producción compilada (`npm run build` + `npm start`, node sobre `dist/`):
    `{"status":"ok","timestamp":"2026-09-30T15:19:54.859Z","uptime":26,"version":"0.1.0"}`
  - `uptime` sale como **entero** (verificado con regex `"uptime":\d+,`).
  - `GET /api/no-existe` devuelve **404**, confirmando que el router está montado bajo
    `/api` y no captura todo indiscriminadamente.
  - `npx tsc --noEmit`, `npm run build`, `npm run lint` y `npm run format:check` pasan.
- **Decisión técnica: `version` se lee con `createRequire`, no con `import` de JSON.**
  Verifiqué que `import pkg from '../../package.json' with { type: 'json' }` **pasa**
  `tsc --noEmit` y `npm run build`, pero **falla en runtime** en los dos entornos:
  en `dist/` da `ERR_MODULE_NOT_FOUND` porque tsc emite el `.js` en
  `dist/modules/health/` pero **no copia el `package.json` a `dist/`** (está fuera de
  `rootDir: ./src`). En `src/` con tsx también falló. `createRequire` resuelve la ruta
  del filesystem en tiempo de ejecución y funciona en ambos casos.
- Decisión tomada: `uptime` se calcula con `Date.now() - STARTED_AT`, donde
  `STARTED_AT` se fija **a nivel de módulo** al importarse. Es el arranque del proceso
  de Node, que es lo que interesa para health checks. Alternativa descartada:
  `process.uptime()`, que mide desde el arranque del proceso de Node y sería casi
  igual; se eligió una constante de módulo para que el valor sea explícito y testeable.
- Decisión tomada: el router define la ruta como `/health` (no `/api/health`) porque
  se monta con `app.use('/api', healthRouter)`. Así el prefijo vive en un solo sitio
  y los routers futuros no repiten `/api`.
- Gotcha registrado: **`tsc --noEmit` y `npm run build` NO detectan el fallo del import
  JSON.** Ambos pasan en verde y el error solo aparece al ejecutar. Por eso la
  verificación de esta tarea se hizo en ambos modos, no solo en desarrollo.
- Impacto en otras tareas: T-020, T-051, T-080 y demás siguen el mismo patrón
  (`app.use('/api', xRouter)`). T-093 puede importar `healthRouter` y probarlo sin
  abrir un puerto. T-094 (PM2) seguirá usando el script `start` ya existente.

---

### 2026-10-01 — T-010 (setup)
- Archivos creados: `server/src/db/schema.ts`, `server/src/db/client.ts`,
  `server/drizzle.config.ts`, `server/src/db/migrations/0000_worthless_scarlet_spider.sql`.
  Modificados: `package.json` (raíz, `engines.node`), `server/package.json`.
- Criterio verificado: `npx drizzle-kit generate` produjo una migración válida con las
  6 entidades y `npx drizzle-kit migrate` la aplicó sobre una base limpia, creando
  `users`, `dishes`, `orders`, `order_items`, `page_views` y `notification_logs`.
  `PRAGMA foreign_key_list` confirma las FKs esperadas: `orders`→`users` (1),
  `order_items`→`orders`+`dishes` (2), `page_views`→`users`+`dishes` (2),
  `notification_logs`→`orders` (1); `users` sin FKs y con índice único en `email`.
- Comportamiento comprobado en runtime, no solo en tipos:
  - Defaults aplicados: `role='customer'`, `preferred_lang='es'`, `status='pending'`,
    `is_available=1`.
  - `UNIQUE users.email` rechaza el duplicado: `UNIQUE constraint failed: users.email`.
  - `orders.user_id` rechaza un usuario inexistente: `FOREIGN KEY constraint failed`.
  - `INSERT` + `SELECT` con join de 4 tablas (`order_items`→`dishes`→`orders`→`users`)
    devuelve la fila esperada.
  - `npx tsc --noEmit`, `npm run lint` pasan.
- **Decisión técnica: el schema NO exporta `relations()`.** La API relacional
  `db.query.*` no hidrata filas en `drizzle-orm@0.45.3`. Se probaron tres variantes
  (`relations()` por callback, objeto plano con claves `xRelations`, objeto plano
  anidado bajo `relations`); las tres devuelven `undefined` o el propio builder.
  Diagnóstico: `extractTablesRelationalConfig` **sí** extrae las relaciones
  correctamente (`a→[bs]`, `b→[a]`), así que el fallo está en el consumo de `with`,
  no en la definición. Se optó por joins explícitos en `db.select()`, que sí
  funcionan. No reintroducir `relations()` sin verificar la hidratación en runtime.
- Gotcha registrado: **el driver `better-sqlite3` es síncrono y no encadena nada.**
  `db.insert(t).values(v).returning()` devuelve el builder (lanza
  `TypeError: object is not iterable` al hacer destructuring) y
  `db.insert(t).values(v)` sin método terminal **no ejecuta nada**, en silencio.
  Hace falta `.get()`, `.all()` o `.run()` explícito. `db.select().from(t)` sin
  `.all()`/`.get()` también devuelve sin ejecutar.
- Gotcha registrado: `tsc --noEmit` y `npm run lint` pasan aunque `relations()`
  esté mal, porque la API relacional no se comprueba en tiempo de compilación.
  Cualquier verificación de datos debe ejecutarse, no solo tiparse.
- Pendiente conocido: las columnas de clave ajena (`orders.user_id`,
  `order_items.order_id`, `order_items.dish_id`, `page_views.*`,
  `notification_logs.order_id`) **no tienen índice**; SQLite no los crea
  automáticamente. Para el volumen del MVP no es un problema, pero si las consultas
  de pedidos crecen conviene añadir índices explícitos y regenerar la migración.
- Nota de seguridad: `npm audit` reporta 4 vulnerabilidades moderadas de
  `esbuild <=0.24.2`, arrastradas por `drizzle-kit` (tooling de desarrollo, no
  entra en el bundle de runtime). **No** ejecutar `npm audit fix --force`: propone
  `drizzle-kit@0.18.1`, un downgrade incompatible con la API actual.
- Impacto en otras tareas: T-011 puede marcarse como completada sin trabajo
  adicional, porque la migración inicial ya está aplicada y verificada. T-012
  (seed) debe insertar en `dishes` con los 9 campos de texto por idioma y usar
  `.run()` en cada `insert`. T-020/T-051 usarán `db.select()` con joins; conviene
  leer `server/src/db/client.ts`, que ya exporta `db` y `sqlite` con los pragmas
  `journal_mode=WAL` y `foreign_keys=ON` activos.
- Archivos temporales de verificación (`probe-db.ts`, `probe-db2.ts`,
  `probe-db3.ts`, `inspect-db.ts`) y la base `server/osito.db` se eliminaron al
  terminar. `.env` y `*.db` ya estaban en `.gitignore`.

---

### 2026-10-01 — T-011 (setup)
- Modificado: `server/package.json` (scripts `db:generate`, `db:migrate`, `db:studio`).
  Sin archivos nuevos: la migración y el esquema ya venían de T-010.
- Criterio verificado:
  - `npm run db:migrate` desde `server/` crea `server/osito.db` (45 KB), **en la raíz
    del server**, no en la raíz del monorepo. La ruta viene de
    `dbCredentials.url: './osito.db'` en `server/drizzle.config.ts`, que es relativa al
    directorio de trabajo, por eso el script debe correr dentro de `server/`.
  - Las 6 tablas existen: `users` (6 col, 1 índice), `dishes` (14 col), `orders`
    (6 col, 1 FK), `order_items` (5 col, 2 FK), `page_views` (5 col, 2 FK),
    `notification_logs` (6 col, 1 FK). `__drizzle_migrations` registra 1 entrada.
  - Las FKs se confirman con `PRAGMA foreign_key_list`, no solo mirando los nombres.
- Comprobaciones adicionales:
  - `npm run db:generate` sobre el esquema ya aplicado responde
    `No schema changes, nothing to migrate` y **no crea una segunda migración**.
    Es el guard de que el esquema y las migraciones están en sincronía.
  - `npm run db:migrate` es idempotente: reejecutarlo no falla ni duplica.
  - El server arranca contra la base creada (`Server starting on port 3000`), así que
    `client.ts` y la ruta que usa `db:migrate` apuntan al mismo archivo.
  - `npm run typecheck` y `npm run lint` pasan en `server/`.
- **Decisión técnica: los scripts viven en `server/package.json`, no en la raíz.** La
  tarea los pedía ahí, y además `dbCredentials.url` y `schema`/`out` de
  `drizzle.config.ts` son rutas relativas a `server/`. Delegarlos desde la raíz
  obligaría a fijar además el directorio de trabajo. Nota: `docs/AGENTE.md` §7 lista
  `npm run db:generate` / `db:migrate` / `db:seed` como comandos de la raíz del
  proyecto; esos delegadores de raíz siguen **sin crearse** y quedan pendientes de
  la tarea que cierre los scripts del monorepo.
- Gotcha registrado: **`db:migrate` no lee `env.DATABASE_URL`.** `drizzle-kit` corre en
  su propio proceso y usa `drizzle.config.ts`, mientras que `client.ts` sí lee
  `env.DATABASE_URL`. Hoy ambos coinciden (`./osito.db`), pero si alguien cambia solo
  `.env` la migración y la aplicación apuntarán a bases distintas en silencio.
  Ver gotcha equivalente en `docs/MEMORY.md`.
- Deuda de T-010 detectada y cerrada aquí: `npm run format:check` fallaba por
  `server/src/db/migrations/meta/_journal.json` y `0000_snapshot.json`. Se **
  reformatearon** `schema.ts`, `client.ts` y `drizzle.config.ts` (único cambio real:
  `isAvailable` en una línea, sin cambio semántico) y se añadió
  `server/src/db/migrations/meta` a `.prettierignore`. No se reformatearon los JSON
  generados: `db:generate` los reescribe y la falla volvería. Verificado ejecutando
  `db:generate` después y volviendo a pasar `format:check`.
- Estado de `server/osito.db`: existe y está en `.gitignore` (`*.db`), junto con
  `*.db-wal` y `*.db-shm`. No se commitea.
- Impacto en otras tareas: T-012 y T-013 (seeds) ya pueden correr sobre esta base con
  `npm run db:generate`/`db:migrate` disponibles. T-020+ consumirán `db` desde
  `client.ts` con joins explícitos (ver gotcha de `db.query.*` de T-010).

---

### 2026-10-01 — T-012 (setup)
- Archivos creados: `server/src/db/seed/dishes.ts`.
  Modificado: `server/package.json` (script `db:seed`).
- Criterio verificado: tras `npm run db:migrate` sobre base limpia y luego
  `npm run db:seed`, un `SELECT` devuelve **5 filas** con nombre, descripción e
  ingredientes en **es / ru / en** reales (sin `TODO` ni placeholders). Verificado con
  una consulta directa a la base, no solo con el log del script.
- Los 5 platos son de comida casera y cubren los tipos pedidos:
  sopa (6.5), pasta (11.9), ensalada/olivier (8.75), postre (14.2) y bebida (5.25).
  Todos los precios dentro del rango 5–25 pedido.
- Comprobado con un validador que recorre las 5 filas y falla si algún campo está
  vacío, si algún texto contiene `TODO`/`placeholder`, si `is_available != 1`, si el
  precio sale de 5–25 o si la `imageUrl` no es `https://placehold.co/600x400`.
  Resultado: `sin campos vacios ni TODO`.
- **`imageUrl` usa placehold.co con color por plato** (`/600x400/<bg>/<fg>?text=<Label>`),
  no la URL desnuda, para que los 5 platos se distinguen en `/menu` mientras siga
  siendo un placeholder. Verificado con `curl`: la URL responde **HTTP 200**. El
  `text=` es una etiqueta corta en inglés (Soup, Pasta, Salad, Pie, Compote) porque el
  servicio no renderiza bien caracteres no ASCII en ese parámetro.
- **Decisión técnica: el seed es idempotente.** Borra `dishes` y reinserta dentro de una
  transacción (`db.transaction`). Así `npm run db:seed` se puede reejecutar sin
  duplicar filas: verificado ejecutándolo dos veces seguidas, el conteo sigue en 5.
  Sin esto, cada reejecución añadiría 5 filas más y el criterio "5 filas" solo se
  cumpliría la primera vez.
- Decisión tomada: el script **termina con `sqlite.close()`**. Sin cerrar el proceso se
  queda colgado por WAL, y deja la base con `-wal`/`-shm` sueltos. El cierre va al
  final del módulo, fuera de la transacción.
- Decisión tomada: log con `logger.info` de pino, no `console.log`, según
  `docs/AGENTE.md` §4.
- Gotcha registrado: **`db.transaction()` sí funciona con el driver síncrono**, al
  contrario que el encadenado de sentencias. El callback recibe un `tx` y hay que
  terminar cada sentencia con `.run()`. Es la forma de hacer el seed atómico.
- Verificación adicional: el seed se ejecuta correctamente en **los dos modos**, con
  `tsx src/db/seed/dishes.ts` (desarrollo) y con `node dist/db/seed/dishes.js` tras
  `npm run build` (producción). `dist/db/seed/dishes.js` se genera solo, porque `tsc`
  compila todo `src/`.
- `npm run typecheck` y `npm run lint` pasan en `server/`, y el archivo pasa
  `prettier --check`.
- Nota: `npm run format:check` de la **raíz** sigue en rojo, pero por 20 archivos de
  `.kilo/worktrees/romantic-organization/`, que es un worktree de Agent Manager ajeno a
  esta tarea y no está trackeado por git. No se tocó. Los archivos de esta tarea pasan
  el formato.
- Impacto en otras tareas: **T-013 (seed de admin) va a necesitar `bcrypt`, que aún no
  está instalado.** Habrá que pedirlo explícitamente; no se instaló aquí porque T-012 no
  lo necesita. Conviene decidir entonces si `db:seed` pasa a ser un runner que invoque
  `seed/dishes.ts` y `seed/users.ts`, o si se deja como script aparte, porque ahora
  `db:seed` apunta solo a los platos.

---

### 2026-10-01 — A-001 Categorías de platos
- Archivos modificados: `server/src/db/schema.ts` (tabla `categories` +
  `dishes.categoryId`), `server/src/db/seed/dishes.ts`, `docs/SPEC.md` (§6).
  Creado: `server/src/db/migrations/0001_broad_the_stranger.sql`.
- Petición del dueño del proyecto: organizar los platos por categoría. **Se modificó
  `docs/SPEC.md` con autorización explícita suya**, porque la categoría no figuraba en
  el modelo `Dish` de §6 y mis reglas prohíben tocar SPEC.md sin permiso. Queda
  anotado en SPEC que la tabla se añadió el 2026-10-01.
- Decisión de modelado (la aprobaron el dueño y las reglas del proyecto): **tabla
  `categories` separada** en vez de un enum en `dishes`. Motivo: el proyecto es
  multi-idioma desde el día 1 (SPEC §4 y AGENTE.md §2.5), y un enum en código impediría
  traducir el nombre de la categoría. Con tabla: `slug` estable para URLs y filtros,
  `nameEs/Ru/En` traducibles y `sortOrder` para reordenar el menú sin migrar.
- **Problema real encontrado: la migración generada por drizzle-kit no era aplicable.**
  `ALTER TABLE dishes ADD category_id integer NOT NULL REFERENCES categories(id)` falla
  sobre cualquier base que ya tenga platos. Verificado con los dos mensajes exactos:
  - sin default: `Cannot add a NOT NULL column with default value NULL`
  - con default no nulo: `Cannot add a REFERENCES column with non-NULL default value`
  Se probaron las dos variantes antes de concluir que SQLite no admite ninguna.
- Solución adoptada: **reescribir la migración `0001` a mano con el procedimiento
  oficial de SQLite para modificar una tabla** (crear tabla nueva con el esquema
  definitivo, copiar datos, borrar la vieja, renombrar), dentro de una transacción y con
  `PRAGMA foreign_keys = OFF` alrededor, porque mientras `dishes` está borrada las FKs
  de `order_items` y `page_views` quedarían colgando. `PRAGMA foreign_keys` es un no-op
  dentro de una transacción, así que se emite como sentencia propia antes y después;
  está explicado en el propio archivo SQL.
- La migración asigna los platos preexistentes a una categoría de reserva
  `sin-categoria` ("Sin categoría" / "Без категории" / "Uncategorized", `sort_order` 999),
  porque no hay forma de saber a qué categoría pertenecía cada uno. `npm run db:seed`
  los recrea con su categoría correcta. La categoría de reserva **no** está en el seed,
  así que desaparece al reejecutarlo.
- AGENTE.md §2.4 ("nunca modificar migraciones ya aplicadas") se respetó: la `0000` no
  se tocó y la `0001` se editó **antes de aplicarse nunca** (el journal de la base solo
  tenía la `0000`). Si hubiera estado aplicada, habría hecho falta una `0002`.
- Verificado en los dos escenarios, no solo en el fácil:
  - Base con datos (5 platos): la migración aplica, seed y resultados correctos.
  - Base vacía desde cero: `db:migrate` + `db:seed` dan 5 categorías y 5 platos.
- Comprobaciones sobre la base resultante: 5 categorías en orden (1–5), 5 platos con
  categoría asignada, 0 platos sin categoría, 0 slugs duplicados,
  `PRAGMA foreign_key_check` sin fallos, y `dishes.category_id` **rechaza** un id de
  categoría inexistente. Las FKs de `order_items` y `page_views` siguen apuntando a
  `dishes` después del rebuild, verificado con `PRAGMA foreign_key_list` antes y después.
- `db:seed` sigue siendo idempotente con las categorías: reejecutarlo deja 5 y 5, no 10.
- `npm run db:generate` responde `No schema changes, nothing to migrate`: el esquema y
  las migraciones siguen en sincronía. `typecheck`, `lint` y formato en verde.
- Impacto en otras tareas:
  - **T-020 (`GET /api/dishes`) necesita un JOIN a `categories`** para devolver el
    nombre de la categoría ya localizado; si se agrupa por `sortOrder`, el `ORDER BY`
    debe usar `categories.sort_order` y no el id.
  - T-031/T-032 (menú) tienen ya las 5 categorías con nombre en los tres idiomas.
  - T-022/T-023 (alta y edición de platos) deberán exigir `categoryId`. **Resuelto el
    2026-10-01**: el dueño decidió crear un CRUD de categorías (`T-025`–`T-028`) en vez
    de un id fijo, y **`T-026` debe implementarse antes que `T-022`**. Ver
    "Decisiones resueltas".
  - T-013 (seed de admin) sigue pendiente y necesita `bcrypt`, que aún no está instalado.

---

## Convenciones de este archivo

- Una tarea = una unidad de trabajo verificable.
- Si una tarea requiere más de 5 archivos, dividirla antes de empezar.
- Las tareas bloqueadas se marcan `[!]` y se documentan en **Decisiones pendientes**.
- Las tareas completadas no se borran: quedan como historial.
```

---
