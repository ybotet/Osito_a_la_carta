# DEPLOY.md — Guía de despliegue en VPS

> Última actualización: 2026-10-20

Esta guía asume un VPS corriendo **Ubuntu 22.04 LTS** (o compatible) con acceso SSH como usuario no-root con `sudo`.

## Prerrequisitos

- Acceso SSH al VPS con permisos `sudo`.
- Un dominio apuntando al VPS (p. ej. `osito.tudominio.com`).
- `git`, `curl`, `tar` instalados (vienen por defecto en Ubuntu Server).

---

## Paso 1: Instalar Node.js LTS

Se requiere **Node.js 22.x** (LTS) por `process.loadEnvFile()` (ver SPEC §4).

```bash
# Usar NodeSource para instalar Node 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version   # v22.x.x
npm --version    # 10.x
```

Instalar PM2 globalmente:

```bash
sudo npm install -g pm2
pm2 --version
```

---

## Paso 2: Clonar el repositorio

```bash
# Clonar el repo (o hacer git pull si ya existe)
cd /var/www
git clone git@github.com:osito/osito-a-la-carta.git osito
# o si ya está cloneado:
# cd /var/www/osito && git pull origin main

cd /var/www/osito
```

---

## Paso 3: Instalar dependencias

Instalar dependencias del workspace raíz (server y client):

```bash
# Instalar todo el workspace (-g no es necesario)
npm ci

# Si npm ci falla (hojaldra sin package-lock), usar:
# npm install
```

Instalar dependencias del server (incluye Drizzle):

```bash
cd server
npm ci
```

---

## Paso 4: Configurar variables de entorno

```bash
cd /var/www/osito

# Si copiaste .env.example, edita:
cp .env.example .env

# Edita .env con tus valores de producción:
nano .env
```

Revisa y asegúrate de que:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=./osito.db`
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: genera con `openssl rand -hex 32` (mínimo 32 chars)
- `PUBLIC_ORIGIN=https://osito.tudominio.com` (HTTPS en prod, sin barra final)
- `UPLOADS_DIR=/var/www/osito/uploads` (fuera del repo, sirve Nginx)
- `MAILGUN_*`: credenciales reales de Mailgun
- `CHEF_EMAIL`: email del chef
- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`: token real de bot de Telegram

---

## Paso 5: Aplicar migraciones y seed

```bash
# Desde docs/TASKLIST.md, las migraciones ya están en server/src/db/migrations/
cd server
npm run db:migrate   # aplica migraciones a ./osito.db
npm run db:seed      # datos de ejemplo (5 platos) - opcional, para desarrollo
# npm run db:seed:admin  # crear usuario admin (bcrypt 12 rounds)
```

Si la migración falla (error de migraciones de Drizzle con columnas nuevas, ver gotcha en MEMORY.md), aplica manualmente:

```bash
sqlite3 osito.db < server/src/db/migrations/0000_worthless_scarlet_spider.sql
sqlite3 osito.db < server/src/db/migrations/0001_broad_the_stranger.sql
sqlite3 osito.db < server/src/db/migrations/0002_unusual_the_hand.sql
# ... etc
```

> **Nota:** Las migraciones de tabla-rebuild (0003) pueden fallar en BD limpia debido a `INSERT INTO __new ... SELECT ... FROM` con columnas inexistentes. En ese caso, crea la tabla final directamente con `CREATE TABLE`.

---

## Paso 6: Compilar el frontend

```bash
# Desde la raíz
cd client
npm ci
npm run build       # genera client/dist/

