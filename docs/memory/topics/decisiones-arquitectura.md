# Decisiones de arquitectura

> Última actualización: 2026-10-07

Este documento registra las decisiones técnicas clave con su contexto, alternativas evaluadas y consecuencias. Se actualiza al tomar decisiones relevantes.

---

## 1. Monorepo con npm workspaces

**Fecha:** 2026-09-28  
**Decisión:** Usar un monorepo con 3 workspaces: `server/`, `client/`, `shared/`.  
**Alternativas:** Repos separados, o monorepo con Turborepo/Nx.  
**Por qué:** Simplicidad (npm nativo), shared types/Zod schemas sin duplicación, un solo `package.json` raíz para scripts globales.  
**Consecuencias:** `npm install` en raíz instala todo; scripts con `--workspace` o `npm run dev` (concurrently) desde raíz.

---

## 2. TypeScript estricto + ESM en server

**Fecha:** 2026-09-28  
**Decisión:** `"type": "module"`, `"strict": true`, `"moduleResolution": "bundler"`, target ES2022.  
**Alternativas:** CommonJS, o TS menos estricto.  
**Por qué:** ESM es el estándar moderno; strict evita bugs sutiles; bundler resolution funciona con imports relativos y `shared/`.  
**Consecuencias:** Imports con extensión `.js` en runtime; `tsx` para dev; `tsc --noEmit` para typecheck.

---

## 3. Drizzle ORM + SQLite (WAL mode)

**Fecha:** 2026-09-29  
**Decisión:** Drizzle como ORM type-safe, SQLite en archivo `osito.db` con WAL (`PRAGMA journal_mode=WAL`).  
**Alternativas:** Prisma, TypeORM, PostgreSQL.  
**Por qué:** Drizzle es ligero, type-safe sin magic, SQL-like; SQLite embebido = cero infra en dev/VPS pequeño; WAL permite lecturas concurrentes sin bloquear escrituras.  
**Consecuencias:** Migraciones con `drizzle-kit`; `db:seed` para datos iniciales; índices declarados en schema; no hay connection pooling (archivo único).

---

## 4. Esquema de BD: 6 entidades principales

**Fecha:** 2026-09-29  
**Entidades:** `users`, `categories`, `dishes`, `orders`, `order_items`, `notification_logs` (+ `page_views` para stats).  
**Decisiones clave:**
- `dishes`: borrado lógico (`isAvailable` boolean), no `deleted_at`; imagen opcional en `image_url` (ruta relativa).
- `categories`: `slug` único para URLs limpias; `sortOrder` para orden manual.
- `orders`: `status` enum (`pending|preparing|sent|delivered`), `total` en céntimos (integer), `language` snapshot al crear.
- `order_items`: snapshot de `name`, `description`, `price` en idioma del pedido (no FK a dishes para histórico inmutable).
- `users`: `role` enum (`customer|admin`), `preferredLang`, `passwordHash` (bcrypt, 12 rounds).

---

## 5. Autenticación: JWT access + refresh con secretos distintos

**Fecha:** 2026-10-01  
**Decisión:** Access token 15 min, refresh 7 días; claims distintos: access `{type:'access', email, role, sub}`, refresh `{type:'refresh', sub}`; secretos `JWT_SECRET` y `JWT_REFRESH_SECRET` separados.  
**Alternativas:** Solo access token largo, o refresh rotativo, o cookies httpOnly.  
**Por qué:** Access corto limita ventana de robo; refresh largo evita login frecuente; secretos separados = compromise de uno no invalida el otro; stateless (sin BD para validar access).  
**Consecuencias:** Middleware valida `type === 'access'`; refresh endpoint relee usuario por `sub` (para cambios de role); no hay rotación de refresh (simplicidad); interceptor frontend maneja 401 → refresh → retry.

---

## 6. Validación compartida con Zod en `shared/`

**Fecha:** 2026-10-01  
**Decisión:** Schemas Zod en `shared/schemas.ts` importados tanto por server (validación request) como client (React Hook Form).  
**Alternativas:** Duplicar schemas, o usar `zod-to-json-schema` + AJV.  
**Por qué:** Single source of truth; types inferidos automáticamente (`z.infer<typeof schema>`); cero duplicación.  
**Consecuencias:** `shared/` no tiene `package.json` (es solo TS); imports con `../../shared/schemas` desde server/client; `tsconfig` incluye `shared/**/*`.

---

## 7. Internacionalización: `Accept-Language` en API + `react-i18next` en frontend

