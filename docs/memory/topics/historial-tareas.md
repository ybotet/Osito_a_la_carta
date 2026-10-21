# Historial cronolГіgico de tareas

> Гљltima actualizaciГіn: 2026-10-11
>
> Formato: `YYYY-MM-DD | Tarea | QuГ© se hizo | CГіmo/Impacto | Deuda/Notas`

---

## 2026-10-09 вЂ” T-082: PATCH /api/admin/orders/:id/status con validaciГіn de transiciones

**QuГ©:** Endpoint admin `PATCH /api/admin/orders/:id/status` para cambiar estado de pedido con validaciГіn de transiciones.  
**CГіmo:** `updateOrderStatusAdmin` en `orders.service.ts` valida transiciones permitidas usando mapa `ALLOWED_TRANSITIONS`: `pending в†’ preparing | cancelled`, `preparing в†’ sent | cancelled`, `sent в†’ delivered | cancelled`, `delivered` y `cancelled` son finales. Transiciones invГЎlidas responden 400 con code `INVALID_TRANSITION`. Idempotente si el estado no cambia. `updateOrderStatus` en repositorio actualiza el estado en BD.  
**Impacto:** Chef puede mover pedidos por el flujo correcto. Base para T-083 (detalle).  
**Deuda/Notas:** NotificaciГіn al cliente de cambio de estado pendiente (T-063 orquestador).

---

## 2026-10-09 вЂ” T-092a: Corregir renderizado del layout compartido

**QuГ©:** Se eliminГі un selector de Zustand inestable del layout global que podГ­a provocar renderizados repetidos y dejar en blanco todas las rutas.  
**CГіmo:** `user` y `isAuthenticated` se seleccionan por separado para devolver referencias primitivas/estables; se conservГі el comportamiento de autenticaciГіn existente.  
**Impacto:** El layout compartido ya no crea un objeto nuevo durante cada lectura del store.  
**Deuda/Notas:** T-092 (ErrorBoundary y toasts para errores globales) sigue pendiente y no forma parte de esta correcciГіn.

## 2026-09-28 вЂ” T-001 a T-009: Setup del proyecto

**QuГ©:** Estructura monorepo (`server/`, `client/`, `shared/`, `docs/`), TS estricto, Vite+React, proxy, Tailwind, ESLint/Prettier, pino, Zod env, health check.  
**CГіmo:** npm workspaces en raГ­z; `type: module` + `moduleResolution: bundler` en server; `tsx` para dev; `process.loadEnvFile()` nativo (Node 22+).  
**Impacto:** Base lista para desarrollo. `npm run dev` levanta ambos.  
**Deuda:** Ninguna.

---

## 2026-09-29 вЂ” T-010 a T-013 + A-001: Base de datos

**QuГ©:** Schema Drizzle (6 entidades), migraciГіn inicial, seed platos (5 Г— 3 idiomas), seed admin, categorГ­as (A-001).  
**CГіmo:** `drizzle-kit` para migraciones; SQLite WAL mode; seed idempotente (upsert por slug); bcrypt 12 rounds.  
**Impacto:** BD funcional con datos de prueba multilingГјes.  
**Deuda:** Migraciones futuras requieren `drizzle-kit generate` + `migrate`.

---

## 2026-09-29 a 2026-10-01 вЂ” T-020 a T-029b: API platos y categorГ­as

**QuГ©:** CRUD completo platos (GET/POST/PUT/DELETE + PATCH availability + DELETE permanent), CRUD categorГ­as, localizaciГіn por `Accept-Language`, borrado lГіgico (`isAvailable`), Г­ndice `category_id`.  
**CГіmo:** MГіdulos feature-based (`dishes/`, `categories/`); Zod schemas en `shared/`; middleware `requireAuth`/`requireAdmin`; i18n via columnas `_es|_ru|_en`; transacciones no necesarias aquГ­.  
**Impacto:** API pГєblica y admin funcional.  
**Deuda:** Rate limiting pendiente (T-092).

---

## 2026-10-01 a 2026-10-02 вЂ” T-030 a T-035: Frontend menГє + i18n

**QuГ©:** `react-i18next` (es/ru/en, persistido), pГЎgina `/menu` (agrupado por categorГ­a), `DishCard` responsive, `/menu/:id`, navbar + selector idioma, shadcn/ui base.  
**CГіmo:** TanStack Query v5 para server state; `useDishes` hook; Tailwind 4 CSS-first (`@import "tailwindcss"`); tokens CSS en `:root`.  
**Impacto:** MenГє funcional y multilingГјe.  
**Deuda:** Tests E2E pendientes (T-093).

---

## 2026-10-01 a 2026-10-03 вЂ” T-040 a T-047: AutenticaciГіn completa

**QuГ©:** Register, login (access 15min + refresh 7d, secretos distintos, claims `type`), refresh endpoint, middlewares, pГЎginas login/register, Zustand store persistido, interceptor fetch 401в†’refreshв†’retry, subida imГЎgenes (UUID + `PUBLIC_ORIGIN`).  
**CГіmo:** jsonwebtoken + bcryptjs; `AppError` con cГіdigos estandarizados; interceptor con flag de renovaciГіn compartida; `UPLOADS_DIR` fuera del repo; Nginx alias pendiente (T-095).  
**Impacto:** Auth end-to-end funcional, sesiГіn persistente, imГЎgenes servidas por Nginx.  
**Deuda:** RotaciГіn refresh token (simplicidad actual); 2FA no contemplado.

---

## 2026-10-03 a 2026-10-04 вЂ” T-050 a T-055: Carrito y pedidos

**QuГ©:** Cart store Zustand (persist, snapshot plato), `POST /api/orders` (transacciГіn + snapshot precios), `GET /api/orders` (historial usuario), pГЎginas `/cart`, `/orders`, `/orders/:id`.  
**CГіmo:** TransacciГіn Drizzle atГіmica; validaciГіn items (disponibilidad, duplicados, cantidad); total en cГ©ntimos (Math.round); `language` snapshot en Order; TanStack Query invalidation tras POST.  
**Impacto:** Flujo compra completo usuario autenticado.  
**Deuda:** Notificaciones al chef pendientes (Fase 6).

