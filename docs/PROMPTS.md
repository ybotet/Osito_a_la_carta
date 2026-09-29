# 📋 Prompts para cada tarea — Osito a la carta

> Cada prompt está listo para copiar y pegar en tu agente (Cursor, Claude Code, Cline, Aider, etc.).
> El prompt base siempre es el mismo; solo cambia la tarea al final.

---

## 🔧 Prompt base (usar como prefijo en TODAS las tareas)

```
Eres un agente de desarrollo trabajando en el proyecto "Osito a la carta".

ANTES DE EMPEZAR:
1. Lee completo el archivo docs/SPEC.md
2. Lee completo el archivo docs/AGENTE.md
3. Lee docs/TASKLIST.md y ubica la tarea que te indico abajo
4. Revisa el código existente en las carpetas relevantes
5. Si algo contradice SPEC.md, detente y pregúntame antes de escribir código

REGLAS:
- Trabaja SOLO en la tarea indicada. No mezcles cambios de otras tareas.
- Sigue todas las convenciones de docs/AGENTE.md (nombres, estructura, tipos).
- Verifica el criterio de aceptación antes de marcar la tarea como completada.
- Al terminar, actualiza docs/TASKLIST.md marcando la tarea como [x] y anotando
  cualquier decisión o duda en "Notas de progreso".

TAREA A IMPLEMENTAR:
```

---

# 🚀 FASE 0 — Setup del proyecto

### T-001 — Crear estructura de carpetas

```
[Prompt base]

T-001: Crear la estructura de carpetas del proyecto en la raíz:

osito-a-la-carta/
├── server/          (con package.json vacío, listo para inicializar)
├── client/          (con package.json vacío, listo para inicializar)
├── shared/          (con types.ts y schemas.ts vacíos)
├── docs/            (ya contiene SPEC.md, AGENTE.md, TASKLIST.md)
├── .env.example     (con todas las variables de SPEC.md sección 4)
├── .gitignore       (node_modules, dist, .env, *.db, logs/)
└── package.json     (raíz, con workspaces si aplica)

Criterio: `tree -L 2` (o equivalente) muestra la estructura completa.
No instales dependencias todavía.
```

---

### T-002 — Inicializar `server/` con TypeScript estricto

```
[Prompt base]

T-002: Inicializar el backend en server/ con:
- package.json con "type": "module"
- TypeScript con tsconfig.json en modo strict
- Estructura src/ con: app.ts, logger.ts, config/
- Dependencias base: express, zod, pino, pino-pretty (dev), 
  typescript, tsx (dev), @types/node, @types/express

Criterio: 
- `npx tsc --noEmit` pasa sin errores.
- Existe un src/app.ts que exporta una instancia de express (sin arrancar).
- No agregues rutas todavía.
```

---

### T-003 — Inicializar `client/` con Vite + React + TS

```
[Prompt base]

T-003: Inicializar el frontend en client/ con Vite + React + TypeScript.

Usa: `npm create vite@latest . -- --template react-ts`

Configura:
- tsconfig.json en strict
- Estructura src/ con: pages/, components/, api/, hooks/, store/, locales/, lib/
- App.tsx mínimo con un texto "Osito a la carta"

Criterio: `npm run dev` levanta la app en http://localhost:5173 y muestra el texto.
```

---

### T-004 — Proxy de Vite hacia Express

```
[Prompt base]

T-004: Configurar el proxy de Vite en client/vite.config.ts para que 
todas las peticiones a /api/* se redirijan a http://localhost:3000.

Además, en server/src/app.ts agrega la ruta GET /api/health que devuelva:
{ status: 'ok', timestamp: <ISO string> }

Criterio: 
- Arrancando ambos servidores (server en :3000, client en :5173),
  una llamada desde el navegador a http://localhost:5173/api/health
  devuelve { status: 'ok', ... }.
```

---

### T-005 — Tailwind CSS en `client/`

```
[Prompt base]

T-005: Instalar y configurar Tailwind CSS en client/:
- tailwindcss, postcss, autoprefixer
- tailwind.config.js apuntando a ./src/**/*.{ts,tsx}
- index.css con las directivas @tailwind base/components/utilities

Modifica App.tsx para que muestre "Osito a la carta" con clases de Tailwind 
(ej: text-3xl font-bold text-center mt-10).

Criterio: el texto se ve grande, en negrita y centrado.
```

