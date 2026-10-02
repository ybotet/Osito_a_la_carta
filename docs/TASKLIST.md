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
- [x] **T-023**: `PUT /api/dishes/:id` (solo admin)
  - Criterio: actualizar solo el precio funciona; un plato inexistente devuelve 404.
    **Nota: la parte de autorización queda pendiente de T-043; ver "Notas de progreso".**
- [x] **T-024**: `DELETE /api/dishes/:id` (solo admin) — borrado lógico (`isAvailable = 0`)
  - Criterio: tras el DELETE el plato desaparece de `GET /api/dishes` pero sigue en la BD;
    si no existe, 404; responde 204 sin body. **Nota: la parte de autorización queda
    pendiente de T-043; ver "Notas de progreso".**
- [x] **T-025**: `GET /api/categories` (público)
  - Criterio: devuelve las categorías en es/ru/en según `Accept-Language`, ordenadas por
    `sortOrder`, con `slug` e `id`. **Devuelve las 5 categorías sin filtrar**; el enunciado
    pedía "con `isAvailable = 1`" pero esa columna no existe en `categories`. Decidido por
    el dueño; ver "Notas de progreso".
- [x] **T-026**: `POST /api/categories` (solo admin)
  - Criterio: rechaza con 401 sin token, con 403 si no es admin; 409 si el `slug` ya existe.
  - Nota: **debe implementarse antes que T-022**, porque `POST /api/dishes` exige
    `categoryId`.
  - **Nota: la parte de autorización (401/403) queda pendiente de T-043**, que sigue sin
    existir: no hay módulo `auth` ni `jsonwebtoken` instalado. El 409 y el resto del
    criterio sí están implementados. Ver "Notas de progreso".
- [x] **T-027**: `PUT /api/categories/:id` (solo admin)
  - Criterio: permite renombrar los tres idiomas y cambiar `sortOrder`.
  - **Nota: la parte de autorización (401/403) queda pendiente de T-043**, igual que en
    T-022, T-023, T-024 y T-026. Ver "Notas de progreso".
- [x] **T-028**: `DELETE /api/categories/:id` (solo admin)
  - Criterio: rechaza con 409 si la categoría tiene platos asociados. Se descarta el
    borrado en cascada para no perder dishes por un error de un clic; quien quiera
    vaciarla antes, borra o reasigna los platos.
  - **Nota: la parte de autorización (401/403) queda pendiente de T-043**, igual que en
    T-022, T-023, T-024, T-026 y T-027. Ver "Notas de progreso".
- [x] **T-029**: Índice en `dishes.category_id`
  - Criterio: migración aplicada y `EXPLAIN QUERY PLAN` usa el índice al filtrar por
    categoría. Pendiente de A-001: agrupar y filtrar el menú por categoría ya es un caso
    de uso real y la columna no está indexada.
  - **Nota: el índice acelera el `COUNT` por categoría, pero no siempre un `SELECT *`.**
    Medido y documentado en "Notas de progreso".
- [x] **T-029a**: `PATCH /api/dishes/:id/availability` (solo admin) — habilita/deshabilita
  - Criterio: `{"isAvailable": true}` sobre un plato deshabilitado lo devuelve al menú;
    `false` lo retira sin borrarlo. Añadida el 2026-10-01 por petición del dueño: sin esta
    vía un plato deshabilitado no tenía recuperación.
- [x] **T-029b**: `DELETE /api/dishes/:id/permanent` (solo admin) — purga física
  - Criterio: borra la fila; 404 si no existe; 409 si el plato sigue disponible o tiene
    historial (`order_items` o `page_views`). Añadida el 2026-10-01 por petición del dueño:
    hasta entonces no había forma de quitar del todo un plato retirado del menú.

---

## Fase 3 — Frontend: menú y multi-idioma

- [x] **T-030**: Configurar `react-i18next` con `es.json`, `ru.json`, `en.json`
  - Criterio: cambiar idioma cambia textos sin recargar. **Nota: los botones de idioma que
    hay ahora en `App.tsx` son de verificación, no de interfaz**; T-033 los sustituye por el
    selector de verdad en el navbar. Ver "Notas de progreso".
- [x] **T-031**: Página `/menu` que consume `GET /api/dishes`
  - Criterio: muestra todos los platos disponibles. **Verificado: los 5 platos del seed.**
    Ver "Notas de progreso" por el plato basura que había en la base.
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

### 2026-10-01 — T-023 `PUT /api/dishes/:id`
- Archivos modificados: `server/src/modules/dishes/dishes.schema.ts`, `dishes.repository.ts`,
  `dishes.service.ts`, `dishes.routes.ts`. Ningún archivo nuevo.
- Criterio verificado con peticiones reales: `PUT /api/dishes/1` con `{"price": 9.99}`
  devuelve **200** con el plato ya actualizado, y `PUT /api/dishes/999999` devuelve **404**
  con `{ error: 'Dish not found', code: 'DISH_NOT_FOUND', details: { id: 999999 } }`.
- **Decisión técnica: el schema del PUT es `createDishBodySchema.partial()`**, no una copia
  con los campos opcionales escritos a mano. MEMORY lo exigía expresamente, y además evita
  que las dos rutas diverjan: si el alta cambia una regla (`price` positiva, `trim().min(1)`,
  URL válida), el PUT la hereda sin que nadie se acuerde de actualizarla.
- **El body es de actualización parcial, no un reemplazo.** Con `.partial()` solo se
  escribe lo que llega: comprobado que un `PUT {"price": 12.5}` **no toca** nombre,
  descripción, ingredientes ni imagen. Se comparó el plato antes y después.
- **Decisión técnica: el parche se construye campo a campo en `toUpdatePatch()`**, con
  `...(body.x !== undefined && { x: body.x })` en vez de recorrer el body con
  `Object.entries`. Con `exactOptionalPropertyTypes` activo, una clave `undefined` en
  `.set()` intentaría escribir NULL sobre columnas `NOT NULL`, y en SQLite un `UPDATE` no
  distingue "no mandaste el campo" de "mándalo a NULL". Escribirlo a mano además obliga a
  revisar cada campo nuevo antes de que entre en el `UPDATE`.
- **Un body vacío (`{}`) devuelve 200 sin tocar la base.** Se comprueba la existencia del
  plato y se salta el `UPDATE`, porque un `UPDATE` sin columnas no es SQL válido. Se
  decidió no inventar un 400 para ese caso: el enunciado solo pedía 404 y no hay regla
  previa que lo exija. Si el dueño lo prefiere como error, es un cambio de tres líneas.
- `categoryId` sigue siendo opcional, pero **si viene se valida contra `categories`** y
  devuelve `400 CATEGORY_NOT_FOUND` igual que en el alta, para que la FK no reviente como
  error de SQLite. Comprobado: `{"categoryId": 9999}` → 400, `{"categoryId": 3}` → 200 y
  el plato pasa a la categoría correcta.
- **`is_available = 0` devuelve 404 también en el PUT**, igual que en el GET. Se comprobó
  ocultando un plato real: el PUT responde 404 y restaurado vuelve a 200. Consistente con
  la decisión de T-021 de no revelar qué platos existieron.
- **Los campos extra del body se descartan**, igual que en T-022: `{"hack": "x"}` da 200
  y no guarda nada. No se usó `.strict()`, por coherencia con el alta.