---

## 2026-10-08 вЂ” T-081: PГЎgina /admin/orders con polling y filtro

**QuГ©:** PГЎgina admin `/admin/orders` con tabla, polling 10s, filtro por estado.  
**CГіmo:** `Orders.tsx` usa `useQuery` con `refetchInterval: 10_000`. Tabla con columnas: #, cliente, fecha, estado (Badge), total, acciones. Filtro `Select` por estado. Click en fila navega a `/admin/orders/:id`. `requireAuth` + `role === 'admin'` en componente, redirige a `/menu` si no. Componentes `Select` y `Badge` nuevos (Radix + shadcn).  
**Impacto:** Chef ve pedidos en tiempo real sin recargar.  
**Deuda/Notas:** Detalle de pedido pendiente (T-083). PaginaciГіn no implementada.

---

## 2026-10-08 вЂ” T-080: GET /api/admin/orders (panel del chef)

**QuГ©:** Endpoint admin `GET /api/admin/orders` que lista todos los pedidos con info de usuario e items.  
**CГіmo:** `admin.routes.ts` con `requireAdmin`. Query opcional `?status=`. `findAllOrdersForAdmin` en repositorio: JOIN a `users` (email), JOIN a `order_items` + `dishes` (items con 3 idiomas). `listAdminOrders` en servicio localiza por `Accept-Language`. Respuesta 200 con array ordenado por createdAt DESC.  
**Impacto:** Base para panel del chef (T-081/T-082/T-083).  
**Deuda/Notas:** Filtro status valida contra enum; no hay paginaciГіn aГєn.

---

## 2026-10-08 вЂ” T-072: PГЎgina /stats con grГЎficos (Recharts)

**QuГ©:** PГЎgina `/stats` protegida con resumen numГ©rico y dos grГЎficos de barras horizontales.  
**CГіmo:** `Stats.tsx` usa `useQuery` a `GET /api/stats/me`. Tarjetas: totalOrders, totalSpent, memberSince. GrГЎficos: `BarChart` (Recharts) con layout vertical para topViewedDishes y topOrderedDishes. i18n en es/ru/en. Enlace en navbar (`nav.stats`).  
**Impacto:** Usuario ve sus mГ©tricas de consumo y visitas.  
**Deuda/Notas:** GrГЎficos usan tooltip por defecto; colores fijos (azul/verde). Chunk de build crece por Recharts (~370KB gzipped).

---

## 2026-10-08 вЂ” T-071: GET /api/stats/me con agregados del usuario

**QuГ©:** Endpoint protegido `GET /api/stats/me` que devuelve estadГ­sticas agregadas del usuario autenticado.  
**CГіmo:** `stats.repository.ts` con consultas Drizzle: `getTopViewedDishes` (count + groupBy + orderBy + limit 5), `getTopOrderedDishes` (sum quantity + groupBy + orderBy + limit 5), `getUserStats` (count orders, sum total, memberSince). `stats.service.ts` con `getUserStatsData` que localiza nombres por idioma. `stats.routes.ts` con `requireAuth`. Respuesta: `{ topViewedDishes, topOrderedDishes, totalOrders, totalSpent, memberSince }`.  
**Impacto:** Base para frontend de estadГ­sticas (T-072).  
**Deuda/Notas:** Agregaciones usan Drizzle SQL builders; memberSince viene de `users.createdAt`.

---

## 2026-10-08 вЂ” T-070: POST /api/stats/pageview + frontend tracking

**QuГ©:** Endpoint pГєblico `POST /api/stats/pageview` + llamada desde `DishDetail.tsx` al montar.  
**CГіmo:** MГіdulo `stats` (schema, repository, service, routes). Body `{ dishId?, path }`. Auth opcional: lee token si existe, extrae `userId` sin fallar si no hay. Inserta en `pageViews` con `viewedAt = unixepoch()`. Responde 204. Frontend: `api/stats.ts` con `recordPageView`, `useEffect` en `DishDetail` dispara tras carga exitosa.  
**Impacto:** Base para analytics de usuario (T-071/T-072).  
**Deuda/Notas:** Auth opcional inline en routes (podrГ­a extraerse a middleware `optionalAuth` si se reutiliza).

---

## 2026-10-08 вЂ” T-065: Reintento automГЎtico en notificaciones

**QuГ©:** Utilidad `retry` genГ©rica + `sendWithRetry` en `notifications.repository.ts`; integraciГіn en `orders.service.ts`.  
**CГіmo:** `retry.ts` exporta `retry(fn, attempts=2, delayMs=2000)`. `sendWithRetry` envuelve cada notificaciГіn, reintenta 1 vez tras 2s, registra cada intento en `NotificationLog` con attempt/totalAttempts. `createOrder` usa `sendWithRetry` para email y Telegram.  
**Impacto:** Resiliencia ante fallos transitorios (red, rate limit temporal). Logs trazables por intento.  
**Deuda/Notas:** Backoff exponencial no implementado (fijo 2s); reintentos solo en creaciГіn de pedido, no en otros flujos.

---

## 2026-10-08 вЂ” T-063 / T-064: Orquestador de notificaciones + NotificationLog

**QuГ©:** `createOrder` en `orders.service.ts` dispara email y Telegram en paralelo con `Promise.allSettled`; resultados en `NotificationLog`.  
**CГіmo:** `notifications.repository.ts` con `insertNotificationLog`. `createOrder` recibe `customerEmail`, convierte items a `LocalizedOrderItem` con idioma resuelto, lanza ambas notificaciones sin await (background), cada una registra su log en `then`/`catch`. Endpoint responde 201 inmediatamente.  
**Impacto:** Flujo de pedido completo con notificaciones no bloqueantes. Base para T-065 (reintentos).  
**Deuda/Notas:** Reintento automГЎtico pendiente (T-065); logs de notificaciГіn solo se insertan si la BD estГЎ disponible (try/catch silencioso).

---

## 2026-10-08 вЂ” T-062: Plantilla HTML del pedido para el correo (order-email.ts)

