import type { Operator, CategoryColors, FilterType, SortType, SortOrder, CategoryStats, TimeFilterType } from "@/types/operator-types"
import { clasificarOperador, determinarCategoriaFinal, type CategoriaOperador } from "./clasificacion-cualitativa"

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
 * Procesa los datos de operadores según el tipo de filtro, aplicando la clasificación cualitativa
 */
export const processOperatorsData = (operators: Operator[], filterType: TimeFilterType): Operator[] => {
  if (operators.length === 0) {
    return operators;
  }
  
  console.log(`Procesando ${operators.length} operadores con filtro: ${filterType}`);
  
  return operators.map(operator => {
    let porcentajeKm = 0;
    let porcentajeBono = 0;
    
    // Determinar porcentajes según el tipo de filtro
    if (filterType === 'month') {
      porcentajeKm = operator.km?.percentage || 0;
      porcentajeBono = operator.bonus?.percentage || 0;
    } else if (filterType === 'year') {
      const totalProgramado = operator.km?.total_programado || 0;
      const totalEjecutado = operator.km?.total_ejecutado || 0;
      
      if (totalProgramado > 0) {
        porcentajeKm = (totalEjecutado / totalProgramado) * 100;
      }
      porcentajeKm = Math.round(porcentajeKm * 100) / 100;
      porcentajeBono = operator.bonus?.percentage || 0;
    } else {
      const totalProgramado = operator.km?.total_programado || 0;
      const totalEjecutado = operator.km?.total_ejecutado || 0;
      
      if (totalProgramado > 0) {
        porcentajeKm = (totalEjecutado / totalProgramado) * 100;
      }
      porcentajeKm = Math.round(porcentajeKm * 100) / 100;
      porcentajeBono = operator.bonus?.percentage || 0;
    }
    
    // Aplicar clasificación cualitativa
    const clasificacion = clasificarOperador(porcentajeBono, porcentajeKm);
    const eficienciaSimple = (porcentajeBono + porcentajeKm) / 2;
    
    return {
      ...operator,
      bonus: {
        ...operator.bonus,
        percentage: porcentajeBono,
        category: clasificacion.categoriaBono,
        total: operator.bonus?.total || 0,
        trend: operator.bonus?.trend || "stable",
        date: operator.bonus?.date || null
      },
      km: {
        ...operator.km,
        percentage: porcentajeKm,
        total: operator.km?.total || 0,
        total_programado: operator.km?.total_programado || 0,
        total_ejecutado: operator.km?.total_ejecutado || 0,
        category: clasificacion.categoriaKm,
        trend: operator.km?.trend || "stable",
        date: operator.km?.date || null
      },
      efficiency: eficienciaSimple,
      category: clasificacion.categoriaFinal,
      clasificacionDetalles: {
        razonamiento: clasificacion.detalles.razonamiento,
        categoriaBono: clasificacion.categoriaBono,
        categoriaKm: clasificacion.categoriaKm,
        categoriaFinal: clasificacion.categoriaFinal
      }
    };
  });
};

/**
 * Función auxiliar para clasificar un operador individual sin procesar toda la lista
 * Útil para casos donde solo necesitamos la clasificación de un operador específico
 */
export function clasificarOperadorIndividual(
  porcentajeBono: number,
  porcentajeKm: number
): {
  categoriaFinal: CategoriaOperador;
  categoriaBono: CategoriaOperador;
  categoriaKm: CategoriaOperador;
  razonamiento: string;
} {
  const clasificacion = clasificarOperador(porcentajeBono, porcentajeKm);
  
  return {
    categoriaFinal: clasificacion.categoriaFinal,
    categoriaBono: clasificacion.categoriaBono,
    categoriaKm: clasificacion.categoriaKm,
    razonamiento: clasificacion.detalles.razonamiento
  };
}

/**
 * Función para actualizar la categoría de un operador existente
 * sin afectar otros campos
 */
export function actualizarCategoriaOperador(operator: Operator): Operator {
  const porcentajeBono = operator.bonus?.percentage || 0;
  const porcentajeKm = operator.km?.percentage || 0;
  
  const clasificacion = clasificarOperador(porcentajeBono, porcentajeKm);
  
  return {
    ...operator,
    bonus: {
      ...operator.bonus,
      category: clasificacion.categoriaBono,
      percentage: porcentajeBono,
      total: operator.bonus?.total || 0,
      trend: operator.bonus?.trend || "stable",
      date: operator.bonus?.date || null
    },
    km: {
      ...operator.km,
      category: clasificacion.categoriaKm,
      percentage: porcentajeKm,
      total: operator.km?.total || 0,
      total_programado: operator.km?.total_programado || 0,
      total_ejecutado: operator.km?.total_ejecutado || 0,
      trend: operator.km?.trend || "stable",
      date: operator.km?.date || null
    },
    category: clasificacion.categoriaFinal,
    clasificacionDetalles: {
      razonamiento: clasificacion.detalles.razonamiento,
      categoriaBono: clasificacion.categoriaBono,
      categoriaKm: clasificacion.categoriaKm,
      categoriaFinal: clasificacion.categoriaFinal
    }
  };
}

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
