# Estado actual del proyecto — Snapshot técnico

> Fuente de verdad del avance: `docs/TASKLIST.md`. Última actualización: 2026-10-08.

---

## Árbol de carpetas (resumen)

```
osito_a_la_carta/
├── server/
│   ├── package.json          # type: module, scripts dev/build/start/typecheck/db:*
│   ├── tsconfig.json         # strict + NodeNext + flags extra
│   ├── drizzle.config.ts     # sqlite, ./osito.db, migrations out
│   ├── .env                  # (no versionado, en raíz del proyecto)
│   └── src/
│       ├── app.ts            # Express + routers bajo /api + listen
│       ├── logger.ts         # pino: pretty en dev, JSON en prod
│       ├── config/
│       │   ├── index.ts      # barrel reexporta env
│       │   └── env.ts        # validación Zod + process.exit(1) si falta
│       ├── shared/
│       │   ├── errors.ts     # AppError + subclases (400/401/403/404/409)
│       │   ├── error.middleware.ts  # traduce AppError/ZodError/SyntaxError a {error,code}
│       │   ├── http.ts       # readAcceptLanguage, idParamSchema
│       │   ├── language.ts   # resolveLanguage, LANGUAGES, DEFAULT_LANGUAGE, type Language
│       │   └── project-paths.ts  # busca .env y package.json subiendo en el árbol
│       ├── db/
│       │   ├── client.ts     # drizzle + better-sqlite3 (WAL, FKs ON)
│       │   ├── schema.ts     # 6 tablas: users, dishes, categories, orders, order_items, page_views, notification_logs
│       │   ├── database-url.ts   # resuelve DATABASE_URL para drizzle-kit
│       │   └── seed/
│       │       ├── dishes.ts     # seed 5 platos 3 idiomas (idempotente)
│       │       └── admin.ts      # seed 1 admin (bcryptjs, upsert)
│       └── modules/
│           ├── health/       # GET /api/health
│           ├── dishes/       # CRUD platos + availability + permanent delete + image upload
│           ├── categories/   # CRUD categorías (público lectura, admin escritura)
│           ├── auth/         # register, login, refresh, requireAuth, requireAdmin
│           ├── orders/       # POST, GET (lista), GET :id (detalle)
│           └── notifications/  # email.service.ts, telegram.service.ts, templates/order-email.ts, test-email.ts, test-telegram.ts (T-060, T-061, T-062)
├── client/
│   ├── package.json          # dev/build/preview/typecheck, React 19
│   ├── tsconfig.json         # project references → app + node
│   ├── tsconfig.app.json     # strict + flags, jsx: react-jsx
│   ├── tsconfig.node.json    # strict, cubre vite.config.ts
│   ├── vite.config.ts        # @vitejs/plugin-react + @tailwindcss/vite + proxy /api → :3000
│   ├── index.html
│   ├── components.json       # shadcn/ui config (en client/, no en raíz)
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css         # @import 'tailwindcss' + @theme inline (tokens)
│       ├── lib/
│       │   ├── i18n.ts       # i18next init + detector (localStorage > navigator)
│       │   ├── cn.ts         # clsx + tailwind-merge
│       │   └── format.ts     # formatPrice
│       ├── hooks/
│       │   └── useIsAuthenticated.ts  # selector derivado del store auth
│       ├── store/
│       │   ├── auth.ts       # Zustand + persist (user, accessToken, refreshToken)
│       │   └── cart.ts       # Zustand + persist (items con copia del plato)
│       ├── api/
│       │   ├── http.ts       # ApiError, requestJson (base sin auth)
│       │   ├── client.ts     # apiRequest (único fetch: auth + refresh + Accept-Language)
│       │   ├── auth.ts       # registerUser, loginUser
│       │   ├── dishes.ts     # fetchDishes, fetchDishById
│       │   └── orders.ts     # createOrder, fetchOrders, fetchOrderById
│       ├── components/
│       │   ├── ui/           # button, card, input, label (shadcn)
│       │   ├── DishCard.tsx
│       │   ├── LanguageSwitcher.tsx
│       │   └── Layout.tsx    # navbar con logo, enlaces, selector idioma, carrito, órdenes
│       ├── pages/
│       │   ├── Menu.tsx      # /menu - lista platos agrupados por categoría
│       │   ├── DishDetail.tsx  # /menu/:id - detalle + add to cart
│       │   ├── Cart.tsx      # /cart - resumen + confirmar pedido
│       │   ├── Orders.tsx    # /orders - historial
│       │   ├── OrderDetail.tsx # /orders/:id - detalle pedido
│       │   ├── Login.tsx     # /login
│       │   └── Register.tsx  # /register
│       └── locales/
│           ├── es.json, ru.json, en.json  # i18n keys (nav, menu, cart, orders, auth, etc.)
├── shared/
│   ├── types.ts              # (vacío, reservado)
│   └── schemas.ts            # fábricas createRegisterBodySchema(mensajes), createLoginBodySchema(mensajes)
├── docs/
│   ├── SPEC.md               # Especificación del producto
│   ├── AGENTE.md             # Reglas del agente (NO AGENTE.md)
│   ├── TASKLIST.md           # Lista de verificación de tareas
│   ├── MEMORY.md             # Este índice
│   ├── memory/               # Carpeta de temas (este archivo está en topics/)
│   ├── PROMPTS.md            # Prompts originales por tarea
│   └── .prettierignore       # excluye docs/, memory/, *.db, .kilo/
├── .prettierrc.json          # 2 espacios, single quotes, semi, printWidth 80, trailingComma all, endOfLine lf
├── .prettierignore           # excluye docs/, README.md, .kilo/
├── package.json              # raíz: workspaces ["server","client"], scripts agregadores
├── package-lock.json
├── .env.example              # plantilla con placeholders
└── .gitignore                # *.db, *.db-wal, *.db-shm, node_modules, dist, .env, .kilo/
```

