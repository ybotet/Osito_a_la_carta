# Decisiones de arquitectura

> Гљltima actualizaciГіn: 2026-10-07

Este documento registra las decisiones tГ©cnicas clave con su contexto, alternativas evaluadas y consecuencias. Se actualiza al tomar decisiones relevantes.

---

## 1. Monorepo con npm workspaces

**Fecha:** 2026-09-28  
**DecisiГіn:** Usar un monorepo con 3 workspaces: `server/`, `client/`, `shared/`.  
**Alternativas:** Repos separados, o monorepo con Turborepo/Nx.  
**Por quГ©:** Simplicidad (npm nativo), shared types/Zod schemas sin duplicaciГіn, un solo `package.json` raГ­z para scripts globales.  
**Consecuencias:** `npm install` en raГ­z instala todo; scripts con `--workspace` o `npm run dev` (concurrently) desde raГ­z.

---

## 2. TypeScript estricto + ESM en server

**Fecha:** 2026-09-28  
**DecisiГіn:** `"type": "module"`, `"strict": true`, `"moduleResolution": "bundler"`, target ES2022.  
**Alternativas:** CommonJS, o TS menos estricto.  
**Por quГ©:** ESM es el estГЎndar moderno; strict evita bugs sutiles; bundler resolution funciona con imports relativos y `shared/`.  
**Consecuencias:** Imports con extensiГіn `.js` en runtime; `tsx` para dev; `tsc --noEmit` para typecheck.

---

## 3. Drizzle ORM + SQLite (WAL mode)

**Fecha:** 2026-09-29  
**DecisiГіn:** Drizzle como ORM type-safe, SQLite en archivo `osito.db` con WAL (`PRAGMA journal_mode=WAL`).  
**Alternativas:** Prisma, TypeORM, PostgreSQL.  
**Por quГ©:** Drizzle es ligero, type-safe sin magic, SQL-like; SQLite embebido = cero infra en dev/VPS pequeГ±o; WAL permite lecturas concurrentes sin bloquear escrituras.  
**Consecuencias:** Migraciones con `drizzle-kit`; `db:seed` para datos iniciales; Г­ndices declarados en schema; no hay connection pooling (archivo Гєnico).

---

## 4. Esquema de BD: 6 entidades principales

**Fecha:** 2026-09-29  
**Entidades:** `users`, `categories`, `dishes`, `orders`, `order_items`, `notification_logs` (+ `page_views` para stats).  
**Decisiones clave:**
- `dishes`: borrado lГіgico (`isAvailable` boolean), no `deleted_at`; imagen opcional en `image_url` (ruta relativa).
- `categories`: `slug` Гєnico para URLs limpias; `sortOrder` para orden manual.
- `orders`: `status` enum (`pending|preparing|sent|delivered`), `total` en cГ©ntimos (integer), `language` snapshot al crear.
- `order_items`: snapshot de `name`, `description`, `price` en idioma del pedido (no FK a dishes para histГіrico inmutable).
- `users`: `role` enum (`customer|admin`), `preferredLang`, `passwordHash` (bcrypt, 12 rounds).

---

## 5. AutenticaciГіn: JWT access + refresh con secretos distintos

**Fecha:** 2026-10-01  
**DecisiГіn:** Access token 15 min, refresh 7 dГ­as; claims distintos: access `{type:'access', email, role, sub}`, refresh `{type:'refresh', sub}`; secretos `JWT_SECRET` y `JWT_REFRESH_SECRET` separados.  
**Alternativas:** Solo access token largo, o refresh rotativo, o cookies httpOnly.  
**Por quГ©:** Access corto limita ventana de robo; refresh largo evita login frecuente; secretos separados = compromise de uno no invalida el otro; stateless (sin BD para validar access).  
**Consecuencias:** Middleware valida `type === 'access'`; refresh endpoint relee usuario por `sub` (para cambios de role); no hay rotaciГіn de refresh (simplicidad); interceptor frontend maneja 401 в†’ refresh в†’ retry.

---

## 6. ValidaciГіn compartida con Zod en `shared/`

