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

**Completadas:** T-001 (estructura de carpetas), T-002 (server con TS estricto),
T-003 (client con Vite + React + TS).

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
│   ├── package.json          # dev/build/preview/typecheck, React 19
│   ├── tsconfig.json         # project references → app + node
│   ├── tsconfig.app.json     # strict + flags
│   ├── tsconfig.node.json    # strict, cubre vite.config.ts
│   ├── vite.config.ts        # solo plugin-react; proxy /api en T-004
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx           # <h1>Osito a la carta</h1>
│       ├── index.css          # global; Tailwind lo reemplaza en T-005
│       └── pages/ components/ api/ hooks/ store/ locales/ lib/   (vacías)
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
- `cd client && npm run dev` — Vite en `http://localhost:5173` (funciona)
- `cd client && npx tsc -b --noEmit` — typecheck del cliente

**Versiones instaladas (verificadas con `npm ls --workspaces`):**
react 19.3.0 · react-dom 19.3.0 · vite 8.3.1 · @vitejs/plugin-react 6.1.1 ·
typescript 5.9.3 (**una sola versión para todo el monorepo**) · express 5.2.1 ·
pino 9.14.0 · zod 3.25.76 · @types/node 22.20.4

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

### 2026-09-29 — React 19 (desvío autorizado de SPEC.md §4)
**Contexto:** SPEC.md §4 fija "React 18 + Vite". La tarea T-003 indicaba usar
`npm create vite@latest . -- --template react-ts`, pero ese template hoy genera
React 19.3.0 (React 19.3.0 es `latest` en npm; la última 18 es 18.3.1).
**Decisión:** se usa **React 19.3.0**, según autorizó explícitamente el dueño.
SPEC.md §4 fue actualizado el 2026-09-29 (con autorización posterior explícita)
para decir "React 19 + Vite 8", y §10 registra la decisión como cerrada.
**Alternativas consideradas:** (a) pinear React 18.3.1, fiel a SPEC; (b) React 18 + Vite 7,
más conservador; (c) React 19 del template — **elegida por el dueño**.
**Motivo:** el dueño prefiere el stack actual que genera el tooling oficial, aceptando
el desajuste con SPEC.md.
**Consecuencias:** SPEC.md §4 ya no está desactualizado. Cualquier agente que lea
SPEC como fuente de verdad verá "React 19" y no intentó revertirlo. shadcn/ui y
TanStack Query soportan React 19 sin cambios.

### 2026-09-29 — TypeScript unificado a 5.9.3 en todo el monorepo
**Contexto:** el template de Vite trae `typescript ~6.0.2`; T-002 había fijado
`^5.7.3` en el server. Con npm workspaces, dos versiones de `tsc` conviven y una
queda anidada en `node_modules`, lo que hace ambiguo qué versión ejecuta `npx tsc`.
**Decisión:** declarar `^5.7.3` en **ambos** `package.json`. npm deduplica y ambos
workspaces resuelven a **5.9.3** (una sola instalación hoisteada).
**Alternativas consideradas:** (a) TS 6.0.2 solo en client; (b) subir el server a 6.0.2
—descartada, mezclaba un cambio de T-002 dentro de T-003.
**Motivo:** una sola versión hace que `npm run typecheck` en la raíz sea predecible en
T-006, y TS 5.9 es la rama que shadcn/ui, drizzle-kit y Recharts ya soportan.
**Consecuencias:** el `caret` de `^5.7.3` permite subir a 5.x sin tocar los manifests.
Si alguna dependencia exige TS 6, habrá que migrar los dos workspaces a la vez.

### 2026-09-29 — Project references en el tsconfig del cliente
**Contexto:** el template actual de Vite no trae un `tsconfig.json` único sino tres
archivos: `tsconfig.json` (solo `references`) + `tsconfig.app.json` + `tsconfig.node.json`.
**Decisión:** conservar esa estructura tal cual la genera Vite.
**Alternativas consideradas:** un `tsconfig.json` único y plano.
**Motivo:** es el estándar de la herramienta y separa el código de la app (DOM,
`jsx: react-jsx`) del de las herramientas (`vite.config.ts`, tipos de Node).
**Consecuencias:** el typecheck del cliente es `tsc -b --noEmit`, **no** `tsc --noEmit`.
Ojo: el backend sí usa `tsc --noEmit` porque tiene un solo tsconfig. Los dos comandos
no son intercambiables.

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
- ~~**SPEC.md §4 dice "React 18" pero el código usa React 19.3.0**~~ → **RESUELTO
  2026-09-29**: el dueño autorizó actualizar SPEC.md. §4 ahora dice "React 19 + Vite 8"
  y §10 registra la decisión. SPEC.md y el código vuelven a coincidir.
- **PowerShell rompe el flag `--template` de create-vite.**
  `npm create vite@latest <path> -- --template react-ts` ignora el flag (npm lo
  interpreta como config propia) y scaffoldea **vanilla**, no React, sin avisar.
  Usar siempre: `npx --yes create-vite@latest <path> --template react-ts`.
