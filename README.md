# 📊 SAO6 - Sistema de Gestión de Desempeño de Operadores

Sistema integral para el monitoreo, análisis y gestión del desempeño de operadores de SAO6, con seguimiento de kilómetros, gestión de bonos y análisis de rendimiento en tiempo real.

## 🎯 **Descripción del Proyecto**

SAO6 es una aplicación web moderna construida con **Next.js 15**, **React 19** y **TypeScript** que permite a los administradores y operadores monitorear el desempeño, gestionar bonos y analizar métricas de rendimiento de manera eficiente y intuitiva.

### 🏗️ **Arquitectura del Sistema**

La aplicación se estructura en **3 vistas principales**:

1. **🔐 Vista de Autenticación (Login)**
2. **👤 Vista de Usuario (Dashboard Personal)**
3. **🛠️ Vista de Administrador (Panel Administrativo)**

---

## 🚀 **Características Principales**

### 🔐 **Sistema de Autenticación**
- **Autenticación segura** con validación de cédula
- **Sistema de recordar sesión** con cookies seguras
- **Validación de intentos** de login fallidos
- **Auto-login** para usuarios autenticados
- **Transiciones suaves** y feedback visual

### 👤 **Dashboard de Usuario**
- **Perfil personalizado** con foto de empleado
- **Métricas de rendimiento** en tiempo real
- **Seguimiento de kilómetros** programados vs ejecutados
- **Historial de bonos** y afectaciones
- **Análisis de progreso** anual
- **Interfaz responsive** optimizada para móvil y desktop

### 🛠️ **Panel de Administración**
- **Dashboard analítico** con KPIs principales
- **Gestión completa de usuarios** activos
- **Sistema de bonos** con cálculo automático
- **Seguimiento de kilómetros** de todos los operadores
- **Rankings de rendimiento** y productividad
- **Reportes detallados** y análisis comparativo

---

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**
- **Next.js 15** - Framework React de última generación
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Superset tipado de JavaScript
- **Tailwind CSS** - Framework CSS utilitario
- **Framer Motion** - Biblioteca de animaciones
- **Radix UI** - Componentes accesibles
- **Recharts** - Gráficos y visualizaciones

### **Backend & Base de Datos**
- **Next.js API Routes** - Endpoints del servidor
- **Microsoft SQL Server** - Base de datos principal
- **Node Cache** - Sistema de caché en memoria
- **Server-Side Rendering** - Renderizado del lado del servidor

### **Herramientas de Desarrollo**
- **ESLint** - Linter de código
- **PostCSS** - Procesador CSS
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **js-cookie** - Gestión de cookies

---

## 📁 **Estructura del Proyecto**

```
medical-app/
├── app/                          # Rutas de Next.js 13+ (App Router)
│   ├── admin/                    # Rutas de administración
│   ├── api/                      # Endpoints de la API
│   │   ├── auth/                 # Autenticación
│   │   ├── user/                 # Datos de usuario
│   │   └── admin/                # Funciones administrativas
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes base de UI
│   ├── admin/                    # Componentes de administración
│   ├── bonos/                    # Gestión de bonos
│   ├── dashboard/                # Dashboard de usuario
│   ├── kilometros/               # Seguimiento de kilómetros
│   ├── operadores/               # Gestión de operadores
│   └── users/                    # Gestión de usuarios
├── hooks/                        # Hooks personalizados
├── types/                        # Definiciones de TypeScript
├── utils/                        # Utilidades y helpers
├── data/                         # Datos estáticos
└── public/                       # Archivos estáticos
```

---

## 🚀 **Instalación y Configuración**

### **Prerrequisitos**
- **Node.js 18+**
- **npm 9+** o **yarn**
- **Microsoft SQL Server** configurado
- **Git** para control de versiones

### **Pasos de Instalación**

1. **Clonar el repositorio**
```bash
git clone [URL_DEL_REPOSITORIO]
cd medical-app
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env.local
DATABASE_URL="tu_cadena_de_conexion_sql_server"
NEXTAUTH_SECRET="tu_clave_secreta"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
# o
yarn dev
```

5. **Acceder a la aplicación**
```
http://localhost:3000
```

---

## 🔐 **Autenticación y Roles**

### **Roles de Usuario**

#### **👤 Usuario Operador**
- **Acceso a dashboard personal**
- **Visualización de métricas propias**
- **Consulta de bonos y kilómetros**
- **Análisis de rendimiento personal**

#### **🛠️ Administrador**
- **Acceso completo al sistema**
- **Gestión de todos los usuarios**
- **Configuración de bonos**
- **Reportes globales**
- **Analytics avanzados**

### **Sistema de Autenticación**
- **Autenticación por cédula** y contraseña
- **Sesiones persistentes** con cookies HTTPOnly
- **Validación de intentos** fallidos
- **Logout automático** por inactividad

---

## 📊 **Funcionalidades Detalladas**

### 🏠 **Dashboard de Usuario**

#### **Métricas Principales**
- **🏃‍♂️ Kilómetros Ejecutados**: Seguimiento en tiempo real
- **💰 Bonos Acumulados**: Cálculo automático mensual
- **📈 Eficiencia**: Porcentaje de cumplimiento
- **🎯 Metas**: Objetivos anuales y mensuales

#### **Análisis de Rendimiento**
- **Gráficos interactivos** de progreso
- **Comparativas mensuales** de desempeño
- **Tendencias de eficiencia** a lo largo del tiempo
- **Alertas de rendimiento** automáticas

### 🛠️ **Panel de Administración**

#### **Gestión de Usuarios**
- **Lista completa** de operadores activos
- **Filtros avanzados** por zona, rol, estado
- **Perfiles detallados** con historial completo
- **Métricas de productividad** individuales

