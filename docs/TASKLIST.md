# TASKLIST.md — Osito a la carta

> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completada · `[!]` bloqueada
> Última actualización: [fecha]

---

## Fase 0 — Setup del proyecto

- [x] **T-001**: Crear estructura de carpetas `server/`, `client/`, `shared/`, `docs/`
  - Criterio: existen las carpetas y cada una con su `package.json` (donde aplique).
- [x] **T-002**: Inicializar `server/` con TypeScript estricto
  - Criterio: `tsc --noEmit` pasa sin errores.
- [x] **T-003**: Inicializar `client/` con Vite + React + TypeScript
  - Criterio: `npm run dev` en client levanta la app en `:5173`.
- [x] **T-004**: Configurar proxy de Vite `/api` → `http://localhost:3000`
  - Criterio: una llamada a `/api/health` devuelve `{ status: 'ok' }`.
- [ ] **T-005**: Configurar Tailwind en `client/`
  - Criterio: una clase de Tailwind se aplica visualmente en `App.tsx`.
- [ ] **T-006**: Configurar ESLint + Prettier en `server/` y `client/`
  - Criterio: `npm run lint` pasa sin errores en ambos.
- [ ] **T-007**: Configurar `pino` como logger en `server/`
  - Criterio: el logger imprime JSON estructurado al arrancar.
- [ ] **T-008**: Configurar validación de variables de entorno con Zod
  - Criterio: si falta una variable requerida, el server no arranca y explica cuál.
- [ ] **T-009**: Crear endpoint `GET /api/health`
  - Criterio: responde `{ status: 'ok', timestamp }`.

---

## Fase 1 — Base de datos

- [ ] **T-010**: Definir schema Drizzle en `server/src/db/schema.ts`
  - Entidades: `User`, `Dish`, `Order`, `OrderItem`, `PageView`, `NotificationLog`.
  - Criterio: `drizzle-kit generate` produce una migración válida.
- [ ] **T-011**: Aplicar migración inicial
  - Criterio: archivo `osito.db` creado con todas las tablas.
- [ ] **T-012**: Script de seed con 5 platos de ejemplo en 3 idiomas
  - Criterio: `SELECT` devuelve 5 filas con datos en es / ru / en.
- [ ] **T-013**: Script de seed con 1 usuario admin
  - Criterio: existe un usuario `admin@osito.local` con contraseña hasheada.

---

## Fase 2 — API de platos

- [ ] **T-020**: `GET /api/dishes` con localización por `Accept-Language`
  - Criterio: con `Accept-Language: ru` devuelve nombres en ruso.
- [ ] **T-021**: `GET /api/dishes/:id`
  - Criterio: devuelve 404 si no existe.
- [ ] **T-022**: `POST /api/dishes` (solo admin)
  - Criterio: rechaza con 401 sin token, con 403 si no es admin.
- [ ] **T-023**: `PUT /api/dishes/:id` (solo admin)
- [ ] **T-024**: `DELETE /api/dishes/:id` (solo admin) — borrado lógico (`isAvailable = 0`)

---

## Fase 3 — Frontend: menú y multi-idioma

- [ ] **T-030**: Configurar `react-i18next` con `es.json`, `ru.json`, `en.json`
  - Criterio: cambiar idioma cambia textos sin recargar.
- [ ] **T-031**: Página `/menu` que consume `GET /api/dishes`
  - Criterio: muestra todos los platos disponibles.
- [ ] **T-032**: Componente `DishCard` (imagen, nombre, descripción, ingredientes, precio)
  - Criterio: se ve correctamente en móvil y desktop.
- [ ] **T-033**: Selector de idioma en navbar, persistido en `localStorage`
  - Criterio: al recargar, mantiene el idioma elegido.
- [ ] **T-034**: Página `/menu/:id` con detalle del plato
  - Criterio: muestra todos los datos del plato y botón "agregar al carrito".
- [ ] **T-035**: Estilos base con Tailwind + shadcn/ui (botones, cards, navbar)
  - Criterio: UI coherente y responsive.

---

## Fase 4 — Autenticación

- [ ] **T-040**: `POST /api/auth/register` con validación Zod
  - Criterio: rechaza email duplicado con error claro.
- [ ] **T-041**: `POST /api/auth/login` (devuelve access + refresh token)
  - Criterio: access token expira en 15 min, refresh en 7 días.
- [ ] **T-042**: `POST /api/auth/refresh`
  - Criterio: renueva access token con refresh válido.
- [ ] **T-043**: Middleware `requireAuth` y `requireAdmin`
  - Criterio: rutas protegidas devuelven 401 sin token.
- [ ] **T-044**: Páginas `/login` y `/register` en frontend
  - Criterio: el formulario usa React Hook Form + Zod.
