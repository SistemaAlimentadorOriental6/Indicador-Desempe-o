# Lógica de Negocio y Cálculos

Este documento describe las fórmulas, reglas de negocio y cálculos utilizados en el Sistema de Indicadores de Desempeño SAO6.

## 📋 Tabla de Contenidos

- [Conceptos Fundamentales](#conceptos-fundamentales)
- [Fórmulas de Cálculo](#fórmulas-de-cálculo)
- [Categorización de Operadores](#categorización-de-operadores)
- [Sistema de Deducciones](#sistema-de-deducciones)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Casos Especiales](#casos-especiales)

---

## 🎯 Conceptos Fundamentales

### Eficiencia Global

La **Eficiencia Global** es la métrica principal que determina el desempeño de un operador. Se compone de dos componentes:

1. **Eficiencia de Bonos**: Basada en bonos otorgados menos deducciones
2. **Eficiencia de Kilómetros**: Basada en KM ejecutados vs programados

### Periodos de Evaluación

El sistema soporta tres tipos de evaluación temporal:

- **Eficiencia Actual/Mensual**: Basada en el mes actual o seleccionado
- **Eficiencia Anual**: Basada en el año completo
- **Eficiencia Global**: Basada en todo el histórico del operador

---

## 📊 Fórmulas de Cálculo

### 1. Eficiencia de Bonos

```
Eficiencia de Bonos = ((Total Bonos - Total Deducciones) / Total Bonos) × 100
```

**Donde:**
- `Total Bonos`: Suma de todos los bonos otorgados en el periodo
- `Total Deducciones`: Suma de deducciones que **afectan desempeño** (`afectaDesempeno = true`)

**Implementación:**

```typescript
function calculateBonusEfficiency(
  totalBonuses: number,
  deductions: Deduction[]
): number {
  // Filtrar solo deducciones que afectan desempeño
  const effectiveDeductions = deductions
    .filter(d => d.afectaDesempeno === true)
    .reduce((sum, d) => sum + d.monto, 0)
  
  // Evitar división por cero
  if (totalBonuses === 0) return 0
  
  // Calcular eficiencia
  const efficiency = ((totalBonuses - effectiveDeductions) / totalBonuses) * 100
  
  // Asegurar que no sea negativa
  return Math.max(0, efficiency)
}
```

### 2. Eficiencia de Kilómetros

```
Eficiencia de KM = (Total KM Ejecutados / Total KM Programados) × 100
```

**Donde:**
- `Total KM Ejecutados`: Suma de kilómetros efectivamente recorridos
- `Total KM Programados`: Suma de kilómetros que debían recorrerse

**Implementación:**

```typescript
function calculateKmEfficiency(
  totalExecuted: number,
  totalProgrammed: number
): number {
  // Evitar división por cero
  if (totalProgrammed === 0) return 0
  
  // Calcular eficiencia
  const efficiency = (totalExecuted / totalProgrammed) * 100
  
  // La eficiencia puede superar 100% si se ejecutaron más KM de los programados
  return efficiency
}
```

### 3. Eficiencia Global

```
Eficiencia Global = (Eficiencia de Bonos + Eficiencia de KM) / 2
```

**Implementación:**

```typescript
function calculateGlobalEfficiency(
  bonusEfficiency: number,
  kmEfficiency: number
): number {
  // Promedio simple de ambas eficiencias
  return (bonusEfficiency + kmEfficiency) / 2
}
```

**Nota Importante**: Esta fórmula puede generar discrepancias con cálculos de Excel si Excel usa una fórmula diferente. Según las memorias del sistema, hay casos donde:
- Excel: 92.1%, App: 90.6%
- La diferencia sugiere que Excel podría usar ponderaciones o considerar otros factores.

---

## 🏆 Categorización de Operadores

### Categorías y Rangos

Los operadores se clasifican en 5 categorías según su eficiencia global:

| Categoría | Rango | Color | Descripción |
|-----------|-------|-------|-------------|
| **Oro** | ≥ 95% | Dorado (#FFD700) | Excelente desempeño |
| **Plata** | 90% - 94.9% | Plateado (#C0C0C0) | Muy buen desempeño |
| **Bronce** | 85% - 89.9% | Bronce (#CD7F32) | Buen desempeño |
| **Mejorar** | 80% - 84.9% | Amarillo (#FCD34D) | Requiere mejora |
| **Taller Conciencia** | < 80% | Rojo (#EF4444) | Requiere intervención |

### Función de Categorización

```typescript
function getCategoryFromPercentage(percentage: number): Category {
  if (percentage >= 95) return "Oro"
  if (percentage >= 90) return "Plata"
  if (percentage >= 85) return "Bronce"
  if (percentage >= 80) return "Mejorar"
  return "Taller Conciencia"
}
```

### Interpretación de Categorías

#### Oro (≥ 95%)
- Operadores de élite
- Cumplimiento casi perfecto
- Mínimas o ninguna deducción
- Ejemplo de desempeño

#### Plata (90-94.9%)
- Excelente desempeño
- Cumplimiento consistente
- Deducciones menores ocasionales

#### Bronce (85-89.9%)
- Buen desempeño general
- Algunas áreas de mejora
- Deducciones moderadas

#### Mejorar (80-84.9%)
- Desempeño aceptable pero insuficiente
- Requiere plan de mejora
- Deducciones frecuentes

#### Taller Conciencia (< 80%)
- Desempeño deficiente
- Requiere intervención inmediata
- Múltiples deducciones o faltas graves

---

## 💰 Sistema de Deducciones

### Valores Base

```typescript
const BONO_BASE = 142000      // Valor del bono completo
const BONO_50 = 71000         // 50% del bono
const BONO_25 = 35500         // 25% del bono
const VALOR_DIA = 4733        // Valor por día (BONO_BASE / 30)
```

### Tipos de Deducciones

#### 1. Deducciones que Afectan Desempeño

Estas deducciones **SE INCLUYEN** en el cálculo de eficiencia:

| Item | Causa | Porcentaje | Monto | Observación |
|------|-------|------------|-------|-------------|
| 1 | Incapacidad | 0.25 | $35,500 | Por evento |
| 2 | Ausentismo | 1.00 | $142,000 | Falta injustificada |
| 3 | Incapacidad > 7 días | Día | $4,733/día | Por día adicional |
| 5 | Retardo | 0.25 | $35,500 | Por evento |
| 6 | Renuncia | Día | $4,733/día | Proporcional |
| 8 | Suspensión | Día | $4,733/día | Por día suspendido |
| 10 | Restricción | 1.00 | $142,000 | Bono completo |
| 12 | Retardo por Horas | 0.50 | $71,000 | Más de 2 horas |
| DL | Daño Leve | 0.25 | $35,500 | Daño menor vehicular |
| DG | Daño Grave | 0.50 | $71,000 | Daño significativo |
| DGV | Daño Gravísimo | 1.00 | $142,000 | Daño total |
| DEL | Desincentivo Leve | 0.25 | $35,500 | Falta menor |
| DEG | Desincentivo Grave | 0.50 | $71,000 | Falta seria |
| DEGV | Desincentivo Gravísimo | 1.00 | $142,000 | Falta muy grave |
| INT | Incumplimiento Interno | 0.25 | $35,500 | Normas internas |
| OM | Falta Menor | 0.25 | $35,500 | Infracción leve |
| OMD | Falta Media | 0.50 | $71,000 | Infracción moderada |
| OG | Falta Grave | 1.00 | $142,000 | Infracción seria |
| NPF | No Presentarse a Formación | 1.00 | $142,000 | Ausencia a capacitación |
| HCC-L | HCC Leve | 0.25 | $35,500 | Conducta inapropiada leve |
| HCC-G | HCC Grave | 0.50 | $71,000 | Conducta inapropiada grave |
| HCC-GV | HCC Gravísimo | 1.00 | $142,000 | Conducta muy grave |

#### 2. Deducciones que NO Afectan Desempeño

Estas deducciones **NO SE INCLUYEN** en el cálculo de eficiencia:

| Item | Causa | Monto | Razón |
|------|-------|-------|-------|
| 0 | Sin Deducción | $0 | No aplica |
| 4 | Calamidad | $4,733/día | Fuerza mayor |
| 7 | Vacaciones | $4,733/día | Derecho laboral |
| 9 | No Ingreso | $4,733/día | Situación especial |
| 11 | Día No Remunerado | $4,733/día | Acuerdo especial |
| 13 | DNR por Horas | $0 | Acuerdo especial |

### Lógica de Procesamiento

```typescript
function processDeductions(deductions: RawDeduction[]): ProcessedDeduction[] {
  return deductions.map(deduction => {
    const rule = DEDUCTION_RULES.find(r => r.item === deduction.item)
    
    if (!rule) {
      return { ...deduction, monto: 0, afectaDesempeno: false }
    }
    
    let monto = 0
    
    // Solo calcular monto si afecta desempeño
    if (rule.afectaDesempeno) {
      if (rule.porcentajeRetirar === 'Día') {
        monto = rule.valorActual * (deduction.diasAfectados || 1)
      } else {
        monto = rule.valorActual
      }
    }
    
    return {
      ...deduction,
      monto,
      causa: rule.causa,
      afectaDesempeno: rule.afectaDesempeno
    }
  })
}
```

### Caso Especial: Día No Remunerado (Item 11)

**Problema Histórico**: 
Anteriormente, el item '11' (Día No Remunerado) se incluía en los cálculos de eficiencia, causando discrepancias entre el panel de admin y la vista de usuario.

**Ejemplo**:
- Admin (global-efficiency): 71.9% eficiencia, $71,000 deducciones
- Vista usuario (progress-cards): 67% performance, $85,199 deducciones
- Diferencia: $14,199 = 3 días de "Día No Remunerado"

**Solución**: 
El item '11' tiene `afectaDesempeno: false`, por lo que ahora se excluye correctamente del cálculo.

---

## 📈 Ejemplos Prácticos

### Ejemplo 1: Operador con Desempeño Excelente

**Datos del mes:**
- Bonos recibidos: $568,000 (4 bonos completos)
- Deducciones:
  - 1 Retardo (Item 5): $35,500 (afecta desempeño)
  - 2 días de Vacaciones (Item 7): $9,466 (NO afecta)
- KM Programados: 3,000
- KM Ejecutados: 2,950

**Cálculos:**

```
1. Eficiencia de Bonos:
   Total Bonos = $568,000
   Deducciones efectivas = $35,500 (solo Item 5)
   Eficiencia = ((568,000 - 35,500) / 568,000) × 100
   Eficiencia = (532,500 / 568,000) × 100
   Eficiencia = 93.75%

2. Eficiencia de KM:
   Eficiencia = (2,950 / 3,000) × 100
   Eficiencia = 98.33%

3. Eficiencia Global:
   Eficiencia = (93.75 + 98.33) / 2
   Eficiencia = 96.04%

4. Categoría: Oro (≥ 95%)
```

### Ejemplo 2: Operador con Múltiples Deducciones

**Datos del mes:**
- Bonos recibidos: $426,000 (3 bonos completos)
- Deducciones:
  - 1 Ausentismo (Item 2): $142,000
  - 1 Daño Leve (DL): $35,500
  - 1 Calamidad (Item 4): $4,733 (NO afecta)
- KM Programados: 2,400
- KM Ejecutados: 2,100

**Cálculos:**

```
1. Eficiencia de Bonos:
   Total Bonos = $426,000
   Deducciones efectivas = $142,000 + $35,500 = $177,500
   Eficiencia = ((426,000 - 177,500) / 426,000) × 100
   Eficiencia = (248,500 / 426,000) × 100
   Eficiencia = 58.33%

2. Eficiencia de KM:
   Eficiencia = (2,100 / 2,400) × 100
   Eficiencia = 87.5%

3. Eficiencia Global:
   Eficiencia = (58.33 + 87.5) / 2
   Eficiencia = 72.92%

4. Categoría: Taller Conciencia (< 80%)
```

### Ejemplo 3: Operador con Eficiencia Anual

**Datos del año:**
- Bonos anuales: $5,680,000
- Deducciones que afectan: $284,000
- KM Programados: 36,000
- KM Ejecutados: 33,840

**Cálculos:**

```
1. Eficiencia de Bonos Anual:
   Eficiencia = ((5,680,000 - 284,000) / 5,680,000) × 100
   Eficiencia = 95%

2. Eficiencia de KM Anual:
   Eficiencia = (33,840 / 36,000) × 100
   Eficiencia = 94%

3. Eficiencia Global Anual:
   Eficiencia = (95 + 94) / 2
   Eficiencia = 94.5%

4. Categoría: Plata (90-94.9%)
```

---

## 🔍 Casos Especiales

### Caso 1: Operador Nuevo (Primer Mes)

**Problema**: Datos insuficientes para calcular eficiencia

**Solución**:
```typescript
if (totalBonuses === 0 || totalKmProgrammed === 0) {
  // No mostrar eficiencia hasta tener datos suficientes
  return null
}
```

### Caso 2: Operador con Suspensión Completa

**Problema**: Todos los días del mes suspendido

**Solución**:
```typescript
const diasSuspension = 30
const deduccion = VALOR_DIA * diasSuspension // $142,000

// Puede resultar en eficiencia 0% o negativa
const efficiency = Math.max(0, calculatedEfficiency)
```

### Caso 3: Sobre-cumplimiento de KM

**Problema**: KM ejecutados > KM programados

**Solución**:
```typescript
// La eficiencia puede ser > 100%
const kmEfficiency = (3500 / 3000) * 100 // 116.67%

// Esto beneficia la eficiencia global
```

### Caso 4: Deducciones Múltiples en un Día

**Problema**: Varios eventos el mismo día

**Solución**:
```typescript
// Se suman todas las deducciones
const deducciones = [
  { item: '5', monto: 35500 },   // Retardo
  { item: 'DL', monto: 35500 }   // Daño Leve
]
const totalDeduccion = deducciones.reduce((sum, d) => sum + d.monto, 0)
// Total: $71,000
```

### Caso 5: División por Cero

**Problema**: No hay bonos o KM programados

**Solución**:
```typescript
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}
```

---

## 📊 Validaciones y Reglas de Negocio

### Validaciones de Datos

```typescript
// 1. Eficiencia no puede ser negativa
efficiency = Math.max(0, efficiency)

// 2. Fechas deben ser válidas
if (!isValidDate(fecha)) throw new Error('Fecha inválida')

// 3. Montos deben ser positivos
if (monto < 0) throw new Error('Monto no puede ser negativo')

// 4. Porcentajes entre 0 y 100 (o mayor en caso de KM)
if (bonusPercentage < 0 || bonusPercentage > 100) {
  console.warn('Porcentaje de bonos fuera de rango')
}

// 5. Código de usuario debe existir
const user = await getUser(codigo)
if (!user) throw new Error('Usuario no encontrado')
```

### Reglas de Redondeo

```typescript
// Redondear a 2 decimales para eficiencias
efficiency = Math.round(efficiency * 100) / 100

// Redondear a 0 decimales para categorías
const categoryPercentage = Math.floor(efficiency)

// Montos sin decimales
monto = Math.round(monto)
```

---

## 🔄 Consistencia de Datos

### Sincronización entre Vistas

Para mantener consistencia entre la vista de admin y usuario:

1. **Usar la misma fuente de verdad**: `DEDUCTION_RULES` en `deductions-config.ts`
2. **Aplicar el mismo filtro**: `afectaDesempeno === true`
3. **Misma fórmula de cálculo**: En todos los servicios
4. **Mismo periodo de evaluación**: Year/Month consistente

### Cache y Actualización

```typescript
// Invalidar caché al actualizar deducciones
await cacheManager.delete(`operator:${codigo}:*`)
await cacheManager.delete('rankings:*')

// Recalcular eficiencias afectadas
await recalculateEfficiency(codigo, year, month)
```

---

## 📋 Checklist de Cálculo

Al implementar o modificar cálculos, verificar:

- [ ] Se filtran deducciones por `afectaDesempeno`
- [ ] Se manejan divisiones por cero
- [ ] Se redondean correctamente los valores
- [ ] Se aplican las mismas fórmulas en todos los lugares
- [ ] Se invalida el caché apropiadamente
- [ ] Los valores coinciden con Excel de referencia
- [ ] Se manejan casos especiales (operador nuevo, suspensión, etc.)
- [ ] Se validan los datos de entrada

---

**Última actualización**: 2025-04-15
