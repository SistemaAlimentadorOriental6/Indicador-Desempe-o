import type { Operator, TimeFilterType } from "../types/operator-types";
import { clasificarBono, clasificarKm, determinarCategoriaFinal } from "./clasificacion-cualitativa";

// Funciones de compatibilidad que usan el nuevo sistema de clasificación
export const determineBonusCategory = (percentage: number): string => {
  return clasificarBono(percentage);
};

export const determineKmCategory = (percentage: number): string => {
  return clasificarKm(percentage);
};

export const determineFinalCategory = (bonusCategory: string, kmCategory: string): string => {
  // Esta función recibe las categorías ya clasificadas, no los porcentajes
  // Usar la matriz directamente desde el nuevo sistema
  const MATRIZ_CLASIFICACION: Record<string, Record<string, string>> = {
    "Oro": {
      "Oro": "Oro",
      "Plata": "Plata",
      "Bronce": "Plata",
      "Mejorar": "Bronce",
      "Taller Conciencia": "Bronce"
    },
    "Plata": {
      "Oro": "Plata",
      "Plata": "Plata",
      "Bronce": "Bronce",
      "Mejorar": "Bronce",
      "Taller Conciencia": "Bronce"
    },
    "Bronce": {
      "Oro": "Plata",
      "Plata": "Bronce",
      "Bronce": "Bronce",
      "Mejorar": "Bronce",
      "Taller Conciencia": "Bronce"
    },
    "Mejorar": {
      "Oro": "Mejorar",
      "Plata": "Mejorar",
      "Bronce": "Mejorar",
      "Mejorar": "Mejorar",
      "Taller Conciencia": "Taller Conciencia"
    },
    "Taller Conciencia": {
      "Oro": "Taller Conciencia",
      "Plata": "Taller Conciencia",
      "Bronce": "Taller Conciencia",
      "Mejorar": "Taller Conciencia",
      "Taller Conciencia": "Taller Conciencia"
    }
  };
  
  return MATRIZ_CLASIFICACION[bonusCategory]?.[kmCategory] || "Taller Conciencia";
};

// Interfaz para la respuesta de la API de rankings
interface RankingsApiResponse {
  success: boolean;
  data: Operator[];
  isDemoData?: boolean;
  error?: string;
  message?: string;
  filterInfo?: {
    type: TimeFilterType;
    year: number;
    month?: number;
    availableYears: number[];
    latestYear: number;
    latestMonth: number;
  };
  lastUpdated?: string;
}

