"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Medal,
  Award,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  DollarSign,
  X,
  Calendar,
  BarChart3,
  Crown,
  Flame,
  Loader2
} from "lucide-react"
import { calculateCategoryStats, filterAndSortOperators, processOperatorsData } from "@/utils/operator-utils"
import { fetchRealOperatorsData } from "@/utils/ranking-utils"
// import { calculateBonusValue } from "@/utils/bonus-config"
import { RankingsHeader } from "./rankings-header"
import { CategoryStatsGrid } from "./category-stats"
import SearchAndControls from "./search-and-controls"
import { FilterChips } from "./filter-chips"
import { OperatorCard } from "./operator-grid-card"
import { OperatorListItem } from "./operator-list-item"
import { OperatorDetailModal } from "./operator-detail-modal"
import { WeeklyChart } from "./weekly-chart"
import { NoResults } from "./no-results"
import { Pagination } from "@/components/ui/pagination"
import type { Operator, FilterType, SortType, SortOrder, ViewMode, TimeFilterType, TimeFilter } from "@/types/operator-types"

interface OperatorOld {
  id: string | number
  name: string
  document?: string
  avatar?: string
  position: string
  phone?: string
  joinDate: string | null
  bonus: {
    percentage: number
    total: number
    category: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia"
    trend: "up" | "down" | "stable"
    date: string | null
  }
  km: {
    percentage: number
    total: number
    category: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia"
    trend: "up" | "down" | "stable"
    date: string | null
  }
  efficiency: number
  category: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia"
  rank: number
  weeklyPerformance: number[]
  department?: string
  monthlyGoal?: number
  lastUpdate?: string
  trend?: "up" | "down" | "stable"
  streak: number
  consistency?: number
  achievements?: string[]
  profileImage?: string
}

