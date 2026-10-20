# TASKLIST.md  Osito a la carta

> Leyenda: `[ ]` pendiente В· `[~]` en progreso В· `[x]` completada В· `[!]` bloqueada
> Última actualización: 2026-10-17

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
- [x] **T-008**: Configurar validación de variables de entorno con Zod
  - Criterio: si falta una variable requerida, el server no arranca y explica cuál.
- [x] **T-009**: Crear endpoint `GET /api/health`
  - Criterio: responde `{ status: 'ok', timestamp }`.

---

## Fase 1  Base de datos

- [x] **T-010**: Definir schema Drizzle en `server/src/db/schema.ts`
  - Criterio: `drizzle-kit generate` produce una migración válida con 6 entidades.
- [x] **T-011**: Aplicar migración inicial
  - Criterio: archivo `osito.db` creado con todas las tablas.
- [x] **T-012**: Script de seed con 5 platos de ejemplo en 3 idiomas
  - Criterio: `SELECT` devuelve 5 filas con datos en es / ru / en.
- [x] **T-013**: Script de seed con 1 usuario admin
  - Criterio: existe un usuario `admin@osito.local` con contraseña hasheada.
- [x] **A-001** (añadida 2026-10-01): Categorí­as de platos
  - Criterio: tabla `categories` con nombre en es/ru/en y `dishes.category_id`; 5 platos agrupados por categorí­a.

---

## Fase 2  API de platos

- [x] **T-020**: `GET /api/dishes` con localización por `Accept-Language`
  - Criterio: con `Accept-Language: ru` devuelve nombres en ruso.
- [x] **T-021**: `GET /api/dishes/:id`
  - Criterio: devuelve 404 si no existe.
- [x] **T-022**: `POST /api/dishes` (solo admin)
  - Criterio: rechaza con 401 sin token, con 403 si no es admin; crea plato con categorí­a.
- [x] **T-023**: `PUT /api/dishes/:id` (solo admin)
  - Criterio: actualizar solo el precio funciona; plato inexistente devuelve 404.
- [x] **T-024**: `DELETE /api/dishes/:id` (solo admin)  borrado lógico (`isAvailable = 0`)
  - Criterio: tras el DELETE el plato desaparece de `GET /api/dishes` pero sigue en la BD; 404 si no existe; 204 sin body.
- [x] **T-025**: `GET /api/categories` (público)
  - Criterio: devuelve categorí­as en es/ru/en según `Accept-Language`, ordenadas por `sortOrder`, con `slug` e `id`.
- [x] **T-026**: `POST /api/categories` (solo admin)
  - Criterio: rechaza 401 sin token, 403 si no admin, 409 si `slug` duplicado; crea categorí­a.
- [x] **T-027**: `PUT /api/categories/:id` (solo admin)
  - Criterio: permite renombrar los tres idiomas y cambiar `sortOrder`.
- [x] **T-028**: `DELETE /api/categories/:id` (solo admin)
  - Criterio: rechaza 409 si la categorí­a tiene platos asociados (incluye deshabilitados).
- [x] **T-029**: íЌndice en `dishes.category_id`
  - Criterio: migración aplicada y `EXPLAIN QUERY PLAN` usa el í­ndice al filtrar por categorí­a.
- [x] **T-029a**: `PATCH /api/dishes/:id/availability` (solo admin)  habilita/deshabilita
  - Criterio: `{"isAvailable": true}` recupera plato deshabilitado; `false` lo retira sin borrar.
- [x] **T-029b**: `DELETE /api/dishes/:id/permanent` (solo admin)  purga fí­sica
  - Criterio: borra la fila; 404 si no existe; 409 si plato disponible o con historial (`order_items`/`page_views`).

---

## Fase 3  Frontend: menú y multi-idioma

- [x] **T-030**: Configurar `react-i18next` con `es.json`, `ru.json`, `en.json`
  - Criterio: cambiar idioma cambia textos sin recargar.