**Fecha:** 2026-10-01  
**DecisiГіn:** Schemas Zod en `shared/schemas.ts` importados tanto por server (validaciГіn request) como client (React Hook Form).  
**Alternativas:** Duplicar schemas, o usar `zod-to-json-schema` + AJV.  
**Por quГ©:** Single source of truth; types inferidos automГЎticamente (`z.infer<typeof schema>`); cero duplicaciГіn.  
**Consecuencias:** `shared/` no tiene `package.json` (es solo TS); imports con `../../shared/schemas` desde server/client; `tsconfig` incluye `shared/**/*`.

---

## 7. InternacionalizaciГіn: `Accept-Language` en API + `react-i18next` en frontend

**Fecha:** 2026-10-02  
**DecisiГіn:** API lee `Accept-Language` header (fallback `es`); devuelve campos localizados (`name_es`, `name_ru`, `name_en` в†’ `name` segГєn header). Frontend usa `react-i18next` con JSON por idioma, persistido en `localStorage`.  
**Alternativas:** Query param `?lang=`, o subdominios, o path `/es/menu`.  
**Por quГ©:** Header es estГЎndar HTTP, no ensucia URLs, funciona con fetch nativo; frontend persiste preferencia usuario.  
**Consecuencias:** Seed inserta 3 columnas por campo traducible; `dishes` y `categories` usan patrГіn `_es|_ru|_en`; orders guardan `language` snapshot.

---

## 8. ImГЎgenes: almacenamiento en disco + `PUBLIC_ORIGIN`

**Fecha:** 2026-10-03  
**DecisiГіn:** Subida `multipart/form-data` в†’ disco en `UPLOADS_DIR` (fuera del repo, ej. `/var/www/osito/uploads/`), nombre UUID + extensiГіn original, ruta relativa guardada en `dishes.image_url`. API devuelve URL absoluta construyendo con `PUBLIC_ORIGIN` (ej. `https://api.osito.local/uploads/uuid.webp`). Nginx sirve `/uploads/` como alias estГЎtico.  
**Alternativas:** Base64 en BD, S3/Cloudinary, servir desde Express.  
**Por quГ©:** Disco local barato en VPS; Nginx sirviendo estГЎticos es mГЎs rГЎpido que Node; UUID evita colisiones y enumeraГ§ГЈo; `PUBLIC_ORIGIN` desacopla dominio de cГіdigo.  
**Consecuencias:** `UPLOADS_DIR` debe existir y tener permisos; Nginx config pendiente (T-095); max 5MB, solo `image/*`.

---

## 9. Estado global frontend: Zustand (auth + cart)

**Fecha:** 2026-10-03  
**DecisiГіn:** Dos stores separados: `useAuthStore` (user, accessToken, refreshToken, `isAuthenticated` derivado) y `useCartStore` (items[], selectores derivados `totalItems`, `totalPrice`). Ambos con `persist` en `localStorage`.  
**Alternativas:** Redux Toolkit, Context API, TanStack Query para todo.  
**Por quГ©:** Zustand es mГ­nimo (1kb), API simple, persist middleware nativo; auth y cart son estado cliente puro (no server state). TanStack Query para datos de servidor (dishes, orders).  
**Consecuencias:** No hay hydration mismatch (client-only stores); `isAuthenticated` se recalcula al cargar; cart items guardan copia del plato (snapshot para histГіrico).

---

## 10. API de pedidos: transacciГіn + snapshot de precios

**Fecha:** 2026-10-04  
**DecisiГіn:** `POST /api/orders` usa `db.transaction` para crear `Order` + `OrderItem[]` atГіmicamente. Valida: items sin duplicados, cantidad в‰Ґ1, platos disponibles (`isAvailable`). Total calculado con precios **actuales** de BD, redondeado a cГ©ntimos (Math.round). Guarda `language` del usuario en el pedido.  
**Alternativas:** Calcular total en frontend (confiable), o precios fijos al agregar al carrito.  
**Por quГ©:** Precio en BD es fuente de verdad (evita manipulaciГіn); transacciГіn garantiza consistencia; snapshot en `order_items` hace pedidos inmutables aunque cambie el plato.  
**Consecuencias:** Carrito solo guarda `dishId` + `quantity`; precio se recalcula al confirmar.

---

## 11. Frontend: Vite + React 19 + TanStack Query v5