// Función para obtener datos reales de operadores desde la API
export const fetchRealOperatorsData = async (
  filterType: TimeFilterType = "global", 
  filterValue: string | number | null | undefined = null
): Promise<{ 
  operators: Operator[], 
  isUsingDemoData: boolean, 
  message?: string,
  error?: string,
  filterInfo?: {
    type: TimeFilterType;
    year: number;
    month?: number;
    availableYears: number[];
    latestYear: number;
    latestMonth: number;
  }
}> => {
  try {
    // Construir URL con parámetros de filtro
    let url = '/api/user/rankings';
    const params = new URLSearchParams();
    
    if (filterType !== "global") {
      params.append('filterType', filterType);
      if (filterValue !== null && filterValue !== undefined) {
        // Asegurar formato correcto para filtros de mes
        if (filterType === "month" && typeof filterValue === "string") {
          // Verificar si el formato es YYYY-MM
          const parts = filterValue.split('-');
          if (parts.length === 2) {
            const year = parts[0];
            const month = parts[1];
            console.log(`Procesando filtro de mes: año=${year}, mes=${month}`);
            // Asegurar que el mes tiene 2 dígitos y es un número válido entre 1 y 12
            const monthNum = parseInt(month, 10);
            if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
              const formattedMonth = monthNum.toString().padStart(2, '0');
              // Reconstruir el valor del filtro
              const formattedValue = `${year}-${formattedMonth}`;
              params.append('filterValue', formattedValue);
              console.log(`Valor de filtro formateado: ${formattedValue}`);
            } else {
              console.warn(`Valor de mes inválido: ${month}. Usando sin formatear.`);
              params.append('filterValue', String(filterValue));
            }
          } else {
            params.append('filterValue', String(filterValue));
          }
        } else {
          params.append('filterValue', String(filterValue));
        }
      }
    } else {
      // Si es global, no enviamos filterType pero podemos enviar un timestamp para evitar caché
      params.append('t', Date.now().toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log(`Solicitando datos con filtro: ${url}`);
    
    // Usar el endpoint unificado de rankings con parámetros de filtro
    console.log(`Realizando solicitud a: ${url}`);
    
    let data: RankingsApiResponse;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.warn(`Error de respuesta al obtener datos de rankings: ${response.status}`);
        // No lanzamos error, permitimos que continue y devuelva un objeto vacío
        // que será manejado por el componente
        return { operators: [], isUsingDemoData: true, error: `Error de servidor: ${response.status}` };
      }
      
      data = await response.json();
      console.log('Respuesta de la API:', data);
      
      if (!data.success) {
        console.warn('La API indicó que la operación no fue exitosa');
        return { 
          operators: [], 
          isUsingDemoData: true, 
          error: data.error || 'Error al obtener datos de rankings',
          message: data.message || 'Error al obtener datos de rankings'
        };
      }
    } catch (fetchError) {
      console.error('Error al realizar la solicitud fetch:', fetchError);
      return { operators: [], isUsingDemoData: true, error: `Error de red: ${fetchError}` };
    }
    
    // Verificar si son datos de demostración
    const isUsingDemoData = data.isDemoData === true;
    
    // Si hay un error pero tenemos datos de demostración, lo reportamos pero seguimos
    if (data.error) {
      console.warn('API reportó un error pero proporcionó datos de demostración:', data.error);
    }
    
    // Comprobar si los datos están en data o en data.data según la estructura de la API
    // Primero verificamos si data.data existe y es un array, si no, intentamos usar data directamente
    const operatorsData = Array.isArray(data.data) ? data.data : [];
    console.log('Estructura de datos recibida:', data);
    console.log('Operadores encontrados:', operatorsData.length);
    
    // Si no hay datos pero tenemos información de filtros, devolvemos esa información
    if (operatorsData.length === 0 && data.filterInfo) {
      console.warn('No hay datos para el filtro seleccionado, pero se devolvió información de filtros');
      return {
        operators: [],
        isUsingDemoData: true,
        message: data.message || `No hay datos disponibles para el filtro seleccionado: ${filterType === 'month' ? 'Mes ' + filterValue : filterType === 'year' ? 'Año ' + filterValue : 'Global'}`,
        filterInfo: data.filterInfo
      };
    }
    
    // Si el filtro es por año, obtener la eficiencia global correcta para cada operador
    let finalOperatorsData = operatorsData;
    if (filterType === 'year' && filterValue && operatorsData.length > 0) {
      console.log(`Actualizando eficiencias globales para ${operatorsData.length} operadores del año ${filterValue}`);
      
      try {
        // Obtener eficiencias globales para todos los operadores en paralelo
        const efficiencyPromises = operatorsData.map(async (operator: any) => {
          try {
            const response = await fetch(`/api/user/global-efficiency?userCode=${operator.codigo}&year=${filterValue}`);
            const result = await response.json();
            
            if (result.success && result.data && typeof result.data.efficiency === 'number') {
              return {
                ...operator,
                efficiency: result.data.efficiency
              };
            } else {
              console.warn(`No se pudo obtener eficiencia global para operador ${operator.codigo}:`, result.message);
              return operator; // Mantener eficiencia original si falla
            }
          } catch (error) {
            console.error(`Error obteniendo eficiencia global para operador ${operator.codigo}:`, error);
            return operator; // Mantener eficiencia original si falla
          }
        });
        
        // Esperar a que todas las llamadas se completen
        finalOperatorsData = await Promise.all(efficiencyPromises);
        
        // Reordenar por eficiencia actualizada
        finalOperatorsData.sort((a: any, b: any) => (b.efficiency || 0) - (a.efficiency || 0));
        
        // Actualizar rankings
        finalOperatorsData.forEach((operator: any, index: number) => {
          operator.rank = index + 1;
        });
        
        console.log(`Eficiencias globales actualizadas exitosamente para el año ${filterValue}`);
      } catch (error) {
        console.error('Error actualizando eficiencias globales:', error);
        // Si falla, usar los datos originales
        finalOperatorsData = operatorsData;
      }
    }

    // Si hay datos, los devolvemos junto con la información de filtro
    return { 
      operators: finalOperatorsData, 
      isUsingDemoData,
      message: data.message,
      error: isUsingDemoData ? (data.error || 'Usando datos de demostración') : undefined,
      filterInfo: data.filterInfo
    };
  } catch (error) {
    console.error("Error al obtener datos reales de operadores:", error);
    return { operators: [], isUsingDemoData: true, error: String(error) };
  }
};

// Función para actualizar la página de rankings con datos reales
export const updateRankingsWithRealData = async (): Promise<Operator[]> => {
  const result = await fetchRealOperatorsData();
  return result.operators;
};