- Validación comprobada: `price: 0`, `price: -5`, `price: "mucho"`, `imageUrl` no válida y
  `nameEs: "   "` devuelven 400. Body JSON malformado → 400 `INVALID_JSON`. `id` inválido
  (`abc`, `0`) → 400 `VALIDATION_ERROR`. El texto ruso se guardó correcto (code points
  cirílicos verificados; el `console` de PowerShell lo muestra mal, no son datos corruptos).
- `typecheck`, `lint` y formato en verde; verificado en los **dos modos** (`tsx` y
  `node dist/app.js` tras `npm run build`), con resultados idénticos. `GET /api/health`
  sigue en 200 y el 404 global en `NOT_FOUND`.
- **Base de datos verificada sin residuos:** se hizo una copia antes de probar y se
  comparó fila a fila al terminar. Los 5 platos del seed quedaron **idénticos** a como
  estaban, incluidos los precios que se tocaron durante las pruebas.
- **Impacto en otras tareas:**
  - **T-043 tiene que añadir `requireAdmin` a este PUT.** Hasta entonces la edición de
    platos es **pública**, igual que el alta lo era en T-022. No desplegar antes de
    T-043. El criterio de 401/403 sigue pendiente y queda anotado en la tarea.
  - **T-024 (borrado lógico) no necesita cambios en el PUT**: `isAvailable` sigue sin
    aceptarse en el body, igual que en T-022. Lo decide el endpoint de borrado.
  - El admin (T-04x) necesitará leer el plato antes de editarlo para prellenar el
    formulario; de eso se encarga `GET /api/dishes/:id`, que ya devuelve todos los campos.
  - T-093 (tests) puede reusar `updateDishBodySchema` y `toUpdatePatch` para los casos de
    validación sin necesidad de nuevos fixtures.

### 2026-10-01 — T-024 `DELETE /api/dishes/:id` (borrado lógico)
- Archivos modificados: `server/src/modules/dishes/dishes.repository.ts`, `dishes.service.ts`,
  `dishes.routes.ts`. Ningún archivo nuevo.
- Criterio verificado con peticiones reales: `DELETE /api/dishes/2` devuelve **204 sin body**
  (cuerpo vacío y `content-type` ausente), el plato **desaparece de `GET /api/dishes`** (la
  lista pasó de 6 a 5) y **la fila sigue en la BD** con `is_available = 0` y el resto de
  campos intactos (precio, `name_ru`, `created_at`, `category_id` sin tocar). El total de
  filas de `dishes` se mantuvo en 6: **no se eliminó ninguna fila**.
- **Decisión técnica: el `WHERE` del UPDATE no filtra por `is_available`.** Es
  `WHERE id = ?` a secas, para que borrar un plato ya borrado sea un no-op en vez de un
  error. El 404 lo decide el servicio, que usa `findAvailableDishById` (que sí filtra por
  disponibilidad) antes de llamar al repositorio.
- **Un plato ya borrado responde 404, igual que uno que nunca existió.** Se comprobó: el
  segundo `DELETE` del mismo plato da 404 `DISH_NOT_FOUND`, no 204 ni 500. Es la misma
  decisión de T-021 de no revelar qué platos existieron, y de paso hace que el endpoint
  sea idempotente desde fuera.
- **El servicio no devuelve nada** (ni un objeto ni un id), porque el endpoint responde
  204. No se construyó una respuesta "por si acaso": el `204` del enunciado implica que
  no hay body que localizar, así que `Accept-Language` es irrelevante aquí.
- **La ruta usa `res.status(204).end()`, no `res.json()`.** `json()` emitiría un body que
  un 204 prohíbe, y Express además interpretaría un body con 204 como un bug. Verificado
  que la respuesta llega con cuerpo vacío y sin `content-type`.
- **Comprobado que el borrado no rompe el historial**, que es el motivo real del borrado
  lógico: se creó un pedido de prueba con un `order_item` apuntando al plato borrado y la
  FK siguió siendo válida (`PRAGMA foreign_key_check` vacío, `unit_price` conservado). Con
  un `DELETE` real, `order_items` y `page_views` quedarían apuntando a platos
  inexistentes. También se comprobó que `page_views` sigue admitiendo el `dish_id` de un
  plato borrado.
- Efectos colaterales verificados, todos coherentes con lo ya decidido en T-021/T-023: tras
  el borrado, `GET /api/dishes/2` y `PUT /api/dishes/2` responden 404, y el listado sigue
  localizándose bien en `ru`, `en` y sin header.
- `POST` de T-022 sigue funcionando y su plato también se puede borrar por la vía nueva.
  `PUT` sobre un plato disponible sigue en 200. `/api/health` en 200 y el 404 global en
  `NOT_FOUND`.
- `typecheck`, `lint` y formato en verde; verificado en los **dos modos** (`tsx` y
  `node dist/app.js` tras `npm run build`), con resultados idénticos.
- **Base de datos verificada sin residuos:** copia previa y comparación fila a fila de
  `dishes` al terminar, más el conteo de `orders`, `order_items`, `page_views`, `categories`,
  `users` y `notification_logs`. Todo quedó exactamente como estaba.
- **Impacto en otras tareas:**
  - **T-043 tiene que añadir `requireAdmin` a este DELETE.** Hasta entonces **cualquiera que
    alcance la API puede borrar platos**: es la vía más destructiva de las tres
    (alta, edición y borrado) y no desplegar antes de T-043. El criterio de 401/403 sigue
    pendiente y queda anotado en la tarea.
  - **No hay forma de restaurar un plato borrado.** No hay tarea para ello y no se ha
    inventado ningún endpoint: reviving un `PUT` con `isAvailable` rompería la decisión de
    T-022 y T-023 de que el body no controla la disponibilidad. Si el chef necesita
    recuperar un plato por error, hay que decidir primero cómo (endpoint propio, o
    `PATCH /api/dishes/:id/availability`).
  - T-028 (`DELETE /api/categories/:id`) tiene aquí su referencia: el criterio de esa tarea
    es devolver 409 si la categoría tiene platos, y ahora se sabe que un dish borrado
    lógicamente **sigue contando como plato asociado** para esa comprobación, porque la
    fila permanece. Es la decisión conservadora, pero conviene confirmarla.
  - T-031/T-032 (menú) no necesitan cambios: el listado ya filtraba por `is_available = 1`
    desde T-020, así que el borrado se propaga solo.

### 2026-10-01 — T-029a y T-029b `PATCH .../availability` y `DELETE .../permanent`
- Petición del dueño: faltaba poder recuperar un plato deshabilitado, y faltaba poder
  eliminarlo de verdad. Quedan tres endpoints con responsabilidades separadas.
- Archivos modificados: `server/src/modules/dishes/dishes.schema.ts`, `dishes.repository.ts`,
  `dishes.service.ts`, `dishes.routes.ts`. Ningún archivo nuevo.
- **Los tres endpoints y su semántica:**

  | Endpoint                             | Efecto                                   | Fila en BD     |
  | ------------------------------------ | ---------------------------------------- | -------------- |
  | `DELETE /api/dishes/:id`             | deshabilita (`is_available = 0`), 204    | se conserva    |
  | `PATCH /api/dishes/:id/availability` | habilita o deshabilita, 200 con el plato | se conserva    |
  | `DELETE /api/dishes/:id/permanent`   | purga, 204                               | **se elimina** |