---

## Comandos que funcionan hoy

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Levanta server (:3000) y client (:5173) intercalados (dos terminales recomendadas) |
| `npm run dev:server` | Solo server con `tsx watch src/app.ts` |
| `npm run dev:client` | Solo client con `vite` |
| `npm run typecheck` | `tsc --noEmit` (server) + `tsc -b --noEmit` (client) |
| `npm run lint` | ESLint 10 flat config en ambos workspaces |
| `npm run lint:fix` | ESLint --fix |
| `npm run format` | Prettier --write (desde raíz) |
| `npm run format:check` | Prettier --check (desde raíz) |
| `npm run build` | Compila client (Vite) + server (tsc) |
| `cd server && npm run db:generate` | `drizzle-kit generate` (migraciones) |
| `cd server && npm run db:migrate` | `drizzle-kit migrate` (aplica migraciones) |
| `cd server && npm run db:seed` | Seed 5 platos 3 idiomas |
| `cd server && npm run db:seed:admin` | Seed 1 admin (bcryptjs) |
| `cd server && npm run test:email` | Envía correo de prueba al chef (T-060) |
| `cd server && npm run test:telegram` | Envía mensaje de prueba por Telegram al chef (T-061) |
| `cd server && npm start` | Ejecuta `dist/server/src/app.js` (compilado) |

---

## Versiones instaladas (verificadas)

- Node: 22.x (LTS) — `engines.node` en raíz: `^20.19.0 || ^22.13.0 || >=24`
- React: 19.3.0 — React DOM 19.3.0
- Vite: 8.3.1 — @vitejs/plugin-react 6.1.1
- TypeScript: 5.9.3 (única versión hoisteada en monorepo)
- Express: 5.2.1
- Drizzle ORM: 0.45.3 — drizzle-kit 0.31.x — better-sqlite3 11.x
- Pino: 9.14.0 — pino-pretty 13.x (devDependency)
- Zod: 3.25.76
- Tailwind: 4.3.3 — @tailwindcss/vite 4.3.3
- shadcn/ui: button, card, input, label (registrados en components.json)
- TanStack Query: 5.x (configurado, usado en pages)
- Zustand: 5.0.15
- react-i18next: 15.x — i18next 25.x — i18next-browser-languagedetector 8.x
- jsonwebtoken: 9.x — @types/jsonwebtoken (dev)
- bcryptjs: 3.0.3 — @types/bcryptjs (dev)
- mailgun.js: 14.x — form-data: 4.x — @types/form-data (dev)
- node-telegram-bot-api: 2.x — @types/node-telegram-bot-api (dev)
- @types/node: 22.20.4

---

## Variables de entorno (validadas en `server/src/config/env.ts`)

| Variable | Tipo | Requerida | Default | Notas |
|----------|------|-----------|---------|-------|
| `NODE_ENV` | enum | sí | `development` | `development` \| `production` \| `test` |
| `PORT` | number | sí | 3000 | `z.coerce.number().int().positive()` |
| `LOG_LEVEL` | enum | sí | `info` | 7 niveles pino |
| `DATABASE_URL` | string | sí | `./osito.db` | relativo a `server/` |
| `JWT_SECRET` | string | sí | — | ≥32 chars, rechaza placeholders en prod |
| `JWT_REFRESH_SECRET` | string | sí | — | ≥32 chars, distinto de JWT_SECRET |
| `MAILGUN_API_KEY` | string | sí | — | rechaza placeholders en prod |
| `MAILGUN_DOMAIN` | string | sí | — | rechaza placeholders en prod |
| `MAILGUN_FROM` | string | sí | — | acepta `Nombre <email>` o `email`; exporta `{raw,email}` |
| `CHEF_EMAIL` | string | sí | — | destinatario notificaciones |
| `TELEGRAM_BOT_TOKEN` | string | sí | — | rechaza placeholders en prod |
| `TELEGRAM_CHAT_ID` | string | sí | — | rechaza placeholders en prod |
| `PUBLIC_ORIGIN` | string | sí | — | base URL para URLs absolutas de imágenes |
| `UPLOADS_DIR` | string | sí | `./uploads` | en VPS: `/var/www/osito/uploads` |

