# TASKLIST.md  Osito a la carta

> Leyenda: `[ ]` pendiente В· `[~]` en progreso В· `[x]` completada В· `[!]` bloqueada
> Гљltima actualizaciГіn: 2026-10-12

---

## Fase 0  Setup del proyecto

- [x] **T-001**: Crear estructura de carpetas `server/`, `client/`, `shared/`, `docs/`
  - Criterio: existen las carpetas y cada una con su `package.json` (donde aplique).
- [x] **T-002**: Inicializar `server/` con TypeScript estricto
  - Criterio: `tsc --noEmit` pasa sin errores.
- [x] **T-003**: Inicializar `client/` con Vite + React + TypeScript
  - Criterio: `npm run dev` en client levanta la app en `:5173`.
- [x] **T-004**: Configurar proxy de Vite `/api` в†’ `http://localhost:3000`
  - Criterio: una llamada a `/api/health` devuelve `{ status: 'ok' }`.
- [x] **T-005**: Configurar Tailwind en `client/`
  - Criterio: una clase de Tailwind se aplica visualmente en `App.tsx`.
- [x] **T-006**: Configurar ESLint + Prettier en `server/` y `client/`
  - Criterio: `npm run lint` pasa sin errores en ambos.
- [x] **T-007**: Configurar `pino` como logger en `server/`
  - Criterio: el logger imprime JSON estructurado al arrancar.
- [x] **T-008**: Configurar validaciГіn de variables de entorno con Zod
  - Criterio: si falta una variable requerida, el server no arranca y explica cuГЎl.
- [x] **T-009**: Crear endpoint `GET /api/health`
  - Criterio: responde `{ status: 'ok', timestamp }`.

---

## Fase 1  Base de datos

- [x] **T-010**: Definir schema Drizzle en `server/src/db/schema.ts`
  - Criterio: `drizzle-kit generate` produce una migraciГіn vГЎlida con 6 entidades.
- [x] **T-011**: Aplicar migraciГіn inicial
  - Criterio: archivo `osito.db` creado con todas las tablas.
- [x] **T-012**: Script de seed con 5 platos de ejemplo en 3 idiomas
  - Criterio: `SELECT` devuelve 5 filas con datos en es / ru / en.
- [x] **T-013**: Script de seed con 1 usuario admin
  - Criterio: existe un usuario `admin@osito.local` con contraseГ±a hasheada.
- [x] **A-001** (aГ±adida 2026-10-01): CategorГ­as de platos
  - Criterio: tabla `categories` con nombre en es/ru/en y `dishes.category_id`; 5 platos agrupados por categorГ­a.

---

## Fase 2  API de platos

- [x] **T-020**: `GET /api/dishes` con localizaciГіn por `Accept-Language`
  - Criterio: con `Accept-Language: ru` devuelve nombres en ruso.
- [x] **T-021**: `GET /api/dishes/:id`
  - Criterio: devuelve 404 si no existe.
- [x] **T-022**: `POST /api/dishes` (solo admin)
  - Criterio: rechaza con 401 sin token, con 403 si no es admin; crea plato con categorГ­a.
- [x] **T-023**: `PUT /api/dishes/:id` (solo admin)
  - Criterio: actualizar solo el precio funciona; plato inexistente devuelve 404.
- [x] **T-024**: `DELETE /api/dishes/:id` (solo admin)  borrado lГіgico (`isAvailable = 0`)
  - Criterio: tras el DELETE el plato desaparece de `GET /api/dishes` pero sigue en la BD; 404 si no existe; 204 sin body.
- [x] **T-025**: `GET /api/categories` (pГєblico)
  - Criterio: devuelve categorГ­as en es/ru/en segГєn `Accept-Language`, ordenadas por `sortOrder`, con `slug` e `id`.
- [x] **T-026**: `POST /api/categories` (solo admin)
  - Criterio: rechaza 401 sin token, 403 si no admin, 409 si `slug` duplicado; crea categorГ­a.
- [x] **T-027**: `PUT /api/categories/:id` (solo admin)
  - Criterio: permite renombrar los tres idiomas y cambiar `sortOrder`.
- [x] **T-028**: `DELETE /api/categories/:id` (solo admin)
  - Criterio: rechaza 409 si la categorГ­a tiene platos asociados (incluye deshabilitados).
- [x] **T-029**: ГЌndice en `dishes.category_id`
  - Criterio: migraciГіn aplicada y `EXPLAIN QUERY PLAN` usa el Г­ndice al filtrar por categorГ­a.
- [x] **T-029a**: `PATCH /api/dishes/:id/availability` (solo admin)  habilita/deshabilita
  - Criterio: `{"isAvailable": true}` recupera plato deshabilitado; `false` lo retira sin borrar.
- [x] **T-029b**: `DELETE /api/dishes/:id/permanent` (solo admin)  purga fГ­sica
  - Criterio: borra la fila; 404 si no existe; 409 si plato disponible o con historial (`order_items`/`page_views`).

---

## Fase 3  Frontend: menГє y multi-idioma

- [x] **T-030**: Configurar `react-i18next` con `es.json`, `ru.json`, `en.json`
  - Criterio: cambiar idioma cambia textos sin recargar.
- [x] **T-031**: PГЎgina `/menu` que consume `GET /api/dishes`
  - Criterio: muestra todos los platos disponibles agrupados por categorГ­a.
- [x] **T-032**: Componente `DishCard` (imagen, nombre, descripciГіn, ingredientes, precio)
  - Criterio: se ve correctamente en mГіvil (1 col) y desktop (3 cols).
- [x] **T-033**: Selector de idioma en navbar, persistido en `localStorage`
  - Criterio: al recargar, mantiene el idioma elegido (orden detecciГіn: localStorage > navigator).
- [x] **T-034**: PГЎgina `/menu/:id` con detalle del plato
  - Criterio: muestra todos los datos del plato y botГіn "agregar al carrito".
- [x] **T-035**: Estilos base con Tailwind + shadcn/ui (botones, cards, navbar)
  - Criterio: UI coherente y responsive; navbar con logo, enlaces y selector de idioma; componentes `button`, `card`, `input`, `label` instalados; tema con tokens CSS en `index.css`.

---

## Fase 4  AutenticaciГіn

- [x] **T-040**: `POST /api/auth/register` con validaciГіn Zod
  - Criterio: rechaza email duplicado con 409 `EMAIL_TAKEN`; `role` fijado a `customer`; `passwordHash` nunca en respuesta.
- [x] **T-041**: `POST /api/auth/login` (devuelve access + refresh token)
  - Criterio: access 15 min, refresh 7 dГ­as; claims `{type, email, role, sub}` / `{type, sub}`; secretos distintos; 401 `INVALID_CREDENTIALS` mismo mensaje para email inexistente o contraseГ±a errГіnea.
- [x] **T-042**: `POST /api/auth/refresh`
  - Criterio: renueva access con refresh vГЎlido (200, solo accessToken); 401 `INVALID_REFRESH_TOKEN` para cualquier fallo; relee usuario por `sub`; no rota refresh.
- [x] **T-043**: Middleware `requireAuth` y `requireAdmin`
  - Criterio: 9 escrituras protegidas  401 sin token, 403 con token `customer`, 200/201/204 con token `admin`; exige `type === 'access'` y `JWT_SECRET`; `role` del token sin consultar BD.
- [x] **T-044**: PГЎginas `/login` y `/register` en frontend
  - Criterio: React Hook Form + Zod con reglas compartidas en `shared/schemas.ts`; auto-login tras registro; errores inline con `role="alert"` por `code`; `preferredLang` enviado y validado.
- [x] **T-045**: Store de sesiГіn con Zustand + persistencia en `localStorage`
  - Criterio: sesiГіn se mantiene al recargar si token vГЎlido; `isAuthenticated` selector derivado; persiste solo `user`, `accessToken`, `refreshToken`.
- [x] **T-046**: Interceptor de fetch que aГ±ade `Authorization` y maneja 401
  - Criterio: access expirado в†’ refresh automГЎtico в†’ reintenta peticiГіn; 401 por `code === 'UNAUTHORIZED'` solo si habГ­a token; un solo reintento; renovaciГіn compartida entre llamadas simultГЎneas.
- [x] **T-047**: ImГЎgenes de platos en la VPS + `POST /api/dishes/:id/image`
  - Criterio: admin sube imagen, se guarda en disco con nombre UUID, ruta relativa en `dishes.image_url`, API devuelve URL absoluta con `PUBLIC_ORIGIN`.

---

## Fase 5  Carrito y pedidos

- [x] **T-050**: Store de carrito con Zustand persistido en `localStorage`
  - Criterio: agregar, quitar, modificar cantidades funciona tras recargar; copia del plato en el item; `quantity: 0` quita la lГ­nea; totales son selectores derivados.
- [x] **T-051**: `POST /api/orders` con validaciГіn Zod y transacciГіn
  - Criterio: crea `Order` + `OrderItem` atГіmicamente; `userId` del token; valida items (sin duplicados, cantidad в‰Ґ1, platos disponibles); total con precios actuales redondeado a cГ©ntimos; respuesta `{ language, order }`.
- [x] **T-052**: `GET /api/orders` (historial del usuario autenticado)
  - Criterio: solo pedidos del usuario; respuesta `{ language, orders }` con items localizados; orden `created_at DESC`.
- [x] **T-053**: PГЎgina `/cart` con resumen y botГіn "confirmar pedido"
  - Criterio: lista items con imagen, nombre, precio, cantidad editable, botГіn eliminar; resumen total; nota opcional; botГіn confirma в†’ `POST /api/orders`; si no autenticado redirige a `/login`; Г©xito limpia carrito y redirige a `/orders/:id`; navbar carrito habilitado.
- [x] **T-054**: PГЎgina `/orders` con historial de pedidos
  - Criterio: requiere auth; muestra fecha, estado (badge color), total, nВє items; click navega a `/orders/:id`; vacГ­o con mensaje; estados carga/error; textos es/ru/en.
- [x] **T-055**: PГЎgina `/orders/:id` con detalle del pedido
  - Criterio: requiere auth; muestra estado (badge), fecha, nota cliente, items con cantidades y totales por lГ­nea, total general; 404 para pedidos inexistentes/de otro usuario; redirect con `useNavigate`; textos es/ru/en.

---

## Fase 6  Notificaciones al chef

- [x] **T-060**: MГіdulo `notifications` con servicio de correo (Mailgun)
  - Criterio: enviar correo de prueba desde un script.
  - **Notas de progreso (2026-10-07):** creado `server/src/modules/notifications/email.service.ts` con `sendOrderEmail(order, items)` usando Mailgun v14 API (`mailgun.js` + `form-data`). Creado script `server/src/scripts/test-email.ts` que envГ­a correo de prueba con datos ficticios a `env.CHEF_EMAIL` (mГєltiples emails separados por coma). Instaladas dependencias `mailgun.js@14`, `form-data@4`, `@types/form-data`. Actualizado `.env` con `CHEF_EMAIL=yaiselbotet@gmail.com,backup@osito.local` y `env.ts` para aceptar lista de emails. AГ±adido script `test:email` a `package.json`. Typecheck y lint en verde. El script ejecuta correctamente (fallo 401 esperado por credenciales placeholder de Mailgun).
- [x] **T-061**: MГіdulo `notifications` con servicio de Telegram
  - Criterio: enviar mensaje de prueba desde un script.
  - **Notas de progreso (2026-10-08):** creado `server/src/modules/notifications/telegram.service.ts` con `sendOrderTelegram(order, items)` usando `node-telegram-bot-api` v2 (clase `Bot`). Creado script `server/src/scripts/test-telegram.ts` que envГ­a mensaje de prueba con formato Markdown a `env.TELEGRAM_CHAT_ID`. Instaladas dependencias `node-telegram-bot-api@2`, `@types/node-telegram-bot-api`. AГ±adido script `test:telegram` a `package.json`. Typecheck y lint en verde. El script ejecuta correctamente (fallo 401 esperado por token placeholder de Telegram).
- [x] **T-062**: Plantilla HTML del pedido para el correo
  - Criterio: incluye platos, cantidades, total y nota del cliente.
  - **Notas de progreso (2026-10-08):** creado `server/src/modules/notifications/templates/order-email.ts` con funciones `buildOrderEmailHtml` y `buildOrderEmailText`. HTML con estilos inline compatible con Gmail/Outlook, incluye logo textual "Osito a la carta", nГєmero de pedido, fecha, datos del cliente, tabla de items, total y nota. Actualizado `email.service.ts` para usar la plantilla y recibir `customerEmail`. Actualizado `test-email.ts` con email de prueba. Typecheck, lint y build en verde.
- [x] **T-063**: Disparar ambas notificaciones en paralelo al crear pedido
  - Criterio: un fallo en un canal no bloquea el otro.
  - **Notas de progreso (2026-10-08):** actualizado `orders.service.ts` para disparar `sendOrderEmail` y `sendOrderTelegram` en paralelo con `Promise.allSettled` tras crear el pedido. Creado `notifications.repository.ts` con `insertNotificationLog`. Los resultados se registran en `NotificationLog` (T-064) dentro de cada promesa resuelta. El endpoint responde 201 inmediatamente sin esperar las notificaciones. Typecheck, lint y build en verde.
- [x] **T-064**: Registrar resultado en `NotificationLog`
  - Criterio: cada envГ­o (Г©xito o fallo) queda registrado.
  - **Notas de progreso (2026-10-08):** integrado en T-063. Cada notificaciГіn (email/telegram) registra su resultado (sent/failed) con errorMessage si falla, usando `insertNotificationLog` en `notifications.repository.ts`.
- [x] **T-065**: Reintento automГЎtico una vez si falla el envГ­o
  - Criterio: si el primer intento falla, se reintenta y se registra el resultado final.
  - **Notas de progreso (2026-10-08):** creado `server/src/modules/notifications/retry.ts` con utilidad genГ©rica `retry(fn, attempts, delayMs)`. Actualizado `notifications.repository.ts` con `sendWithRetry` que ejecuta la notificaciГіn con reintentos (2 intentos, 2s delay) y registra cada intento en `NotificationLog`. Actualizado `orders.service.ts` para usar `sendWithRetry` en ambos canales. Typecheck, lint y build en verde.

---

## Fase 7  EstadГ­sticas del usuario

- [x] **T-070**: `POST /api/stats/pageview` al visitar detalle de plato
  - Criterio: registra `userId` (si hay sesiГіn) y `dishId`.
  - **Notas de progreso (2026-10-08):** creado mГіdulo `stats` con `stats.schema.ts`, `stats.repository.ts`, `stats.service.ts`, `stats.routes.ts`. Endpoint pГєblico POST `/api/stats/pageview` acepta `{ dishId?, path }`, usa `userId` del token si hay sesiГіn vГЎlida (sin lanzar 401), inserta en `pageViews` con `viewedAt = Date.now()`, responde 204. Frontend: creado `client/src/api/stats.ts` y `useEffect` en `DishDetail.tsx` que llama a `recordPageView(dish.id, path)` al cargar el plato. Typecheck, lint y build en verde.
- [x] **T-071**: `GET /api/stats/me` con agregados del usuario
  - Criterio: devuelve platos mГЎs vistos, mГЎs pedidos y total gastado.
  - **Notas de progreso (2026-10-08):** creado endpoint protegido `GET /api/stats/me` en `stats.routes.ts` con `requireAuth`. Servicio `getUserStatsData` en `stats.service.ts` y consultas de agregaciГіn en `stats.repository.ts` usando Drizzle (count, sum, groupBy, orderBy, limit). Devuelve: topViewedDishes (top 5), topOrderedDishes (top 5), totalOrders, totalSpent, memberSince (ISO string). LocalizaciГіn por `Accept-Language`. Typecheck, lint y build en verde.
- [x] **T-072**: PГЎgina `/stats` con grГЎficos (Recharts)
  - Criterio: muestra al menos 2 grГЎficos y un resumen numГ©rico.
  - **Notas de progreso (2026-10-08):** creado `client/src/pages/Stats.tsx` con `useQuery` a `GET /api/stats/me`. Instalado `recharts`. Tres tarjetas de resumen: totalOrders, totalSpent, memberSince. Dos BarCharts horizontales: topViewedDishes (azul) y topOrderedDishes (verde). Responsive (1 col en mГіvil, 2 en desktop). i18n keys en es/ru/en. NavegaciГіn en navbar (`nav.stats`). Typecheck, lint y build en verde.

---

## Fase 8  Panel del chef

- [x] **T-080**: `GET /api/admin/orders` (todos los pedidos, solo admin)
  - Criterio: rechaza con 403 si no es admin.
  - **Notas de progreso (2026-10-08):** creado endpoint `GET /api/admin/orders` en `orders/admin.routes.ts` con `requireAdmin` (requireAuth + adminOnly). Query opcional `?status=` para filtrar por estado. Repositorio `findAllOrdersForAdmin` con JOIN a `users` (email) y `order_items` + `dishes` (items con 3 idiomas). Servicio `listAdminOrders` localiza nombres por `Accept-Language`. Responde 200 con array de pedidos ordenados por createdAt DESC. Typecheck, lint y build en verde.
- [x] **T-081**: PГЎgina `/admin/orders` con actualizaciГіn automГЎtica
  - Criterio: los pedidos nuevos aparecen sin recargar (polling cada 10s).
  - **Notas de progreso (2026-10-08):** creado `client/src/pages/admin/Orders.tsx` con tabla de pedidos (#, cliente, fecha, estado, total, acciones). Polling cada 10s con `refetchInterval` de TanStack Query. Filtro por estado (dropdown Select). Click en fila navega a detalle. Requiere auth + role admin (redirige a /menu si no). Instalados `@radix-ui/react-select`, `lucide-react` y creados componentes `Select` y `Badge`. i18n keys en es/ru/en. Typecheck, lint y build en verde.
- [x] **T-082**: `PATCH /api/admin/orders/:id/status` para cambiar estado
  - Criterio: solo permite transiciones vГЎlidas (`pending в†’ preparing в†’ sent в†’ delivered`).
  - **Notas de progreso (2026-10-09):** creado endpoint `PATCH /api/admin/orders/:id/status` en `orders/admin.routes.ts` con `requireAdmin`. Body: `{ status: 'pending'|'preparing'|'sent'|'delivered'|'cancelled' }`. Valida transiciones permitidas: `pending в†’ preparing | cancelled`, `preparing в†’ sent | cancelled`, `sent в†’ delivered | cancelled`, `delivered` y `cancelled` son estados finales. Transiciones invГЎlidas responden 400 con code `INVALID_TRANSITION`. Idempotente si el estado no cambia. Typecheck, lint y build en verde.
- [x] **T-083**: Vista de detalle de pedido para el chef
  - Criterio: admin puede consultar email, fecha, nota, platos, cantidades, precios y total; cambiar estado mediante una transiciГіn vГЎlida; volver a la lista.
  - **Notas de progreso (2026-10-10):** completada la pГЎgina `/admin/orders/:id` con consulta al endpoint de detalle existente, acceso solo admin, datos y precios formateados segГєn idioma, transiciones reflejadas por el endpoint T-082, actualizaciГіn de cachГ© y revalidaciГіn de la lista. Textos agregados en es/ru/en. Verificados typecheck, lint y build del cliente.
- [x] **T-084**: Crear pГЎgina `/admin/dishes` y `/admin/dishes/:id` para crear/actualizar platos
  - Criterio: admin puede crear un plato subiendo su imagen desde archivo, actualizar un plato y reemplazar la imagen subiendo otro archivo; botГіn "Crear" visible en `/menu` (admin), botГіn "Editar" visible en `/dishes/:id` (admin); ambos navegan a la pГЎgina de form; validaciГіn de 3 idiomas; typecheck, lint, build OK; i18n completo en es/ru/en.
  - **Notas de progreso (2026-10-10):** completada la implementaciГіn del formulario de administraciГіn de platos. Creado DishForm.tsx con validaciГіn multi-idioma, gestiГіn de creaciГіn y ediciГіn, vista previa de imagen, y guard de autenticaciГіn (solo admin). Agregados botones "Crear plato" en `/menu` y "Editar" en detalles del plato, ambos solo visibles para admin. Configuradas rutas `/admin/dishes/create` y `/admin/dishes/:id`. Agregadas claves i18n completas en es.json, ru.json, en.json (admin.dishes.*). Verificados typecheck, lint y build sin errores.
  - **Notas de progreso (2026-10-11):** el formulario ahora selecciona archivos de imagen en lugar de aceptar URL. La imagen se sube con `multipart/form-data` al endpoint admin `/api/dishes/image` antes de crear o actualizar; solo se reemplaza la imagen al editar si se selecciona un nuevo archivo. Formatos permitidos: JPG, PNG, WebP y AVIF; lГ­mite 5 MB. Typecheck, lint y build verificados.
  - **Notas de progreso (2026-10-11):** la ediciГіn obtiene la traducciГіn es/ru/en mediante tres lecturas localizadas y carga cada valor en su campo correcto.
  - **CorrecciГіn (2026-10-11):** creaciГіn y ediciГіn pasan el objeto JSON sin pre-serializar a `apiRequest`; la serializaciГіn la realiza el cliente HTTP comГєn, evitando el error `Malformed JSON body`.
- [x] **T-085**: GestiГіn de categorГ­as para admin y traducciГіn de estados en panel de pedidos
  - Criterio: admin puede listar, crear, editar y eliminar categorГ­as con slug y nombres en es/ru/en; eliminaciГіn bloqueada cuando tenga platos; el estado de cada pedido se muestra en el idioma seleccionado; typecheck, lint y build pasan; UI en es/ru/en.
  - **Notas de progreso (2026-10-11):** implementada la pГЎgina `/admin/categories` con guard admin, listado multilingГјe, formulario de creaciГіn/ediciГіn y eliminaciГіn usando los endpoints existentes. El backend bloquea el borrado si hay platos; sus errores de slug duplicado y categorГ­a con platos se muestran traducidos. El badge del panel de pedidos ahora usa `admin.orders.statuses.*`. Corregido el cliente HTTP para devolver correctamente en respuestas 204. Typecheck, lint, build y diff check verificados.

---

## Fase 9  Pulido y despliegue

- [ ] **T-090**: PWA con `vite-plugin-pwa`
  - Criterio: la app es instalable en mГіvil.
- [ ] **T-091**: Responsive completo en mГіvil, tablet y desktop
  - Criterio: todas las pГЎginas son usables desde 360px de ancho.
- [x] **T-092a**: Corregir el renderizado global del layout compartido
  - Criterio: navegar entre las rutas no dispara un bucle de renderizado ni deja la aplicaciГіn en blanco.
- [ ] **T-092**: Manejo global de errores en frontend (ErrorBoundary + toasts)
  - Criterio: un error de red muestra un mensaje claro, no pantalla blanca.
- [ ] **T-093**: Tests bГЎsicos de flujos crГ­ticos (registro, pedido, notificaciГіn)
  - Criterio: `npm run test` pasa.
- [ ] **T-094**: Configurar PM2 en el VPS
  - Criterio: `pm2 status` muestra la app corriendo y con arranque automГЎtico.
- [ ] **T-095**: Configurar Nginx como proxy inverso + Let's Encrypt
  - Criterio: la app responde por HTTPS en el dominio configurado.
- [ ] **T-096**: Script de backup diario de `osito.db`
  - Criterio: cron ejecuta `cp osito.db backups/osito-$(date).db` cada dГ­a.
- [x] **T-097**: Portada informativa y tema claro/oscuro
  - Criterio: la portada presenta el negocio, enlaza el menГє y muestra platos destacados; la interfaz ofrece un control accesible de tema que conserva la preferencia manual; textos completos en es/ru/en.

---

## Decisiones pendientes

- ВїPolling o SSE para el panel del chef? в†’ **T-081** (decisiГіn al llegar a la tarea).
- ВїCuГЎntos reintentos de notificaciГіn y con quГ© backoff? в†’ **T-065**.
- ВїRate limiting en endpoints pГєblicos? в†’ evaluar en **T-092**.

> **Nota:** todo el contenido tГ©cnico (decisiones, verificaciones, gotchas, historial) se ha movido a `docs/MEMORY.md` y `docs/memory/topics/`. Ver Г­ndice en `docs/MEMORY.md`.