# Copiar archivos estáticos al server public
# (si el server sirve el cliente; de lo contrario, Nginx sirve client/dist/)
mkdir -p server/src/public
cp -r dist/* server/src/public/
```

> **Alternativa (recomendado):** Configurar Nginx para servir `client/dist/` directamente. El server Express no necesita servir el frontend.

---

## Paso 7: Compilar el backend (TypeScript → JavaScript)

```bash
# Desde server/
npm run build       # tsc → dist/server/src/app.js

# Verificar que el entry point existe:
ls dist/server/src/app.js
```

---

## Paso 8: Iniciar con PM2

```bash
# Desde server/ (el ecosystem.config.cjs está en server/)
pm2 start ecosystem.config.cjs --env production

# Ver estado:
pm2 status
pm2 logs osito-server
pm2 show osito-server
```

---

## Paso 9: Configurar arranque automático con Systemd

```bash
# Generar script de arranque que resurrecta procesos PM2 tras reboot
pm2 startup systemd -u $USER --hp $HOME

# Esto imprime un comando sudo; ejecútalo:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Guardar la lista de procesos PM2 actual:
pm2 save

# Verificar que systemd está configurado:
sudo systemctl status pm2-$USER
```

---

## Paso 10: Configurar Nginx como proxy inverso + HTTPS

### 10.1: Archivo de configuración de sitio

Crear el archivo de configuración del sitio:

```bash
sudo nano /etc/nginx/sites-available/osito
```

### 10.2: Server block (explicación detallada)

\`\`\`nginx
# --- HTTP: redirect a HTTPS ---
server {
    listen 80;
    listen [::]:80;
    server_name osito.tudominio.com;

    # Let Certbot HTTP-01 challenge respond on /.well-known/acme-challenge/
    # This location must come before the redirect so challenges succeed.
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# --- HTTPS: todo el tráfico real ---
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name osito.tudominio.com;

    # --- Certificados TLS (Let's Encrypt) ---
    ssl_certificate /etc/letsencrypt/live/osito.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/osito.tudominio.com/privkey.pem;

    # Seguridad TLS (recomendado por Let's Encrypt)
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparams /etc/letsencrypt/ssl-dhparams.pem;

    # --- Gzip: comprimir respuestas ---
    # Reduce el tamaño de transferencia para HTML, CSS, JS, SVG, JSON, etc.
    gzip on;
    gzip_vary on;                       # Añade "Vary: Accept-Encoding" para proxies CDN
    gzip_proxied any;                   # Comprime respuestas para proxied requests
    gzip_comp_level 6;                  # Nivel de compresión (1-9; 6 = buen balance)
    gzip_min_length 256;                # No comprimir archivos menores a 256 bytes
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/xhtml+xml
        image/svg+xml;

    # --- Cache de assets estáticos ---
    # Los assets compilados (CSS, JS, imágenes build) son inmutables por hash.
    # Cache-Control "public, immutable" permite cache agresivo (1y) sin revalidación.
    location ~* \.(js|css|woff2|woff|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$ {
        # Frontend build assets (React/Vite bundle)
        root /var/www/osito/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        # No logging de assets para reducir I/O en logs
        access_log off;
    }

    # --- Imágenes subidas (user-generated content) ---
    # Usa alias (no root) para mapear /uploads/ a un directorio fuera de client/dist
    location /uploads/ {
        alias /var/www/osito/uploads/;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
    }

    # --- API → Express (Node.js en localhost:3000) ---
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;   # Trailing slash preserva el path
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSockets support (si se necesita en el futuro)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # --- Frontend SPA (React Router) ---
    root /var/www/osito/client/dist;
    index index.html;

    # try_files: intenta el archivo, luego directorio, luego cae en index.html (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
\`\`\`

#### Explicación de directivas clave

| Directiva | Propósito |
|-----------|-----------|
| `proxy_pass http://127.0.0.1:3000/api/;` | Reenvía `/api/*` al backend Express. El trailing slash hace que Nginx reemplace el prefijo `/api/` → mantiene compatibilidad con rutas del server. |
| `proxy_set_header Host $host;` | Preserva el Hostname original; el server Express usa `req.get('host')` para construir URLs absolutas (`PUBLIC_ORIGIN`). |
| `proxy_set_header X-Forwarded-Proto $scheme;` | Le dice al backend que la conexión original es HTTPS (necesario para cookies `Secure` en el futuro). |
| `location ~* \.(js\|css\|...)$` | Regex case-insensitive para assets buildados. `expires 1y` + `immutable` permite cacheo agresivo porque Vite incluye hash en los nombres de archivo. |
| `location /uploads/` con `alias` | `alias` (no `root`) mapea el path URL directamente al directorio; con `root` se añadiría `/uploads/` al path interno causando 404. |
| `try_files $uri $uri/ /index.html` | SPA fallback: si no existe el archivo, sirve `index.html` y deja que React Router resuelva. |
| `gzip_types` | Lista de tipos MIME a comprimir. No incluir tipos binarios (imágenes) que ya están comprimidos. |

### 10.3: Activar el sitio

\`\`\`bash
# Crear directorio para challenges de Let's Encrypt
sudo mkdir -p /var/www/certbot

# Habilitar el sitio (el default debe estar deshabilitado)
sudo ln -s /etc/nginx/sites-available/osito /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Crear directorio de uploads y asegurar permisos
sudo mkdir -p /var/www/osito/uploads
sudo chown -R $USER:$USER /var/www/osito/uploads

# Verificar configuración y recargar
sudo nginx -t
sudo systemctl reload nginx

# Verificar redirect HTTP → HTTPS
curl -I http://osito.tudominio.com
# Debería devolver: HTTP/1.1 301 Moved Permanently → https://osito.tudominio.com
\`\`\`

---

## Paso 11: SSL con Let's Encrypt (certbot)

### 11.1: Instalar certbot

\`\`\`bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
\`\`\`

### 11.2: Obtener certificado HTTPS

\`\`\`bash
sudo certbot --nginx \
  --email chef@osito.tudominio.com \
  --agree-tos \
  -d osito.tudominio.com
\`\`\`

Certbot hará lo siguiente automáticamente:
1. Valida el dominio con HTTP-01 challenge en `/.well-known/acme-challenge/`.
2. Descarga el certificado a `/etc/letsencrypt/live/osito.tudominio.com/`.
3. Modifica tu configuración de Nginx para incluir los certificados SSL.
4. Configura el redirect HTTP → HTTPS.

> **Nota:** Si tu configuración ya tiene `ssl_certificate` definido manualmente (como en el Paso 10.2), certbot detectará la configuración existente y la modificará si es necesario. Para evitar conflictos, puedes usar `--nginx` que sincroniza automáticamente con tu server block.

### 11.3: Verificar HTTPS

\`\`\`bash
# Verifica que Nginx responde por HTTPS
curl -I https://osito.tudominio.com
# Debería devolver: HTTP/2 200

# Verifica el certificado
openssl s_client -connect osito.tudominio.com:443 -servername osito.tudominio.com < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject
\`\`\`

### 11.4: Renovación automática del certificado

Let's Encrypt emite certificados válidos por **90 días**. Certbot configura automáticamente un **systemd timer** que ejecuta `certbot renew` dos veces al día (a las 00:00 y 12:00) en sistemas con systemd.

\`\`\`bash
# Verifica que el timer de renovación está activo
systemctl list-timers | grep certbot
# Debería mostrar: certbot.timer (activado, próxima ejecución dentro de ~12h)

# Verifica el estado del servicio
sudo systemctl status certbot.timer

# Forzar una renovación de prueba (valida que todo funciona sin tocar el certificado activo)
sudo certbot renew --dry-run

# Verifica la fecha de expiración actual
sudo certbot certificates
\`\`\`

#### Qué hace `certbot renew`

- Revisa todos los certificados configurados en `/etc/letsencrypt/live/`.
- Si un certificado expira en menos de 30 días, lo renueva automáticamente.
- Al renovar, recarga Nginx (`--deploy-hook "systemctl reload nginx"` o implícito con `--nginx`).
- Si la renovación falla, certbot retiene el certificado anterior hasta 90 días adicionales (modo "grace period").

#### Monitoreo de renovaciones

- **Logs:** Las renovaciones se registran en `/var/log/letsencrypt/letsencrypt.log`.
- **Cron alternativo:** Si el sistema no tiene systemd (ej. contenedores), certbot instala un cron job en `/etc/cron.d/certbot` como fallback.
- **Alertas:** Certbot no envía alertas por fallos. Considera agregar un check en tu monitoreo VPS o un cron que verifique `certbot certificates` y avise al chef si falta menos de 14 días.

---

## Resumen de comandos rápidos (incluye HTTPS)

\`\`\`bash
cd /var/www/osito/server

# Deploy nuevo
git pull
cd ../client && npm ci && npm run build
cd ../server && npm ci && npm run build && npm run db:migrate
pm2 restart osito-server

# Estado
pm2 status
pm2 logs osito-server

# Reinicia y verifica arranque automático
sudo reboot
pm2 status   # osito-server debería estar online

# HTTPS (verificado manualmente tras deploy)
sudo certbot renew --dry-run
sudo systemctl status certbot.timer

# Verificar HTTP → HTTPS redirect
curl -I http://osito.tudominio.com
# Debería devolver: 301 → https://osito.tudominio.com
\`\`\`

---

## Verificación final (criterio de aceptación T-095)

1. **HTTPS responde con certificado válido:**
   \`\`\`bash
   curl -I https://osito.tudominio.com
   # HTTP/2 200
   \`\`\`
2. **Redirect HTTP → HTTPS:**
   \`\`\`bash
   curl -I http://osito.tudominio.com
   # 301 Moved Permanently → https://
   \`\`\`
3. **API responde a través de Nginx (no directo):**
   \`\`\`bash
   curl -s https://osito.tudominio.com/api/health
   # {"status":"ok","timestamp":...}
   \`\`\`
4. **Certificado válido y renovación automática:**
   \`\`\`bash
   sudo certbot certificates      # muestra fecha de expiración
   sudo systemctl status certbot.timer  # timer activo
   \`\`\`
