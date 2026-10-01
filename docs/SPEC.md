# SPEC.md — Osito a la carta

> Fuente de verdad del proyecto. Ningún agente debe modificar este archivo sin autorización explícita del dueño del proyecto.
> Última actualización: 2026-10-01

---

## 1. Visión del producto

"Osito a la carta" es un negocio de pedidos y compra de comida con envío a domicilio.
Los clientes consultan el menú desde la web, realizan pedidos y el chef recibe una
alarma automática (correo electrónico + Telegram) con todos los datos del pedido.

El sistema está pensado para operar en **tres idiomas** desde el día 1:
Español (es), Ruso (ru) e Inglés (en).

---

## 2. Alcance inicial (MVP)

- Lista de platos con: imagen, nombre, descripción breve, ingredientes y precio.
- Sesión de usuario para realizar pedidos.
- Panel de estadísticas del usuario (platos visitados, platos solicitados, historial).
- Notificación automática al chef por correo y Telegram al confirmar un pedido.
- Multi-idioma completo: interfaz y contenido de platos en es / ru / en.
- Aplicación web responsive (usable desde móvil).
- Despliegue en VPS con Node.js nativo + PM2 + Systemd + Nginx.

---

## 3. Fuera de alcance (por ahora)

- Pasarela de pago en línea.
- App móvil nativa (iOS/Android).
- Múltiples sucursales o inventarios independientes.
- Panel de repartidores.
- Programa de fidelización / cupones.
- Chat en vivo con el chef.

---

## 4. Stack técnico decidido

| Capa               | Tecnología                  | Razón                                        |
| ------------------ | --------------------------- | -------------------------------------------- |
| Runtime            | Node.js (LTS)               | Conocimiento del desarrollador               |
| Backend            | Express + TypeScript        | Familiaridad, ecosistema maduro              |
| Base de datos      | SQLite + Drizzle ORM        | Ligera, archivo único, agregación SQL nativa |
| Frontend           | React 19 + Vite 8           | SPA, ecosistema, agentes lo dominan          |
| Estilos            | Tailwind CSS + shadcn/ui    | Rapidez de desarrollo                        |
| Estado global      | Zustand                     | Simple, suficiente para carrito y sesión     |
| Fetching           | TanStack Query              | Caché, reintentos, refetch automático        |
| Formularios        | React Hook Form + Zod       | Validación tipada compartida con backend     |
| i18n UI            | react-i18next               | Estándar de facto en React                   |
| i18n contenido     | Columnas multi-idioma en BD | Simple, sin tablas de traducción             |
| Auth               | JWT (access + refresh)      | Sin estado en servidor                       |
| Correo             | Mailgun                     | API simple, buena entregabilidad             |
| Telegram           | node-telegram-bot-api       | Librería oficial en Node                     |
| Logs               | pino                        | Estructurados, rápidos                       |
| Validación backend | Zod                         | Compartido con frontend                      |
| Despliegue         | PM2 + Systemd + Nginx       | Ligero, sin Docker en esta etapa             |

---

## 5. Arquitectura de carpetas

osito-a-la-carta/
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── dishes/
│   │   │   ├── orders/
│   │   │   ├── stats/
│   │   │   ├── notifications/
│   │   │   └── admin/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   └── migrations/
│   │   ├── middleware/
│   │   ├── shared/
│   │   ├── config/
│   │   ├── logger.ts
│   │   └── app.ts
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   └── package.json
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── locales/
│   │   │   ├── es.json
│   │   │   ├── ru.json
│   │   │   └── en.json
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── shared/                     # Tipos y esquemas compartidos
│   ├── types.ts
│   └── schemas.ts              # Zod compartidos
├── docs/
│   ├── SPEC.md
│   ├── AGENTE.md
│   └── TASKLIST.md
├── .env.example
├── .gitignore
└── package.json                # Scripts raíz
---

## 6. Modelo de datos

### User
| Campo         | Tipo        | Notas                 |
| ------------- | ----------- | --------------------- |
| id            | integer PK  | autoincremental       |
| email         | text unique | login                 |
| passwordHash  | text        | bcrypt                |
| role          | text        | 'customer' \| 'admin' |
| preferredLang | text        | 'es' \| 'ru' \| 'en'  |
| createdAt     | integer     | timestamp             |

### Category
| Campo                    | Tipo       | Notas                  |
| ------------------------ | ---------- | ---------------------- |
| id                       | integer PK |                        |
| slug                     | text unique | clave estable, p. ej. `sopas` |
| nameEs / nameRu / nameEn | text       | nombre visible al usuario |
| sortOrder                | integer    | orden en el menú       |

Se añadió el 2026-10-01 con autorización explícita del dueño del proyecto, para poder
organizar los platos en el menú. Los nombres van en columnas multi-idioma como el
resto del contenido (SPEC §4), y `sortOrder` permite reordenar el menú sin migrar.

### Dish
| Campo                                         | Tipo       | Notas |
| --------------------------------------------- | ---------- | ----- |
| id                                            | integer PK |       |
| categoryId                                    | integer FK | → `Category` |
| imageUrl                                      | text       |       |
| price                                         | real       |       |
| nameEs / nameRu / nameEn                      | text       |       |
| descEs / descRu / descEn                      | text       |       |
| ingredientsEs / ingredientsRu / ingredientsEn | text       |       |
| isAvailable                                   | integer    | 0/1   |
| createdAt                                     | integer    |       |