- [ ] **T-045**: Store de sesión con Zustand + persistencia en `localStorage`
  - Criterio: al recargar, la sesión se mantiene si el token es válido.
- [ ] **T-046**: Interceptor de fetch que añade `Authorization` y maneja 401
  - Criterio: si el access expira, hace refresh automático.

---

## Fase 5 — Carrito y pedidos

- [ ] **T-050**: Store de carrito con Zustand persistido en `localStorage`
  - Criterio: agregar, quitar y modificar cantidades funciona tras recargar.
- [ ] **T-051**: `POST /api/orders` con validación Zod y transacción
  - Criterio: crea `Order` + `OrderItem` atómicamente.
- [ ] **T-052**: `GET /api/orders` (historial del usuario autenticado)
  - Criterio: solo devuelve pedidos del propio usuario.
- [ ] **T-053**: Página `/cart` con resumen y botón "confirmar pedido"
  - Criterio: redirige a `/orders/:id` tras confirmar.
- [ ] **T-054**: Página `/orders` con historial de pedidos
  - Criterio: muestra estado, fecha y total de cada pedido.
- [ ] **T-055**: Página `/orders/:id` con detalle del pedido
  - Criterio: muestra platos, cantidades y total.

---

## Fase 6 — Notificaciones al chef

- [ ] **T-060**: Módulo `notifications` con servicio de correo (Mailgun)
  - Criterio: enviar correo de prueba desde un script.
- [ ] **T-061**: Módulo `notifications` con servicio de Telegram
  - Criterio: enviar mensaje de prueba desde un script.
- [ ] **T-062**: Plantilla HTML del pedido para el correo
  - Criterio: incluye platos, cantidades, total y nota del cliente.
- [ ] **T-063**: Disparar ambas notificaciones en paralelo al crear pedido
  - Criterio: un fallo en un canal no bloquea el otro.
- [ ] **T-064**: Registrar resultado en `NotificationLog`
  - Criterio: cada envío (éxito o fallo) queda registrado.
- [ ] **T-065**: Reintento automático una vez si falla el envío
  - Criterio: si el primer intento falla, se reintenta y se registra el resultado final.

---

## Fase 7 — Estadísticas del usuario

- [ ] **T-070**: `POST /api/stats/pageview` al visitar detalle de plato
  - Criterio: registra `userId` (si hay sesión) y `dishId`.
- [ ] **T-071**: `GET /api/stats/me` con agregados del usuario
  - Criterio: devuelve platos más vistos, más pedidos y total gastado.
- [ ] **T-072**: Página `/stats` con gráficos (Recharts)
  - Criterio: muestra al menos 2 gráficos y un resumen numérico.

---

## Fase 8 — Panel del chef

- [ ] **T-080**: `GET /api/admin/orders` (todos los pedidos, solo admin)
  - Criterio: rechaza con 403 si no es admin.
- [ ] **T-081**: Página `/admin/orders` con actualización automática
  - Criterio: los pedidos nuevos aparecen sin recargar (polling cada 10s).
- [ ] **T-082**: `PATCH /api/admin/orders/:id/status` para cambiar estado
  - Criterio: solo permite transiciones válidas (`pending → preparing → sent → delivered`).
- [ ] **T-083**: Vista de detalle de pedido para el chef
  - Criterio: muestra datos del cliente, platos y nota.

---

## Fase 9 — Pulido y despliegue

- [ ] **T-090**: PWA con `vite-plugin-pwa`
  - Criterio: la app es instalable en móvil.
- [ ] **T-091**: Responsive completo en móvil, tablet y desktop
  - Criterio: todas las páginas son usables desde 360px de ancho.
- [ ] **T-092**: Manejo global de errores en frontend (ErrorBoundary + toasts)
  - Criterio: un error de red muestra un mensaje claro, no pantalla blanca.
- [ ] **T-093**: Tests básicos de flujos críticos (registro, pedido, notificación)
  - Criterio: `npm run test` pasa.
- [ ] **T-094**: Configurar PM2 en el VPS
  - Criterio: `pm2 status` muestra la app corriendo y con arranque automático.
- [ ] **T-095**: Configurar Nginx como proxy inverso + Let's Encrypt
  - Criterio: la app responde por HTTPS en el dominio configurado.
- [ ] **T-096**: Script de backup diario de `osito.db`
  - Criterio: cron ejecuta `cp osito.db backups/osito-$(date).db` cada día.

---

## Decisiones pendientes

- ¿Polling o SSE para el panel del chef? → **T-081** (decisión al llegar a la tarea).
- ¿Cuántos reintentos de notificación y con qué backoff? → **T-065**.
- ¿Dónde alojar las imágenes de los platos? (VPS local vs. servicio externo) → decidir antes de **T-022**.
- ¿Rate limiting en endpoints públicos? → evaluar en **T-092**.