- **Ciclo verificado de punta a punta:** deshabilitar (204, sale del listado, fila con
  `is_available = 0`) → recuperar con `{"isAvailable": true}` (200, vuelve al listado,
  `is_available = 1`) → volver a deshabilitar → purgar (204, **la fila ya no existe**, el
  `count(dishes)` bajó de 6 a 5 y `GET` del purgado da 404).
- **El purgado tiene dos 409, y ambos fueron decisiones explícitas del dueño:**
  - `DISH_STILL_AVAILABLE` si el plato sigue visible en el menú. Así el flujo es
    deshabilitar → revisar → purgar, y un plato en venta no desaparece por un clic.
  - `DISH_HAS_HISTORY` si hay `order_items` o `page_views` apuntando al plato. Se
    comprobó con los dos casos: con 1 pedido y 1 visita, y **solo con 1 visita y ningún
    pedido**. Los conteos van en `details` (`{ id, orderItems, pageViews }`) para que el
    frontend pueda decir qué bloquea el purgado. **El 409 no borra ni deshabilita nada:**
    verificado que la fila sobrevive con `is_available = 0`.
- **La razón de fondo del 409 no era hipotética: las FKs están en `NO ACTION`.** Se comprobó
  en una base desechable que un `DELETE` físico falla con `SQLITE_CONSTRAINT_FOREIGNKEY` en
  cuanto **una sola** tabla lo referencia, y que solo se borra si nada lo referencia. Por
  eso los conteos se hacen en el servicio y no se intenta el `DELETE`: el usuario recibe un
  mensaje de API, no una excepción de constraint.
- **Un dish deshabilitado es invisible para el resto del módulo**, así que el PATCH usa una
  consulta nueva, `findDishById`, que es `findAvailableDishById` sin el filtro de
  `is_available`. Sin ella no habría forma de ver el plato que se quiere recuperar.
- **`availabilityBodySchema` usa `z.boolean()` sin `coerce`, a propósito.** Comprobado que
  `{"isAvailable": "false"}` da 400 y no un `true`: con `z.coerce.boolean()` el string
  `"false"` es truthy en JS y se convertiría en "habilitar" cuando el cliente quería
  deshabilitar. También 400: `1`, `null`, `{}`, `{otro: true}` y JSON malformado.
- `isAvailable` sigue **sin** aceptarse en el body del POST ni del PUT. El PATCH es el único
  sitio del API donde el cliente controla la disponibilidad.
- `typecheck`, `lint` y formato en verde; verificado en los **dos modos** (`tsx` y
  `node dist/app.js`), con resultados idénticos.
- **Base verificada y restaurada:** estas pruebas borran filas de verdad, así que se hizo
  una copia previa y se comparó al terminar. Se repusieron los platos purgados (1, 2 y 3
  en distintas pruebas) y la tabla quedó **idéntica** a como estaba, con
  `foreign_key_check` limpio y las otras seis tablas con el mismo conteo.
- **Impacto en otras tareas:**
  - **T-043 debe añadir `requireAdmin` a los tres endpoints.** El purgado es el más
    peligroso de todos: **no desplegar antes de T-043**.
  - **T-028 (`DELETE /api/categories/:id`) ya tiene su respuesta al 409:** un dish
    deshabilitado **sigue contando como plato asociado**, porque la fila permanece. Con el
    purgado, un dish deshabilitado y sin historial puede desaparecer de verdad y liberar la
    categoría. El flujo natural es purgar primero y luego borrar la categoría.
  - T-051 (`POST /api/orders`) sigue validando disponibilidad de los platos del pedido, así
    que un plato deshabilitado no se puede pedir. Conviene que lo confirme al implementarla.
  - T-093 puede probar los dos 409 con las mismas consultas de conteo que usa el servicio.

### 2026-10-01 — T-025 `GET /api/categories`
- Archivos creados: `server/src/modules/categories/categories.routes.ts`,
  `categories.service.ts`, `categories.repository.ts`, `categories.schema.ts`, y
  `server/src/shared/language.ts`. Modificados: `server/src/app.ts` (monta el router) y
  `server/src/modules/dishes/dishes.service.ts` (consume el idioma compartido).
- Estructura de cuatro archivos según AGENTE.md §2.2, igual que `dishes`.
- **Conflicto detectado antes de escribir código y resuelto por el dueño:** el enunciado pedía
  "devuelve las categorías con `isAvailable = 1`", pero **`categories` no tiene esa
  columna**. Comprobado en la base real (`id, slug, name_es, name_ru, name_en, sort_order`)
  y en `schema.ts`, donde el único `isAvailable` es el de `dishes`. SPEC §6 también define
  `Category` sin ningún campo de disponibilidad, y el criterio de aceptación de la tarea no
  mencionaba filtrar. El dueño decidió devolver **las 5 categorías sin filtro**. Ocultar
  una categoría, si alguna vez hace falta, sería una columna nueva y una migración nueva.
- **La respuesta es `{ language, categories }`, el mismo envoltorio que `GET /api/dishes`.**
  Cada elemento lleva `id`, `slug` y `name` ya localizado. Se mantiene la forma para que
  haya una sola convención en la API.
- **`resolveLanguage` se movió a `server/src/shared/language.ts`.** MEMORY ya lo pedía desde
  T-020: "cuando exista la segunda implementación conviene moverla a un módulo
  compartido". Esta es la segunda implementación, así que se hizo en lugar de duplicar el
  parseo del header. `dishes.service.ts` ahora la importa de ahí y ya no la reexporta: los
  módulos que necesiten el idioma lo sacan de `shared`, no del servicio de platos.
- **El orden es `sort_order` y luego `id`.** Verificado de forma concluyente: **negando
  todos los `sort_order` la respuesta se invierte por completo** (`bebidas, postres,
  ensaladas, pastas, sopas`), algo que ordenar por `id` jamás daría. Y los ids de las 5
  categorías son 2, 3, 4, 5 y 6, no 1 a 5, así que el orden de la respuesta no coincide con
  el orden de ids: demuestra que manda `sort_order`.
- Criterio verificado con peticiones reales: sin header devuelve **es**; `ru` devuelve
  `Супы и бульоны, Паста и рис, Салаты, Десерты, Напитки`; `en` devuelve `Soups and broths,
  Pasta and rice, Salads, Desserts, Drinks`. Los tres idiomas traen textos distintos entre
  sí (no son traducciones mutuas), el ruso es cirílico real y ningún nombre sale vacío.
- **`Accept-Language` se probó con 14 cabeceras**, todas correctas y sin un solo fallo:
  sin header, `ru`, `en`, `RU`, `ru-RU`, `ru-RU,ru;q=0.9,en;q=0.8`, `en;q=0.8,ru;q=0.9`
  (gana el de mayor `q`, no el primero), `fr-FR,fr;q=0.9` → es, `de;q=0.9,en-US;q=0.7` → en,
  `ru;q=0` → es (un `q=0` significa "no lo quiero"), `*`, vacío, y `xx;q=abc,ru` → ru.
- **Regresión comprobada tras mover `resolveLanguage`:** `GET /api/dishes` sigue
  localizándose bien en es/ru/en (6 platos), el detalle en ruso sigue correcto, el 404 de
  dishes sigue siendo `DISH_NOT_FOUND`, `/api/health` sigue en 200 y el 404 global en
  `NOT_FOUND`.