### Order
| Campo        | Tipo       | Notas                                                            |
| ------------ | ---------- | ---------------------------------------------------------------- |
| id           | integer PK |                                                                  |
| userId       | integer FK |                                                                  |
| status       | text       | 'pending' \| 'preparing' \| 'sent' \| 'delivered' \| 'cancelled' |
| total        | real       |                                                                  |
| customerNote | text       | opcional                                                         |
| createdAt    | integer    |                                                                  |

### OrderItem
| Campo     | Tipo       | Notas                        |
| --------- | ---------- | ---------------------------- |
| id        | integer PK |                              |
| orderId   | integer FK |                              |
| dishId    | integer FK |                              |
| quantity  | integer    |                              |
| unitPrice | real       | precio al momento del pedido |

### PageView
| Campo    | Tipo                | Notas             |
| -------- | ------------------- | ----------------- |
| id       | integer PK          |                   |
| userId   | integer FK nullable | anónimo permitido |
| dishId   | integer FK nullable |                   |
| path     | text                | ruta visitada     |
| viewedAt | integer             |                   |

### NotificationLog
| Campo        | Tipo          | Notas                 |
| ------------ | ------------- | --------------------- |
| id           | integer PK    |                       |
| orderId      | integer FK    |                       |
| channel      | text          | 'email' \| 'telegram' |
| status       | text          | 'sent' \| 'failed'    |
| errorMessage | text nullable |                       |
| sentAt       | integer       |                       |

---

## 7. Flujos clave

### 7.1 Flujo de pedido

1. Usuario autenticado agrega platos al carrito (estado en Zustand + localStorage).
2. Confirma pedido → `POST /api/orders` con `{ items: [{dishId, quantity}], customerNote? }`.
3. Backend valida con Zod, verifica disponibilidad de platos y calcula total.
4. Backend crea `Order` + `OrderItems` en una transacción.
5. Backend dispara **en paralelo**:
   - Correo al chef con plantilla HTML del pedido.
   - Mensaje de Telegram al chef con resumen del pedido.
6. Cada envío registra resultado en `NotificationLog`.
7. Si un canal falla, se reintenta una vez; si vuelve a fallar, se registra y no bloquea la respuesta.
8. Backend responde con el pedido creado.

### 7.2 Flujo de idioma

1. Usuario cambia idioma en el navbar.
2. Se guarda en `localStorage` y, si hay sesión, se actualiza `preferredLang` en BD.
3. `react-i18next` cambia los textos de UI al instante.
4. TanStack Query refetch automático con header `Accept-Language: <lang>`.
5. Backend devuelve contenido de platos localizado según el header.

### 7.3 Flujo de estadísticas

1. Al visitar la página de detalle de un plato, el frontend hace `POST /api/stats/pageview`.
2. Backend registra en `PageView` (userId si hay sesión, si no null).
3. `GET /api/stats/me` devuelve agregados:
   - Platos más vistos.
   - Platos más pedidos.
   - Total de pedidos y gasto acumulado.

---

## 8. Requisitos no funcionales

- Todo el código en **TypeScript estricto** (`strict: true`).
- Sin `any`. Validación con Zod en todos los bordes.
- Respuestas de error consistentes: `{ error: string, code: string }`.
- Logs estructurados con `pino` (nunca `console.log`).
- Sin CORS en desarrollo (proxy de Vite). En producción, mismo dominio detrás de Nginx.
- Variables de entorno validadas al arrancar con Zod.
- Código multi-idioma desde el día 1: ningún texto visible hardcodeado.
- Accesibilidad mínima: contraste, foco visible, navegación por teclado.

---

## 9. Criterios de aceptación del MVP

- [ ] Un usuario puede registrarse, iniciar sesión y cerrar sesión.
- [ ] Un usuario puede ver el menú completo en es / ru / en sin recargar la página.
- [ ] Un usuario puede agregar platos al carrito y confirmar un pedido.
- [ ] El chef recibe **correo electrónico** y **mensaje de Telegram** con los datos del pedido.
- [ ] El usuario ve estadísticas básicas de sus visitas y pedidos.
- [ ] La aplicación es usable desde un móvil (responsive).
- [ ] El sistema se despliega en un VPS con PM2 + Nginx y responde por HTTPS.

---

## 10. Decisiones cerradas (no reabrir sin motivo)

- **Express** en lugar de Fastify: prioridad a familiaridad y velocidad de desarrollo.
- **SQLite** en lugar de PostgreSQL/MongoDB: suficiencia para el volumen esperado.
- **PM2 + Systemd** en lugar de Docker: simplicidad y menor consumo en VPS pequeño.
- **react-i18next + columnas multi-idioma**: separación clara entre UI y contenido.
- **JWT** en lugar de sesiones en servidor: simplicidad y escalabilidad futura.
- **Monolito modular** en lugar de microservicios: equipo de una sola persona.
- **React 19** en lugar de React 18: el template oficial de Vite ya no genera React 18
  y el stack actual es lo que soporta shadcn/ui de forma nativa.
  Decidido el 2026-09-29 durante T-003. Ver `docs/MEMORY.md` ("React 19").
- **TypeScript 5.9.3 unificado** en `server/` y `client/`, sin versiones divergentes.

---
