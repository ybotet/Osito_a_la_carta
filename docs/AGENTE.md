# AGENTE.md — Guía de trabajo para agentes

> Este archivo define **cómo se trabaja** en el proyecto "Osito a la carta".
> Todo agente debe leerlo completo antes de tocar código.
> Última actualización: [fecha]

---

## 0. Antes de empezar cualquier tarea

Checklist obligatorio:

1. Lee `docs/SPEC.md` completo.
2. Lee `docs/TASKLIST.md` y ubica la tarea que te toca.
3. Revisa el código existente en las carpetas relevantes (no asumas nada).
4. Revisa `docs/AGENTE.md` (este archivo) si tienes dudas de convenciones.
5. Si algo contradice `SPEC.md`, **detente y pregunta** antes de escribir código.

---

## 1. Principios de trabajo

- **Una tarea a la vez.** No mezclar cambios de varias tareas en un mismo commit.
- **Cambios pequeños y verificables.** Si una tarea toca más de 5 archivos, divídela primero.
- **No inventar dependencias nuevas** sin justificarlo y sin autorización.
- **No reabrir decisiones cerradas** en `SPEC.md` sección 10.
- **No refactorizar código no relacionado** con la tarea asignada.
- **No dejar código comentado** ni `TODO` sueltos: si algo queda pendiente, va a `TASKLIST.md`.

---

## 2. Convenciones de código

### 2.1 TypeScript

- `strict: true` siempre.
- Nunca usar `any`. Si el tipo es desconocido, usar `unknown` + validación Zod.
- Preferir `type` sobre `interface` (salvo cuando se necesita extensión).
- Nombres de archivos en `kebab-case`.
- Componentes React en `PascalCase`.
- Funciones y variables en `camelCase`.
- Constantes en `SCREAMING_SNAKE_CASE`.
- Imports ordenados: externos → internos absolutos → relativos.

### 2.2 Backend (`server/`)

Cada módulo en `src/modules/<feature>/` con esta estructura:

```
<feature>/
├── <feature>.routes.ts       # Definición de rutas Express
├── <feature>.service.ts      # Lógica de negocio
├── <feature>.repository.ts   # Acceso a datos (Drizzle)
└── <feature>.schema.ts       # Esquemas Zod (request/response)
```

- Las rutas **no** contienen lógica de negocio, solo orquestan.
- Los servicios **no** acceden directamente a la BD, usan el repositorio.
- Los repositorios **no** conocen Express, solo devuelven datos.
- Toda entrada de request se valida con Zod antes de llegar al servicio.
- Los errores se lanzan como clases propias (`AppError`, `NotFoundError`, etc.).

### 2.3 Frontend (`client/`)

```
src/
├── pages/          # Una página = una ruta
├── components/     # Componentes reutilizables
│   └── ui/         # Componentes base (shadcn/ui)
├── api/            # Funciones de llamada al backend
├── hooks/          # Hooks personalizados
├── store/          # Stores de Zustand
├── locales/        # Archivos de traducción
└── lib/            # Utilidades
```

- Cada página vive en su propia carpeta si tiene subcomponentes.
- Los componentes no hacen fetch directo: usan hooks de TanStack Query.
- Las llamadas a la API viven en `src/api/` y devuelven tipos de `shared/`.
- **Ningún texto visible hardcodeado**: siempre `t('clave')`.

### 2.4 Base de datos

- Esquema en `server/src/db/schema.ts`.
- Migraciones generadas con `drizzle-kit generate`.
- **Nunca modificar migraciones ya aplicadas.** Si hay que corregir algo, se crea una nueva.
- Los nombres de tablas en plural, snake_case (`users`, `dishes`, `order_items`).

### 2.5 i18n

- Claves de traducción en `camelCase` y agrupadas por dominio:
  ```json
  {
    "menu": { "title": "...", "addToCart": "..." },
    "cart": { "empty": "..." }
  }
  ```
- Toda clave nueva debe existir en los **3 idiomas** antes de cerrar la tarea.
- Si falta una traducción al ruso, dejar el valor en inglés y marcar en `TASKLIST.md`.

### 2.6 Estilos