**Fecha:** 2026-09-28  
**DecisiГіn:** Vite 8, React 19, TanStack Query v5 para server state (dishes, categories, orders, stats).  
**Alternativas:** Next.js, Remix, SWR.  
**Por quГ©:** SPA simple, Vite rГЎpido, TanStack Query maneja cache, invalidation, loading/error states, retries. React 19 trae mejoras de compilador y hooks.  
**Consecuencias:** `QueryClientProvider` en `main.tsx`; hooks `useDishes`, `useCategories`, `useOrders`; invalidation tras mutaciones (`POST /orders` invalida `useOrders`).

---

## 12. UI: Tailwind 4 (CSS-first) + shadcn/ui

**Fecha:** 2026-09-29  
**DecisiГіn:** Tailwind 4 con `@import "tailwindcss"` en CSS (no config JS), tokens CSS en `:root` (`index.css`); shadcn/ui para componentes base (button, card, input, label) copiados al proyecto.  
**Alternativas:** Tailwind 3 + config JS, DaisyUI, MUI, Radix sin shadcn.  
**Por quГ©:** Tailwind 4 es mГЎs simple (CSS-native), sin config file; shadcn/ui da componentes accesibles, personalizables, sin dependencia runtime (solo cГіdigo copiado).  
**Consecuencias:** Temas via CSS variables (`--color-primary`, etc.); `cn()` utility para classNames condicionales; dark mode via clase `.dark` en `html`.

---

## 13. Variables de entorno: Zod + `process.loadEnvFile()`

**Fecha:** 2026-09-29  
**DecisiГіn:** Schema Zod en `server/src/config/env.ts`; al importar, valida `process.env` y lanza error descriptivo si falta algo. Node 22+ `process.loadEnvFile('.env')` en entry point (`server/src/index.ts`) antes de importar config.  
**Alternativas:** `dotenv` package, `envalid`, `zod-env`.  
**Por quГ©:** Zero deps extra (Node 22+ nativo); Zod ya estГЎ en proyecto; fail-fast claro al arrancar.  
**Variables:** `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_PATH`, `PUBLIC_ORIGIN`, `UPLOADS_DIR`, `MAILGUN_*`, `TELEGRAM_*`.

---

## 14. Logging: pino JSON estructurado

**Fecha:** 2026-09-28  
**DecisiГіn:** `pino` con `pino-pretty` en dev, JSON en prod. Nivel por `LOG_LEVEL` (default `info`).  
**Alternativas:** Winston, console.log, Bunyan.  
**Por quГ©:** pino es el mГЎs rГЎpido, JSON nativo, child loggers para contexto (`req.log`), integra con Loki/Datadog.  
**Consecuencias:** Logger en `server/src/utils/logger.ts`; middleware Express adjunta `req.log`; requests loggeados con `serializers.req/res`.

---

## 15. Manejo de errores: `AppError` + middleware global

