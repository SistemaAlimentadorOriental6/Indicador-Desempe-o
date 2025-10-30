# Arquitectura del Sistema

Este documento describe la arquitectura técnica del Sistema de Indicadores de Desempeño SAO6.

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Next.js App Router (SSR/CSR)              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │  │
│  │  │  Dashboard │  │   Admin    │  │  Operadores  │  │  │
│  │  │   Views    │  │   Panel    │  │   Rankings   │  │  │
│  │  └────────────┘  └────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React Components + Hooks                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │   UI     │  │  Business│  │  Data Fetching   │  │  │
│  │  │Components│  │  Logic   │  │  (React Query)   │  │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (REST)                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │  │
│  │  │   /auth    │  │   /user    │  │    /admin    │  │  │
│  │  └────────────┘  └────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Business Services                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │  │
│  │  │   Bonuses  │  │ Kilometers │  │   Faults     │  │  │
│  │  │  Service   │  │  Service   │  │   Service    │  │  │
│  │  └────────────┘  └────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     CACHE LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐         ┌──────────────────────┐   │  │
│  │  │   Redis     │   →     │   Node Cache         │   │  │
│  │  │   Cache     │         │   (Fallback)         │   │  │
│  │  └─────────────┘         └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Database Service (Singleton)                │  │
│  │  ┌─────────────┐         ┌──────────────────────┐   │  │
│  │  │   MySQL     │         │    MSSQL             │   │  │
│  │  │  Connection │         │   Connection         │   │  │
│  │  │    Pool     │         │   (Optional)         │   │  │
│  │  └─────────────┘         └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Capas de la Aplicación

### 1. Capa de Presentación (Frontend)

**Tecnologías:**
- Next.js 15 con App Router
- React 19 con Server Components
- TypeScript para type safety
- Tailwind CSS + shadcn/ui

**Responsabilidades:**
- Renderizado de UI
- Gestión de estado del cliente
- Interacción con el usuario
- Validación de formularios
- Optimizaciones de rendimiento (lazy loading, code splitting)

**Componentes Principales:**

```
components/
├── dashboard/        # Componentes del dashboard principal
├── admin/           # Panel de administración
├── operadores/      # Vistas de operadores
├── users/           # Gestión de usuarios
├── ui/              # Componentes reutilizables (shadcn)
└── config/          # Configuraciones UI
```

### 2. Capa de API (Backend)

**Tecnologías:**
- Next.js API Routes (Serverless Functions)
- TypeScript
- Zod para validación

**Responsabilidades:**
- Enrutamiento de peticiones
- Autenticación y autorización
- Validación de datos de entrada
- Orquestación de servicios
- Transformación de respuestas
- Manejo de errores

**Estructura de Endpoints:**

```
app/api/
├── auth/            # Autenticación
│   ├── login/
│   └── logout/
├── user/            # Datos de usuario
│   ├── global-efficiency/
│   ├── bonus-data/
│   ├── km-data/
│   └── profile/
└── admin/           # Administración
    ├── operators/
    ├── rankings/
    └── statistics/
```

### 3. Capa de Servicios (Business Logic)

**Ubicación:** `lib/services/`

**Servicios:**

#### BonusesService (`bonuses.service.ts`)
- Cálculo de bonos
- Procesamiento de deducciones
- Determinación de categorías
- Cálculo de eficiencia de bonos

```typescript
// Funciones principales
- calculateBonusEfficiency()
- processDeductions()
- getCategoryFromPercentage()
- getBonusSummary()
```

#### KilometersService (`kilometers.service.ts`)
- Cálculo de kilómetros
- KM programados vs ejecutados
- Eficiencia de kilómetros
- Estadísticas de ruta

```typescript
// Funciones principales
- calculateKmEfficiency()
- getKmSummary()
- getRouteStatistics()
```

#### FaultsService (`faults.service.ts`)
- Gestión de faltas
- Cálculo de impacto
- Clasificación de faltas

### 4. Capa de Caché

**Estrategia de Caché Multi-Nivel:**

