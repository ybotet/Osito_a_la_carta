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

## Paso 10: Configurar Nginx como proxy inverso

Crear configuración de sitio:

```bash
sudo nano /etc/nginx/sites-available/osito
```

```nginx
server {
    listen 80;
    server_name osito.tudominio.com;
    # Redirect HTTP → HTTPS (T-095)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name osito.tudominio.com;

    # Certificados TLS (Let's Encrypt — T-095)
    ssl_certificate /etc/letsencrypt/live/osito.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/osito.tudominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparams /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend (SPA)
    root /var/www/osito/client/dist;
    index index.html;

    # API → server Express en 3000
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Imágenes subidas
    location /uploads/ {
        alias /var/www/osito/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Activar y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/osito /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 11: SSL con Let's Encrypt (T-095)

```bash
sudo apt install certbot python3-certbot-nginx -y

sudo certbot --nginx \
  -d osito.tudominio.com

# Auto-renovación (ya configurada por certbot, pero verificar):
sudo certbot renew --dry-run
```

---

## Resumen de comandos rápidos

```bash
cd /var/www/osito/server

# Deploy nuevo
git pull
cd ../client && npm ci && npm run build && cp -r dist/* ../server/src/public/
cd ../server && npm ci && npm run build && npm run db:migrate
pm2 restart osito-server

# Estado
pm2 status
pm2 logs osito-server

# Resurrección automática (ya configurado)
# Reinicia el VPS y verifica:
sudo reboot
# Tras reboot:
pm2 status   # osito-server debería estar online
```
