# Guía de Deployment

Esta guía describe el proceso de configuración, deployment y operación del Sistema de Indicadores de Desempeño en entornos de desarrollo, staging y producción.

## 📋 Tabla de Contenidos

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Configuración Inicial](#configuración-inicial)
- [Desarrollo Local](#desarrollo-local)
- [Deployment en Producción](#deployment-en-producción)
- [Monitoreo y Logging](#monitoreo-y-logging)
- [Troubleshooting](#troubleshooting)

---

## 💻 Requisitos del Sistema

### Mínimos
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 20 GB SSD
- **Node.js**: 18.x o superior
- **MySQL**: 8.0 o superior

### Recomendados (Producción)
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disco**: 50+ GB SSD
- **Node.js**: 20.x LTS
- **MySQL**: 8.0+ con replicas
- **Redis**: 7.0+ para caché

### Software Requerido

```bash
# Node.js y npm
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# MySQL
mysql --version # >= 8.0.0

# Redis (opcional pero recomendado)
redis-cli --version # >= 7.0.0

# PM2 (para producción)
pm2 --version
```

---

## ⚙️ Configuración Inicial

### 1. Clonar el Repositorio

```bash
# Clonar proyecto
git clone <repository-url> medical-app
cd medical-app

# Instalar dependencias
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Copiar template
cp .env.example .env.local

# Editar variables
nano .env.local
```

#### Variables de Entorno Requeridas

```env
# ====================
# Base de Datos MySQL
# ====================
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_seguro
DB_NAME=indicadores_desempeno
DB_PORT=3306
DB_SSL=false

# ====================
# SQL Server (Opcional)
# ====================
MSSQL_SERVER=servidor.ejemplo.com
MSSQL_DATABASE=nombre_base_datos
MSSQL_USER=usuario_sqlserver
MSSQL_PASSWORD=password_sqlserver
MSSQL_ENCRYPT=true

# ====================
# Redis (Opcional)
# ====================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=tu_password_redis
REDIS_TLS=false

# ====================
# Aplicación
# ====================
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# ====================
# Seguridad
# ====================
JWT_SECRET=tu_secret_key_muy_largo_y_seguro
SESSION_SECRET=otro_secret_key_diferente

# ====================
# Logging
# ====================
LOG_LEVEL=info
ENABLE_DEBUG=false
```

### 3. Configurar Base de Datos

#### Crear Base de Datos

```sql
CREATE DATABASE indicadores_desempeno
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

#### Ejecutar Migraciones

```bash
# Si tienes scripts de migración
npm run migrate

# O importar schema manualmente
mysql -u root -p indicadores_desempeno < database/schema.sql
```

#### Importar Datos Iniciales

```bash
# Categorías, zonas, tareas, etc.
mysql -u root -p indicadores_desempeno < database/seed.sql
```

### 4. Verificar Instalación

```bash
# Verificar dependencias
npm list

# Verificar conexión a DB
npm run db:test

# Verificar build
npm run build
```

---

## 🔧 Desarrollo Local

### Iniciar Servidor de Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# La aplicación estará en http://localhost:3000
```

### Variables de Desarrollo

```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
ENABLE_DEBUG=true
LOG_LEVEL=debug
```

### Herramientas de Desarrollo

#### Logs en Tiempo Real

```bash
# Ver logs de la aplicación
tail -f logs/app.log

# Ver logs de errores
tail -f logs/error.log
```

#### Debug de Base de Datos

```bash
# Acceder a MySQL
mysql -u root -p indicadores_desempeno

# Ver conexiones activas
SHOW PROCESSLIST;

# Ver queries lentas
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

#### Debug de Cache

```bash
# Acceder a Redis CLI
redis-cli

# Ver todas las claves
KEYS *

# Ver valor de una clave
GET operator:0046:2025:4

# Limpiar caché
FLUSHALL
```

---

## 🚀 Deployment en Producción

### Opción 1: Servidor VPS/Dedicado con PM2

#### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar MySQL
sudo apt install -y mysql-server

# Instalar Redis (opcional)
sudo apt install -y redis-server
```

#### 2. Configurar Proyecto

```bash
# Clonar proyecto en servidor
cd /var/www
sudo git clone <repository-url> medical-app
cd medical-app

# Cambiar permisos
sudo chown -R www-data:www-data /var/www/medical-app

# Instalar dependencias de producción
npm ci --production

# Configurar variables de entorno
sudo nano .env.production
```

#### 3. Build de Producción

```bash
# Build optimizado
npm run build

# Verificar build
ls -la .next/
```

#### 4. Configurar PM2

Crear archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'indicadores-sao6',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/medical-app',
    instances: 4, // Número de instancias (cores disponibles)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/indicadores-error.log',
    out_file: '/var/log/pm2/indicadores-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

#### 5. Iniciar Aplicación

```bash
# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs indicadores-sao6

# Guardar configuración PM2
pm2 save

# Configurar inicio automático
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www-data --hp /var/www
```

#### 6. Configurar Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/indicadores-sao6

server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/indicadores-access.log;
    error_log /var/log/nginx/indicadores-error.log;

    # Timeouts
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max file upload size
    client_max_body_size 20M;
}
```

Activar sitio:

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/indicadores-sao6 /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

#### 7. Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (ya configurado por defecto)
sudo certbot renew --dry-run
```

---

### Opción 2: Vercel (Recomendado para Next.js)

#### 1. Preparar Proyecto

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login
```

#### 2. Configurar Variables de Entorno

En el dashboard de Vercel o mediante CLI:

```bash
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
# ... etc
```

#### 3. Deploy

```bash
# Deploy a preview
vercel

# Deploy a producción
vercel --prod
```

#### 4. Configurar Dominio

```bash
# Agregar dominio personalizado
vercel domains add tu-dominio.com
```

**Nota**: Con Vercel necesitarás una base de datos accesible externamente (PlanetScale, AWS RDS, etc.)

---

### Opción 3: Docker

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=${DB_NAME}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mysql-data:
  redis-data:
```

#### Comandos Docker

```bash
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down

# Rebuild y reiniciar
docker-compose up -d --build
```

---

## 📊 Monitoreo y Logging

### PM2 Monitoring

```bash
# Dashboard de PM2
pm2 monit

# Métricas
pm2 describe indicadores-sao6

# Logs
pm2 logs indicadores-sao6 --lines 100
```

### Logs de Aplicación

```bash
# Estructura de logs
/var/log/
├── pm2/
│   ├── indicadores-out.log
│   └── indicadores-error.log
├── nginx/
│   ├── indicadores-access.log
│   └── indicadores-error.log
└── mysql/
    └── error.log
```

### Health Check Endpoint

```bash
# Verificar salud de la aplicación
curl http://localhost:3000/api/health

# Response esperado:
{
  "status": "healthy",
  "database": { "status": "up" },
  "redis": { "status": "up" },
  "timestamp": "2025-04-15T10:30:00Z"
}
```

### Monitoreo de Base de Datos

```sql
-- Conexiones activas
SHOW PROCESSLIST;

-- Queries lentas
SELECT * FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;

-- Uso de tablas
SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'indicadores_desempeno'
ORDER BY (data_length + index_length) DESC;
```

### Alertas y Notificaciones

Configurar alertas en PM2:

```bash
# Instalar módulo de notificaciones
pm2 install pm2-slack
pm2 set pm2-slack:slack_url https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

**Síntoma**: `ECONNREFUSED` o `Access denied`

**Solución**:
```bash
# Verificar MySQL está corriendo
sudo systemctl status mysql

# Verificar credenciales
mysql -u usuario -p

# Verificar permisos
GRANT ALL PRIVILEGES ON indicadores_desempeno.* TO 'usuario'@'localhost';
FLUSH PRIVILEGES;

# Verificar host permitido
SELECT user, host FROM mysql.user;
```

#### 2. Out of Memory

**Síntoma**: Aplicación se reinicia constantemente

**Solución**:
```bash
# Aumentar límite de memoria en PM2
pm2 start ecosystem.config.js --max-memory-restart 2G

# Verificar uso de memoria
pm2 monit

# Liberar caché
pm2 flush
```

#### 3. Queries Lentas

**Síntoma**: Respuestas lentas en API

**Solución**:
```sql
-- Activar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Ver queries lentas
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- Analizar query
EXPLAIN SELECT ...;

-- Agregar índices necesarios
CREATE INDEX idx_fecha ON bonos(fecha);
```

#### 4. Caché no Funciona

**Síntoma**: Redis no conecta

**Solución**:
```bash
# Verificar Redis
redis-cli ping
# Debe responder: PONG

# Reiniciar Redis
sudo systemctl restart redis

# Ver logs de Redis
sudo tail -f /var/log/redis/redis-server.log

# Verificar configuración
redis-cli CONFIG GET maxmemory
```

#### 5. Build Fallido

**Síntoma**: `npm run build` falla

**Solución**:
```bash
# Limpiar caché
rm -rf .next node_modules
npm install
npm run build

# Verificar versión de Node
node --version

# Verificar errores de TypeScript
npm run lint
```

---

## 🔄 Actualizaciones

### Actualizar Aplicación

```bash
# En servidor
cd /var/www/medical-app

# Pull cambios
git pull origin main

# Instalar dependencias nuevas
npm install

# Build
npm run build

# Reiniciar con PM2
pm2 reload indicadores-sao6

# Verificar
pm2 logs indicadores-sao6 --lines 50
```

### Rollback

```bash
# Ver commits
git log --oneline -10

# Rollback a versión anterior
git checkout <commit-hash>
npm install
npm run build
pm2 reload indicadores-sao6
```

---

## 📝 Checklist de Deployment

### Pre-Deployment

- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Build exitoso localmente
- [ ] Tests pasando
- [ ] Backup de base de datos
- [ ] SSL configurado
- [ ] Dominio configurado

### Post-Deployment

- [ ] Health check responde OK
- [ ] Login funciona correctamente
- [ ] Datos se visualizan correctamente
- [ ] APIs responden
- [ ] Logs sin errores críticos
- [ ] Monitoreo activo
- [ ] Backup automático configurado

---

## 🔐 Seguridad en Producción

### Checklist de Seguridad

- [ ] Variables sensibles en archivo `.env` (no en código)
- [ ] `.env` en `.gitignore`
- [ ] HTTPS habilitado
- [ ] Firewall configurado (solo puertos necesarios)
- [ ] Base de datos con usuario no-root
- [ ] Contraseñas fuertes
- [ ] Actualizaciones de seguridad aplicadas
- [ ] Logs monitoreados
- [ ] Backups automáticos
- [ ] Rate limiting en API

### Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Ver estado
sudo ufw status
```

---

**Última actualización**: 2025-04-15