**Derivados:** `MAILGUN_FROM_EMAIL`, `isProduction` (boolean).

---

## Endpoints activos (resumen)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | público | Health check |
| GET | `/api/dishes` | público | Lista platos disponibles + categoría localizada |
| GET | `/api/dishes/:id` | público | Detalle plato |
| POST | `/api/dishes` | admin | Crear plato |
| PUT | `/api/dishes/:id` | admin | Actualizar plato (no `isAvailable`) |
| DELETE | `/api/dishes/:id` | admin | Borrado lógico (`isAvailable=0`) |
| PATCH | `/api/dishes/:id/availability` | admin | Habilita/deshabilita (`isAvailable`) |
| DELETE | `/api/dishes/:id/permanent` | admin | Purga física (409 si disponible o con historial) |
| POST | `/api/dishes/:id/image` | admin | Sube imagen → `dishes.image_url` (relativa) |
| GET | `/api/categories` | público | Lista categorías localizadas + slug + sortOrder |
| POST | `/api/categories` | admin | Crear categoría (409 slug duplicado) |
| PUT | `/api/categories/:id` | admin | Renombrar 3 idiomas + sortOrder |
| DELETE | `/api/categories/:id` | admin | 409 si tiene platos (incluye deshabilitados) |
| POST | `/api/auth/register` | público | Crea usuario (role=customer), 409 email duplicado |
| POST | `/api/auth/login` | público | Devuelve access (15min) + refresh (7d) tokens |
| POST | `/api/auth/refresh` | público | Renueva access con refresh válido |
| POST | `/api/orders` | user | Crea pedido + items (transacción) |
| GET | `/api/orders` | user | Historial del usuario autenticado |
| GET | `/api/orders/:id` | user | Detalle de un pedido propio |
| GET | `/api/stats/pageview` | — | (pendiente T-070) |
| GET | `/api/stats/me` | — | (pendiente T-071) |
| GET | `/api/admin/orders` | — | (pendiente T-080) |
| PATCH | `/api/admin/orders/:id/status` | — | (pendiente T-082) |

---

## Base de datos (SQLite + Drizzle)

**Tablas:**
- `users`: id, email (unique), passwordHash, role (customer/admin), preferredLang, createdAt
- `categories`: id, slug (unique), nameEs, nameRu, nameEn, sortOrder
- `dishes`: id, categoryId (FK), imageUrl, price, nameEs/Ru/En, descriptionEs/Ru/En, ingredientsEs/Ru/En, isAvailable (default 1), createdAt
- `orders`: id, userId (FK), status (pending/preparing/sent/delivered), totalCents, note, createdAt
- `order_items`: id, orderId (FK), dishId (FK), quantity, unitPriceCents
- `page_views`: id, userId (FK, nullable), dishId (FK), createdAt
- `notification_logs`: id, orderId (FK), channel (email/telegram), status (sent/failed), attempts, error, createdAt

**Índices:** `users.email` (unique), `categories.slug` (unique), `dishes.category_id`, FKs en order_items, page_views, notification_logs.

**Modo:** WAL (`journal_mode=WAL`), `foreign_keys=ON`.

---

## Frontend — Rutas y estado

| Ruta | Página | Auth | Descripción |
|------|--------|------|-------------|
| `/` | (redirige a `/menu`) | — | — |
| `/menu` | Menu.tsx | público | Platos agrupados por categoría |
| `/menu/:id` | DishDetail.tsx | público | Detalle + botón agregar al carrito |
| `/cart` | Cart.tsx | user | Resumen + nota + confirmar → `/orders/:id` |
| `/orders` | Orders.tsx | user | Historial pedidos propios |
| `/orders/:id` | OrderDetail.tsx | user | Detalle pedido |
| `/login` | Login.tsx | público | Login + auto-redirect a `/menu` |
| `/register` | Register.tsx | público | Registro + auto-login → `/menu` |
| `/admin/orders` | — | admin | (pendiente T-081) |
| `/stats` | — | user | (pendiente T-072) |

**Estado global (Zustand):**
- `auth`: `{ user, accessToken, refreshToken }` persistido en `localStorage` (clave `osito-auth`), `isAuthenticated` selector derivado.
- `cart`: `{ items: [{ dishId, name, price, quantity, imageUrl }] }` persistido, totales selectores derivados.

**i18n:** `react-i18next` + detector `localStorage` > `navigator`. 3 idiomas (es, ru, en). Claves en `client/src/locales/`.

---

## Pendientes de infraestructura (Fase 9)

- T-090: PWA (`vite-plugin-pwa`)
- T-091: Responsive completo (360px+)
- T-092: ErrorBoundary + toasts (shadcn toast + dropdown-menu)
- T-093: Tests (vitest server + client)
- T-094: PM2 en VPS (`NODE_ENV=production` obligatorio para pino)
- T-095: Nginx proxy + Let's Encrypt + `location /uploads/ { alias /var/www/osito/uploads/; }`
- T-096: Backup diario `osito.db` + `UPLOADS_DIR`