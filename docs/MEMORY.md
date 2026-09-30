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
T-003 (client con Vite + React + TS), T-004 (proxy /api + endpoint de health),
T-005 (Tailwind CSS 4 en el cliente), T-006 (ESLint 10 + Prettier 3),
T-007 (logger pino con pino-pretty en desarrollo),
T-008 (validación de env con Zod), y el ajuste de `engines.node`
a `^20.19.0 || ^22.13.0 || >=24`.

**Estado del árbol:**

```
osito_a_la_carta/
├── server/
│   ├── package.json          # type: module, scripts dev/build/start/typecheck
│   ├── tsconfig.json         # strict + NodeNext
│   └── src/
│       ├── app.ts            # instancia Express + GET /api/health + listen
│       ├── logger.ts         # pino: pretty en dev, JSON en prod, nivel de env
│       └── config/
│           ├── index.ts      # barrel: reexporta env
│           └── env.ts        # validación Zod; process.exit(1) si falta algo
├── client/
│   ├── package.json          # dev/build/preview/typecheck, React 19
│   ├── tsconfig.json         # project references → app + node
│   ├── tsconfig.app.json     # strict + flags
│   ├── tsconfig.node.json    # strict, cubre vite.config.ts
│   ├── vite.config.ts        # plugin-react + tailwindcss() + proxy /api (:3000)
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx           # <h1 class="mt-10 text-center text-3xl font-bold">
│       ├── index.css          # @import 'tailwindcss'  (Tailwind 4, CSS-first)
│       └── pages/ components/ api/ hooks/ store/ locales/ lib/   (vacías)
├── shared/
│   ├── types.ts              # vacío
│   └── schemas.ts            # vacío
├── docs/                     # SPEC, AGENT, TASKLIST, PROMPTS, MEMORY
├── .prettierrc.json          # compartido: 2 espacios, single quotes, semi
├── .prettierignore           # excluye docs/ y README.md
├── node_modules/             # hoisteado por workspaces npm
├── package.json              # raíz, workspaces: ["server", "client"]
├── package-lock.json
├── .env.example
└── .gitignore
```

**Linting y formato:** ESLint 10 con flat config, tools en la raíz y
`eslint.config.js` separado en cada workspace. Prettier 3 con config único
compartido. Desde la raíz funcionan: `npm run lint`, `npm run lint:fix`,
`npm run format`, `npm run format:check`, `npm run typecheck`, `npm run dev`.

**Backend: ya arranca y responde.** `server/src/app.ts` hace `app.listen(PORT)` y expone
`GET /api/health` → `{ status: 'ok', timestamp }`. Todavía **no** hay validación de env con
Zod, así que `PORT` se lee directo de `process.env` con default `3000` (eso cambia en T-008).

**El proxy de Vite funciona.** Con ambos servidores arriba,
`http://localhost:5173/api/health` devuelve el mismo JSON que `http://localhost:3000/api/health`.

**Estilos:** Tailwind **4.3.3** vía plugin `@tailwindcss/vite`. No hay
`tailwind.config.js`, ni `postcss`, ni `autoprefixer`. El tema se configura con
`@theme` dentro de `client/src/index.css`. No existen las directivas `@tailwind`
de la versión 3.

**Comandos que sí funcionan hoy:**
- `cd server && npm run dev` — Express en `http://localhost:3000` (funciona)
- `cd server && npx tsc --noEmit` — typecheck
- `cd server && npm run build` — compila a `server/dist/`
- `cd server && npm start` — corre `dist/app.js`
- `cd client && npm run dev` — Vite en `http://localhost:5173` (funciona)
- `cd client && npx tsc -b --noEmit` — typecheck del cliente

**Para probar el flujo completo hacen falta las dos terminales:**
```bash
cd server && npm run dev   # terminal 1 → :3000
cd client && npm run dev   # terminal 2 → :5173
```

**Versiones instaladas (verificadas con `npm ls --workspaces`):**
react 19.3.0 · react-dom 19.3.0 · vite 8.3.1 · @vitejs/plugin-react 6.1.1 ·
typescript 5.9.3 (**una sola versión para todo el monorepo**) · express 5.2.1 ·
pino 9.14.0 · zod 3.25.76 · @types/node 22.20.4

**Variables de entorno:** `server/src/config/env.ts` valida con Zod **al importarse** y
hace `process.exit(1)` con un mensaje en español si algo falta. Usa
`process.loadEnvFile()` de Node 22, **no `dotenv`** (no está instalado).
- El `.env` vive en la **raíz** del proyecto, no en `server/`.
- Exporta `env` con `NODE_ENV`, `PORT` (ya `number`), `LOG_LEVEL`, `DATABASE_URL`,
  `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`,
  `MAILGUN_FROM` (objeto `{ raw, email }`), `CHEF_EMAIL`, `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`, más los derivados `MAILGUN_FROM_EMAIL` e `isProduction`.
- `app.ts` y `logger.ts` ya leen de `env`; ninguno toca `process.env` directamente.
- **En producción se rechazan los valores de ejemplo de `.env.example`**
  (marcadores: `tudominio`, `cambia-esto`, `changeme`, `change-me`, `placeholder`).
  En desarrollo se permiten a propósito, para poder arrancar recién clonado el repo.

