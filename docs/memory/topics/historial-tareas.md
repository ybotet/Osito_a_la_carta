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
