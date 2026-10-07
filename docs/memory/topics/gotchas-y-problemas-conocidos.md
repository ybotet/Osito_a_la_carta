# Gotchas y problemas conocidos

> Última actualización: 2026-10-07

Lista viva de problemas, comportamientos sorprendentes y soluciones aplicadas. **Objetivo: no tropezar dos veces con la misma piedra.**

---

## SQLite + Drizzle

| Gotcha | Síntoma | Causa | Solución / Workaround |
|--------|---------|-------|------------------------|
| **WAL mode no persiste entre conexiones** | `PRAGMA journal_mode=WAL` parece no funcionar | SQLite abre conexión, ejecuta pragma, cierra; la siguiente conexión vuelve a `DELETE` | Ejecutar `PRAGMA journal_mode=WAL` **en cada conexión** (Drizzle: `onCreate` en `drizzle.config.ts` o middleware). Ver `server/src/db/index.ts`. |
| **`drizzle-kit generate` no detecta cambios en índices** | Migración vacía tras agregar `index()` en schema | Drizzle solo genera migraciones para cambios de columnas/constraints, no para `index()` solos | Agregar columna dummy o usar `sql\`CREATE INDEX IF NOT EXISTS...\`` en migración manual. Ver T-029. |
| **Foreign keys no se aplican por defecto** | `DELETE` en `categories` no rechaza aunque haya platos | SQLite tiene FK desactivadas por defecto | `PRAGMA foreign_keys = ON` en cada conexión (configurado en `server/src/db/index.ts`). |
| **Boolean en SQLite = 0/1, no true/false** | Filtros `where(eq(dishes.isAvailable, true))` no funcionan | Drizzle mapea boolean a INTEGER 0/1 | Usar `eq(dishes.isAvailable, 1)` o `sql\`${dishes.isAvailable} = 1\``. O definir columna como `integer('isAvailable').notNull().default(1)` y tratar como number en TS. |
| **`datetime` en Drizzle = string ISO, no Date** | Comparaciones de fechas fallan | SQLite no tiene tipo DATE; Drizzle usa `text` con ISO string | Usar `sql\`strftime('%Y-%m-%d', ${orders.createdAt})\`` para comparar fechas; o almacenar `integer` unix timestamp. |
| **Upsert (`onConflictDoUpdate`) no funciona en SQLite** | `insert().onConflictDoUpdate()` lanza error | SQLite soporta `ON CONFLICT DO UPDATE` pero Drizzle tiene soporte limitado | Usar `insert().onConflictDoNothing()` + `update()` separado, o `INSERT OR REPLACE` raw SQL. Ver `db:seed` script. |

---

## TypeScript + ESM + Monorepo

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **Imports `shared/` fallan en runtime** | `Error: Cannot find module '../../shared/schemas'` | `tsc` no emite; `tsx` resuelve paths pero Node no sabe de `shared/` | En `tsconfig.json`: `"baseUrl": ".", "paths": { "@shared/*": ["shared/*"] }` y usar `@shared/schemas`. En `package.json` server: `"exports": { "./shared/*": "../shared/*" }` — **no**, mejor: `tsx` resuelve relativo desde archivo que importa. Usar `../../shared/schemas` desde `server/src/...` y `../../../shared/schemas` desde `client/src/...`. |
| **`__dirname` no existe en ESM** | `ReferenceError: __dirname is not defined` | ESM no tiene `__dirname` global | `import { fileURLToPath } from 'url'; import { dirname } from 'path'; const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);` |
| **`process.loadEnvFile()` solo en Node 22+** | `TypeError: process.loadEnvFile is not a function` | Node < 22 no tiene API nativa | Requerir Node 22+ (`.nvmrc`, `engines` en package.json). En CI/VPS usar `nvm use 22` o `fnm`. |
| **`import.meta.dirname` (Node 22.12+) vs `fileURLToPath`** | Confusión entre ambas | `import.meta.dirname` es nuevo (2024) | Usar `import.meta.dirname` si Node ≥ 22.12; si no, `fileURLToPath`. Verificar versión en VPS. |
| **Types de `shared/` no se actualizan en client tras cambio** | Client ve types viejos | `tsc --noEmit` en server no regenera types para client | `shared/` solo tiene `.ts`; client importa directo. Cambios en `shared/` se reflejan al reiniciar TS server (VS Code: `TypeScript: Restart TS Server`). |