**Logging:** `server/src/logger.ts` exporta una instancia de pino ya configurada.
- `env.isProduction` → transporte `pino-pretty` con `colorize`, hora `HH:MM:ss`.
- producción → **JSON puro**, sin transporte (pino-pretty no se carga).
- nivel leído de `env.LOG_LEVEL` (validado por Zod, default `info`).

**Pendientes de infraestructura:**
- El `package.json` raíz **no tiene script `test`**. T-093 (vitest en server) debe
  añadirlo, siguiendo el patrón de `lint`/`typecheck`.
- No hay `.env` real; solo `.env.example` en la raíz. T-008 validará las variables.

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

### 2026-09-29 — `listen` en `app.ts` (el módulo arranca al importarse)
**Contexto:** T-002 dejó `app.ts` sin `app.listen()` por requisito explícito de esa
tarea ("exporta una instancia de express, sin arrancar"). T-004 exige que el server
responda en `:3000`, y el script `dev` es `tsx watch src/app.ts`.
**Decisión:** el `listen` va **dentro de `app.ts`**, no en un `index.ts` separado.
`app.ts` sigue exportando `app` para que las pruebas de T-093 puedan importar la
instancia sin abrir un puerto.
**Alternativas consideradas:** (a) crear `src/index.ts` con el `listen` y apuntar el
script `dev` a él — más limpio por separación de responsabilidades, pero rompe el
criterio literal de T-004 ("en server/src/app.ts agrega la ruta") y añade un archivo
que SPEC §5 no contempla; (b) dejar el listen en `app.ts` — elegida.
**Motivo:** cumple el criterio de aceptación tal como está escrito y evita inventar
estructura no documentada en SPEC §5.
**Consecuencias:** **importar `app.ts` arranca un servidor como efecto secundario.**
Eso importa para T-093: los tests que importen `app` abrirán el puerto. Si molesta,
la extracción a `index.ts` es el camino natural, pero requiere actualizar SPEC §5.
Además, `PORT` se lee de `process.env` sin validar hasta T-008.

### 2026-09-29 — Tailwind 4 con plugin de Vite (CSS-first, sin config.js)
**Contexto:** el enunciado de T-005 pedía el setup clásico de Tailwind v3:
`tailwind.config.js` con `content: ['./src/**/*.{ts,tsx}']`, `postcss` + `autoprefixer`
y las directivas `@tailwind base/components/utilities`. La versión vigente es
**Tailwind 4.3.3** (la 3.4.19 está bajo el tag `v3-lts`, en mantenimiento).
**Decisión:** se instala **tailwindcss 4.3.3 + @tailwindcss/vite 4.3.3**, con
configuración CSS-first: `@import 'tailwindcss'` en `index.css` y tokens de tema
vía `@theme` dentro del mismo CSS. **Autorizado explícitamente por el dueño.**
SPEC.md §4 no fijaba versión ("Tailwind CSS"), así que no hubo que modificarlo.
**Alternativas consideradas:** (a) Tailwind 3.4.19 literal al enunciado, descartado
porque shadcn/ui ya considera legacy el modelo de v3 y obligaría a migrar en T-035;
(b) híbrido v4 + config.js vía `@config`; (c) v4 CSS-first — elegida.
**Motivo:** el plugin oficial de Vite hace el build más rápido, elimina la capa de
PostCSS por completo y es el camino que shadcn/ui prueba de forma nativa.
**Consecuencias:**
- **No existe `client/tailwind.config.js`**, pero SPEC.md §5 lo documenta en el árbol
  de carpetas. Discrepancia pendiente de corregir en SPEC (requiere autorización).
- **No hay `postcss` ni `autoprefixer`** instalados, y no hacen falta.
- **Las directivas `@tailwind` ya no existen** en v4. Si un agente las escribe,
  el CSS se rompe silenciosamente.
- Extender el tema (colores, fuentes) se hace con `@theme { --color-marca: ... }`
  en `index.css`, no en un objeto JS.
- La detección automática de clases escanea el proyecto, pero **las cadenas
  construidas dinámicamente** (`` `text-${color}-500` ``) no se detectan. Usar
  siempre clases completas.

### 2026-09-30 — Rechazo de placeholders de `.env.example` solo en producción
**Contexto:** tras T-008 se detectó que los valores de ejemplo de `.env.example`
("cambia-esto-por-un-secreto-...") tienen más de 32 caracteres, así que pasaban
la validación de longitud y el servidor arrancaba en producción con secretos
públicos y conocidos. El dueño pidió añadir el rechazo.
**Decisión:** un `.refine()` por variable sensible comprueba si el valor contiene
alguno de los marcadores de `PLACEHOLDER_MARKERS` (`tudominio`, `cambia-esto`,
`changeme`, `change-me`, `placeholder`, `no-reply@tudominio.com`), comparando en
minúsculas. **Solo se activa cuando `NODE_ENV === 'production'`.**
**Alternativas consideradas:** (a) rechazar placeholders siempre — descartada, rompe
el arranque local recién clonado el repo, que es la forma más común de empezar;
(b) un `.superRefine()` único sobre todo el objeto en vez de un `.refine()` por
variable — se descartó por legibilidad: el error por variable es más accionable.
**Motivo:** el riesgo real es desplegar con secretos de ejemplo, no developing en
local. Bloquear el desarrollo para proteger la producción sería un mal intercambio.
**Consecuencias:**
- Los `.refine()` se evalúan en **el orden del schema**, así que el mensaje de
  longitud mínima puede no aparecer si el placeholder salta primero. Aceptable.
