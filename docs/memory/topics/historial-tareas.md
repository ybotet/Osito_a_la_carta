# Historial cronológico de tareas

> Última actualización: 2026-10-08
>
> Formato: `YYYY-MM-DD | Tarea | Qué se hizo | Cómo/Impacto | Deuda/Notas`

---

## 2026-10-09 — T-092a: Corregir renderizado del layout compartido

**Qué:** Se eliminó un selector de Zustand inestable del layout global que podía provocar renderizados repetidos y dejar en blanco todas las rutas.  
**Cómo:** `user` y `isAuthenticated` se seleccionan por separado para devolver referencias primitivas/estables; se conservó el comportamiento de autenticación existente.  
**Impacto:** El layout compartido ya no crea un objeto nuevo durante cada lectura del store.  
**Deuda/Notas:** T-092 (ErrorBoundary y toasts para errores globales) sigue pendiente y no forma parte de esta corrección.

## 2026-09-28 — T-001 a T-009: Setup del proyecto

**Qué:** Estructura monorepo (`server/`, `client/`, `shared/`, `docs/`), TS estricto, Vite+React, proxy, Tailwind, ESLint/Prettier, pino, Zod env, health check.  
**Cómo:** npm workspaces en raíz; `type: module` + `moduleResolution: bundler` en server; `tsx` para dev; `process.loadEnvFile()` nativo (Node 22+).  
**Impacto:** Base lista para desarrollo. `npm run dev` levanta ambos.  
**Deuda:** Ninguna.

---

## 2026-09-29 — T-010 a T-013 + A-001: Base de datos

**Qué:** Schema Drizzle (6 entidades), migración inicial, seed platos (5 × 3 idiomas), seed admin, categorías (A-001).  
**Cómo:** `drizzle-kit` para migraciones; SQLite WAL mode; seed idempotente (upsert por slug); bcrypt 12 rounds.  
**Impacto:** BD funcional con datos de prueba multilingües.  
**Deuda:** Migraciones futuras requieren `drizzle-kit generate` + `migrate`.

---

## 2026-09-29 a 2026-10-01 — T-020 a T-029b: API platos y categorías

**Qué:** CRUD completo platos (GET/POST/PUT/DELETE + PATCH availability + DELETE permanent), CRUD categorías, localización por `Accept-Language`, borrado lógico (`isAvailable`), índice `category_id`.  
**Cómo:** Módulos feature-based (`dishes/`, `categories/`); Zod schemas en `shared/`; middleware `requireAuth`/`requireAdmin`; i18n via columnas `_es|_ru|_en`; transacciones no necesarias aquí.  
**Impacto:** API pública y admin funcional.  
**Deuda:** Rate limiting pendiente (T-092).

---

## 2026-10-01 a 2026-10-02 — T-030 a T-035: Frontend menú + i18n

**Qué:** `react-i18next` (es/ru/en, persistido), página `/menu` (agrupado por categoría), `DishCard` responsive, `/menu/:id`, navbar + selector idioma, shadcn/ui base.  
**Cómo:** TanStack Query v5 para server state; `useDishes` hook; Tailwind 4 CSS-first (`@import "tailwindcss"`); tokens CSS en `:root`.  
**Impacto:** Menú funcional y multilingüe.  
**Deuda:** Tests E2E pendientes (T-093).

---

## 2026-10-01 a 2026-10-03 — T-040 a T-047: Autenticación completa

**Qué:** Register, login (access 15min + refresh 7d, secretos distintos, claims `type`), refresh endpoint, middlewares, páginas login/register, Zustand store persistido, interceptor fetch 401→refresh→retry, subida imágenes (UUID + `PUBLIC_ORIGIN`).  
**Cómo:** jsonwebtoken + bcryptjs; `AppError` con códigos estandarizados; interceptor con flag de renovación compartida; `UPLOADS_DIR` fuera del repo; Nginx alias pendiente (T-095).  
**Impacto:** Auth end-to-end funcional, sesión persistente, imágenes servidas por Nginx.  
**Deuda:** Rotación refresh token (simplicidad actual); 2FA no contemplado.

---

## 2026-10-03 a 2026-10-04 — T-050 a T-055: Carrito y pedidos

**Qué:** Cart store Zustand (persist, snapshot plato), `POST /api/orders` (transacción + snapshot precios), `GET /api/orders` (historial usuario), páginas `/cart`, `/orders`, `/orders/:id`.  
**Cómo:** Transacción Drizzle atómica; validación items (disponibilidad, duplicados, cantidad); total en céntimos (Math.round); `language` snapshot en Order; TanStack Query invalidation tras POST.  
**Impacto:** Flujo compra completo usuario autenticado.  
**Deuda:** Notificaciones al chef pendientes (Fase 6).