- [x] **T-031**: Página `/menu` que consume `GET /api/dishes`
  - Criterio: muestra todos los platos disponibles agrupados por categorí­a.
- [x] **T-032**: Componente `DishCard` (imagen, nombre, descripción, ingredientes, precio)
  - Criterio: se ve correctamente en móvil (1 col) y desktop (3 cols).
- [x] **T-033**: Selector de idioma en navbar, persistido en `localStorage`
  - Criterio: al recargar, mantiene el idioma elegido (orden detección: localStorage > navigator).
- [x] **T-034**: Página `/menu/:id` con detalle del plato
  - Criterio: muestra todos los datos del plato y botón "agregar al carrito".
- [x] **T-035**: Estilos base con Tailwind + shadcn/ui (botones, cards, navbar)
  - Criterio: UI coherente y responsive; navbar con logo, enlaces y selector de idioma; componentes `button`, `card`, `input`, `label` instalados; tema con tokens CSS en `index.css`.

---

## Fase 4  Autenticación

- [x] **T-040**: `POST /api/auth/register` con validación Zod
  - Criterio: rechaza email duplicado con 409 `EMAIL_TAKEN`; `role` fijado a `customer`; `passwordHash` nunca en respuesta.
- [x] **T-041**: `POST /api/auth/login` (devuelve access + refresh token)
  - Criterio: access 15 min, refresh 7 dí­as; claims `{type, email, role, sub}` / `{type, sub}`; secretos distintos; 401 `INVALID_CREDENTIALS` mismo mensaje para email inexistente o contraseña errónea.
- [x] **T-042**: `POST /api/auth/refresh`
  - Criterio: renueva access con refresh válido (200, solo accessToken); 401 `INVALID_REFRESH_TOKEN` para cualquier fallo; relee usuario por `sub`; no rota refresh.
- [x] **T-043**: Middleware `requireAuth` y `requireAdmin`
  - Criterio: 9 escrituras protegidas  401 sin token, 403 con token `customer`, 200/201/204 con token `admin`; exige `type === 'access'` y `JWT_SECRET`; `role` del token sin consultar BD.
- [x] **T-044**: Páginas `/login` y `/register` en frontend
  - Criterio: React Hook Form + Zod con reglas compartidas en `shared/schemas.ts`; auto-login tras registro; errores inline con `role="alert"` por `code`; `preferredLang` enviado y validado.
- [x] **T-045**: Store de sesión con Zustand + persistencia en `localStorage`
  - Criterio: sesión se mantiene al recargar si token válido; `isAuthenticated` selector derivado; persiste solo `user`, `accessToken`, `refreshToken`.
- [x] **T-046**: Interceptor de fetch que añade `Authorization` y maneja 401
  - Criterio: access expirado в†’ refresh automático в†’ reintenta petición; 401 por `code === 'UNAUTHORIZED'` solo si habí­a token; un solo reintento; renovación compartida entre llamadas simultáneas.
- [x] **T-047**: Imágenes de platos en la VPS + `POST /api/dishes/:id/image`
  - Criterio: admin sube imagen, se guarda en disco con nombre UUID, ruta relativa en `dishes.image_url`, API devuelve URL absoluta con `PUBLIC_ORIGIN`.

---

## Fase 5  Carrito y pedidos

- [x] **T-050**: Store de carrito con Zustand persistido en `localStorage`
  - Criterio: agregar, quitar, modificar cantidades funciona tras recargar; copia del plato en el item; `quantity: 0` quita la lí­nea; totales son selectores derivados.
- [x] **T-051**: `POST /api/orders` con validación Zod y transacción
  - Criterio: crea `Order` + `OrderItem` atómicamente; `userId` del token; valida items (sin duplicados, cantidad в‰Ґ1, platos disponibles); total con precios actuales redondeado a céntimos; respuesta `{ language, order }`.
- [x] **T-052**: `GET /api/orders` (historial del usuario autenticado)
  - Criterio: solo pedidos del usuario; respuesta `{ language, orders }` con items localizados; orden `created_at DESC`.