- **`DATABASE_URL` no tiene este refine.** No es un secreto y su valor de ejemplo
  (`./osito.db`) es inofensivo.
- `MAILGUN_FROM` se comprueba sobre `value.raw` (el string original con el nombre),
  no sobre el email extraído, porque el placeholder está en el dominio.
- Si se añade una variable sensible nueva, hay que acordarse del `.refine()`.
  La lista de marcadores está centralizada para hacerlo fácil.

### 2026-09-30 — `process.loadEnvFile()` en vez de `dotenv`
**Contexto:** T-008 pide validar variables de entorno con Zod. Falta decidir quién
lee el `.env`. La convención habitual es `dotenv`, que no está instalado.
**Decisión:** usar **`process.loadEnvFile()`**, una API nativa de Node (estable desde
Node 20.12), en lugar de agregar `dotenv` como dependencia.
**Alternativas consideradas:** (a) instalar `dotenv` — descartada, agrega una
dependencia externa para algo que Node ya resuelve; (b) `--env-file` de la CLI —
descartada, obliga a recordar el flag en cada script y no funciona con `node dist/`;
(c) `process.loadEnvFile()` — elegida.
**Motivo:** cero dependencias nuevas, que es una regla explícita del proyecto.
**Consecuencias:**
- **El `.env` está en la raíz del proyecto**, no en `server/`. La ruta se resuelve con
  `import.meta.url` subiendo tres niveles, de modo que funciona igual desde `src/` en
  desarrollo y desde `dist/` compilado.
- **Hay que comprobar `existsSync` antes de llamar**, porque `process.loadEnvFile`
  lanza una excepción si el archivo no existe.
- **No sobreescribe variables ya definidas en `process.env`.** Las variables reales del
  sistema tienen prioridad sobre el `.env`, que es justo lo que se quiere en despliegue.
- En los tests (T-093) hay que preparar el entorno **antes** de importar nada que
  dependa de `env`, porque el módulo hace `process.exit(1)` si falta una variable.

### 2026-09-30 — `MAILGUN_FROM` acepta email simple y `Nombre <email>`
**Contexto:** el enunciado de T-008 dice `MAILGUN_FROM (string, email)`, pero el
`.env.example` de T-001 tiene `MAILGUN_FROM=Osito a la carta <no-reply@tudominio.com>`.
Verificado: `z.string().email()` **rechaza** ese valor ("Invalid email").
**Decisión:** el schema acepta **ambos formatos** mediante un `refine` + `transform`.
Exporta `MAILGUN_FROM` como objeto `{ raw, email }`, más el derivado
`MAILGUN_FROM_EMAIL`. **Autorizado explícitamente por el dueño.**
**Alternativas consideradas:** (a) `z.string().email()` estricto y corregir
`.env.example` a `no-reply@tudominio.com`; (b) aceptar ambos formatos con solo
`MAILGUN_FROM`; (c) aceptar ambos y exportar el email derivado — elegida.
**Motivo:** Mailgun acepta el formato con nombre, y es lo que hace que el correo al
chef aparezca como "Osito a la carta" en lugar de una dirección cruda. Descartar el
formato con nombre perdería la marca en la notificación más importante del producto.
**Consecuencias:**
- **T-060 (Mailgun) debe enviar `env.MAILGUN_FROM.raw`**, no `.email`: Mailgun espera
  el string completo `"Nombre <email>"`.
- `env.MAILGUN_FROM_EMAIL` está disponible para cuando haga falta solo la dirección.
- El schema **no** acepta un `Nombre <email>` mal formado: el `refine` extrae lo que hay
  entre `<` y `>` y lo valida como email de verdad.

### 2026-09-30 — ESLint 10 flat config con tools en la raíz y configs por workspace
**Contexto:** T-006 pide ESLint + Prettier en `server/` y `client/` con config de
Prettier compartida. La versión vigente de ESLint es la **10**, que solo soporta
**flat config** (`eslint.config.js`); el legacy `.eslintrc.json` ya no es viable.
**Decisión:**
- Las **herramientas** (eslint, @eslint/js, typescript-eslint, globals,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, prettier) se instalan
  **una sola vez en el `package.json` raíz**.
- El **flat config va duplicado**: `server/eslint.config.js` usa `globals.node`;
  `client/eslint.config.js` usa `globals.browser` más los plugins de React
  (`react-hooks` en `recommended` y `react-refresh/only-export-components` como warn).
- **Prettier tiene un único config** en la raíz (`.prettierrc.json`): 2 espacios,
  single quotes, semi, `printWidth: 80`, `trailingComma: 'all'`, `endOfLine: 'lf'`.