#### **Sistema de Bonos**
- **Cálculo automático** basado en KPIs
- **Gestión de afectaciones** y descuentos
- **Historial mensual** detallado
- **Reportes de bonificaciones** por período

#### **Seguimiento de Kilómetros**
- **Monitoreo en tiempo real** de todos los operadores
- **Comparativas de rendimiento** por equipo
- **Análisis de confiabilidad** y cumplimiento
- **Alertas de desviaciones** significativas

#### **Rankings y Reportes**
- **Clasificaciones automáticas** por rendimiento
- **Reportes ejecutivos** personalizables
- **Exportación de datos** en múltiples formatos
- **Dashboard analítico** con KPIs principales

---

## 🎨 **Diseño e Interfaz**

### **Principios de Diseño**
- **🎯 Centrado en el usuario**: Interfaz intuitiva y accesible
- **📱 Responsive**: Optimizado para todos los dispositivos
- **⚡ Performance**: Carga rápida y navegación fluida
- **🎨 Moderno**: Diseño limpio con animaciones sutiles

### **Características UI/UX**
- **Tema claro/oscuro** adaptativo
- **Animaciones suaves** con Framer Motion
- **Componentes accesibles** con Radix UI
- **Feedback visual** en todas las interacciones
- **Loading states** optimizados
- **Error handling** elegante

---

## 🔧 **API y Endpoints**

### **Autenticación**
```typescript
POST /api/auth/login
```

### **Usuario**
```typescript
GET /api/user/profile-data?codigo={codigo}
GET /api/user/kilometers?codigo={codigo}
GET /api/user/bonuses?codigo={codigo}
GET /api/user/yearly-progress?codigo={codigo}
POST /api/user/bonuses/batch
```

### **Administración**
```typescript
GET /api/admin/users
GET /api/admin/statistics
GET /api/admin/recent-activities
GET /api/admin/top-performers
```

---

## 📈 **Performance y Optimización**

### **Optimizaciones Implementadas**
- **⚡ Server-Side Rendering** para carga inicial rápida
- **🔄 React Query** para caché inteligente de datos
- **📦 Code Splitting** con componentes lazy
- **🖼️ Optimización de imágenes** con Next.js Image
- **💾 Caché de sesión** para reducir peticiones
- **🗜️ Compresión automática** de assets

### **Métricas de Performance**
- **First Contentful Paint**: < 1.2s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.8s
- **Cumulative Layout Shift**: < 0.1

---

## 🔒 **Seguridad**

### **Medidas de Seguridad Implementadas**
- **🔐 Autenticación segura** con hash de contraseñas
- **🍪 Cookies HTTPOnly** para sesiones
- **🛡️ Validación de entrada** con Zod
- **🚫 Protección CSRF** integrada
- **🔒 Sanitización** de datos de usuario
- **⏱️ Rate limiting** en endpoints críticos

---

## 📱 **Responsive Design**

### **Breakpoints Principales**
- **📱 Mobile**: 320px - 768px
- **📟 Tablet**: 768px - 1024px
- **💻 Desktop**: 1024px - 1440px
- **🖥️ Large Desktop**: 1440px+

### **Adaptaciones por Dispositivo**
- **Mobile**: Navegación por tabs, diseño vertical
- **Tablet**: Sidebar colapsible, grids adaptados
- **Desktop**: Sidebar fijo, múltiples columnas

---

## 🧪 **Testing y Quality Assurance**

### **Scripts de Testing**
```bash
# Ejecutar tests
npm run test

# Coverage report
npm run test:coverage

# Linting
npm run lint

# Type checking
npm run type-check
```

### **Herramientas de QA**
- **ESLint** para consistencia de código
- **TypeScript** para type safety
- **Prettier** para formato automático

---

## 🚀 **Deployment**

### **Producción**
```bash
# Build para producción
npm run build

# Iniciar servidor de producción
npm run start
```

### **Variables de Entorno de Producción**
```env
DATABASE_URL=tu_cadena_de_conexion_produccion
NEXTAUTH_SECRET=clave_secreta_fuerte
NEXTAUTH_URL=https://tu-dominio.com
NODE_ENV=production
```

---

## 📋 **Scripts Disponibles**

```json
{
  "dev": "Servidor de desarrollo",
  "build": "Build de producción",
  "start": "Servidor de producción",
  "lint": "Análisis de código"
}
```

---

## 🤝 **Contribución**

### **Proceso de Contribución**
1. **Fork** el repositorio
2. **Crear branch** para nueva feature
3. **Implementar** cambios con tests
4. **Ejecutar** linting y tests
5. **Crear Pull Request** con descripción detallada

### **Estándares de Código**
- **TypeScript** obligatorio para nuevos archivos
- **ESLint** debe pasar sin errores
- **Componentes** deben ser tipados
- **Funciones** deben incluir JSDoc

---

## 📊 **Métricas del Proyecto**

### **Estadísticas de Código**
- **Líneas de código**: ~15,000+
- **Componentes**: 50+
- **Hooks personalizados**: 10+
- **Endpoints API**: 15+
- **Tipos TypeScript**: 25+

### **Funcionalidades**
- **✅ Autenticación completa**
- **✅ Dashboard de usuario**
- **✅ Panel de administración**
- **✅ Gestión de bonos**
- **✅ Seguimiento de kilómetros**
- **✅ Sistema de rankings**
- **✅ Reportes analíticos**

---

## 🎉 **Reconocimientos**

- **Next.js Team** - Framework excepcional
- **Tailwind CSS** - Sistema de diseño eficiente
- **Radix UI** - Componentes accesibles
- **Framer Motion** - Animaciones fluidas

---

*🔧 Desarrollado con ❤️ por el equipo de mejora continua*