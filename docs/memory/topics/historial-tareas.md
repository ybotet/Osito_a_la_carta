# Historial cronológico de tareas

> Última actualización: 2026-10-08
>
> Formato: `YYYY-MM-DD | Tarea | Qué se hizo | Cómo/Impacto | Deuda/Notas`

---

## 2026-09-28 — T-001 a T-009: Setup del proyecto

**Qué:** Estructura monorepo (`server/`, `client/`, `shared/`, `docs/`), TS estricto, Vite+React, proxy, Tailwind, ESLint/Prettier, pino, Zod env, health check.  
**Cómo:** npm workspaces en raíz; `type: module` + `moduleResolution: bundler` en server; `tsx` para dev; `process.loadEnvFile()` nativo (Node 22+).  
**Impacto:** Base lista para desarrollo. `npm run dev` levanta ambos.  
**Deuda:** Ninguna.

---

## 2026-09-29 — T-010 a T-013 + A-001: Base de datos

**Qué:** Schema Drizzle (6 entidades), migración inicial, seed platos (5 × 3 idiomas), seed admin, categorías (A-001).  
**Cómo:** `drizzle-kit` para migraciones; SQLite WAL mode; seed idempotente (upsert por slug); bcrypt 12 rounds.  
**Impacto:** BD funcional con datos de prueba multilingües.  
**Deuda:** Migraciones futuras requieren `drizzle-kit generate` + `migrate`.

---

## 2026-09-29 a 2026-10-01 — T-020 a T-029b: API platos y categorías

**Qué:** CRUD completo platos (GET/POST/PUT/DELETE + PATCH availability + DELETE permanent), CRUD categorías, localización por `Accept-Language`, borrado lógico (`isAvailable`), índice `category_id`.  
**Cómo:** Módulos feature-based (`dishes/`, `categories/`); Zod schemas en `shared/`; middleware `requireAuth`/`requireAdmin`; i18n via columnas `_es|_ru|_en`; transacciones no necesarias aquí.  
**Impacto:** API pública y admin funcional.  
**Deuda:** Rate limiting pendiente (T-092).

---

## 2026-10-01 a 2026-10-02 — T-030 a T-035: Frontend menú + i18n

**Qué:** `react-i18next` (es/ru/en, persistido), página `/menu` (agrupado por categoría), `DishCard` responsive, `/menu/:id`, navbar + selector idioma, shadcn/ui base.  
**Cómo:** TanStack Query v5 para server state; `useDishes` hook; Tailwind 4 CSS-first (`@import "tailwindcss"`); tokens CSS en `:root`.  
**Impacto:** Menú funcional y multilingüe.  
**Deuda:** Tests E2E pendientes (T-093).

---

## 2026-10-01 a 2026-10-03 — T-040 a T-047: Autenticación completa

**Qué:** Register, login (access 15min + refresh 7d, secretos distintos, claims `type`), refresh endpoint, middlewares, páginas login/register, Zustand store persistido, interceptor fetch 401→refresh→retry, subida imágenes (UUID + `PUBLIC_ORIGIN`).  
**Cómo:** jsonwebtoken + bcryptjs; `AppError` con códigos estandarizados; interceptor con flag de renovación compartida; `UPLOADS_DIR` fuera del repo; Nginx alias pendiente (T-095).  
**Impacto:** Auth end-to-end funcional, sesión persistente, imágenes servidas por Nginx.  
**Deuda:** Rotación refresh token (simplicidad actual); 2FA no contemplado.

---

## 2026-10-03 a 2026-10-04 — T-050 a T-055: Carrito y pedidos

**Qué:** Cart store Zustand (persist, snapshot plato), `POST /api/orders` (transacción + snapshot precios), `GET /api/orders` (historial usuario), páginas `/cart`, `/orders`, `/orders/:id`.  
**Cómo:** Transacción Drizzle atómica; validación items (disponibilidad, duplicados, cantidad); total en céntimos (Math.round); `language` snapshot en Order; TanStack Query invalidation tras POST.  
**Impacto:** Flujo compra completo usuario autenticado.  
**Deuda:** Notificaciones al chef pendientes (Fase 6).

---

## 2026-10-07 — T-060: Módulo notifications - email.service.ts (Mailgun)

**Qué:** Servicio `sendOrderEmail(order, items)` con Mailgun v14 + script de prueba `test-email.ts`.  
**Cómo:** Instaladas `mailgun.js@14`, `form-data@4`, `@types/form-data`. Servicio usa `env.MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`; destinatarios `env.CHEF_EMAIL` (lista coma-separada). Tipo `LocalizedOrderItem` con campo `name` ya localizado. Script en `src/scripts/test-email.ts` con datos ficticios. Corregidos imports con `import type` (verbatimModuleSyntax).  
**Impacto:** Email de prueba funcional (ejecuta sin errores TS; 401 en Mailgun por placeholder). Base para T-063 (orquestador).  
**Deuda/Notas:** Credenciales Mailgun reales pendientes; plantilla HTML mejorada en T-062; registro en NotificationLog en T-064.

---

## 2026-10-05 — Documentación y memoria

**Qué:** Crear `docs/MEMORY.md` (índice), `docs/memory/topics/estado-actual.md`, `decisiones-arquitectura.md`, `gotchas-y-problemas-conocidos.md`.  
**Cómo:** Extracción de TASKLIST, código y decisiones implícitas.  
**Impacto:** Memoria persistente y navegable para próximas sesiones.  
**Deuda:** Faltan `historial-tareas.md` (este archivo) y `convenciones-proyecto.md`.

---

## Próximas entradas (plantilla)

```
## 2026-10-XX — T-XXX: Nombre tarea
**Qué:** ...
**Cómo:** ...
**Impacto:** ...
**Deuda/Notas:** ...
```

> **Regla:** Una entrada por tarea completada (o grupo pequeño relacionado). Al terminar cada tarea, agregar aquí. Si hay decisiones/gotchas nuevos, añadirlos también a su archivo temático correspondiente.