- Perfil `recommended` (no `strict`, no `recommended-type-checked`).
- Scripts raíz: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `dev`,
  `dev:server`, `dev:client`, `build`. Los agregadores usan
  `npm run <script> --workspaces --if-present`.
**Alternativas consideradas:** (a) instalar las tools por duplicado en cada workspace:
descartado, duplica versiones y capa de dependencias sin ganancia; (b) un único
`eslint.config.js` en la raíz con ambos entornos: descartado, los globals de Node y
de browser no deben mezclarse en un mismo contexto; (c) perfil `recommended-type-checked`:
descartado por fricción con los flags estrictos de T-002/T-003.
**Motivo:** con npm workspaces las tools se hoistean a la raíz igualmente; declararlas
una sola vez evita el desfase de versiones. La duplicación de `eslint.config.js` es
deliberada y necesaria: cada workspace lintea un entorno distinto.
**Consecuencias:**
- **El linting no conoce los flags de `tsconfig`.** Con el perfil `recommended` no se
  lee `tsconfig.json`, así que `noUncheckedIndexedAccess` y compañía solo los
  vigila `tsc`. ESLint y TypeScript son complementarios, no intercambiables.
- **`.prettierignore` excluye `docs/` y `README.md` a propósito.** Sin eso, Prettier
  reescribe SPEC.md, TASKLIST.md y MEMORY.md enteros, generando diffs enormes y
  modificando SPEC.md sin autorización. No quitar esa exclusión.
- `npm run dev` en la raíz intercala la salida de server y client. Para salidas
  separadas usar `npm run dev:server` y `npm run dev:client` en dos terminales.
- **La versión de Node declarada en la raíz es `^20.19.0 || ^22.13.0 || >=24`**, fijada
  por el dueño el 2026-09-30. No relajar a `>=20`: ESLint 10 no arranca en 20.0-20.18.
  ESLint es la restricción más estricta del toolchain, por encima de Vite 8.

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
- ~~**El backend todavía no sirve nada**~~ → **RESUELTO en T-004**: ya hace `listen`
  y expone `GET /api/health`. Ver "Estado actual del proyecto".
- **Los imports del backend necesitan extensión `.js`** (`from './logger.js'`),
  por `moduleResolution: NodeNext`. Sin ella `tsc --noEmit` **pasa** y el runtime
  falla con `ERR_MODULE_NOT_FOUND`. El typecheck no detecta este error.
- **`PORT` no está validado todavía.** Se lee de `process.env` con default `3000`.
  T-008 lo sustituye por `env.PORT` (Zod). No confiar en el default para producción.
- **`strictPort: true` en el server de Vite es intencional.** Sin él Vite cae a
  `5174`, `5175`... si el puerto está ocupado, y el proxy `/api` y cualquier test
  que apunte a `:5173` fallarían de forma confusa y difícil de diagnosticar.
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
- **Tailwind 4 no usa `tailwind.config.js` ni directivas `@tailwind`.** Es CSS-first:
  `@import 'tailwindcss'` y `@theme` dentro del CSS. SPEC.md §5 todavía lista
  `client/tailwind.config.js` en el árbol de carpetas: **esa línea está desactualizada.**
  No instalar `postcss`/`autoprefixer` salvo que una dependencia los exija.
- **Las clases de Tailwind construidas por interpolación no se detectan.**
  `` `text-${color}-500` `` no genera CSS. Escribir siempre la clase completa.
  Esto aplica a T-035 (shadcn/ui) y a cualquier badge de color por estado de pedido.
- **ESLint 10 no usa `.eslintrc.json`.** Solo flat config (`eslint.config.js`).
  Buscar un `eslint.config.js` en el workspace que se esté tocando: hay uno por
  paquete, no uno global.
- **`npm run dev` en la raíz intercala la salida de los dos servidores.** Si se
  necesita verlos por separado, usar `npm run dev:server` y `npm run dev:client`
  en terminales distintas.
- **No quitar `docs/` de `.prettierignore`.** Sin esa exclusión, `npm run format`
  reescribe SPEC.md, TASKLIST.md y MEMORY.md completos, y SPEC.md no puede
  modificarse sin autorización explícita del dueño.
- **El linting no ve los flags de `tsconfig`.** El perfil `recommended` no lee el
  tsconfig, así que `noUncheckedIndexedAccess` y el resto solo los comprueba `tsc`.
  Un archivo puede pasar ESLint y fallar `tsc`, o al revés: correr ambos.
- **`pino-pretty` es devDependency y se activa por `NODE_ENV`.** Si producción corre
  sin `NODE_ENV=production`, el logger intenta cargar un paquete que no está
  instalado y el server muere al arrancar. T-094 debe fijar `NODE_ENV=production`
  en el ecosystem de PM2.
- **El `transport` de pino escribe por un worker thread.** En tests, el output puede
  aparecer después del assertion y contaminar la salida de vitest. Para tests,
  forzar `NODE_ENV=production` o inyectar un `destination` en memoria.
