# 🔧 Guía de Instalación y Configuración - SAO6

Guía técnica completa para la instalación, configuración y despliegue del sistema SAO6.

## 📋 **Prerrequisitos del Sistema**

### **Requisitos de Software**
- **Node.js 18.0+** (Recomendado: 20.0+)
- **npm 9.0+** o **yarn 1.22+**
- **Git 2.30+**
- **Microsoft SQL Server 2019+** o **SQL Server Express**

### **Requisitos de Hardware**
- **RAM**: Mínimo 8GB (Recomendado: 16GB+)
- **Procesador**: Intel i5 o AMD Ryzen 5 (4 núcleos)
- **Almacenamiento**: 10GB libres mínimo
- **Red**: Conexión estable a internet

---

## 🚀 **Instalación Paso a Paso**

### **1. Preparación del Entorno**

#### **1.1 Instalar Node.js**
```bash
# Verificar versión instalada
node --version
npm --version

# Si no está instalado, descargar desde:
# https://nodejs.org/es/download/
```

#### **1.2 Instalar Git**
```bash
# Verificar instalación
git --version

# Configurar Git (primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@empresa.com"
```

### **2. Obtener el Código Fuente**

#### **2.1 Clonar el Repositorio**
```bash
# Clonar desde repositorio
git clone [URL_DEL_REPOSITORIO_SAO6]
cd medical-app

# Verificar estructura
ls -la
```

#### **2.2 Verificar Archivos Principales**
```bash
# Debe contener:
# ├── package.json
# ├── next.config.mjs
# ├── tailwind.config.ts
# ├── tsconfig.json
# └── app/
```

### **3. Configuración de Dependencias**

#### **3.1 Instalar Paquetes npm**
```bash
# Usando npm
npm install

# O usando yarn
yarn install

# Verificar instalación exitosa
npm list --depth=0
```

#### **3.2 Verificar Dependencias Críticas**
```bash
# Verificar que estén instaladas:
npm list next
npm list react
npm list typescript
npm list @radix-ui/react-dialog
npm list framer-motion
```

### **4. Configuración de Base de Datos**

#### **4.1 SQL Server Setup**
```sql
-- Crear base de datos (ejecutar en SQL Server Management Studio)
CREATE DATABASE SAO6_DB;
USE SAO6_DB;

-- Crear usuario para la aplicación
CREATE LOGIN sao6_app WITH PASSWORD = 'tu_password_seguro';
CREATE USER sao6_app FOR LOGIN sao6_app;

-- Otorgar permisos necesarios
ALTER ROLE db_datareader ADD MEMBER sao6_app;
ALTER ROLE db_datawriter ADD MEMBER sao6_app;
ALTER ROLE db_ddladmin ADD MEMBER sao6_app;
```

#### **4.2 Configurar Cadena de Conexión**
```bash
# Crear archivo .env.local en la raíz del proyecto
touch .env.local
```

### **5. Variables de Entorno**

#### **5.1 Configuración de .env.local**
```env
# Base de datos
DATABASE_URL="mssql://sao6_app:tu_password@localhost:1433/SAO6_DB"
DB_HOST="localhost"
DB_PORT="1433"
DB_NAME="SAO6_DB"
DB_USER="sao6_app"
DB_PASSWORD="tu_password_seguro"

# Autenticación
NEXTAUTH_SECRET="clave_secreta_muy_fuerte_y_aleatoria_de_32_caracteres_minimo"
NEXTAUTH_URL="http://localhost:3000"

# Entorno
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Cache
CACHE_TTL="300"

# Logging
LOG_LEVEL="info"
```

#### **5.2 Generar NEXTAUTH_SECRET**
```bash
# Generar secret seguro
openssl rand -base64 32

# O usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **6. Configuración de Desarrollo**

#### **6.1 Scripts de Configuración**
```bash
# Hacer ejecutables los scripts
chmod +x scripts/*.js

# Verificar conexión a DB
node scripts/check-db-connection.js

# Verificar esquema de DB
node scripts/db-schema-check.js
```

#### **6.2 Configuración de TypeScript**
```bash
# Verificar configuración TypeScript
npx tsc --noEmit

# Instalar tipos adicionales si es necesario
npm install --save-dev @types/mssql @types/js-cookie
```

---

## 🔧 **Configuración Avanzada**

### **SSL/HTTPS (Producción)**

#### **Configurar HTTPS**
```bash
# Generar certificados SSL (desarrollo)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Actualizar next.config.mjs para HTTPS
```

### **Configuración de Proxy (Opcional)**
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://admon.sao6.com.co/:path*'
      }
    ]
  }
}
```

---

## 🚦 **Ejecución y Testing**

### **1. Modo Desarrollo**

#### **1.1 Iniciar Servidor de Desarrollo**
```bash
# Opción 1: npm
npm run dev

# Opción 2: yarn
yarn dev

# Opción 3: con puerto específico
npm run dev -- -p 3001
```

#### **1.2 Verificar Funcionamiento**
```bash
# Abrir en navegador:
# http://localhost:3000

# Verificar logs en consola
# Debe mostrar: "Ready - started server on 0.0.0.0:3000"
```

### **2. Testing de Funcionalidades**

#### **2.1 Test de Login**
1. **Ir a**: `http://localhost:3000`
2. **Probar cédula válida**: (ejemplo: 12345678)
3. **Probar contraseña**: (según configuración)
4. **Verificar redirección** al dashboard

#### **2.2 Test de APIs**
```bash
# Test endpoint de usuarios
curl http://localhost:3000/api/admin/users

# Test endpoint de bonos
curl http://localhost:3000/api/user/bonuses?codigo=EMP001

# Test endpoint de kilómetros
curl http://localhost:3000/api/user/kilometers?codigo=EMP001
```

### **3. Debugging y Logs**

#### **3.1 Habilitar Logs Detallados**
```env
# En .env.local
LOG_LEVEL="debug"
DEBUG="sao6:*"
```

#### **3.2 Verificar Logs de Base de Datos**
```bash
# Revisar logs en consola del servidor
# Buscar errores de conexión o consultas SQL
```

---

## 📦 **Build y Despliegue**

### **1. Build de Producción**

#### **1.1 Crear Build Optimizado**
```bash
# Limpiar cache anterior
rm -rf .next/

# Crear build de producción
npm run build

# Verificar que no hay errores
echo $?  # Debe retornar 0
```

#### **1.2 Verificar Archivos de Build**
```bash
# Verificar estructura de .next/
ls -la .next/

# Debe contener:
# ├── static/
# ├── server/
# └── standalone/ (si está configurado)
```

### **2. Despliegue Local**
```bash
# Iniciar servidor de producción
npm run start

# Verificar en:
# http://localhost:3000
```

### **3. Despliegue en Servidor**

#### **3.1 Configuración de Servidor**
```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Crear archivo ecosystem.config.js
```

#### **3.2 ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'sao6-app',
    script: 'npm',
    args: 'start',
    cwd: '/ruta/al/proyecto/medical-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80
    }
  }]
}
```

#### **3.3 Iniciar con PM2**
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save

# Configurar auto-inicio
pm2 startup
```

---

## 🔒 **Configuración de Seguridad**

### **1. Variables de Entorno de Producción**
```env
# .env.production
NODE_ENV="production"
DATABASE_URL="mssql://user:pass@server:1433/database"
NEXTAUTH_SECRET="secret_muy_fuerte_de_64_caracteres_minimo_para_produccion"
NEXTAUTH_URL="https://tu-dominio.com"

# Seguridad adicional
ALLOWED_ORIGINS="https://tu-dominio.com,https://www.tu-dominio.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
```

### **2. Configuración de Firewall**
```bash
# Abrir puertos necesarios
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1433/tcp  # SQL Server (solo si es necesario)

# Habilitar firewall
sudo ufw enable
```

### **3. SSL/TLS Setup**
```bash
# Instalar Certbot para Let's Encrypt
sudo apt install certbot

# Generar certificado SSL
sudo certbot certonly --standalone -d tu-dominio.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 **Troubleshooting**

### **Problemas Comunes**

#### **1. Error de Conexión a Base de Datos**
```bash
# Verificar conexión
telnet localhost 1433

# Verificar usuario y permisos
sqlcmd -S localhost -U sao6_app -P tu_password
```

#### **2. Errores de Node.js**
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install
```

#### **3. Errores de TypeScript**
```bash
# Verificar configuración
npx tsc --showConfig

# Compilar sin emit
npx tsc --noEmit --skipLibCheck
```

#### **4. Errores de Build**
```bash
# Limpiar y rebuildar
rm -rf .next/
npm run build

# Verificar dependencias
npm audit
npm audit fix
```

### **Logs Útiles**
```bash
# Logs de PM2
pm2 logs sao6-app

# Logs de sistema
sudo journalctl -u nginx
sudo tail -f /var/log/nginx/error.log

# Logs de aplicación
tail -f logs/app.log
```

---

## 📊 **Monitoreo y Mantenimiento**

### **Métricas a Monitorear**
- **CPU y memoria** del servidor
- **Conexiones a base de datos**
- **Tiempo de respuesta** de APIs
- **Errores de aplicación**
- **Espacio en disco**

### **Comandos de Mantenimiento**
```bash
# Verificar estado de la aplicación
pm2 status

# Reiniciar aplicación
pm2 restart sao6-app

# Actualizar código
git pull origin main
npm install
npm run build
pm2 restart sao6-app

# Backup de base de datos
sqlcmd -S localhost -E -Q "BACKUP DATABASE SAO6_DB TO DISK='C:\Backup\SAO6_DB.bak'"
```

---

## 📞 **Soporte Técnico**

### **Información de Debug**
Cuando reportes un problema, incluye:
- **Versión de Node.js**: `node --version`
- **Versión de npm**: `npm --version`
- **Sistema operativo**: `uname -a` (Linux/Mac) o `ver` (Windows)
- **Logs de error**: Copia completa del error
- **Variables de entorno**: (sin datos sensibles)

### **Contacto de Soporte**
- **Documentación**: `/docs/`
- **Issues**: Repositorio Git
- **Logs**: Carpeta `/logs/`

---

*🔧 Configuración técnica completada - Sistema SAO6 operativo*