---

## Notas de progreso

> Aquí los agentes anotan decisiones, bloqueos y aprendizajes. Una entrada por tarea completada o bloqueada.

### 2026-09-29 — T-001 (setup)
- Creado: `server/package.json`, `client/package.json` (mínimos, sin dependencias),
  `shared/types.ts` y `shared/schemas.ts` (vacíos), `.env.example`, `.gitignore`
  y `package.json` raíz.
- Decisión tomada: el `package.json` raíz usa **npm workspaces** con `["server", "client"]`.
  `shared/` queda fuera de workspaces porque solo aporta archivos `.ts` que se importan
  por ruta relativa (no es un paquete publicable).
- Decisión tomada: `server/package.json` ya declara `"type": "module"` porque T-002 lo exige.
- Duda resuelta: el prompt de T-001 pedía "variables de SPEC.md sección 4", pero esa sección
  es la tabla de stack técnico y **no lista variables de entorno**. Se usaron las variables
  canónicas de `docs/PROMPTS.md` T-008 (PORT, NODE_ENV, LOG_LEVEL, DATABASE_URL, JWT_SECRET,
  JWT_REFRESH_SECRET, MAILGUN_*, CHEF_EMAIL, TELEGRAM_*). Si el dueño prefiere otra lista,
  corregir antes de T-008.
- Discrepancia detectada: la guía de convenciones está en `docs/AGENT.md`, no `docs/AGENTE.md`
  como lo indican SPEC/PROMPTS. No se modificó el nombre.
- El `package.json` raíz todavía **no** tiene scripts (`dev`, `lint`, `typecheck`, `build`, `test`).
  Se agregarán en T-002 (dev/typecheck del server), T-003 (dev del client) y T-006 (lint/format).
- Impacto en otras tareas: ninguna dependencia instalada todavía, según lo pedido.

### 2026-09-29 — T-002 (setup)
- Archivos creados: `server/tsconfig.json`, `server/src/app.ts`, `server/src/logger.ts`,
  `server/src/config/index.ts`. Dependencias instaladas y añadidas a `server/package.json`.
- Criterio verificado: `npx tsc --noEmit` pasa sin errores y `npx tsx src/app.ts` carga el
  módulo sin abrir el puerto (no hay `app.listen`).
- Decisión tomada: `module`/`moduleResolution` = **NodeNext**, coherente con `"type": "module"`.
  Esto obliga a escribir imports relativos con extensión `.js` (p. ej. `./logger.js`).
- Decisión tomada: se activaron flags adicionales de strict: `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch` y `exactOptionalPropertyTypes`.
  `exactOptionalPropertyTypes` puede obligar a propagar `prop?: T` en vez de `prop: T | undefined`
  al construir objetos; ajustar en T-008 si incomoda.
- Decisión tomada: `src/logger.ts` se creó ya con `pino()` base (sin opciones) porque la
  estructura lo exige. La configuración por entorno y `pino-pretty` quedan para **T-007**;
  no se-forward-dejó configuración adelantada para no mezclar tareas.
- Decisión tomada: `src/config/index.ts` existe como punto de extensión para el barrel de configuración.
  `config/env.ts` (validación Zod) se crea en **T-008**.
- Nota: `npm install` se ejecutó desde `server/`, pero por los workspaces de la raíz los
  paquetes se hoistean a `<raíz>/node_modules` y se creó `<raíz>/package-lock.json`. Es el
  comportamiento esperado; no hay `node_modules` dentro de `server/`.
- No se agregó ninguna ruta: `app.ts` solo exporta la instancia de Express.
- Impacto en otras tareas: T-004 y T-009 colgarán routers sobre esta instancia; T-007
  reconfigurará `src/logger.ts`. El `package.json` raíz sigue sin scripts (`dev`, `lint`,
  `typecheck`) — se completan en T-003/T-006.

### 2026-09-29 — T-003 (setup)
- Archivos creados: `client/index.html`, `client/vite.config.ts`, `client/tsconfig.json`,
  `client/tsconfig.app.json`, `client/tsconfig.node.json`, `client/src/main.tsx`,
  `client/src/App.tsx`, `client/src/index.css`, y las carpetas vacías
  `client/src/{pages,components,api,hooks,store,locales,lib}`. Modificado `client/package.json`.
- Criterio verificado: `npm run dev` levanta Vite en `http://localhost:5173` (HTTP 200) y
  `App.tsx` se sirve con el texto "Osito a la carta". `npx tsc -b --noEmit` en client y
  `npx tsc --noEmit` en server pasan ambos.