---

### T-006 — ESLint + Prettier en ambos proyectos

```
[Prompt base]

T-006: Configurar ESLint + Prettier en server/ y client/.

Para server/:
- ESLint con @typescript-eslint
- Prettier con configuración compartida (2 espacios, single quotes, semi)

Para client/:
- ESLint con react-hooks y react-refresh
- Mismo Prettier

En el package.json raíz agrega scripts:
- "lint": correr lint en ambos
- "format": correr prettier en ambos

Criterio: `npm run lint` desde la raíz pasa sin errores.
```

---

### T-007 — Logger con pino

```
[Prompt base]

T-007: Configurar pino como logger en server/src/logger.ts.

- En desarrollo: pino-pretty con colores
- En producción: JSON puro
- Niveles: leer de process.env.LOG_LEVEL (default 'info')
- Exporta una instancia configurada

Usa el logger en server/src/app.ts para loggear al arrancar:
"Server starting on port <PORT>"

Criterio: al arrancar el server, se ve un log formateado y legible.
```

---

### T-008 — Validación de env con Zod

```
[Prompt base]

T-008: Crear server/src/config/env.ts que valide las variables de entorno con Zod.

Variables requeridas (según SPEC.md):
- PORT (number, default 3000)
- NODE_ENV (enum: development | production | test)
- DATABASE_URL (string)
- JWT_SECRET (string, min 32 chars)
- JWT_REFRESH_SECRET (string, min 32 chars)
- MAILGUN_API_KEY (string)
- MAILGUN_DOMAIN (string)
- MAILGUN_FROM (string, email)
- CHEF_EMAIL (string, email)
- TELEGRAM_BOT_TOKEN (string)
- TELEGRAM_CHAT_ID (string)

Exporta un objeto `env` tipado con los valores validados.
Si falta alguna variable, el proceso debe salir con mensaje claro.

Criterio: 
- Sin .env, el server no arranca y dice qué variable falta.
- Con .env completo, arranca sin problemas.
```

---

### T-009 — Endpoint `GET /api/health`

```
[Prompt base]

T-009: Implementar GET /api/health en server/src/modules/health/.

Estructura:
- server/src/modules/health/health.routes.ts

Respuesta:
{
  status: 'ok',
  timestamp: <ISO string>,
  uptime: <segundos desde arranque>,
  version: <leído de package.json>
}

Registra el router en app.ts bajo /api.

Criterio: `curl http://localhost:3000/api/health` devuelve el JSON correcto.
```

---

# 🗄️ FASE 1 — Base de datos

### T-010 — Schema Drizzle

```
[Prompt base]

T-010: Crear el schema Drizzle en server/src/db/schema.ts con las tablas:

- users (id, email unique, passwordHash, role, preferredLang, createdAt)
- dishes (id, imageUrl, price, nameEs/Ru/En, descEs/Ru/En, ingredientsEs/Ru/En, isAvailable, createdAt)
- orders (id, userId FK, status, total, customerNote, createdAt)
- orderItems (id, orderId FK, dishId FK, quantity, unitPrice)
- pageViews (id, userId FK nullable, dishId FK nullable, path, viewedAt)
- notificationLogs (id, orderId FK, channel, status, errorMessage, sentAt)

Configura server/src/db/client.ts con better-sqlite3 + drizzle.
Configura server/drizzle.config.ts.

Criterio: `npx drizzle-kit generate` produce una migración SQL válida en src/db/migrations/.
```

---

### T-011 — Aplicar migración inicial

```
[Prompt base]

T-011: Aplicar la migración generada en T-010.

Agrega scripts al package.json del server:
- "db:generate": "drizzle-kit generate"
- "db:migrate": "drizzle-kit migrate"
- "db:studio": "drizzle-kit studio"

Criterio: 
- `npm run db:migrate` crea el archivo osito.db en la raíz del server.
- Abriendo con sqlite3 o DB Browser, se ven las 6 tablas.
```

---

### T-012 — Seed de platos

```
[Prompt base]

T-012: Crear server/src/db/seed/dishes.ts que inserte 5 platos de ejemplo.

