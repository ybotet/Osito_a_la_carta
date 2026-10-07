# Convenciones del proyecto

> Última actualización: 2026-10-07

Este documento define estándares de código, naming, estructura y proceso. Se actualiza al establecer nuevas convenciones.

---

## 1. Código TypeScript

| Regla | Detalle |
|-------|---------|
| **Strict mode** | Siempre `strict: true` en `tsconfig.json`. |
| **ESM** | `"type": "module"` en `server/package.json`; imports con extensión `.js` en runtime. |
| **Naming** | `camelCase` variables/funciones; `PascalCase` tipos/interfaces/componentes; `UPPER_SNAKE` constantes; `kebab-case` archivos (excepto `index.ts`, `index.css`). |
| **Imports** | 1) Externos 2) Internos absolutos (`@/...` si config, si no relativos) 3) Tipos con `import type`. |
| **Tipado** | Evitar `any`; usar `unknown` + type guards; inferir de Zod con `z.infer<typeof schema>`. |
| **Async/await** | Preferir sobre `.then()`; `try/catch` con `AppError` en server. |
| **Nullish coalescing** | Usar `??` para defaults, no `||` (evita bug con `0`, `''`, `false`). |

---

## 2. Estructura de módulos (Server)

```
server/src/
├── config/          # Solo configuración (env, db, logger)
├── middleware/      # Middlewares Express puros
├── modules/
│   └── <feature>/   # Una carpeta por feature
│       ├── routes.ts
│       ├── controller.ts
│       ├── service.ts
│       ├── schemas.ts      # Zod schemas específicos del módulo
│       └── index.ts        # Exporta router
├── utils/           # Helpers genéricos (AppError, etc.)
└── index.ts         # Entry point: monta routers
```

- Cada módulo exporta `router` en `index.ts`.
- `schemas.ts` del módulo importa de `shared/schemas.ts` y extiende.
- `service.ts` contiene lógica de negocio pura (sin Express).
- `controller.ts` llama a service y formatea respuesta.

---

## 3. Validación y esquemas

- **Fuente única**: `shared/schemas.ts` para contratos compartidos (auth, dishes, orders, etc.).
- **Server**: Valida en middleware `validate(schema)` antes del controller.
- **Client**: Usa `zodResolver` con React Hook Form.
- **Errores**: Zod errors → `VALIDATION_ERROR` con `details: fieldErrors` (via `AppError`).

---

## 4. Base de datos (Drizzle + SQLite)

| Convención | Detalle |
|------------|---------|
| **Naming tablas** | `snake_case`, plural (`users`, `order_items`). |
| **Columnas** | `snake_case`; PK `id` integer autoincrement; FK `*_id`. |
| **Timestamps** | `created_at` (default now), `updated_at` (trigger o app). |
| **Borrado lógico** | `isAvailable` boolean (no `deleted_at`) para `dishes`; `categories` no se borran si tienen platos. |
| **i18n** | Columnas `_es`, `_ru`, `_en` por campo traducible (ej. `name_es`). |
| **Precios** | Integer en **céntimos** (no float). Redondeo: `Math.round(precio * 100)`. |
| **Migraciones** | `drizzle-kit generate` + `migrate`; nombres descriptivos. |
| **Seed** | Idempotente (upsert por clave única: `slug` categorías, `email` users). |

---

## 5. API y endpoints

| Aspecto | Convención |
|---------|------------|
| **Prefijo** | `/api` para todo. |
| **Versionado** | No versionado en URL (internacional); si cambia, endpoint nuevo + deprecación. |
| **Respuesta éxito** | `{ data }` o directamente el recurso (arrays sin envelope). |
| **Respuesta error** | `{ error: { code, message, details? } }` (AppError). |
| **Códigos error** | `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`. |
| **i18n API** | `Accept-Language` header (fallback `es`); devuelve campos sin sufijo (`name`, no `name_es`). |
| **Paginación** | `?page=1&limit=20` → respuesta `{ data, meta: { page, limit, total } }`. |
| **IDs** | Integer autoincrement (no UUID en BD; UUID solo para nombres de archivo imágenes). |

---

## 6. Autenticación y tokens

| Aspecto | Convención |
|---------|------------|
| **Access token** | 15 min, `type: 'access'`, claims: `email`, `role`, `sub`. |
| **Refresh token** | 7 días, `type: 'refresh'`, claims: `sub`; secreto distinto (`JWT_REFRESH_SECRET`). |
| **Middleware** | `requireAuth` valida `type === 'access'` y `JWT_SECRET`; `requireAdmin` añade `role === 'admin'`. |
| **Refresh endpoint** | Relee usuario por `sub` (para cambios de role); no rota refresh. |
| **Frontend interceptor** | Un solo reintento 401; flag `isRefreshing` evita storm; limpia store si refresh falla. |

---

## 7. Frontend (React + Vite + TanStack Query)

