# MEMORY.md — Bitácora de decisiones y trabajo

> Este archivo es la memoria del proyecto. Todo agente lo lee al empezar
> y lo actualiza al terminar. Nunca se borra contenido: solo se agrega.
> Última actualización: 2026-09-29

---

## Cómo usar este archivo

- **Leer**: al iniciar cualquier tarea, busca entradas relacionadas con 
  los módulos que vas a tocar.
- **Escribir**: al terminar, agrega una entrada con el formato de abajo.
- **Nunca borrar**: si una decisión se revierte, se agrega una entrada nueva 
  explicando el cambio. El historial es valioso.

---

## Formato de entrada

### [fecha] — [T-XXX] [título corto de la tarea]
**Estado:** completada | bloqueada | parcial

**Qué se hizo:**
- Bullet 1
- Bullet 2

**Cómo se hizo:**
- Archivos creados/modificados (rutas)
- Decisiones técnicas tomadas
- Dependencias agregadas (y por qué)

**Por qué se hizo así:**
- Motivo de la decisión principal
- Alternativas descartadas y por qué

**Impacto en otras tareas:**
- Tareas que dependen de esto
- Tareas que quedan bloqueadas
- Cambios que afectan a otras partes del código

**Pendientes / deuda técnica:**
- Cosas que quedaron sin hacer (y por qué)
- Refactors que se posponen

---

## Estado actual del proyecto

> Snapshot rápido. Fuente de verdad del avance: `docs/TASKLIST.md`.

**Completadas:** T-001 (estructura de carpetas), T-002 (server con TS estricto).

**Estado del árbol:**

```
osito_a_la_carta/
├── server/
│   ├── package.json          # type: module, scripts dev/build/start/typecheck
│   ├── tsconfig.json         # strict + NodeNext
│   └── src/
│       ├── app.ts            # exporta instancia de Express (SIN listen)
│       ├── logger.ts         # pino() base, sin configurar
│       └── config/index.ts   # placeholder; env.ts llega en T-008
├── client/
│   └── package.json          # mínimo, sin dependencias
├── shared/
│   ├── types.ts              # vacío
│   └── schemas.ts            # vacío
├── docs/                     # SPEC, AGENT, TASKLIST, PROMPTS, MEMORY
├── node_modules/             # hoisteado por workspaces npm
├── package.json              # raíz, workspaces: ["server", "client"]
├── package-lock.json
├── .env.example
└── .gitignore
```

**Backend: todavía no sirve peticiones.** `src/app.ts` solo crea y exporta la
instancia de Express; no hay `app.listen()`, ni rutas, ni validación de env.
`npm run dev` en `server/` ejecuta `tsx watch src/app.ts`: el watcher queda vivo
esperando cambios de archivo, pero **no se abre ningún puerto** y
`http://localhost:3000` no responde. El listen real llega en **T-004** (endpoint
de health) o **T-007** (log de arranque).

**Comandos que sí funcionan hoy:**
- `cd server && npx tsc --noEmit` — typecheck
- `cd server && npm run build` — compila a `server/dist/`
- `cd server && npm start` — corre `dist/app.js` (no hace nada todavía)

**Pendientes de infraestructura:**
- El `package.json` raíz **no tiene scripts** (`dev`, `dev:server`, `dev:client`,
  `lint`, `typecheck`, `test`, `build`). Hay que agregarlos en T-003 y T-006.
- No hay `.env` real; solo `.env.example` en la raíz.

---

## Decisiones arquitectónicas clave

> Sección acumulativa. Cada decisión importante se documenta una vez
> y se referencia desde las entradas de tareas.

### 2026-09-29 — npm workspaces en la raíz
**Contexto:** T-001 pide un `package.json` raíz "con workspaces si aplica".
**Decisión:** `workspaces: ["server", "client"]` con npm. `shared/` queda **fuera**
de los workspaces.
**Alternativas consideradas:** (a) sin workspaces, installs separados por carpeta;
(b) pnpm/turbo; (c) incluir `shared` como paquete.
**Motivo:** npm workspaces ya viene con Node, centraliza el lockfile y permite
`npm install` desde la raíz. `shared/` solo aporta archivos `.ts` que se importan
por ruta relativa, no es un paquete publicable: incluirlo agregaría un build
step sin beneficio.
**Consecuencias:** los `node_modules` se hoistean a la raíz (no existe
`server/node_modules`). `npm install` ejecutado dentro de `server/` sigue
respetando los workspaces. Los binarios se resuelven por el PATH que arma npm en
los scripts, así que `tsx`/`tsc` funcionan desde `server/`.

### 2026-09-29 — NodeNext + `type: module` en el backend
**Contexto:** SPEC pide Node LTS + Express + TypeScript. No define el flavor de módulos.
**Decisión:** `"type": "module"` en `server/package.json` y
`module`/`moduleResolution` = `NodeNext` en `tsconfig.json`.
**Alternativas consideradas:** CommonJS (másSimple, pero contradice el ESM moderno
y complica `import.meta`); `moduleResolution: "bundler"` (no aplica a backend Node).
**Motivo:** ESM nativo en Node LTS sin transpilar, y es lo que la especificación
espera para un proyecto TS moderno.
**Consecuencias:** **los imports relativos deben llevar extensión `.js`**
(p. ej. `import { logger } from './logger.js'`), aunque el archivo sea `.ts`.
Olvidarlo compila pero rompe en runtime.