---

## 2026-10-08 — T-081: Página /admin/orders con polling y filtro

**Qué:** Página admin `/admin/orders` con tabla, polling 10s, filtro por estado.  
**Cómo:** `Orders.tsx` usa `useQuery` con `refetchInterval: 10_000`. Tabla con columnas: #, cliente, fecha, estado (Badge), total, acciones. Filtro `Select` por estado. Click en fila navega a `/admin/orders/:id`. `requireAuth` + `role === 'admin'` en componente, redirige a `/menu` si no. Componentes `Select` y `Badge` nuevos (Radix + shadcn).  
**Impacto:** Chef ve pedidos en tiempo real sin recargar.  
**Deuda/Notas:** Detalle de pedido pendiente (T-083). Paginación no implementada.

---

## 2026-10-08 — T-080: GET /api/admin/orders (panel del chef)

**Qué:** Endpoint admin `GET /api/admin/orders` que lista todos los pedidos con info de usuario e items.  
**Cómo:** `admin.routes.ts` con `requireAdmin`. Query opcional `?status=`. `findAllOrdersForAdmin` en repositorio: JOIN a `users` (email), JOIN a `order_items` + `dishes` (items con 3 idiomas). `listAdminOrders` en servicio localiza por `Accept-Language`. Respuesta 200 con array ordenado por createdAt DESC.  
**Impacto:** Base para panel del chef (T-081/T-082/T-083).  
**Deuda/Notas:** Filtro status valida contra enum; no hay paginación aún.

---

## 2026-10-08 — T-072: Página /stats con gráficos (Recharts)

**Qué:** Página `/stats` protegida con resumen numérico y dos gráficos de barras horizontales.  
**Cómo:** `Stats.tsx` usa `useQuery` a `GET /api/stats/me`. Tarjetas: totalOrders, totalSpent, memberSince. Gráficos: `BarChart` (Recharts) con layout vertical para topViewedDishes y topOrderedDishes. i18n en es/ru/en. Enlace en navbar (`nav.stats`).  
**Impacto:** Usuario ve sus métricas de consumo y visitas.  
**Deuda/Notas:** Gráficos usan tooltip por defecto; colores fijos (azul/verde). Chunk de build crece por Recharts (~370KB gzipped).

---

## 2026-10-08 — T-071: GET /api/stats/me con agregados del usuario

**Qué:** Endpoint protegido `GET /api/stats/me` que devuelve estadísticas agregadas del usuario autenticado.  
**Cómo:** `stats.repository.ts` con consultas Drizzle: `getTopViewedDishes` (count + groupBy + orderBy + limit 5), `getTopOrderedDishes` (sum quantity + groupBy + orderBy + limit 5), `getUserStats` (count orders, sum total, memberSince). `stats.service.ts` con `getUserStatsData` que localiza nombres por idioma. `stats.routes.ts` con `requireAuth`. Respuesta: `{ topViewedDishes, topOrderedDishes, totalOrders, totalSpent, memberSince }`.  
**Impacto:** Base para frontend de estadísticas (T-072).  
**Deuda/Notas:** Agregaciones usan Drizzle SQL builders; memberSince viene de `users.createdAt`.

---

## 2026-10-08 — T-070: POST /api/stats/pageview + frontend tracking

**Qué:** Endpoint público `POST /api/stats/pageview` + llamada desde `DishDetail.tsx` al montar.  
**Cómo:** Módulo `stats` (schema, repository, service, routes). Body `{ dishId?, path }`. Auth opcional: lee token si existe, extrae `userId` sin fallar si no hay. Inserta en `pageViews` con `viewedAt = unixepoch()`. Responde 204. Frontend: `api/stats.ts` con `recordPageView`, `useEffect` en `DishDetail` dispara tras carga exitosa.  
**Impacto:** Base para analytics de usuario (T-071/T-072).  
**Deuda/Notas:** Auth opcional inline en routes (podría extraerse a middleware `optionalAuth` si se reutiliza).

---

## 2026-10-08 — T-065: Reintento automático en notificaciones

**Qué:** Utilidad `retry` genérica + `sendWithRetry` en `notifications.repository.ts`; integración en `orders.service.ts`.  
**Cómo:** `retry.ts` exporta `retry(fn, attempts=2, delayMs=2000)`. `sendWithRetry` envuelve cada notificación, reintenta 1 vez tras 2s, registra cada intento en `NotificationLog` con attempt/totalAttempts. `createOrder` usa `sendWithRetry` para email y Telegram.  
**Impacto:** Resiliencia ante fallos transitorios (red, rate limit temporal). Logs trazables por intento.  
**Deuda/Notas:** Backoff exponencial no implementado (fijo 2s); reintentos solo en creación de pedido, no en otros flujos.