**QuГ©:** Template `order-email.ts` con `buildOrderEmailHtml` y `buildOrderEmailText` + integraciГіn en `email.service.ts`.  
**CГіmo:** HTML con estilos inline (compatible Gmail/Outlook): logo "Osito a la carta", #pedido, fecha, cliente, tabla items (cant, nombre, precio unit, subtotal), total, nota. Texto plano como fallback. `sendOrderEmail` ahora recibe `customerEmail`.  
**Impacto:** Correo de prueba visualmente profesional. Base para T-063 (orquestador).  
**Deuda/Notas:** Test visual real en Gmail/Outlook pendiente (requiere credenciales Mailgun reales).

---

## 2026-10-08 вЂ” T-061: MГіdulo notifications - telegram.service.ts (node-telegram-bot-api)

**QuГ©:** Servicio `sendOrderTelegram(order, items)` con node-telegram-bot-api v2 + script de prueba `test-telegram.ts`.  
**CГіmo:** Instaladas `node-telegram-bot-api@2`, `@types/node-telegram-bot-api`. Servicio usa `env.TELEGRAM_BOT_TOKEN` y `env.TELEGRAM_CHAT_ID`; mensaje en Markdown con platos, totales y fecha. Script en `src/scripts/test-telegram.ts` con datos ficticios.  
**Impacto:** Mensaje Telegram de prueba funcional (ejecuta sin errores TS; 401 por token placeholder). Base para T-063 (orquestador).  
**Deuda/Notas:** Token y chat_id reales pendientes; registro en NotificationLog en T-064.

---

## 2026-10-07 вЂ” T-060: MГіdulo notifications - email.service.ts (Mailgun)

**QuГ©:** Servicio `sendOrderEmail(order, items)` con Mailgun v14 + script de prueba `test-email.ts`.  
**CГіmo:** Instaladas `mailgun.js@14`, `form-data@4`, `@types/form-data`. Servicio usa `env.MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`; destinatarios `env.CHEF_EMAIL` (lista coma-separada). Tipo `LocalizedOrderItem` con campo `name` ya localizado. Script en `src/scripts/test-email.ts` con datos ficticios. Corregidos imports con `import type` (verbatimModuleSyntax).  
**Impacto:** Email de prueba funcional (ejecuta sin errores TS; 401 en Mailgun por placeholder). Base para T-063 (orquestador).  
**Deuda/Notas:** Credenciales Mailgun reales pendientes; plantilla HTML mejorada en T-062; registro en NotificationLog en T-064.

---

## 2026-10-05 вЂ” DocumentaciГіn y memoria

**QuГ©:** Crear `docs/MEMORY.md` (Г­ndice), `docs/memory/topics/estado-actual.md`, `decisiones-arquitectura.md`, `gotchas-y-problemas-conocidos.md`.  
**CГіmo:** ExtracciГіn de TASKLIST, cГіdigo y decisiones implГ­citas.  
**Impacto:** Memoria persistente y navegable para prГіximas sesiones.  
**Deuda:** Faltan `historial-tareas.md` (este archivo) y `convenciones-proyecto.md`.

---

## 2026-10-10 вЂ” T-083: Vista de detalle de pedido para el chef

**QuГ©:** PГЎgina `/admin/orders/:id` para consultar el detalle del pedido y cambiar su estado.
**CГіmo:** Usa `fetchAdminOrderById` y `updateAdminOrderStatus`; restringe la vista a admin, muestra cliente, fecha, nota, platos, cantidades, precios unitarios y subtotales, y ofrece solo transiciones vГЎlidas segГєn T-082. Al actualizar, sincroniza la cachГ© del detalle y revalida la lista. AГ±adidas traducciones en espaГ±ol, ruso e inglГ©s.
**Impacto:** El chef puede consultar los datos completos y gestionar el avance del pedido desde su panel.
**Deuda/Notas:** Se registrГі en `decisiones-arquitectura.md` la aclaraciГіn de que `cancelled` forma parte de los estados vigentes, siguiendo SPEC y T-082.

---

## 2026-10-10 вЂ” T-084: PГЎgina admin para crear y editar platos

**QuГ©:** PГЎgina `/admin/dishes/create` para crear nuevo plato y `/admin/dishes/:id` para editarlo. Botones "Crear plato" en `/menu` y "Editar" en `/menu/:id`, ambos solo visibles para admin.
**CГіmo:** Componente `DishForm.tsx` con React Hook Form + Zod; valida 3 idiomas (nombres, descripciones, ingredientes), URL de imagen (absoluta o `/uploads/dishes/...`), categorГ­a (dropdown nativa), precio. Guarda imagen en cliente para vista previa. Auth guard redirige no-admin a `/menu`. API: `createDish()` y `updateDish()` en `client/src/api/dishes.ts`. Rutas configuradas en `main.tsx`. Botones integrados en `Menu.tsx` (header) y `DishDetail.tsx` (al lado de "Volver"). Cadenas i18n completas (admin.dishes.*) en es/ru/en.
**Impacto:** Chef puede crear platos nuevos y editar existentes directamente desde la interfaz. UX fluida: botones contextuales, validaciГіn clara, previsualizaciГіn de imagen.
**Deuda/Notas:** Upload de imagen pendiente (endpoint POST /api/dishes/:id/image existe en backend pero no integrado aГєn en frontend; para ahora se usa URL textual). Sin confirmaciГіn de cambios sin guardar (useBlocker pendiente). TypeScript y linting en verde.

## PrГіximas entradas (plantilla)

```
## 2026-10-XX вЂ” T-XXX: Nombre tarea
**QuГ©:** ...
**CГіmo:** ...
**Impacto:** ...
**Deuda/Notas:** ...
```

> **Regla:** Una entrada por tarea completada (o grupo pequeГ±o relacionado). Al terminar cada tarea, agregar aquГ­. Si hay decisiones/gotchas nuevos, aГ±adirlos tambiГ©n a su archivo temГЎtico correspondiente.

## 2026-10-11 вЂ” T-084: Carga de archivo de imagen en el formulario de platos