- **`LOG_LEVEL` con un valor inválido hace morir a pino.** Por eso `logger.ts` valida
  contra una lista explícita y cae a `info`. No quitar esa validación al migrar a
  `env.LOG_LEVEL` en T-008.
- ~~Esa validación fue movida a Zod en T-008~~ → **RESUELTO**: `env.LOG_LEVEL` es un
  `z.enum` de los 7 niveles reales, y `logger.ts` ya no lee `process.env`. Un valor
  inválido ahora es un error de arranque, no un fallback silencioso a `info`.
- **`process.loadEnvFile` lanza si el archivo no existe.** Por eso `config/env.ts`
  comprueba con `existsSync` primero. No borrar ese `if`.
- **`config/env.ts` hace `process.exit(1)` al importarse.** Cualquier test que importe
  algo que dependa de `env` puede matar el proceso de vitest entero si falta una
  variable. Preparar el entorno **antes** de los imports.
- **El `.env` está en la raíz, no en `server/`.** Buscarlo en `server/.env` es futile.
- **Zod devuelve "Required" en inglés por defecto.** Los mensajes de arranque están
  en español gracias a `required_error`/`message` personalizados en `config/env.ts`.
  Añadir una variable nueva sin esos campos reintroduce el mensaje en inglés.
- **`.refine(p)` en Zod pasa cuando `p` devuelve `true`.** El predicado debe devolver
  `true` para que el valor sea **válido**, no para rechazarlo. Por eso en
  `config/env.ts` existen las dos funciones: `hasPlaceholder()` detecta el valor malo
  y `rejectPlaceholder()` lo invierte para usarla como predicado. Confundir las dos
  invierte el guard en silencio: el schema acepta exactamente lo que debería rechazar,
  **sin error de tipos y sin fallo de test** si no se prueba el caso negativo.
  **Siempre probar el caso que debe fallar, no solo el que debe pasar.**
- **`tsx watch` no reinicia al cambiar `.env`.** Solo vigila los archivos fuente de
  `src/`. Tras editar el `.env` hay que reiniciar el proceso a mano, o el server
  sigue usando los valores antiguos.

---

## Historial de entradas

> Las entradas se agregan aquí en orden cronológico inverso (la más reciente arriba).

### 2026-09-30 — Guard de placeholders en `.env` (endurecimiento de T-008)
**Estado:** completada

**Qué se hizo:**
- Rechazo de los valores de ejemplo de `.env.example` al arrancar en producción.
- Sin dependencias nuevas, sin archivos nuevos: todo dentro de `config/env.ts`.

**Cómo se hizo:**
- Modificado: `server/src/config/env.ts` (constantes `PLACEHOLDER_MARKERS`,
  `isProductionEnv`, `hasPlaceholder`, `rejectPlaceholder` y un `.refine()` por
  variable sensible).
- Decisión: "Rechazo de placeholders de `.env.example` solo en producción".

**Por qué se hizo así:**
- Los placeholders de `.env.example` tienen >32 caracteres, así que pasaban la
  validación de longitud de `JWT_SECRET`. El servidor arrancaba en producción con
  secretos públicos.
- **La primera implementación estaba invertida y no hacía nada.** Escribí
  `rejectPlaceholder` devolviendo `true` cuando detectaba el placeholder, y lo usé
  como predicado de `.refine()`. En Zod, `.refine(p)` acepta cuando `p` es `true`,
  así que el guard **aceptaba exactamente lo que debía rechazar**. Pasaba el typecheck
  y no daba error de sintaxis: solo se detectaba probando el caso negativo.
  Se corrigió separando `hasPlaceholder()` (detecta) de `rejectPlaceholder()`
  (invierte para el predicado).
- El guard se limita a producción a propósito: en desarrollo los valores de ejemplo
  son necesarios para arrancar recién clonado el repo, y no son un riesgo real.

**Impacto en otras tareas:**
- T-093 (tests) hereda el `process.exit(1)`: si los tests corren con `NODE_ENV=production`
  y hay placeholders, el proceso muere. Usar `NODE_ENV=test` en el entorno de test.
- T-094 (PM2) arranca con `NODE_ENV=production`, así que el guard estará activo en el
  VPS: es exactamente la protección buscada.
- T-093/T-094: al añadir variables sensibles nuevas, acordarse del `.refine()`.

**Pendientes / deuda técnica:**
- `DATABASE_URL` no tiene guard de placeholder (no es secreto, y su valor de ejemplo
  es inofensivo). Si algún día la ruta apunta a algo sensible, revisarlo.
- La lista `PLACEHOLDER_MARKERS` es una lista negra. Un placeholder con otra
  redacción pasaría el filtro. Es aceptable para este alcance; una lista blanca
  (rechazar cualquier valor que no tenga forma de secreto) sería más robusta.

---

### 2026-09-30 — T-008 Validación de variables de entorno con Zod
**Estado:** completada

**Qué se hizo:**
- `server/src/config/env.ts` con schema Zod de 12 variables, carga del `.env` y
  salida con mensaje claro si falta algo.
- `app.ts` y `logger.ts` dejan de leer `process.env` y consumen `env`.
- `config/index.ts` deja de ser un placeholder y pasa a ser un barrel.

