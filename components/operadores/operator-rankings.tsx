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
import { calculateBonusValue } from "@/utils/bonus-config"
import { RankingsHeader } from "./rankings-header"
import { CategoryStatsGrid } from "./category-stats"
import SearchAndControls from "./search-and-controls"
import { FilterChips } from "./filter-chips"
import { OperatorGridCard } from "./operator-grid-card"
import { OperatorListItem } from "./operator-list-item"
import { OperatorDetailModal } from "./operator-detail-modal"
import { WeeklyChart } from "./weekly-chart"
import { NoResults } from "./no-results"
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
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(false)
  
  // Estados para el filtro de tiempo
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("global")
  const [timeFilterValue, setTimeFilterValue] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [latestYear, setLatestYear] = useState<number | null>(null)
  const [latestMonth, setLatestMonth] = useState<number | null>(null)
  const [isInitialFilterSet, setIsInitialFilterSet] = useState<boolean>(false)

  // Actualizar los bonos de los operadores según el año seleccionado
  const updateOperatorsBonusByYear = (year: number) => {
    // Solo actualizar si hay operadores disponibles
    if (!operators || operators.length === 0) return;
    
    console.log(`Actualizando bonos para el año ${year}`);
    
    // Crear una copia de los operadores para no mutar el estado directamente
    const updatedOperators = operators.map(operator => {
      // Calcular el nuevo valor del bono según el año y el porcentaje de eficiencia
      const bonusPercentage = operator.bonus?.percentage || 0;
      const newBonusValue = calculateBonusValue(year, bonusPercentage);
      
      // Crear una copia del operador con el nuevo valor de bono
      return {
        ...operator,
        bonus: {
          ...operator.bonus,
          total: newBonusValue,
          // La categoría y el porcentaje se mantienen igual
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
          (op.km.total === 142000 || op.km.total_programado === 142000 || op.km.total_ejecutado === 142000) &&
          (filterType === 'year' || filterType === 'month')
        );
        
        // Si se detectan valores predeterminados en filtros específicos, establecer valores a 0
        const kmValues = hasDefaultKmValues ? {
          total: 0,
          total_programado: 0,
          total_ejecutado: 0,
          percentage: 0
        } : {
          total: typeof op.km.total === 'string' ? parseFloat(op.km.total || '0') : (op.km.total || 0),
          total_programado: typeof op.km.total_programado === 'string' ? parseFloat(op.km.total_programado || '0') : (op.km.total_programado || 0),
          total_ejecutado: typeof op.km.total_ejecutado === 'string' ? parseFloat(op.km.total_ejecutado || '0') : (op.km.total_ejecutado || 0),
          percentage: typeof op.km.percentage === 'string' ? parseFloat(op.km.percentage || '0') : (op.km.percentage || 0)
        };
        
        return {
          ...op,
          km: {
            ...op.km,
            ...kmValues
          },
          bonus: {
            ...op.bonus,
            total: typeof op.bonus.total === 'string' ? parseFloat(op.bonus.total || '0') : (op.bonus.total || 0),
            percentage: typeof op.bonus.percentage === 'string' ? parseFloat(op.bonus.percentage || '0') : (op.bonus.percentage || 0)
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
      setTimeFilterValue(filterValue);
      
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

  // Filtrar y ordenar operadores según los criterios actuales
  const filteredOperators = operators.length > 0 ? filterAndSortOperators(
    operators,
    filter,
    searchQuery,
    sortBy,
    sortOrder
  ) : [];
  
  // Efecto para manejar la búsqueda sin recargar datos completos
  useEffect(() => {
    // Solo aplicar el filtro local sin recargar datos del servidor
    // La función filterAndSortOperators ya maneja esto
    console.log(`Aplicando búsqueda: "${searchQuery}" a ${operators.length} operadores`);
  }, [searchQuery]);

  const categoryStats = calculateCategoryStats(operators)

  const handleClearFilters = () => {
    setFilter("all")
    setSearchQuery("")
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
    <div className="space-y-8">
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
            <CategoryStatsGrid categoryStats={categoryStats} totalOperators={operators.length} />

            <SearchAndControls
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              viewMode={viewMode}
              setViewMode={setViewMode}
              availableYears={[2020, 2021, 2022, 2023, 2024, 2025]}
              latestYear={2025}
              latestMonth={6}
              timeFilter="global"
              onTimeFilterChange={handleTimeFilterChange}
            />

            <FilterChips
              filter={filter}
              setFilter={setFilter}
              categoryStats={categoryStats}
              totalOperators={operators.length}
              operators={filteredOperators}
            />

            {/* Operators Display */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOperators.map((operator, index) => (
                  <OperatorGridCard
                    key={operator.id}
                    operator={operator}
                    rank={index + 1}
                    onClick={() => setSelectedOperator(operator)}
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
                  {filteredOperators.map((operator, index) => (
                    <OperatorListItem
                      key={operator.id}
                      operator={operator}
                      rank={index + 1}
                      onClick={() => setSelectedOperator(operator)}
                      renderWeeklyChart={renderWeeklyChart}
                    />
                  ))}
                </div>
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
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            timeFilter={{
              type: timeFilter,
              value: timeFilterValue
            }}
            onTimeFilterChange={handleTimeFilterChange}
            availableYears={availableYears}
            latestYear={latestYear}
            latestMonth={latestMonth}
          />

          <FilterChips
            filter={filter}
            setFilter={setFilter}
            categoryStats={categoryStats}
            totalOperators={operators.length}
            operators={filteredOperators}
          />

          {/* Operators Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOperators.map((operator, index) => (
                <OperatorGridCard
                  key={operator.id}
                  operator={operator}
                  rank={index + 1}
                  onClick={() => setSelectedOperator(operator)}
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
                {filteredOperators.map((operator, index) => (
                  <OperatorListItem
                    key={operator.id}
                    operator={operator}
                    rank={index + 1}
                    onClick={() => setSelectedOperator(operator)}
                    renderWeeklyChart={renderWeeklyChart}
                  />
                ))}
              </div>
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
        <OperatorDetailModal operator={selectedOperator} onClose={() => setSelectedOperator(null)} />
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
