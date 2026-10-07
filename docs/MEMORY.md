# MEMORY.md — Bitácora de decisiones y trabajo (índice)

> Última actualización: 2026-10-08

Este es el **índice** de la memoria del proyecto. El contenido técnico completo está en `docs/memory/topics/`.

---

## Cómo usar este archivo

- **Leer**: al iniciar cualquier tarea, mira el **Estado actual** abajo y ve al tema correspondiente en `topics/`.
- **Escribir**: al terminar, agrega entrada en `topics/historial-tareas.md`. Si hay decisiones/gotchas nuevos, añádelos a su tema.
- **Nunca borrar**: si una decisión se revierte, agrega entrada nueva explicando el cambio.

---

## Archivos de tema

| Archivo | Descripción |
|---------|-------------|
| `topics/estado-actual.md` | Snapshot: árbol de carpetas, comandos, versiones, variables de entorno, endpoints activos |
| `topics/decisiones-arquitectura.md` | Decisiones clave: módulos, auth, BD, i18n, imágenes, errores, validación compartida |
| `topics/gotchas-y-problemas-conocidos.md` | Lista viva de gotchas (SQLite, Drizzle, React, Tailwind, JWT, bcrypt, etc.) |
| `topics/historial-tareas.md` | Entradas cronológicas por tarea (qué, cómo, por qué, impacto, deuda) |
| `topics/convenciones-proyecto.md` | Convenciones: código, commits, naming, estructura módulos, proceso de tareas |

---

## Estado actual del proyecto (resumen)

**Completadas (Fases 0–5):** Setup, BD, API platos/categorías, Frontend menú+i18n, Auth (register, login, refresh, middleware, store, interceptor, imágenes), Carrito y pedidos (store, POST/GET orders, páginas /cart, /orders, /orders/:id).

**En curso / Próximas:** Fase 6 Notificaciones (T-060 a T-065), Fase 7 Stats (T-070 a T-072), Fase 8 Panel chef (T-080 a T-083), Fase 9 Pulido/Despliegue (T-090 a T-096).

**Stack verificado:** Node 22+, npm workspaces, Express 5 + TypeScript ESM, Drizzle + SQLite (WAL), React 19 + Vite 8, Tailwind 4 CSS-first, shadcn/ui (button, card, input, label), Zustand (auth + cart), react-i18next, TanStack Query, Zod, jsonwebtoken (access/refresh con secretos y `type` distintos), bcryptjs.

**Infraestructura:** `.env` en raíz (validado con Zod al importar, `process.loadEnvFile()`), `PUBLIC_ORIGIN` para URLs absolutas de imágenes, `UPLOADS_DIR` fuera del repo en VPS, Nginx alias `/uploads/` pendiente (T-095), PM2 pendiente (T-094).

**Comandos clave:** `npm run dev` (dos terminales), `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`, `cd server && npm run db:migrate`, `cd server && npm run db:seed`, `cd server && npm run db:seed:admin`.

**Fuente de verdad del avance:** `docs/TASKLIST.md`.