### 2026-09-29 — Flags estrictos adicionales
**Contexto:** SPEC §8 solo exige `strict: true` y "sin `any`".
**Decisión:** además de `strict`, se activaron `noUncheckedIndexedAccess`,
`noImplicitOverride`, `noFallthroughCasesInSwitch` y `exactOptionalPropertyTypes`.
**Alternativas consideradas:** solo `strict` (mínimo exigido).
**Motivo:** `noUncheckedIndexedAccess` evita el clásico `arr[i]` que devuelve
`T | undefined` sin aviso — crítico con acceso a filas de BD y params de Express.
`exactOptionalPropertyTypes` impide tratar `prop?: T` como `T | undefined`.
**Consecuencias:** código más verboso al construir objetos opcionales. Si en algún
punto genera fricción, `exactOptionalPropertyTypes` es el flag más prescindible.

---

## Problemas conocidos / gotchas

> Lista viva de cosas que hay que recordar para no tropezar dos veces.

- **SQLite + Drizzle:** las migraciones no se pueden modificar una vez aplicadas.
  Si hay que corregir, crear una nueva.
- **Telegram Markdown:** los caracteres especiales (`_ * [ ] ( ) ~ \` > # + - = | { } . !`)
  deben escaparse en los mensajes o el envío falla silenciosamente.
- **Mailgun:** el dominio debe estar verificado antes de enviar a cualquier correo.
- **La guía de convenciones se llama `docs/AGENT.md`, no `AGENTE.md`.** Los prompts
  en `docs/PROMPTS.md` y las referencias de `docs/SPEC.md` §5 dicen `AGENTE.md`.
  Buscar `AGENT.md`. No renombrado por no tener autorización.
- **SPEC.md §4 no contiene variables de entorno.** Es la tabla de stack técnico.
  La lista canónica de variables está en `docs/PROMPTS.md` T-008.
- **El backend todavía no sirve nada.** `app.listen()` no existe hasta T-004/T-007.
  `npm run dev` en `server/` deja el watcher de `tsx` vivo pero sin puerto abierto:
  no es un bug, es el estado esperado del proyecto.

---

## Historial de entradas

> Las entradas se agregan aquí en orden cronológico inverso (la más reciente arriba).

### 2026-09-29 — T-001 Estructura de carpetas
**Estado:** completada

**Qué se hizo:**
- `server/` y `client/` con `package.json` mínimo (sin dependencias).
- `shared/types.ts` y `shared/schemas.ts` vacíos.
- `package.json` raíz con npm workspaces.
- `.env.example` y `.gitignore`.

**Cómo se hizo:**
- Archivos creados: `package.json`, `server/package.json`, `client/package.json`,
  `shared/types.ts`, `shared/schemas.ts`, `.env.example`, `.gitignore`.
- Decisiones: workspaces `["server", "client"]`, `shared/` fuera de workspaces
  (ver "Decisiones arquitectónicas clave"). `server/package.json` ya declara
  `"type": "module"` porque T-002 lo exige.
- `.env.example` usa la lista de variables de `docs/PROMPTS.md` T-008.

**Por qué se hizo así:**
- El prompt pedía "variables de SPEC.md sección 4", pero esa sección es la tabla de
  stack técnico y no lista variables. Se usó la lista canónica de T-008, que es
  la que valida `config/env.ts` en T-008.

**Impacto en otras tareas:**
- T-002 arranca con el `package.json` ya declarado como ESM.
- El `package.json` raíz sin scripts: T-003 y T-006 los agregan.

**Pendientes / deuda técnica:**
- Ninguna.

---

### 2026-09-29 — T-002 Server con TypeScript estricto
**Estado:** completada

**Qué se hizo:**
- `server/tsconfig.json` en modo strict con resolución NodeNext.
- `server/src/app.ts` exporta una instancia de Express sin arrancarla.
- `server/src/logger.ts` con `pino()` base.
- `server/src/config/index.ts` como placeholder.
- Dependencias base instaladas.

**Cómo se hizo:**
- Archivos creados: `server/tsconfig.json`, `server/src/app.ts`,
  `server/src/logger.ts`, `server/src/config/index.ts`; modificado
  `server/package.json` (scripts + deps).
- Dependencias: `express`, `zod`, `pino` (runtime); `typescript`, `tsx`,
  `@types/node`, `@types/express`, `pino-pretty` (dev). Todas justificadas por
  SPEC §4. `pino-pretty` queda instalado pero **sin configurar** hasta T-007.
- Decisiones: ver "npm workspaces", "NodeNext + type: module" y "Flags estrictos
  adicionales" en la sección de decisiones.

**Por qué se hizo así:**
- `app.ts` no lleva `app.listen()` porque T-002 lo exige explícitamente ("sin
  arrancar"). El listen real se agrega en T-004/T-007.
- `logger.ts` se creó sin configurar para no adelantarle trabajo a T-007.

**Impacto en otras tareas:**
- T-004, T-007 y T-009 se apoyan en esta instancia de Express.
- T-007 reconfigura `src/logger.ts`.
- T-008 crea `src/config/env.ts` dentro de `config/`.
- Los imports relativos en el backend **deben** llevar extensión `.js`.

**Pendientes / deuda técnica:**
- `logger.ts` es un `pino()` sin opciones: sin niveles, sin transporte, sin formato.
  Es intencional hasta T-007, pero si alguien importa el logger antes de esa tarea
  verá JSON plano sinPretty.
- `config/index.ts` solo hace `export {}`; no exporta nada todavía.

---

## Convenciones de este archivo

- Una entrada por tarea completada, bloqueada o parcialmente completada.
- Si una tarea se retoma después de estar bloqueada, se agrega una entrada nueva 
  referenciando la anterior (no se edita la vieja).
- Las decisiones arquitectónicas se promueven a la sección superior cuando 
  afectan a más de un módulo.
- Los "gotchas" se agregan en cuanto se descubren, sin esperar a terminar la tarea.