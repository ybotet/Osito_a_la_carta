# TASKLIST.md — Osito a la carta

> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completada · `[!]` bloqueada
> Última actualización: [fecha]

---

## Fase 0 — Setup del proyecto

- [x] **T-001**: Crear estructura de carpetas `server/`, `client/`, `shared/`, `docs/`
  - Criterio: existen las carpetas y cada una con su `package.json` (donde aplique).
- [ ] **T-002**: Inicializar `server/` con TypeScript estricto
  - Criterio: `tsc --noEmit` pasa sin errores.
- [ ] **T-003**: Inicializar `client/` con Vite + React + TypeScript
  - Criterio: `npm run dev` en client levanta la app en `:5173`.
- [ ] **T-004**: Configurar proxy de Vite `/api` → `http://localhost:3000`
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

---

## Convenciones de este archivo

- Una tarea = una unidad de trabajo verificable.
- Si una tarea requiere más de 5 archivos, dividirla antes de empezar.
- Las tareas bloqueadas se marcan `[!]` y se documentan en **Decisiones pendientes**.
- Las tareas completadas no se borran: quedan como historial.
```

---