**Fecha:** 2026-10-02  
**Decisión:** API lee `Accept-Language` header (fallback `es`); devuelve campos localizados (`name_es`, `name_ru`, `name_en` → `name` según header). Frontend usa `react-i18next` con JSON por idioma, persistido en `localStorage`.  
**Alternativas:** Query param `?lang=`, o subdominios, o path `/es/menu`.  
**Por qué:** Header es estándar HTTP, no ensucia URLs, funciona con fetch nativo; frontend persiste preferencia usuario.  
**Consecuencias:** Seed inserta 3 columnas por campo traducible; `dishes` y `categories` usan patrón `_es|_ru|_en`; orders guardan `language` snapshot.

---

## 8. Imágenes: almacenamiento en disco + `PUBLIC_ORIGIN`

**Fecha:** 2026-10-03  
**Decisión:** Subida `multipart/form-data` → disco en `UPLOADS_DIR` (fuera del repo, ej. `/var/www/osito/uploads/`), nombre UUID + extensión original, ruta relativa guardada en `dishes.image_url`. API devuelve URL absoluta construyendo con `PUBLIC_ORIGIN` (ej. `https://api.osito.local/uploads/uuid.webp`). Nginx sirve `/uploads/` como alias estático.  
**Alternativas:** Base64 en BD, S3/Cloudinary, servir desde Express.  
**Por qué:** Disco local barato en VPS; Nginx sirviendo estáticos es más rápido que Node; UUID evita colisiones y enumeração; `PUBLIC_ORIGIN` desacopla dominio de código.  
**Consecuencias:** `UPLOADS_DIR` debe existir y tener permisos; Nginx config pendiente (T-095); max 5MB, solo `image/*`.

---

## 9. Estado global frontend: Zustand (auth + cart)

**Fecha:** 2026-10-03  
**Decisión:** Dos stores separados: `useAuthStore` (user, accessToken, refreshToken, `isAuthenticated` derivado) y `useCartStore` (items[], selectores derivados `totalItems`, `totalPrice`). Ambos con `persist` en `localStorage`.  
**Alternativas:** Redux Toolkit, Context API, TanStack Query para todo.  
**Por qué:** Zustand es mínimo (1kb), API simple, persist middleware nativo; auth y cart son estado cliente puro (no server state). TanStack Query para datos de servidor (dishes, orders).  
**Consecuencias:** No hay hydration mismatch (client-only stores); `isAuthenticated` se recalcula al cargar; cart items guardan copia del plato (snapshot para histórico).

---

## 10. API de pedidos: transacción + snapshot de precios

**Fecha:** 2026-10-04  
**Decisión:** `POST /api/orders` usa `db.transaction` para crear `Order` + `OrderItem[]` atómicamente. Valida: items sin duplicados, cantidad ≥1, platos disponibles (`isAvailable`). Total calculado con precios **actuales** de BD, redondeado a céntimos (Math.round). Guarda `language` del usuario en el pedido.  
**Alternativas:** Calcular total en frontend (confiable), o precios fijos al agregar al carrito.  
**Por qué:** Precio en BD es fuente de verdad (evita manipulación); transacción garantiza consistencia; snapshot en `order_items` hace pedidos inmutables aunque cambie el plato.  
**Consecuencias:** Carrito solo guarda `dishId` + `quantity`; precio se recalcula al confirmar.

---

## 11. Frontend: Vite + React 19 + TanStack Query v5

**Fecha:** 2026-09-28  
**Decisión:** Vite 8, React 19, TanStack Query v5 para server state (dishes, categories, orders, stats).  
**Alternativas:** Next.js, Remix, SWR.  
**Por qué:** SPA simple, Vite rápido, TanStack Query maneja cache, invalidation, loading/error states, retries. React 19 trae mejoras de compilador y hooks.  
**Consecuencias:** `QueryClientProvider` en `main.tsx`; hooks `useDishes`, `useCategories`, `useOrders`; invalidation tras mutaciones (`POST /orders` invalida `useOrders`).

---

## 12. UI: Tailwind 4 (CSS-first) + shadcn/ui

**Fecha:** 2026-09-29  
**Decisión:** Tailwind 4 con `@import "tailwindcss"` en CSS (no config JS), tokens CSS en `:root` (`index.css`); shadcn/ui para componentes base (button, card, input, label) copiados al proyecto.  
**Alternativas:** Tailwind 3 + config JS, DaisyUI, MUI, Radix sin shadcn.  
**Por qué:** Tailwind 4 es más simple (CSS-native), sin config file; shadcn/ui da componentes accesibles, personalizables, sin dependencia runtime (solo código copiado).  
**Consecuencias:** Temas via CSS variables (`--color-primary`, etc.); `cn()` utility para classNames condicionales; dark mode via clase `.dark` en `html`.