**Cómo se hizo:**
- Creado: `server/src/config/env.ts`.
- Modificados: `server/src/config/index.ts`, `server/src/app.ts`, `server/src/logger.ts`.
- **Sin dependencias nuevas**: `process.loadEnvFile()` de Node 22 en lugar de `dotenv`.
- Decisiones: "process.loadEnvFile() en vez de dotenv" y "MAILGUN_FROM acepta email
  simple y `Nombre <email>`".

**Por qué se hizo así:**
- `dotenv` habría sido la dependencia obvia, pero el proyecto prioriza no agregar
  dependencias sin necesidad y Node ya resuelve esto.
- La ruta del `.env` se resuelve con `import.meta.url` subiendo tres niveles, para que
  funcione igual en `src/` (tsx) y en `dist/` (node compilado), sin depender del cwd.
- Los mensajes de Zod se personalizan al español porque la salida de arranque es lo
  primero que ve quien despliega, y "Required" en inglés encajaba mal.
- `PORT` usa `z.coerce.number()`, así que llega como `number` y no como string. Todos
  los consumidores lo tratan como número.

**Impacto en otras tareas:**
- T-041/T-042 (JWT) usarán `env.JWT_SECRET` y `env.JWT_REFRESH_SECRET` (min 32 chars
  ya garantizado por el schema).
- T-060 (Mailgun) debe enviar **`env.MAILGUN_FROM.raw`**, no `.email`.
- T-061 (Telegram) usará `env.TELEGRAM_BOT_TOKEN` y `env.TELEGRAM_CHAT_ID`.
- T-010 (Drizzle) usará `env.DATABASE_URL` como ruta del archivo SQLite.
- T-093 (tests) **debe preparar el entorno antes de importar nada** que dependa de
  `env`, o el `process.exit(1)` matará vitest.
- T-094 (PM2) deberá pasar las variables por el `env` de PM2 o por un `.env` real en
  la raíz; como `loadEnvFile` no sobreescribe `process.env`, las variables de PM2 ganan.

**Pendientes / deuda técnica:**
- No hay `.env` en el repositorio (correcto: está en `.gitignore`). Hay que crearlo
  con `cp .env.example .env` antes de arrancar, y con secretos reales.
- Los secretos del `.env.example` son marcadores de posición: el backend no valida que
  no sean los de ejemplo, solo que tengan 32 caracteres. Podría añadirse un `.refine`
  que rechace valores conocidos de ejemplo; no se hizo por no inventar alcance.
- No hay validación cruzada (p. ej. que `MAILGUN_FROM` y `CHEF_EMAIL` no sean el mismo
  dominio en producción). Se considera sobreusado para esta fase.

---

### 2026-09-30 — T-007 Logger con pino
**Estado:** completada

**Qué se hizo:**
- `server/src/logger.ts` configurado: pino-pretty con colores en desarrollo,
  JSON puro en producción, nivel leído de `LOG_LEVEL` con default `info`.
- Validación de `LOG_LEVEL` contra la lista de niveles reales de pino.

**Cómo se hizo:**
- Modificado: `server/src/logger.ts`. **`server/src/app.ts` no se tocó**: ya llamaba
  a `logger.info('Server starting on port <PORT>')` desde T-004.
- Sin archivos nuevos y sin dependencias nuevas: `pino` y `pino-pretty` ya estaban
  instaladas en T-002 (esta tarea termina de pagar esa decisión).
- Decisiones:
  - Transporte `pino-pretty` solo si `NODE_ENV !== 'production'`, con spread
    condicional del objeto de opciones. En producción no se carga.
  - `pino-pretty` se referencia **por string** en `transport.target`, no se importa.
    Es lo que exige el API de pino: el worker lo resuelve en runtime.
  - `LOG_LEVEL` se valida con un type guard contra
    `trace|debug|info|warn|error|fatal|silent`; si no coincide, se usa `info`.

**Por qué se hizo así:**
- `app.ts` ya tenía la llamada al logger desde T-004 porque ese criterio exigía
  "loggear al arrancar". Configurar `logger.ts` fue suficiente; no hizo falta tocar
  el servidor.
- El fallback a `info` evita que un typo en `LOG_LEVEL` (p. ej. `LOG_LEVEL=debugg`)
  tumbe el proceso al arrancar con un error de pino poco descriptivo. Un log con
  nivel equivocado es molesto; un server que no arranca, no.
- Se usa el nivel por defecto `info` en vez de `debug` porque `debug` en producción
  puede filtrar datos de pedidos.

**Impacto en otras tareas:**
- T-008 debe leer `env.LOG_LEVEL` de Zod en lugar de `process.env.LOG_LEVEL`, pero
  **conservar la validación contra la lista de niveles**. `config/env.ts` puede
  reutilizar el type guard o declarar su propio enum de Zod; lo que no debe hacer
  es aceptar cualquier string.
- T-093 (tests) debe tener en cuenta que `transport` de pino usa un worker thread:
  el output puede llegar fuera de orden y contaminar la salida de vitest.
