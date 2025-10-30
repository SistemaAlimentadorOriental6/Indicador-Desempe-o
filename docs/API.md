# Documentación de API

Esta documentación describe todos los endpoints disponibles en el sistema de Indicadores de Desempeño.

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Endpoints de Usuario](#endpoints-de-usuario)
- [Endpoints de Administración](#endpoints-de-administración)
- [Utilidades](#utilidades)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Modelos de Datos](#modelos-de-datos)

---

## 🔐 Autenticación

### POST /api/auth/login

Inicia sesión en el sistema.

**Request Body:**
```json
{
  "codigo": "0046",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "codigo": "0046",
    "nombre": "Juan Pérez",
    "rol": "Operador",
    "isAdmin": false,
    "zona": "Norte",
    "tarea": "Conducción"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `401`: Credenciales inválidas
- `404`: Usuario no encontrado
- `500`: Error del servidor

---

## 👤 Endpoints de Usuario

### GET /api/user/global-efficiency

Obtiene la eficiencia global del usuario autenticado.

**Query Parameters:**
- `userCode` (string, required): Código del usuario
- `year` (number, optional): Año específico
- `month` (number, optional): Mes específico (1-12)

**Response (200):**
```json
{
  "userCode": "0046",
  "efficiency": 92.5,
  "bonusPercentage": 95.0,
  "kmPercentage": 90.0,
  "totalBonuses": 850000,
  "totalDeductions": 71000,
  "category": "Oro",
  "rank": 15,
  "period": {
    "type": "month",
    "year": 2025,
    "month": 4
  }
}
```

---

### GET /api/user/available-dates

Obtiene las fechas disponibles con datos para el usuario.

**Query Parameters:**
- `userCode` (string, required): Código del usuario

**Response (200):**
```json
{
  "years": [2023, 2024, 2025],
  "months": {
    "2025": [1, 2, 3, 4, 5],
    "2024": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  "currentYear": 2025,
  "currentMonth": 5
}
```

---

### GET /api/user/bonus-data

Obtiene los datos de bonos del usuario.

**Query Parameters:**
- `userCode` (string, required): Código del usuario
- `year` (number, optional): Año
- `month` (number, optional): Mes

**Response (200):**
```json
{
  "bonuses": [
    {
      "id": 1,
      "fecha": "2025-04-15",
      "monto": 142000,
      "tipo": "Bono Base",
      "estado": "Pagado"
    },
    {
      "id": 2,
      "fecha": "2025-04-22",
      "monto": 71000,
      "tipo": "Bono Cumplimiento",
      "estado": "Pagado"
    }
  ],
  "deductions": [
    {
      "id": 1,
      "fecha": "2025-04-10",
      "item": "5",
      "causa": "Retardo",
      "monto": 35500,
      "afectaDesempeno": true
    }
  ],
  "summary": {
    "totalBonuses": 213000,
    "totalDeductions": 35500,
    "netAmount": 177500,
    "percentage": 83.3
  }
}
```

---

### GET /api/user/km-data

Obtiene los datos de kilómetros del usuario.

**Query Parameters:**
- `userCode` (string, required): Código del usuario
- `year` (number, optional): Año
- `month` (number, optional): Mes

**Response (200):**
```json
{
  "kilometers": [
    {
      "fecha": "2025-04-01",
      "programado": 150,
      "ejecutado": 145,
      "porcentaje": 96.7
    },
    {
      "fecha": "2025-04-02",
      "programado": 150,
      "ejecutado": 150,
      "porcentaje": 100.0
    }
  ],
  "summary": {
    "totalProgramado": 3000,
    "totalEjecutado": 2850,
    "porcentaje": 95.0,
    "diasTrabajados": 20
  }
}
```

---

### GET /api/user/deductions

Obtiene las deducciones del usuario.

**Query Parameters:**
- `userCode` (string, required): Código del usuario
- `year` (number, optional): Año
- `month` (number, optional): Mes

**Response (200):**
```json
{
  "deductions": [
    {
      "id": 1,
      "fecha": "2025-04-10",
      "item": "5",
      "causa": "Retardo",
      "monto": 35500,
      "porcentajeRetirar": 0.25,
      "afectaDesempeno": true,
      "observacion": "Llegó 30 minutos tarde"
    }
  ],
  "total": 35500,
  "count": 1
}
```

---

### GET /api/user/profile

Obtiene el perfil completo del usuario.

**Query Parameters:**
- `userCode` (string, required): Código del usuario

**Response (200):**
```json
{
  "user": {
    "codigo": "0046",
    "nombre": "Juan Pérez",
    "cedula": "1234567890",
    "telefono": "3001234567",
    "zona": "Norte",
    "padrino": "Pedro García",
    "tarea": "Conducción",
    "fechaIngreso": "2020-01-15",
    "fechaNacimiento": "1990-05-20",
    "rol": "Operador"
  },
  "efficiency": {
    "current": 92.5,
    "monthly": 90.0,
    "annual": 93.5,
    "category": "Oro"
  },
  "stats": {
    "totalBonuses": 2500000,
    "totalKm": 15000,
    "totalDeductions": 150000,
    "rank": 15,
    "streak": 30
  }
}
```

---

## 👨‍💼 Endpoints de Administración

### GET /api/admin/operators

Obtiene la lista de todos los operadores.

**Query Parameters:**
- `category` (string, optional): Filtrar por categoría
- `zona` (string, optional): Filtrar por zona
- `tarea` (string, optional): Filtrar por tarea
- `search` (string, optional): Buscar por nombre o código
- `year` (number, optional): Año
- `month` (number, optional): Mes
- `sortBy` (string, optional): Campo para ordenar (efficiency, bonus, km)
- `order` (string, optional): Orden (asc, desc)
- `page` (number, optional): Página (default: 1)
- `limit` (number, optional): Límite por página (default: 50)

**Response (200):**
```json
{
  "operators": [
    {
      "id": 1,
      "codigo": "0046",
      "name": "Juan Pérez",
      "zona": "Norte",
      "tarea": "Conducción",
      "efficiency": 92.5,
      "category": "Oro",
      "rank": 15,
      "bonus": {
        "percentage": 95.0,
        "total": 850000
      },
      "km": {
        "percentage": 90.0,
        "total": 2850
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 591,
    "pages": 12
  },
  "filters": {
    "category": "Oro",
    "zona": null,
    "tarea": null
  }
}
```

---

### GET /api/admin/rankings

Obtiene el ranking de operadores.

**Query Parameters:**
- `type` (string, optional): Tipo de ranking (efficiency, bonus, km)
- `limit` (number, optional): Top N operadores (default: 100)
- `year` (number, optional): Año
- `month` (number, optional): Mes

**Response (200):**
```json
{
  "rankings": [
    {
      "rank": 1,
      "codigo": "0199",
      "name": "María González",
      "efficiency": 98.0,
      "category": "Oro",
      "change": "up"
    },
    {
      "rank": 2,
      "codigo": "2837",
      "name": "Carlos Rodríguez",
      "efficiency": 97.5,
      "category": "Oro",
      "change": "stable"
    }
  ],
  "period": {
    "type": "month",
    "year": 2025,
    "month": 4
  },
  "metadata": {
    "total": 591,
    "oro": 150,
    "plata": 180,
    "bronce": 150,
    "mejorar": 80,
    "tallerConciencia": 31
  }
}
```

---

### GET /api/admin/statistics

Obtiene estadísticas globales del sistema.

**Query Parameters:**
- `year` (number, optional): Año
- `month` (number, optional): Mes

**Response (200):**
```json
{
  "totals": {
    "operators": 591,
    "activeOperators": 580,
    "totalBonuses": 150000000,
    "totalKm": 450000,
    "totalDeductions": 8500000
  },
  "categories": {
    "Oro": { "count": 150, "percentage": 25.4 },
    "Plata": { "count": 180, "percentage": 30.5 },
    "Bronce": { "count": 150, "percentage": 25.4 },
    "Mejorar": { "count": 80, "percentage": 13.5 },
    "Taller Conciencia": { "count": 31, "percentage": 5.2 }
  },
  "averages": {
    "efficiency": 89.5,
    "bonusPercentage": 91.0,
    "kmPercentage": 88.0
  },
  "trends": {
    "efficiency": "up",
    "bonuses": "stable",
    "km": "down"
  }
}
```

---

### GET /api/admin/operator/:codigo

Obtiene detalles completos de un operador específico.

**Path Parameters:**
- `codigo` (string, required): Código del operador

**Query Parameters:**
- `year` (number, optional): Año
- `month` (number, optional): Mes

**Response (200):**
```json
{
  "operator": {
    "codigo": "0046",
    "name": "Juan Pérez",
    "cedula": "1234567890",
    "zona": "Norte",
    "tarea": "Conducción",
    "fechaIngreso": "2020-01-15"
  },
  "performance": {
    "efficiency": 92.5,
    "category": "Oro",
    "rank": 15,
    "bonusPercentage": 95.0,
    "kmPercentage": 90.0
  },
  "bonuses": [...],
  "kilometers": [...],
  "deductions": [...],
  "history": {
    "monthly": [
      { "month": "2025-04", "efficiency": 92.5 },
      { "month": "2025-03", "efficiency": 91.0 },
      { "month": "2025-02", "efficiency": 93.0 }
    ],
    "trend": "up"
  }
}
```

---

### POST /api/admin/update-deduction

Actualiza o crea una deducción.

**Request Body:**
```json
{
  "userCode": "0046",
  "fecha": "2025-04-15",
  "item": "5",
  "observacion": "Retardo justificado"
}
```

**Response (200):**
```json
{
  "success": true,
  "deduction": {
    "id": 123,
    "userCode": "0046",
    "fecha": "2025-04-15",
    "item": "5",
    "causa": "Retardo",
    "monto": 35500
  }
}
```

---

### GET /api/admin/export

Exporta datos a Excel.

**Query Parameters:**
- `type` (string, required): Tipo de exportación (operators, rankings, statistics)
- `year` (number, optional): Año
- `month` (number, optional): Mes
- `category` (string, optional): Filtrar por categoría

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="operadores_2025_04.xlsx"

[Binary Excel file]
```

---

## 🛠️ Utilidades

### GET /api/health

Verifica el estado del sistema.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-04-15T10:30:00Z",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 15,
      "connections": {
        "total": 50,
        "active": 12,
        "idle": 38
      }
    },
    "redis": {
      "status": "up",
      "responseTime": 5
    },
    "cache": {
      "size": 1234,
      "hitRate": 0.85
    }
  }
}
```

---

### GET /api/daily-activity

Obtiene la actividad diaria del sistema.

**Response (200):**
```json
{
  "date": "2025-04-15",
  "activeUsers": 450,
  "totalRequests": 12500,
  "avgResponseTime": 120,
  "errors": 15,
  "cacheHitRate": 0.82
}
```

---

## 📊 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Solicitud exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Solicitud incorrecta (parámetros inválidos) |
| 401 | No autenticado |
| 403 | No autorizado (permisos insuficientes) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (recurso ya existe) |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible |

---

## 📦 Modelos de Datos

### Operator

```typescript
interface Operator {
  id: number
  codigo: string
  name: string
  cedula?: string
  zona?: string
  padrino?: string
  tarea?: string
  joinDate: string | null
  bonus?: BonusData
  km?: KmData
  efficiency: number
  annualEfficiency?: number
  category: Category
  rank: number
}
```

### BonusData

```typescript
interface BonusData {
  percentage: number
  total: number
  category: Category
  trend: "up" | "down" | "stable"
  date: string | null
}
```

### KmData

```typescript
interface KmData {
  percentage: number
  total_programado?: number
  total_ejecutado?: number
  category: Category
  trend: "up" | "down" | "stable"
  date: string | null
}
```

### Deduction

```typescript
interface Deduction {
  id: number
  fecha: string
  item: string
  causa: string
  monto: number
  porcentajeRetirar: number | 'Día'
  afectaDesempeno: boolean
  observacion?: string
}
```

### Category

```typescript
type Category = "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia"
```

---

## 🔍 Notas de Implementación

### Caché

- Todas las consultas de operadores tienen caché de 5 minutos
- Las consultas de rankings tienen caché de 2 minutos
- El caché se invalida automáticamente al actualizar datos

### Paginación

- Por defecto, se devuelven 50 resultados por página
- Máximo 200 resultados por página
- Use los parámetros `page` y `limit` para navegar

### Filtros

- Los filtros se pueden combinar
- Los valores se buscan de forma exacta (case-insensitive)
- Use `search` para búsquedas parciales

### Fechas

- Todas las fechas están en formato ISO 8601 (YYYY-MM-DD)
- Las fechas se almacenan en UTC
- Los timestamps incluyen zona horaria

### Autenticación

- Todas las rutas (excepto `/api/auth/login`) requieren autenticación
- El token debe enviarse en el header `Authorization: Bearer <token>`
- Los tokens expiran después de 24 horas

---

**Última actualización**: 2025-04-15