- **Decisión del dueño:** se usa **React 19.3.0**, no React 18. `create-vite@latest
  --template react-ts` ya no genera React 18. **SPEC.md §4 fue actualizado** el
  2026-09-29 con autorización explícita del dueño: ahora dice "React 19 + Vite 8" y
  §10 registra la decisión como cerrada. SPEC.md y el código ya coinciden.
- Decisión tomada: **TypeScript unificado a 5.9.3** en todo el monorepo (el template traía
  ~6.0.2, el server ya tenía ^5.7.3). Se declares `^5.7.3` en ambos package.json y npm
  deduplica una sola instalación. Así `npx tsc` se comporta igual en los dos workspaces.
- Decisión tomada: se conserva la estructura de **tsconfig con project references**
  (`tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json`) que genera el template.
  El `strict` se aplicó manualmente porque el template actual **no lo trae activado**:
  se añadió `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- Decisión tomada: `exactOptionalPropertyTypes` **no** se activó en el client (sí está en el
  server). Motivo: con las librerías de UI que llegan en T-005/T-035 (Tailwind, shadcn/ui)
  suele generar falsos positivos al tipar props. Es el flag prescindible del backend.
- Decisión tomada: se eliminaron del template los archivos de demo no usados
  (`App.css`, `assets/`, `public/vite.svg`, `README.md`, `.oxlintrc.json`, `.gitignore`
  del client) y los scripts `lint`/`build` con oxlint. El linting es tarea de **T-006**
  (ESLint + Prettier); dejar oxlint habría creado un conflicto de herramientas.
- Gotcha registrado: en PowerShell, `npm create vite@latest <path> -- --template react-ts`
  ignora `--template` (npm se lo come como config propia) y scaffoldea **vanilla**, no React.
  Hay que usar `npx --yes create-vite@latest <path> --template react-ts`.
- Impacto en otras tareas: T-004 añade el proxy `/api` en `vite.config.ts`; T-005 añade
  Tailwind y reemplaza `index.css`; T-006 añade ESLint/Prettier y los scripts raíz
  (`dev:client`, `lint`, `typecheck`); T-030 reemplaza el texto de `App.tsx` por `t('app.title')`.

### 2026-09-29 — T-004 (setup)
- Archivos modificados: `client/vite.config.ts` y `server/src/app.ts`. Ningún archivo nuevo.
- Criterio verificado de extremo a extremo: con ambos servidores arriba,
  `http://localhost:5173/api/health` devolvió `{"status":"ok","timestamp":"2026-09-29T21:45:52.612Z"}`
  y el acceso directo a `http://localhost:3000/api/health` devolvió lo mismo.
  `npx tsc --noEmit` (server) y `npx tsc -b --noEmit` (client) pasan ambos.
- **Cambio de alcance respecto a T-002:** `app.ts` ahora hace `app.listen(PORT)` en el
  arranque del módulo. T-002 lo dejó explícitamente sin arrancar, pero el criterio de
  T-004 exige el server en `:3000`, así que el `listen` es indispensable. Sigue exportando
  `app` para que las pruebas de T-093 puedan importar la instancia.
- Decisión tomada: `PORT` se lee de `process.env.PORT ?? '3000'` **sin validación Zod todavía**;
  la validación con Zod llega en **T-008**, que sustituirá esta línea por `env.PORT`.
  Se usó el env directo para no adelantar trabajo de T-008.
- Decisión tomada: `strictPort: true` en el server de Vite. Sin esto, Vite cae
  automáticamente a `5174`, `5175`... si el puerto está ocupado, y el proxy y los
  tests que apunten a `:5173` fallarían de forma confusa. Fallar rápido es preferible.
- Decisión tomada: `changeOrigin: true` en el proxy. Sin él, Express recibe
  `Host: localhost:5173` en vez del original; hoy es inocuo, pero lo necesitará
  cuando haya CORS/origins validados en T-008+.
- Gotcha registrado: el import `./logger.js` lleva extensión `.js` aunque el archivo sea
  `.ts` — requisito de `moduleResolution: NodeNext` de T-002. Sin la extensión,
  `tsc --noEmit` pasa pero el runtime revienta con `ERR_MODULE_NOT_FOUND`.
- Impacto en otras tareas: T-007 sustituye el `logger.info` directo por el nivel/config
  definitivos; T-008 mueve el puerto a `env.PORT` validado; T-009 movdrá la ruta de
  `app.ts` a `src/modules/health/health.routes.ts` con un router propio.

---

## Convenciones de este archivo

- Una tarea = una unidad de trabajo verificable.
- Si una tarea requiere más de 5 archivos, dividirla antes de empezar.
- Las tareas bloqueadas se marcan `[!]` y se documentan en **Decisiones pendientes**.
- Las tareas completadas no se borran: quedan como historial.
```

---