---

## React + Vite + TanStack Query

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **Query keys con arrays vs strings** | Cache no invalida correctamente | `queryKey: ['dishes']` vs `['dishes', { lang }]` son keys distintas | Usar arrays consistentes: `['dishes', lang]`. Invalidar con `queryClient.invalidateQueries({ queryKey: ['dishes'] })` invalida todas las variantes. |
| **`staleTime` por defecto = 0** | Refetch constante al volver a pestaña | TanStack Query v5 default `staleTime: 0` | Setear `staleTime: 1000 * 60 * 5` (5 min) en `QueryClient` global o por query. Dishes/categories son estáticos → `Infinity`. |
| **Mutación `onSuccess` no invalida queries relacionadas** | Lista de pedidos no se actualiza tras crear uno | `invalidateQueries` llamado antes de que mutación complete | Usar `onSettled` (siempre ejecuta) o `await mutation.mutateAsync()` y luego invalidar manualmente. |
| **`useQuery` con `enabled: false` no fetch al habilitar** | Query no se ejecuta al cambiar `enabled: true` | `enabled` controla si se ejecuta **automáticamente**; si era `false`, no hay suscripción | Usar `refetch()` manualmente o `queryClient.prefetchQuery()` antes de habilitar. |
| **Hydration mismatch con Zustand `persist`** | Warning: "Text content did not match" en SSR | `localStorage` no existe en server; Zustand hidrata en client | Stores con `persist` solo en client: `useAuthStore` y `useCartStore` se crean dentro de `useEffect` o usan `skipHydration: true` (Zustand v4.4+). Ver `client/src/stores/authStore.ts`. |

---