Cada plato debe tener:
- imageUrl (usar URLs de placeholder tipo https://placehold.co/600x400)
- price (realista, entre 5 y 25)
- nameEs/Ru/En, descEs/Ru/En, ingredientsEs/Ru/En (traducciones reales, no "TODO")
- isAvailable = 1

Elige platos típicos de comida casera (ej: sopa, pasta, ensalada, postre, bebida).

Agrega script "db:seed" al package.json.

Criterio: tras `npm run db:seed`, un SELECT devuelve 5 filas con datos en los 3 idiomas.
```

---

### T-013 — Seed de usuario admin

```
[Prompt base]

T-013: Crear server/src/db/seed/admin.ts que inserte un usuario admin:

- email: admin@osito.local
- password: "OsitoAdmin123!" (hasheada con bcrypt, 10 rounds)
- role: 'admin'
- preferredLang: 'es'

Instala bcryptjs y @types/bcryptjs si no están.
Agrega script "db:seed:admin" al package.json.

Criterio: tras ejecutarlo, un SELECT en users devuelve 1 fila con role='admin'.
```

---

# 🍽️ FASE 2 — API de platos

### T-020 — `GET /api/dishes` con localización

```
[Prompt base]

T-020: Implementar GET /api/dishes en server/src/modules/dishes/.

Archivos a crear:
- dishes.routes.ts
- dishes.service.ts
- dishes.repository.ts
- dishes.schema.ts (Zod para responses)

Comportamiento:
- Lee el header Accept-Language (es, ru, en). Default: es.
- Devuelve solo platos con isAvailable = 1.
- Devuelve el contenido localizado: { id, imageUrl, price, name, description, ingredients }.

Criterio: 
- `curl -H "Accept-Language: ru" http://localhost:3000/api/dishes` devuelve nombres en ruso.
- Sin header, devuelve en español.
```

---

### T-021 — `GET /api/dishes/:id`

```
[Prompt base]

T-021: Implementar GET /api/dishes/:id con la misma localización que T-020.

Si el plato no existe o isAvailable = 0, devolver 404 con:
{ error: 'Dish not found', code: 'DISH_NOT_FOUND' }

Criterio: devuelve 200 con el plato correcto o 404 si no existe.
```

---

### T-022 — `POST /api/dishes` (admin)

```
[Prompt base]

T-022: Implementar POST /api/dishes.

Requiere autenticación con role='admin' (aún no existe el middleware,
así que por ahora solo valida el body y crea el plato; el middleware
se conectará en T-043).

Body validado con Zod:
{
  imageUrl: string URL,
  price: number > 0,
  nameEs, nameRu, nameEn: string min 1,
  descEs, descRu, descEn: string min 1,
  ingredientsEs, ingredientsRu, ingredientsEn: string min 1
}

Devuelve 201 con el plato creado.

Criterio: `curl -X POST` con body válido crea el plato; con body inválido devuelve 400 con detalle de Zod.
```

---

### T-023 — `PUT /api/dishes/:id` (admin)

```
[Prompt base]

T-023: Implementar PUT /api/dishes/:id.

- Mismo body que T-022 pero todos los campos opcionales.
- Si el plato no existe, 404.
- Devuelve el plato actualizado.

Criterio: actualizar solo el precio funciona; actualizar un plato inexistente devuelve 404.
```

---

### T-024 — `DELETE /api/dishes/:id` (admin)

```
[Prompt base]

T-024: Implementar DELETE /api/dishes/:id como borrado lógico:
- No elimina la fila, actualiza isAvailable = 0.
- Si no existe, 404.
- Devuelve 204 sin body.

Criterio: tras DELETE, GET /api/dishes ya no incluye ese plato, pero sigue en la BD.
```

---

# 🌐 FASE 3 — Frontend: menú y multi-idioma

### T-030 — Configurar react-i18next

```
[Prompt base]

T-030: Configurar react-i18next en client/.

- Instalar: i18next, react-i18next, i18next-browser-languagedetector
- Crear client/src/locales/{es,ru,en}.json con al menos:
  - app.title = "Osito a la carta" / "Осито а ля карта" / "Osito a la carte"
  - menu.title, menu.loading, menu.empty
  - cart.add, cart.remove, cart.total, cart.checkout
  - nav.menu, nav.cart, nav.login, nav.logout
- Configurar client/src/lib/i18n.ts
- Importar en main.tsx

Criterio: cambiar el idioma desde la consola (i18n.changeLanguage('ru')) 
cambia los textos visibles sin recargar.
```

---

### T-031 — Página `/menu`

```
[Prompt base]

T-031: Crear la página /menu en client/src/pages/Menu.tsx.

- Usa TanStack Query (instalar @tanstack/react-query) para llamar GET /api/dishes.
- Envía el header Accept-Language con el idioma actual de i18n.
- Muestra un grid responsive de platos.
- Estados: loading (skeleton), error (mensaje), empty (mensaje).
- Configura el QueryClientProvider en main.tsx.
- Configura React Router con la ruta /menu.

Criterio: al abrir http://localhost:5173/menu, se ven los 5 platos del seed.
```

---

### T-032 — Componente `DishCard`

```
[Prompt base]

T-032: Crear client/src/components/DishCard.tsx.

Props: { dish: Dish } (tipo importado de shared/types.ts).

Renderiza:
- Imagen con aspect-ratio 4:3 y object-cover
- Nombre (font-semibold, text-lg)
- Descripción (text-sm text-gray-600, truncada a 2 líneas)
- Ingredientes (text-xs text-gray-500)
- Precio formateado (font-bold text-xl)
- Botón "Agregar al carrito" (usar shadcn/ui Button)

Criterio: en móvil se ve 1 columna; en desktop, 3 columnas.
```

---

### T-033 — Selector de idioma en navbar

```
[Prompt base]

T-033: Crear client/src/components/LanguageSwitcher.tsx.

- Tres botones o dropdown: ES, RU, EN
- Al hacer click, llama i18n.changeLanguage(lang)
- Persiste la elección en localStorage (react-i18next lo hace por defecto 
  con i18next-browser-languagedetector)
- Marca visualmente el idioma activo

Agrégalo a un componente Layout que envuelva las páginas.

Criterio: al recargar la página, mantiene el idioma elegido.
```

---

### T-034 — Página `/menu/:id`

```
[Prompt base]

T-034: Crear client/src/pages/DishDetail.tsx.

- Ruta: /menu/:id
- Llama GET /api/dishes/:id con Accept-Language
- Muestra imagen grande, nombre, descripción, ingredientes, precio
- Botón "Agregar al carrito" (funcional en T-050, por ahora solo UI)
- Botón "Volver al menú"

Criterio: click en un plato del menú navega al detalle y muestra los datos correctos.
```

---

### T-035 — Estilos base con shadcn/ui

```
[Prompt base]

T-035: Instalar y configurar shadcn/ui en client/.

- Inicializar con `npx shadcn@latest init`
- Instalar componentes: button, card, input, label, toast, dropdown-menu
- Refactorizar DishCard y Menu para usar Card y Button de shadcn
- Crear client/src/components/Layout.tsx con navbar (logo, links, LanguageSwitcher)
- Aplicar el Layout a todas las páginas

Criterio: la UI se ve coherente, con espaciado consistente y responsive.
```

---

# 🔐 FASE 4 — Autenticación

### T-040 — `POST /api/auth/register`

```
[Prompt base]

T-040: Implementar POST /api/auth/register en server/src/modules/auth/.

Body validado con Zod:
{ email: email, password: string min 8, preferredLang: 'es'|'ru'|'en' }

- Verifica que el email no exista. Si existe: 409 con code 'EMAIL_TAKEN'.
- Hashea la contraseña con bcrypt (10 rounds).
- Crea el usuario con role='customer'.
- Devuelve 201 con { id, email, role, preferredLang } (nunca el hash).

Criterio: registro con email nuevo funciona; con email duplicado devuelve 409.
```

---

### T-041 — `POST /api/auth/login`

```
[Prompt base]

T-041: Implementar POST /api/auth/login.

Body: { email, password }

- Verifica credenciales con bcrypt.compare.
- Si fallan: 401 con code 'INVALID_CREDENTIALS'.
- Genera access token (15 min) y refresh token (7 días) con jsonwebtoken.
- Secretos desde env (JWT_SECRET, JWT_REFRESH_SECRET).
- Devuelve { accessToken, refreshToken, user: { id, email, role, preferredLang } }.

Criterio: login correcto devuelve ambos tokens; incorrecto devuelve 401.
```

---

### T-042 — `POST /api/auth/refresh`

```
[Prompt base]

T-042: Implementar POST /api/auth/refresh.

Body: { refreshToken }

- Verifica el refresh token con JWT_REFRESH_SECRET.
- Si es válido, emite un nuevo access token (15 min).
- Si es inválido o expirado: 401 con code 'INVALID_REFRESH_TOKEN'.

Criterio: con refresh válido devuelve nuevo access; con inválido devuelve 401.
```

---

### T-043 — Middleware `requireAuth` y `requireAdmin`

```
[Prompt base]

T-043: Crear server/src/middleware/auth.ts.

- requireAuth: lee Authorization: Bearer <token>, verifica con JWT_SECRET,
  adjunta req.user = { id, email, role }. Si falta o es inválido: 401.
- requireAdmin: usa requireAuth y luego verifica req.user.role === 'admin'.
  Si no: 403 con code 'FORBIDDEN'.

Aplica requireAdmin a POST/PUT/DELETE /api/dishes (T-022, T-023, T-024).

Extiende el tipo Request de Express para incluir `user`.

Criterio: 
- Sin token, POST /api/dishes devuelve 401.
- Con token de customer, devuelve 403.
- Con token de admin, funciona.
```

---

### T-044 — Páginas `/login` y `/register`

```
[Prompt base]

T-044: Crear client/src/pages/Login.tsx y Register.tsx.

- Usa React Hook Form + Zod (instalar react-hook-form, @hookform/resolvers, zod).
- Reutiliza los schemas de shared/schemas.ts.
- Llama a POST /api/auth/login o /register.
- En éxito: guarda tokens en el store de Zustand (T-045) y redirige a /menu.
- En error: muestra toast con el mensaje del backend.

Criterio: 
- Registro nuevo redirige a /menu autenticado.
- Login con credenciales inválidas muestra error.
```

---

### T-045 — Store de sesión con Zustand

```
[Prompt base]

T-045: Crear client/src/store/auth.ts con Zustand (instalar zustand).

Estado:
- user: { id, email, role, preferredLang } | null
- accessToken: string | null
- refreshToken: string | null

Acciones:
- setSession(user, accessToken, refreshToken)
- clearSession()
- isAuthenticated (derivado)

Persistencia: usar middleware persist con localStorage.

Criterio: tras login, recargar la página mantiene la sesión.
```

---

### T-046 — Interceptor de fetch con refresh automático

```
[Prompt base]

T-046: Crear client/src/api/client.ts.

- Wrapper de fetch que añade Authorization: Bearer <accessToken>.
- Añade Accept-Language con el idioma actual de i18n.
- Si la respuesta es 401, intenta POST /api/auth/refresh con el refreshToken.
  - Si tiene éxito, reintenta la petición original con el nuevo access.
  - Si falla, limpia la sesión y redirige a /login.
- Todas las funciones de src/api/* deben usar este wrapper.

Criterio: si el access expira, la siguiente petición se renueva sin que el usuario lo note.
```

---

# 🛒 FASE 5 — Carrito y pedidos

### T-050 — Store de carrito

```
[Prompt base]

T-050: Crear client/src/store/cart.ts con Zustand + persist.

Estado: items: Array<{ dishId, name, price, quantity, imageUrl }>

Acciones:
- addItem(dish)
- removeItem(dishId)
- updateQuantity(dishId, quantity)
- clearCart()
- totalItems (derivado)
- totalPrice (derivado)

Conecta DishCard y DishDetail al store.

Criterio: agregar platos, recargar la página y ver que el carrito se mantiene.
```

---

### T-051 — `POST /api/orders`

```
[Prompt base]

T-051: Implementar POST /api/orders en server/src/modules/orders/.

Requiere autenticación (requireAuth).

Body validado con Zod:
{
  items: Array<{ dishId: number, quantity: number min 1 }> min 1,
  customerNote?: string max 500
}

Lógica:
- Verifica que todos los platos existan y estén disponibles.
- Calcula total con precios actuales.
- En una transacción Drizzle: crea Order + OrderItems.
- Estado inicial: 'pending'.
- (Las notificaciones se conectan en T-063.)
- Devuelve 201 con el pedido completo.

Criterio: crear pedido devuelve 201 con items y total correctos.
```

---

### T-052 — `GET /api/orders`

```
[Prompt base]

T-052: Implementar GET /api/orders.

- Requiere autenticación.
- Devuelve solo los pedidos del usuario autenticado.
- Ordenados por createdAt DESC.
- Incluye items con nombre de plato localizado según Accept-Language.

Criterio: un usuario ve solo sus pedidos, no los de otros.
```

---

### T-053 — Página `/cart`

```
[Prompt base]

T-053: Crear client/src/pages/Cart.tsx.

- Lista de items con imagen, nombre, precio unitario, cantidad editable, subtotal.
- Botón "Eliminar" por item.
- Resumen: total de items, total a pagar.
- Campo de nota opcional para el chef.
- Botón "Confirmar pedido" → POST /api/orders.
- Si no está autenticado, redirige a /login.
- En éxito: limpia carrito y redirige a /orders/:id.

Criterio: flujo completo desde carrito hasta pedido creado funciona.
```

---

### T-054 — Página `/orders`

```
[Prompt base]

T-054: Crear client/src/pages/Orders.tsx.

- Requiere autenticación.
- Lista de pedidos del usuario (GET /api/orders).
- Cada pedido muestra: fecha, estado (badge con color), total, número de items.
- Click en un pedido navega a /orders/:id.
- Estado vacío: mensaje "Aún no has hecho pedidos".

Criterio: aparecen todos los pedidos del usuario ordenados por fecha.
```

---

### T-055 — Página `/orders/:id`

```
[Prompt base]

T-055: Crear client/src/pages/OrderDetail.tsx.

- Requiere autenticación.
- Llama GET /api/orders/:id (crear endpoint si no existe: solo devuelve 
  si el pedido pertenece al usuario, si no 404).
- Muestra: estado, fecha, nota del cliente, lista de items con cantidades y totales, total general.

Criterio: se ve el detalle completo del pedido.
```

---

# 📧 FASE 6 — Notificaciones al chef

### T-060 — Servicio de correo con Mailgun

```
[Prompt base]

T-060: Crear server/src/modules/notifications/email.service.ts.

- Instalar: mailgun.js, form-data
- Función sendOrderEmail(order, items): Promise<void>
- Usa credenciales de env (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM).
- Destinatario: CHEF_EMAIL.
- Lanza error si falla (será capturado por el orquestador en T-063).

Además, crea un script server/src/scripts/test-email.ts que envíe un correo 
de prueba con datos ficticios.

Criterio: `npx tsx src/scripts/test-email.ts` envía un correo real al chef.
```

---

### T-061 — Servicio de Telegram

```
[Prompt base]

T-061: Crear server/src/modules/notifications/telegram.service.ts.

- Instalar: node-telegram-bot-api, @types/node-telegram-bot-api
- Función sendOrderTelegram(order, items): Promise<void>
- Usa TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID de env.
- Mensaje en texto plano con formato Markdown:
  🍽️ *Nuevo pedido #<id>*
  👤 Cliente: <email>
  📝 Nota: <nota o "sin nota">
  ---- Items ----
  • <cantidad>x <nombre> — $<subtotal>
  ---- Total ----
  💰 $<total>
  🕐 <fecha>

Crea script server/src/scripts/test-telegram.ts.

Criterio: `npx tsx src/scripts/test-telegram.ts` envía un mensaje real al chef.
```

---

### T-062 — Plantilla HTML del correo

```
[Prompt base]

T-062: Crear server/src/modules/notifications/templates/order-email.ts.

- Función que recibe (order, items, user) y devuelve HTML string.
- HTML simple, inline styles, compatible con Gmail/Outlook.
- Incluye: logo textual "Osito a la carta", número de pedido, fecha, 
  datos del cliente, tabla de items, total, nota del cliente.
- Versión texto plano como fallback.

Conecta esta plantilla con email.service.ts de T-060.

Criterio: el correo de prueba se ve bien en Gmail y Outlook web.
```

---

### T-063 — Disparar notificaciones en paralelo

```
[Prompt base]

T-063: En el servicio de órdenes (orders.service.ts), después de crear 
el pedido en la transacción, dispara en paralelo:

await Promise.allSettled([
  sendOrderEmail(order, items),
  sendOrderTelegram(order, items)
]);

Un fallo en un canal NO debe bloquear el otro ni la respuesta al usuario.
Registra el resultado de cada uno en NotificationLog (T-064).

Criterio: crear un pedido dispara ambas notificaciones; si una falla, 
la otra se envía igual y el usuario recibe 201.
```

---

### T-064 — Registrar en NotificationLog

```
[Prompt base]

T-064: Crear server/src/modules/notifications/notifications.repository.ts.

Función logNotification({ orderId, channel, status, errorMessage }).

Llama a esta función después de cada intento de envío (éxito o fallo) 
desde orders.service.ts.

Criterio: tras crear un pedido, hay 2 filas en notification_logs 
(una por canal) con status 'sent' o 'failed'.
```

---

### T-065 — Reintento automático

```
[Prompt base]

T-065: Implementar reintento en orders.service.ts.

- Envolver cada envío en una función retry(fn, attempts=2, delayMs=2000).
- Si el primer intento falla, esperar 2s y reintentar una vez.
- Registrar ambos intentos en NotificationLog (el segundo con status final).
- Usar Promise.allSettled para no bloquear.

Criterio: simulando un fallo temporal, el segundo intento tiene éxito y 
solo se registra el resultado final como 'sent'.
```

---

# 📊 FASE 7 — Estadísticas del usuario

### T-070 — `POST /api/stats/pageview`

```
[Prompt base]

T-070: Implementar POST /api/stats/pageview.

- Endpoint público (no requiere auth, pero usa userId si hay sesión).
- Body: { dishId?: number, path: string }
- Registra en pageViews con viewedAt = Date.now().
- Devuelve 204.

Conecta el frontend: en DishDetail.tsx, al montar, hacer POST con el dishId.

Criterio: visitar un plato crea una fila en page_views.
```

---

### T-071 — `GET /api/stats/me`

```
[Prompt base]

T-071: Implementar GET /api/stats/me.

Requiere autenticación.

Devuelve:
{
  topViewedDishes: Array<{ dishId, name, views }> (top 5),
  topOrderedDishes: Array<{ dishId, name, count }> (top 5),
  totalOrders: number,
  totalSpent: number,
  memberSince: ISO string
}

Usa agregaciones SQL de Drizzle (count, sum, groupBy).

Criterio: devuelve datos coherentes tras varias visitas y pedidos.
```

---

### T-072 — Página `/stats`

```
[Prompt base]

T-072: Crear client/src/pages/Stats.tsx.

- Requiere autenticación.
- Instalar recharts.
- Muestra:
  - Card con totalOrders, totalSpent, memberSince.
  - BarChart con topViewedDishes.
  - BarChart con topOrderedDishes.
- Responsive.

Criterio: se ven los gráficos con datos reales del usuario.
```

---

# 👨‍🍳 FASE 8 — Panel del chef

### T-080 — `GET /api/admin/orders`

```
[Prompt base]

T-080: Implementar GET /api/admin/orders.

- Requiere requireAdmin.
- Devuelve todos los pedidos con info del usuario (email) e items.
- Ordenados por createdAt DESC.
- Soporta filtro opcional por status (?status=pending).

Criterio: solo admin accede; devuelve todos los pedidos.
```

---

### T-081 — Página `/admin/orders`

```
[Prompt base]

T-081: Crear client/src/pages/admin/Orders.tsx.

- Requiere auth + role admin (si no, redirige a /menu).
- Tabla con: #pedido, cliente, fecha, estado, total, acciones.
- Actualización automática cada 10s con TanStack Query (refetchInterval).
- Filtro por estado (dropdown).
- Click en un pedido abre detalle (modal o página).

Criterio: los pedidos nuevos aparecen sin recargar la página.
```

---

### T-082 — `PATCH /api/admin/orders/:id/status`

```
[Prompt base]

T-082: Implementar PATCH /api/admin/orders/:id/status.

- Requiere requireAdmin.
- Body: { status: 'pending'|'preparing'|'sent'|'delivered'|'cancelled' }
- Valida transiciones permitidas:
  pending → preparing | cancelled
  preparing → sent | cancelled
  sent → delivered
  delivered → (final)
  cancelled → (final)
- Si la transición es inválida: 400 con code 'INVALID_TRANSITION'.
- Devuelve el pedido actualizado.

Criterio: cambiar pending → sent devuelve 400; pending → preparing funciona.
```

---

### T-083 — Vista de detalle para el chef

```
[Prompt base]

T-083: Crear client/src/pages/admin/OrderDetail.tsx.

- Requiere admin.
- Muestra: datos del cliente (email), fecha, nota, items con cantidades y precios, total.
- Botones para cambiar estado (según transiciones válidas).
- Botón "Volver".

Criterio: el chef puede ver el detalle completo y cambiar el estado.
```

---

# 🚢 FASE 9 — Pulido y despliegue

### T-090 — PWA

```
[Prompt base]

T-090: Configurar vite-plugin-pwa en client/.

- Instalar vite-plugin-pwa.
- Configurar manifest con: name "Osito a la carta", theme_color, icons (crear 
  2-3 iconos placeholder 192x192 y 512x512).
- Estrategia: generateSW, autoUpdate.
- Precarga de assets estáticos.

Criterio: 
- En Chrome móvil, aparece "Añadir a pantalla de inicio".
- Al abrir la app instalada, se ve sin barra de navegador.
```

---

### T-091 — Responsive completo

```
[Prompt base]

T-091: Auditar y ajustar todas las páginas para móvil (360px), tablet (768px) y desktop (1280px+).

- Navbar colapsable en móvil (menú hamburguesa).
- Grids adaptativos (1/2/3 columnas).
- Tablas convertidas en cards en móvil (o scroll horizontal).
- Botones y inputs táctiles (min 44px de alto).
- Textos legibles sin zoom.

Criterio: todas las páginas son usables desde un móvil real (o DevTools).
```

---

### T-092 — Manejo global de errores

```
[Prompt base]

T-092: Implementar manejo global de errores.

Frontend:
- ErrorBoundary en App.tsx con pantalla de fallback amigable.
- Toast global para errores de red (usar sonner o shadcn/ui toast).
- El interceptor de fetch muestra toast en errores 4xx/5xx.

Backend:
- Middleware de errores al final de app.ts que capture AppError y ZodError.
- Devuelve { error, code } consistente.
- Loggea con pino en nivel error.

Criterio: un error de red muestra mensaje claro, no pantalla blanca.
```

---

### T-093 — Tests básicos

```
[Prompt base]

T-093: Instalar vitest en server/.

Tests para:
- auth.service: register (email duplicado), login (credenciales inválidas), 
  refresh (token expirado).
- orders.service: crear pedido (validación, cálculo de total, transacción).
- dishes.service: localización según Accept-Language.

Usar better-sqlite3 en memoria para tests (DATABASE_URL=:memory:).

Criterio: `npm run test` pasa con al menos 10 assertions.
```

---

### T-094 — PM2 en el VPS

```
[Prompt base]

T-094: Crear scripts de despliegue.

- server/ecosystem.config.cjs con:
  - name: 'osito-server'
  - script: 'dist/app.js'
  - instances: 1
  - autorestart: true
  - max_memory_restart: '512M'
  - env: NODE_ENV=production, PORT=3000

- Documento docs/DEPLOY.md con pasos:
  1. Instalar Node LTS en VPS.
  2. Clonar repo.
  3. npm ci en server y client.
  4. npm run build en client.
  5. npm run build en server (tsc).
  6. pm2 start ecosystem.config.cjs.
  7. pm2 startup + pm2 save.

Criterio: la app arranca con PM2 y sobrevive a un reinicio del VPS.
```

---

### T-095 — Nginx + Let's Encrypt

```
[Prompt base]

T-095: Documentar en docs/DEPLOY.md la configuración de Nginx.

- Server block para el dominio con:
  - /api → proxy a localhost:3000
  - / → servir client/dist
  - Gzip habilitado
  - Cache de assets estáticos
- Instrucciones para certbot: `certbot --nginx -d osito.example.com`
- Renovación automática del certificado.

Criterio: la app responde por HTTPS con certificado válido.
```

---

### T-096 — Backup diario de SQLite

```
[Prompt base]

T-096: Documentar y crear script en docs/DEPLOY.md + server/scripts/backup.sh.

- Script que copia osito.db a backups/osito-YYYY-MM-DD.db.
- Mantiene últimos 30 backups.
- Entrada en crontab: 0 3 * * * /path/to/backup.sh
- Instrucciones para restaurar.

Criterio: tras un día, existe un backup nuevo; tras 31 días, el más antiguo se borró.
```

---