- **El typecheck cambia de comando entre workspaces.** Cliente: `tsc -b --noEmit`
  (project references). Backend: `tsc --noEmit` (tsconfig único). Usar el correcto
  según la carpeta.
- **El template de Vite ya no incluye `strict: true`.** Viene implícito en algunas
  configuraciones de Vite pero el `tsconfig.app.json` que genera create-vite actual
  **no lo declara**. Hay que añadirlo a mano, igual que los flags de AGENT.md.

---

## Historial de entradas

> Las entradas se agregan aquí en orden cronológico inverso (la más reciente arriba).

### 2026-09-29 — Actualización de SPEC.md §4 (React 19)
**Estado:** completada

**Qué se hizo:**
- SPEC.md §4: la fila Frontend pasó de "React 18 + Vite" a "React 19 + Vite 8".
- SPEC.md encabezado: `Última actualización: [fecha]` → `2026-09-29`.
- SPEC.md §10: se registren como decisiones cerradas React 19 y TypeScript unificado.

**Cómo se hizo:**
- Modificado: `docs/SPEC.md` (3 ediciones puntuales), `docs/MEMORY.md`.
- Editadas también las entradas previas de MEMORY.md y TASKLIST.md que decían que
  SPEC.md estaba desactualizado, para eliminar la contradicción.

**Por qué se hizo así:**
- El dueño autorizó explícitamente la edición de SPEC.md, que por norma requería
  autorización previa. Se hizo el cambio mínimo: solo lo que el código ya refleja.
- No se tocó la sección 5 (estructura de carpetas): la de `client/` sigue describiendo
  `index.html`, `vite.config.ts`, `tailwind.config.js` y `package.json`, pero ahora
  falta `tsconfig*.json` en el árbol documentado. Esa omisión es preexistente y
  corresponde a la tarea que inicialice el cliente con su toolchain completa.

**Impacto en otras tareas:**
- SPEC.md vuelve a ser fuente de verdad coherente con el código. Los agentes ya no
  deberían intentar "corregir" React 19 de vuelta a React 18.

**Pendientes / deuda técnica:**
- SPEC.md §5 no lista `client/tsconfig*.json` en el árbol de carpetas. Cosmético.

---

### 2026-09-29 — T-003 Client con Vite + React + TypeScript
**Estado:** completada

**Qué se hizo:**
- Scaffold de `client/` con Vite 8 + React 19 + TypeScript 5.9.3.
- `tsconfig` con project references y `strict` activado a mano.
- Estructura `src/` con las 7 carpetas vacías que pide SPEC §5.
- `App.tsx` mínimo con `<h1>Osito a la carta</h1>`.

**Cómo se hizo:**
- Archivos creados: `client/index.html`, `client/vite.config.ts`, `client/tsconfig.json`,
  `client/tsconfig.app.json`, `client/tsconfig.node.json`, `client/src/main.tsx`,
  `client/src/App.tsx`, `client/src/index.css`, más las carpetas
  `client/src/{pages,components,api,hooks,store,locales,lib}/`.
  Modificado: `client/package.json`.
- Dependencias agregadas (con autorización): `react`, `react-dom` (runtime);
  `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node` (dev). Todas justificadas por SPEC §4 y por el template oficial.
- Decisiones: ver "React 19 (desvío autorizado de SPEC.md §4)", "TypeScript unificado
  a 5.9.3" y "Project references en el tsconfig del cliente".

**Por qué se hizo así:**
- El scaffold se generó en un directorio temporal con `npx create-vite` y se copiaron
  solo los archivos necesarios, en vez de correr el comando dentro de `client/`.
  Motivo: el directorio ya contenía un `package.json` de T-001 y create-vite habría
  prompted para sobrescribirlo o abortado por directorio no vacío.
- Se descartaron del template `App.css`, `assets/`, `public/vite.svg`, `README.md`,
  `.oxlintrc.json` y el `.gitignore` propio del client: el `.gitignore` raíz ya cubre
  esos patrones, y oxlint entraría en conflicto con el ESLint + Prettier de T-006.
- `main.tsx` valida `document.getElementById('root')` con un guard explícito en vez
  del `!` non-null assertion del template, por coherencia con la regla de "sin `any`"
  y por `strict` real.

**Impacto en otras tareas:**
- T-004 modifica `client/vite.config.ts` para el proxy `/api`.
- T-005 reemplaza `client/src/index.css` por las directivas de Tailwind.
- T-006 añade ESLint + Prettier y los scripts raíz (`dev:client`, `lint`, `typecheck`).
- T-030 sustituye el texto hardcodeado de `App.tsx` por `t('app.title')` con i18n.
- Nota: `App.tsx` tiene hoy un texto visible hardcodeado, technically en contra de
  AGENT.md §2.3, pero es exactamente lo que pide el criterio de T-003. Se corrige en T-030.

**Pendientes / deuda técnica:**
- Las 7 carpetas de `src/` están vacías y **git no trackea directorios vacíos**.
  Si desaparecen al clonar, recrearlas antes de T-030.
- `index.css` tiene estilos base mínimos que T-005 reemplazará por completo.

---

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