## Autenticación + JWT

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **Refresh token no rota → replay attack posible** | Refresh robado permite acceso indefinido | Decisión: no rotar refresh por simplicidad (ver decisión #5) | Mitigación: refresh 7 días, access 15 min; HTTPS obligatorio en prod; `Secure` + `HttpOnly` cookies en futuro (T-095). Documentado como deuda. |
| **Middleware `requireAuth` no valida `type` del token** | Access token con `type: 'refresh'` pasa validación | Olvido en implementación inicial | Middleware **debe** verificar `payload.type === 'access'`. Ver `server/src/middleware/auth.ts`. |
| **Interceptor 401 → refresh → retry: race condition** | Múltiples requests 401 disparan múltiples refresh | Varias llamadas simultáneas (ej. carga inicial) | Variable `isRefreshing` + cola de callbacks; solo el primero hace refresh, los demás esperan. Ver `client/src/utils/api.ts`. |
| **`sub` en refresh = userId, pero user puede ser borrado** | Refresh válido pero usuario no existe | No hay revocación de tokens (stateless) | En `/auth/refresh`, hacer `SELECT` por `sub`; si no existe → 401. Implementado. |
| **`bcryptjs` vs `bcrypt` (native)** | `npm install bcrypt` falla en VPS (python/build tools) | `bcrypt` necesita compilar addon nativo | Usar `bcryptjs` (pure JS, más lento pero sin deps nativas). 12 rounds = ~100ms, aceptable. |

---

## Internacionalización (i18n)

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **`Accept-Language` header no llega en fetch del browser** | API devuelve siempre español | Browser no envía header por defecto en `fetch()` | Frontend: `headers: { 'Accept-Language': i18n.language }` en cada llamada (interceptor). Ver `client/src/utils/api.ts`. |
| **`react-i18next` no detecta idioma del browser al primer carga** | Siempre `es` aunque browser sea `ru` | `detection.order` por defecto no incluye `navigator` | Config: `detection: { order: ['localStorage', 'navigator', 'htmlTag'] }`. Ver `client/src/i18n.ts`. |
| **Traducciones en BD: columnas `_es`, `_ru`, `_en`** | Query `SELECT name_es...` según header | Patrón manual, no ORM nativo | Helper `getLocalizedColumn('name', lang)` en `server/src/utils/i18n.ts` genera SQL fragment. Usar en todos los módulos. |
| **Orders guardan `language` snapshot** | Pedido viejo muestra idioma actual del usuario, no del momento | `orders.language` captura idioma al crear | Correcto: `order_items` tiene `name`, `description` en ese idioma; frontend usa `order.language` para mostrar. No bug, feature. |

---

## Imágenes + Uploads

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **`multer` + ESM: `diskStorage` function `filename` no recibe `req`** | `req` es `undefined` en callback | `multer` types antiguos; en ESM `this` context perdido | Usar `multer({ storage: diskStorage({ destination, filename: (req, file, cb) => ... }) })` — `req` sí llega. Ver `server/src/modules/uploads/routes.ts`. |
| **Nginx no sirve `/uploads/` tras deploy** | 404 en imágenes subidas | Falta config `location /uploads/ { alias /var/www/osito/uploads/; }` | Pendiente T-095. Recordar: `alias` (no `root`) + trailing slash en ambos. |
| **Nombre de archivo UUID + extensión original** | Colisión si mismo nombre subido dos veces | `Date.now()` + nombre original colisiona en misma ms | `crypto.randomUUID() + path.extname(file.originalname)`. Implementado. |
| **`PUBLIC_ORIGIN` sin trailing slash** | URL doble slash: `https://api.osito.local//uploads/...` | Concatenación manual | `const url = \`${PUBLIC_ORIGIN.replace(/\/$/, '')}/uploads/${relativePath}\``. Ver `uploads` service. |

---

## Tailwind 4 + shadcn/ui

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **Tailwind 4 no lee `tailwind.config.js`** | Config ignorada, temas no aplican | Tailwind 4 usa CSS-first (`@import "tailwindcss"`) | Mover tokens a `:root` en `index.css` con `@theme { --color-primary: ... }`. Ver `client/src/index.css`. |
| **`dark:` variant no funciona** | Modo oscuro no aplica | Tailwind 4 usa `class` strategy por defecto; `html.dark` no basta | En `index.css`: `@custom-variant dark (&:where(.dark, .dark *));` o agregar `class="dark"` al `html` via JS. Ver `client/src/main.tsx`. |
| **shadcn/ui components no tienen estilos** | Botones sin padding, inputs sin border | Componentes copiados pero falta `@import "tailwindcss"` en CSS que los usa | `index.css` ya importa tailwind; componentes usan `@apply` o clases directas. Verificar que `index.css` se importa en `main.tsx` **antes** de componentes. |
| **`cn()` utility no mergea clases Tailwind correctamente** | Clases duplicadas o orden incorrecto | `clsx` + `tailwind-merge` no configurado | `cn = (...inputs) => twMerge(clsx(inputs))` en `client/src/utils/cn.ts`. Usar siempre `cn()` para classNames condicionales. |

---

## Estado global (Zustand)

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **Selector derivado no se recalcula** | `totalPrice` muestra 0 tras agregar item | Selector usa `state.items` pero no se suscribe a cambios | En Zustand, selectores **siempre** reciben `state` fresco. Verificar que no se usa `useCartStore.getState()` en render (eso no suscribe). Usar `useCartStore(s => s.totalPrice)`. |
| **`persist` hidrata antes de que React monte** | `useAuthStore.getState().isAuthenticated` es `false` en primer render | Hidratación asíncrona; store sincroniza `localStorage` después | Usar `useAuthStore(s => s.isAuthenticated)` en componente (suscribe); o `skipHydration: true` y hidratar manualmente en `useEffect`. |
| **Cart items guardan copia del plato (snapshot)** | Precio en carrito no cambia si admin actualiza precio | Decisión intencional: carrito = snapshot al agregar | Correcto. Al confirmar pedido, precios se recalculan desde BD (ver decisión #10). |

---

## Testing + CI

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **`npm run test` no configurado** | `missing script: test` | Pendiente T-093 | Definir: `vitest` para unit/integration, `playwright` para E2E. Configurar en `package.json` raíz. |
| **Tests de BD necesitan DB limpia** | Tests flaky por datos residuales | SQLite archivo compartido | `vitest` + `setupFiles` que crea `:memory:` DB o archivo temp por test suite; `drizzle-kit migrate` en setup. |
| **Variables de entorno en tests** | `process.env.JWT_SECRET` undefined | `.env` no cargado en test runner | `process.loadEnvFile('.env.test')` en `vitest.setup.ts`; `.env.test` en `.gitignore`. |

---

## Despliegue (VPS)

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **PM2 no reinicia tras crash** | App muerta hasta reinicio manual | `pm2 start` sin `--watch` o config incorrecta | `pm2 start ecosystem.config.cjs --env production`; `ecosystem.config.cjs` con `restart_delay`, `max_restarts`, `watch: false` (prod). |
| **Nginx proxy_pass pierde `Host` header** | `PUBLIC_ORIGIN` incorrecto en URLs generadas | `proxy_set_header Host $host;` faltante | Config Nginx: `proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme;`. Server usa `req.headers['x-forwarded-proto']` + `req.get('host')` para construir URLs. |
| **Certbot Let's Encrypt falla por puerto 80 ocupado** | `nginx: [emerg] bind() to 0.0.0.0:80 failed` | PM2 o Node escuchando en 80 | Solo Nginx en 80/443; Node en 3000 (interno); `proxy_pass http://localhost:3000;`. |
| **Backup `cp osito.db` copia DB corrupta** | Backup inconsistente si write durante copy | SQLite no soporta backup atómico con `cp` | Usar `sqlite3 osito.db ".backup backups/osito-$(date).db"` (comando `.backup` de SQLite hace copia consistente). Ver T-096. |

---

## Misceláneos

| Gotcha | Síntoma | Causa | Solución |
|--------|---------|-------|----------|
| **`zod` `refine` async no funciona en `superRefine`** | Validación async no ejecuta | `refine` sync; `superRefine` permite async pero API distinta | Usar `superRefine(async (val, ctx) => { const exists = await db...; if (exists) ctx.addIssue(...) })`. Ver `shared/schemas.ts`. |
| **`pino` no loggea en tests** | Sin output en `vitest run` | `pino-pretty` no compatible con test runner | `LOG_LEVEL=silent` en test env, o `pino({ level: process.env.LOG_LEVEL || 'silent' })`. |
| **`react-hook-form` + Zod: `resolver` types** | Error TS: `FieldValues` genérico | `zodResolver(schema)` infiere mal si schema tiene `.transform()` | Usar `zodResolver(schema.shape)` o tipar explícito `UseFormProps<z.infer<typeof schema>>`. |
| **`vite build` falla por `import.meta.env` en server code** | `import.meta.env` undefined en build server | Vite solo inyecta env en client; server usa `process.env` | Server **nunca** usa `import.meta.env`; solo `process.env` (validado por Zod). Client usa `import.meta.env.VITE_*`. |

---

## Cómo agregar un gotcha nuevo

1. Identifica la **categoría** (o crea nueva tabla).
2. Añade fila con: **Gotcha** (título corto), **Síntoma** (qué se ve), **Causa** (por qué pasa), **Solución/Workaround** (qué hacer).
3. Referencia tarea relacionada (T-XXX) si aplica.
4. Mantén orden alfabético dentro de cada tabla.

> **Nota:** Este archivo es de **consulta rápida**. Para decisiones de fondo, ver `decisiones-arquitectura.md`. Para historial cronológico, ver `historial-tareas.md`.