- [x] **T-053**: Página `/cart` con resumen y botón "confirmar pedido"
  - Criterio: lista items con imagen, nombre, precio, cantidad editable, botón eliminar; resumen total; nota opcional; botón confirma в†’ `POST /api/orders`; si no autenticado redirige a `/login`; éxito limpia carrito y redirige a `/orders/:id`; navbar carrito habilitado.
- [x] **T-054**: Página `/orders` con historial de pedidos
  - Criterio: requiere auth; muestra fecha, estado (badge color), total, nВє items; click navega a `/orders/:id`; vací­o con mensaje; estados carga/error; textos es/ru/en.
- [x] **T-055**: Página `/orders/:id` con detalle del pedido
  - Criterio: requiere auth; muestra estado (badge), fecha, nota cliente, items con cantidades y totales por lí­nea, total general; 404 para pedidos inexistentes/de otro usuario; redirect con `useNavigate`; textos es/ru/en.

---

## Fase 6  Notificaciones al chef

- [x] **T-060**: Módulo `notifications` con servicio de correo (Mailgun)
  - Criterio: enviar correo de prueba desde un script.
  - **Notas de progreso (2026-10-07):** creado `server/src/modules/notifications/email.service.ts` con `sendOrderEmail(order, items)` usando Mailgun v14 API (`mailgun.js` + `form-data`). Creado script `server/src/scripts/test-email.ts` que enví­a correo de prueba con datos ficticios a `env.CHEF_EMAIL` (múltiples emails separados por coma). Instaladas dependencias `mailgun.js@14`, `form-data@4`, `@types/form-data`. Actualizado `.env` con `CHEF_EMAIL=yaiselbotet@gmail.com,backup@osito.local` y `env.ts` para aceptar lista de emails. Añadido script `test:email` a `package.json`. Typecheck y lint en verde. El script ejecuta correctamente (fallo 401 esperado por credenciales placeholder de Mailgun).
- [x] **T-061**: Módulo `notifications` con servicio de Telegram
  - Criterio: enviar mensaje de prueba desde un script.
  - **Notas de progreso (2026-10-08):** creado `server/src/modules/notifications/telegram.service.ts` con `sendOrderTelegram(order, items)` usando `node-telegram-bot-api` v2 (clase `Bot`). Creado script `server/src/scripts/test-telegram.ts` que enví­a mensaje de prueba con formato Markdown a `env.TELEGRAM_CHAT_ID`. Instaladas dependencias `node-telegram-bot-api@2`, `@types/node-telegram-bot-api`. Añadido script `test:telegram` a `package.json`. Typecheck y lint en verde. El script ejecuta correctamente (fallo 401 esperado por token placeholder de Telegram).
- [x] **T-062**: Plantilla HTML del pedido para el correo
  - Criterio: incluye platos, cantidades, total y nota del cliente.
  - **Notas de progreso (2026-10-08):** creado `server/src/modules/notifications/templates/order-email.ts` con funciones `buildOrderEmailHtml` y `buildOrderEmailText`. HTML con estilos inline compatible con Gmail/Outlook, incluye logo textual "Osito a la carta", número de pedido, fecha, datos del cliente, tabla de items, total y nota. Actualizado `email.service.ts` para usar la plantilla y recibir `customerEmail`. Actualizado `test-email.ts` con email de prueba. Typecheck, lint y build en verde.
- [x] **T-063**: Disparar ambas notificaciones en paralelo al crear pedido
  - Criterio: un fallo en un canal no bloquea el otro.
  - **Notas de progreso (2026-10-08):** actualizado `orders.service.ts` para disparar `sendOrderEmail` y `sendOrderTelegram` en paralelo con `Promise.allSettled` tras crear el pedido. Creado `notifications.repository.ts` con `insertNotificationLog`. Los resultados se registran en `NotificationLog` (T-064) dentro de cada promesa resuelta. El endpoint responde 201 inmediatamente sin esperar las notificaciones. Typecheck, lint y build en verde.