```
Request
   ↓
┌──────────────────┐
│  React Query     │ → Client-side cache (5 min)
│  Cache           │
└──────────────────┘
   ↓
┌──────────────────┐
│  Redis Cache     │ → Distributed cache (15 min)
│  (Production)    │
└──────────────────┘
   ↓
┌──────────────────┐
│  Node Cache      │ → In-memory fallback (5 min)
│  (Development)   │
└──────────────────┘
   ↓
┌──────────────────┐
│  Request         │ → Request deduplication (5 sec)
│  Deduplication   │
└──────────────────┘
   ↓
Database Query
```

**Implementación:**

```typescript
// lib/cache-manager.ts
class CacheManager {
  - get(key)
  - set(key, value, ttl)
  - delete(key)
  - invalidate(pattern)
}

// lib/cache.ts (Node Cache fallback)
class NodeCacheService {
  - get(key)
  - set(key, value, ttl)
  - clear()
}
```

**TTL por tipo de dato:**
- Eficiencias de usuario: 5 minutos
- Rankings globales: 2 minutos
- Estadísticas: 10 minutos
- Perfil de usuario: 30 minutos
- Deducciones: 1 minuto

### 5. Capa de Datos

**Database Service Singleton:**

```typescript
// lib/database.ts
class DatabaseService {
  private mysqlPool: Pool
  
  // Métodos principales
  - executeQuery<T>(query, params, enableCache)
  - executeTransaction<T>(callback)
  - getPoolConnection()
  - executeRankingsQuery<T>()
  - executeBonusQuery<T>()
  - healthCheck()
}
```

**Configuración del Pool:**
- Connection Limit: 50
- Idle Timeout: 5 minutos
- Max Idle Connections: 10
- Keep Alive: Habilitado
- Queue Limit: Ilimitado

**Optimizaciones:**
1. **Connection Pooling**: Reutilización de conexiones
2. **Query Deduplication**: Evita queries duplicadas simultáneas
3. **Prepared Statements**: Seguridad y rendimiento
4. **Transaction Management**: ACID compliance

## 🔄 Flujo de Datos

### Lectura de Datos (Read Flow)

```
User Request
    ↓
[React Component]
    ↓
[React Query Hook] ← Checks client cache
    ↓
[API Endpoint] (e.g., /api/user/global-efficiency)
    ↓
[Cache Manager] ← Checks Redis/Node Cache
    ↓ (cache miss)
[Business Service] (e.g., BonusesService)
    ↓
[Database Service]
    ↓
[MySQL Pool] → Execute Query
    ↓
[Results]
    ↓
[Cache Manager] ← Store in cache
    ↓
[Business Service] ← Process data
    ↓
[API Endpoint] ← Transform response
    ↓
[React Query] ← Update cache
    ↓
[React Component] ← Re-render
```

### Escritura de Datos (Write Flow)

```
User Action
    ↓
[React Component]
    ↓
[Form Validation] (React Hook Form + Zod)
    ↓
[API Endpoint] (e.g., /api/admin/update-deduction)
    ↓
[Input Validation] (Server-side)
    ↓
[Database Service] → Begin Transaction
    ↓
[Execute Update/Insert]
    ↓
[Commit Transaction]
    ↓
[Cache Invalidation] ← Clear related caches
    ↓
[Response]
    ↓
[React Query] ← Invalidate queries
    ↓
[React Component] ← Re-fetch & re-render
```

## 🔐 Seguridad

### Autenticación

**Flujo de Login:**

```
1. Usuario ingresa credenciales
2. POST /api/auth/login
3. Validar en base de datos
4. Generar sesión/token
5. Almacenar en cookie httpOnly
6. Retornar datos de usuario
```

**Middleware de Autenticación:**

```typescript
// En cada endpoint protegido
const user = await validateSession(request)
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

### Autorización

**Roles:**
- **Operador**: Acceso a sus propios datos
- **Administrador**: Acceso a todos los datos

**Validación en API:**

```typescript
if (requiredRole === 'admin' && !user.isAdmin) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Validación de Datos

**Zod Schemas:**

```typescript
// Ejemplo de schema
const UserLoginSchema = z.object({
  codigo: z.string().min(4).max(10),
  password: z.string().min(6)
})

// Uso en endpoint
const body = await request.json()
const result = UserLoginSchema.safeParse(body)
if (!result.success) {
  return Response.json({ errors: result.error }, { status: 400 })
}
```

### SQL Injection Prevention

- Uso de **prepared statements**
- Parámetros sanitizados
- Validación de tipos