---

## 2026-10-08 — T-063 / T-064: Orquestador de notificaciones + NotificationLog

**Qué:** `createOrder` en `orders.service.ts` dispara email y Telegram en paralelo con `Promise.allSettled`; resultados en `NotificationLog`.  
**Cómo:** `notifications.repository.ts` con `insertNotificationLog`. `createOrder` recibe `customerEmail`, convierte items a `LocalizedOrderItem` con idioma resuelto, lanza ambas notificaciones sin await (background), cada una registra su log en `then`/`catch`. Endpoint responde 201 inmediatamente.  
**Impacto:** Flujo de pedido completo con notificaciones no bloqueantes. Base para T-065 (reintentos).  
**Deuda/Notas:** Reintento automático pendiente (T-065); logs de notificación solo se insertan si la BD está disponible (try/catch silencioso).

---

## 2026-10-08 — T-062: Plantilla HTML del pedido para el correo (order-email.ts)

**Qué:** Template `order-email.ts` con `buildOrderEmailHtml` y `buildOrderEmailText` + integración en `email.service.ts`.  
**Cómo:** HTML con estilos inline (compatible Gmail/Outlook): logo "Osito a la carta", #pedido, fecha, cliente, tabla items (cant, nombre, precio unit, subtotal), total, nota. Texto plano como fallback. `sendOrderEmail` ahora recibe `customerEmail`.  
**Impacto:** Correo de prueba visualmente profesional. Base para T-063 (orquestador).  
**Deuda/Notas:** Test visual real en Gmail/Outlook pendiente (requiere credenciales Mailgun reales).

---

## 2026-10-08 — T-061: Módulo notifications - telegram.service.ts (node-telegram-bot-api)

**Qué:** Servicio `sendOrderTelegram(order, items)` con node-telegram-bot-api v2 + script de prueba `test-telegram.ts`.  
**Cómo:** Instaladas `node-telegram-bot-api@2`, `@types/node-telegram-bot-api`. Servicio usa `env.TELEGRAM_BOT_TOKEN` y `env.TELEGRAM_CHAT_ID`; mensaje en Markdown con platos, totales y fecha. Script en `src/scripts/test-telegram.ts` con datos ficticios.  
**Impacto:** Mensaje Telegram de prueba funcional (ejecuta sin errores TS; 401 por token placeholder). Base para T-063 (orquestador).  
**Deuda/Notas:** Token y chat_id reales pendientes; registro en NotificationLog en T-064.

---

## 2026-10-07 — T-060: Módulo notifications - email.service.ts (Mailgun)

**Qué:** Servicio `sendOrderEmail(order, items)` con Mailgun v14 + script de prueba `test-email.ts`.  
**Cómo:** Instaladas `mailgun.js@14`, `form-data@4`, `@types/form-data`. Servicio usa `env.MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`; destinatarios `env.CHEF_EMAIL` (lista coma-separada). Tipo `LocalizedOrderItem` con campo `name` ya localizado. Script en `src/scripts/test-email.ts` con datos ficticios. Corregidos imports con `import type` (verbatimModuleSyntax).  
**Impacto:** Email de prueba funcional (ejecuta sin errores TS; 401 en Mailgun por placeholder). Base para T-063 (orquestador).  
**Deuda/Notas:** Credenciales Mailgun reales pendientes; plantilla HTML mejorada en T-062; registro en NotificationLog en T-064.

---

## 2026-10-05 — Documentación y memoria

**Qué:** Crear `docs/MEMORY.md` (índice), `docs/memory/topics/estado-actual.md`, `decisiones-arquitectura.md`, `gotchas-y-problemas-conocidos.md`.  
**Cómo:** Extracción de TASKLIST, código y decisiones implícitas.  
**Impacto:** Memoria persistente y navegable para próximas sesiones.  
**Deuda:** Faltan `historial-tareas.md` (este archivo) y `convenciones-proyecto.md`.

---

## Próximas entradas (plantilla)

```
## 2026-10-XX — T-XXX: Nombre tarea
**Qué:** ...
**Cómo:** ...
**Impacto:** ...
**Deuda/Notas:** ...
```

> **Regla:** Una entrada por tarea completada (o grupo pequeño relacionado). Al terminar cada tarea, agregar aquí. Si hay decisiones/gotchas nuevos, añadirlos también a su archivo temático correspondiente.