---

## 13. Variables de entorno: Zod + `process.loadEnvFile()`

**Fecha:** 2026-09-29  
**Decisión:** Schema Zod en `server/src/config/env.ts`; al importar, valida `process.env` y lanza error descriptivo si falta algo. Node 22+ `process.loadEnvFile('.env')` en entry point (`server/src/index.ts`) antes de importar config.  
**Alternativas:** `dotenv` package, `envalid`, `zod-env`.  
**Por qué:** Zero deps extra (Node 22+ nativo); Zod ya está en proyecto; fail-fast claro al arrancar.  
**Variables:** `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_PATH`, `PUBLIC_ORIGIN`, `UPLOADS_DIR`, `MAILGUN_*`, `TELEGRAM_*`.

---

## 14. Logging: pino JSON estructurado

**Fecha:** 2026-09-28  
**Decisión:** `pino` con `pino-pretty` en dev, JSON en prod. Nivel por `LOG_LEVEL` (default `info`).  
**Alternativas:** Winston, console.log, Bunyan.  
**Por qué:** pino es el más rápido, JSON nativo, child loggers para contexto (`req.log`), integra con Loki/Datadog.  
**Consecuencias:** Logger en `server/src/utils/logger.ts`; middleware Express adjunta `req.log`; requests loggeados con `serializers.req/res`.

---

## 15. Manejo de errores: `AppError` + middleware global

**Fecha:** 2026-10-01  
**Decisión:** Clase `AppError extends Error` con `code` (string), `statusCode`, `details?`. Middleware global `errorHandler` convierte a respuesta JSON `{ error: { code, message, details } }`. Códigos estandarizados: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`.  
**Alternativas:** Solo `throw new Error()`, o librerías tipo `http-errors`.  
**Por qué:** `code` permite frontend mostrar mensajes localizados por código (no por string frágil); status HTTP semántico; details para validación Zod.  
**Consecuencias:** Todos los `throw` usan `AppError`; Zod errors mapeados a `VALIDATION_ERROR` con `details: z.flattenError().fieldErrors`.

---

## 16. Estructura de módulos server: feature-based

**Fecha:** 2026-09-28  
**Decisión:** `server/src/` organizado por feature:
```
src/
├── config/          # env, db, logger
├── middleware/      # auth, errorHandler, validation
├── modules/
│   ├── auth/        # routes, controller, service, schemas
│   ├── dishes/      # routes, controller, service, schemas
│   ├── categories/  # ...
│   ├── orders/      # ...
│   ├── uploads/     # ...
│   └── notifications/  # (futuro)
├── utils/           # AppError, helpers
└── index.ts         # entry point
```
**Alternativas:** Layered (controllers/, services/, routes/), o flat.  
**Por qué:** Colocaliza lo que cambia junto; fácil encontrar todo lo relacionado a "dishes"; escalable a medida que crecen módulos.  
**Consecuencias:** Cada módulo exporta `router`; `index.ts` monta todos en `/api`.

---

## 17. Shared types: `shared/types.ts` + schemas

**Fecha:** 2026-10-01  
**Decisión:** `shared/types.ts` para tipos TypeScript puros (interfaces de respuesta API, enums); `shared/schemas.ts` para Zod schemas que inferen tipos.  
**Por qué:** Separación clara: types para contratos de API, schemas para validación; ambos importables sin ciclos.  
**Consecuencias:** Frontend importa `import type { Dish, Order } from '../../../shared/types'`.

---

## 18. Scripts de BD: migración + seed + seed:admin separados

**Fecha:** 2026-09-29  
**Decisión:** `db:migrate` (drizzle-kit migrate), `db:seed` (platos + categorías), `db:seed:admin` (usuario admin).  
**Por qué:** Separación de responsabilidades; `seed:admin` ejecutable independientemente en VPS sin re-seedear platos.  
**Consecuencias:** `db:seed` es idempotente (upsert por slug/nombre); `db:seed:admin` usa `bcrypt.hash` con 12 rounds.

---

## 19. Decisiones pendientes (abiertas)

| Tema | Tarea asociada | Estado |
|------|----------------|--------|
| Polling vs SSE para panel chef | T-081 | Pendiente |
| Backoff y máx reintentos notificaciones | T-065 | Pendiente |
| Rate limiting endpoints públicos | T-092 | Pendiente |
| Estrategia de backup (solo DB vs full) | T-096 | Pendiente |

---

> **Regla:** Cada decisión nueva se agrega aquí con fecha, contexto, alternativas y consecuencias. Si se revierte, agregar entrada nueva explicando el cambio (no borrar la original).