**QuГ©:** Se sustituyГі la entrada manual de URL por selecciГіn y carga de un archivo de imagen al crear o actualizar platos.
**CГіmo:** Se aГ±adiГі `POST /api/dishes/image` protegido para admin; acepta multipart `image` y devuelve la ruta relativa guardada. El cliente comparte `apiRequest` para enviar `FormData` con la autenticaciГіn/interceptor existentes, y sube antes de crear/actualizar. Al editar, si no se selecciona un archivo se conserva la imagen actual. Se mantiene el endpoint existente `POST /api/dishes/:id/image`.
**Impacto:** La interfaz de administraciГіn ya no requiere que el chef conozca o escriba una URL. JPG, PNG, WebP y AVIF hasta 5 MB, con validaciГіn y mensajes en es/ru/en.
**Deuda/Notas:** Como la carga y la escritura del plato son solicitudes separadas, si la segunda falla el archivo subido puede quedar sin referencia en la base de datos.

## 2026-10-11 вЂ” T-084: Cargar traducciones completas al editar un plato

**QuГ©:** Se corrigiГі la hidrataciГіn del formulario de ediciГіn, que antes solo completaba los campos del idioma activo.
**CГіmo:** La consulta de ediciГіn ahora obtiene el plato en espaГ±ol, ruso e inglГ©s en paralelo y asigna nombre, descripciГіn e ingredientes de cada respuesta a los campos de idioma correspondientes.
**Impacto:** Al editar, las tres traducciones guardadas se muestran y se preservan aunque el idioma de interfaz estГ© cambiado.
**Deuda/Notas:** La API de lectura sigue localizada; el cliente realiza tres peticiones en paralelo, sin ampliar la respuesta pГєblica.

## 2026-10-11 вЂ” T-084: Corregir serializaciГіn JSON al guardar platos

**QuГ©:** Se resolviГі el error `Malformed JSON body` al crear o editar un plato.
**CГіmo:** `createDish` y `updateDish` ahora pasan el objeto a `apiRequest` sin llamar previamente a `JSON.stringify`; `requestJson` es la capa responsable de serializar el objeto exactamente una vez. Se corrigiГі tambiГ©n el caller de pageview, que repetГ­a el mismo patrГіn.
**Impacto:** Express recibe un objeto JSON en vez de una cadena JSON de nivel superior, y puede validar el body correctamente.
**Deuda/Notas:** Ninguna.

## 2026-10-11 вЂ” T-085: GestiГіn admin de categorГ­as y estado localizado de pedidos

**QuГ©:** Se agregГі gestiГіn de categorГ­as para admin y se tradujo el badge de estado en la lista del panel del chef.
**CГіmo:** La ruta `/admin/categories` permite listar, crear, editar y eliminar categorГ­as con slug y nombres en es/ru/en, utilizando el CRUD existente. El guard del cliente restringe la pantalla a admin y el backend conserva la protecciГіn de escritura y el bloqueo de borrado cuando hay platos. El estado de cada pedido en `/admin/orders` se renderiza con las claves existentes `admin.orders.statuses.*`. Se aГ±adiГі manejo correcto de respuestas HTTP 204 para que las eliminaciones no se interpreten como JSON invГЎlido.
**Impacto:** El chef puede administrar categorГ­as desde la UI y ver los estados de pedidos en espaГ±ol, ruso o inglГ©s segГєn el idioma elegido.
**Deuda/Notas:** El orden de categorГ­as sigue dependiendo del `sortOrder` persistido; esta pantalla no incluye controles para reordenarlas.
## 2026-10-12 — T-097: Portada informativa y tema claro/oscuro

**Qué:** Se reemplazó la portada placeholder por una home de marca inspirada en cocina casera, con mensajes de negocio, CTA al menú, platos destacados y secciones de historia/servicio. También se añadió un interruptor de tema con persistencia manual en `localStorage`.
**Cómo:** La portada usa datos provisionales de negocio y textos en es/ru/en, reutiliza `DishCard` para mostrar tres platos destacados y sigue el sistema de tokens CSS de Tailwind 4. El selector de tema se implementó como un `Button` de shadcn con guardado en `localStorage` y `dark` en `html` vía CSS variables.
**Impacto:** La app muestra una primera versión usable y consistente del sitio con modo claro/oscuro y contenido de marca sin introducir nuevas dependencias.
**Deuda/Notas:** Los textos del negocio son provisionales y pueden actualizarse con datos reales del restaurante y horarios reales cuando estén confirmados.

## 2026-10-13 — T-098a-extendido: Email de verificación al registrar

**Qué:** El registro de usuario ahora envía un email de verificación con un enlace que confirma que el correo es válido. La cuenta no puede usarse para login hasta que el email se verifique.
**Cómo:**
- Agregada migración `0004_fuzzy_blob.sql` → `users.emailVerified` (default 0) y `users.emailVerificationToken` (text).
- Template `verification-email.ts` con HTML y texto plano, multiidioma (es/ru/en).
- `sendVerificationEmail` en `email.service.ts` → envía a la dirección del usuario (no al chef).
- `registerUser` en `auth.service.ts` genera `crypto.randomUUID()` como token, lo guarda con `updateEmailVerificationToken`, y envía el email con fire-and-forget (.catch loguea el error).
- Nuevo endpoint `GET /api/auth/verify-email?token=` → `verifyEmail` busca el token, marca `emailVerified=1`, limpia el token, devuelve el usuario.
- Frontend: nueva página `/verify-email` (`VerifyEmail.tsx`) con useQuery; `Register.tsx` deja de auto-login y muestra mensaje de "email de verificación enviado a {{email}}".
**Impacto:** Se confirma que el email registrado es válido antes de permitir el uso de la cuenta.
**Deuda/Notas:** El token no tiene expiración; considerar TTL para producción.

## 2026-10-13 — T-098b: Checkout como invitado en el frontend