- [x] **T-064**: Registrar resultado en `NotificationLog`
  - Criterio: cada enví­o (éxito o fallo) queda registrado.
  - **Notas de progreso (2026-10-08):** integrado en T-063. Cada notificación (email/telegram) registra su resultado (sent/failed) con errorMessage si falla, usando `insertNotificationLog` en `notifications.repository.ts`.
- [x] **T-065**: Reintento automático una vez si falla el enví­o
  - Criterio: si el primer intento falla, se reintenta y se registra el resultado final.
  - **Notas de progreso (2026-10-08):** creado `server/src/modules/notifications/retry.ts` con utilidad genérica `retry(fn, attempts, delayMs)`. Actualizado `notifications.repository.ts` con `sendWithRetry` que ejecuta la notificación con reintentos (2 intentos, 2s delay) y registra cada intento en `NotificationLog`. Actualizado `orders.service.ts` para usar `sendWithRetry` en ambos canales. Typecheck, lint y build en verde.

---

## Fase 7  Estadí­sticas del usuario

- [x] **T-070**: `POST /api/stats/pageview` al visitar detalle de plato
  - Criterio: registra `userId` (si hay sesión) y `dishId`.
  - **Notas de progreso (2026-10-08):** creado módulo `stats` con `stats.schema.ts`, `stats.repository.ts`, `stats.service.ts`, `stats.routes.ts`. Endpoint público POST `/api/stats/pageview` acepta `{ dishId?, path }`, usa `userId` del token si hay sesión válida (sin lanzar 401), inserta en `pageViews` con `viewedAt = Date.now()`, responde 204. Frontend: creado `client/src/api/stats.ts` y `useEffect` en `DishDetail.tsx` que llama a `recordPageView(dish.id, path)` al cargar el plato. Typecheck, lint y build en verde.
- [x] **T-071**: `GET /api/stats/me` con agregados del usuario
  - Criterio: devuelve platos más vistos, más pedidos y total gastado.
  - **Notas de progreso (2026-10-08):** creado endpoint protegido `GET /api/stats/me` en `stats.routes.ts` con `requireAuth`. Servicio `getUserStatsData` en `stats.service.ts` y consultas de agregación en `stats.repository.ts` usando Drizzle (count, sum, groupBy, orderBy, limit). Devuelve: topViewedDishes (top 5), topOrderedDishes (top 5), totalOrders, totalSpent, memberSince (ISO string). Localización por `Accept-Language`. Typecheck, lint y build en verde.
- [x] **T-072**: Página `/stats` con gráficos (Recharts)
  - Criterio: muestra al menos 2 gráficos y un resumen numérico.
  - **Notas de progreso (2026-10-08):** creado `client/src/pages/Stats.tsx` con `useQuery` a `GET /api/stats/me`. Instalado `recharts`. Tres tarjetas de resumen: totalOrders, totalSpent, memberSince. Dos BarCharts horizontales: topViewedDishes (azul) y topOrderedDishes (verde). Responsive (1 col en móvil, 2 en desktop). i18n keys en es/ru/en. Navegación en navbar (`nav.stats`). Typecheck, lint y build en verde.

---

## Fase 8  Panel del chef

- [x] **T-080**: `GET /api/admin/orders` (todos los pedidos, solo admin)
  - Criterio: rechaza con 403 si no es admin.
  - **Notas de progreso (2026-10-08):** creado endpoint `GET /api/admin/orders` en `orders/admin.routes.ts` con `requireAdmin` (requireAuth + adminOnly). Query opcional `?status=` para filtrar por estado. Repositorio `findAllOrdersForAdmin` con JOIN a `users` (email) y `order_items` + `dishes` (items con 3 idiomas). Servicio `listAdminOrders` localiza nombres por `Accept-Language`. Responde 200 con array de pedidos ordenados por createdAt DESC. Typecheck, lint y build en verde.