export const OperatorRankings: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortType>("rank")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'inactive' | 'with-novelty'>('all')
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(50) // Máximo 50 operadores por página
  
  // Estados para el filtro de tiempo
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("global")
  const [timeFilterValue, setTimeFilterValue] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [latestYear, setLatestYear] = useState<number | null>(null)
  const [latestMonth, setLatestMonth] = useState<number | null>(null)
  const [isInitialFilterSet, setIsInitialFilterSet] = useState<boolean>(false)

  // Cargar estado guardado al inicializar
  useEffect(() => {
    const savedSelectedOperator = localStorage.getItem('rankingsSelectedOperator');
    const savedViewMode = localStorage.getItem('rankingsViewMode');
    const savedSearchQuery = localStorage.getItem('rankingsSearchQuery');
    const savedSortBy = localStorage.getItem('rankingsSortBy');
    const savedSortOrder = localStorage.getItem('rankingsSortOrder');
    const savedActivityFilter = localStorage.getItem('rankingsActivityFilter');
    const savedCurrentPage = localStorage.getItem('rankingsCurrentPage');
    const savedTimeFilter = localStorage.getItem('rankingsTimeFilter');
    const savedTimeFilterValue = localStorage.getItem('rankingsTimeFilterValue');
    
    if (savedSelectedOperator) {
      try {
        setSelectedOperator(JSON.parse(savedSelectedOperator));
      } catch (error) {
        console.error('Error al cargar operador seleccionado:', error);
      }
    }
    
    if (savedViewMode) {
      setViewMode(savedViewMode as ViewMode);
    }
    
    if (savedSearchQuery) {
      setSearchQuery(savedSearchQuery);
    }
    
    if (savedSortBy) {
      setSortBy(savedSortBy as SortType);
    }
    
    if (savedSortOrder) {
      setSortOrder(savedSortOrder as SortOrder);
    }
    
    if (savedActivityFilter) {
      setActivityFilter(savedActivityFilter as 'all' | 'active' | 'inactive' | 'with-novelty');
    }
    
    if (savedCurrentPage) {
      setCurrentPage(Number(savedCurrentPage));
    }
    
    if (savedTimeFilter) {
      setTimeFilter(savedTimeFilter as TimeFilterType);
    }
    
    if (savedTimeFilterValue) {
      setTimeFilterValue(savedTimeFilterValue);
    }
  }, []);

  // Función para actualizar el operador seleccionado y guardarlo
  const updateSelectedOperator = (operator: Operator | null) => {
    setSelectedOperator(operator);
    if (operator) {
      localStorage.setItem('rankingsSelectedOperator', JSON.stringify(operator));
    } else {
      localStorage.removeItem('rankingsSelectedOperator');
    }
  };

  // Función para actualizar el modo de vista y guardarlo
  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('rankingsViewMode', mode);
  };

  // Función para actualizar la búsqueda y guardarla
  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    localStorage.setItem('rankingsSearchQuery', query);
  };

  // Función para actualizar el ordenamiento y guardarlo
  const updateSortBy = (sort: SortType) => {
    setSortBy(sort);
    localStorage.setItem('rankingsSortBy', sort);
  };

  const updateSortOrder = (order: SortOrder) => {
    setSortOrder(order);
    localStorage.setItem('rankingsSortOrder', order);
  };

  // Función para actualizar el filtro de actividad y guardarlo
  const updateActivityFilter = (filter: 'all' | 'active' | 'inactive' | 'with-novelty') => {
    setActivityFilter(filter);
    localStorage.setItem('rankingsActivityFilter', filter);
  };

  // Función para actualizar la página actual y guardarla
  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem('rankingsCurrentPage', page.toString());
  };

  // Función para actualizar el filtro de tiempo y guardarlo
  const updateTimeFilter = (filter: TimeFilterType) => {
    setTimeFilter(filter);
    localStorage.setItem('rankingsTimeFilter', filter);
  };

  const updateTimeFilterValue = (value: string | number | null) => {
    setTimeFilterValue(value ? value.toString() : null);
    if (value) {
      localStorage.setItem('rankingsTimeFilterValue', value.toString());
    } else {
      localStorage.removeItem('rankingsTimeFilterValue');
    }
  };

  // Actualizar los bonos de los operadores según el año seleccionado
  const updateOperatorsBonusByYear = (year: number) => {
    // Solo actualizar si hay operadores disponibles
    if (!operators || operators.length === 0) return;
    
    console.log(`Actualizando bonos para el año ${year}`);
    
    // Crear una copia de los operadores para no mutar el estado directamente
    const updatedOperators = operators.map(operator => {
      // Calcular el nuevo valor del bono según el año y el porcentaje de eficiencia
      const bonusPercentage = operator.bonus?.percentage ?? 0;
      // const newBonusValue = calculateBonusValue(year, bonusPercentage);
      const newBonusValue = 0; // TODO: Definir lógica si se requiere
      const bonusCategory = operator.bonus?.category ?? 'Taller Conciencia';
      const bonusTrend = operator.bonus?.trend ?? 'stable';
      const bonusDate = operator.bonus?.date ?? null;
      
      // Crear una copia del operador con el nuevo valor de bono
      return {
        ...operator,
        bonus: {
          percentage: bonusPercentage,
          total: newBonusValue,
          category: bonusCategory,
          trend: bonusTrend,
          date: bonusDate,
        }
      };
    });
    
    // Actualizar el estado con los operadores actualizados
    setOperators(updatedOperators);
  };
  
  // Manejar cambios en el filtro de tiempo
  const handleTimeFilterChange = (filter: TimeFilter) => {
    console.log('Filtro cambiado:', filter);
    
    // Extraer el año del filtro para actualizar los bonos
    let selectedYear = new Date().getFullYear(); // Año actual por defecto
    
    if (filter.type === 'year' && filter.value) {
      selectedYear = parseInt(filter.value.toString(), 10);
    } else if (filter.type === 'month' && filter.value) {
      // Extraer el año de la fecha en formato YYYY-MM
      const yearStr = filter.value.toString().split('-')[0];
      selectedYear = parseInt(yearStr, 10);
    }
    
    // Actualizar los operadores con los nuevos valores de bono según el año
    if (!isNaN(selectedYear)) {
      updateOperatorsBonusByYear(selectedYear);
    }
    
    // Actualizar el filtro de tiempo y guardarlo
    updateTimeFilter(filter.type);
    updateTimeFilterValue(filter.value || null);
    
    // Resetear la página al cambiar el filtro
    updateCurrentPage(1);
    
    // Actualizar el filtro de tiempo
    // La función loadOperatorsData se encargará de manejar los diferentes tipos
    loadOperatorsData(filter.type, filter.value);
  };
  
  // Cargar datos iniciales solo una vez al montar el componente
  useEffect(() => {
    loadOperatorsData(timeFilter, timeFilterValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Función para cargar datos de operadores con filtros de tiempo
  const loadOperatorsData = async (filterType: TimeFilterType = "global", filterValue: string | number | null | undefined = null) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Cargando datos con filtro: ${filterType}, valor: ${filterValue}`);
      
      // Limpiar la búsqueda al cambiar de filtro para evitar resultados vacíos
      if (searchQuery) {
        setSearchQuery("");
      }
      
      const result = await fetchRealOperatorsData(filterType, filterValue);
      console.log('Resultado de la API:', result);
      
      // Actualizar información de filtros disponibles si la API los proporciona
      if (result.filterInfo) {
        if (result.filterInfo.availableYears && result.filterInfo.availableYears.length > 0) {
          setAvailableYears(result.filterInfo.availableYears);
        }
        if (result.filterInfo.latestYear) {
          setLatestYear(result.filterInfo.latestYear);
        }
        if (result.filterInfo.latestMonth) {
          setLatestMonth(result.filterInfo.latestMonth);
        }
      }
      
      // Verificar si hay datos disponibles para el filtro seleccionado
      if (!result.operators || result.operators.length === 0) {
        const filterDesc = filterType === 'year' ? 'Año ' + filterValue : 
                          filterType === 'month' ? 'Mes ' + filterValue : 'Global';
        
        // Usar el mensaje de la API si está disponible, o un mensaje genérico si no
        const errorMessage = result.message || result.error || `No hay datos disponibles para el filtro seleccionado: ${filterDesc}`;
        console.log(`Error al cargar datos: ${errorMessage}`);
        setError(errorMessage);
        setIsUsingDemoData(true); // Indicar que estamos usando datos de demostración
        setLoading(false);
        return;
      }
      
      // Verificar si hay un mensaje específico de la API
      if (result.message) {
        console.log(`Mensaje de la API: ${result.message}`);
      }
      
      // Verificar si los datos necesitan formateo especial según el tipo de filtro
      let processedOperators = result.operators;
      
      // Asegurarse de que los valores se muestren correctamente para cualquier tipo de filtro
      processedOperators = processedOperators.map(op => {
        // Detectar valores predeterminados (142000) que indican falta de datos reales
        const hasDefaultKmValues = (
          ((op.km?.total ?? 0) === 142000 || (op.km?.total_programado ?? 0) === 142000 || (op.km?.total_ejecutado ?? 0) === 142000) &&
          (filterType === 'year' || filterType === 'month')
        );
        
        // Si se detectan valores predeterminados en filtros específicos, establecer valores a 0
        const kmValues = hasDefaultKmValues ? {
          total: 0,
          total_programado: 0,
          total_ejecutado: 0,
          percentage: 0
        } : {
          total: typeof op.km?.total === 'string' ? parseFloat(op.km?.total || '0') : (op.km?.total ?? 0),
          total_programado: typeof op.km?.total_programado === 'string' ? parseFloat(op.km?.total_programado || '0') : (op.km?.total_programado ?? 0),
          total_ejecutado: typeof op.km?.total_ejecutado === 'string' ? parseFloat(op.km?.total_ejecutado || '0') : (op.km?.total_ejecutado ?? 0),
          percentage: typeof op.km?.percentage === 'string' ? parseFloat(op.km?.percentage || '0') : (op.km?.percentage ?? 0)
        };
        
        return {
          ...op,
          bonus: {
            total: op.bonus?.total ? (typeof op.bonus.total === 'string' ? parseFloat(op.bonus.total || '0') : op.bonus.total) : 0,
            percentage: op.bonus?.percentage ? (typeof op.bonus.percentage === 'string' ? parseFloat(op.bonus.percentage || '0') : op.bonus.percentage) : 0,
            category: op.bonus?.category ?? 'Taller Conciencia',
            trend: op.bonus?.trend ?? 'stable',
            date: op.bonus?.date ?? null,
          },
          km: op.km ? {
            ...op.km,
            ...kmValues,
            category: op.km?.category ?? 'Taller Conciencia',
            trend: op.km?.trend ?? 'stable',
            date: op.km?.date ?? null,
          } : {
            percentage: 0,
            total: 0,
            total_programado: 0,
            total_ejecutado: 0,
            category: 'Taller Conciencia',
            trend: 'stable',
            date: null,
          },
          // Añadir información del filtro actual para que los componentes hijos puedan usarla
          timeFilter: {
            type: filterType,
            value: filterValue
          }
        };
      });
      
      // Procesar los datos según el tipo de filtro (sumar datos para año completo o global)
      if (filterType === 'year' || filterType === 'global') {
        console.log(`Procesando datos para filtro ${filterType}: sumando kilómetros y recalculando porcentajes`);
        
        // Implementación directa para evitar problemas de importación
        processedOperators = processedOperators.map(operator => {
          // Obtener los valores actuales
          const totalProgramado = typeof operator.km.total_programado === 'number' ? operator.km.total_programado : 0;
          const totalEjecutado = typeof operator.km.total_ejecutado === 'number' ? operator.km.total_ejecutado : 0;
          
          // Calcular el nuevo porcentaje basado en los totales
          let newPercentage = 0;
          if (totalProgramado > 0) {
            newPercentage = (totalEjecutado / totalProgramado) * 100;
          }
          
          // Redondear a 2 decimales
          newPercentage = Math.round(newPercentage * 100) / 100;
          
          // Crear una copia del operador con los valores actualizados
          return {
            ...operator,
            km: {
              ...operator.km,
              percentage: newPercentage,
              total: totalEjecutado // El total mostrado debe ser el ejecutado
            }
          };
        });
      }
      
      
      // Actualizar el estado con los operadores procesados
      setOperators(processedOperators);
      setIsUsingDemoData(result.isUsingDemoData);
      
      // Actualizar el estado del filtro activo
      setTimeFilter(filterType);
      setTimeFilterValue(filterValue ? filterValue.toString() : null);
      
      // Actualizar información de filtros de tiempo disponibles
      if (result.filterInfo) {
        // Solo actualizar años disponibles si hay datos
        if (result.filterInfo.availableYears && result.filterInfo.availableYears.length > 0) {
          setAvailableYears(result.filterInfo.availableYears);
        }
        
        if (result.filterInfo.latestYear) {
          setLatestYear(result.filterInfo.latestYear);
        }
        
        if (result.filterInfo.latestMonth) {
          setLatestMonth(result.filterInfo.latestMonth);
        }
        
        // Si no hay un filtro seleccionado, establecer el filtro por defecto al último mes disponible
        // pero solo durante la carga inicial, no en cambios de filtro subsecuentes
        if (filterType === "global" && !filterValue && 
            result.filterInfo.latestYear && 
            result.filterInfo.latestMonth && 
            !isInitialFilterSet) {
          const defaultYear = result.filterInfo.latestYear;
          const defaultMonth = result.filterInfo.latestMonth;
          const formattedMonth = defaultMonth.toString().padStart(2, '0');
          
          // Actualizar filtro con el último mes disponible
          setTimeFilter("month");
          setTimeFilterValue(`${defaultYear}-${formattedMonth}`);
          setIsInitialFilterSet(true);
          
          // Cargar datos con el filtro por defecto
          await loadOperatorsData("month", `${defaultYear}-${formattedMonth}`);
          return;
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos de operadores:", error);
      setError("Error al cargar datos. Por favor, intente de nuevo.");
      setLoading(false);
    }
  };

  // Función para determinar si un operador está activo basándose en fecha de retiro
  const isOperatorActive = (operator: Operator): boolean => {
    // Un operador se considera activo si NO tiene fecha de retiro
    return !operator.retirementDate;
  };

  // Función para determinar si un operador está activo hoy (para compatibilidad)
  const isOperatorActiveToday = (operator: Operator): boolean => {
    // Un operador se considera activo si:
    // 1. Tiene datos de kilómetros en el mes actual
    // 2. Tiene datos de bonos en el mes actual
    // 3. Su última actualización es reciente (últimos 7 días)
    
    const today = new Date();
    const lastUpdate = operator.lastUpdate ? new Date(operator.lastUpdate) : null;
    
    // Verificar si tiene actividad reciente (últimos 7 días)
    if (lastUpdate) {
      const daysSinceUpdate = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate <= 7) return true;
    }
    
    // Verificar si tiene datos de kilómetros o bonos
    const hasKmData = operator.km && (
      (operator.km.total_ejecutado && operator.km.total_ejecutado > 0) ||
      (operator.km.total && operator.km.total > 0)
    ) || false;
    
    const hasBonusData = operator.bonus && (
      (operator.bonus.total && operator.bonus.total > 0) ||
      (operator.bonus.percentage && operator.bonus.percentage > 0)
    ) || false;
    
    return hasKmData || hasBonusData;
  };

  // Función para determinar si un operador tiene novedad (tiene tarea asignada)
  const hasNovelty = (operator: Operator): boolean => {
    return !!(operator.tarea && operator.tarea.trim() !== '');
  };

  // Calcular estadísticas de actividad basadas en fecha de retiro
  const activityStats = {
    totalCount: operators.length,
    activeCount: operators.filter(isOperatorActive).length,
    inactiveCount: operators.filter(op => !isOperatorActive(op)).length,
    withNoveltyCount: operators.filter(hasNovelty).length
  };

  // Filtrar operadores por actividad
  const activityFilteredOperators = operators.filter(operator => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'active') return isOperatorActive(operator);
    if (activityFilter === 'inactive') return !isOperatorActive(operator);
    if (activityFilter === 'with-novelty') return hasNovelty(operator);
    return true;
  });

  // Filtrar y ordenar operadores según los criterios actuales
  const filteredOperators = activityFilteredOperators.length > 0 ? filterAndSortOperators(
    activityFilteredOperators,
    filter,
    searchQuery,
    sortBy,
    sortOrder
  ) : [];
  
  // Calcular paginación
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOperators = filteredOperators.slice(startIndex, endIndex)
  
  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery, sortBy, sortOrder])
  
  // Efecto para manejar la búsqueda sin recargar datos completos
  useEffect(() => {
    // Solo aplicar el filtro local sin recargar datos del servidor
    // La función filterAndSortOperators ya maneja esto
    console.log(`Aplicando búsqueda: "${searchQuery}" a ${operators.length} operadores`);
  }, [searchQuery]);

  // Calcular estadísticas de categorías basadas en operadores filtrados por actividad
  const categoryStats = calculateCategoryStats(activityFilteredOperators)
  
  // Debug: mostrar información de los operadores cargados
  console.log(`Total de operadores cargados: ${operators.length}`);
  console.log(`Operadores filtrados por actividad: ${activityFilteredOperators.length}`);
  console.log('Estadísticas de categorías:', categoryStats);

  const handleClearFilters = () => {
    setFilter("all")
    setSearchQuery("")
  }

  // Función para convertir datos a CSV
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = [
      'Ranking',
      'Nombre',
      'Cédula',
      'Cargo',
      'Categoría',
      'Bonos (%)',
      'Bonos (Total)',
      'Kilómetros (%)',
      'Kilómetros (Ejecutados)',
      'Kilómetros (Programados)',
      'Eficiencia'
    ];
    
    const rows = data.map((operator: any) => [
      operator.rank || 'N/A',
      operator.name || 'N/A',
      operator.cedula || operator.document || 'N/A',
      operator.position || operator.cargo || 'N/A',
      operator.category || 'N/A',
      operator.bonus?.percentage || 0,
      operator.bonus?.total || 0,
      operator.km?.percentage || 0,
      operator.km?.total_ejecutado || 0,
      operator.km?.total_programado || 0,
      operator.efficiency || 0
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  const renderWeeklyChart = (data: number[], small = false) => <WeeklyChart data={data} small={small} />

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Oro":
        return <Crown className="w-5 h-5 text-yellow-500" />
      case "Plata":
        return <Medal className="w-5 h-5 text-gray-400" />
      case "Bronce":
        return <Award className="w-5 h-5 text-amber-600" />
      case "Mejorar":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case "Taller Conciencia":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Award className="w-5 h-5 text-gray-400" />
    }
  }



  const getCategoryColor = (category: string) => {
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
    }
  }

  const OperatorDetailModalOld = ({ operator }: { operator: OperatorOld }) => {
    const colors = getCategoryColor(operator.category || "Plata")
    
    // Crear un avatar a partir del nombre si no existe
    const avatarText = operator.avatar || operator.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
          {/* Enhanced Header */}
          <div className={`relative p-8 bg-gradient-to-r ${colors.bg} text-white rounded-t-3xl overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

            <button
              onClick={() => setSelectedOperator(null)}
              className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-3xl font-bold backdrop-blur-sm border border-white/30">
                  {avatarText}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{operator.name}</h2>
                  <p className="text-xl opacity-90 mb-1">{operator.position}</p>
                  <p className="opacity-75">{operator.department || "Logística"}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(operator.category)}
                      <span className="font-medium">{operator.category}</span>
                    </div>
                    {operator.streak >= 30 && (
                      <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{operator.bonus.percentage.toFixed(2)}%</span>
                          {operator.bonus.trend && getTrendIcon(operator.bonus.trend)}
                        </div>
                      </div>
                    )}
                    {operator.trend && getTrendIcon(operator.trend)}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold">{operator.efficiency}%</div>
                  <div className="text-sm opacity-75">Eficiencia</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold">${operator.bonus.total.toLocaleString()}</div>
                  <div className="text-sm opacity-75">Bonos Totales</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold">{operator.km.total.toLocaleString()} km</div>
                  <div className="text-sm opacity-75">KM Totales</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-6 border border-primary-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-800">Bonos</h3>
                    <p className="text-sm text-amber-600">Categoría: {operator.bonus.category}</p>
                  </div>
                </div>
                <div className="text-4xl font-bold text-amber-700 mb-4">{operator.bonus.percentage.toFixed(2)}%</div>
                <div className="w-full bg-amber-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(operator.bonus.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Total: ${operator.bonus.total.toLocaleString()}</span>
                  <span>{operator.bonus.date ? `Última actualización: ${new Date(operator.bonus.date).toLocaleDateString()}` : 'Sin datos recientes'}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">Rendimiento KM</h3>
                    <p className="text-sm text-blue-600">Categoría: {operator.km.category}</p>
                  </div>
                </div>
                <div className="text-4xl font-bold text-blue-700 mb-4">{operator.km.percentage.toFixed(2)}%</div>
                <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(operator.km.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{operator.km.total.toLocaleString()} km</span>
                </div> 
                <span>{operator.km.date ? `Última actualización: ${new Date(operator.km.date).toLocaleDateString()}` : 'Valor máximo'}</span>
              </div>
            </div>

            {/* Weekly Performance Chart */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-primary-600" />
                <span>Rendimiento Semanal</span>
              </h3>
              <div className="flex items-end justify-between space-x-4 h-40 mb-4">
                {operator.weeklyPerformance.map((value, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-400 to-primary-600 rounded-t-lg transition-all duration-500 hover:from-primary-500 hover:to-primary-700 relative group"
                      style={{ height: `${(value / 100) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}%
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {["L", "M", "X", "J", "V", "S", "D"][index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{Math.max(...operator.weeklyPerformance)}%</p>
                  <p className="text-xs text-gray-500">Máximo</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(operator.weeklyPerformance.reduce((a, b) => a + b) / operator.weeklyPerformance.length)}
                    %
                  </p>
                  <p className="text-xs text-gray-500">Promedio</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{Math.min(...operator.weeklyPerformance)}%</p>
                  <p className="text-xs text-gray-500">Mínimo</p>
                </div>
              </div>
            </div>

            {/* Achievements and Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-primary-600" />
                  <span>Información General</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-gray-600 font-medium">Fecha de Ingreso</span>
                    <span className="font-semibold text-gray-900">{operator.joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-gray-600 font-medium">Meta Mensual</span>
                    <span className="font-semibold text-gray-900">${operator.monthlyGoal ? operator.monthlyGoal.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-gray-600 font-medium">Racha Actual</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">${operator.bonus.total.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{operator.monthlyGoal ? `/ $${operator.monthlyGoal.toLocaleString()}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-gray-600 font-medium">Última Actualización</span>
                    <span className="font-semibold text-gray-900">{operator.lastUpdate || new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-y-auto">
      <RankingsHeader />

      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-600">Cargando datos de operadores...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft overflow-hidden relative">
          <div className="flex items-center p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
            <div>
              <p className="font-medium text-amber-800">{error}</p>
              <p className="text-sm text-amber-600 mt-1">Se están mostrando datos de demostración.</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5"></div>
          <div className="relative z-10">
            <CategoryStatsGrid categoryStats={categoryStats} totalOperators={activityFilteredOperators.length} />

            <SearchAndControls
              searchQuery={searchQuery}
              setSearchQuery={updateSearchQuery}
              sortBy={sortBy}
              setSortBy={updateSortBy}
              sortOrder={sortOrder}
              setSortOrder={updateSortOrder}
              viewMode={viewMode}
              setViewMode={updateViewMode}
              availableYears={[2020, 2021, 2022, 2023, 2024, 2025]}
              latestYear={2025}
              latestMonth={6}
              timeFilter="global"
              onTimeFilterChange={handleTimeFilterChange}
              activityFilter={activityFilter}
              setActivityFilter={updateActivityFilter}
              activeCount={activityStats.activeCount}
              inactiveCount={activityStats.inactiveCount}
              totalCount={activityStats.totalCount}
              withNoveltyCount={activityStats.withNoveltyCount}
            />

            <FilterChips
              filter={filter}
              setFilter={setFilter}
              categoryStats={categoryStats}
              totalOperators={activityFilteredOperators.length}
              operators={filteredOperators}
            />

                      {/* Información de paginación */}
          <div className="mb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredOperators.length}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </div>

            {/* Operators Display */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedOperators.map((operator, index) => (
              <OperatorCard
                    key={operator.id}
                operator={{ ...operator, bonus: operator.bonus ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null }, km: operator.km ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null } }}
                rank={startIndex + index + 1}
                    onClick={() => updateSelectedOperator(operator)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">Lista de Operadores</h3>
                  <p className="text-sm text-gray-600 mt-1">Vista detallada de todos los operadores</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {paginatedOperators.map((operator, index) => (
                    <OperatorListItem
                      key={operator.id}
                      operator={{ ...operator, bonus: operator.bonus ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null }, km: operator.km ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null } }}
                      rank={startIndex + index + 1}
                      onClick={() => updateSelectedOperator(operator)}
                      renderWeeklyChart={renderWeeklyChart}
                    />
                  ))}
                </div>
              </div>
            )}

                         {/* Paginación */}
             {totalPages > 1 && (
               <div className="mt-8">
                 <Pagination
                   currentPage={currentPage}
                   totalPages={totalPages}
                   onPageChange={setCurrentPage}
                   itemsPerPage={itemsPerPage}
                   totalItems={filteredOperators.length}
                   startIndex={startIndex}
                   endIndex={endIndex}
                 />
               </div>
             )}
          </div>
        </div>
      ) : (

        <div>
          {/* Título y estado del filtro */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Ranking de Operadores</h1>
            {timeFilter !== "global" && timeFilterValue && (
              <div className="text-sm text-primary-600 font-medium mt-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {timeFilter === "year" ? 
                  `Filtrado por año: ${timeFilterValue}` : 
                  `Filtrado por mes: ${timeFilterValue.split('-')[1]}/${timeFilterValue.split('-')[0]}`
                }
              </div>
            )}
          </div>

          <SearchAndControls
            searchQuery={searchQuery}
            setSearchQuery={updateSearchQuery}
            sortBy={sortBy}
            setSortBy={updateSortBy}
            sortOrder={sortOrder}
            setSortOrder={updateSortOrder}
            viewMode={viewMode}
            setViewMode={updateViewMode}
            timeFilter={timeFilter}
            timeFilterValue={timeFilterValue}
            onTimeFilterChange={handleTimeFilterChange}
            availableYears={availableYears}
            latestYear={latestYear}
            latestMonth={latestMonth}
            activityFilter={activityFilter}
            setActivityFilter={updateActivityFilter}
            isLoading={loading}
            totalResults={filteredOperators.length}
            activeCount={activityStats.activeCount}
            inactiveCount={activityStats.inactiveCount}
            totalCount={activityStats.totalCount}
            withNoveltyCount={activityStats.withNoveltyCount}
            onExport={async () => {
              // Implementar lógica de exportación aquí
              console.log('Exportando datos de operadores...');
              
              // Crear contenido CSV simple
              const headers = ['Ranking', 'Nombre', 'Cédula', 'Cargo', 'Categoría', 'Bonos (%)', 'Kilómetros (%)'];
              const rows = filteredOperators.map((op: any) => [
                op.rank || 'N/A',
                op.name || 'N/A',
                op.cedula || op.document || 'N/A',
                op.position || op.cargo || 'N/A',
                op.category || 'N/A',
                (op.bonus?.percentage ?? 0),
                (op.km?.percentage ?? 0)
              ]);
              
              const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', `operadores_ranking_${new Date().toISOString().split('T')[0]}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />

          <FilterChips
            filter={filter}
            setFilter={setFilter}
            categoryStats={categoryStats}
            totalOperators={activityFilteredOperators.length}
            operators={filteredOperators}
          />

          {/* Información de paginación */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOperators.length)} de {filteredOperators.length} operadores
            </div>
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
          </div>

          {/* Operators Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedOperators.map((operator, index) => (
                <OperatorCard
                  key={operator.id}
                  operator={{ ...operator, bonus: operator.bonus ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null }, km: operator.km ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null } }}
                  rank={startIndex + index + 1}
                  onClick={() => updateSelectedOperator(operator)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Lista de Operadores</h3>
                <p className="text-sm text-gray-600 mt-1">Vista detallada de todos los operadores</p>
              </div>
              <div className="divide-y divide-gray-100">
                {paginatedOperators.map((operator, index) => (
                  <OperatorListItem
                    key={operator.id}
                    operator={{ ...operator, bonus: operator.bonus ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null }, km: operator.km ?? { percentage: 0, total: 0, category: 'Taller Conciencia', trend: 'stable', date: null } }}
                    rank={startIndex + index + 1}
                    onClick={() => updateSelectedOperator(operator)}
                    renderWeeklyChart={renderWeeklyChart}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              {/* Botón Anterior */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Anterior
              </button>

              {/* Números de página */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              {/* Botón Siguiente */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {filteredOperators.length === 0 && !loading && (
        <NoResults 
          onClearFilters={handleClearFilters} 
          searchQuery={searchQuery}
          isFiltered={filter !== "all" || searchQuery !== ""}
          errorMessage={error || undefined}
          latestYear={latestYear}
          latestMonth={latestMonth}
          onLoadLatestData={latestYear && latestMonth ? 
            () => loadOperatorsData("month", `${latestYear}-${latestMonth.toString().padStart(2, '0')}`) : 
            undefined
          }
        />
      )}

      {/* Operator Detail Modal */}
      {selectedOperator && (
        <OperatorDetailModal operator={selectedOperator} onClose={() => updateSelectedOperator(null)} />
      )}
      
      {/* Demo Data Banner */}
      {isUsingDemoData && !loading && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Datos de demostración</p>
              <p className="text-sm text-amber-600 mt-1">
                Se están mostrando datos de demostración porque no se pudieron cargar los datos reales.
                Verifique la conexión a la base de datos y los permisos de acceso.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm rounded transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperatorRankings
