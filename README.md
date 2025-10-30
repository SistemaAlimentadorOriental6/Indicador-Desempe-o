# Sistema de Indicadores de Desempeño SAO6

Sistema web para el seguimiento y gestión del desempeño de operadores del Sistema Alimentador Oriental 6 (SAO6), que permite visualizar métricas de eficiencia, bonos, kilómetros y deducciones en tiempo real.

## 📋 Descripción General

El **Indicador de Desempeño** es una aplicación web que permite:
- Monitorear el rendimiento de operadores en tiempo real
- Calcular eficiencias anuales, mensuales y actuales
- Gestionar bonos y kilómetros de operadores
- Categorizar operadores según su desempeño (Oro, Plata, Bronce, Mejorar, Taller Conciencia)
- Administrar deducciones y novedades que afectan el rendimiento
- Generar rankings y análisis comparativos

## 🚀 Tecnologías

### Frontend
- **Next.js 15.2.4** - Framework de React con App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 3.4** - Estilos utilitarios
- **Radix UI** - Componentes accesibles
- **Framer Motion** - Animaciones
- **Recharts** - Gráficos y visualizaciones
- **TanStack React Query** - Gestión de estado del servidor
- **React Hook Form + Zod** - Formularios y validación

### Backend
- **Next.js API Routes** - Backend serverless
- **MySQL 2** - Base de datos principal
- **MS SQL** - Base de datos secundaria
- **Redis** - Caché de alto rendimiento
- **Node Cache** - Caché en memoria

### Herramientas
- **date-fns** - Manipulación de fechas
- **XLSX** - Exportación de datos
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast

## 📂 Estructura del Proyecto

```
medical-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Endpoints de administración
│   │   ├── auth/                # Autenticación
│   │   ├── user/                # Endpoints de usuario
│   │   └── health/              # Health checks
│   ├── admin/                    # Panel de administración
│   ├── dashboard/                # Dashboard de usuario
│   ├── operadores/               # Vista de operadores
│   ├── rankings/                 # Rankings de operadores
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página de inicio/login
│
├── components/                   # Componentes de React
│   ├── admin/                   # Componentes de administración
│   ├── dashboard/               # Componentes del dashboard
│   ├── operadores/              # Componentes de operadores
│   ├── users/                   # Componentes de usuarios
│   ├── config/                  # Componentes de configuración
│   ├── ui/                      # Componentes UI reutilizables
│   └── *.tsx                    # Componentes globales
│
├── lib/                         # Lógica de negocio y utilidades
│   ├── services/                # Servicios de negocio
│   │   ├── bonuses.service.ts  # Lógica de bonos
│   │   ├── kilometers.service.ts # Lógica de kilómetros
│   │   └── faults.service.ts   # Lógica de faltas
│   ├── database.ts              # Gestión de conexiones DB
│   ├── cache-manager.ts         # Gestor de caché Redis
│   ├── cache.ts                 # Caché en memoria
│   ├── deductions-config.ts     # Configuración de deducciones
│   ├── api-helpers.ts           # Helpers para API
│   └── utils.ts                 # Utilidades generales
│
├── types/                       # Definiciones de TypeScript
│   ├── operator-types.ts        # Tipos de operadores
│   ├── kpi.ts                   # Tipos de KPIs
│   ├── km-types.ts              # Tipos de kilómetros
│   ├── user-types.ts            # Tipos de usuarios
│   └── modal-detalle.types.ts   # Tipos de modales
│
├── hooks/                       # React Hooks personalizados
│   ├── use-auth.tsx            # Hook de autenticación
│   └── *.ts                     # Otros hooks
│
├── utils/                       # Utilidades auxiliares
├── data/                        # Datos estáticos
├── public/                      # Archivos públicos
└── styles/                      # Estilos globales
```

## 🔧 Configuración e Instalación

### Prerrequisitos
- Node.js 18 o superior
- MySQL Server
- Redis (opcional, para caché)
- SQL Server (para datos secundarios)

### Variables de Entorno

Crear archivo `.env.local` con las siguientes variables:

```env
# Base de Datos MySQL Principal
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nombre_base_datos
DB_PORT=3306
DB_SSL=false

# SQL Server (opcional)
MSSQL_SERVER=servidor_sqlserver
MSSQL_DATABASE=nombre_bd
MSSQL_USER=usuario
MSSQL_PASSWORD=password

# Redis (opcional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=tu_password_redis

# Configuración de la aplicación
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

La aplicación estará disponible en `http://localhost:3000`

## 📊 Conceptos Clave del Negocio

### Categorías de Desempeño

Los operadores se clasifican en 5 categorías según su eficiencia:

| Categoría | Rango de Eficiencia | Color | Descripción |
|-----------|---------------------|-------|-------------|
| **Oro** | ≥ 95% | Dorado | Excelente desempeño |
| **Plata** | 90% - 94.9% | Plateado | Muy buen desempeño |
| **Bronce** | 85% - 89.9% | Bronce | Buen desempeño |
| **Mejorar** | 80% - 84.9% | Amarillo | Requiere mejora |
| **Taller Conciencia** | < 80% | Rojo | Requiere intervención |

### Cálculo de Eficiencia

La eficiencia global se calcula como:

```
Eficiencia Global = (Eficiencia de Bonos + Eficiencia de KM) / 2
```

Donde:
- **Eficiencia de Bonos**: Basada en cumplimiento de bonos menos deducciones
- **Eficiencia de KM**: Basada en kilómetros ejecutados vs programados

### Deducciones

Las deducciones se clasifican en dos tipos:

#### ✅ Que afectan desempeño:
- Incapacidad (0.25 del bono)
- Ausentismo (1.00 del bono)
- Retardo (0.25 del bono)
- Suspensión (por día)
- Restricción (1.00 del bono)
- Daños (Leve: 0.25, Grave: 0.50, Gravísimo: 1.00)
- Desincentivos (Leve: 0.25, Grave: 0.50, Gravísimo: 1.00)
- Faltas (Menor: 0.25, Media: 0.50, Grave: 1.00)

#### ❌ Que NO afectan desempeño:
- Calamidad
- Vacaciones
- Día No Remunerado
- No Ingreso

### Tipos de Filtros Temporales

El sistema soporta tres niveles de análisis:
- **Global**: Eficiencia de todo el histórico
- **Anual**: Eficiencia del año específico
- **Mensual**: Eficiencia del mes específico

## 🎯 Características Principales

### Para Operadores (Vista Usuario)

1. **Dashboard Personal**
   - Eficiencia actual, mensual y anual
   - Gráficos de progreso
   - Detalles de bonos y kilómetros
   - Historial de deducciones

2. **Tarjetas de Progreso**
   - Eficiencia actual
   - Eficiencia mensual
   - Eficiencia anual
   - Bonos acumulados
   - Kilómetros ejecutados

3. **Detalles de Desempeño**
   - Lista de bonos con fechas
   - Kilómetros programados vs ejecutados
   - Deducciones aplicadas
   - Historial de categoría

### Para Administradores

1. **Panel de Administración**
   - Vista global de todos los operadores
   - Filtros avanzados (categoría, zona, actividad)
   - Rankings en tiempo real
   - Exportación de datos

2. **Gestión de Operadores**
   - Búsqueda y filtrado
   - Detalles completos de cada operador
   - Análisis comparativo
   - Gráficos de tendencias

3. **Configuración**
   - Gestión de deducciones
   - Configuración de categorías
   - Parámetros de eficiencia
   - Gestión de zonas y tareas

4. **Reportes**
   - Rankings por categoría
   - Comparativas temporales
   - Análisis de tendencias
   - Exportación a Excel

## 🔗 API Endpoints

### Autenticación
```
POST /api/auth/login          # Iniciar sesión
POST /api/auth/logout         # Cerrar sesión
GET  /api/auth/verify         # Verificar sesión
```

### Usuario
```
GET  /api/user/global-efficiency       # Eficiencia global del usuario
GET  /api/user/available-dates         # Fechas disponibles
GET  /api/user/bonus-data              # Datos de bonos
GET  /api/user/km-data                 # Datos de kilómetros
GET  /api/user/deductions              # Deducciones del usuario
GET  /api/user/profile                 # Perfil del usuario
```

### Administración
```
GET  /api/admin/operators              # Lista de operadores
GET  /api/admin/rankings               # Rankings
GET  /api/admin/statistics             # Estadísticas globales
GET  /api/admin/operator/:id           # Detalle de operador
GET  /api/admin/export                 # Exportar datos
POST /api/admin/update-deduction       # Actualizar deducción
```

### Utilidades
```
GET  /api/health                       # Estado del sistema
GET  /api/daily-activity              # Actividad diaria
```

## 💾 Base de Datos

### Tablas Principales

- **usuarios**: Información de operadores
- **bonos**: Registro de bonos
- **kilometros**: Kilómetros programados y ejecutados
- **novedades**: Deducciones y eventos
- **categorias**: Categorías de desempeño
- **zonas**: Zonas de operación
- **tareas**: Tipos de tareas

### Optimizaciones

- **Connection Pooling**: Pool de 50 conexiones MySQL
- **Query Caching**: Caché de 5 segundos para requests duplicados
- **Redis Caching**: Caché persistente para datos frecuentes
- **Request Deduplication**: Evita consultas simultáneas idénticas

## 🎨 Sistema de Diseño

### Paleta de Colores

- **Primary**: Verde esmeralda (`emerald-500`)
- **Secondary**: Teal (`teal-500`)
- **Oro**: `amber-400` / `yellow-500`
- **Plata**: `slate-300` / `gray-400`
- **Bronce**: `orange-600` / `amber-700`
- **Warning**: `yellow-500`
- **Danger**: `red-500`

### Componentes UI

Basados en shadcn/ui con Radix UI:
- Buttons, Cards, Dialogs
- Tabs, Accordions, Dropdowns
- Charts, Progress bars
- Toasts, Tooltips
- Forms, Inputs, Selects

## 🔒 Seguridad

- Autenticación basada en sesión
- Roles de usuario (Operador, Administrador)
- Validación de datos con Zod
- Sanitización de inputs
- Protección CSRF
- Variables de entorno para credenciales

## 📈 Optimización y Rendimiento

- **Server-Side Rendering (SSR)** con Next.js
- **React Query** para cache y sincronización
- **Code Splitting** automático
- **Image Optimization** con Next.js Image
- **Lazy Loading** de componentes
- **Memoización** de cálculos costosos
- **Virtual Scrolling** para listas grandes

## 🐛 Debugging

El proyecto incluye herramientas de debugging:

```typescript
// Ver en: /debug/profile
- Estado de caché
- Estadísticas de conexiones
- Tiempos de respuesta
- Logs de consultas
```

## 📝 Notas Importantes

### Cálculo de Eficiencia
- La eficiencia se calcula excluyendo deducciones con `afectaDesempeno: false`
- Los valores deben coincidir con los cálculos de Excel de referencia
- Las eficiencias anuales se calculan por lotes para optimizar rendimiento

### Caché
- Redis caché opcional pero recomendado para producción
- Fallback a caché en memoria si Redis no está disponible
- TTL configurable por tipo de dato

### Base de Datos
- Las conexiones se gestionan mediante pool
- Timeout de conexión: 5 minutos
- Máximo 50 conexiones simultáneas

## 🤝 Contribución

Para contribuir al proyecto:

1. Mantener la estructura de carpetas
2. Seguir las convenciones de TypeScript
3. Documentar nuevos endpoints y funciones
4. Agregar tipos para nuevas entidades
5. Mantener consistencia con el sistema de diseño

## 📧 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo de SAO6.

---

**Versión**: 1.0.0  
**Última actualización**: 2025  
**Desarrollado para**: Sistema Alimentador Oriental 6 (SAO6)