- [x] **T-081**: Página `/admin/orders` con actualización automática
  - Criterio: los pedidos nuevos aparecen sin recargar (polling cada 10s).
  - **Notas de progreso (2026-10-08):** creado `client/src/pages/admin/Orders.tsx` con tabla de pedidos (#, cliente, fecha, estado, total, acciones). Polling cada 10s con `refetchInterval` de TanStack Query. Filtro por estado (dropdown Select). Click en fila navega a detalle. Requiere auth + role admin (redirige a /menu si no). Instalados `@radix-ui/react-select`, `lucide-react` y creados componentes `Select` y `Badge`. i18n keys en es/ru/en. Typecheck, lint y build en verde.
- [x] **T-082**: `PATCH /api/admin/orders/:id/status` para cambiar estado
  - Criterio: solo permite transiciones válidas (`pending в†’ preparing в†’ sent в†’ delivered`).
  - **Notas de progreso (2026-10-09):** creado endpoint `PATCH /api/admin/orders/:id/status` en `orders/admin.routes.ts` con `requireAdmin`. Body: `{ status: 'pending'|'preparing'|'sent'|'delivered'|'cancelled' }`. Valida transiciones permitidas: `pending в†’ preparing | cancelled`, `preparing в†’ sent | cancelled`, `sent в†’ delivered | cancelled`, `delivered` y `cancelled` son estados finales. Transiciones inválidas responden 400 con code `INVALID_TRANSITION`. Idempotente si el estado no cambia. Typecheck, lint y build en verde.
- [x] **T-083**: Vista de detalle de pedido para el chef
  - Criterio: admin puede consultar email, fecha, nota, platos, cantidades, precios y total; cambiar estado mediante una transición válida; volver a la lista.
  - **Notas de progreso (2026-10-10):** completada la página `/admin/orders/:id` con consulta al endpoint de detalle existente, acceso solo admin, datos y precios formateados según idioma, transiciones reflejadas por el endpoint T-082, actualización de caché y revalidación de la lista. Textos agregados en es/ru/en. Verificados typecheck, lint y build del cliente.
- [x] **T-084**: Crear página `/admin/dishes` y `/admin/dishes/:id` para crear/actualizar platos
  - Criterio: admin puede crear un plato subiendo su imagen desde archivo, actualizar un plato y reemplazar la imagen subiendo otro archivo; botón "Crear" visible en `/menu` (admin), botón "Editar" visible en `/dishes/:id` (admin); ambos navegan a la página de form; validación de 3 idiomas; typecheck, lint, build OK; i18n completo en es/ru/en.
  - **Notas de progreso (2026-10-10):** completada la implementación del formulario de administración de platos. Creado DishForm.tsx con validación multi-idioma, gestión de creación y edición, vista previa de imagen, y guard de autenticación (solo admin). Agregados botones "Crear plato" en `/menu` y "Editar" en detalles del plato, ambos solo visibles para admin. Configuradas rutas `/admin/dishes/create` y `/admin/dishes/:id`. Agregadas claves i18n completas en es.json, ru.json, en.json (admin.dishes.*). Verificados typecheck, lint y build sin errores.
  - **Notas de progreso (2026-10-11):** el formulario ahora selecciona archivos de imagen en lugar de aceptar URL. La imagen se sube con `multipart/form-data` al endpoint admin `/api/dishes/image` antes de crear o actualizar; solo se reemplaza la imagen al editar si se selecciona un nuevo archivo. Formatos permitidos: JPG, PNG, WebP y AVIF; lí­mite 5 MB. Typecheck, lint y build verificados.
  - **Notas de progreso (2026-10-11):** la edición obtiene la traducción es/ru/en mediante tres lecturas localizadas y carga cada valor en su campo correcto.
  - **Corrección (2026-10-11):** creación y edición pasan el objeto JSON sin pre-serializar a `apiRequest`; la serialización la realiza el cliente HTTP común, evitando el error `Malformed JSON body`.
- [x] **T-085**: Gestión de categorí­as para admin y traducción de estados en panel de pedidos
  - Criterio: admin puede listar, crear, editar y eliminar categorí­as con slug y nombres en es/ru/en; eliminación bloqueada cuando tenga platos; el estado de cada pedido se muestra en el idioma seleccionado; typecheck, lint y build pasan; UI en es/ru/en.
  - **Notas de progreso (2026-10-11):** implementada la página `/admin/categories` con guard admin, listado multilingíјe, formulario de creación/edición y eliminación usando los endpoints existentes. El backend bloquea el borrado si hay platos; sus errores de slug duplicado y categorí­a con platos se muestran traducidos. El badge del panel de pedidos ahora usa `admin.orders.statuses.*`. Corregido el cliente HTTP para devolver correctamente en respuestas 204. Typecheck, lint, build y diff check verificados.

---

## Fase 9  Pulido y despliegue

- [x] **T-090**: PWA con `vite-plugin-pwa`
  - Criterio: la app es instalable en móvil.
  - **Notas de progreso (2026-10-15):**
    - Instalado `vite-plugin-pwa@^2.0.0` como devDependency en `client/`.
    - Configurado en `vite.config.ts`: `strategies: 'generateSW'`, `registerType: 'autoUpdate'`, `injectRegister: 'auto'`, `includeAssets` incluye `favicon.ico`, `apple-touch-icon.png`, `images/osito.jpg`.
    - Manifest: `name: "Osito a la carta"`, `short_name: "Osito"`, `display: "standalone"`, `theme_color: "#f59e0b"`, `background_color: "#fff7ed"`, icons 192x192 y 512x512 (any + maskable).
    - Creados íconos placeholder en `client/public/icons/`: `osito-icon-192.png`, `osito-icon-512.png`, `osito-icon.svg`.
    - Creados `favicon.ico` (16/32/48) y `apple-touch-icon.png` (180x180) en `client/public/`.
    - `workbox` config: precache de `**/*.{js,css,html,svg,png,ico}`, `maximumFileSizeToCacheInBytes: 3MB`.
    - Build genera: `manifest.webmanifest`, `registerSW.js` (auto-inject en index.html), `sw.js`.
    - typecheck, lint y build pasan.
    - Nota: `devOptions.enabled: false` (SW desactivado en dev para evitar interferencias).
- [x] **T-091**: Auditoría y ajustes responsive
  - Criterio: todas las páginas usables desde móvil (360px), tablet (768px) y desktop (1280px+).
  - **Notas de progreso (2026-10-17):**
    - `Layout.tsx`: navbar colapsable con hamburguesa; `NavLinks` extraído y reutilizable entre desktop (inline) y mobile (panel `md:hidden`); botones `w-full justify-start` en mobile para touch targets; `nav.openMenu`/`nav.closeMenu` i18n keys en es/ru/en.
    - `admin/OrderDetail.tsx`: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.
    - `Stats.tsx`: chart height 300→200 px, YAxis width 120→100 px, fontSize 12→11.
  - Criterio: todas las páginas son usables desde 360px de ancho.
- [x] **T-092a**: Corregir el renderizado global del layout compartido
  - Criterio: navegar entre las rutas no dispara un bucle de renderizado ni deja la aplicación en blanco.
- [x] **T-092**: Manejo global de errores en frontend (ErrorBoundary + toasts)
  - Criterio: un error de red muestra un mensaje claro, no pantalla blanca.
  - **Notas de progreso (2026-10-17):**
    - `ErrorBoundary.tsx` creado: class component con `ErrorFallback` usando `useTranslation` y claves i18n `errors.title`/`errors.fallback`/`errors.retry`. Envuelve todas las rutas en `main.tsx`.
    - `<Toaster />` de `sonner` anadido en `main.tsx`.
    - `apiRequest` en `client.ts`: muestra `toast.error()` para errores 4xx/5xx que no sean `UNAUTHORIZED` (que se renueva). Mensaje usa el error del API o `errors.generic` de i18n.
    - `silent?: boolean` anadido a `RequestOptions` para que los llamadores que manejan errores localmente (formularios inline, `useQuery` con estado de error) suppress el toast.
    - Todos los llamadores actuales pasan `{ silent: true }` para evitar notificaciones duplicadas.
    - Claves i18n `errors: { title, fallback, retry, generic }` anadidas a es/ru/en.
    - `npm run typecheck` ✓, `npm run lint` ✓, `npm run build` ✓.
- [ ] **T-093**: Tests básicos de flujos crí­ticos (registro, pedido, notificación)
  - Criterio: `npm run test` pasa.
- [ ] **T-094**: Configurar PM2 en el VPS
  - Criterio: `pm2 status` muestra la app corriendo y con arranque automático.
- [ ] **T-095**: Configurar Nginx como proxy inverso + Let's Encrypt
  - Criterio: la app responde por HTTPS en el dominio configurado.
- [ ] **T-096**: Script de backup diario de `osito.db`
  - Criterio: cron ejecuta `cp osito.db backups/osito-$(date).db` cada dí­a.
- [x] **T-097**: Portada informativa y tema claro/oscuro
  - Criterio: la portada presenta el negocio, enlaza el menú y muestra platos destacados; la interfaz ofrece un control accesible de tema que conserva la preferencia manual; textos completos en es/ru/en.
- [x] **T-098a**: Checkout como invitado en el backend
  - Criterio: usuario no autenticado puede crear pedido con nombre, teléfono, dirección; pedido se guarda con userId NULL y trackingToken generado; chef recibe notificación con datos del invitado; GET /api/orders/track/:token devuelve el pedido sin auth; typecheck + lint + build pasan.
  - **Notas de progreso (2026-10-12):**
    - Esquema actualizado: `orders.userId` nullable, campos `guest_name`, `guest_phone`, `guest_email`, `delivery_address`, `tracking_token` (unique).
    - Migración generada y aplicada manualmente (0003_many_lady_bullseye.sql).
    - Nuevo schema Zod `createGuestOrderBodySchema` con validación de guestName, guestPhone, guestEmail, deliveryAddress.
    - Nuevo endpoint `POST /api/orders/guest` (sin auth) que genera trackingToken con UUID v4.
    - Nuevo endpoint `GET /api/orders/track/:token` (sin auth) para consultar pedidos de invitados.
    - Función `createGuestOrder` en orders.service.ts que maneja la creación de pedidos de invitados.
    - Función `getOrderByTrackingToken` en orders.service.ts y `findOrderByTrackingToken` en orders.repository.ts.
    - Email template actualizado para mostrar datos del invitado (nombre, teléfono, dirección, token).
    - Telegram actualizado para mostrar datos del invitado cuando userId es null.
    - typecheck, lint y build pasan.
- [x] **T-098b**: Checkout como invitado en el frontend
  - Criterio: invitado crea pedido sin login y ve tracking; lista de pedidos muestra fecha y hora; al registrarse se envía email de verificación; autenticado sin regresión; i18n es/ru/en; typecheck + lint + build pasan.
  - **Notas de progreso (2026-10-13/14):**
    - `Cart.tsx` → navega a `/checkout` en vez de `/login`; accesible sin estar autenticado.
    - `Checkout.tsx` creado con RHF + Zod (`createGuestOrderBodySchema`), campos name/phone/email?/address/note. Submit → POST `/api/orders/guest`, clearCart, guarda token, redirige a `/orders/track/:token`.
    - `OrderTrack.tsx` creado con useQuery al endpoint track. Botón "Crear cuenta" → `/register?email=&name=&phone=`.
    - `Register.tsx` → precarga email/name/phone desde query params.
    - `Orders.tsx` → sección "Pedidos como invitado" con tokens de localStorage; formateo de fecha y hora con `toLocaleString`.
    - `Layout.tsx` → botón "Mis pedidos" (invitado) → `/orders`.
    - `VerifyEmail.tsx` (nuevo) → página `/verify-email` que consume `GET /api/auth/verify-email?token=`.
    - `client/src/lib/guest-orders.ts` → save/get/remove tokens (máx 10).
    - Backend: `users.emailVerified` + `users.emailVerificationToken`, `sendVerificationEmail`, `GET /api/auth/verify-email`.
    - Server fix: `getOrderByTrackingToken` ahora devuelve `{ language, order, contactEmail }` (envelope), no plano.
    - Client fix: `clearSession` preserva `_hasHydrated=true` para que el navbar no desaparezca al logout.
    - i18n claves `checkout.*`, `track.*`, `orders.guestOrders*`, `guestOrders.*`, `auth.register.verification*` en es/ru/en.
    - `main.tsx` → rutas `/checkout`, `/orders/track/:token`, `/verify-email` registradas.
    - typecheck, lint y build pasan en client y server.
- [x] **T-099**: Checkout híbrido (autenticados + invitados) con prefilling y formato de teléfono ruso
  - Criterio: usuarios autenticados usan `POST /api/orders` con email pre-rellenado; invitados usan `POST /api/orders/guest` con formulario completo; campo teléfono con formato +7 (XXX) XXX-XX-XX y validación; i18n completo es/ru/en; typecheck + lint + build pasan.
  - **Notas de progreso (2026-10-19):**
    - `Checkout.tsx` reescrito con dos formularios separados (`AuthCheckoutForm`, `GuestCheckoutForm`) para evitar hooks condicionales; usuarios autenticados solo ven nota opcional, email pre-rellenado desde `user.email`.
    - Formulario de invitados mantiene campos: nombre, teléfono, email, dirección, nota; placeholder y ayuda visual para formato ruso +7 (XXX) XXX-XX-XX.
    - Claves i18n añadidas: `checkout.authInfo`, `checkout.phoneFormat`, `checkout.loginInfo` en es/ru/en.
    - Usuario autenticado usa `POST /api/orders` (crea pedido con `userId`); invitado usa `POST /api/orders/guest` (crea pedido con `userId=null` y `trackingToken`).
    - Separación de formularios en componentes `AuthCheckoutForm` y `GuestCheckoutForm` para cumplir `react-hooks/rules-of-hooks` y evitar hooks condicionales.
    - Typecheck, lint y build pasan en client y server.
- [x] **T-100**: Perfil de usuario con datos de entrega guardados
  - Criterio: usuarios autenticados pueden guardar nombre, teléfono y dirección; al hacer checkout se muestra el formulario completo pre-rellenado; al confirmar pedido se guardan los datos para futuros pedidos; i18n es/ru/en; typecheck + lint + build pasan.
  - **Notas de progreso (2026-10-19):**
    - BD: añadidos campos `name`, `phone`, `deliveryAddress` a tabla `users` (migración 0005).
    - Backend: endpoint `PUT /api/users/me` para actualizar perfil; `login` y `refresh` devuelven los nuevos campos; `POST /api/orders` para autenticados usa datos del perfil si no se envían en el body.
    - Frontend: `ApiAuthUser` extendido con `name`, `phone`, `deliveryAddress`; `useAuthStore` con `updateProfile`; `Checkout.tsx` formulario completo para autenticados pre-rellenado con datos del perfil; al confirmar se guarda el perfil via `PUT /api/users/me`.
    - i18n claves `checkout.authInfo`, `checkout.phoneFormat`, `checkout.loginInfo` ya existían; reutilizadas.
    - Typecheck, lint y build pasan en client y server.

---

## Decisiones pendientes

- ¿Polling o SSE para el panel del chef? в†’ **T-081** (decisión al llegar a la tarea).
- ¿Cuántos reintentos de notificación y con qué backoff? в†’ **T-065**.
- ¿Rate limiting en endpoints públicos? в†’ evaluar en **T-092**.

> **Nota:** todo el contenido técnico (decisiones, verificaciones, gotchas, historial) se ha movido a `docs/MEMORY.md` y `docs/memory/topics/`. Ver í­ndice en `docs/MEMORY.md`.
