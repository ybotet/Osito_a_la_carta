# TASKLIST.md — Osito a la carta

> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completada · `[!]` bloqueada
> Última actualización: 2026-10-03

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
- [x] **T-032**: Componente `DishCard` (imagen, nombre, descripción, ingredientes, precio)
  - Criterio: se ve correctamente en móvil y desktop. **Verificado: 1 columna en móvil y
    3 en desktop** (`grid-cols-1 lg:grid-cols-3`). Ver "Notas de progreso" por las dos cosas
    que el enunciado daba por hechas y no existían.
- [x] **T-033**: Selector de idioma en navbar, persistido en `localStorage`
  - Criterio: al recargar, mantiene el idioma elegido. **Verificado de punta a punta: con el
    navegador en `es-ES`, el usuario pulsa `RU` y en el proceso siguiente (que es una recarga)
    i18next resuelve `ru`, no `es`.** Ver "Notas de progreso" para los cinco escenarios.
  - **Nota: la tarea estuvo `[!]` bloqueada el 2026-10-02** porque el criterio era
    incompatible con el orden de detección que había dejado T-030. El dueño autorizó invertirlo
    y quedó corregido en `client/src/lib/i18n.ts`; la decisión antigua **no se ha borrado** de
    `docs/MEMORY.md`, sigue documentada junto a la nueva.
- [x] **T-034**: Página `/menu/:id` con detalle del plato
  - Criterio: muestra todos los datos del plato y botón "agregar al carrito".
  - Criterio del enunciado de T-034 (click en un plato del menú navega al detalle y muestra los
    datos correctos): **verificado contra la API real en marcha.** La tarjeta del menú emite el
    enlace `href="/menu/7"` en la imagen y en el nombre, y `/menu/1` renderiza el plato que
    devuelve `GET /api/dishes/1` en es, ru y en. **Lo que no se ha hecho es un clic real en un
    navegador** (el proyecto no tiene navegador automatizado): el enlace y la ruta se han
    comprobado en el HTML renderizado. Ver "Notas de progreso".
- [x] **T-035**: Estilos base con Tailwind + shadcn/ui (botones, cards, navbar)
  - Criterio: UI coherente y responsive. **Cumplido:** el navbar tiene logo, enlaces y selector
    de idioma; `DishCard`, el detalle y los skeletons del menú se pintan con `Card`; los
    botones son el `Button` de shadcn con sus variantes; y el tema son tokens reales en
    `index.css`, no colores sueltos.
  - **El enunciado ("instalar y configurar shadcn/ui") era incorrecto y la tarea se hizo sobre
    el estado real**, que es lo que estaba bloqueado el 2026-10-02. Resuelto:
    1. **El tema, que era lo que faltaba de verdad**, está en `client/src/index.css` con
       `@theme inline` (Tailwind 4 es CSS-first, así que no hay `tailwind.config.js`), con la
       paleta `stone` literal de Tailwind. Verificado en el CSS de producción: `.bg-primary`
       sale como `background-color: var(--primary)`.
    2. **`components.json` se movió de la raíz a `client/`**, que es donde la CLI lo encuentra.
       Con el fichero donde estaba, `npx shadcn add` fallaba con `Failed to load tsconfig.json`.
    3. **Componentes del registro:** `button` (con `Slot` y `asChild`), `card`, `input` y
       `label`. `dropdown-menu` y `toast` **no** se instalaron: son 4 archivos más, necesitan
       `@radix-ui/react-dropdown-menu` y `@radix-ui/react-toast` (Radix se denegó en T-033) y no
       tienen consumidor. Van en **T-092**, que es quien los usa. Ver "Decisiones resueltas".
  - **El `Button` de T-032 era una imitación y ahora es el de shadcn.** Se borró
    `ui/button-variants.ts`, que solo existía porque el `Button` antiguo no tenía `asChild`;
    `DishDetail` puede volver a enlazar con `<Button asChild><Link/></Button>` en vez de copiar
    las clases del botón a mano.
  - **El navbar enlaza solo a lo que existe:** `/menu` funciona y carrito e inicio de sesión salen
    deshabilitados, porque `/cart` (T-053) y `/login` (T-044) aún no están. No se inventó un
    logotipo de imagen: el logo es el nombre de la app enlazado a `/`.
  - **La tarea estuvo `[!]` bloqueada el 2026-10-02** y el dueño autorizó resolverla en dos
    partes: aquí los componentes y el tema, y en T-092 los overlays. Las entradas del bloqueo
    en "Notas de progreso" y en `MEMORY.md` **no se han borrado**, siguen documentadas junto a
    estas.

---

## Fase 4 — Autenticación

- [x] **T-040**: `POST /api/auth/register` con validación Zod
  - Criterio: rechaza email duplicado con error claro. **Verificado con peticiones reales:** alta
    nueva → **201** con `{ id, email, role, preferredLang }`; el mismo email otra vez → **409**
    `EMAIL_TAKEN`. Ver "Notas de progreso" para el resto de la matriz de verificación.
  - El módulo se creó con los cuatro ficheros de AGENTE.md §2.2 y el `role` lo fija el
    repositorio a `customer`: **no se acepta desde el body**, así que un `{"role":"admin"}` se
    ignora (probado: devuelve 201 y el usuario queda como `customer`).
  - **El `passwordHash` no sale nunca:** la proyección de la respuesta no lo contempla, así que
    no depende de acordarse de quitarlo. Verificado en la fila de la BD y en el `SELECT`.
- [x] **T-041**: `POST /api/auth/login` (devuelve access + refresh token)
  - Criterio: access token expira en 15 min, refresh en 7 días. **Verificado decodificando los
    tokens emitidos:** `(exp - iat) = 900 s` en el access y `604800 s` en el refresh, y los
    claims son `{ type, email, role, sub }` y `{ type, sub }`.
  - Login correcto → **200** con `{ accessToken, refreshToken, user: { id, email, role,
    preferredLang } }`; el `user` **no trae `passwordHash`** (mismo `userSchema` del registro).
  - Credenciales incorrectas → **401** `INVALID_CREDENTIALS`, **con el mismo mensaje y el mismo
    `code` si el email no existe**, para no decir qué emails están registrados.
  - **Los dos tokens van firmados con secretos distintos** (`JWT_SECRET` y `JWT_REFRESH_SECRET`)
    y llevan un claim `type` que los distingue. Verificado que son intercambiables: el refresh
    **no** verifica con `JWT_SECRET` (`invalid signature`) y el access **no** verifica con
    `JWT_REFRESH_SECRET`. T-042 y T-043 tienen que exigir su `type`.
  - `jsonwebtoken` instalado con autorización del enunciado, que lo nombra
    (`server/package.json`, `package-lock.json`). Ver "Notas de progreso".
- [x] **T-042**: `POST /api/auth/refresh`
  - Criterio: renueva access token con refresh válido. **Verificado:** con un refresh válido
    devuelve **200** y solo `{ accessToken }`, con `(exp - iat) = 900 s` (15 min exactos) y `alg`
    `HS256`; verificado además que el token nuevo **no** acepta `JWT_REFRESH_SECRET`.
  - Refresh inválido **o caducado** → **401** `INVALID_REFRESH_TOKEN`, con el mismo `code` para
    todos los fallos (firma que no cuadra, token caducado, `type` equivocado, `sub` inválido,
    usuario borrado).
  - **El usuario se relee de la base por `sub`**: una cuenta borrada no puede renovar aunque su
    refresh siga sin caducar (probado). El token nuevo lleva el rol y el email **actuales**.
  - **El refresh token no se renueva y no se devuelve `user`**: la rotación real exige tabla de
    tokens revocados, que sigue siendo decisión de T-045.
