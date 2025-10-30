# Guía de Desarrollo

Esta guía describe las convenciones, mejores prácticas y flujos de trabajo para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Configuración del Entorno](#configuración-del-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Convenciones de Código](#convenciones-de-código)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Testing](#testing)
- [Debugging](#debugging)

---

## 🔧 Configuración del Entorno

### Requisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
Visual Studio Code (recomendado)
```

### Extensiones de VS Code Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Configuración Inicial

```bash
# Clonar repositorio
git clone <repository-url>
cd medical-app

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar base de datos
npm run db:migrate

# Iniciar desarrollo
npm run dev
```

---

## 📁 Estructura del Proyecto

### Directorios Principales

```
medical-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Backend)
│   ├── admin/             # Páginas de administración
│   ├── dashboard/         # Dashboard de usuario
│   ├── operadores/        # Páginas de operadores
│   └── rankings/          # Páginas de rankings
│
├── components/            # Componentes React
│   ├── admin/            # Componentes administrativos
│   ├── dashboard/        # Componentes del dashboard
│   ├── operadores/       # Componentes de operadores
│   ├── users/            # Componentes de usuarios
│   └── ui/               # Componentes UI base (shadcn)
│
├── lib/                  # Lógica de negocio
│   ├── services/         # Servicios de negocio
│   │   ├── bonuses.service.ts
│   │   ├── kilometers.service.ts
│   │   └── faults.service.ts
│   ├── database.ts       # Gestión de DB
│   ├── cache-manager.ts  # Gestión de caché
│   └── utils.ts          # Utilidades
│
├── types/                # Definiciones TypeScript
│   ├── operator-types.ts
│   ├── kpi.ts
│   └── user-types.ts
│
├── hooks/                # Custom React Hooks
│   └── use-auth.tsx
│
└── docs/                 # Documentación
    ├── API.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    └── DEPLOYMENT.md
```

### Convención de Nombres de Archivos

- **Componentes React**: `PascalCase.tsx` o `kebab-case.tsx`
  - Ejemplo: `OperatorCard.tsx` o `operator-card.tsx`
- **Hooks**: `use-nombre.ts` o `use-nombre.tsx`
  - Ejemplo: `use-auth.tsx`, `use-operators.ts`
- **Servicios**: `nombre.service.ts`
  - Ejemplo: `bonuses.service.ts`
- **Tipos**: `nombre-types.ts` o `nombre.types.ts`
  - Ejemplo: `operator-types.ts`
- **Utilidades**: `nombre.utils.ts` o `utils.ts`
  - Ejemplo: `date.utils.ts`

---

## 💻 Convenciones de Código

### TypeScript

#### 1. Uso de Tipos Estrictos

```typescript
// ✅ Correcto: Tipos explícitos
interface Operator {
  codigo: string
  nombre: string
  eficiencia: number
}

function calculateEfficiency(operator: Operator): number {
  return operator.eficiencia
}

// ❌ Incorrecto: Uso de any
function calculate(data: any): any {
  return data.value
}
```

#### 2. Interfaces vs Types

```typescript
// ✅ Usar interface para objetos
interface User {
  id: number
  name: string
}

// ✅ Usar type para unions, intersections, primitivos
type Category = "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia"
type Status = "active" | "inactive"
```

#### 3. Nombres Descriptivos

```typescript
// ✅ Correcto: Nombres claros
const operatorsWithAnnualEfficiency = operators.map(op => ({
  ...op,
  annualEfficiency: calculateAnnual(op)
}))

// ❌ Incorrecto: Nombres ambiguos
const data = ops.map(o => ({ ...o, ae: calc(o) }))
```

### React y Next.js

#### 1. Componentes Funcionales

```typescript
// ✅ Correcto: Componente funcional con TypeScript
interface OperatorCardProps {
  operator: Operator
  onSelect?: (operator: Operator) => void
}

export function OperatorCard({ operator, onSelect }: OperatorCardProps) {
  return (
    <div onClick={() => onSelect?.(operator)}>
      {operator.nombre}
    </div>
  )
}

// ❌ Evitar: Componentes de clase (a menos que sea necesario)
class OperatorCard extends React.Component {
  // ...
}
```

#### 2. Hooks Personalizados

```typescript
// ✅ Correcto: Hook reutilizable
export function useOperators(filters?: OperatorFilters) {
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchOperators(filters)
      .then(setOperators)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [filters])

  return { operators, isLoading, error }
}
```

#### 3. Server vs Client Components

```typescript
// ✅ Server Component (por defecto en app/)
// app/operadores/page.tsx
export default async function OperadoresPage() {
  const operators = await getOperators() // Fetch en servidor
  return <OperatorsList operators={operators} />
}

