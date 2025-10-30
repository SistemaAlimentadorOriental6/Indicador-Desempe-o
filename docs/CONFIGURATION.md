# Guía de Configuración

Esta guía describe todas las variables de entorno y opciones de configuración del sistema.

## 📋 Variables de Entorno

### Template .env.local

Copia este contenido a un archivo `.env.local` en la raíz del proyecto:

```env
# ====================
# Base de Datos MySQL
# ====================
# Servidor principal de base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_seguro
DB_NAME=indicadores_desempeno
DB_PORT=3306
DB_SSL=false

# ====================
# SQL Server (Opcional)
# ====================
# Configuración de SQL Server si se usa como base de datos secundaria
MSSQL_SERVER=servidor.ejemplo.com
MSSQL_DATABASE=nombre_base_datos
MSSQL_USER=usuario_sqlserver
MSSQL_PASSWORD=password_sqlserver
MSSQL_PORT=1433
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false

# ====================
# Redis Cache (Opcional pero Recomendado)
# ====================
# Configuración de Redis para caché distribuido
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=tu_password_redis
REDIS_TLS=false
REDIS_DB=0

# ====================
# Aplicación
# ====================
# Entorno de ejecución (development, staging, production)
NODE_ENV=development

# URL pública de la aplicación
NEXT_PUBLIC_API_URL=http://localhost:3000

# Puerto del servidor
PORT=3000

# ====================
# Seguridad
# ====================
# Claves secretas para JWT y sesiones (generar con: openssl rand -base64 32)
JWT_SECRET=tu_secret_key_muy_largo_y_seguro_aqui
SESSION_SECRET=otro_secret_key_diferente_y_seguro

# Tiempo de expiración de tokens (en segundos)
JWT_EXPIRATION=86400

# ====================
# Caché
# ====================
# Habilitar o deshabilitar caché
ENABLE_CACHE=true

# TTL por defecto del caché (en segundos)
CACHE_TTL=300

# Usar Redis o Node Cache
USE_REDIS_CACHE=true

# ====================
# Logging
# ====================
# Nivel de log (error, warn, info, debug)
LOG_LEVEL=info

# Habilitar logs de debug
ENABLE_DEBUG=false

# Habilitar logs de queries SQL
ENABLE_QUERY_LOG=false

# ====================
# Performance
# ====================
# Número máximo de conexiones del pool de base de datos
DB_CONNECTION_LIMIT=50

# Timeout de conexión en milisegundos
DB_CONNECTION_TIMEOUT=60000

# Timeout de idle en milisegundos
DB_IDLE_TIMEOUT=300000

# ====================
# Features Flags (Opcional)
# ====================
# Habilitar funcionalidades específicas
ENABLE_ANNUAL_EFFICIENCY=true
ENABLE_EXPORT_EXCEL=true
ENABLE_NOTIFICATIONS=false
ENABLE_EMAIL_REPORTS=false

# ====================
# Integrations (Opcional)
# ====================
# Configuración de servicios externos

# Email (para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@ejemplo.com
SMTP_PASSWORD=tu_password_email
SMTP_FROM=noreply@sao6.com

# Slack (para notificaciones)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ====================
# Límites y Restricciones
# ====================
# Número máximo de resultados por página
MAX_PAGE_SIZE=200

# Tamaño máximo de archivo de subida (en bytes)
MAX_FILE_SIZE=20971520

# Número máximo de requests por minuto
RATE_LIMIT_REQUESTS=100

# ====================
# Desarrollo y Testing
# ====================
# Usar datos de prueba
USE_TEST_DATA=false

# Habilitar modo de depuración
DEBUG_MODE=false

# Mostrar errores detallados
SHOW_ERROR_DETAILS=false
```

---

## 📖 Descripción Detallada de Variables

### Base de Datos MySQL

#### DB_HOST
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: Dirección del servidor MySQL
- **Ejemplos**: 
  - `localhost` (desarrollo local)
  - `192.168.1.100` (servidor local)
  - `db.ejemplo.com` (servidor remoto)

#### DB_USER
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: Usuario de MySQL
- **Nota**: No usar 'root' en producción

#### DB_PASSWORD
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: Contraseña del usuario de MySQL
- **Seguridad**: Debe ser una contraseña fuerte (mínimo 12 caracteres)

#### DB_NAME
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: Nombre de la base de datos
- **Ejemplo**: `indicadores_desempeno`

#### DB_PORT
- **Tipo**: Number
- **Requerido**: No
- **Default**: 3306
- **Descripción**: Puerto de MySQL

#### DB_SSL
- **Tipo**: Boolean
- **Requerido**: No
- **Default**: false
- **Descripción**: Usar SSL para conexión (recomendado en producción)

---

### Redis Cache

#### REDIS_URL
- **Tipo**: String
- **Requerido**: No (pero recomendado en producción)
- **Descripción**: URL de conexión a Redis
- **Formato**: `redis://[usuario]:[password]@[host]:[puerto]`
- **Ejemplos**:
  - `redis://localhost:6379`
  - `redis://:password@redis-server:6379`

#### REDIS_PASSWORD
- **Tipo**: String
- **Requerido**: No
- **Descripción**: Contraseña de Redis
- **Nota**: Requerido si Redis está protegido por contraseña

#### USE_REDIS_CACHE
- **Tipo**: Boolean
- **Requerido**: No
- **Default**: true
- **Descripción**: Si es false, usa Node Cache en memoria

---

### Aplicación

#### NODE_ENV
- **Tipo**: Enum
- **Valores**: `development`, `staging`, `production`
- **Requerido**: Sí
- **Descripción**: Entorno de ejecución
- **Efecto**:
  - `development`: Más logs, hot reload, errores detallados
  - `production`: Optimizaciones, menos logs, errores genéricos

#### NEXT_PUBLIC_API_URL
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: URL base de la API
- **Nota**: Variables con `NEXT_PUBLIC_` son expuestas al cliente

#### PORT
- **Tipo**: Number
- **Requerido**: No
- **Default**: 3000
- **Descripción**: Puerto donde correrá el servidor

---

### Seguridad

#### JWT_SECRET
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: Clave secreta para firmar JWT
- **Generar**: `openssl rand -base64 32`
- **Importante**: NUNCA compartir o commitear al repositorio

#### SESSION_SECRET
- **Tipo**: String
- **Requerido**: Sí
- **Descripción**: Clave secreta para sesiones
- **Nota**: Debe ser diferente a JWT_SECRET

---

### Logging

#### LOG_LEVEL
- **Tipo**: Enum
- **Valores**: `error`, `warn`, `info`, `debug`
- **Requerido**: No
- **Default**: `info`
- **Descripción**: Nivel de detalle de los logs

#### ENABLE_DEBUG
- **Tipo**: Boolean
- **Requerido**: No
- **Default**: false
- **Descripción**: Habilita logs adicionales de debug
- **Nota**: Solo usar en desarrollo

#### ENABLE_QUERY_LOG
- **Tipo**: Boolean
- **Requerido**: No
- **Default**: false
- **Descripción**: Registra todas las queries SQL ejecutadas
- **Nota**: Útil para debugging pero afecta performance

---

### Performance

#### DB_CONNECTION_LIMIT
- **Tipo**: Number
- **Requerido**: No
- **Default**: 50
- **Descripción**: Número máximo de conexiones simultáneas al pool
- **Recomendación**: 
  - Desarrollo: 10-20
  - Producción: 50-100

#### CACHE_TTL
- **Tipo**: Number (segundos)
- **Requerido**: No
- **Default**: 300 (5 minutos)
- **Descripción**: Tiempo de vida del caché por defecto

---

## 🔐 Mejores Prácticas de Seguridad

### 1. Nunca Commitear .env

```bash
# Verificar que .env esté en .gitignore
cat .gitignore | grep .env

# Debe mostrar:
.env
.env.local
.env*.local
```

### 2. Usar Contraseñas Fuertes

```bash
# Generar contraseñas seguras
openssl rand -base64 32
```

### 3. Diferentes Secrets por Ambiente

```
desarrollo:  JWT_SECRET=dev_secret_123
staging:     JWT_SECRET=staging_secret_456
producción:  JWT_SECRET=prod_secret_789
```

### 4. Rotar Secrets Regularmente

- JWT_SECRET: Cada 6 meses
- DB_PASSWORD: Cada 3 meses
- REDIS_PASSWORD: Cada 3 meses

### 5. Usar Gestores de Secrets

En producción, considerar:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

---

## 🔧 Configuración por Ambiente

### Desarrollo

```env
NODE_ENV=development
ENABLE_DEBUG=true
ENABLE_QUERY_LOG=true
LOG_LEVEL=debug
USE_TEST_DATA=true
DB_CONNECTION_LIMIT=10
```

### Staging

```env
NODE_ENV=staging
ENABLE_DEBUG=false
ENABLE_QUERY_LOG=false
LOG_LEVEL=info
USE_TEST_DATA=false
DB_CONNECTION_LIMIT=30
```

### Producción

```env
NODE_ENV=production
ENABLE_DEBUG=false
ENABLE_QUERY_LOG=false
LOG_LEVEL=warn
USE_TEST_DATA=false
DB_CONNECTION_LIMIT=50
DB_SSL=true
REDIS_TLS=true
```

---

## 🧪 Validación de Configuración

### Script de Validación

Crear `scripts/validate-env.js`:

```javascript
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'SESSION_SECRET'
]

function validateEnv() {
  const missing = []
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Variables de entorno faltantes:')
    missing.forEach(v => console.error(`  - ${v}`))
    process.exit(1)
  }
  
  console.log('✅ Todas las variables requeridas están configuradas')
}

validateEnv()
```

Ejecutar:

```bash
node scripts/validate-env.js
```

---

## 📝 Checklist de Configuración

### Desarrollo Local

- [ ] Copiar `.env.example` a `.env.local`
- [ ] Configurar credenciales de MySQL
- [ ] Generar JWT_SECRET y SESSION_SECRET
- [ ] Configurar NEXT_PUBLIC_API_URL
- [ ] Validar con `npm run dev`

### Staging/Producción

- [ ] Crear `.env` o `.env.production` en servidor
- [ ] Usar contraseñas fuertes y únicas
- [ ] Habilitar SSL para DB (DB_SSL=true)
- [ ] Configurar Redis para caché
- [ ] Establecer LOG_LEVEL apropiado
- [ ] Configurar SMTP si se usan notificaciones
- [ ] Validar health check: `/api/health`
- [ ] Configurar backup automático de .env

---

## 🔄 Actualización de Configuración

### En Desarrollo

```bash
# Editar .env.local
nano .env.local

# Reiniciar servidor
npm run dev
```

### En Producción con PM2

```bash
# Editar .env
nano .env

# Recargar aplicación
pm2 reload indicadores-sao6
```

---

## 🆘 Troubleshooting

### Error: "Environment variable not found"

**Solución**: Verificar que la variable esté en .env.local

```bash
grep VARIABLE_NAME .env.local
```

### Error: "Cannot connect to database"

**Solución**: Verificar credenciales de DB

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME
```

### Error: "Redis connection failed"

**Solución**: Verificar que Redis esté corriendo

```bash
redis-cli -h localhost -p 6379 ping
```

---

**Última actualización**: 2025-04-15