- `typecheck`, `lint` y formato en verde; verificado en los **dos modos** (`tsx` y
  `node dist/app.js`), con resultados idénticos.
- **Base de datos verificada sin residuos:** `categories` y `dishes` comparadas fila a fila
  contra una copia previa, más el conteo de las otras cinco tablas y `foreign_key_check`.
  Todo idéntico, incluidos los `sort_order` que se movieron durante la prueba.
- **Impacto en otras tareas:**
  - **T-026/T-027/T-028 (CRUD de categorías) ya no bloquean nada más.** Este era el getter
    que el admin necesitaba para elegir categoría al dar de alta o editar un plato; hasta
    ahora `POST /api/dishes` exigía un `categoryId` que el admin tenía que saber de memoria.
  - T-031/T-032 (menú agrupado) ya pueden pintar los grupos sin adivinar los nombres: este
    endpoint da el nombre ya localizado en el idioma de la petición.
  - **T-043 tiene que proteger las escrituras de categorías**, pero este GET es **público y
    lo seguirá siendo**: es lectura de menú, como `GET /api/dishes`.
  - El `name` que devuelve este endpoint es el mismo que ya viaja dentro de
    `dish.category.name` en `GET /api/dishes`. Si divergieran, la UI pintaría dos nombres
    distintos para el mismo grupo.

### 2026-10-02 — T-026 `POST /api/categories`
- Archivos modificados (ninguno nuevo, los cuatro ya existían de T-025):
  `categories.routes.ts`, `categories.service.ts`, `categories.repository.ts` y
  `categories.schema.ts`.
- **La parte de autorización del criterio (401 sin token, 403 si no es admin) NO se puede
  cumplir todavía y queda pendiente de T-043.** Comprobado en el repositorio antes de
  escribir código: no existe `src/modules/auth`, `jsonwebtoken` no está en `package.json`
  (solo `bcryptjs`) y no hay ningún sitio que emita un JWT. `requireAdmin` es exactamente
  la tarea T-043, todavía `[ ]`. Decidido por el dueño: implementar el resto del endpoint y
  dejar el 401/403 anotado, igual que se hizo en T-022/T-023/T-024 y
  `PATCH /dishes/:id/availability`. La ruta lleva el mismo comentario
  "Falta `requireAdmin`: se conecta en T-043".
  - **Consecuencia a tener en cuenta:** hasta que T-043 exista, `POST /api/categories` es
    público, igual que las otras cinco escrituras ya implementadas. El riesgo real no es
    este endpoint por sí solo, sino que **la API no tiene ninguna escritura protegida**.
- **Body: `slug` + los tres nombres obligatorios, `sortOrder` opcional.** Decidido por el
  dueño. `sortOrder` es opcional con default 0 a propósito: el alta no debería obligar a
  decidir el orden del menú, que es justo lo que permite reordenar después (A-001).
- **El `slug` se normaliza y se valida, no se limpia en silencio.** `.trim().toLowerCase()` y
  un regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` con longitud 2-50. Se rechazan espacios, acentos y
  tildes con 400 en vez de "arreglarlos": un slug es clave de filtro y de URL, y convertir
  `niños` en algo de forma distinta a como lo haría el frontend rompe la comparación. Es la
  única validación con mensaje en español propio en el schema; el resto heredan los
  mensajes por defecto de Zod, como ya hacía `dishes.schema.ts`.
- **El `toLowerCase()` del schema hace que el 409 detecte duplicados por caja.** Verificado:
  `POST` con `slug: "SOPAS"` responde 409 igual que `"sopas"`, porque la normalización ocurre
  en Zod **antes** de que el servicio consulte la base.
- **El 409 se comprueba antes de insertar** y se lanza `ConflictError` con código
  `CATEGORY_SLUG_TAKEN` y `details: { slug }`. La comprobación existe para dar el mensaje de
  la API, no para garantizar integridad: hay `UNIQUE` en la columna.
- **La carrera de dos peticiones simultáneas con el mismo slug está cubierta** y probada:
  12 POST concurrentes con el mismo slug dieron **1 × 201 y 11 × 409**, y la tabla quedó con
  **una sola fila**. Quien pierde la carrera recibe el error del `UNIQUE` de SQLite, que el
  middleware de errores traduce a respuesta; la unicidad no depende del check del servicio.
- **El 201 devuelve la categoría ya localizada** (`{ id, slug, name }` con el nombre en el
  idioma de `Accept-Language`), con la misma forma que devuelve el listado, y no solo el id.
  Si devolviera solo el id, el frontend tendría que hacer un GET extra o reconstruir el
  nombre a mano para pintar lo que acaba de crear.
- Criterio verificado con peticiones reales: 201 en es/ru/en y en `xx` (fallback a es) y sin
  header; 409 con `CATEGORY_SLUG_TAKEN` para slug repetido y para el mismo slug en otra caja;
  400 por slug con espacios, slug con tilde, `nameRu` ausente, nombre en blanco y
  `sortOrder` no entero; 400 `VALIDATION_ERROR` con JSON malformado.
- **Regresión comprobada:** `GET /api/categories` sigue devolviendo las 5 categorías
  ordenadas por `sortOrder` y localizando igual que antes, en es y en `en`, tanto en `tsx`
  como en `node dist/app.js`.
- `typecheck`, `lint` y formato en verde; verificado en los **dos modos** (`tsx` y
  `node dist/app.js`).
- **Base de datos restaurada y verificada sin residuos:** 5 categorías, 6 platos,
  1 usuario, `foreign_key_check` limpio, y `git status` con solo los cuatro archivos de
  código. Ver gotcha del WAL abajo.
- **Impacto en otras tareas:**
  - **T-022 queda desbloqueado**: `POST /api/dishes` ya tiene el endpoint de categorías para
    dar de alta, y su `categoryId` sigue validándose contra esta tabla.
  - T-027/T-028 pueden reutilizar `categorySlugExists` para el 409 de slug duplicado, pero el
    borrado de T-028 necesitará además contar platos asociados (409 si tiene), igual que
    hizo `purgeDish` con `orderItems` y `pageViews`.
  - **T-043 tiene que proteger esta ruta** con `requireAdmin`; mientras tanto el comentario
    de la ruta lo deja explícito.
  - T-027 debería decidir si el PUT admite cambiar el `slug`. Si lo admite, hereda la
    normalización de este schema; si no, debería rechazarlo en vez de ignorarlo en silencio.

### 2026-10-02 — T-027 `PUT /api/categories/:id`
- Archivos modificados (ninguno nuevo, los cuatro ya existían desde T-025):
  `categories.routes.ts`, `categories.service.ts`, `categories.repository.ts` y
  `categories.schema.ts`.
- **La parte de autorización del criterio (401/403) NO se puede cumplir todavía y queda
  pendiente de T-043**, igual que en T-022, T-023, T-024 y T-026: no existe
  `src/modules/auth` ni `jsonwebtoken` instalado. La ruta lleva el mismo comentario.
- **El PUT admite cambiar el `slug`, no solo los nombres.** El criterio no lo menciona, y
  T-026 había dejado la decisión explícitamente pendiente para aquí. Decisión tomada:
  admitirlo, con las mismas reglas de normalización y validación que el alta (derivadas del
  mismo `slugSchema`) y 409 `CATEGORY_SLUG_TAKEN` si el slug nuevo está ocupado. Motivo:
  derivar el PUT con `.partial()` como ya hace `updateDishBodySchema` es más simple que
  mantener un schema paralelo, y con `.strict()` el PUT rechazaría el `slug` con un 400
  en vez de ignorarlo.
- **`updateCategoryBodySchema` se deriva con `.partial()`, no se reescribe.** Hereda
  `trim().min(1)` de los nombres y la normalización del slug, así que un cambio de regla en
  el alta no puede divergir del PUT.
- **`categorySlugExists` admite `excludeId` para el PUT.** Sin esa excepción, reenviar el
  slug sin cambios se rechazaría **a sí mismo** con un 409 absurdo. Verificado: `PUT` con
  `slug:"ensaladas-frescas"` sobre la categoría que ya lo tiene responde 200, no 409.
- **El 404 va ANTES que el 409 del slug, y todos los guards se resuelven antes de tocar
  datos.** Un id inexistente con un slug ocupado responde 404 y no 409: el slug es
  irrelevante si la petición no tiene ni a dónde aplicarse, y un 409 sugeriría un conflicto
  que no existe. Verificado explícitamente con `PUT /api/categories/999` + `slug:"pastas"`.
- **Un body vacío `{}` responde 200 sin escribir.** Se salta el `UPDATE` en vez de dejar que
  Drizzle genere un `SET` sin columnas, igual que hace `updateDish`.
- **El PUT devuelve `{ language, category }`, y el POST se corrigió para devolver lo
  mismo.** Este era un defecto de T-026: su POST devolvía la categoría suelta, sin
  `language`, mientras que en dishes toda escritura devuelve `{ language, dish }`. Como el
  nombre depende del idioma de la petición, sin decir cuál se resolvió el cliente no puede
  saber si lo que tiene en pantalla es la traducción o el original. Se añadió
  `categoryEnvelopeSchema` y ahora POST y PUT de categorías usan el mismo sobre.
  - **Esto cambia la respuesta de `POST /api/categories` de T-026**: antes
    `{"id":7,"slug":"x","name":"Y"}`, ahora `{"language":"es","category":{...}}`. No hay
    cliente que lo consuma todavía (se comprobó: `client/src` no menciona `slug` ni
    categorías), así que no rompe nada existente.
- Criterio verificado con peticiones reales: los tres idiomas se renombran en una sola
  llamada; `sortOrder` cambia; el nombre de la respuesta sigue el idioma de la petición
  (tras renombrar el ruso, la respuesta en `ru` trae el ruso y en `en` el inglés); un PUT
  parcial de un idioma no toca los otros dos; 409 con slug ocupado (también con distinta
  caja); 404 por id inexistente; 200 sin escribir con body vacío; 400 por nombre en blanco,
  slug con espacios, `sortOrder` no entero e id no numérico; las claves extra
  (`color`, `isAvailable`) se descartan sin efecto.
- **Regresión comprobada:** `GET /api/categories` sigue devolviendo las 5 categorías en el
  orden correcto y localizado igual que antes, y `GET /api/dishes` sigue en 200 con su
  localización. Verificado en los **dos modos** (`tsx` y `node dist/app.js`).
- `typecheck`, `lint` y formato en verde.
- **Base de datos restaurada y verificada sin residuos:** las 5 categorías con sus valores
  originales de `slug`, `sort_order` y los tres nombres, 6 platos, 1 usuario,
  `foreign_key_check` limpio y `git status` con solo los cuatro archivos de código.
- **Impacto en otras tareas:**
  - **T-028** necesita contar los platos de la categoría para su 409, igual que hizo
    `purgeDish` con `orderItems` y `pageViews`. No reutiliza nada de este PUT, pero sí
    puede usar `findCategoryById` para el 404.
  - **T-043 tiene que proteger esta ruta** con `requireAdmin`; son ya siete las escrituras
    sin proteger (T-022, T-023, T-024, T-026, T-027, T-029a, T-029b).
  - El frontend, cuando exista, tendrá que leer `category.name` dentro del sobre en lugar de
    en la raíz; es el mismo contrato que ya consume `dish` en platos.

### 2026-10-02 — T-028 `DELETE /api/categories/:id`
- Archivos modificados (ninguno nuevo): `categories.routes.ts`, `categories.service.ts` y
  `categories.repository.ts`. **No hizo falta tocar el schema**, que es la diferencia con
  un borrado lógico.
- **La parte de autorización del criterio (401/403) NO se puede cumplir todavía y queda
  pendiente de T-043**, igual que en T-022, T-023, T-024, T-026 y T-027. La ruta lleva el
  mismo comentario que las demás escrituras.
- **El borrado es FÍSICO, no lógico. Decidido por el dueño**, porque era la única decisión
  que MEMORY había dejado abierta y el criterio no la fijaba. Motivo: `categories` **no
  tiene `is_available`**, así que un borrado lógico exigiría una migración nueva; y aunque
  se añadiera, dejaría el problema de los platos huérfanos (una categoría oculta con
  platos visibles). Al ser físico, el 409 garantiza que nunca quedan referencias colgando
  y no hay nada que recuperar después.
- **Un dish deshabilitado CUENTA igual que uno disponible** para el 409, tal como MEMORY
  ya había decidido en T-029b. No es un descuido: la fila sigue existiendo y sigue
  apuntando a la categoría. `countCategoryDishes` **no** filtra por `is_available`, al
  revés que `findAvailableDishes`.
- **El conteo no es informativo: es la condición que habilita el borrado.** La FK
  `dishes.category_id` está en `NO ACTION`, así que SQLite abortaría el `DELETE` igual, pero
  el servicio responde antes con `409 CATEGORY_HAS_DISHES` y `details: { id, totalDishes }`
  en vez de dejar escapar una excepción de constraint. Es el mismo patrón que `purgeDish`.
- **El 404 va antes que el 409**, como en el PUT: si el id no existe, el conteo es
  irrelevante.
- Responde **204 sin cuerpo ni `content-type`**, con `end()` y no `json()`, igual que el
  borrado de platos. Por eso esta ruta **no toca `Accept-Language`**.
- Criterio verificado con peticiones reales:
  - 409 `CATEGORY_HAS_DISHES` con `totalDishes: 2` sobre `sopas`, que tiene 2 platos.
  - 204 al borrar una categoría recién creada y vacía, y 404 al repetir ese mismo DELETE.
  - **Flujo completo del dish deshabilitado:** categoría con un dish → `PATCH` lo
    deshabilita → `DELETE` de la categoría da **409** con `totalDishes: 1` → se purga el
    dish → `DELETE` de la categoría da **204**. Es el flujo que MEMORY ya había descrito.
  - 404 por id inexistente y al repetir el borrado, 400 por id no numérico.
  - El 204 sale con `content-type` nulo y body de longitud 0.
- **Un 404 que parecía un bug y no lo era:** tras deshabilitar un dish con `PATCH`, su
  `DELETE` lógico responde 404, porque `deleteDish` usa `findAvailableDishById`, que solo ve
  platos disponibles. Se comprobó el caso paralelo con un dish disponible (204 correcto) y
  un dish ya borrado lógicamente (404 correcto). **Comportamiento intencionado de T-024**,
  no una regresión.
- **Regresión comprobada:** `GET /api/categories` y `GET /api/dishes` siguen en 200 con sus
  5 y 6 filas. Verificado en los **dos modos** (`tsx` y `node dist/app.js`), donde el
  `dist` devuelve 409 para una categoría con platos y 404 para un id inexistente.
- `typecheck`, `lint` y formato en verde.
- **Base de datos restaurada y verificada sin residuos:** 5 categorías con sus valores
  originales de `slug`, `sort_order` y los tres nombres, 6 platos repartidos 2/1/1/1/1,
  1 usuario, `foreign_key_check` limpio y `git status` con solo los tres archivos de código.
- **Impacto en otras tareas:**
  - **Con T-028 queda cerrado el CRUD de categorías** (T-025 a T-028) y con él `A-001`: ya
    existen listar, crear, editar y borrar categorías.
  - **T-043 tiene que proteger esta ruta: son ya ocho las escrituras sin proteger**
    (T-022, T-023, T-024, T-026, T-027, T-028, T-029a, T-029b). Con esta, el borrado de
    categorías es la segunda vía más peligrosa después del purgado de platos.
  - T-029 (índice en `dishes.category_id`) afecta a este módulo: `countCategoryDishes` hace
    un `COUNT` por categoría, que es el segundo consumidor de esa columna aparte de los
    listados de platos.
  - El admin necesita una forma de **saber cuántos platos tiene** una categoría antes de
    intentar el borrado, para explicar el 409. Hoy el 409 lo dice, pero solo tras el
    intento; el `totalDishes` del error es el único sitio donde sale.

### 2026-10-02 — T-029 Índice en `dishes.category_id`
- Archivos: modificados `server/src/db/schema.ts` y `server/src/db/migrations/meta/_journal.json`;
  nuevos `server/src/db/migrations/0002_unusual_the_hand.sql` y
  `server/src/db/migrations/meta/0002_snapshot.json` (los dos últimos los genera la
  herramienta, no se escriben a mano).
- **No se tocó ninguna migración ya aplicada.** 0000 y 0001 siguen intactas, según la regla
  de MEMORY de no modificar migraciones aplicadas.
- **El índice va en el callback de la tabla, y eso no es opcional.** La primera versión lo
  declaraba suelto (`export const dishesCategoryIdIdx = index(...).on(dishes.categoryId)`):
  **compilaba y `tsc --noEmit` pasaba**, pero `drizzle-kit generate` respondió "No schema
  changes, nothing to migrate" y su propio resumen decía `dishes 0 indexes`. La forma
  correcta es el tercer argumento de `sqliteTable`: `(table) => [index('dishes_category_id_idx').on(table.categoryId)]`.
  Volver a generar dio `dishes 1 indexes` y creó la migración. Registrado como gotcha.
- La migración contiene **una sola sentencia**: `CREATE INDEX dishes_category_id_idx ON
  dishes (category_id)`.
- Criterio verificado con `EXPLAIN QUERY PLAN` sobre la base real:
  - Antes: `SCAN dishes` para `where category_id = 2`.
  - Después: **`SEARCH dishes USING INDEX dishes_category_id_idx (category_id=?)`**.
  - El `COUNT` de `countCategoryDishes` sale aún mejor: **`SEARCH dishes USING COVERING
    INDEX dishes_category_id_idx (category_id=?)`**, porque solo necesita la columna
    indexada.
  - Control: `SELECT * FROM dishes` sin filtro sigue en `SCAN`, y el listado del menú
    (join con `categories`) sigue en `SCAN d`. Es lo correcto: sin filtro por categoría, un
    índice solo añadiría coste.
- **`drizzle-kit migrate` es idempotente**: ejecutado dos veces, la segunda no duplica nada;
  y `generate` posterior vuelve a decir "No schema changes".
- **Medido a escala, con resultados que no son los esperados y conviene conocer.** Copia de
  la base a un temporal, 4 000 platos:
  - 5 categorías (800 platos cada una): el `COUNT` mejora de **118 ms a 95 ms**, pero un
    `SELECT *` por categoría sale **más lento con índice: 457 ms vs 308 ms sin él**, porque al
    devolver las filas completas hay que ir a buscarlas una a una y con el 20 % de la tabla en
    la categoría el escaneo compensa.
  - 40 000 platos en 200 categorías: el `COUNT` mejora de **46 ms a 24 ms**.
  - El índice es el que pedía el enunciado y es el correcto para el `COUNT`, que es lo que
    hace el código hoy (`countCategoryDishes` de T-028). La advertencia es para cuando se
    añada `GET /api/dishes?category=`: con pocas categorías y muchos platos por categoría,
    ese listado puede no ganar con el índice.
- **Error propio que hubo que diagnosticar: la migración desapareció de la base.** Tras
  aplicarla y verificarla, desapareció sin índice y con solo 2 filas en `__drizzle_migrations`,
  aunque el `.sql` seguía en el repo y `generate` decía "No schema changes". Causa: yo
  borré `osito.db-wal` justo después de aplicar la migración, y en modo WAL las
  transacciones se escriben primero ahí y solo se vuelcan al fichero principal en un
  checkpoint; borrar el `-wal` antes las descarta aunque drizzle-kit las diera por
  aplicadas. Se comprobó comparando el SHA256 de cada `.sql` con la fila de
  `__drizzle_migrations`. Solución: `PRAGMA wal_checkpoint(TRUNCATE)` antes de tocar los
  sidecars, y reaplicar la migración. **Verificado que tras el checkpoint, borrar los
  sidecars ya no pierde nada.** Registrado como gotcha, es la trampa más destructiva del
  proyecto porque no da ningún error.
- **Regresión comprobada con la migración aplicada:** `GET /api/categories` (5 categorías,
  orden correcto), `GET /api/dishes` en es y en ru (6 platos, localización intacta),
  `GET /api/dishes/1`, 404 de dish inexistente, 409 al borrar una categoría con platos, 404
  al borrar una inexistente y `/api/health` en 200.
- `typecheck`, `lint` y formato en verde. El índice es invisible para la API: no cambia
  ningún contrato.
- **Base de datos verificada sin residuos:** 5 categorías, 6 platos repartidos 2/1/1/1/1,
  1 usuario, `foreign_key_check` limpio, sin tablas de prueba (`dishes_copy` no existe) y
  `git status` con solo los cuatro ficheros de la migración y el schema.
- **Impacto en otras tareas:**
  - **Con T-029 se cierra la parte de A-001 que quedaba**: el CRUD de categorías y el índice
    que lo hace escalable.
  - **`GET /api/dishes?category=` sigue sin existir** y es el consumidor natural del índice.
    Es lo que anotó T-028 como deuda; ahora tiene el índice debajo, pero la ruta no está.
  - `dishes.is_available` sigue sin índice: no se ha pedido, y con el menú entero en pantalla
    el `SCAN` es razonable.

### 2026-10-02 — T-030 `react-i18next` en el cliente
- Archivos nuevos: `client/src/locales/es.json`, `ru.json`, `en.json` y
  `client/src/lib/i18n.ts`. Modificados: `client/package.json`, `package-lock.json`,
  `client/src/main.tsx` (importa la configuración) y `client/src/App.tsx` (pasa a usar `t()`).
- **Dependencias instaladas con permiso explícito del dueño**, como pedía el enunciado:
  `i18next@26.4.2`, `react-i18next@17.0.15` e `i18next-browser-languagedetector@8.2.1`, en el
  workspace `@osito/client`. `npm audit` sigue en **0 vulnerabilidades**. Las tres son las que
  nombra la tarea; si alguna sobra al añadir más idiomas, se quita entonces.
- **Las traducciones van importadas en el bundle, no por HTTP.** `backend: 'i18next-http-backend'`
  abriría una petición por idioma en el arranque y, con las peticiones ya a un proxy
  `/api`, además atravesaría Nginx en producción. Con doce claves por idioma no hay motivo.
- **`supportedLngs` + `nonExplicitSupportedLngs: true`.** Es el equivalente en el cliente de
  lo que ya hace `resolveLanguage` en `server/src/shared/language.ts`: sin lo segundo, un
  navegador en `ru-RU` se descartaría por no estar literalmente en la lista. Verificado que
  `ru-RU` da el ruso, `es-419` el español y `en-US` el inglés.
- **`escapeValue: false`**, que es lo que react-i18next recomienda: React ya escapa al
  renderizar, y escapar dos veces rompería textos con acentos en lugar de arreglarlos.
- **El orden de detección es `navigator` y después `localStorage`**, al revés de lo que suele
  ser por defecto. Si `localStorage` fuera primero, el usuario se quedaría en el idioma de su
  última visita aunque su navegador esté en otro. Con `navigator` primero, T-033 puede guardar
  ahí la elección y ganarla solo cuando el usuario la haya hecho.
- **El fallback es `es`**, el mismo valor que el default de `users.preferred_lang` en el
  esquema y que el `DEFAULT_LANGUAGE` del backend. Verificado que un idioma sin recursos
  (`de`) resuelve a español.
- **`App.tsx` lleva botones de idioma solo para poder comprobar el criterio.** No son interfaz
  final: T-033 los sustituye por el selector del navbar, que es lo que corresponde. Está
  anotado en la tarea para que no se confundan con trabajo pendiente de diseño.
- Criterio verificado ejecutando i18next con la misma configuración y los mismos JSON:
  **las 12 claves cambian de valor al cambiar de idioma**, ninguna se queda igual entre
  `es`, `ru` y `en`. Como `useTranslation` se suscribe a i18next, eso es lo que React pinta
  sin recargar.
  - También comprobado que el bundle de producción lleva dentro las traducciones de los tres
    idiomas (`Осито а ля карта`, `Загружаем меню…`, `Оформить заказ`…), que no es lo mismo que
    confiar en el fichero de configuración.
- **Los tres JSON tienen exactamente las 12 claves exigidas**, sin faltan ni sobras en ningún
  idioma, y **ningún valor vacío**. Los títulos son los tres distintos y correctos:
  `Osito a la carta` / `Осито а ля карта` / `Osito a la carte`.
- **El ruso es cirílico real, no transliterado**, comprobado con expresión regular en
  `nav.menu`, `menu.loading` y `cart.checkout`.
- `typecheck` y `lint` del **workspace raíz completo** (servidor y cliente) en verde, y
  `vite build` correcto (47 módulos).
- **Detalle documentado:** `changeLanguage('EN')` y `changeLanguage('RU')` en mayúsculas
  caen al fallback `es` en vez de resolver al idioma. No rompe nada (el resultado es español,
  que es el fallback previsto), pero quien lo use debería pasar el idioma en minúsculas.
  El detector del navegador nunca entrega mayúsculas, así que solo afecta a código propio.
- **Impacto en otras tareas:**
  - **T-033 ya tiene la infraestructura:** el `caches: ['localStorage']` y el orden de
    detección están puestos, así que el selector del navbar solo tiene que llamar a
    `changeLanguage` y quitar los botones provisionales de `App.tsx`.
  - **T-031 y T-032 ya pueden usar `t()`** sin configurar nada más.
  - **El idioma de la UI y el del contenido son el mismo `i18n.language`**, que es lo que
    hace falta para que `Accept-Language` que mande el cliente coincida con lo que ve el
    usuario. Ninguna tarea anterior lo fijó; queda así por coherencia con el backend.
  - Cuando exista T-050 (preferencias de usuario), `preferred_lang` de la tabla `users`
    tiene que pasar a fijarse con `changeLanguage` al hacer login, y no solo con lo que diga
    el navegador.

### 2026-10-02 — T-031 Página `/menu` con TanStack Query
- Archivos nuevos: `client/src/pages/Menu.tsx`, `client/src/api/dishes.ts` (el `fetch`) y
  `client/src/api/dishes.types.ts` (los tipos). Modificados: `client/src/main.tsx`
  (`QueryClientProvider` y `BrowserRouter` con las rutas) y los tres JSON de `locales`, que
  se ampliaron con `menu.error`.
- **Dependencias instaladas**, como pedía el enunciado:
  `@tanstack/react-query@5.104.1` y `react-router-dom@7.18.4` en `@osito/client`.
  `npm audit`: 0 vulnerabilidades.
- **Había un plato basura en la base y hubo que borrarlo antes de poder verificar.** La base
  tenía **6** platos, no los 5 del seed: el `id` 11 con nombre `ffd`, descripción `bkswx` e
  ingredientes `dada`, escrito a mano. El hueco en el `id` (5 → 11) indicaba que había más.
  **Decidido por el dueño borrarlo**, y se hizo por la vía de la API, que es la que deja
  registro: `DELETE /api/dishes/11` (lógico, 204) y luego `DELETE /api/dishes/11/permanent`
  (204). Comprobado que el purgado exige el deshabilitado previo, y así se obtuvo el 409 que
  devuelve `DISH_STILL_AVAILABLE`.
- **El idioma va en la `queryKey` a propósito.** `['dishes', language]`: si no, al cambiar de
  idioma TanStack serviría la caché de la petición anterior y la pantalla se quedaría en el
  idioma viejo. Con el idioma en la clave cada idioma tiene su entrada y volver al anterior no
  vuelve a pedir nada.
- **`fetchDishes` recibe el idioma como parámetro y no lee `i18n` dentro.** Quien llama ya lo
  tiene de `useTranslation`, y así la función no depende del singleton de i18n y es
  comprobable sin montar React. Es lo que permite verificar por separado que el header sale
  bien.
- **El precio se formatea con `Intl.NumberFormat` en el idioma de la respuesta**, no con
  `toFixed`. El separador cambia (`11,90 €` en español, `11.90 €` en inglés) y el precio llega
  ya localizado; formatearlo en otro idioma daría un número descuadrado con el resto.
- **`staleTime: 30_000`** en el `QueryClient`: el menú cambia poco y con el valor por defecto
  (0) cada montaje volvería a pedir la lista. `retry` se deja en 3 a propósito, para que un
  fallo de red en desarrollo se resuelva solo antes de mostrar el error.
- **Los cuatro estados se comprueban en el orden carga → error → vacío**, que es el único
  correcto: al revés se ve el error de la petición anterior mientras se pide la siguiente.
- **Se añadió `menu.error` a los tres idiomas** (faltaba para el estado de error) y se
  comprobó que los tres JSON siguen con **13 claves**, iguales en los tres.
- Criterio verificado:
  - `GET http://localhost:5173/menu` responde 200 y el proxy `/api` trae los **5 platos** del
    seed, con su categoría localizada.
  - **`Accept-Language` se propaga de verdad:** por el proxy de Vite, `es` devuelve
    `Супы и бульоны`-style en ruso (`Овощной суп`) y `language: ru`. Y en la función,
    `fetchDishes('es'|'ru'|'en')` manda exactamente ese valor en el header.
  - Los **cuatro estados** renderizados con React: carga pinta 4 skeletons y ningún plato ni
    mensaje de vacío; con datos pinta **exactamente 5 tarjetas `<li>`** con los 5 nombres, 5
    `alt`, el precio en `11,90 €` y ninguno de los mensajes de vacío ni de error; vacío
    pinta el mensaje y ningún skeleton.
  - **El estado de error no se ha podido renderizar en la verificación automática, y conviene
    saber por qué.** Con la caché de TanStack en error de verdad (`CATEGORY_NOT_FOUND`), el
    render sigue dando `isPending`. Se comprobó con una sonda mínima que hace la misma llamada
    a `useQuery`: también devuelve `isPending`. Es un límite de `renderToStaticMarkup` —el
    observer arranca en `pending` porque no hay montaje real en cliente—, **no un fallo de
    `Menu.tsx`**. Lo que sí está verificado del camino de error es la capa de API: un 404
    lanza `ApiError` con `status: 404` y `code: 'CATEGORY_NOT_FOUND'`, y una respuesta que no
    es JSON da `UNKNOWN_ERROR` en vez de propagar el error de parseo. Para verlo de verdad
    basta con parar el servidor y recargar `/menu`.
