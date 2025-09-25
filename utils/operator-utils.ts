import type { Operator, CategoryColors, FilterType, SortType, SortOrder, CategoryStats, TimeFilterType } from "@/types/operator-types"

// Return icon name as string instead of JSX
export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Oro":
      return "Crown"
    case "Plata":
      return "Medal"
    case "Bronce":
      return "Award"
    case "Mejorar":
      return "AlertTriangle"
    case "Taller Conciencia":
      return "AlertCircle"
    default:
      return "Award"
  }
}

export const getCategoryColor = (category: string): CategoryColors => {
  switch (category) {
    case "Oro":
      return {
        bg: "from-yellow-400 to-yellow-600",
        text: "text-yellow-800",
        border: "border-yellow-200",
        bgLight: "bg-yellow-50",
        shadow: "shadow-yellow-200/50",
        ring: "ring-yellow-200",
      }
    case "Plata":
      return {
        bg: "from-gray-400 to-gray-600",
        text: "text-gray-800",
        border: "border-gray-200",
        bgLight: "bg-gray-50",
        shadow: "shadow-gray-200/50",
        ring: "ring-gray-200",
      }
    case "Bronce":
      return {
        bg: "from-amber-400 to-amber-600",
        text: "text-amber-800",
        border: "border-amber-200",
        bgLight: "bg-amber-50",
        shadow: "shadow-amber-200/50",
        ring: "ring-amber-200",
      }
    case "Mejorar":
      return {
        bg: "from-orange-400 to-orange-600",
        text: "text-orange-800",
        border: "border-orange-200",
        bgLight: "bg-orange-50",
        shadow: "shadow-orange-200/50",
        ring: "ring-orange-200",
      }
    case "Taller Conciencia":
      return {
        bg: "from-red-400 to-red-600",
        text: "text-red-800",
        border: "border-red-200",
        bgLight: "bg-red-50",
        shadow: "shadow-red-200/50",
        ring: "ring-red-200",
      }
    default:
      return {
        bg: "from-gray-400 to-gray-600",
        text: "text-gray-800",
        border: "border-gray-200",
        bgLight: "bg-gray-50",
        shadow: "shadow-gray-200/50",
        ring: "ring-gray-200",
      }
  }
}

// Return trend identifier as string instead of JSX
export const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return "TrendingUp"
    case "down":
      return "TrendingDown"
    default:
      return "Circle"
  }
}

export const getRankBadgeColor = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
  if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-600"
  if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600"
  return "bg-gradient-to-r from-gray-300 to-gray-500"
}

export const getRankTextColor = (rank: number) => {
  if (rank === 1) return "text-yellow-600"
  if (rank === 2) return "text-gray-500"
  if (rank === 3) return "text-amber-600"
  return "text-gray-400"
}


/**
 * Procesa los datos de operadores según el tipo de filtro, sumando los datos de kilómetros
 * y recalculando los porcentajes cuando sea necesario (año completo o global)
 * @param operators Lista de operadores a procesar
 * @param filterType Tipo de filtro aplicado (global, year, month)
 * @returns Lista de operadores con datos procesados
 */
export function processOperatorsData(operators: Operator[], filterType: TimeFilterType): Operator[] {
  // Si es filtro por mes, no necesitamos procesar nada adicional
  if (filterType === 'month' || operators.length === 0) {
    return operators;
  }
  
  // Para filtros por año o global, necesitamos sumar los datos
  return operators.map(operator => {
    // Obtener los valores actuales
    const totalProgramado = operator.km?.total_programado || 0;
    const totalEjecutado = operator.km?.total_ejecutado || 0;
    
    // Calcular el nuevo porcentaje basado en los totales
    let newPercentage = 0;
    if (totalProgramado > 0) {
      newPercentage = (totalEjecutado / totalProgramado) * 100;
    }
    
    // Redondear a 2 decimales
    newPercentage = Math.round(newPercentage * 100) / 100;
    
    // Calcular eficiencia ponderada que considera TANTO el porcentaje como la cantidad total
    // Esto evita que personas con pocos km programados pero 100% de cumplimiento estén por encima
    // de personas con muchos más km ejecutados pero con un porcentaje un poco menor
    
    // Encontrar el valor máximo de kilómetros en toda la flota para normalizar
    const maxKmEnFlota = Math.max(...operators.map(op => op.km?.total_ejecutado || 0));
    
    // Peso del porcentaje en la eficiencia final (0.6 = 60% del peso)
    const pesoPorcentaje = 0.6;
    // Peso de los kilómetros totales en la eficiencia final (0.4 = 40% del peso)
    const pesoKilometros = 0.4;
    
    // Normalizar los kilómetros ejecutados (0-100)
    const kmNormalizados = maxKmEnFlota > 0 ? (totalEjecutado / maxKmEnFlota) * 100 : 0;
    
    // Calcular eficiencia ponderada (combinación de porcentaje y cantidad)
    const eficienciaPonderada = (newPercentage * pesoPorcentaje) + (kmNormalizados * pesoKilometros);
    const eficienciaRedondeada = Math.round(eficienciaPonderada * 10) / 10; // Redondear a 1 decimal
    
    
    // Determinar la categoría basada en la eficiencia ponderada
    let categoria: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia";
    if (eficienciaRedondeada >= 95) {
      categoria = "Oro";
    } else if (eficienciaRedondeada >= 85) {
      categoria = "Plata";
    } else if (eficienciaRedondeada >= 75) {
      categoria = "Bronce";
    } else if (eficienciaRedondeada >= 60) {
      categoria = "Mejorar";
    } else {
      categoria = "Taller Conciencia";
    }
    
    // Devolver una copia del operador con los datos actualizados
    return {
      ...operator,
      km: {
        percentage: newPercentage,
        total: operator.km?.total || 0,
        total_programado: operator.km?.total_programado || 0,
        total_ejecutado: operator.km?.total_ejecutado || 0,
        category: operator.km?.category || categoria,
        trend: operator.km?.trend || "stable",
        date: operator.km?.date || null
      },
      // Actualizar la eficiencia general y la categoría del operador
      efficiency: eficienciaRedondeada,
      category: categoria
    };
  });
};