// ✅ Client Component (cuando se necesita interactividad)
// components/operator-card.tsx
"use client"

export function OperatorCard({ operator }: OperatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // ...
}
```

#### 4. API Routes

```typescript
// ✅ Correcto: API Route tipada
// app/api/user/efficiency/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userCode = request.nextUrl.searchParams.get('userCode')
    
    if (!userCode) {
      return Response.json(
        { error: 'userCode is required' },
        { status: 400 }
      )
    }

    const efficiency = await calculateEfficiency(userCode)
    
    return Response.json({ efficiency })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Estilos con Tailwind CSS

```typescript
// ✅ Correcto: Clases organizadas y legibles
<div className="
  flex flex-col gap-4 
  p-6 rounded-lg 
  bg-white shadow-md 
  hover:shadow-lg transition-shadow
">

// ✅ Usar cn() para clases condicionales
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  size === 'large' && "large-classes"
)}>

// ❌ Evitar: Estilos inline (excepto dinámicos)
<div style={{ padding: '16px', backgroundColor: 'white' }}>
```

---

## 🔄 Flujo de Trabajo

### Git Workflow

#### 1. Branches

```bash
# Estructura de branches
main              # Producción
├── develop       # Desarrollo
├── feature/...   # Nuevas características
├── fix/...       # Correcciones
└── hotfix/...    # Correcciones urgentes
```

#### 2. Crear Feature Branch

```bash
# Actualizar develop
git checkout develop
git pull origin develop

# Crear nueva feature
git checkout -b feature/agregar-filtro-zona

# Trabajar en la feature
git add .
git commit -m "feat: agregar filtro por zona en operadores"

# Push
git push origin feature/agregar-filtro-zona
```

#### 3. Convención de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commits
feat:     # Nueva característica
fix:      # Corrección de bug
docs:     # Documentación
style:    # Formato de código
refactor: # Refactorización
test:     # Tests
chore:    # Tareas de mantenimiento

# Ejemplos
git commit -m "feat: agregar eficiencia anual en operator card"
git commit -m "fix: corregir cálculo de deducciones que no afectan desempeño"
git commit -m "docs: actualizar documentación de API"
git commit -m "refactor: optimizar query de rankings"
```

### Code Review Checklist

Antes de crear un Pull Request:

- [ ] El código sigue las convenciones del proyecto
- [ ] Todos los tests pasan
- [ ] No hay errores de TypeScript
- [ ] No hay warnings de ESLint
- [ ] La funcionalidad fue probada manualmente
- [ ] Se actualizó la documentación si es necesario
- [ ] Se agregaron comentarios para lógica compleja
- [ ] No hay console.logs innecesarios
- [ ] Se optimizaron las consultas de DB si es aplicable

---

## 🧪 Testing

### Estructura de Tests

```
medical-app/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── bonuses.service.test.ts
│   │   │   └── kilometers.service.test.ts
│   │   └── utils/
│   │       └── calculations.test.ts
│   ├── integration/
│   │   └── api/
│   │       └── efficiency.test.ts
│   └── e2e/
│       └── login.test.ts
```

### Ejemplo de Test Unitario

```typescript
// __tests__/unit/services/bonuses.service.test.ts
import { describe, test, expect } from '@jest/globals'
import { calculateBonusEfficiency } from '@/lib/services/bonuses.service'

describe('BonusesService', () => {
  describe('calculateBonusEfficiency', () => {
    test('debe calcular eficiencia correctamente', () => {
      const result = calculateBonusEfficiency(568000, [
        { item: '5', monto: 35500, afectaDesempeno: true }
      ])
      
      expect(result).toBeCloseTo(93.75, 2)
    })

    test('debe excluir deducciones que no afectan desempeño', () => {
      const result = calculateBonusEfficiency(568000, [
        { item: '5', monto: 35500, afectaDesempeno: true },
        { item: '11', monto: 9466, afectaDesempeno: false }
      ])
      
      // Solo debe contar el item 5
      expect(result).toBeCloseTo(93.75, 2)
    })

    test('debe retornar 0 si no hay bonos', () => {
      const result = calculateBonusEfficiency(0, [])
      expect(result).toBe(0)
    })

    test('debe retornar valor no negativo', () => {
      const result = calculateBonusEfficiency(100, [
        { item: '2', monto: 200, afectaDesempeno: true }
      ])
      
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })
})
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test bonuses.service

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

---

## 🐛 Debugging

### Herramientas de Debug

#### 1. Console Logging Estratégico

```typescript
// ✅ Logs informativos en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Calculating efficiency for:', operator.codigo)
  console.log('📊 Bonuses:', totalBonuses)
  console.log('💰 Deductions:', totalDeductions)
}

// ✅ Logs de error siempre
console.error('❌ Error calculating efficiency:', error)

// ❌ No dejar console.logs en producción
console.log(data) // Eliminar antes de commit
```

#### 2. VS Code Debugger

Configuración `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

#### 3. React Developer Tools

```bash
# Instalar extensión de Chrome/Firefox
# React Developer Tools
# Permite inspeccionar componentes, props, state, hooks
```

#### 4. Database Queries

```typescript
// Debug de queries en desarrollo
const db = getDatabase()

if (process.env.ENABLE_QUERY_LOG === 'true') {
  const startTime = Date.now()
  const result = await db.executeQuery(query, params)
  const duration = Date.now() - startTime
  
  console.log('🔍 Query:', query)
  console.log('⏱️ Duration:', duration, 'ms')
  console.log('📊 Results:', result.length, 'rows')
  
  return result
}
```

### Common Issues y Soluciones

#### 1. Error de Hidratación

**Error**: `Text content does not match server-rendered HTML`

**Causa**: Diferencia entre renderizado del servidor y cliente

**Solución**:
```typescript
// ✅ Usar estado para contenido específico del cliente
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])