- **No hay navegador automatizado en el proyecto** (ni playwright ni jsdom), así que la
  comprobación se hizo renderizando con `react-dom/server` y comprobando el HTML. No se
  instaló ninguno: sería una dependencia que la tarea no pide.
- `typecheck` y `lint` del **workspace raíz** en verde, `vite build` correcto y Prettier limpio.
- **Base de datos verificada:** 5 platos (los del seed, con sus tres idiomas), 5 categorías,
  1 usuario, `foreign_key_check` limpio, **cero filas** con el contenido basura.
- **Un obstáculo propio que hubo que resolver:** el puerto 5173 estaba ocupado por un Vite de
  T-030 que había quedado vivo, y el nuevo no arrancó ("Port 5173 is already in use"). Se
  localizó el PID, se comprobó que era un `vite.js` nuestro antes de matarlo, y se arrancó de
  nuevo.
- **Impacto en otras tareas:**
  - **T-032 (`DishCard`) tiene el trabajo hecho dentro de `Menu.tsx`:** la tarjeta ya pinta
    imagen, nombre, descripción, ingredientes y precio, con `alt` en la imagen y el precio
    localizado. Extraerla a `components/DishCard.tsx` es mover código, no escribirlo.
  - **T-033 tiene lo difícil hecho:** `QueryClientProvider` y el router ya están montados en
    `main.tsx`.
  - **La navegación no existe todavía.** `main.tsx` monta `App` en `/` y `Menu` en `/menu`,
    pero no hay navbar ni enlaces: llegar a `/menu` es escribiendo la URL. Es lo coherente con
    el orden de tareas, porque el navbar es cosa de T-033.
  - El endpoint ya devuelve `category` con `id`, `slug` y `name` localizado, y el tipo
    `ApiDish` ya lo incluye: agrupar por categoría para T-031/T-032 no necesita tocar la API.
  - Sigue **sin haber forma de filtrar el menú por categoría** (`GET /api/dishes?category=`),
    que es lo que dejó anotado T-028 y ahora tiene el índice de T-029 debajo.