- T-094 (PM2) **debe** fijar `NODE_ENV=production` en el ecosystem, porque
  `pino-pretty` es devDependency y fallaría al cargarse en un despliegue real.
- T-092 (manejo de errores) usará este logger para el middleware de errores.

**Pendientes / deuda técnica:**
- No hay request id ni correlación entre logs. En Fase 8 (panel del chef) podría
  ser útil para rastrear un pedido concreto en los logs.
- `logger.ts` lee `process.env` directamente en lugar de pasar por `config/env.ts`,
  que es deuda temporal hasta T-008.
- Sigue sin existir un middleware que loggee cada request (AGENT.md no lo pide, así
  que no se añadió por no inventar alcance).

---

### 2026-09-30 — Ajuste de `engines.node` en el package.json raíz
**Estado:** completada

**Qué se hizo:**
- `engines.node` pasó de `">=20"` a `"^20.19.0 || ^22.13.0 || >=24"`.

**Cómo se hizo:**
- Modificado: `package.json` (raíz), un solo campo.
- Sin archivos nuevos, sin dependencias nuevas, sin cambios de código.

**Por qué se hizo así:**
- T-006 dejó anotada la discrepancia: el proyecto declaraba `>=20`, pero ESLint 10
  exige `^20.19.0 || ^22.13.0 || >=24`. Con Node 20.0-20.18 el linting no funcionaría.
- Se adoptó **la restricción de ESLint**, la más estricta del toolchain, en vez de la
  de Vite 8 (`^20.19.0 || >=22.12.0`). Declarar el mínimo real del toolchain completo
  es más útil que declarar el de una sola herramienta: si Vite se actualiza subiendo
  su mínimo, el `engines` Warn pero no rompe.
- Alternativa descartada: mantener `>=20` y confiar en que nadie use una versión
  antigua. Se eligió declarar el requisito real para que `npm install` avise.

**Impacto en otras tareas:**
- Ninguna tarea del TASKLIST cambia. T-094 (despliegue PM2 en VPS) sí se ve afectada:
  el VPS debe correr Node 20.19+, 22.13+ o 24+. Si el VPS está en Node 20.11, habrá
  que actualizar Node **antes** de desplegar, no durante.

**Pendientes / deuda técnica:**
- Ninguna.

---

### 2026-09-30 — T-006 ESLint + Prettier en server y client
**Estado:** completada

**Qué se hizo:**
- ESLint 10 con flat config en ambos workspaces (Node en server, browser + plugins React en client).
- Prettier 3 con configuración compartida única en la raíz.
- 9 scripts nuevos en el `package.json` raíz, incluidos `lint` y `format`.

**Cómo se hizo:**
- Archivos creados: `.prettierrc.json`, `.prettierignore`, `server/eslint.config.js`,
  `client/eslint.config.js`.
- Modificados: `package.json` (raíz), `server/package.json`, `client/package.json`
  (scripts `lint` y `format` en cada workspace).
- Dependencias (con autorización del dueño), todas en la raíz: `eslint@^10.11.0`,
  `@eslint/js@^10.0.1`, `typescript-eslint@^8.71.0`, `globals@^17.12.0`,
  `eslint-plugin-react-hooks@^7.1.1`, `eslint-plugin-react-refresh@^0.5.7`,
  `prettier@^3.9.9`. Las peer deps se verificaron **antes** de instalar.
- Decisión: ver "ESLint 10 flat config con tools en la raíz y configs por workspace".

**Por qué se hizo así:**
- ESLint 10 solo soporta flat config, así que `.eslintrc.json` no era una opción.
- Las tools van en la raíz porque npm workspaces las hoistea igualmente; declararlas
  en los dos paquetes solo generaría desfase de versiones.
- `eslint.config.js` está duplicado porque server y client lintean entornos distintos
  (`globals.node` vs `globals.browser` + React). El enunciado pedía "el mismo Prettier",
  no "el mismo ESLint": Prettier sí es único y compartido.
- Se eligió `recommended` sobre `recommended-type-checked` para no duplicar el trabajo
  de `tsc` ni pelearse con los flags estrictos ya fijados en T-002 y T-003.

**Impacto en otras tareas:**
- AGENT.md §9 exige `npm run lint` y `npm run typecheck` antes de cerrar cada tarea:
  ambos existen y funcionan desde la raíz a partir de ahora.
- T-035 (shadcn/ui) genera componentes en archivos nuevos; el lint ya los revisará
  cuando se creen, sin configuración adicional.
- T-093 debe añadir el script `test` al `package.json` raíz, siguiendo el patrón
  `--workspaces --if-present` de `lint` y `typecheck`.
- T-090 (PWA) y T-091 (responsive) no requieren cambios de configuración de lint.

**Pendientes / deuda técnica:**
- ~~`engines.node` decía `>=20`~~ → **RESUELTO el 2026-09-30**: ahora es
  `^20.19.0 || ^22.13.0 || >=24`. Ver la entrada de ese ajuste más abajo.
- No hay regla de lint que prohíba `console.log` en el backend, que AGENT.md §4
  prohíbe explícitamente. T-007 podría añadir `no-console` cuando se cierre el logger.