**Qué:** Implementación del flujo de checkout híbrido para invitados en el frontend.
**Cómo:**
- `Cart.tsx` → navega a `/checkout` en vez de `/login` (funciona para usuarios no autenticados).
- `Checkout.tsx` (nuevo): formulario RHF + Zod usando `createGuestOrderBodySchema` desde `shared/schemas.ts`. Campos: name, phone, email?, address, note. On submit → POST `/api/orders/guest`, clearCart, guarda trackingToken en localStorage vía `guest-orders.ts`, redirige a `/orders/track/:token`.
- `OrderTrack.tsx` (nuevo, `/orders/track/:token`): useQuery al endpoint track. Botón "Crear cuenta" → `/register?email=&name=&phone=`.
- `Register.tsx` → precarga email/name/phone desde query params.
- `Orders.tsx` → sección "Pedidos como invitado" con tokens de localStorage; botón "Crear cuenta".
- `Layout.tsx` → botón "Mis pedidos" (invitado) → `/orders` con i18n key `nav.guestOrders`.
- `client/src/lib/guest-orders.ts` → save/get/getLast/getToken/remove/clear tokens (máx 10).
- i18n claves `checkout.*`, `track.*`, `orders.guestOrders*`, `guestOrders.*`, `nav.guestOrders` en es/ru/en (duplicados de `cart` y `checkout` unificados).
- `main.tsx` → rutas `/checkout` y `/orders/track/:token` registradas.

**Impacto:** Un invitado puede crear un pedido sin login, seguir su tracking y registrar una cuenta con datos pre-cargados. Usuario autenticado sin regresión.
## 2026-10-14 — Bugfixes: checkout híbrido

**Qué:** Se corrigieron dos bugs en el flujo de checkout híbrido y logout.
**Cómo:**
- Server: `getOrderByTrackingToken` devolvía un objeto plano en vez del formato `{ language, order, contactEmail }`. El cliente (`OrderTrack.tsx`) accedía a `data.order` que era `undefined`, causando un crash silencioso (pantalla en blanco) después de crear el pedido. Se cambió el `return` a `return { language, order: toResponse(...), contactEmail }` (envelope consistente con `orderEnvelopeSchema`).
- Server: `getOrderByTrackingToken` ahora incluye `contactEmail` en el envelope.
- Client store: `clearSession` reseteaba `_hasHydrated = false`, lo que hacía desaparecer el navbar al cerrar sesión (Layout usa `invisible h-0` cuando `!_hasHydrated`). Se preservó `_hasHydrated` como `true` en `clearSession`.
- Client `OrderTrack.tsx`: usa `location.state.order` como `initialData` de la query, evitando una llamada API redundante justo después de crear el pedido.
- Client `Register.tsx`: ya no hace auto-login después del registro; muestra "email de verificación enviado" y no usa `loginUser`, `useNavigate`, `useAuthStore` (imports limpios).