| Aspecto | Convención |
|---------|------------|
| **Estado global** | Zustand solo para estado cliente puro (auth, cart). TanStack Query para server state. |
| **Stores Zustand** | `persist` middleware; selectores derivados (`totalItems`, `isAuthenticated`); no hydrate mismatch (client-only). |
| **Queries** | Hooks dedicados (`useDishes`, `useOrders`); `staleTime: 30_000`; invalidation tras mutaciones. |
| **Mutaciones** | `useMutation` + `onSuccess` invalida queries relacionadas. |
| **Formularios** | React Hook Form + Zod (`zodResolver`); schemas de `shared/`. |
| **i18n** | `react-i18next`; JSON en `client/src/locales/{es,ru,en}.json`; claves planas (`menu.title`); persistido en `localStorage`. |
| **Componentes** | shadcn/ui base (button, card, input, label) copiados a `client/src/components/ui/`; extender ahí. |
| **Estilos** | Tailwind 4 CSS-first (`@import "tailwindcss"` en `index.css`); tokens CSS en `:root`; `cn()` utility. |
| **Routing** | React Router v7; rutas protegidas con `<RequireAuth>` wrapper. |

---

## 8. Imágenes y archivos

- **Subida**: `multipart/form-data` → `POST /api/dishes/:id/image` (solo admin).
- **Storage**: Disco en `UPLOADS_DIR` (fuera del repo, ej. `/var/www/osito/uploads/`).
- **Naming**: UUID v4 + extensión original (`.webp`, `.jpg`, `.png`).
- **BD**: Ruta relativa en `dishes.image_url` (`uploads/uuid.webp`).
- **Entrega**: Nginx sirve `/uploads/` como alias estático; API devuelve URL absoluta con `PUBLIC_ORIGIN`.
- **Validación**: Max 5MB, solo `image/*`; conversión a WebP pendiente (deuda).

---

## 9. Logging y errores

- **Logger**: `pino` (JSON prod, pretty dev); child loggers por request (`req.log`).
- **AppError**: Clase con `code`, `statusCode`, `details?`; throw en services/controllers.
- **Middleware global**: `errorHandler` convierte a JSON estándar; loggea `error` level en server.
- **Frontend**: `ErrorBoundary` + toasts (pendiente T-092).

---

## 10. Variables de entorno

- **Validación**: Zod schema en `server/src/config/env.ts`; fail-fast al importar.
- **Carga**: `process.loadEnvFile('.env')` en `server/src/index.ts` (Node 22+).
- **Naming**: `UPPER_SNAKE_CASE`; prefijos: `JWT_`, `DATABASE_`, `PUBLIC_`, `UPLOADS_`, `MAILGUN_`, `TELEGRAM_`.
- **No commitear**: `.env` en `.gitignore`; `.env.example` documentado.

---

## 11. Git y commits

| Regla | Detalle |
|-------|---------|
| **Branch** | `feature/<tarea-corta>`, `fix/<bug-corto>`, `chore/<algo>`. |
| **Commits** | Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. |
| **Mensaje** | Imperativo, una línea ≤ 72 chars; body opcional con contexto. |
| **Push** | PR a `main`; CI pasa (typecheck, lint, build). |
| **Merge** | Squash and merge; branch borrado. |

---

## 12. Proceso de tareas

1. **Leer** `docs/MEMORY.md` → `docs/memory/topics/estado-actual.md` al iniciar.
2. **Planear** con tool `plan` (pasos claros, verificables).
3. **Implementar** siguiendo convenciones arriba.
4. **Verificar**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.
5. **Actualizar memoria**: 
   - `docs/memory/topics/historial-tareas.md` (entrada cronológica).
   - `docs/memory/topics/decisiones-arquitectura.md` (si decisión nueva).
   - `docs/memory/topics/gotchas-y-problemas-conocidos.md` (si gotcha nuevo).
   - `docs/memory/topics/estado-actual.md` (si cambia stack/comandos/endpoints).
   - `docs/TASKLIST.md` (marcar `[x]`).
6. **Commit** con mensaje convencional.

---

## 13. Gotchas documentados (resumen — ver archivo dedicado)

- SQLite WAL: `PRAGMA journal_mode=WAL` en conexión.
- Drizzle: `db.transaction` requiere callback async; `inferSelectModel` para tipos.
- ESM: imports relativos **con `.js`** en código compilado.
- JWT: claims `type` distinto evita confusion access/refresh.
- Tailwind 4: `@import "tailwindcss"` en CSS, **no** `tailwind.config.js`.
- Zustand persist: `isAuthenticated` derivado recalculado al hidratar.
- i18n: `Accept-Language` header, no query param; frontend `localStorage` > `navigator`.
- Imágenes: `PUBLIC_ORIGIN` requerido para URLs absolutas; Nginx alias `/uploads/` obligatorio en prod.

---

> **Regla:** Convención nueva = entrada aquí + commit. Si hay excepción justificada, documentar en comentario de código y en gotchas si es recurrente.