export const calculateCategoryStats = (operators: Operator[]): CategoryStats => {
  return {
    Oro: operators.filter((op) => op.category === "Oro").length,
    Plata: operators.filter((op) => op.category === "Plata").length,
    Bronce: operators.filter((op) => op.category === "Bronce").length,
    Mejorar: operators.filter((op) => op.category === "Mejorar").length,
    "Taller Conciencia": operators.filter((op) => op.category === "Taller Conciencia").length,
  }
}

export const filterAndSortOperators = (
  operators: Operator[],
  filter: FilterType,
  searchQuery: string,
  sortBy: SortType,
  sortOrder: SortOrder,
): Operator[] => {
  // Si no hay operadores, devolver array vacío inmediatamente
  if (!operators || operators.length === 0) {
    return [];
  }
  
  // Normalizar la búsqueda para hacerla más robusta
  const normalizedQuery = searchQuery.toLowerCase().trim();
  
  // Variable para almacenar los resultados filtrados
  let filtered = operators;
  
  // Primero aplicar búsqueda si hay un término (en TODOS los operadores)
  if (normalizedQuery) {
    filtered = filtered.filter((op) => {
      try {
        // Acceder de forma segura a las propiedades
        const opAny = op as any; // Tratar como any para acceder a propiedades no definidas en la interfaz
        
        // Verificar el nombre (puede estar en name o nombre)
        const nameMatch = 
          (typeof op.name === 'string' && op.name.toLowerCase().includes(normalizedQuery)) || 
          (typeof opAny.nombre === 'string' && opAny.nombre.toLowerCase().includes(normalizedQuery));
        
        // Verificar departamento/cargo (puede estar en department, cargo o position)
        const departmentMatch = 
          (typeof op.department === 'string' && op.department.toLowerCase().includes(normalizedQuery)) || 
          (typeof opAny.cargo === 'string' && opAny.cargo.toLowerCase().includes(normalizedQuery));
        
        // Verificar posición (puede estar en position o cargo)
        const positionMatch = 
          (typeof op.position === 'string' && op.position.toLowerCase().includes(normalizedQuery)) || 
          (typeof opAny.cargo === 'string' && opAny.cargo.toLowerCase().includes(normalizedQuery));
        
        // Verificar ID (puede estar en id o codigo)
        const idMatch = 
          (op.id && String(op.id).toLowerCase().includes(normalizedQuery)) || 
          (opAny.codigo && String(opAny.codigo).toLowerCase().includes(normalizedQuery));
        
        // Verificar documento (puede estar en document o cedula)
        const documentMatch = 
          (typeof op.document === 'string' && op.document.toLowerCase().includes(normalizedQuery)) || 
          (typeof opAny.cedula === 'string' && opAny.cedula.toLowerCase().includes(normalizedQuery));
        
        // Devolver true si cualquiera de los campos coincide
        return nameMatch || departmentMatch || positionMatch || idMatch || documentMatch;
      } catch (error) {
        console.error('Error al filtrar operador:', error);
        return false; // Si hay error, no incluir este operador
      }
    });
  }
  
  // Luego filtrar por categoría (después de la búsqueda)
  if (filter !== "all") {
    filtered = filtered.filter((op) => op.category === filter);
  }
  
  // Devolver el array filtrado y ordenado
  return filtered.sort((a, b) => {
      let aValue, bValue;
      
      // Función auxiliar para garantizar que comparamos números válidos
      const ensureNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'string') {
          // Convertir cadenas a números, reemplazando comas por puntos (formato europeo)
          return parseFloat(val.replace(',', '.')) || 0;
        }
        return typeof val === 'number' ? val : 0;
      };
      
      switch (sortBy) {
        case "bonus":
          // Para bonos, ordenar primero por porcentaje y luego por total
          aValue = ensureNumber(a.bonus?.percentage);
          bValue = ensureNumber(b.bonus?.percentage);
          
          // Si los porcentajes son iguales, ordenar por total
          if (aValue === bValue) {
            aValue = ensureNumber(a.bonus?.total);
            bValue = ensureNumber(b.bonus?.total);
          }
          break;
          
        case "km":
          // Para kilómetros, ordenar por total_ejecutado SIEMPRE
          aValue = ensureNumber(a.km?.total_ejecutado);
          bValue = ensureNumber(b.km?.total_ejecutado);
          
          // Log para depuración (usar nombre propiamente para el tipo Operator)
          const nombreA = typeof a.name === 'string' ? a.name : 
                        (a as any).nombre || 'Sin nombre';
          const nombreB = typeof b.name === 'string' ? b.name : 
                        (b as any).nombre || 'Sin nombre';
          console.log(`Comparando KM: ${nombreA}: ${aValue} vs ${nombreB}: ${bValue}`); 
          break;
          
        case "efficiency":
          // Para eficiencia, usar el valor directo
          aValue = ensureNumber(a.efficiency);
          bValue = ensureNumber(b.efficiency);
          break;
          
        default: // Ranking
          // Para ranking, usar el campo rank (menor es mejor)
          aValue = ensureNumber(a.rank) || 999;
          bValue = ensureNumber(b.rank) || 999;
          // Invertir el orden para ranking porque menor es mejor
          return sortOrder === "desc" ? aValue - bValue : bValue - aValue;
      }
      
      // Para los demás criterios, mayor es mejor
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    })
}