**Impacto:** El checkout híbrido funciona sin pantalla en blanco, el navbar persiste al cerrar sesión, y el flujo de verificación de email es consistente.
**Deuda/Notas:** `db:migrate` sigue fallando en server (aplicado manualmente). La migración `0004_fuzzy_blob.sql` no incluye `contactEmail` en el envelope del track endpoint (se resolvió en servicio, no en migración.

## 2026-10-15 — T-090: PWA con vite-plugin-pwa

**Qué:** Configuración de Progressive Web App (PWA) en el cliente para permitir la instalación en móvil.
**Cómo:**
- Instalado `vite-plugin-pwa@^2.0.0` como devDependency en `client/` (via npm workspace).
- Configurado en `client/vite.config.ts`:
  - `strategies: 'generateSW'` (generación automática de service worker).
  - `registerType: 'autoUpdate'` (actualización automática del SW cuando hay cambios).
  - `injectRegister: 'auto'` (inyección automática del registro en `index.html` durante build).
  - `includeAssets`: `favicon.ico`, `apple-touch-icon.png`, `images/osito.jpg` (precacheados).
  - `workbox`: `globPatterns: ['**/*.{js,css,html,svg,png,ico}']`, `maximumFileSizeToCacheInBytes: 3MB`.
  - `devOptions.enabled: false` (SW desactivado en dev).
- Manifest: `name: "Osito a la carta"`, `short_name: "Osito"`, `display: "standalone"`, `theme_color: "#f59e0b"`, `background_color: "#fff7ed"`, icons 192x192 y 512x512 (purpose: any + maskable).
- Creados íconos placeholder en `client/public/icons/`: `osito-icon-192.png`, `osito-icon-512.png`, `osito-icon.svg`.
- Creados `client/public/favicon.ico` (16/32/48) y `client/public/apple-touch-icon.png` (180x180).
- Build genera: `manifest.webmanifest`, `registerSW.js` (auto-inyectado en `index.html`), `sw.js` (service worker con precache).

**Impacto:** En Chrome móvil, la app muestra el prompt "Añadir a pantalla de inicio" y al abrirse desde allí se ve sin barra de navegador.
**Deuda/Notas:** Los íconos son placeholder; reemplazar con el logo oficial del restaurante. No hay runtimeCaching configurado (solo precache).

## 2026-10-17 — T-091: Auditoría y ajustes responsive

**Qué:** Se auditó y ajustó todas las páginas para móvil (360px), tablet (768px) y desktop (1280px+).
**Cómo:**
- `Layout.tsx`: Navbar colapsable con menú hamburguesa. Se extrajeron los enlaces de navegación a `NavLinks` (reutilizable entre desktop y mobile). En desktop: nav inline (`hidden md:block`). En móvil: botón hamburguesa `Menu`/`X` (40×40 px) que abre un panel con enlaces de ancho completo (`w-full justify-start`) para mejor touch target; cada enlace cierra el menú al navegar.
- `Layout.tsx`: Añadidas claves i18n `nav.openMenu` y `nav.closeMenu` en es/ru/en.
- `admin/OrderDetail.tsx`: `grid grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (la cuadrícula de info del pedido ahora es 1 columna en móvil).
- `Stats.tsx`: `ResponsiveContainer` height `300→200` px y `YAxis` width `120→100` px (`tick` fontSize `12→11`), para charts más compactos en móvil.
- Tabla de `admin/Orders.tsx` y `admin/OrderDetail.tsx`: ya usan `overflow-x-auto` (scroll horizontal), mantenido como solución responsive para tablas anchas.

**Impacto:** Navbar usable en 360 px (antes se amontontaban todos los enlaces + selectors). Grids de detalle de pedido adaptivos. Charts de stats no dominan la pantalla en móvil.
**Deuda/Notas:** Los botones shadcn `size="sm"` (32 px) y `size="default"` (36 px) están por debajo del mínimo WCAG de 44 px. En el menú móvil se compensa con `w-full` (ancho completo). Corregir globalmente requiere modificar el componente base `Button` (T-035), pendiente de decisión.

## 2026-10-17 — T-092: Manejo global de errores en frontend (ErrorBoundary + toasts)

**Qué:** Implementación completa de manejo global de errores en el frontend: ErrorBoundary con fallback amigable, toasts de notificación para errores API, y sistema de supresión para evitar duplicados.

**Cómo:**
- `ErrorBoundary.tsx`: Class component (requerido por React) con `getDerivedStateFromError`, `componentDidCatch` (log a consola), y `reset` que recarga la página. El fallback (`ErrorFallback`) es un componente función que usa `useTranslation` para renderizar claves i18n `errors.title`, `errors.fallback`, `errors.retry`. Envuelve todas las rutas en `main.tsx`.
- `main.tsx`: Importado `Toaster` de `sonner` y `<ErrorBoundary>` envolviendo `<Routes>`. Corregida estructura JSX de comentarios (comentario no cerrado que rompía el árbol).
- `client.ts` (`apiRequest`): Al re-throw de un error 4xx/5xx que no sea `UNAUTHORIZED` (que se renueva), muestra `toast.error()` con el mensaje del API y una descripción con el código de error. El `i18n` instance ya importado se usa para el mensaje genérico `errors.generic`.
- `http.ts` (`RequestOptions`): Añadido `silent?: boolean`. Cuando es `true`, `apiRequest` no muestra el toast.
- API wrapper functions (`api/dishes.ts`, `api/categories.ts`, `api/orders.ts`, `api/auth.ts`, `api/stats.ts`): Todos aceptan un parámetro opcional `options?: { silent?: boolean }` que se reenvía a `apiRequest`.
- Todos los llamadores actuales pasan `{ silent: true }` para evitar notificaciones duplicadas (formularios con errores inline, `useQuery` con estado de error, mutations con `onError`).
- Claves i18n `errors: { title, fallback, retry, generic }` añadidas a `locales/es.json`, `ru.json`, `en.json`.

**Impacto:** Un error de red o de API que no sea capturado por el caller muestra un toast de notificación. Si un componente se rompe durante el render, el usuario ve un fallback amigable con botón de recarga. Formularios y queries que manejan errores localmente mantienen su UX sin toasts duplicados. Typecheck, lint y build pasan.

**Deuda/Notas:** La renovación de token fallida no muestra toast (redirige al login). El retry después de renovación exituosa llama a `requestJson` directamente (no `apiRequest`), por lo que un error en el retry no dispara toast; esto es consistente con el diseño actual.

## 2026-10-19 — T-099: Checkout híbrido (autenticados + invitados) con prefilling y formato de teléfono ruso

**Qué:** Se extendió el flujo de checkout para soportar tanto usuarios autenticados como invitados en una sola página, con pre-llenado de email para usuarios logueados y formato de teléfono para formato ruso.

**Cómo:**
- `Checkout.tsx` reescrito completamente: se separó en dos componentes internos `AuthCheckoutForm` y `GuestCheckoutForm` para cumplir `react-hooks/rules-of-hooks` (no hooks condicionales) y mantener tipos separados.
- Usuario autenticado: solo ve campo de nota opcional; email se pre-rellena desde `user.email` y se usa `POST /api/orders` (crea pedido con `userId`).
- Usuario invitado: formulario completo (nombre, teléfono, email, dirección, nota); placeholder y ayuda visual para formato ruso +7 (XXX) XXX-XX-XX; usa `POST /api/orders/guest` (crea pedido con `userId=null` y `trackingToken`).
- Claves i18n añadidas en `locales/es.json`, `ru.json`, `en.json`: `checkout.authInfo`, `checkout.phoneFormat`, corrección `checkout.loginInfo`.
- Separación de formularios en componentes separados para cumplir `react-hooks/rules-of-hooks` y evitar hooks condicionales (los hooks `useForm`, `useMemo` se llaman siempre en el mismo orden en cada componente).

**Impacto:** Checkout unificado para autenticados e invitados; autenticados tienen UX simplificada (solo nota); invitados tienen formulario completo con ayuda de formato de teléfono ruso; typecheck, lint y build pasan.

**Deuda/Notas:** El modelo de usuario (`ApiAuthUser`) solo tiene `id`, `email`, `role`, `preferredLang` — no hay nombre, teléfono ni dirección guardados en BD, por lo que solo se pre-rellena email. Si en el futuro se añaden esos campos al usuario, se pueden pre-rellenar también.

## 2026-10-19 — T-100: Perfil de usuario con datos de entrega guardados

**Qué:** Se añadió la capacidad de guardar y reutilizar datos de entrega (nombre, teléfono, dirección) para usuarios autenticados, que se pre-rellenan en el checkout y se guardan automáticamente al confirmar un pedido.

**Cómo:**
- BD: añadidas columnas `name`, `phone`, `deliveryAddress` a tabla `users` (migración 0005).
- Backend: endpoint `PUT /api/users/me` para actualizar perfil; `login` y `refresh` devuelven los nuevos campos (`name`, `phone`, `deliveryAddress`); `POST /api/orders` para autenticados no requiere datos de contacto (se usan los del perfil si no se envían en el body).
- Frontend: `ApiAuthUser` extendido con `name`, `phone`, `deliveryAddress`; `useAuthStore` con acción `updateProfile`; `Checkout.tsx` formulario completo para autenticados pre-rellenado con datos del perfil (nombre, teléfono, email, dirección, nota); al confirmar se guarda el perfil via `PUT /api/users/me` y luego se crea el pedido con `POST /api/orders`.
- i18n: reutilizadas claves existentes `checkout.authInfo`, `checkout.phoneFormat`, `checkout.loginInfo`, `checkout.name`, `checkout.phone`, `checkout.email`, `checkout.address`, `checkout.note`.

**Impacto:** Usuarios autenticados tienen formulario completo en checkout con datos pre-rellenados; los datos se guardan automáticamente al confirmar el pedido para futuros pedidos; typecheck, lint y build pasan.

**Deuda/Notas:** El email no se permite cambiar desde el perfil (solo vía registro/login); si se quiere permitir cambio de email, haría falta un flujo de verificación adicional. Los campos del perfil son opcionales en la BD (nullable) para no romper usuarios existentes.
---

## 2026-10-20 — T-093: Tests básicos de flujos críticos (registro, pedido, notificación)

**Qué:** Instalación de vitest y creación de tests para auth.service, orders.service y dishes.service usando better-sqlite3 en memoria.

**Cómo:**
- Instalado itest@^3.2.7 como devDependency en server/.
- itest.config.ts: globals, environment node, setupFiles ./src/test/setup.ts.
- src/test/setup.ts: env vars señadas antes de imports; tablas creadas con DDL directo en :memory: (no migrate() — las migraciones 0003 usan INSERT INTO __new_orders SELECT * FROM orders con columnas inexistentes en tabla original); i.mock para db/client.js, logger.js, 
otifications/email.service.js, 
otifications/telegram.service.js, 
otifications/notifications.repository.js; fterEach limpia datos con PRAGMA foreign_keys = OFF, i.clearAllMocks().
- src/test/auth.service.test.ts: register (success, duplicate email 409, verification email sent), login (success, wrong password 401, nonexistent email 401), refresh (valid token, invalid token 401, access token instead of refresh 401), DB integrity (emailExists, findUserById).
- src/test/orders.service.test.ts: createOrder (success with userId/total/profile data, unavailable dish 400, nonexistent dish 400, total rounding, profile empty, customer note, empty note → NULL), createGuestOrder (userId null, trackingToken, unavailable dish 400), transaccionalidad (order + items in transaction), localization (ru, en, Accept-Language header, undefined → default es).
- src/test/dishes.service.test.ts: listDishes (default es, ru, en, Accept-Language parsing, unavailable filter, sorting by category sortOrder), getDish (available dish localized, 404 for nonexistent, 404 for disabled), createDish (success, 400 for nonexistent category), localization (ru-RU header, * wildcard, q=0 exclusion).
- Scripts 
pm run test (root) y 
pm run test --workspace @osito/server.

**Resultados:** 40 tests pasados en 3 archivos (12 auth, 14 orders, 14 dishes). Typecheck, lint y tests en verde.

**Impacto:** Primer suite de tests automáticos en el proyecto; valida los flujos críticos de autenticación, pedidos y localización de platos antes de T-094 (despliegue PM2+Nginx).

**Deuda/Notas:**
- Tests síncronos (bcryptjs, better-sqlite3) toman ~3s; si crecen, considerar crypt async o worker pools.
- sendVerificationEmail mock debe retornar Promise (service usa .catch()).
- Migraciones Drizzle con ALTER TABLE (recreate pattern) fallan en DB limpia; usar DDL directo en tests.
- El code de error en AppError no está en message; testear con instanceof y acceso a .code.

449: ## Próximas entradas (plantilla)

---

## 2026-10-21 — T-101: Poner el logo como favicon e icono de la aplicación

**Qué:** Se configuró `client/public/images/osito.jpg` como favicon e icono de la aplicación PWA.

**Cómo:**
- `client/index.html`: agregado `<link rel="icon" href="/images/osito.jpg" />` como favicon principal.
- `client/vite.config.ts`: agregado `images/osito.jpg` a `includeAssets` y como `icons` en el manifest PWA (192x192 y 512x512, purpose `any` y `maskable`). Agregado `jpg` a `globPatterns` de precache.

**Impacto:** El favicon de `osito.jpg` se muestra en la pestaña del navegador y la app PWA usa la imagen del osito como icono de instalación. Typecheck, lint y build pasan.

**Deuda/Notas:** La imagen `osito.jpg` es el logo existente; no se generaron versiones optimizadas de iconos adicionales.

---

## 2026-10-21 — T-102: Panel de admin: listar usuarios

**Qué:** Se creó un panel de administración para listar usuarios, con endpoint backend y página frontend.

**Cómo:**
- Backend: `server/src/modules/users/users.repository.ts` con `findAllUsers()` usando proyección pública (sin `passwordHash`). `server/src/modules/users/users.routes.ts` con `GET /api/admin/users` protegido por `requireAdmin`. Rutas registradas en `server/src/app.ts`.
- Frontend: `client/src/api/users.ts` con `listAdminUsers()`. `client/src/pages/admin/Users.tsx` con guard de admin (redirige a `/menu` si no es admin), tabla con columnas: id, email, role, name, phone, address, emailVerified, createdAt. Skeleton y estado de error. Ruta `/admin/users` en `main.tsx`. Nav link en `Layout.tsx` (solo admin). i18n en es/ru/en (`admin.users.*`, `nav.adminUsers`).
- Tipo cliente `ApiAuthUser` extendido con `emailVerified: number` y `createdAt: number` (coinciden con el schema Drizzle `integer(...).default(sql\`(unixepoch())\`)`).

**Impacto:** Un admin autenticado puede ver todos los usuarios desde `/admin/users`, con datos de contacto y estado de verificación. Typecheck, lint pasan en client y server.

**Deuda/Notas:** La tabla no tiene paginación. Para gestión futura (editar role/verificación) se añadirían endpoints PATCH.

---

## 2026-10-20 — T-095: Documentar configuración de Nginx + Let's Encrypt en docs/DEPLOY.md

**Qué:** Documentación completa de la configuración de Nginx como proxy inverso con HTTPS mediante Let's Encrypt, incluyendo explicación detallada de directivas y renovación automática.

**Cómo:**
- Reemplazado y ampliado la sección "Paso 10" de DEPLOY.md: server block HTTP→HTTPS con `return 301`, server block HTTPS con:
  - `proxy_pass http://127.0.0.1:3000/api/` para `/api/` con headers `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Upgrade` (WebSocket ready)
  - Gzip habilitado (`gzip on`, `gzip_vary`, `gzip_proxied any`, `gzip_comp_level 6`, `gzip_min_length 256`, lista de `gzip_types` para text/CSS/JS/JSON/SVG)
  - Cache de assets estáticos con `location ~* \.(js|css|...)$` → `expires 1y`, `Cache-Control "public, immutable"` (Vite build assets con hash)
  - `location /uploads/` con `alias` + `expires 1d` (content dinámico, cache corto)
  - SPA fallback con `try_files $uri $uri/ /index.html`
- Tabla de explicación de directivas clave (`proxy_pass`, `proxy_set_header Host`, `X-Forwarded-Proto`, cache `alias` vs `root`, `gzip_types`, `try_files`)
- Sección "Paso 11": instalación de certbot, obtención de certificado con `certbot --nginx -d`, verificación con `openssl s_client`, renovación automática con `certbot renew --dry-run`, verificación del `certbot.timer` de systemd, documentación de logs y monitoreo
- Agregado "Verificación final" con 4 checks: HTTPS 200, HTTP→301 redirect, API por HTTPS, timer de renovación activo
- Actualizado "Resumen de comandos rápidos" con HTTPS checks

**Impacto:** Un administrador puede poner HTTPS en producción siguiendo la guía paso a paso. La explicación detallada de directivas ayuda a entender el porqué de cada configuración (especialmente `alias` vs `root` para uploads, y `immutable` para assets con hash).

**Deuda/Notas:** La configuración de Nginx depende de que Node PM2 ya esté corriendo en localhost:3000 (T-094). Let's Encrypt requiere que el DNS apunte al VPS antes de ejecutar certbot.

## 2026-10-20 — T-094: Configurar scripts de despliegue (PM2 + Systemd + Nginx)

**Qué:** Creación de server/ecosystem.config.cjs para PM2 y docs/DEPLOY.md con la guía de despliegue paso a paso.

**Cómo:**
- server/ecosystem.config.cjs: config CommonJS (.cjs) para PM2. App: osito-server, script dist/server/src/app.js, instances 1, autorestart true, max_memory_restart 512M. Env: NODE_ENV=production, PORT=3000. Logs en ./logs/ con merge_logs: true y timestamp YYYY-MM-DD HH:mm:ss.
- docs/DEPLOY.md: 11 pasos cubriendo (1) instalación Node 22 LTS vía NodeSource, (2) clonar repo, (3) npm ci en server/client, (4) configurar .env, (5) migraciones + seed, (6) build del frontend, (7) build del backend (tsc → dist/server/src/app.js), (8) pm2 start ecosystem.config.cjs, (9) arranque automático con pm2 startup systemd, (10) configuración Nginx proxy inverso (HTTP→HTTPS, /api/ → localhost:3000, /uploads/ alias, SPA fallback), (11) SSL con Let's Encrypt (certbot --nginx).
- Nota sobre migraciones de tabla-rebuild (T-098a/MEMORY) que fallan en BD limpia: usar sqlite3 CLI directamente como workaround.

**Impacto:** Guía completa de despliegue que un administrador puede seguir para poner el servidor en producción con PM2 + Systemd (arranque automático) + Nginx (proxy inverso HTTPS). El ecosystem.config.cjs permite pm2 start ecosystem.config.cjs y pm2 restart osito-server tras cada deploy.

**Deuda/Notas:**
- La configuración de Nginx y Let's Encrypt pertenecen a T-095 (no implementados aquí, solo documentados).
- El server actual no sirve el frontend (Express solo expone API); Nginx sirve client/dist/ directamente.
- osito.db debe estar en un path accesible por el usuario que ejecuta PM2; migraciones aplicadas antes de pm2 start.

## 2026-10-21 — T-096: Script de backup diario de osito.db

**Qué:** Script `server/scripts/backup.sh` que crea backups diarios de la base de datos SQLite y mantiene los últimos 30 días. Documentación en `docs/DEPLOY.md` con instrucciones de crontab y restauración.

**Cómo:**
- `server/scripts/backup.sh`: script Bash con `set -euo pipefail`. Usa `sqlite3 DB ".backup FILE"` (no `cp`) para consistencia — ver gotcha en MEMORY.md ("Backup cp copia DB corrupta").
- Resuelve `DATABASE_URL` desde `.env` (o fallback `./osito.db`). La ruta se relaciona respecto al directorio del script (`SCRIPT_DIR`), no al `cwd` del crontab.
- Guarda backups en `backups/osito-YYYY-MM-DD.db`.
- Limpieza: `find backups -name 'osito-*.db' -mtime +30 -delete` (mantiene 30 días).
- Verifica existencia de la base y del `sqlite3` CLI antes de proceder.
- `docs/DEPLOY.md`: sección "Paso 12" con (12.1) instalar sqlite3 CLI, (12.2) configurar crontab (`0 3 * * * /var/www/osito/server/scripts/backup.sh >> /var/log/osito-backup.log 2>&1`), (12.3) verificar backups.
- Sección "Paso 13": instrucciones de restauración con `.restore` + `PRAGMA integrity_check`.

**Impacto:** Backups diarios automáticos a las 03:00, con retención de 30 días y documentación de restauración. Evita pérdida de datos por hardware corrupto o error humano.

**Deuda/Notas:**
- El script asume `sqlite3` CLI instalado; el crontab debe ejecutarse como el usuario que ejecuta PM2 (permisos sobre `backups/` y `osito.db`).
- `.backup` de SQLite puede bloquear brevemente la escritura durante el checkpoint (normalmente <1 segundo).
- Los backups no incluyen `osito.db-wal`/`osito.db-shm` (el `.backup` checkpointea antes de copiar).

## Próximas entradas (plantilla)