if (!isClient) return null

return <ClientOnlyComponent />
```

#### 2. Infinite Loop en useEffect

**Error**: Componente se re-renderiza infinitamente

**Causa**: Dependencias incorrectas

**Solución**:
```typescript
// ❌ Incorrecto: objeto creado en cada render
useEffect(() => {
  fetchData({ filter: 'active' })
}, [{ filter: 'active' }]) // Nuevo objeto cada vez

// ✅ Correcto: dependencias primitivas
const filter = 'active'
useEffect(() => {
  fetchData({ filter })
}, [filter])

// ✅ O usar useMemo
const filters = useMemo(() => ({ filter: 'active' }), [])
useEffect(() => {
  fetchData(filters)
}, [filters])
```

#### 3. Queries Lentas

**Problema**: API responde lento

**Solución**:
```typescript
// 1. Verificar índices en DB
// 2. Usar EXPLAIN en MySQL
// 3. Agregar caché
// 4. Limitar resultados con LIMIT
// 5. Usar paginación

const { data, isLoading } = useQuery({
  queryKey: ['operators', page, limit],
  queryFn: () => fetchOperators({ page, limit }),
  staleTime: 5 * 60 * 1000, // Cache 5 minutos
  keepPreviousData: true // Mantener datos anteriores mientras carga
})
```

---

## 📝 Documentación de Código

### JSDoc para Funciones

```typescript
/**
 * Calcula la eficiencia global de un operador
 * 
 * @param operator - Datos del operador
 * @param period - Periodo de evaluación
 * @returns Eficiencia como porcentaje (0-100+)
 * 
 * @example
 * ```typescript
 * const efficiency = calculateGlobalEfficiency(
 *   operator,
 *   { year: 2025, month: 4 }
 * )
 * console.log(efficiency) // 92.5
 * ```
 */
export function calculateGlobalEfficiency(
  operator: Operator,
  period: Period
): number {
  // ...
}
```

### Comentarios en Código

```typescript
// ✅ Comentarios que explican "por qué"
// Item 11 (Día No Remunerado) no debe afectar el cálculo de desempeño
// según reglas de negocio actualizadas en abril 2025
if (deduction.item === '11' && !deduction.afectaDesempeno) {
  continue
}

// ✅ Comentarios para lógica compleja
// Calculamos la eficiencia como promedio ponderado donde:
// - Bonos representa el 50% del desempeño
// - Kilómetros representa el 50% del desempeño
const globalEfficiency = (bonusEfficiency * 0.5) + (kmEfficiency * 0.5)

// ❌ Comentarios que repiten el código
// Incrementar contador en 1
count++
```

---

## 🔧 Herramientas y Scripts Útiles

### Scripts de npm

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build           # Build de producción
npm run start           # Iniciar build de producción
npm run lint            # Ejecutar linter
npm run type-check      # Verificar tipos de TypeScript

# Base de datos
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Sembrar datos iniciales
npm run db:reset        # Reset completo de DB

# Testing
npm test                # Ejecutar todos los tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Tests con coverage

# Utilidades
npm run clean           # Limpiar archivos generados
npm run format          # Formatear código con Prettier
```

### Pre-commit Hooks

Configurar con Husky:

```bash
# Instalar husky
npm install -D husky
npx husky install

# Agregar pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Guías Internas

- [API.md](./API.md) - Documentación de API
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
- [DATABASE.md](./DATABASE.md) - Esquema de base de datos
- [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) - Lógica de negocio
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment

---

**Última actualización**: 2025-04-15