### 2026-10-02 — Deuda acumulada hasta T-025 (fuera de tarea)
- Petición del dueño: revisar los gotchas que son deuda **de lo ya hecho**, dejando que las
  deudas futuras se resuelvan por el camino. Se revisaron los 74 gotchas registrados.
- **Mayoría no eran deuda:** son conocimiento ya asimilado (parseo de `Accept-Language`,
  `NO ACTION` de SQLite, extensión `.js` en imports). No se "arreglan", ya están resueltos
  por estar escritos. La sección sigue como está.
- **Tres sí eran deuda real y verificados hoy contra el código:**
  - `PORT` "no está validado todavía" → falso: `app.ts:20` hace `app.listen(env.PORT)` y
    `env.ts:78` lo valida con Zod.
  - `LOG_LEVEL` "cae a `info` con un fallback" → falso: `logger.ts:5` usa `env.LOG_LEVEL`,
    que es un `z.enum` de los 7 niveles; un valor inválido ahora es error de arranque.
  - "El backend todavía no sirve nada" (sin tachar, duplicado de otra ya resuelta) →
    `/api/health` responde 200.
  Los tres se **tacharon con la evidencia concreta**, sin borrar el texto original. Se pidió
  "borrar y reescribir", pero el prompt del proyecto prohíbe borrar entradas de MEMORY, así
  que se usó el formato `~~tachado~~ → SUPERADO` que ya usan otras entradas del archivo.
