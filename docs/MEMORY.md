# MEMORY.md вЂ” BitГЎcora de decisiones y trabajo (Г­ndice)

> Гљltima actualizaciГіn: 2026-10-21

Este es el **Г­ndice** de la memoria del proyecto. El contenido tГ©cnico completo estГЎ en `docs/memory/topics/`.

---

## CГіmo usar este archivo

- **Leer**: al iniciar cualquier tarea, mira el **Estado actual** abajo y ve al tema correspondiente en `topics/`.
- **Escribir**: al terminar, agrega entrada en `topics/historial-tareas.md`. Si hay decisiones/gotchas nuevos, aГ±ГЎdelos a su tema.
- **Nunca borrar**: si una decisiГіn se revierte, agrega entrada nueva explicando el cambio.

---

## Archivos de tema

| Archivo | DescripciГіn |
|---------|-------------|
| `topics/estado-actual.md` | Snapshot: ГЎrbol de carpetas, comandos, versiones, variables de entorno, endpoints activos |
| `topics/decisiones-arquitectura.md` | Decisiones clave: mГіdulos, auth, BD, i18n, imГЎgenes, errores, validaciГіn compartida |
| `topics/gotchas-y-problemas-conocidos.md` | Lista viva de gotchas (SQLite, Drizzle, React, Tailwind, JWT, bcrypt, etc.) |
| `topics/historial-tareas.md` | Entradas cronolГіgicas por tarea (quГ©, cГіmo, por quГ©, impacto, deuda) |
| `topics/convenciones-proyecto.md` | Convenciones: cГіdigo, commits, naming, estructura mГіdulos, proceso de tareas |

---

## Estado actual del proyecto (resumen)

**Completadas (Fases 0вЂ“5):** Setup, BD, API platos/categorГ­as, Frontend menГє+i18n, Auth (register, login, refresh, middleware, store, interceptor, imГЎgenes), Carrito y pedidos (store, POST/GET orders, pГЎginas /cart, /orders, /orders/:id).

**En curso / PrГіximas:** Fase 6 Notificaciones (T-060 a T-065), Fase 7 Stats (T-070 a T-072), Fase 8 Panel chef (T-080 a T-083), Fase 9 Pulido/Despliegue (T-090 a T-096).

**Stack verificado:** Node 22+, npm workspaces, Express 5 + TypeScript ESM, Drizzle + SQLite (WAL), React 19 + Vite 8, Tailwind 4 CSS-first, shadcn/ui (button, card, input, label), Zustand (auth + cart), react-i18next, TanStack Query, Zod, jsonwebtoken (access/refresh con secretos y `type` distintos), bcryptjs.

**Infraestructura:** `.env` en raГ­z (validado con Zod al importar, `process.loadEnvFile()`), `PUBLIC_ORIGIN` para URLs absolutas de imГЎgenes, `UPLOADS_DIR` fuera del repo en VPS, Nginx alias `/uploads/` pendiente (T-095), PM2 pendiente (T-094).

**Comandos clave:** `npm run dev` (dos terminales), `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`, `cd server && npm run db:migrate`, `cd server && npm run db:seed`, `cd server && npm run db:seed:admin`.

**Fuente de verdad del avance:** `docs/TASKLIST.md`.