- [x] **T-043**: Middleware `requireAuth` y `requireAdmin`
  - Criterio: rutas protegidas devuelven 401 sin token. **Verificado con peticiones reales**
    contra las nueve escrituras (las seis de platos y las tres de categorías): sin token →
    **401** `UNAUTHORIZED` en las nueve; con token de `customer` → **403** `FORBIDDEN` en las
    nueve; con token de `admin` → la operación se ejecuta (`POST` 201, `PUT`/`PATCH` 200,
    `DELETE` y `DELETE .../permanent` 204). Ver "Notas de progreso" para el resto de la
    matriz de verificación.
  - `requireAdmin` es `requireAuth` seguido de la comprobación de rol, y por eso el **401 va
    antes que el 403**: sin sesión no se dice ni si la ruta existe.
  - **`requireAuth` exige `type === 'access'` y verifica con `JWT_SECRET`**
    (`algorithms: ['HS256']` explícito, como pusieron T-041 y T-042): un refresh token usado
    como credencial de una escritura es 401, igual que un access caducado o firmado con el
    secreto equivocado. Los nueve 401 llevan el mismo `code`, sin decir qué falló.
  - **El `role` se cree del token, sin consultar la base.** Un admin degradado conserva el
    acceso hasta 15 minutos (o 7 días si el cliente lo renueva); la deuda y el arreglo
    (releer el usuario en `requireAdmin`, que ya tiene `findUserById`) están anotados.
  - `req.user` es **opcional** en el tipo (`user?`), a propósito: marcarlo obligatorio haría
    que TypeScript garantizase una sesión en las rutas públicas, donde no existe.
  - **Se protegieron también las tres escrituras de categorías**, que T-026, T-027 y T-028
    dejaron explícitamente pendientes de T-043 ("la parte de autorización del criterio
    queda pendiente de T-043"). Con esto **la API ya no tiene ninguna escritura pública.**
- [x] **T-044**: Páginas `/login` y `/register` en frontend
  - Criterio: el formulario usa React Hook Form + Zod. **Verificado contra la API real**
    (no una copia): las reglas compartidas rechazan en el cliente exactamente lo mismo que
    rechaza el servidor, con el mismo mensaje; el registro (201) seguido del auto-login
    (200 con los dos tokens) deja sesión en el store; el login con credenciales malas lanza
    `ApiError 401 INVALID_CREDENTIALS`, que es lo que la página pinta.
  - **Tras registrarse, la página entra sola**: `POST /api/auth/register` (T-040) devuelve
    **solo** el usuario, sin tokens, así que la página hace `register` y después `login` con
    las mismas credenciales. Es lo que hace falta para el criterio ("redirige a `/menu`
    **autenticado**") sin tocar un endpoint ya verificado.
  - **El error va dentro del formulario con `role="alert"`, no en un toast.** El sistema de
    avisos (`ErrorBoundary` + toasts) y el componente `toast` de shadcn son de **T-092**, por
    decisión registrada del dueño; instalarlos aquí los dejaba sin consumidor y repetía la
    denegación de Radix de T-033.
  - **Los mensajes se eligen por `code`, no se pintan los del backend.** El backend responde
    en español (T-040) y traducirlos a posteriori sería frágil; con `INVALID_CREDENTIALS` y
    `EMAIL_TAKEN` hay clave propia en es/ru/en. Verificado que **el texto del backend no llega
    al bundle del cliente**.
  - **Las reglas de validación viven ahora en `shared/schemas.ts`**, no duplicadas: el
    formulario pinta el mensaje en el idioma de la interfaz y el servidor sigue contestando
    en español con los mismos textos que antes. Esto obligó a cambiar el `rootDir` del
    servidor (ver "Decisiones resueltas").
  - `preferredLang` se manda con el idioma que está viendo el usuario y se comprueba contra
    la lista de los tres antes de enviarlo.
- [x] **T-045**: Store de sesión con Zustand + persistencia en `localStorage`
  - Criterio: al recargar, la sesión se mantiene si el token es válido. **Verificado con dos
    procesos distintos** (el segundo carga el mismo `localStorage`): `setSession` deja
    `{"state":{"user":…,"accessToken":…,"refreshToken":…},"version":0}` bajo la clave
    `osito-auth`, y el proceso nuevo **rehidrata los tres campos sin dejar correr una sola
    microtask** (`persist.hasHydrated() === true`). `clearSession` los pone a `null` y
    **vuelve a escribir el `localStorage`**, así que la sesión no reaparece al recargar.
  - `isAuthenticated` es **derivado con un selector** (`useIsAuthenticated`), no un booleano en
    el estado: guardado en el estado habría que mantenerlo a mano en cada `set` y se
    quedaría viejo en cuanto hubiera una tercera forma de cambiar el estado. Exige `user`
    **y** `accessToken`: con solo uno de los dos no hay sesión usable.
  - Se persisten **solo los tres campos de dato**, no el estado entero (`partialize`).
  - **`ApiAuthUser` vive en `client/src/api/auth.types.ts`, no en el store:** es la forma del
    cable de `/api/auth/login`, y el `user` del store es exactamente ese objeto.
  - Se instaló **`zustand@5.0.15`** (lo nombra el enunciado de la tarea). Sin vulns nuevas.
  - **Limitación de la verificación, y no del store:** con `renderToStaticMarkup` el hook
    devuelve `false` aunque haya sesión rehidratada, porque `useSyncExternalStore` usa
    `getInitialState()` como snapshot de servidor. En el navegador no pasa: el store se
    rehidrata al cargar el módulo, antes del primer render. Ver "Notas de progreso".
- [x] **T-046**: Interceptor de fetch que añade `Authorization` y maneja 401
  - Criterio: si el access expira, hace refresh automático.
- [x] **T-047**: Imágenes de platos en la VPS + `POST /api/dishes/:id/image`
  - Criterio: un admin sube una imagen, se guarda en disco con nombre UUID, la ruta se guarda en
    `dishes.image_url` y la API la devuelve como URL absoluta construida con `PUBLIC_ORIGIN`.
  - **Nota:** tarea añadida por el dueño, fuera del enunciado original, para resolver la
    decisión de "dónde alojar las imágenes" que estaba pendiente. Ver "Decisiones resueltas" y
    "Notas de progreso".

---

## Fase 5 — Carrito y pedidos

- [x] **T-050**: Store de carrito con Zustand persistido en `localStorage`
  - Criterio: agregar, quitar y modificar cantidades funciona tras recargar.
- [x] **T-051**: `POST /api/orders` con validación Zod y transacción
  - Criterio: crea `Order` + `OrderItem` atómicamente.
  - **Notas de progreso (2026-10-05):** módulo `orders` con los cuatro archivos de
    AGENTE.md §2.2 (`orders.routes.ts`, `orders.service.ts`, `orders.repository.ts`,
    `orders.schema.ts`). Ruta protegida con `requireAuth` y el `userId` sale del token,
    nunca del body. El body ignora `status`, `total`, `userId` y `id` (Zod sin
    `.strict()`), y el `status` lo fija el repositorio a `pending`. `items` rechaza
    duplicados con un `refine` y la cantidad mínima es 1 (sin `coerce`, así `true`
    falla y no se convierte en 1). Platos no existentes o deshabilitados devuelven
    `400 DISH_UNAVAILABLE` con la lista de ids faltantes, no un 404, para que el cliente
    sepa cuál quitar del carrito. El total se calcula con los precios actuales en una
    sola consulta y se redondea a céntimos, igual que el total del carrito (T-050).
    La escritura entera va en `db.transaction`: o entran el pedido y todas sus líneas, o
    no entra nada. La respuesta es `{ language, order }` con el pedido leído de la base
    y los nombres localizados por `Accept-Language`. Notificaciones pendientes de T-063.
    Verificado contra una base de prueba (`server/probe-orders.db`): 201 con el total
    correcto (3 x 11,9 = 35,7), líneas en es/ru/en, nota de 500 chars aceptada y
    espacios vacíos guardados como `NULL`, 400 en todos los casos de validación, 401 sin
    token y con refresh token, y el 400 de plato deshabilitado no escribe nada.
- [x] **T-052**: `GET /api/orders` (historial del usuario autenticado)
  - Criterio: solo devuelve pedidos del propio usuario.
  - **Notas de progreso (2026-10-07):** ruta `GET /api/orders` protegida con `requireAuth`.
    El `userId` sale del token, nunca del body ni de los params. La respuesta es `{ language,
    orders }`, el mismo envoltorio que usa `POST /api/orders` para la respuesta de un pedido
    concreto, así que la API no tiene dos convenciones para contenido localizable. Los items
    incluyen `dishId`, `name` (localizado por `Accept-Language`), `quantity` y `unitPrice`.
    El orden es `created_at DESC`. Verificado con peticiones reales: un usuario ve solo sus
    pedidos, no los de otros; la localización responde en es/ru/en; sin token devuelve 401.
- [x] **T-053**: Página `/cart` con resumen y botón "confirmar pedido"
  - Criterio: redirige a `/orders/:id` tras confirmar.
  - **Notas de progreso (2026-10-07):** creada `client/src/pages/Cart.tsx` con la lista de
    items del carrito (imagen, nombre, precio unitario, cantidad editable, subtotal), botón
    de eliminar por item, resumen de total de items y total a pagar, campo de nota opcional
    para el chef y botón "Confirmar pedido" que llama a `POST /api/orders`. Si no está
    autenticado redirige a `/login`. En éxito limpia el carrito y redirige a `/orders/:id`.
    Los textos usan las claves de `locales/cart` en es/ru/en. Verificado compilación y build
    del cliente. El flujo HTTP del pedido ya estaba verificado en T-051/T-052.
- [x] **T-054**: Página `/orders` con historial de pedidos
  - Criterio: muestra estado, fecha y total de cada pedido.
  - **Notas de progreso (2026-10-07):** creada `client/src/pages/Orders.tsx` que consume
    `GET /api/orders` (T-052). Requiere autenticación: sin sesión redirige a `/login`. Muestra
    fecha, estado (badge con color), total y número de artículos por pedido. Click navega a
    `/orders/:id`. Estado vacío con mensaje "Aún no has hecho pedidos". Estados intermedios
    de carga y error. Textos en es/ru/en. Verificado typecheck, lint y build del cliente.
- [x] **T-055**: Página `/orders/:id` con detalle del pedido
  - Criterio: muestra platos, cantidades y total.
  - **Notas de progreso (2026-10-07):** `client/src/pages/OrderDetail.tsx` creada y ajustada. El
    endpoint `GET /api/orders/:id` ya existía (creado en T-052/T-051). La página consume
    `fetchOrderById` (en `client/src/api/orders.ts`) y muestra estado (badge con color), fecha,
    nota del cliente, lista de items con cantidades y totales por línea, y total general. Requiere
    autenticación: sin/redirige a `/login` mediante `useNavigate` (igual que `Orders.tsx`), no con
    `window.location.assign` que causaba recarga completa. Estados de carga y error con
    `t('orders.loading')` y `t('orders.error')`. Textos en es/ru/en usando claves de `locales/orders`
    y `locales/cart`. Corregido: el redirect usaba `window.location.assign` (inconsistente con el
    resto de páginas y causaba recarga) y no manejaba errores del backend. Verificado con petición
    real: 200 con el pedido completo, 404 `ORDER_NOT_FOUND` para pedidos inexistentes o de otro
    usuario, 401 sin token. Lint, typecheck y build en verde.

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
- ~~¿Dónde alojar las imágenes de los platos?~~ → **Resuelto 2026-10-05**: el dueño decidió
  **alojarlas en la propia VPS**, en un directorio fuera del repositorio
  (`/var/www/osito/uploads`), con Nginx sirviéndolo por `alias`. En la BD se guarda la ruta
  relativa y la URL absoluta se compone con `PUBLIC_ORIGIN`, para que cambiar de dominio no
  obligue a reescribir datos. Implementado en **T-047**. Ver "Decisiones resueltas".
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

### 2026-10-02 — T-032 Componente `DishCard` (+ Button de shadcn/ui)
- Archivos nuevos: `client/src/components/DishCard.tsx`,
  `client/src/components/ui/button.tsx`, `client/src/lib/utils.ts` (el `cn`),
  `client/src/lib/format.ts` (el `formatPrice`) y `components.json` en la raíz. Modificado:
  `client/src/pages/Menu.tsx`, que ahora usa el componente en vez de su tarjeta local.
- **El enunciado daba por hecho dos cosas que no existían. Se resolvió con el dueño:**
  1. **"tipo `Dish` importado de `shared/types.ts`": ese fichero estaba vacío.** Hay un
     `shared/types.ts` en la **raíz** del proyecto y otro `shared/schemas.ts`, los dos con
     **cero líneas**: no existe ningún tipo `Dish`. Decidido usar `ApiDish` de
     `client/src/api/dishes.types.ts`, que T-031 ya creó y que describe exactamente lo que
     devuelve `GET /api/dishes`. Crear un `shared/types.ts` en el cliente habría duplicado la
     definición y las dos podrían divergir sin que nada avise.
  2. **"usar shadcn/ui Button": shadcn no estaba instalado.** Faltaban `clsx`,
     `tailwind-merge`, `class-variance-authority`, el helper `cn`, `components.json` y el
     componente. Decidido montarlo de verdad, no simularlo con un `<button>` de Tailwind.
- **Dependencias instaladas** con permiso explícito del dueño: `clsx@2.1.1`,
  `tailwind-merge@3.7.0` y `class-variance-authority@0.7.1`, en `@osito/client`.
  `npm audit`: 0 vulnerabilidades.
- **`cn` es lo que hace que shadcn funcione, y se verificó que resuelve conflictos de verdad:**
  `cn('... px-4 py-2', '...', 'px-2')` devuelve la cadena **sin `px-4`**, con `px-2` al final;
  `text-sm` + `text-lg` deja solo `text-lg`; y un `lg:grid-cols-3` no pisa un `grid-cols-2`
  sin prefijo. Sin `tailwind-merge` los conflictos los ganaría el orden del CSS y no el del
  código, y ninguna librería de componentes sería utilizable.
- **El botón tiene `type="button"` por defecto.** Un `<button>` sin `type` dentro de un
  `<form>` es `submit`, así que un "añadir al carrito" acabaría enviando el formulario entero.
- **`DishCard` no pide nada ni conoce la API**: recibe el plato ya localizado por props
  (`dish` y `language`), así que se puede reutilizar y se puede comprobar sin red. `language`
  llega como prop y no se lee `i18n` dentro, por el mismo motivo que en `fetchDishes` de T-031.
- **`formatPrice` vive en `lib/format.ts`, no en el componente**, porque un fichero que exporta
  componentes y además funciones rompe el Fast Refresh: al guardar, Vite recarga el módulo
  entero en vez de refrescar solo el componente. Lo mismo con `buttonVariants`, que **no se
  exporta** mientras nadie lo use. Con esto, ESLint queda sin un solo aviso de
  `react-refresh/only-export-components`.
- **`DishCard` es un `<article>` y la lista es la que aporta el `<li>`.** Así el componente no
  impone su contexto y se puede usar suelto. `Menu` envuelve cada tarjeta en `<li class="h-full">`.
- **`line-clamp-2` para la descripción, no un `truncate` con altura fija.** El texto llega ya
  localizado y su longitud cambia con el idioma; un truncado por anchura daría entre una y
  tres líneas según el texto y las tarjetas quedarían con alturas distintas.
- **El skeleton de carga pasó a `aspect-[4/3]`** para ocupar lo mismo que la tarjeta real y que
  la fila no baile al llegar los datos.
- Criterio verificado renderizando con React:
  - El grid es `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`: **1 columna en móvil y
    3 en desktop**, sin 4 columnas. `sm:` a dos es deliberado para tablet.
  - La tarjeta tiene las seis cosas del enunciado: imagen con `aspect-[4/3]` y `object-cover`,
    nombre `text-lg font-semibold`, descripción `line-clamp-2 text-sm text-gray-600`,
    ingredientes `text-xs text-gray-500`, precio `text-xl font-bold` y botón con `cart.add`.
    Comprobado en el HTML renderizado, no en el código.
  - El precio sale **distinto según el idioma**: `11,90 €` en es y ru, `€11.90` en en.
  - El botón se traduce al cambiar de idioma: `Añadir al carrito` / `Добавить в корзину` /
    `Add to cart`.
  - La imagen lleva `alt` con el nombre del plato y `loading="lazy"`.
  - Con los 5 platos del seed salen **5 `<article>` y 5 `<li>`**.
- **Verificado también en el CSS compilado**, no solo en las clases del HTML:
  `.aspect-\[4\/3\]{aspect-ratio:4/3}`, `.line-clamp-2{-webkit-line-clamp:2}`,
  `.lg\:grid-cols-3` y `.grid-cols-1` están en el bundle, así que Tailwind 4 los genera.
- **Regresión comprobada:** `/menu` sigue sirviendo los 5 platos por el proxy de Vite, y los
  tres módulos nuevos (`DishCard.tsx`, `button.tsx`, `utils.ts`) se sirven sin error.
- `typecheck` y `lint` del **workspace raíz** en verde y **sin avisos**, `vite build` correcto
  (109 módulos) y Prettier limpio.
- **Un obstáculo propio:** el 5173 volvió a estar ocupado por un Vite que se me quedó de T-031.
  Se identificó el PID y se comprobó que era un `vite.js` nuestro antes de matarlo.
- **Nota:** hay procesos `tsx watch` y un servidor escuchando en el 3000 que **no son de esta
  tarea** (parecen un `npm run dev` propio). No se tocaron.
- **Impacto en otras tareas:**
  - **T-033 ya puede construir el navbar sobre `Button`**, con sus variantes `default`,
    `outline` y `ghost` y los tamaños `default`, `sm`, `lg` e `icon`.
  - El Botón usa clases de Tailwind directas, **no tokens del tema**: funciona ya, pero si
    más adelante se quiere el tema completo de shadcn habrá que añadir los tokens a
    `index.css`, que hoy solo tiene `@import 'tailwindcss'`.
  - `components.json` deja la CLI de shadcn lista para añadir más componentes sin
    reconfigurar nada.
  - **El botón todavía no hace nada**: no hay carrito ni acción detrás, porque eso llega con
    las tareas del carrito. Por eso `onClick` no se pasa.

### 2026-10-02 — T-033 (bloqueada esperando decisión)
- **No se ha escrito código de producción.** Se leyó el enunciado, se revisó el estado real
  (`client/src/lib/i18n.ts`, `App.tsx`, `main.tsx`, `button.tsx`, los tres JSON de traducciones)
  y se midió el comportamiento del detector de idioma.
- **El criterio de T-033 y la decisión de T-030 son incompatibles.**
  - Criterio de T-033: «al recargar, mantiene el idioma elegido».
  - Decisión de T-030 (`docs/MEMORY.md`): «el orden de detección es `navigator` antes que
    `localStorage`», con el motivo de que si no «el usuario quedaría congelado en el idioma de su
    última visita aunque su navegador dijera otro».
- **Cómo se midió (no es una opinión, es el comportamiento real del detector).** Con
  `i18next@26.4.2` + `i18next-browser-languagedetector@8.2.1` y un `localStorage` y un
  `navigator` simulados, con el navegador en `es-ES` y `ru` ya guardado:

  | `detection.order`                    | Idioma resuelto tras recargar | `t('hello')` | Clave guardada al final |
  | ------------------------------------ | ----------------------------- | ------------ | ----------------------- |
  | `['navigator', 'localStorage']` (actual) | **`es`**                | `hola`       | **`es-ES`** (se pierde)  |
  | `['localStorage', 'navigator']`      | **`ru`**                      | `привет`     | `ru` (se conserva)       |

  Y con el navegador en `es-ES` pero sin elección guardada, el orden invertido resuelve `es`
  correctamente: el `navigator` sigue siendo el punto de partida cuando el usuario nunca ha
  elegido nada.
- **El motivo de fondo:** `detect()` **no** devuelve «el primero que exista», sino **la
  concatenación de todos los detectores en el orden dado**, y de esa lista i18next elige el
  primer idioma que soporte (`getBestMatchFromCodes`). Por eso con `navigator` primero el
  navegador gana siempre y el valor guardado en `localStorage` no llega a llegar a mirarse.
  Además, como `nonExplicitSupportedLngs` está activo, `es-ES` ya cuenta como `es` y por eso
  el navegador gana también en un navegador español.
- **Opciones propuestas al dueño:**
  1. **`detection.order: ['localStorage', 'navigator']`.** Cumple el criterio. Contra: un
     usuario que cambie el idioma de su navegador después de haber elegido en la web no lo ve
     hasta que vuelva a elegir en la web. Es el comportamiento habitual de los sitios
     multi-idioma y el que pide SPEC §7.2 («se guarda en `localStorage`»).
  2. **Mantener `navigator` primero** y cambiar el criterio, para que la elección se guarde
     pero no sobreviva a la recarga. Contra: incumple SPEC §7.2 y el criterio escrito de T-033,
     y hace que el `localStorage` sea decorativo.
- **Lo que sí está resuelto y no necesita permiso** (queda listo para cuando se desbloquee):
  `LANGUAGES` ya está exportado por `lib/i18n.ts` y es la lista que consume `supportedLngs`, así
  que el selector recorre esa constante en vez de repetir `['es','ru','en']`. El criterio de
  T-030 y el de T-032 dicen que los tres botones de idioma de `App.tsx` son de verificación y
  que T-033 los sustituye, así que también se quitarán.
- **Segunda decisión pendiente, menor:** el enunciado permite «tres botones o dropdown». Con
  botones no hace falta ninguna dependencia nueva; un dropdown de shadcn de verdad necesita
  `@radix-ui/react-dropdown-menu`, que sí habría que instalar con permiso.
- **Pendiente por SPEC §7.2:** el paso 2 del flujo de idioma («si hay sesión, se actualiza
  `preferredLang` en BD») no se puede hacer todavía: no hay sesión ni endpoint de usuario
  (T-045 y T-040–T-043). No se ha inventado ninguno.

### 2026-10-02 — T-033 Selector de idioma en navbar
- Archivos nuevos: `client/src/components/LanguageSwitcher.tsx` y
  `client/src/components/Layout.tsx`. Modificados: `client/src/lib/i18n.ts` (orden de
  detección y comentario corregido), `client/src/main.tsx` (`Layout` como ruta padre),
  `client/src/App.tsx` (fuera los botones de verificación de T-030) y los tres JSON de
  traducciones. **Ninguna dependencia nueva.**
- **Sin dependencias nuevas, y no por descuido.** Se propuso el **dropdown de shadcn** que pide
  el enunciado como una de las dos opciones ("tres botones o dropdown"). Ese componente es un
  wrapper sobre `@radix-ui/react-dropdown-menu@2.1.24`, el proyecto no tiene **ningún** paquete
  `@radix-ui`, y la instalación se **`autorizó y luego se denegó`**. Así que son tres botones
  sobre el `Button` de T-032: el criterio se cumple igual y la lista de dependencias no crece.
  Alternativas que se descartaron sin llegar a instalarse: el dropdown oficial (7 dependencias
  transitivas de Radix) y un `<details>/<summary>` propio (no es un componente de shadcn y se
  pierde el control de estilo y de teclado).
- **El bloqueo se resolvió con una decisión del dueño:** invertir el orden de detección de
  `localStorage` → `navigator`, que es lo que exige el criterio. La decisión antigua de T-030
  **sigue en `docs/MEMORY.md`**; lo que se ha escrito al lado es que queda sustituida y por qué.
- **Criterio verificado de punta a punta**, no por lectura del código: se empaquetó el módulo
  real con esbuild y se ejecutó en Node simulando `window.localStorage` y `navigator`, con un
  proceso distinto por escenario (que es lo que hace una recarga):

  | Escenario                                                    | Resuelve | Guardado   |
  | ----------------------------------------------------------- | -------- | ---------- |
  | Navegador `es-ES`, sin elección guardada                      | `es`     | —          |
  | Navegador `es-ES`, el usuario pulsa `RU`                      | `ru`     | **`ru`**   |
  | **Recarga**: navegador `es-ES`, hay `ru` guardado              | **`ru`** | `ru`       |
  | Navegador `ru-RU`, el usuario había elegido `EN`              | `en`     | `en`       |
  | Navegador `ru-RU`, sin elección guardada                       | `ru`     | —          |

  El segundo escenario es el que escribe la clave: `i18nextLng` queda a `ru` sin que el
  componente escriba nada a mano. El tercero es el criterio literal, y el quinto confirma que
  invertir el orden **no** rompen el respeta al navegador cuando el usuario no ha elegido nada.
- **`LanguageSwitcher` no escribe en `localStorage` ni lleva `useEffect`.** La persistencia la
  hace el detector que ya estaba configurado: `changeLanguage` dispara `cacheUserLanguage`.
  Escribirlo también aquí sería tener dos fuentes de verdad para el mismo dato.
- **La lista de botones sale de `LANGUAGES`,** la constante que `lib/i18n.ts` ya exporta y que
  alimenta `supportedLngs` y los `resources`. Añadir un idioma no obliga a tocar el componente.
- **El idioma activo se marca por dos vías, no solo por el color:** variante `default` frente a
  `outline` del `Button` de shadcn, y `aria-current` para lectores de pantalla. Comprobado en el
  HTML renderizado: con `es` activo sale `aria-current="true"` en el botón `ES` y `"false"` en los
  otros dos.
- **Lo visible es el código ISO (`ES`) y lo que se anuncia es el endónimo** (`Español`,
  `Русский`, `English`), con `lang` en cada botón. El código es idéntico en los tres idiomas y por
  eso no necesita traducción; el endónimo es lo único que le sirve a alguien cuya interfaz está en
  un idioma que no lee, que es justo el caso de uso de este selector. **Los tres ficheros de
  traducciones tienen por eso los mismos tres endónimos**, y solo se traduce `language.label`.
- **5 claves i18n nuevas en los tres idiomas:** `nav.main`, `language.label`, `language.es`,
  `language.ru`, `language.en`.
- **`Layout` va como ruta padre en `main.tsx`, con `<Outlet />` dentro y sin props.** Es el
  patrón de `react-router` para un layout compartido: cada página deja de decidir qué chrome
  lleva encima, y T-034 (`/menu/:id`) lo heredará sin tocar nada.
- **El navbar es mínimo a propósito:** el título, que enlaza a la portada, y el selector. Los
  enlaces de menú, carrito y sesión existen en `locales` desde T-030 pero **no se pintan**:
  decidir eso es el criterio de T-035, y pintarlos aquí sería hacer diseño antes de que exista
  el criterio que lo fija.
- **`App.tsx` pierde sus tres botones de idioma.** Es lo que T-030 dejó anotado desde el
  principio: eran el mecanismo de verificación de aquella tarea y los sustituye este selector.
  La lista de claves se queda, porque sigue siendo la forma rápida de ver que `changeLanguage`
  repinta sin recargar.
- Verificación técnica: `typecheck` y `lint` del workspace raíz **en verde y sin avisos**,
  `vite build` correcto con **111 módulos** (eran 109: los dos nuevos), Prettier limpio, y en el
  bundle de producción aparece **una** vez `` order:[`localStorage`,`navigator`] ``, que es la
  forma minificada de la configuración corregida. El servidor de desarrollo responde **200** en
  `/`, `/menu` y en los cinco módulos tocados, y `/api/dishes` sigue devolviendo 5 platos en
  `language: "es"`: no se rompió nada de T-030 a T-032.
- **Impacto en otras tareas:**
  - **T-035 (estilos base) hereda este navbar** y es quien decide qué enlaces se pintan y con qué
    aspecto. Los tokens del tema de shadcn siguen sin estar en `index.css`, así que el navbar
    usa clases de Tailwind directas como el `Button`.
  - **T-034 (`/menu/:id`) no necesita tocar el layout:** su ruta entra dentro de la de `Layout`.
  - **T-045 (sesión) y el paso 2 de SPEC §7.2** (`preferredLang` en BD) siguen pendientes: no
    hay sesión ni endpoint de usuario. Cuando existan, tendrán que **escribir** el idioma
    escolhido, porque ahora mismo la elección vive solo en el `localStorage` del navegador.
  - El selector **no** llama a `GET /api/dishes` ni a nada: el cambio de idioma llega al contenido
    solo porque `Menu` mete el idioma en la `queryKey`, tal como decidió T-031.

### 2026-10-02 — T-034 Página `/menu/:id`
- Archivos nuevos: `client/src/pages/DishDetail.tsx` y
  `client/src/components/ui/button-variants.ts`. Modificados: `client/src/api/dishes.ts`
  (`fetchDishById`), `client/src/api/dishes.types.ts` (`ApiDishResponse`),
  `client/src/components/DishCard.tsx` (enlaces al detalle),
  `client/src/components/ui/button.tsx` (importa las variantes de su nuevo sitio),
  `client/src/main.tsx` (ruta) y los tres JSON de traducciones. **Ninguna dependencia nueva.**
- **La forma de la respuesta se comprobó contra el backend antes de escribir una línea.** Con
  `curl` al servidor en marcha: `GET /api/dishes/1` devuelve **`{ language, dish }`**, no un plato
  pelado, y el `dish` es el mismo objeto que viaja dentro del listado. El envoltorio es la
  convención que fijó la decisión "los endpoints de listado devuelven `{ language, data }`", así
  que `ApiDishResponse` lo reproduce en vez de inventar otra forma. `GET /api/dishes/9999` →
  **404 `DISH_NOT_FOUND`** y `GET /api/dishes/abc` → **400**.
- **`fetchDishById` reutiliza un `requestJson` compartido con `fetchDishes`.** Los dos necesitan
  exactamente lo mismo (parsear el cuerpo, traducir el error a `ApiError` con su código), y
  copiar 25 líneas habría dejado dos versiones de la misma lógica de error. El único cambio de
  comportamiento es que el mensaje de respaldo ahora nombra la ruta que falló, que es más útil
  diagnosing que decir siempre `/api/dishes`.
- **El cuerpo **no** se valida con Zod en el cliente, y no por descuido.** `zod` no está en el
  cliente y meterlo sería una dependencia nueva sin necesidad: el backend ya valida lo que
  serializa (`dishSchema.parse` en `getDish`), así que un 200 con cuerpo raro solo puede venir de
  un proxy. Es el mismo criterio que ya seguía `fetchDishes`.
- **`buttonVariants` se movió a `button-variants.ts`.** No fue una decisión de gusto: la deuda que
  dejó T-032 era exactamente que el `Button` **no admite `asChild`**, y por eso no servía para
  envolver un `<Link>`. Un `<button>` no puede contener un enlace, así que el botón "volver al
  menú" had de ser un `<Link>` con las mismas clases. Extraer las variantes es lo que T-032 dejó
  escrito para cuando hiciera falta, y es lo que evita que el navbar y el botón se separen por
  estilo. **La deuda de `asChild` queda resuelta sin Radix**: `Slot` viene con
  `@radix-ui/react-slot`, que es una dependencia que ya se denegó en T-033.
- **Comprobado que `VariantProps<typeof buttonVariants>` sigue funcionando con el `cva` en otro
  fichero.** Es lo contrario de lo que se suele esperar (`TS2315`), y evita escribir a mano los
  tres valores de cada variante.
- **La tarjeta enlaza al detalle con la imagen y con el nombre, no con toda la tarjeta.** Un `<a>`
  no puede envolver al `<button>` de "añadir al carrito": no se anudan elementos interactivos y
  además se rompe el teclado. Poner el enlace en dos sitios agranda la zona pulsable sin inventar
  un `stretched-link`.
- **`DishDetail` es una página, no una segunda versión de `DishCard`.** La tarjeta es un resumen
  dentro de un `<li>`; el detalle necesita imagen grande y el texto sin truncar. La descripción
  aquí **no** lleva `line-clamp-2`, al revés que en la tarjeta.
- **El `id` de la ruta se valida antes de preguntar.** `useParams` devuelve una cadena, así que
  `/menu/abc` se detecta con `Number.isInteger` y se enseña el mensaje de "no existe" **sin gastar
  una petición** (comprobado: cero llamadas a `fetch`). Es la misma regla que aplica
  `idParamSchema` en el servidor.
- **`DISH_NOT_FOUND` y "el plato no existe" son el mismo mensaje a propósito.** El backend
  devuelve ese 404 también para un plato deshabilitado, que es la decisión de T-021 de no revelar
  qué platos existieron; pero **cualquier otro** error sí muestra el mensaje de fallo de la API,
  para que el usuario no piense que le han borrado un plato por un problema de red.
- **5 claves i18n nuevas en los tres idiomas:** `nav.backToMenu`, `dish.loading`,
  `dish.notFound`, `dish.error` y `dish.ingredients`. Se reutilizan `cart.add` y `app.title`, que
  ya estaban de T-030.
- Criterio verificado renderizando el componente real contra **la API real en marcha** (no una
  copia de los datos):
  - `DishCard` con un plato de prueba emite **dos** `href="/menu/7"` (imagen y título) y conserva
    el botón de "Añadir al carrito".
  - `/menu/1` renderiza, contra `GET /api/dishes/1` de verdad: nombre `Sopa de verduras`,
    `alt="Sopa de verduras"`, precio `6,50`, etiqueta `Ingredientes`, botón "Añadir al carrito" y
    enlace "Volver al menú".
  - En ruso se renderiza `Овощной суп`, `Ингредиенты` y `Вернуться в меню`.
  - **Se mandó exactamente una petición** por render, y con la cabecera correcta:
    `GET /api/dishes/1 accept-language=es` y `GET /api/dishes/1 accept-language=ru`.
  - `fetchDishById(9999, ...)` lanza `ApiError` con `status 404`, `code DISH_NOT_FOUND` y mensaje
    `Dish not found`, en es y en ru.
  - `/menu/abc` enseña el mensaje de "no existe" con **cero** llamadas a la API.
- **Un fallo real que encontró la verificación:** la clave `dish.loading` se había añadido pero el
  esqueleto no la pintaba, así que era una clave muerta y la carga era un silencio total. Ahora el
  esqueleto lleva un `<p class="sr-only" role="status">`, igual que hace `Menu`. Ni `tsc` ni ESLint
  avisan de una clave i18n sin usar; solo se ve al renderizar.
- **Lo que no se ha podido verificar, y es una limitación conocida:** **la rama `isError` no se ha
  visto en un render.** Con la caché de la query calentada con el 404 real, `renderToStaticMarkup`
  sigue pintando el esqueleto, porque el observer arranca en `pending` sin montaje real en cliente
  (el gotcha de TanStack registrado en T-031). Lo que sí está comprobado es el contrato del
  error (`ApiError` 404 / `DISH_NOT_FOUND`) y que el componente que pinta `dish.notFound` es el
  mismo que se ha renderizado en el caso de `id` inválido.
- Verificación técnica: `typecheck` y `lint` del workspace raíz **en verde y sin avisos**,
  `vite build` correcto con **113 módulos** (eran 111: los dos nuevos), Prettier limpio, y el
  servidor de desarrollo responde **200** en `/menu`, `/menu/1`, `/menu/abc` y en los cinco módulos
  tocados. `GET /api/dishes` sigue devolviendo 5 platos.
- **Impacto en otras tareas:**
  - **T-035 (estilos base) tiene menos trabajo del que parecía:** los tokens del tema y el aspecto
    del navbar siguen pendientes, pero el `Button` ya tiene variantes compartibles con los enlaces.
  - **T-050 (carrito)** tiene su punto de enganche: el botón de esta página y el de `DishCard` son
    los dos que tienen que pasar a llamar al store. Se dejaron sin `onClick` a propósito, igual
    que en T-032.
  - **T-053/T-055 (resumen y detalle de pedido)** no se ven afectados: `buttonVariants` se puede
    reutilizar para sus enlaces.
  - **Ningún endpoint nuevo:** todo sale de `GET /api/dishes/:id`, que ya existía desde T-021.

### 2026-10-02 — T-035 (bloqueada esperando decisión)
- **No se ha escrito código.** Se revisó el enunciado, el estado real de la instalación de shadcn y
  el registro oficial de lo que piden los componentes.
- **El estado real de shadcn en el proyecto, punto por punto**, para que nadie lo vuelva a
  preguntar:

  | Lo que pide el enunciado                        | Estado real                                                   |
  | ----------------------------------------------- | ------------------------------------------------------------- |
  | `npx shadcn@latest init`                        | **Hecho en T-032**, pero a mano (`components.json`, `cn`, deps) |
  | `button`                                         | **Existe** (`components/ui/button.tsx`), pero **a mano**, sin `asChild` |
  | `components.json`                                | **Existe en la raíz**, que es donde la CLI no lo ve            |
  | Tokens del tema en `index.css`                   | **Ausentes**: solo `@import 'tailwindcss'`                     |
  | `Layout` con navbar (logo, enlaces, selector)    | **Existe desde T-033**, sin enlaces; el selector ya está dentro |
  | `card`, `input`, `label`, `toast`, `dropdown-menu` | **No existen**, y son los que piden dependencia nueva         |
  | Aplicar el `Layout` a todas las páginas          | **Hecho desde T-033**: es la ruta padre en `main.tsx`           |
- **La CLI de shadcn no encuentra la app, y el fallo viene de T-032.** Con `components.json` en la
  raíz del monorepo, `npx shadcn@latest add ...` responde **`Failed to load tsconfig.json`**
  porque en la raíz no hay `tsconfig.json`, y desde `client/` responde que no hay
  `components.json` y ofrece crearlo. La entrada de T-032 afirma que el fichero "deja la CLI de
  shadcn lista para añadir componentes sin reconfigurar": **eso no es cierto tal como está
  puesto**. Hay que moverlo a `client/`, que es donde la CLI espera encontrar la app.
- **Qué dependencias piden los componentes oficiales**, mirando el registro de shadcn y no de
  memoria:

  | Componente        | Archivos nuevos                                          | Dependencia que pide              |
  | ----------------- | -------------------------------------------------------- | --------------------------------- |
  | `card`            | `ui/card.tsx`                                             | **ninguna**                       |
  | `input`           | `ui/input.tsx`                                            | **ninguna**                       |
  | `label`           | `ui/label.tsx`                                            | `@radix-ui/react-label`           |
  | `dropdown-menu`   | `ui/dropdown-menu.tsx`                                    | `@radix-ui/react-dropdown-menu` + `lucide-react` |
  | `toast`           | `ui/toast.tsx` + `ui/toaster.tsx` + `hooks/use-toast.ts`   | `@radix-ui/react-toast` + `lucide-react` |
  | `button` (oficial)| sobrescribe `ui/button.tsx`                                | `@radix-ui/react-slot`            |

  Además `dropdown-menu` y `toast` usan `animate-in`, `zoom-in-95` y `slide-in-from-top-full`, que
  son utilidades de **`tw-animate-css`** (no vienen con Tailwind 4). O sea: **`card` e `input` son
  los únicos que no traen consigo una dependencia.**
- **Radix ya se denegó en T-033**, cuando el `LanguageSwitcher` podía ser tres botones o un
  dropdown y se eligió lo primero. Instalar `@radix-ui/react-dropdown-menu` ahora es
  exactamente lo que se denegó entonces, pero aplicado a un componente distinto.
- **Los seis componentes del enunciado son 7 archivos nuevos** (contando que `toast` trae tres).
  AGENTE.md §1 limita a 5 archivos nuevos por tarea, así que tal cual el enunciado **no se puede
  hacer en una sola tarea** sin una excepción explícita del dueño.
- **Lo que sí está resuelto y no necesita permiso**, para cuando se desbloquee: los tokens van con
  **`@theme inline` dentro de `index.css`** y no con un `tailwind.config.js`, porque T-005 decidió
  el tema CSS-first de Tailwind 4; `DishCard` puede usar `Card` conservando su `<article>`; y el
  navbar solo necesita los enlaces que ya están traducidos (`nav.menu`, `nav.cart`, `nav.login`).
- **Lo que no encaja con el enunciado y conviene decidir:** `input` y `label` no tienen consumidor
  hasta que existan formularios (T-044), y el sistema de avisos (`ErrorBoundary` + toasts) es
  **T-092**. Instalar `toast` en T-035 deja un componente sin usar, igual que `input` y `label`.

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

### 2026-10-03 — T-035 Estilos base con Tailwind + shadcn/ui (desbloqueada)
> Continuación de la entrada del 2026-10-02, que está más abajo y sigue intacta. Aquella decía
> "bloqueada, no se ha escrito código"; esta es lo que se hizo después de que el dueño autorizara
> los componentes y las dependencias.

- **El enunciado pedía instalar shadcn/ui y lo que había era terminarlo a medias.** shadcn/ui no
  es una librería que se instale: son ficheros que la CLI copia a `src/components/ui/`. T-032 ya
  había copiado el `Button` y las dependencias, pero **el tema, que es la parte de la que
  dependía todo lo demás, no existía**: `index.css` seguía con una línea. Ese era el bloqueo de
  fondo.
- **El tema va en `index.css` con `@theme inline`, no en un `tailwind.config.js`.** T-005 ya
  había decidido que con Tailwind 4 la configuración es CSS-first, así que el archivo de
  config no se creó: crear uno ahora sería contradecir una decisión cerrada.
  - **Los tokens son la paleta `stone` de Tailwind, literalmente**, no números copiados de otro
    sitio: son los mismos `oklch` de `node_modules/tailwindcss/theme.css`. Así `bg-muted` y un
    `bg-stone-100` escrito a mano son el mismo color y las clases que ya había de T-032 a T-034
    no hubo que tocarlas.
  - **`inline` es obligatorio, no decorativo:** sin él Tailwind copia el valor en cada utility y
    cambiar el tema obligaría a regenerar el CSS.
  - **Solo paleta clara:** el producto no tiene modo oscuro, así que no se añadió bloque `.dark`
    ni el variant `dark`. Sería código muerto.
- **`components.json` se movió de la raíz a `client/`.** Ese era el "bloqueo 2" del análisis: la
  CLI busca el fichero en la carpeta de la app, y desde la raíz respondía `Failed to load
  tsconfig.json` porque en la raíz no hay `tsconfig.json`.
- **El alias `@/` hay que declararlo en dos sitios: `tsconfig.app.json` y `vite.config.ts`.** Es
  lo que piden los componentes de shadcn y no lo tenía el proyecto. Con solo el `paths` de
  TypeScript, `tsc` pasa en verde y es el navegador el que falla con un import que no se
  encuentra. `tsconfig.json` (el de referencias) lo lleva también porque `tsc -b` resuelve los
  proyectos referenciados desde ahí.
- **Componentes del registro copiados a `src/components/ui/`:** `button`, `card`, `input`,
  `label`. Dos retoques sobre el registro, ambos anotados en el propio fichero:
  - **`Button` pone `type="button"` por defecto.** El registro no lo hace, y un `<button>` sin
    `type` dentro de un `<form>` es `submit`. Con `asChild` **no** se aplica, porque el hijo
    puede ser un `<a>` y ahí un `type="button"` es HTML inválido.
  - **`buttonVariants` no se exporta**, aunque el registro lo exporte. Nadie lo usa (el
    `button-variants.ts` de T-032 se borró) y exportarlo desde un fichero que también exporta un
    componente rompe el fast refresh: ESLint avisa con `react-refresh/only-export-components`,
    el mismo gotcha que ya tenía T-032 anotado en MEMORY.
- **`CardTitle` es un `div`, no un `<h3>`,** que es lo que trae el registro. `DishCard` mete el
  `<h2>` dentro para que la semántica siga siendo correcta: el div pone el estilo y el
  encabezado es lo que leen los lectores de pantalla al saltar por títulos.
- **Refactorizados:** `DishCard` (a `Card` + `CardHeader`/`CardContent`/`CardFooter`, con el
  `<article>` **fuera** del `Card` para no cambiar la semántica que eligió T-032), `Layout`
  (navbar con enlaces reales) y `Menu` (los skeletons se pintan con `Card` y no con un `<li>`
  estilado a mano, para que el salto al cargar los datos no se note). `DishDetail` solo cambia
  el botón de "volver al menú", que pasa de `buttonVariants` a `<Button asChild>`.
- **En el navbar, `Button asChild` + `Link` por dentro**, que es lo que `asChild` existe para: un
  `<button>` no puede contener un enlace, y la alternativa era copiar las clases del botón en
  cada enlace. **Solo `/menu` enlaza de verdad**; carrito e inicio de sesión salen deshabilitados
  porque `/cart` (T-053) y `/login` (T-044) no existen. **No se inventó un logotipo de imagen.**
- **`input` y `label` no tienen consumidor todavía**, y es a propósito: son los que necesita
  **T-044** (los formularios de `/login` y `/register`). `label` es el primer componente de Radix
  que se instala después de la denegación de T-033: lo autorizó el dueño con esta tarea, y solo
  para el componente que lo necesita.
- **`.prettierignore` (raíz) ahora ignora `.kilo`.** `npm run format:check` recorría entera la
  copia del repo que hay en los worktrees del Agent Manager y fallaba con 40 archivos ajenos.
  Git ya los excluía por su cuenta (`.git/info/exclude`), pero Prettier no lee eso.
- **Verificación:**
  - `npm run typecheck`, `npm run lint` (0 errores y **0 warnings**) y `npm run format:check` en
    verde; `npm run build` genera el bundle de producción sin avisos.
  - **El tema funciona de verdad, comprobado en el CSS generado** (no solo que compila): en
    `dist/assets/*.css` y en el CSS del servidor de desarrollo aparecen `--primary`,
    `--ring`, `--border`, `--card` y `--destructive`, y `.bg-primary` sale como
    `background-color: var(--primary)`. También `.bg-card`, `.text-muted-foreground`,
    `.border-input`, `.bg-destructive`, `.animate-pulse` y `.rounded-xl`, que son las que usan
    las tarjetas, los skeletons y el navbar.
  - **Los 10 módulos tocados los transforma el servidor de Vite sin errores** (los cuatro de
    `ui/`, `DishCard`, `Layout`, `Menu`, `DishDetail`, `LanguageSwitcher`, `main`), lo que
    confirma además que el alias `@/` resuelve en Vite y no solo en TypeScript.
  - Regresión de la API: `GET /api/dishes` a través del proxy de Vite sigue devolviendo los 5
    platos del seed con `Accept-Language: ru`.
  - **Lo que no se ha verificado: un render en un navegador de verdad.** El proyecto no tiene
    navegador automatizado (misma limitación que se anotó en T-034), así que el aspecto se ha
    comprobado sobre el HTML/CSS generado, no mirando la pantalla.
- **Impacto en otras tareas:**
  - **T-092 (`ErrorBoundary` + toasts) es quien instala `toast` y `dropdown-menu`.** Es la tarea
    que los usa y la que puede justificar `@radix-ui/react-toast` y `lucide-react`; instalarlos
    aquí los dejaba sin usar y con Radix denegado en T-033.
  - **T-044 (formularios)** tiene ya `Input` y `Label`; solo faltaría `react-hook-form` y el
    `zodResolver`, que es lo que dice su criterio.
  - **T-091 (responsive)** hereda los breakpoints fijados aquí: `sm:grid-cols-2` en el menú y
    `md:grid-cols-2` en el detalle, además del `flex-wrap` del navbar.
  - **T-053 (carrito)** y **T-044 (login)** solo tienen que quitar el `disabled` del navbar.
  - Cualquier componente de shadcn que se añada en adelante hereda el tema: si usa un token que
    no existe, hay que añadirlo en los dos bloques de `index.css` a la vez.

### 2026-10-03 — T-042 `POST /api/auth/refresh`
- **Tercera tarea del módulo `auth/` y de nuevo sin ficheros nuevos:** se ampliaron los cuatro de
  T-040 (`refreshBodySchema`, `refreshClaimsSchema` y `refreshResponseSchema` en el schema;
  `findUserById` en el repositorio; `verifyRefreshToken` + `refreshAccessToken` en el servicio;
  la ruta en `auth.routes.ts`). **Sin dependencias nuevas:** `jsonwebtoken` ya está desde T-041.
- **Criterio verificado con peticiones reales**, primero en `tsx` y luego contra
  `node dist/app.js` en el puerto 3100, con resultados idénticos:
  - Refresh válido → **200** y el cuerpo tiene **una sola clave**, `accessToken` (220 caracteres
    para el admin, 231 para un cliente con email más largo). Claims del token emitido, decodificados
    y verificados con la firma: `{"type":"access","email":…,"role":…,"sub":"2","iat":…,"exp":…}`,
    con `(exp - iat) = 900 s` (**15 min**) y `alg` `HS256`. **No verifica con
    `JWT_REFRESH_SECRET`** (`invalid signature`), igual que en T-041.
  - **Los ocho intentos de colar un token que no debe renovar dan 401
    `INVALID_REFRESH_TOKEN`, todos con el mismo mensaje y el mismo `code`:**
    1. un **access token** usado como refresh (muere en la firma, por el secreto distinto);
    2. una cadena que no es un JWT (`no-es-un-jwt`);
    3. un token firmado con **otro secreto**;
    4. un token **caducado** (`expiresIn: '-1s'`) firmado con el secreto bueno;
    5. un token de `type: 'access'` **firmado con `JWT_REFRESH_SECRET`** (esto es lo que
       comprueba el `z.literal('refresh')`, porque la firma sí cuadra);
    6. un token con `sub: 'abc'`;
    7. un token con `sub: '999'` (usuario inexistente → el `SELECT` no lo encuentra);
    8. un token cuyo payload es **una cadena suelta** firmada con el secreto bueno, que es
       justamente el caso que `jwt.verify` devuelve como `string` y no como `JwtPayload`.
  - Body inválido → **400 `VALIDATION_ERROR`**: `{}`, `{"refreshToken":""}`,
    `{"refreshToken":"   "}` (solo espacios) y `{"otro":1}` (falta el campo). JSON truncado →
    400 `INVALID_JSON`. `GET /api/auth/refresh` → 404 `NOT_FOUND`.
  - **Token con espacios y salto de línea alrededor** (`"  eyJ…\n"`, el fallo típico de copiar y
    pegar) → **200**: el `.trim()` del schema lo arregla sin tocar la parte firmada.
  - **El mismo refresh sirve para varias renovaciones** (probado tres veces seguidas sin
    problema), porque no hay rotación. Y al revés: **si la cuenta se borra, el refresh deja de
    servir** aunque el token siga sin caducar (401), que es justo lo que aporta el `SELECT` por
    `sub`.
- **Decisiones tomadas (anotadas también en `MEMORY.md`):**
  1. **El token viene en el body y no en `Authorization`.** Es la única petición que el cliente
     hace cuando ya no puede usar la cabecera, porque el access ha caducado; pedir una cabecera
     para renovar el access sería pedirle al interceptor (T-046) que monte una petición "a pelo".
  2. **`algorithms: ['HS256']` explícito** en la verificación, tal como exigía la decisión
     promovida en T-041: sin esa opción `jsonwebtoken` se fía del algoritmo que declara la
     cabecera del token.
  3. **El shape del payload se valida con Zod (`refreshClaimsSchema`) aunque el token esté
     firmado**, porque `jwt.verify` devuelve `string | JwtPayload` y porque es lo que comprueba el
     `type`. Se usa `safeParse` y el fallo se traduce al mismo 401, **no a un 400**: para el
     cliente el token no valió, y un 400 de validación aquí sería un error de programación, no de
     credenciales.
  4. **Caducado, firma inválida, `type` equivocado y usuario inexistente comparten el mismo
     401 `INVALID_REFRESH_TOKEN`.** Para el cliente es la misma situación (la sesión terminó) y
     distinguirlos solo ayudaría a quien prueba tokens.
  5. **El `catch` de la verificación se traga también el error de base de datos**, para que una
     caída de `users` produzca el 401 conocido y el cliente cierre sesión, en vez de un 500 que
     dejaría al usuario con un error de red sin explicación.
  6. **El usuario se relee de la base y no se copia del token**, para que el `role` del access
     nuevo sea el de ahora y una cuenta borrada no pueda renovar. Es la razón de `findUserById`.
  7. **La respuesta es solo `{ accessToken }`:** el refresh no se renueva (rotación real =
     tabla de tokens revocados, decisión de T-045) y el `user` no se devuelve porque el cliente
     ya lo tiene del login y lo tiene en Zustand; devolverlo obligaría a sobrescribirlo en cada
     renovación.
- **Verificación de no regresión:** `GET /api/health`, `/api/dishes` y `/api/categories` siguen en
  200; el **login sigue funcionando** y su refresh renueva (probado con el admin real, con
  `role: "admin"` en el claim del token nuevo); `POST /api/auth/register` sin tocar; y el refresh
  también funciona **por el proxy de Vite** (`http://localhost:5173/api/auth/refresh` → 200).
  `npm run typecheck`, `npm run lint`, `npm run format:check` y `npm run build` en verde.
- **Base de datos verificada sin residuos:** el endpoint **no escribe nada** (es de lectura: un
  `SELECT` por `id`). Se creó un cliente para la prueba, se borró al terminar y la tabla `users`
  quedó con el admin y `sqlite_sequence.users` en `1`, con `integrity_check` en `ok`. `dishes` (5)
  y `categories` (5) sin cambios.
- **Pendientes / deuda que deja esta tarea:**
  - **T-043 (`requireAuth`) sigue siendo la pieza que falta para que esto sirva de algo:** hasta
    que exista, los tokens se emiten pero ninguna ruta los comprueba. Le toca exigir
    `type === 'access'`, verificar con `JWT_SECRET` y decidir si se fía del `role` del token.
  - **T-046 (interceptor)** tiene que distinguir este 401 por `code` para limpiar la sesión, y
    saber que **el 401 es también la respuesta cuando el refresh caducó a los 7 días** (mismo
    `code` que un token manipulado, a propósito).
  - **No hay rotación de refresh token**, que es lo que permitiría invalidar sesiones y hacer
    logout de verdad. Sigo pendiente de T-045 y de una posible tabla de tokens revocados.
  - **Un token renovado dentro del mismo segundo que el login es byte a byte idéntico** al que
    devolvió el login: es el comportamiento normal de JWT (misma carga útil, misma firma
    HMAC), no un fallo, pero conviene saberlo para no esperar un token "nuevo" siempre.

---

### 2026-10-03 — T-041 `POST /api/auth/login`
- **Segunda tarea del módulo `auth/` y la primera que autentica.** No crea ficheros nuevos: se
  ampliaron los cuatro de T-040 (`auth.schema.ts`, `auth.repository.ts`, `auth.service.ts`,
  `auth.routes.ts`), que es justo para lo que servía la estructura de AGENTE.md §2.2.
- **Dependencia nueva, autorizada por el propio enunciado, que nombra `jsonwebtoken`:**
  `jsonwebtoken@9.0.3` (runtime) y `@types/jsonwebtoken@9.0.10` (solo desarrollo, porque
  `jsonwebtoken` no distribuye sus propios tipos). Instaladas en `server/package.json` y
  `package-lock.json`. Comprobado con `npm audit` que **`jsonwebtoken` no aparece en ninguna
  vulnerabilidad**: los 4 avisos moderados que salen son de `drizzle-kit → @esbuild-kit →
  esbuild` (servidor de desarrollo de una dependencia de desarrollo) y ya estaban antes.
- **Criterio verificado con peticiones reales**, primero contra `tsx` y luego contra
  `node dist/app.js` en el puerto 3100, con resultados idénticos:
  - Login correcto → **200** `{"accessToken":…,"refreshToken":…,"user":{…}}` (231 y 164
    caracteres respectively). El `user` es `{"id":2,"email":"login-test@example.com","role":"customer","preferredLang":"ru"}`
    y **no contiene `passwordHash`**: es el mismo `userSchema` del registro, así que el hash no
    puede salir por la forma de la respuesta.
  - **Claims del access, decodificados y verificados con la firma:**
    `{"type":"access","email":"login-test@example.com","role":"customer","sub":"2","iat":…,"exp":…}`
    → `(exp - iat) = 900 s` (**15 min** exactos). `alg` = `HS256`.
  - **Claims del refresh:** `{"type":"refresh","sub":"2",…}` → `(exp - iat) = 604800 s`
    (**7 días** exactos). El refresh **no** lleva `email` ni `role`.
  - **Los tokens no son intercambiables, y está comprobado, no supuesto:** verificar el refresh
    con `JWT_SECRET` falla con `invalid signature`, y verificar el access con
    `JWT_REFRESH_SECRET` también.
  - Contraseña incorrecta → **401** `{"error":"Usuario o contrasena incorrectos","code":"INVALID_CREDENTIALS"}`.
  - Email inexistente → **401 con el mismo mensaje y el mismo `code`**. Es deliberado: si los dos
    fallos se distinguieran, el endpoint serviría para enumerar qué emails están registrados.
  - Body vacío → 400 `VALIDATION_ERROR`; contraseña vacía → 400 (`min(1)`); email mal formado →
    400; JSON truncado → 400 `INVALID_JSON`; `GET /api/auth/login` → 404 `NOT_FOUND`.
  - `{"email":…,"password":…,"role":"admin"}` → **200 y el claim `role` sigue siendo `customer`**:
    el body no puede ascenderse a admin por la vía del login.
  - **Login con el email en otro formato:** `"  LOGIN-TEST@Example.COM  "` → **200** y el
    `user.email` devuelto es `login-test@example.com`. Es la normalización de T-040 funcionando
    también al entrar, no solo al registrarse.
  - **Login del admin real** (`admin@osito.local`) → 200 con `role: "admin"` en la respuesta y en
    el claim, comprobando que el camino de admin no es un caso especial.
- **El tiempo de respuesta del 401 se igualó a propósito, y se midió.** Un `compare` de bcrypt a
  10 rounds con `bcryptjs` cuesta **~100 ms** en esta máquina (una petición que no llega a
  bcrypt, como un 400 de validación, responde en ~10 ms). Si el email no existiera devolviera el
  401 sin comparar, los dos fallos serían distinguibles de sobra por tiempo. Por eso hay un
  `compare` contra un **hash de relleno** cuando el usuario no existe. Medido con 15 peticiones
  intercaladas por grupo: **mediana 103 ms con usuario real frente a 108 ms con usuario
  inexistente (5 ms de diferencia)**, con los rangos solapados; la diferencia de medias (38 ms) la
  explican dos picos sueltos del servidor, uno de ellos la primera petición en frío.
- **Decisiones tomadas (anotadas también en `MEMORY.md`):**
  1. **El claim `type` (`'access' | 'refresh'`) es obligatorio en los dos tokens.** Sin él, un
     refresh token (7 días) valdría como credencial en cualquier ruta protegida, porque
     `requireAuth` solo verifica la firma. Promovido a "Decisiones arquitectónicas clave".
  2. **Dos secretos distintos, que es lo que ya distortaba el enunciado:** el access se firma con
     `JWT_SECRET` y el refresh con `JWT_REFRESH_SECRET`. La separación real de los dos casos ya
     la daba el claim `type`; los secretos distintos son la segunda barrera.
  3. **`email` y `role` van solo en el access**, porque son lo que el servidor necesita en cada
     petición sin ir a la base. El precio asumido: un cambio de rol no se ve hasta que el access
     caduca (máximo 15 min). Anotado para T-043.
  4. **`sub` es el `id` en texto**, como exige JWT; quien lo lea tiene que hacer `Number(sub)`.
  5. **El login reutiliza `emailSchema` (con normalización) pero no `passwordSchema`:** el login
     responde "¿son estas las credenciales?", no "¿cumple las reglas?". Aplicar el `min(8)` haría
     que una contraseña corta devolviera 400 en vez del 401 que el cliente tiene que saber pintar.
  6. **`bcrypt.compareSync` y no el `hash` asíncrono**, por el mismo invariante síncrono que
     decidió T-040: mantiene el servicio sin `await` en medio. El coste es que **el login bloquea
     el event loop ~100 ms**; en una API con un solo usuario a la vez es aceptable, y el día que
     moleste el arreglo es el inverso: pasar a `hash` asíncrono **y** añadir el `await` obliga a
     detectar el `SQLITE_CONSTRAINT_UNIQUE` en el registro (ver T-040).
  7. **Los refresh tokens son sin estado: no hay tabla ni revocación.** Cerrar sesión (T-045) no
     puede invalidar un refresh ya emitido; solo deja de renovar cuando caduca a los 7 días.
- **Verificación de no regresión:** `GET /api/health` 200, `GET /api/dishes` 200, `GET
  /api/categories` 200, ruta inexistente 404, `POST /api/auth/register` sigue dando 409 con email
  duplicado y 201 con email nuevo, y el login **también funciona por el proxy de Vite**
  (`http://localhost:5173/api/auth/login` → 200 con `accessToken`). `npm run typecheck`, `npm
  run lint`, `npm run format:check` y `npm run build` en verde.
- **Base de datos verificada sin residuos.** Backup con `VACUUM INTO` antes de limpiar y
  comparación al terminar: `categories`, `dishes`, `orders`, `order_items`, `page_views` y
  `notification_logs` **idénticas**; `users` e `sqlite_sequence` difieren **exactamente en los
  datos de prueba** que se borraron (2 clientes creados para esta tarea). La fila del admin
  sigue con el mismo `id`, el mismo `created_at` y el mismo hash, y `sqlite_sequence.users` volvió
  a `1`. `foreign_key_check` vacío e `integrity_check` en `ok`. **El login no escribe nada**: no
  hay sesión, ni `last_login`, ni actualización de `preferredLang`.
- **Pendientes / deuda que deja esta tarea:**
  - **T-042 (refresh)** tiene que verificar con `JWT_REFRESH_SECRET` **y** exigir
    `type === 'refresh'`, y al renovar tiene que releer el usuario de la base (el refresh no lleva
    `email` ni `role` a propósito).
  - **T-043 (`requireAuth`)** tiene que verificar con `JWT_SECRET`, exigir `type === 'access'` y
    decidir si se fía del `role` del token o va a la base. Está anotado en el propio
    `auth.service.ts`.
  - **No hay `logout` en el servidor** porque no hay estado que invalidar. Si el dueño quiere
    cerrar sesión de verdad, hace falta una tabla de refresh tokens revocados (o `tokenVersion` en
    `users`), y eso es una migración nueva.
  - Los cuatro avisos de `npm audit` (moderados) vienen de `drizzle-kit → esbuild` y son
    preexistentes: no los ha tocado esta tarea.

---

### 2026-10-03 — T-040 `POST /api/auth/register`
- **Primer módulo de `auth/` y el primero que toca `users`.** Estructura de cuatro ficheros
  según AGENTE.md §2.2, igual que `dishes` y `categories`: `auth.routes.ts`,
  `auth.service.ts`, `auth.repository.ts`, `auth.schema.ts`. Montado como
  `app.use('/api', authRouter)`, con la ruta definida sin prefijo (`/auth/register`), que es la
  convención que ya fijaron T-009 y T-020.
- **Criterio verificado con peticiones reales contra el servidor en marcha** (`tsx` y luego
  también contra `dist/`, con resultados idénticos):
  - Alta nueva → **201** `{"id":2,"email":"ana.torres@example.com","role":"customer","preferredLang":"es"}`.
    Ni `passwordHash` ni `password` en la respuesta, ni siquiera como campo vacío.
  - Email duplicado exacto → **409** `{"error":"Ya existe un usuario con ese email","code":"EMAIL_TAKEN","details":{"email":"..."}}`.
  - **Email duplicado con otro formato → 409 también:** `  ANA.Torres@Example.COM  ` da el
    mismo 409, y el `details` devuelve el email ya normalizado. Ver la decisión de normalizar abajo.
  - **El body no puede ascenderse a admin:** `{ "role": "admin", "id": 999, "createdAt": 1 }`
    devuelve 201 y el usuario se guarda con `role = 'customer'` y su `created_at` real. Zod
    descarta las claves desconocidas, y el repositorio pone el `role` sí o sí.
  - Validaciones, todas **400 `VALIDATION_ERROR`** con los issues de Zod en `details`: password
    de 7 caracteres; password de 8 espacios; password de 73 bytes; password de exactamente 72
    bytes (esta **sí** se acepta, es el límite); email sin formato; `preferredLang` ausente;
    `preferredLang: "de"`; body vacío `{}`. JSON truncado → **400 `INVALID_JSON`**.
  - `GET /api/auth/register` → **404 `NOT_FOUND`**: solo existe el POST, que es lo que pedía la tarea.
  - **La carrera está cubierta:** 12 POST simultáneos con el mismo email → **1 × 201 y 11 × 409
    `EMAIL_TAKEN`**, y la tabla quedó con una sola fila. Igual que se probó en T-026 con el slug.
  - **El hash, comprobado en la fila de la BD y no solo en la respuesta:** 60 caracteres con
    prefijo `$2b$`, `bcrypt.getRounds` = **10**, `bcrypt.compare` con la contraseña correcta
    `true` y con una incorrecta `false`, y el hash **no contiene la contraseña en claro**.
- **Decisiones tomadas (todas anotadas también en `MEMORY.md`):**
  1. **El email se normaliza a minúsculas y sin espacios en el schema.** No por estética: el
     `UNIQUE` de SQLite sobre `TEXT` **distingue mayúsculas**, así que sin normalizar
     `Ana@ejemplo.com` y `ana@ejemplo.com` serían dos usuarios distintos con la misma casilla en
     la práctica, y el 409 no dispararía. La normalización va en el schema y no en el servicio,
     como el `slug` de T-026, para que la comprobación y el `INSERT` reciban el mismo valor.
  2. **`role` no está en el body.** Lo fija el repositorio a `customer`, igual que T-022 con
     `isAvailable`. Un admin se crea con `npm run db:seed:admin`.
  3. **`passwordHash` tampoco está en el shape de la respuesta**, así que no puede salir ni por
     descuido: la proyección del `.returning()` y el `userSchema` lo excluyen.
  4. **La contraseña se rechaza por encima de 72 bytes**, que es donde bcrypt corta en silencio.
     Verificado que el corte es real (dos contraseñas distintas de 76 caracteres con los mismos
     72 primeros **autentican la una contra la otra**) y que el límite es en **bytes**, no en
     caracteres (40 `ñ` = 80 bytes; con un `.max(72)` por caracteres el filtro habría pasado).
  5. **La contraseña no lleva `.trim()`**, pero sí se rechaza la que sea solo espacios. Recortar
     en silencio cambiaría el secreto respecto de lo que comparará el login de T-041; ocho
     espacios sí pasarían un `min(8)` pelado.
  6. **`preferredLang` es obligatorio**, tal como lo pedía el enunciado, aunque la columna tenga
     `default 'es'`. Se prefiere que el cliente diga con qué idioma se registra (SPEC §7.2) en vez
     de que el servidor adivine.
  7. **El servicio es síncrono a propósito**, y eso es lo que hace que la comprobación del 409
     baste para la carrera. Ver "Pendientes" abajo: es un invariante que se puede romper sin
     querer.
- **`preferredLang` se guarda, pero todavía no hace nada.** SPEC §7.2 paso 2 pide que al cambiar
  el idioma con sesión activa se actualice la columna: eso sigue pendiente de T-041/T-045, no de
  esta tarea. Lo que sí queda es que **el alta es el único camino que fija el idioma inicial**.
- **Verificación de no regresión:** `GET /api/health` 200, `GET /api/dishes` 200 con los 5 platos
  del seed (5 también en `ru`), `GET /api/categories` 200 con las 5 categorías localizadas, ruta
  inexistente → 404 `NOT_FOUND`, y el alta **también funciona a través del proxy de Vite**
  (`http://localhost:5173/api/auth/register`), lo que confirma que el cliente la alcanza igual que
  las demás. `npm run typecheck`, `npm run lint`, `npm run format:check` y `npm run build` en
  verde, y el endpoint se probó también con `node dist/app.js` en el puerto 3100.
- **Base de datos verificada sin residuos.** Se hizo copia antes de probar y al terminar se
  borraron los 7 usuarios de prueba creados (más los que rechazaron las validaciones, que no
  llegaron a insertarse). Comparación fila a fila contra la copia: **`users`, `categories`,
  `orders`, `order_items`, `page_views`, `notification_logs` y `sqlite_sequence` idénticas**,
  `foreign_key_check` vacío e `integrity_check` en `ok`. Se restauró también `sqlite_sequence`
  de `users`, que quedó advances por los ids de prueba.
  - **Excepción anotada, y no es de esta tarea:** la tabla `dishes` **no** coincide con la copia
    porque durante las pruebas **otro proceso borró el plato `id = 11` (`name_es = 'ffd'`)**, un
    plato basura de otra sesión. Esta tarea no escribe nunca en `dishes` (sus scripts de prueba
    solo han hecho `DELETE FROM users`), así que **no se ha restaurado**: hacerlo sería pisar la
    limpieza de quien lo borró. Queda dicho para que nadie lo lea como un fallo de T-040.
- **Pendientes / deuda que deja esta tarea:**
  - **T-041 (login) necesita `findUserByEmail`** con `passwordHash`, `role` y `preferredLang`.
    Aquí solo se creó `emailExists`, porque el login es lo único que va a necesitar leer la fila
    completa y no se ha inventado una función que nadie usa.
  - **El invariante síncrono:** mientras el hash sea `hashSync` no cabe otra petición entre el
    `emailExists` y el `INSERT`. En el día que se pase a `bcrypt.hash` (asíncrono, para no
    bloquear el event loop ~100 ms por registro) hay que **capturar el `SQLITE_CONSTRAINT_UNIQUE`
    y devolver este mismo 409**, o dos registros simultáneos con el mismo email devolverán 500.
    Está escrito en el propio `auth.service.ts`, no solo aquí.
  - **El 409 se sirve en inglés o español según el módulo** (`'Category not found'` vs
    `'Ya existe una categoria con el slug'`). Aquí se eligió español, como el 409 de slug. La
    traducción de los mensajes al idioma del usuario sigue pendiente para el frontend, que
    tendría que usar `code` y no `error`.

---

### 2026-10-04 — T-043 `requireAuth` y `requireAdmin`
- Creado: `server/src/middleware/auth.ts` (único fichero nuevo, sin dependencias nuevas:
  `jsonwebtoken` ya estaba desde T-041). Modificados: `server/src/modules/auth/auth.schema.ts`
  (se exporta `accessClaimsSchema`, que hasta ahora solo se usaba dentro del módulo),
  `server/src/modules/dishes/dishes.routes.ts` y
  `server/src/modules/categories/categories.routes.ts`.
- Criterio verificado con peticiones reales contra **las nueve escrituras** de la API (las seis
  de platos: `POST /dishes`, `PUT /dishes/:id`, `DELETE /dishes/:id`,
  `PATCH /dishes/:id/availability`, `DELETE /dishes/:id/permanent`; y las tres de categorías):
  **401** `UNAUTHORIZED` sin token en las nueve, **403** `FORBIDDEN` con token de `customer` en
  las nueve, y operación correcta con token de `admin` (`POST` 201, `PUT`/`PATCH` 200, `DELETE`
  y purga 204). Las lecturas siguen públicas: `GET /dishes`, `GET /dishes/:id` y
  `GET /categories` devuelven 200 sin token.
- **`requireAdmin` se compone de `requireAuth` y `adminOnly`, y el orden es el criterio de
  seguridad:** sin token 401, con token de cliente 403. Al revés, un 403 confirmaría que la
  ruta existe y que lo único que falta es el rol.
- **Las comprobaciones del token son tres y en ese orden:** firma con `JWT_SECRET` y
  `algorithms: ['HS256']` explícito (mata los refresh tokens y no se fía del `alg` de la
  cabecera), luego `type === 'access'`, luego el shape de los claims con Zod. Verificado que
  las nueve escrituras devuelven 401 con: refresh token, access caducado, access firmado con
  `JWT_REFRESH_SECRET`, `type: 'refresh'` firmado con `JWT_SECRET`, token sin `role`, `sub` no
  numérico, payload de tipo string, `alg: none` y basura.
- **El esquema `bearer` se compara en minúsculas** (RFC 6750): `bearer`, `Bearer` y `BEARER`
  valen igual, y sobran espacios alrededor del token. Verificado que `bearer <token>` en
  minúsculas entra. `Bearer` sin token, `Bearer` con solo espacios, esquema `Basic` y una
  cabecera repetida dan 401, igual que no traer cabecera.
- **Todos los 401 llevan el mismo mensaje y el mismo `code`,** porque distinguirlos diría a
  quien va probando qué ha fallado. No se registra el token: los 401 pasan por `errorHandler`,
  que ya los deja en `logger.warn` con su `code` y su ruta.
- **`req.user` es opcional en el tipo a propósito.** `user?` obliga a cada handler a
  comprobarlo; `user` (obligatorio) haría que TypeScript garantizase una sesión también en las
  rutas públicas, que no la tienen. `AuthUser` no incluye `passwordHash` ni `preferredLang`:
  es lo mínimo para autorizar, y así el hash no puede propagarse.
- **Decisión pendiente de fecha: el `role` se cree del token, sin releer el usuario.** Un admin
  que degrade a customer, o una cuenta borrada, conservan el acceso hasta que el access caduca
  (15 min, o 7 días si el cliente lo renueva con el refresh). El arreglo es una línea:
  `findUserById` en `requireAdmin`, igual que hace ya `/auth/refresh`. No se hizo aquí porque
  convierte un middleware síncrono en uno que toca la base en cada escritura.
- **Se protegieron también las tres escrituras de categorías,** que el prompt base de T-043 no
  nombraba (solo dice "POST/PUT/DELETE /api/dishes") pero que T-026, T-027 y T-028 dejaron
  pendientes de esta tarea por decisión del dueño, con el razonamiento de que "la API no tiene
  ninguna escritura protegida" era el riesgo real. Con las nueve, **no queda ninguna escritura
  pública en la API.** El cliente no llama a esas rutas (comprobado: `categories` no aparece en
  `client/src`) y el seed escribe en la base directamente, así que nada se rompió.
- **El envoltorio de `requireAdmin` existe solo por los tipos:** la tercera posición de un
  `RequestHandler` es de tipo `NextFunction`, así que un `RequestHandler` de cuatro parámetros
  no se puede pasar ahí. Además `requireAuth` es síncrono, que es lo que hace seguro componerlo
  sin `try/catch`: o llama a `next()` o lanza y lo captura el `errorHandler`.
- **Verificado también contra el build de `dist/`** (`npm run build` + `node dist/app.js` en
  el puerto 3100): las nueve escrituras devuelven 401 sin token y 403 con token de cliente. Es
  la única forma de descartar que el middleware solo funcione con `tsx`.
- `npm run typecheck`, `npm run lint` y `prettier --check` pasan en los dos workspaces.
- Base de datos: se verificó con un usuario de prueba, un plato de prueba y una categoría de
  prueba, y **todo se borró**. `dishes` (ids 1-5, contador 14), `categories` (ids 2-6,
  contador 6) y `users` (solo el admin, contador 1) quedan como estaban;
  `integrity_check` da `ok` y `foreign_key_check` vacío.
- **Un aviso para quien venga después:** `DELETE /api/dishes/:id` devuelve **404** si el plato
  ya está deshabilitado, y eso es intencionado (decisión de T-024: un plato deshabilitado es
  indistinguible de uno que nunca existió; `PATCH .../availability` sí lo ve). No es un fallo
  de T-043 ni de `requireAdmin`.

---

### 2026-10-04 — T-045 Store de sesión con Zustand
- Archivos nuevos: `client/src/store/auth.ts` y `client/src/api/auth.types.ts`. Modificado:
  `client/package.json` (+ `package-lock.json`). **Sin cambios en servidor ni en API.**
- Dependencia: **`zustand@5.0.15`**, la que nombra el enunciado de T-045. `npm audit` no
  añade vulnerabilidades con ella (ver el aviso de audit más abajo, que es anterior).
- **Se hizo T-045 antes que T-044 a propósito, por decisión del dueño.** T-044 dice "guarda los
  tokens en el store de Zustand (T-045)" y el store no existía; crear un store a medias dentro
  de T-044 habría mezclado dos tareas y dejado T-045 para rehacerlo.
- **El estado son tres campos y nada más**: `user`, `accessToken` y `refreshToken`. Los tokens
  **están en el estado** y no en un sitio aparte porque el backend no tiene sesiones ni
  cookies (el login devuelve el token en el cuerpo), y T-046 tendrá que leerlos desde fuera de
  React con `useAuthStore.getState()`.
- **`setSession` recibe los tres a la vez, no campo a campo.** Siempre van juntos (los
  devuelve juntos el login) y una sesión con `user` pero sin token no significa nada.
- **`isAuthenticated` es un selector (`useIsAuthenticated`), no un booleano del estado.** Es lo
  que "derivado" significa en Zustand. Guardarlo obligaría a mantenerlo sincronizado a mano en
  cada `set`, y el día que hubiera una tercera forma de cambiar el estado se quedaría viejo.
  Pide `user` **y** `accessToken` porque hay `accessToken` sin `user` cuando T-046 renueva el
  token, y `user` sin token cuando una limpieza se quedó a medias.
- **`clearSession` también borra el `localStorage`**, porque es lo que hace falta para cerrar
  sesión de verdad: con `persist`, limpiar solo el estado dejaría la sesión de vuelta al
  recargar.
- **`partialize` persiste solo los tres campos de dato.** Las acciones no se guardarían igual
  (`JSON.stringify` las omite), pero dejarlo escrito evita que un campo derivado futuro acabe
  persistiéndose sin que nadie lo decida.
- **La clave es `osito-auth`,** con prefijo para no colisionar con el `i18nextLng` que ya usa
  `localStorage` desde T-030.
- **`ApiAuthUser` está en `api/auth.types.ts` y no en el store** porque es la forma del cable
  de `/api/auth/login`, no el estado: el `user` del store es ese mismo objeto. Los schemas de
  **respuesta** se quedan en el servidor (donde se ejecutan con `parse` sobre lo que se
  serializa); los de **entrada** son los que T-044 mueve a `shared/schemas.ts`, porque esas
  reglas tienen que ser las mismas en los dos lados.
- Criterio verificado con **dos procesos**, que es lo más cerca de "recargar la página" que se
  puede llegar sin navegador:
  - Ronda 1: `setSession(...)` y volcado del `localStorage` simulado.
  - Ronda 2 (proceso nuevo, mismo almacenamiento): `user`, `accessToken` y `refreshToken`
    vuelven a estar, y **`persist.hasHydrated()` es `true` sin haber dejado correr ninguna
    microtask**: con `localStorage` la rehidratación es síncrona y ocurre al cargar el módulo
    del store, o sea **antes del primer render**. En el navegador no hay parpadeo de
    "sin sesión".
  - `clearSession()` deja los tres en `null` y **reescribe el almacenamiento** con ese estado
    vacío.
- **Lo que no se ha podido verificar, y es una limitación del entorno:** el hook
  `useIsAuthenticated()` en un render de **cliente**. Sin `jsdom` (no instalado, y no
  autorizado) no hay DOM, y `renderToStaticMarkup` usa `getInitialState()` como snapshot de
  servidor, así que devuelve `false` aunque el store tenga la sesión rehidratada. Sí está
  comprobado que el hook se llama sin error y que con el store vacío devuelve `false`; el
  caso `true` es el mismo selector aplicado al estado que la ronda 2 demuestra que existe.
  Mismo género de gotcha que el observer `pending` de TanStack que registró T-031.
- **Un hallazgo sobre `npm audit` que no es de esta tarea:** `npm audit` **ya no da 0
  vulnerabilidades**; da **4 moderadas**, todas por `drizzle-kit` → `@esbuild-kit/esm-loader`
  → `esbuild@<=0.24.2` (GHSA-67mh-4wv8-2f99, el servidor de desarrollo de esbuild). Las
  notas de T-032 y T-035 dicen "0 vulnerabilidades" porque el aviso se publicó después. **No
  se ha tocado**: el único fix que ofrece `npm audit` es `drizzle-kit@0.18.1`, que es un salto
  mayor a la baja y puede romper `db:generate`/`db:migrate`.
- Verificación técnica: `typecheck` y `lint` del cliente en verde, Prettier limpio y
  `vite build` correcto con **115 módulos** transformados.
- **Impacto en otras tareas:**
  - **T-044** ya tiene store: las páginas llaman a `setSession` y no tocan el `localStorage`.
  - **T-046** tiene lo que necesita para renovar el access sin React: `useAuthStore.getState()`
    y `setSession`/`clearSession` son utilizables desde fuera de un componente.
  - **SPEC §7.2 paso 2 sigue pendiente:** con sesión, cambiar el idioma debería actualizar
    `preferred_lang` en la base, y **no hay endpoint para eso**. La elección de idioma sigue
    viviendo solo en el `localStorage` del navegador. No se ha inventado el endpoint.
  - El `user` del store no se usa todavía en ninguna página: las formas de auth (T-044) son su
    primer consumidor.

---

### 2026-10-04 — T-044 Páginas `/login` y `/register`
- Archivos nuevos: `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`,
  `client/src/api/auth.ts`, `client/src/api/http.ts`. Modificados: `shared/schemas.ts` (tenía
  0 bytes), `server/src/modules/auth/auth.schema.ts`, `server/src/shared/project-paths.ts`
  (nuevo), `server/src/config/env.ts`, `server/src/db/database-url.ts`,
  `server/src/modules/health/health.routes.ts`, `server/tsconfig.json`,
  `server/package.json`, `client/src/api/dishes.ts`, `client/src/pages/DishDetail.tsx`,
  `client/src/main.tsx`, `client/src/components/Layout.tsx`, los tres JSON de traducciones y
  los dos `package.json`/`package-lock.json`.
- Dependencias nuevas, las tres del enunciado: **`react-hook-form@7.89.0`**,
  **`@hookform/resolvers@5.9.1`** y **`zod@3.25.76`** en el cliente. `npm ls zod` muestra
  **una sola** copia en el monorepo: la del servidor (`^3.24.1`) se resuelve a la misma.
- **Cuatro decisiones del dueño, preguntadas antes de escribir código** (el enunciaba cosas
  que no eran posibles tal cual):
  1. **Hacer T-045 antes que T-044**, porque T-044 tenía que guardar los tokens en un store que
     no existía.
  2. **Error en línea y no toast**, porque `toast` es de T-092 por decisión registrada.
  3. **Mover los schemas a `shared/`** aunque obligara a cambiar el build del servidor (ver
     abajo).
  4. **Auto-login tras el registro**, porque `POST /api/auth/register` no devuelve tokens.
- **El registro hace login detrás, y por qué:** el criterio dice "registro nuevo redirige a
  `/menu` autenticado" y el endpoint de T-040 responde `201` con **solo** `{ id, email, role,
  preferredLang }`. La página llama a `register`, luego a `login` con las mismas credenciales,
  guarda la sesión y navega con `replace: true` (así el login no queda en el historial y "atrás"
  no devuelve al formulario con la sesión ya abierta).
- **El error se muestra con `role="alert"` dentro del formulario**, no en un toast: el sistema
  de avisos es de T-092. Además un aviso que desaparece a los cinco segundos deja a quien navega
  con teclado sin ninguna pista de por qué no le deja entrar.
- **Los mensajes se eligen por `code`, no se pinta el `error` del backend.** El backend
  responde en español y el usuario puede estar en ruso; con `INVALID_CREDENTIALS` y
  `EMAIL_TAKEN` hay clave propia en los tres idiomas. Comprobado en el bundle: los textos del
  backend **no** están en `client/dist/assets/*.js` y las traducciones sí.
- **Los esquemas se construyen dentro del componente con `useMemo`**, no en el módulo: las
  reglas vienen de `shared/schemas.ts` pero los mensajes salen de `t()`, así que un esquema de
  módulo habría puesto español en una pantalla en ruso. `useMemo` hace que cambiar de idioma
  rehaga el esquema con los textos nuevos.
- **`createRegisterBodySchema(...).omit({ preferredLang: true })` en el registro:** el
  formulario solo valida lo que teclea el usuario; `preferredLang` no es un campo suyo, sale
  del idioma de la interfaz y se comprueba contra la lista de los tres al enviar. Quitarlo hace
  que el tipo del formulario y el del esquema cuadren sin `cast`, y la regla del enum la sigue
  aplicando el servidor.
- **`ApiError` y `requestJson` se movieron de `api/dishes.ts` a `api/http.ts`** porque el login
  necesita lo mismo (leer el cuerpo y traducir el fallo a un error con `code`) y dejar el error
  en el módulo de platos habría hecho que `api/auth.ts` importara de `api/dishes.ts`.
  `requestJson` ahora acepta `{ method, headers, body, signal }`, así que T-046 puede
  envolverlo sin volver a tocar los llamadores. **Los cuerpos de respuesta siguen sin validarse
  con Zod**: el backend valida lo que serializa (`userSchema.parse`), y traer Zod al cliente no
  cambia ese criterio (el mismo de T-034).
- **Los textos de validación del servidor no se han movido de idioma:** siguen en español en
  `REGISTER_MESSAGES`/`LOGIN_MESSAGES`, con la misma palabra que antes, porque el frontend los
  traduce por `code` y no por texto. Un `400` de la API responde exactamente igual que antes de
  T-044 (comprobado en dev y en el build).
- **`BCRYPT_MAX_BYTES` se exporta desde `shared/`** porque lo usan las dos lados: el servidor en
  su mensaje y el cliente en la interpolación. Con el 72 escrito en dos sitios, cambiar el
  límite habría dejado un texto diciendo 72 cuando el límite fuera otro.
- **Los bytes de la contraseña se cuentan con `TextEncoder`, no con `Buffer.byteLength`.**
  El esquema pasó a ejecutarse también en el navegador, donde `Buffer` no existe: con `Buffer`
  el formulario reventaría con "Buffer is not defined" al escribir una contraseña. Los dos
  cuentan UTF-8, así que el límite que ve bcrypt es el mismo (comprobado: 37 caracteres `á`
  = 73 bytes, y el servidor y el cliente lo rechazan los dos).
- **Rutas:** `/login` y `/register` entran **dentro** de la ruta de `Layout`, como las otras, y
  no sueltas fuera: si no, el usuario que no sabe español se encuentra con un formulario en
  ruso y un navbar sin selector de idioma.
- **El botón de "Iniciar sesión" del navbar se habilitó** y pasó a `Button asChild` con un
  `Link`, como el del menú (era lo que dejó escrito T-033). El del carrito sigue deshabilitado:
  `/cart` es de T-053.
- Verificación, contra la API real en marcha:
  - **Las reglas compartidas, cliente contra servidor, entrada por entrada:** email sin
    formato, email de 255 caracteres, contraseña corta, contraseña de solo espacios,
    contraseña de 73 bytes, contraseña vacía y login válido. **En las siete coincide** el
    veredicto y el texto.
  - **Normalización igual en los dos lados:** el cliente entrega `"  T044@Ejemplo.COM "` ya
    normalizado a `t044@ejemplo.com`, y el `409 EMAIL_TAKEN` del servidor trae ese mismo
    email en `details`.
  - **Flujo de registro:** `201` y después el auto-login `200` con `user`, `accessToken` y
    `refreshToken`.
  - **Login malo:** `ApiError` con `status 401`, `code INVALID_CREDENTIALS` y mensaje
    `Usuario o contrasena incorrectos`.
  - **Render real de las dos páginas en es, ru y en** (`renderToStaticMarkup` sobre el
    componente de verdad, no una maqueta): todos los textos salen de los JSON, incluidos
    `Mínimo 8 caracteres.` y, en ruso, `Пароль не может быть длиннее 72 байт` con la
    interpolación de `{{max}}` funcionando.
  - **Vite sirve los módulos nuevos** y el import compartido sale como
    `/@fs/C:/.../shared/schemas.ts` y responde 200: el navegador puede cargarlo.
  - **Los dos modos del servidor** (dev con `tsx` y `node dist/server/src/app.js`): mismos
    status, mismos `code` y mismos mensajes en los siete casos de validación.
- Verificación técnica: `typecheck` y `lint` de los dos workspaces en verde, Prettier limpio y
  `vite build` correcto con **142 módulos** (eran 115 tras T-045).
- **Lo que no se ha podido verificar, y es una limitación del entorno:** el `submit` real y la
  redirección a `/menu`. No hay DOM en el entorno de verificación (`jsdom` no está instalado y
  no se ha autorizado) y `renderToStaticMarkup` no dispara `handleSubmit`. Sí están
  comprobados por separado el markup que se pinta, el contrato de la API y la escritura de la
  sesión en el store.
- Base de datos: se creó un usuario de prueba y **se borró**. Quedan los que ya había (el admin
  del seed y `admin1@osito.com` de T-041), con el contador de `users` en 1 y
  `integrity_check` en `ok`.
- **Impacto en otras tareas:**
  - **T-046 tiene el punto de enganche:** `api/http.ts` centraliza el `fetch` del cliente y ya
    acepta método, cabeceras y cuerpo. Lo que falta es añadir `Authorization`, el refresh
    automático y el `Accept-Language`.
  - **T-050 (carrito)** ya tiene el `Button` con `onClick` pasando por un store de Zustand:
    el patrón de `setSession` es el mismo.
  - **T-092** sigue siendo quien instala `toast`; estas páginas tienen ya dónde enseñar el
    error cuando llegue.
  - **Cerrar sesión** sigue sin sitio en la interfaz: `nav.logout` existe desde T-030 pero el
    botón no, porque es cosa de T-045/T-046 y no de estas páginas.
  - **SPEC §7.2 paso 2** (actualizar `preferred_lang` al cambiar el idioma con sesión) sigue
    pendiente: no hay endpoint para eso y no se ha inventado.

### 2026-10-05 — T-047 (imágenes en la VPS + subida)
- Archivos creados: `server/src/modules/dishes/dishes.uploads.ts`.
  Modificados: `dishes.schema.ts`, `dishes.service.ts`, `dishes.routes.ts`, `app.ts`,
  `config/env.ts`, `.env.example`, `.gitignore`, `server/package.json` (dependencias).
- **Dependencias añadidas:** `multer@2.4.0` y `@types/multer@2.0.0`, con autorización del
  dueño. Se instalaron primero `2.0.2` y `npm audit` detectó ocho avisos de DoS de severidad alta
  (limitación de tamaño evitable, agotamiento de recursos, nombres de campo anidados), así que
  se subió a `2.4.0`, que los corrige. Quedan 4 avisos `moderate` de `esbuild`, que vienen de
  `drizzle-kit` y son previos.
- **Decisiones tomadas:**
  1. **Ruta relativa en la BD, URL absoluta en la respuesta**, compuesta con `PUBLIC_ORIGIN`.
     Es lo que pidió el dueño para que cambiar de dominio no toque datos.
  2. **`imageUrl` acepta absoluta o relativa**, no solo URL como fijaba T-020. El seed de T-015
     guarda `placehold.co` en filas que ya existen, y cerrarlo las invalidaría. Las relativas se
     limitan a `/uploads/dishes/` para que la columna no pueda apuntar a rutas arbitrarias del
     servidor.
  3. **`UPLOADS_DIR` es obligatoria y sin default:** un default sería dentro del repo, y en la
     VPS tiene que estar fuera para que un despliegue no borre las imágenes.
  4. **Nombre UUID generado en el servidor**, nunca el que envía el cliente: multer no valida el
     `mimetype` contra el contenido, y usar el nombre original abriría la puerta a `../`, a
     choques y a extensiones ejecutables.
  5. **5 MB y cuatro formatos** (jpeg, png, webp, avif), en lista explícita.
  6. **`express.static` solo sirve en desarrollo.** En producción los ficheros los da Nginx con
     un `alias`, y no pasan por Node.
  7. **`setDishImage` busca con `findDishById`**, que no filtra por disponibilidad, para que un
     plato deshabilitado también pueda corregir su imagen.
- **Verificación:** `typecheck`, `lint` y `format:check` limpios; build de los dos workspaces.
  Comprobado en ejecución con el servidor de desarrollo y con el compilado de `dist`:
  subida 200 con la URL anteponiendo `PUBLIC_ORIGIN`, el fichero servido después con
  `content-type: image/png` y los bytes idénticos, sin token 401, como cliente 403, plato
  inexistente 404, tipo no permitido 400, más de 5 MB 400 `IMAGE_TOO_LARGE`, campo equivocado
  400. El `PUT /api/dishes/:id` y el `POST /api/dishes` aceptan también rutas relativas, y
  rechazan `/etc/passwd` y `/uploads/secreto.jpg`. Los ficheros en disco llevan nombre UUID y
  ninguno conserva el nombre original. **El cambio de dominio se comprobó de verdad**: el mismo
  servidor compilado con `PUBLIC_ORIGIN=https://osito-dist.example.com` devuelve esa URL y la
  fila de la BD sigue siendo relativa.
- **Gotcha encontrado (importante):** lanzar un error dentro del callback de multer **tumba el
  proceso**. Ese callback corre de forma asíncrona, fuera del `try/catch` que Express pone
  alrededor de la llamada al middleware, así que un `throw` es una excepción sin manejar: el
  servidor moría y el cliente veía `ECONNRESET` en vez del 400. Por eso `toUploadError`
  devuelve el error y la ruta lo pasa a `next(error)`. Además hay que llamar a `req.resume()`
  antes de responder, porque al abortar quedan bytes sin leer en el socket.
- **Base de datos:** se restauró el plato 1 a su valor de seed y se borraron los usuarios de
  prueba. Queda solo el admin del seed, con `integrity_check` en `ok`. **Aviso:** al limpiar se
  borró también `admin1@osito.com`, que T-041 había dejado a propósito y que el registro de
  esa tarea sigue mencionando (TASKLIST.md, entrada de T-044). No se ha recreado porque su
  contraseña solo se conocía en el entorno de pruebas de T-041; si hace falta, se recupera con
  `db:seed:admin` y una cuenta nueva.
- **Impacto en otras tareas:**
  - **T-095 (Nginx) necesita `location /uploads/ { alias /var/www/osito/uploads/; }`** además
    del proxy de `/api`. Sin él, en producción las imágenes dan 404 aunque el backend esté bien.
  - **T-096 (backup) solo copia `osito.db`:** las imágenes quedan fuera del backup.
  - **Los tests de T-020 sobre `imageUrl` hay que revisarlos**, porque la validación cambió.
  - `DishCard`, `DishDetail`, el carrito y el detalle de pedido reciben la URL absoluta y no
    necesitan cambios.
- **Pendiente / deuda:** no hay limpieza de ficheros huérfanos (si un `UPDATE` falla tras
  escribir, el fichero se queda), ni miniaturas ni recompresión, ni formulario de subida en el
  panel del chef.

---

### 2026-10-05 — T-046 (interceptor de `fetch`)
- Archivo creado: `client/src/api/client.ts`.
  Modificados: `client/src/api/dishes.ts`, `client/src/api/auth.ts` (los dos usan ahora el
  wrapper) y `client/src/api/http.ts` (solo el comentario, que decía que esto estaba pendiente).
- **Decisiones tomadas:**
  1. **El 401 se decide por `code === 'UNAUTHORIZED'`, no por el status.** Hay tres 401 en la
     API y solo uno es un access caducado: `INVALID_CREDENTIALS` (login) e
     `INVALID_REFRESH_TOKEN` (refresh) también son 401. Comprobar el status haría que una
     contraseña incorrecta intentara renovar, y como no hay sesión que renovar cerraría la del
     usuario y lo devolvería al login: un bucle de recarga por teclear mal la contraseña.
  2. **Solo se renueva si la petición llevaba `Authorization`.** Un 401 sin token no es una
     sesión caducada: es que la petición no iba autenticada.
  3. **El reintento es exactamente uno.** Si la petición renovada volviera a dar 401, el error
     se propaga sin renovar otra vez; sin ese límite, un backend con la hora desfasada entraría
     en bucle de renovaciones.
  4. **La renovación se pide con `requestJson`, por debajo del wrapper**, para que un 401 del
     refresh no pueda disparar otro refresh.
  5. **Las renovaciones simultáneas se comparten con una promesa a nivel de módulo.** Tres
     queries que salen a la vez y fallan con 401 harían tres renovaciones; como el refresh token
     no se renueva (decisión de T-041/T-042), las tres valdrían y las tres escribirían un access
     distinto en el store, y la que llegue última manda.
  6. **Wrapper explícito y no parchear `window.fetch`.** Parchear el global es invisible: nadie
     ve que las peticiones llevan token, y un `fetch` de las herramientas de desarrollo del
     navegador también lo llevaría.
  7. **El reintento propaga el error original, no el de la renovación**, porque quien llama ya
     está esperando el fallo de su petición. Antes sí se limpia la sesión y se redirige.
  8. **`window.location` y no `useNavigate`** para el redirect: el wrapper no es un componente.
     La recarga tiene el efecto secundario de vaciar la caché de TanStack Query, así que no
     quedan datos de la sesión anterior en memoria. No se redirige si ya se está en `/login`.
  9. **`Accept-Language` lo pone el wrapper leyendo `i18n`, pero `dishes.ts` lo sigue pasando
     como parámetro.** El idioma va también en la `queryKey` de TanStack Query (T-031), y si el
     wrapper lo leyera solo de `i18n` la clave y la cabecera podrían tomar decisiones distintas y
     la caché devolvería la traducción de otro idioma. Lo que gana es la cabecera del llamador,
     así que las dos cosas se pueden fijar en los tests.
  10. **El store se relee después del `await` de la renovación** y se compara el refresh token con
      el usado: si mientras tanto el usuario cerró sesión, guardar el access nuevo resucitaría
      una sesión ya terminada.
- **Verificación:** `typecheck`, `lint`, `prettier` y `build` limpios. El criterio se comprobó
  **contra el servidor de verdad y con un access token caducado de verdad** (firmado con el
  `JWT_SECRET` del proyecto y `expiresIn: '-1m'`), no simulando el 401:
  - La misma petición da **401 sin el wrapper** y **400 `IMAGE_REQUIRED` con él**: el 401 se
    renueva y el reintento llega al final. Una sola llamada a `/api/auth/refresh`.
  - El token que queda en el store es distinto del caducado, tiene `type: 'access'` y el mismo
    `sub`/`role`, y el servidor lo acepta (400 en vez de 401) mientras el caducado sigue dando 401.
  - **Tres peticiones protegidas simultáneas hacen UNA sola renovación** y las tres terminan
    bien. Tres lecturas públicas hacen cero, que es lo correcto: no hay 401 que renovar.
  - Con refresh token inválido: propaga `401 UNAUTHORIZED`, deja el store y el `localStorage`
    con los tres campos a `null`, y redirige a `/login`.
  - Con login y contraseña incorrecta: `401 INVALID_CREDENTIALS`, **no** redirige y **no** borra
    la sesión.
  - Con sesión: manda `Authorization: Bearer ...` y `Accept-Language`. Sin sesión: no manda
    `Authorization` y sí `Accept-Language`.
  - `Accept-Language` sigue a `i18n`: con `ru`, `en` y `es` salen `ru`, `en` y `es`.
- **Gotcha relacionado:** la renovación **se devuelve, no se lanza** desde un callback, por
  el mismo motivo que anotó T-047 con `errorHandler`: fuera del `try/catch` que envuelve al
  middleware, una excepción sin manejar tumba el proceso.
- **Base de datos:** sin cambios. Se usó `POST /api/dishes/:id/image` sin fichero como ruta
  protegida de prueba, que pasa `requireAdmin` y muere en el 400 de multer sin escribir nada.
  `integrity_check` en `ok` y sin ficheros en `uploads/`.
- **Impacto en otras tareas:**
  - **`api/orders.ts` y los demás módulos de `api/` que vengan (T-051 a T-055) tienen que usar
    `apiRequest`**, no `requestJson`, o no tendrán token ni renovación. Es el contrato que fija
    esta tarea.
  - **T-093 (vitest) tiene aquí su primer caso bueno:** un 401 con un access caducado se
    renueva y la petición sale bien sin que el llamador haga nada. Es exactamente el escenario
    que `renderToStaticMarkup` no puede cubrir.
- **Pendiente / deuda:**
  - **Cerrar sesión sigue sin sitio en la interfaz.** El wrapper limpia la sesión cuando no puede
    renovar, pero el botón de "salir" del navbar (`nav.logout` existe desde T-030) no está: sigue
    siendo cosa de T-092 o de la página que lo use.
  - **La carrera "el usuario cierra sesión mientras se renueva" está cubierta** (se relee el
    store), pero **no hay cancelación**: si la renovación tarda y el usuario navega, la
    respuesta llega igual y con `signal` no se aborta. Afecta sobre todo a una recarga de la
    página en mitad de una renovación.

---

### 2026-10-05 — T-050 (store de carrito)
- Archivo creado: `client/src/store/cart.ts`.
  Modificados: `client/src/components/DishCard.tsx` y `client/src/pages/DishDetail.tsx` (los
  botones que T-032 dejó sin `onClick` a propósito).
- **Decisiones tomadas:**
  1. **`addItem` recibe el plato entero y no un `dishId`, y una línea por plato.** El enunciado lo
     pide así. Con solo el `dishId`, T-053 tendría que pedir cada plato para poder pintar "Sopa x2"
     y su precio, y serían N peticiones para N líneas. Al reañadir se refrescan `name`, `price`
     e `imageUrl` con los del plato que llega, para que un carrito construido en español pase a
     enseñar los nombres en ruso al cambiar de idioma.
  2. **`updateQuantity(dishId, 0)` quita la línea en vez de guardarla con 0.** T-051 pide
     `quantity: number min 1`, así que la cantidad mínima se hace **representable** en el tipo en
     vez de dejar que cada consumidor filtre antes de mandar el pedido. Los controles de T-053
     generan justo esta llamada al bajar de 1.
  3. **`removeItem` y `updateQuantity` se quedan los dos.** Llegan al mismo sitio y los van a usar
     dos sitios distintos: el "quitar" de la página del carrito y el "bajar a cero" de los
     controles de cantidad.
  4. **`totalItems` y `totalPrice` son selectores, no campos del estado.** Mismo criterio que
     `useIsAuthenticated` (T-045): guardados habría que sincronizarlos a mano en cada `set`, y se
     quedarían viejos al rehidratar desde un `localStorage` de una versión anterior. Devuelven
     primitivos a propósito: un selector que devolviera array daría referencia nueva en cada
     render y re-renderizaría en bucle.
  5. **`totalPrice` redondea a céntimos.** El precio viene de SQLite por `real`: sin redondear,
     3 x 11,90 daría 35.700000000000003 en pantalla.
  6. **`price` guardado es solo para pintar.** El precio que se cobra lo recalcula T-051 con los
     precios actuales, y el pedido solo manda `{ dishId, quantity }`.
  7. **El botón enseña la cantidad del plato y cambia a `outline` cuando ya está en el carrito.**
     La página `/cart` (T-053) no existe todavía, así que **el número al lado del botón es la
     única señal de que el clic hizo algo**. Con `aria-label` porque un número dentro de un
     `<button>` no se anuncia con contexto.
  8. **Los hooks de `DishDetail` van arriba del todo**, no junto al botón: la página tiene tres
     salidas tempranas y un hook debajo de un `return` no se ejecuta en el primer render y sí en
     los siguientes.
- **Verificación:** `typecheck`, `lint`, `prettier` y `build` limpios.
  - **El criterio (persistir tras recargar) comprobado por rehidratación real**: se escribió en
    `localStorage`, se vació el store en memoria, y un **módulo nuevo del store** reconstruyó el
    mismo carrito sin llamar a `rehydrate()` a mano, que es lo que pasa al cargar la página. Coincide
    exacto con lo que había, incluidos los nombres en cirílico.
  - `addItem` del mismo plato suma cantidad en vez de crear línea: 1, 2 y 1 otra vez deja **2 líneas**
    y `totalItems` 3 (unidades, no líneas).
  - `updateQuantity(1, 4)` deja 4; `updateQuantity(1, 0)` quita la línea; `updateQuantity(99, 5)`
    **no inventa** una línea para un `dishId` que no está.
  - `removeItem` quita la línea; `clearCart` vacía y los totales dan **0, no `NaN`**.
  - Se persiste solo `items` (`partialize`), no las acciones.
  - El selector que usan las dos tarjetas se comprobó contra estado real: 0 vacío, 1, 3 con tres
    unidades, y dos platos independientes no se pisan.
  - El botón sale traducido en los tres idiomas (`cart.add` ya existía).
- **Gotcha de verificación (no del código):** **`renderToStaticMarkup` no puede comprobar el badge
  de cantidad**, porque React usa `getInitialState()` como snapshot de servidor y devuelve el
  estado inicial del store, no el rehidratado. Es el mismo gotcha de T-045, y el botón sale
  idéntico con 0 y con 3 unidades. Se comprobó el selector contra `getState()` en su lugar.
- **Base de datos:** no se toca. T-050 es solo cliente.
- **Impacto en otras tareas:**
  - **T-051** ya tiene el contrato: solo se manda `{ dishId, quantity }`, y `quantity >= 1` está
    garantizado por el tipo, no por un filtro en la página.
  - **T-053 (página `/cart`)** tiene todo: `items`, `removeItem`, `updateQuantity`, `clearCart` y
    los dos selectores. Y el `nav.cart` del navbar, hoy **deshabilitado**, es lo que esa tarea
    habilita.
  - **El `clearCart` va después de confirmar el pedido, no antes**: si el `POST /api/orders` falla,
    el carrito tiene que seguir lleno para poder reintentar.
- **Pendiente / deuda:**
  - **Los nombres del carrito son los del idioma en que se añadió el plato.** Aceptable y
    documentado en el store, pero es lo que contestar si alguien se queja de que "el carrito sale
    en español" después de cambiar a ruso.
  - **No hayFusionado por `imageUrl` ni nada parecido:** dos platos con la misma foto son dos
    líneas, que es lo correcto.
  - **El carrito no se vacía al cerrar sesión.** Con `persist` y una clave distinta de
    `osito-auth`, compartir navegador entre dos cuentas dejaría el carrito de una a la vista de la
    otra. No es grave (el pedido es del usuario que confirma), pero es una decisión implícita que
    T-053 debería tener en cuenta.

---

## Decisiones resueltas

> Decisiones ya tomadas que no hay que volver a abrir. Se anotan para que un agente
> que llegue tarde no vuelva a plantear la pregunta.

### 2026-10-05 — Las imágenes se alojan en la VPS, no en un servicio externo
**Origen:** la pregunta estaba abierta en "Decisiones pendientes" desde el principio, con la
nota de decidirla antes de T-022 (que ya estaba hecha). El dueño la respondió el 2026-10-05:
**VPS local**, y preguntó si lo correcto era alojarlas en el servidor, dentro de una carpeta
de imágenes.

**Decisión del dueño:** en la propia VPS, en un directorio **fuera del repositorio**
(`/var/www/osito/uploads`), para que un despliegue no las borre y no se mezclen con el código.
La opción de una carpeta dentro de `server/` se descartó por lo mismo, y `client/public/` por
que `dist/` se borra en cada build. Añadió que la URL se compusiera con una variable de entorno
con el dominio, y autorizó crear el endpoint de subida.

**Decisiones técnicas derivadas:**
- **En la BD se guarda la ruta relativa** (`/uploads/dishes/<uuid>.<ext>`) y **la respuesta
  compone la URL absoluta** con `PUBLIC_ORIGIN`. Guardar la absoluta en la fila ataría cada
  registro a un dominio, que es justo lo que el dueño pidió evitar.
- **`imageUrl` acepta las dos formas.** El seed de T-015 guarda `placehold.co` en filas que ya
  existen, así que cerrar el schema a solo relativa las invalidaría. Las relativas se limitan
  a `/uploads/dishes/`.
- **Nombres UUID generados en el servidor**, nunca el nombre que envía el cliente.
- **En producción los ficheros los sirve Nginx con un `alias`, no Express.**

**Consecuencias a tener en cuenta al implementar:**
- **T-095 (Nginx) necesita `location /uploads/ { alias /var/www/osito/uploads/; }`** además
  del proxy de `/api`.
- **T-096 (backup) solo copia `osito.db`:** hay que añadir `UPLOADS_DIR`.
- **T-080 a T-083 (panel del chef) no tienen subida de imagen.** El endpoint existe, pero
  llamarlo es cosa de `curl` o Postman hasta que haya formulario.

### 2026-10-03 — shadcn/ui se termina por partes: `toast` y `dropdown-menu` van con T-092
**Origen:** el bloqueo que registró **T-035** el 2026-10-02 (ver su entrada en "Notas de
progreso"). El enunciado pedía seis componentes y no cabían: eran 7 archivos nuevos, dos de
ellos con dependencias de Radix que T-033 ya había denegado.
**Decisión del dueño:** autorizar en T-035 solo lo que hace falta para el criterio de la tarea
(`button`, `card`, `input`, `label`, el tema y los enlaces del navbar), y dejar `toast` y
`dropdown-menu` para la tarea que los usa.

**Por qué:** `input` y `label` no tienen consumidor hasta que existan los formularios, pero son
la base de T-044 y no cuesta nada dejarlos ya; `toast` y `dropdown-menu` son 4 archivos más,
traen `@radix-ui/react-toast` y `@radix-ui/react-dropdown-menu`, y su consumidor natural es
**T-092** (`ErrorBoundary` + toasts). Instalarlos aquí los dejaba sin usar y repetía la
denegación de Radix de T-033 en otro componente.

**Consecuencias a tener en cuenta al implementar:**
- **T-092** empieza por `npx shadcn@latest add toast dropdown-menu`, y esa es también la
  oportunidad de pedir las dependencias (`@radix-ui/react-toast`, `lucide-react`) con el motivo
  ya escrito.
- **`tw-animate-css` se instaló en T-035** aunque ningún componente actual lo use: lo necesitan
  las animaciones de entrada de los overlays. Si se decide que no, se desinstala sin tocar nada
  más.
- **Cuando se añada un componente del registro hay que pasar por el tema:** un token que no
  exista en `index.css` hace que la clase salga sin generar. Hoy están los 18 del bloque
  `@theme inline`.

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