```typescript
// ✅ Correcto
await db.executeQuery('SELECT * FROM users WHERE codigo = ?', [userCode])

// ❌ Incorrecto (nunca hacer esto)
await db.executeQuery(`SELECT * FROM users WHERE codigo = '${userCode}'`)
```

## 📊 Gestión de Estado

### Estado del Cliente

**React Query (TanStack Query):**

```typescript
// Configuración global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})
```

**Uso en componentes:**

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['operator', operatorCode, year, month],
  queryFn: () => fetchOperatorData(operatorCode, year, month),
  staleTime: 5 * 60 * 1000
})
```

### Estado Local

**Hooks personalizados:**
- `useAuth()`: Gestión de autenticación
- `useOperatorFilters()`: Filtros de operadores
- `useTimeFilter()`: Filtros temporales

## 🎯 Patrones de Diseño

### Singleton Pattern

**DatabaseService:**
- Una única instancia global
- Pool de conexiones compartido
- Gestión centralizada

```typescript
export const getDatabase = () => DatabaseService.getInstance()
```

### Factory Pattern

**Categorización de operadores:**

```typescript
function getCategoryFromPercentage(percentage: number): Category {
  if (percentage >= 95) return "Oro"
  if (percentage >= 90) return "Plata"
  if (percentage >= 85) return "Bronce"
  if (percentage >= 80) return "Mejorar"
  return "Taller Conciencia"
}
```

### Repository Pattern

**Database Service actúa como repositorio:**
- Abstracción de la base de datos
- Métodos especializados por dominio
- Caché transparente

### Observer Pattern

**React Query:**
- Observa cambios en los datos
- Notifica a componentes suscritos
- Re-renderizado automático

## 🚀 Optimizaciones de Rendimiento

### Frontend

1. **Code Splitting**
   - Lazy loading de componentes
   - Dynamic imports
   - Route-based splitting

2. **Memoización**
   - `React.memo()` para componentes
   - `useMemo()` para cálculos costosos
   - `useCallback()` para funciones

3. **Virtual Scrolling**
   - Listas grandes de operadores
   - Renderizado eficiente

4. **Image Optimization**
   - Next.js Image component
   - Lazy loading
   - WebP format

### Backend

1. **Database Pooling**
   - Reutilización de conexiones
   - Menor latencia
   - Mejor throughput

2. **Query Optimization**
   - Índices en columnas frecuentes
   - Joins optimizados
   - LIMIT en queries grandes

3. **Caching Multi-Nivel**
   - Reduce carga en DB
   - Respuestas más rápidas
   - Escalabilidad mejorada

4. **Request Deduplication**
   - Evita queries duplicadas
   - Reduce carga del servidor
   - Consistencia de datos

## 📈 Escalabilidad

### Horizontal Scaling

**Next.js:**
- Deployment en múltiples instancias
- Load balancing
- Stateless API

**Database:**
- Read replicas para lectura
- Master-slave replication
- Connection pooling

**Cache:**
- Redis cluster
- Sharding por tipo de dato
- Replicación

### Vertical Scaling

**Server Resources:**
- CPU: Para procesamiento de datos
- RAM: Para caché en memoria
- Network: Para throughput

**Database:**
- Índices optimizados
- Particionamiento de tablas
- Query optimization

## 🔍 Monitoreo

### Métricas Clave

1. **Performance:**
   - Response time de API
   - Database query time
   - Cache hit rate

2. **Availability:**
   - Uptime del servicio
   - Database connections
   - Redis availability

3. **Business:**
   - Usuarios activos
   - Queries por minuto
   - Errores por endpoint

### Health Checks

```typescript
GET /api/health

Response:
{
  "status": "healthy",
  "database": { "status": "up", "connections": 12 },
  "redis": { "status": "up" },
  "cache": { "hitRate": 0.85 }
}
```

## 🛠️ Mantenimiento

### Tareas Regulares

1. **Diarias:**
   - Monitoreo de logs
   - Verificación de errores
   - Cache cleanup

2. **Semanales:**
   - Análisis de rendimiento
   - Revisión de queries lentas
   - Optimización de índices

3. **Mensuales:**
   - Backup de base de datos
   - Actualización de dependencias
   - Auditoría de seguridad

---

**Última actualización**: 2025-04-15