- Tailwind como única fuente de estilos.
- No CSS modules, no styled-components, no archivos `.css` sueltos (salvo `index.css` global).
- Componentes de shadcn/ui para elementos comunes (botones, inputs, modales).

---

## 3. Flujo de trabajo por tarea

1. Abre `TASKLIST.md` y localiza la tarea asignada.
2. Marca la tarea como `[~] en progreso`.
3. Lee el criterio de aceptación de la tarea.
4. Implementa **solo** lo necesario para cumplir ese criterio.
5. Verifica el criterio manualmente (o con test si aplica).
6. Marca como `[x] completada`.
7. Si surgió alguna duda o decisión, anótala en la sección **Notas de progreso** de `TASKLIST.md`.

---

## 4. Qué NO hacer

- ❌ No agregar autenticación a rutas que no la necesitan.
- ❌ No crear endpoints sin validación Zod.
- ❌ No hardcodear textos visibles (usar i18n).
- ❌ No usar `console.log` (usar `logger` de pino).
- ❌ No commitear sin que `npm run lint` y `npm run typecheck` pasen.
- ❌ No modificar `SPEC.md` sin autorización explícita.
- ❌ No instalar dependencias sin justificar en `TASKLIST.md`.
- ❌ No dejar archivos de prueba, seeds temporales o comentarios de debug.
- ❌ No crear endpoints `DELETE` sin verificar que el recurso pertenece al usuario.

---

## 5. Cómo pedir ayuda si una tarea es ambigua

1. **Detente** y no escribas código especulativo.
2. Escribe la duda en `TASKLIST.md` bajo la tarea correspondiente.
3. Propón **2 opciones** con ventajas y desventajas de cada una.
4. Marca la tarea como `[!] bloqueada`.
5. Espera confirmación antes de avanzar.

---

## 6. Estructura de commits

Formato:

```
<tipo>(<módulo>): <descripción corta>
```

Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`.

Ejemplos:
- `feat(orders): crear endpoint POST /api/orders`
- `fix(auth): validar expiración de refresh token`
- `docs(spec): agregar flujo de estadísticas`

Un commit = una tarea o una subtarea coherente. Nunca mezclar.

---

## 7. Comandos útiles

Ejecutar desde la raíz del proyecto:

```bash
npm run dev           # server + client en paralelo
npm run dev:server    # solo backend
npm run dev:client    # solo frontend
npm run lint          # ESLint en ambos
npm run typecheck     # tsc --noEmit en ambos
npm run test          # tests (cuando existan)
npm run db:generate   # genera migración a partir del schema
npm run db:migrate    # aplica migraciones pendientes
npm run db:seed       # carga datos de ejemplo
npm run build         # build de producción (client)
```

---

## 8. Contexto que los agentes deben tener siempre presente

- El **chef** es el único destinatario de las notificaciones (correo + Telegram).
- El sistema es **multi-idioma desde el día 1**. No dejar traducciones para después.
- Las **estadísticas se recogen pasivamente**. No pedir al usuario que "marque" nada.
- **SQLite es suficiente.** No proponer migrar a otra BD.
- **Express está decidido.** No proponer Fastify, NestJS ni Hono.
- **PM2 + Systemd** es la estrategia de despliegue. No proponer Docker.
- El proyecto es un **monolito modular**. No proponer microservicios.
- El **frontend es una SPA** con React + Vite. No proponer SSR ni Next.js.

---

## 9. Checklist antes de cerrar cualquier tarea

- [ ] El criterio de aceptación de la tarea se cumple.
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] No hay `console.log` ni `TODO` sueltos.
- [ ] No hay textos hardcodeados visibles al usuario.
- [ ] Las claves i18n nuevas existen en `es.json`, `ru.json` y `en.json`.
- [ ] `TASKLIST.md` está actualizado.
- [ ] El commit sigue la convención de la sección 6.

---

## 10. Reglas de oro

1. **Si dudas, pregunta.** No inventes.
2. **Si algo contradice `SPEC.md`, detente.**
3. **Una tarea, un commit, una responsabilidad.**
4. **No optimices antes de que funcione.**
5. **El código que escribes lo vas a leer tú en 3 meses.**

---