- No hay `eslint-plugin-import` ni reglas de orden de imports, aunque AGENT.md §2.1
  pide "imports ordenados: externos → internos → relativos". Se aplica a mano.

---

### 2026-09-29 — T-005 Tailwind CSS 4 en el cliente
**Estado:** completada (confirmación visual del dueño pendiente)

**Qué se hizo:**
- Tailwind 4.3.3 instalado con el plugin `@tailwindcss/vite`.
- `index.css` reducido a `@import 'tailwindcss'`.
- `App.tsx` con `<h1 class="mt-10 text-center text-3xl font-bold">Osito a la carta</h1>`.

**Cómo se hizo:**
- Modificados: `client/vite.config.ts` (se añadió `tailwindcss()` al array de plugins),
  `client/src/index.css` (sustituido por completo), `client/src/App.tsx`,
  `client/package.json`. Sin archivos nuevos.
- Dependencias agregadas (con autorización del dueño): `tailwindcss@^4.3.3` y
  `@tailwindcss/vite@^4.3.3`, ambas devDependencies. Ambas justificadas por SPEC §4.
- Decisión: ver "Tailwind 4 con plugin de Vite (CSS-first, sin config.js)".

**Por qué se hizo así:**
- El enunciado describía el setup de Tailwind v3, que ya no es el vigente. Se optó por
  la versión 4 con autorización explícita en lugar de fijar una versión en mantenimiento.
- Las clases se ordenaron como `mt-10 text-center text-3xl font-bold` (layout, luego
  tipografía) para que el criterio de aceptación sea legible de un vistazo.

**Impacto en otras tareas:**
- T-035 (shadcn/ui) debe usar el esquema CSS-first: los tokens del tema se redefinen
  con `@theme` en `index.css`, no en un `tailwind.config.js`. Es el punto de mayor
  fricción probable de todo el proyecto.
- T-091 (responsive) tiene todas las utilities disponibles desde ahora.
- T-006 (ESLint/Prettier) no se ve afectado; no hay configuración de PostCSS que mantener.

**Pendientes / deuda técnica:**
- **SPEC.md §5 documenta `client/tailwind.config.js`, que ya no existe con Tailwind 4.**
  Corregir SPEC requiere autorización del dueño.
- `App.tsx` sigue con el texto hardcodeado, sin pasar por i18n. Esto viola AGENT.md §2.3
  pero es lo que pide el criterio de T-005; se corrige en T-030.
- El tema de Tailwind está sin personalizar: sin colores de marca, sin fuentes.
  Se definirá con `@theme` cuando se conozca la identidad visual.

---

### 2026-09-29 — T-004 Proxy de Vite + endpoint de health
**Estado:** completada

**Qué se hizo:**
- Proxy `/api` → `http://localhost:3000` en el server de Vite.
- Ruta `GET /api/health` en `server/src/app.ts` que devuelve
  `{ status: 'ok', timestamp: <ISO> }`.
- `app.listen(PORT)` para que el backend quede accesible.
- Log de arranque con pino: `Server starting on port 3000`.

**Cómo se hizo:**
- Modificados: `client/vite.config.ts`, `server/src/app.ts`. Sin archivos nuevos
  y sin dependencias nuevas.
- Decisiones: ver "listen en app.ts (el módulo arranca al importarse)" en la sección
  de decisiones arquitectónicas.
- `PORT` se lee de `process.env.PORT ?? '3000'` sin Zod; la validación llega en T-008.
- `strictPort: true` para que Vite no caiga a otro puerto si `:5173` está ocupado.

**Por qué se hizo así:**
- El `listen` contradice explícitamente lo que T-002 pedía ("sin arrancar"), pero sin
  él el criterio de T-004 (server en `:3000`) es imposible. T-004 prevalece.
- Se puso la ruta directamente en `app.ts` porque así lo pide el enunciado de T-004.
  T-009 la moverá a `src/modules/health/health.routes.ts` con su propio router, que
  es donde debe vivir según AGENT.md §2.2.
- `changeOrigin: true` incluido desde el inicio: hoy es inocuo, pero hace falta cuando
  se validen orígenes en el backend.

**Impacto en otras tareas:**
- T-007 ajusta el nivel y el formato del log de arranque.
- T-008 sustituye `process.env.PORT` por `env.PORT` validado con Zod.
- T-009 extrae la ruta de `app.ts` al módulo `health` y añade `uptime` y `version`.
- T-005 y T-035 no se ven afectados; el proxy no interfiere con HMR.
- T-093 debe tener en cuenta que importar `app.ts` abre el puerto 3000.

**Pendientes / deuda técnica:**
- `PORT` sin validar: si alguien exporta `PORT=abc`, `app.listen` falla con una
  excepción poco descriptiva. T-008 lo resuelve.
- La ruta vive en `app.ts` y no en un router por módulo. Es deuda temporal
  hasta T-009.
- `app.listen` sin manejar `EADDRINUSE` ni apagado limpio (SIGTERM/SIGINT).
  Relevante para T-094 (PM2), que necesitará un `process.on('SIGTERM')`.

---

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