- **Numeración corregida:** mis dos tareas de disponibilidad pasaron a **T-029a/T-029b**
  al renumerar el TASKLIST. Se corrigieron las cabeceras de mis entradas en TASKLIST y
  MEMORY y se añadió la nota de equivalencia. Las menciones a T-031/T-032 que hablan del
  frontend se dejaron intactas porque siguen siendo correctas.
- **Unificada la ruta de la base de datos** (deuda real, ya resuelta): `drizzle.config.ts`
  tenía `'./osito.db'` hardcodeado mientras `client.ts` leía `env.DATABASE_URL`. Nuevo
  `server/src/db/database-url.ts` como fuente única, usado por ambos.
- **Dos restricciones comprobadas antes de elegir el diseño:**
  1. **drizzle-kit no carga el `.env`**: con un `.env` correcto, `process.env.DATABASE_URL`
     llegaba a `drizzle.config.ts` como `undefined`. Leer `process.env` ahí habría seguido
     divergiendo en silencio.
  2. **Importar `config/env.ts` desde la config no vale**: se probó y funciona, pero
     `env.ts` hace `process.exit(1)` si falta cualquier variable, y **`db:generate` moría
     pidiendo `MAILGUN_API_KEY`** para generar una migración. Regresión real, evitada.
- **Verificado:** `db:generate` y `db:migrate` funcionan; `db:generate` **también funciona
  sin `MAILGUN_API_KEY` ni `TELEGRAM_BOT_TOKEN`** (exit 0); y cambiando `DATABASE_URL` a
  `./probe-unified.db`, las tres lecturas (`resolveDatabaseUrl()`, `drizzle.config.ts`,
  `env.DATABASE_URL`) devolvieron el valor nuevo. `typecheck`, `lint`, `format` y `build`
  en verde, endpoints de dishes y categories con normalidad, base sin cambios.
- **Lo que queda para sus tareas correspondientes:** autorización (T-043), i18n de los
  mensajes de error (frontend), `updatedAt` y auditoría. Nada de eso se ha tocado aquí.
- Archivos modificados: `server/drizzle.config.ts`, `server/src/db/client.ts`. Creado:
  `server/src/db/database-url.ts`. Modificados: `docs/TASKLIST.md`, `docs/MEMORY.md`.

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
