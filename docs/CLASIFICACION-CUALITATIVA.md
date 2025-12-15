# Sistema de Clasificación Cualitativa

## Descripción General

El sistema de clasificación cualitativa determina la categoría final de un operador basándose en la combinación de sus porcentajes de **Bono** y **Kilómetros**, utilizando una matriz de valoración cualitativa.

## Categorías Disponibles

- **Oro**: Excelente desempeño
- **Plata**: Muy buen desempeño
- **Bronce**: Buen desempeño con oportunidades de mejora
- **Mejorar**: Requiere atención y mejora
- **Taller Conciencia**: Necesita intervención inmediata

## Rangos de Clasificación

### Porcentajes de Bono
| Categoría | Rango |
|-----------|-------|
| Oro | 100% |
| Plata | 95% - 99% |
| Bronce | 90% - 94% |
| Mejorar | 60% - 89% |
| Taller Conciencia | < 60% |

### Porcentajes de Kilómetros
| Categoría | Rango |
|-----------|-------|
| Oro | ≥ 94% |
| Plata | 90% - 93% |
| Bronce | 85% - 89% |
| Mejorar | 70% - 84% |
| Taller Conciencia | < 70% |

## Matriz de Clasificación Final

La categoría final se determina combinando las categorías individuales de Bono y Km:

| Bono ↓ / Km → | Oro | Plata | Bronce | Mejorar | Taller |
|---------------|-----|-------|--------|---------|--------|
| **Oro** | Oro | Plata | Plata | Bronce | Bronce |
| **Plata** | Plata | Plata | Bronce | Bronce | Bronce |
| **Bronce** | Plata | Bronce | Bronce | Bronce | Bronce |
| **Mejorar** | Mejorar | Mejorar | Mejorar | Mejorar | Taller |
| **Taller** | Taller | Taller | Taller | Taller | Taller |

## Ejemplos de Clasificación

### Caso 1: Oro
- **Bono**: 100% → Oro
- **Km**: 95% → Oro
- **Resultado**: Oro

### Caso 2: Plata
- **Bono**: 97% → Plata
- **Km**: 92% → Plata
- **Resultado**: Plata

### Caso 3: Combinación Oro-Plata
- **Bono**: 100% → Oro
- **Km**: 92% → Plata
- **Resultado**: Plata

## Implementación Técnica

### Archivos Principales

1. **`utils/clasificacion-cualitativa.ts`**: Lógica principal del sistema
2. **`utils/operator-utils.ts`**: Integración con el procesamiento de operadores
3. **`utils/ranking-utils.ts`**: Funciones de compatibilidad

### Funciones Principales

```typescript
// Clasificar un operador completo
const resultado = clasificarOperador(porcentajeBono, porcentajeKm);

// Clasificar solo bono
const categoriaBono = clasificarBono(porcentajeBono);

// Clasificar solo km
const categoriaKm = clasificarKm(porcentajeKm);

// Determinar categoría final
const categoriaFinal = determinarCategoriaFinal(porcentajeBono, porcentajeKm);
```

### Integración con Filtros

El sistema funciona correctamente con todos los tipos de filtros:

- **Global**: Procesa todos los datos históricos
- **Anual**: Suma datos del año y recalcula porcentajes
- **Mensual**: Usa datos específicos del mes

## Herramientas de Debug

### Páginas de Prueba

1. **`/test-clasificacion`**: Casos de prueba predefinidos
2. **`/debug-clasificacion`**: Herramienta interactiva para probar clasificaciones

### Validación

El sistema incluye validación automática:
- Porcentajes entre 0% y 100%
- Manejo de valores nulos o indefinidos
- Logging detallado para debugging

## Migración desde Sistema Anterior

El nuevo sistema reemplaza la lógica anterior que usaba:
- Eficiencia ponderada simple
- Rangos fijos por categoría
- Sin consideración de la matriz cualitativa

### Beneficios del Nuevo Sistema

1. **Precisión**: Sigue exactamente las reglas de negocio establecidas
2. **Transparencia**: Cada clasificación incluye razonamiento detallado
3. **Flexibilidad**: Fácil modificación de rangos y matriz
4. **Consistencia**: Misma lógica en todos los filtros y vistas

## Mantenimiento

### Modificar Rangos

Para cambiar los rangos de clasificación, editar las funciones en `clasificacion-cualitativa.ts`:

```typescript
export function clasificarBono(porcentajeBono: number): CategoriaOperador {
  if (porcentajeBono === 100) return "Oro";
  if (porcentajeBono >= 95) return "Plata";
  // ... resto de la lógica
}
```

### Modificar Matriz

Para cambiar la matriz de combinaciones, editar `MATRIZ_CLASIFICACION` en el mismo archivo.

### Testing

Usar las herramientas de debug para verificar cambios:
1. Probar casos límite (94%, 95%, etc.)
2. Verificar combinaciones específicas
3. Validar con datos reales

## Troubleshooting

### Problemas Comunes

1. **Categorías incorrectas**: Verificar rangos en las funciones de clasificación
2. **Datos no actualizados**: Asegurar que `processOperatorsData` se ejecute
3. **Filtros no funcionan**: Verificar integración en `operator-rankings.tsx`

### Logs Útiles

El sistema genera logs detallados:
```
Procesando datos para filtro global con clasificación cualitativa
Bono: 97% (Plata) + Km: 92% (Plata) = Plata
```

### Verificación Manual

Usar la página `/debug-clasificacion` para verificar casos específicos y comparar con Excel u otros sistemas de referencia.