**Fecha:** 2026-10-01  
**DecisiГіn:** Clase `AppError extends Error` con `code` (string), `statusCode`, `details?`. Middleware global `errorHandler` convierte a respuesta JSON `{ error: { code, message, details } }`. CГіdigos estandarizados: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`.  
**Alternativas:** Solo `throw new Error()`, o librerГ­as tipo `http-errors`.  
**Por quГ©:** `code` permite frontend mostrar mensajes localizados por cГіdigo (no por string frГЎgil); status HTTP semГЎntico; details para validaciГіn Zod.  
**Consecuencias:** Todos los `throw` usan `AppError`; Zod errors mapeados a `VALIDATION_ERROR` con `details: z.flattenError().fieldErrors`.

---

## 16. Estructura de mГіdulos server: feature-based

**Fecha:** 2026-09-28  
**DecisiГіn:** `server/src/` organizado por feature:
```
src/
в”њв”Ђв”Ђ config/          # env, db, logger
в”њв”Ђв”Ђ middleware/      # auth, errorHandler, validation
в”њв”Ђв”Ђ modules/
в”‚   в”њв”Ђв”Ђ auth/        # routes, controller, service, schemas
в”‚   в”њв”Ђв”Ђ dishes/      # routes, controller, service, schemas
в”‚   в”њв”Ђв”Ђ categories/  # ...
в”‚   в”њв”Ђв”Ђ orders/      # ...
в”‚   в”њв”Ђв”Ђ uploads/     # ...
в”‚   в””в”Ђв”Ђ notifications/  # (futuro)
в”њв”Ђв”Ђ utils/           # AppError, helpers
в””в”Ђв”Ђ index.ts         # entry point
```
**Alternativas:** Layered (controllers/, services/, routes/), o flat.  
**Por quГ©:** Colocaliza lo que cambia junto; fГЎcil encontrar todo lo relacionado a "dishes"; escalable a medida que crecen mГіdulos.  
**Consecuencias:** Cada mГіdulo exporta `router`; `index.ts` monta todos en `/api`.

---

## 17. Shared types: `shared/types.ts` + schemas

**Fecha:** 2026-10-01  
**DecisiГіn:** `shared/types.ts` para tipos TypeScript puros (interfaces de respuesta API, enums); `shared/schemas.ts` para Zod schemas que inferen tipos.  
**Por quГ©:** SeparaciГіn clara: types para contratos de API, schemas para validaciГіn; ambos importables sin ciclos.  
**Consecuencias:** Frontend importa `import type { Dish, Order } from '../../../shared/types'`.

---

## 18. Scripts de BD: migraciГіn + seed + seed:admin separados

**Fecha:** 2026-09-29  
**DecisiГіn:** `db:migrate` (drizzle-kit migrate), `db:seed` (platos + categorГ­as), `db:seed:admin` (usuario admin).  
**Por quГ©:** SeparaciГіn de responsabilidades; `seed:admin` ejecutable independientemente en VPS sin re-seedear platos.  
**Consecuencias:** `db:seed` es idempotente (upsert por slug/nombre); `db:seed:admin` usa `bcrypt.hash` con 12 rounds.

---

## 19. Decisiones pendientes (abiertas)

| Tema | Tarea asociada | Estado |
|------|----------------|--------|
| Polling vs SSE para panel chef | T-081 | Pendiente |
| Backoff y mГЎx reintentos notificaciones | T-065 | Pendiente |
| Rate limiting endpoints pГєblicos | T-092 | Pendiente |
| Estrategia de backup (solo DB vs full) | T-096 | Pendiente |

---

> **Regla:** Cada decisiГіn nueva se agrega aquГ­ con fecha, contexto, alternativas y consecuencias. Si se revierte, agregar entrada nueva explicando el cambio (no borrar la original).

## 20. AclaraciГіn T-083: estados vГЎlidos de pedidos

**Fecha:** 2026-10-10
**Contexto:** La lista de estados de pedidos descrita en la decisiГіn #4 es anterior a la implementaciГіn de T-082 y no menciona `cancelled`.
**AclaraciГіn:** Se mantiene la definiciГіn vigente en `SPEC.md` y el endpoint de T-082: `pending`, `preparing`, `sent`, `delivered` y `cancelled`. `pending в†’ preparing | cancelled`, `preparing в†’ sent | cancelled`, `sent в†’ delivered | cancelled`; `delivered` y `cancelled` son finales.
**Consecuencias:** T-083 muestra Гєnicamente las transiciones permitidas por el backend; no introduce ni modifica reglas de negocio.
## 21. Portada informativa + tema persistente claro/oscuro

**Fecha:** 2026-10-12  
**Contexto:** La app necesitaba una versión realista de la portada y un selector de tema manual con persistencia, sin depender de add-ons ni cambiar la estrategia de Tailwind 4 ya elegida.  
**Decisión:** La portada usa una estructura editorial con hero, platos destacados, historia del negocio, pasos de pedido y datos provisionales de servicio; el tema oscuro/claro se activa manualmente y se almacena en `localStorage`, aplicándose mediante la clase `.dark` en `html` y los mismo tokens CSS del sistema.  
**Alternativas:** Dejar la home como placeholder, seguir solo el sistema operativo, o añadir una librería de UI extra para el tema.  
**Consecuencias:** La interfaz queda navegable en ambos modos, con preferencia persistida y sin cambiar el stack ni añadir dependencias nuevas. Requiere mantener los textos visibles en es/ru/en y conservar los contenidos de negocio en un estado provisional hasta confirmar datos reales.
