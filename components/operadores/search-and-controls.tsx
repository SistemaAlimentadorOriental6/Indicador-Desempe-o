"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  Search,
  Grid,
  List,
  Download,
  Calendar,
  ChevronDown,
  SortAsc,
  SortDesc,
  X,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Activity,
  AlertCircle,
  Settings,
  Check,
  RotateCcw,
} from "lucide-react"

// Local types
type SortType = "rank" | "bonus" | "km" | "efficiency"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type TimeFilterType = "global" | "year" | "month"
type ActivityFilter = "all" | "active" | "inactive" | "with-novelty"

type TimeFilter = {
  type: TimeFilterType
  value?: string
}

interface SearchAndControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: SortType
  setSortBy: (sort: SortType) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  timeFilter?: TimeFilterType
  timeFilterValue?: string | null
  availableYears?: number[]
  latestYear?: number | null
  latestMonth?: number | null
  onTimeFilterChange?: (filter: TimeFilter) => void
  activityFilter?: ActivityFilter
  setActivityFilter?: (filter: ActivityFilter) => void
  isLoading?: boolean
  totalResults?: number
  onExport?: () => Promise<void>
  activeCount?: number
  inactiveCount?: number
  totalCount?: number
  withNoveltyCount?: number
}

export default function SearchAndControls({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  timeFilter = "global",
  timeFilterValue = null,
  availableYears = [],
  latestYear = null,
  latestMonth = null,
  onTimeFilterChange,
  activityFilter = "all",
  setActivityFilter,
  isLoading = false,
  totalResults = 0,
  onExport,
  activeCount = 0,
  inactiveCount = 0,
  totalCount = 0,
  withNoveltyCount = 0,
}: SearchAndControlsProps) {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Advanced modal states
  const [tempActivityFilters, setTempActivityFilters] = useState<Set<ActivityFilter>>(new Set([activityFilter]))
  const [tempTimeFilter, setTempTimeFilter] = useState<TimeFilterType>(timeFilter)
  const [tempSelectedYear, setTempSelectedYear] = useState<number>(latestYear || new Date().getFullYear())
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number>(
    latestMonth !== null ? latestMonth - 1 : new Date().getMonth(),
  )
  const [tempSortBy, setTempSortBy] = useState<SortType>(sortBy)
  const [tempSortOrder, setTempSortOrder] = useState<SortOrder>(sortOrder)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Generate available years
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2021 + 1 }, (_, i) => currentYear - i)
  
  // Month names in Spanish
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  // Sort options with descriptive labels
  const sortOptions = [
    { value: "rank" as SortType, label: "🏆 Ranking", icon: "🏆" },
    { value: "bonus" as SortType, label: "💰 Bonos", icon: "💰" },
    { value: "km" as SortType, label: "🚗 Kilómetros", icon: "🚗" },
    { value: "efficiency" as SortType, label: "⚡ Eficiencia", icon: "⚡" },
  ]

  // Activity filter options
  const activityOptions = [
    { value: "all" as ActivityFilter, label: "Todos", icon: Users, color: "gray", count: totalCount },
    { value: "active" as ActivityFilter, label: "Activos", icon: UserCheck, color: "emerald", count: activeCount },
    { value: "inactive" as ActivityFilter, label: "Inactivos", icon: UserX, color: "red", count: inactiveCount },
    {
      value: "with-novelty" as ActivityFilter,
      label: "Con Novedad",
      icon: AlertCircle,
      color: "amber",
      count: withNoveltyCount,
    },
  ]
  
  // Mount detection for portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
    }
    
      setSearchLoading(true)
    searchTimeoutRef.current = setTimeout(() => {
        setSearchQuery(query)
        setSearchLoading(false)
      }, 300)
    },
    [setSearchQuery],
  )

  // Handle search input with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    debouncedSearch(query)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    setSearchLoading(false)
  }
  
  // Get active filter display text
  const getFilterDisplayText = () => {
    switch (timeFilter) {
      case "global":
        return "Todos los datos"
      case "year":
        return `Año ${tempSelectedYear}`
      case "month":
        return `${months[tempSelectedMonth]?.substring(0, 3) || "Ene"} ${tempSelectedYear}`
      default:
        return "Filtrar"
    }
  }

  // Get activity filter summary
  const getActivityFilterSummary = () => {
    if (tempActivityFilters.size === 0) return "Ningún filtro"
    if (tempActivityFilters.size === 1) {
      const activeOption = activityOptions.find((opt) => tempActivityFilters.has(opt.value))
      return activeOption ? `${activeOption.label} (${activeOption.count})` : "Filtro"
    }
    return `${tempActivityFilters.size} filtros activos`
  }

  // Handle modal actions
  const handleApplyFilters = () => {
    // Apply activity filters (multiple selection)
    if (setActivityFilter && tempActivityFilters.size > 0) {
      // For now, we'll use the first selected filter for compatibility
      // You can modify this to handle multiple filters in your backend
      const firstFilter = Array.from(tempActivityFilters)[0]
      setActivityFilter(firstFilter)
    }

    // Apply time filter
    if (onTimeFilterChange) {
      if (tempTimeFilter === "global") {
        onTimeFilterChange({ type: "global", value: undefined })
      } else if (tempTimeFilter === "year") {
        onTimeFilterChange({ type: "year", value: String(tempSelectedYear) })
      } else if (tempTimeFilter === "month") {
        const monthStr = (tempSelectedMonth + 1).toString().padStart(2, "0")
        onTimeFilterChange({
          type: "month",
          value: `${tempSelectedYear}-${monthStr}`,
        })
      }
    }

    // Apply sort
    setSortBy(tempSortBy)
    setSortOrder(tempSortOrder)

    setShowAdvancedModal(false)
  }

  const handleResetFilters = () => {
    setTempActivityFilters(new Set(["all"]))
    setTempTimeFilter("global")
    setTempSelectedYear(new Date().getFullYear())
    setTempSelectedMonth(new Date().getMonth())
    setTempSortBy("rank")
    setTempSortOrder("desc")
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (onExport) {
        await onExport()
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("Exporting data...")
      }
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Check if a month is available
  const isMonthAvailable = (year: number, monthIndex: number) => {
    if (Array.isArray(availableYears) && availableYears.length > 0 && !availableYears.includes(year)) return false

    const maxYear = latestYear || new Date().getFullYear()
    const maxMonth = latestMonth !== null ? latestMonth - 1 : new Date().getMonth()

    if (year > maxYear) return false
    if (year === maxYear && monthIndex > maxMonth) return false

    return true
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 border border-green-100 shadow-sm">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2.5 rounded-xl shadow-sm">
            {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
                <Search className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
              <h3 className="text-lg font-bold text-gray-800">Búsqueda y Filtros</h3>
            <p className="text-sm text-gray-600">
                {isLoading ? "Cargando datos..." : `${totalResults} operadores encontrados`}
            </p>
          </div>
        </div>
        
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 bg-white/70 hover:bg-white border border-green-200 rounded-lg transition-colors"
              title={`Cambiar a vista ${viewMode === "grid" ? "lista" : "cuadrícula"}`}
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="p-2 bg-white/70 hover:bg-white border border-green-200 rounded-lg transition-colors disabled:opacity-50"
              title="Exportar datos"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
        </div>
      </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 z-10">
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, cargo o ubicación..."
              defaultValue={searchQuery}
              onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all bg-white font-medium text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
            {(searchQuery || searchLoading) && (
              <button
                onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                disabled={isLoading}
              >
              <X className="w-4 h-4" />
              </button>
            )}
          </div>

        {/* Current Filters Summary */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-green-200">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">{getActivityFilterSummary()}</span>
              </div>

          <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-green-200">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">{getFilterDisplayText()}</span>
                </div>

          <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-green-200">
            <SortAsc className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              {sortOptions.find((opt) => opt.value === sortBy)?.label} ({sortOrder === "asc" ? "↑" : "↓"})
            </span>
            </div>
        </div>

        {/* Advanced Filters Button */}
        <button
          onClick={() => setShowAdvancedModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-3 rounded-xl text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          disabled={isLoading}
        >
          <Settings className="w-5 h-5" />
          <span>Configurar Filtros</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Filters Modal */}
      {showAdvancedModal &&
        isMounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAdvancedModal(false)}
            />

            {/* Modal Content */}
            <div
              ref={modalRef}
              className="relative bg-white rounded-3xl shadow-2xl border border-green-100 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl">Filtros Avanzados</h2>
                    <p className="text-white/80 text-sm">Personaliza tu búsqueda y visualización</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
            </div>
            
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Filters - Enhanced Multiple Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                        <Users className="w-5 h-5 text-white" />
              </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Estado de Actividad</h3>
                        <p className="text-sm text-gray-500">Selecciona uno o varios estados</p>
                      </div>
                    </div>

                    {/* Selected Filters Summary */}
                    {tempActivityFilters.size > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">
                            {tempActivityFilters.size} filtro{tempActivityFilters.size !== 1 ? "s" : ""} seleccionado
                            {tempActivityFilters.size !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(tempActivityFilters).map((filter) => {
                            const option = activityOptions.find((opt) => opt.value === filter)
                            if (!option) return null
                            const IconComponent = option.icon

                            return (
                              <div
                                key={filter}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border-2 bg-${option.color}-100 border-${option.color}-300 text-${option.color}-800`}
                              >
                                <IconComponent className="w-3 h-3" />
                                <span>{option.label}</span>
                                <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                  {option.count}
                                </span>
                                <button
                                  onClick={() => {
                                    const newFilters = new Set(tempActivityFilters)
                                    newFilters.delete(filter)
                                    setTempActivityFilters(newFilters)
                                  }}
                                  className="hover:bg-white/30 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                </div>
                            )
                          })}
              </div>
                </div>
                    )}

                    {/* Activity Statistics - Enhanced */}
                    <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-800">Distribución de Operadores</h4>
                        <div className="bg-white px-3 py-1 rounded-full border border-slate-300">
                          <span className="text-sm font-bold text-slate-700">{totalCount} total</span>
                </div>
                      </div>

                      <div className="space-y-4">
                        {activityOptions.map((option) => {
                          const percentage = totalCount > 0 ? Math.round((option.count / totalCount) * 100) : 0
                          const IconComponent = option.icon
                          const isSelected = tempActivityFilters.has(option.value)

                          return (
                            <div key={option.value} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg bg-${option.color}-100 border border-${option.color}-200`}
                                  >
                                    <IconComponent className={`w-4 h-4 text-${option.color}-600`} />
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-800">{option.label}</span>
                                    <div className="text-xs text-gray-500">{option.count} operadores</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-800">{percentage}%</div>
              </div>
            </div>
            
                              <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`bg-gradient-to-r from-${option.color}-400 to-${option.color}-600 h-3 rounded-full transition-all duration-700 ease-out ${
                                      isSelected ? "shadow-lg" : ""
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                {isSelected && (
                                  <div className="absolute inset-0 bg-white/20 rounded-full border-2 border-white shadow-lg" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Activity Filter Options - Enhanced Multiple Selection */}
            <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Seleccionar estados:</span>
                        <div className="flex gap-2">
              <button
                            onClick={() => setTempActivityFilters(new Set(activityOptions.map((opt) => opt.value)))}
                            className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors font-medium"
                          >
                            Todos
              </button>
              <button
                            onClick={() => setTempActivityFilters(new Set())}
                            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors font-medium"
                          >
                            Ninguno
                          </button>
                </div>
                </div>

                      {activityOptions.map((option) => {
                        const IconComponent = option.icon
                        const isSelected = tempActivityFilters.has(option.value)

                        return (
              <button
                            key={option.value}
                            onClick={() => {
                              const newFilters = new Set(tempActivityFilters)
                              if (isSelected) {
                                newFilters.delete(option.value)
                              } else {
                                newFilters.add(option.value)
                              }
                              setTempActivityFilters(newFilters)
                            }}
                            className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                              isSelected
                                ? `bg-gradient-to-r from-${option.color}-500 to-${option.color}-600 text-white shadow-xl border-2 border-${option.color}-400`
                                : `bg-white hover:bg-${option.color}-50 text-gray-700 hover:text-${option.color}-700 border-2 border-gray-200 hover:border-${option.color}-300 shadow-sm hover:shadow-md`
                            }`}
                          >
                            <div className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`p-3 rounded-xl transition-all duration-300 ${
                                    isSelected
                                      ? "bg-white/20 backdrop-blur-sm"
                                      : `bg-${option.color}-100 group-hover:bg-${option.color}-200`
                                  }`}
                                >
                                  <IconComponent
                                    className={`w-5 h-5 transition-all duration-300 ${
                                      isSelected ? "text-white" : `text-${option.color}-600`
                                    }`}
                                  />
                </div>
                                <div className="text-left">
                                  <div className="font-semibold text-base">{option.label}</div>
                                  <div
                                    className={`text-sm transition-all duration-300 ${
                                      isSelected ? "text-white/80" : "text-gray-500"
                                    }`}
                                  >
                                    {option.count} operadores disponibles
                </div>
                                </div>
            </div>

                              <div className="flex items-center gap-3">
                                <div
                                  className={`px-3 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${
                                    isSelected
                                      ? "bg-white/20 text-white backdrop-blur-sm"
                                      : `bg-${option.color}-100 text-${option.color}-800`
                                  }`}
                                >
                                  {option.count}
                </div>

                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                    isSelected
                                      ? "bg-white border-white"
                                      : `border-gray-300 group-hover:border-${option.color}-400`
                                  }`}
                                >
                                  {isSelected && (
                                    <Check
                                      className={`w-4 h-4 text-${option.color}-600 animate-in zoom-in-50 duration-200`}
                                    />
                                  )}
              </div>
            </div>
          </div>

                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                            )}
                          </button>
                        )
                      })}
            </div>
            
                    {/* Quick Selection Presets */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <h5 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Selecciones Rápidas
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
              <button 
                          onClick={() => setTempActivityFilters(new Set(["active", "with-novelty"]))}
                          className="px-3 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-sm font-medium text-amber-700 transition-colors"
                        >
                          🟢 Operativos
              </button>
                        <button
                          onClick={() => setTempActivityFilters(new Set(["inactive"]))}
                          className="px-3 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-sm font-medium text-amber-700 transition-colors"
                        >
                          🔴 No Operativos
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Time and Sort Filters */}
                  <div className="space-y-6">
                    {/* Time Filters - Enhanced */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Período de Tiempo</h3>
                          <p className="text-sm text-gray-500">Selecciona el rango temporal</p>
                      </div>
                    </div>
                    
                      {/* Time Filter Summary */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-800">Período Seleccionado</span>
                        </div>
                        <div className="text-lg font-bold text-purple-900">
                          {tempTimeFilter === "global" && "📊 Todos los datos históricos"}
                          {tempTimeFilter === "year" && `📅 Año ${tempSelectedYear}`}
                          {tempTimeFilter === "month" && `🗓️ ${months[tempSelectedMonth]} ${tempSelectedYear}`}
                        </div>
                        <div className="text-sm text-purple-700 mt-1">
                          {tempTimeFilter === "global" && "Incluye toda la información disponible"}
                          {tempTimeFilter === "year" &&
                            `Datos del 1 de enero al 31 de diciembre de ${tempSelectedYear}`}
                          {tempTimeFilter === "month" &&
                            `Datos del mes completo de ${months[tempSelectedMonth].toLowerCase()}`}
                        </div>
                      </div>

                      {/* Quick Time Presets */}
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Períodos Rápidos
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                              setTempTimeFilter("month")
                              setTempSelectedYear(new Date().getFullYear())
                              setTempSelectedMonth(new Date().getMonth())
                            }}
                            className="px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span>📅</span>
                            Mes Actual
                          </button>
                          <button
                            onClick={() => {
                              setTempTimeFilter("year")
                              setTempSelectedYear(new Date().getFullYear())
                            }}
                            className="px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span>🗓️</span>
                            Año Actual
                          </button>
                          <button
                            onClick={() => {
                              const lastMonth = new Date()
                              lastMonth.setMonth(lastMonth.getMonth() - 1)
                              setTempTimeFilter("month")
                              setTempSelectedYear(lastMonth.getFullYear())
                              setTempSelectedMonth(lastMonth.getMonth())
                            }}
                            className="px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span>⏮️</span>
                            Mes Anterior
                          </button>
                          <button
                            onClick={() => {
                              setTempTimeFilter("year")
                              setTempSelectedYear(new Date().getFullYear() - 1)
                            }}
                            className="px-3 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span>⏪</span>
                            Año Anterior
                          </button>
                        </div>
                      </div>

                      {/* Time Filter Options - Enhanced */}
                      <div className="space-y-3">
                        {/* Global */}
                        <button
                          onClick={() => setTempTimeFilter("global")}
                          className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                            tempTimeFilter === "global"
                              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl border-2 border-purple-400"
                              : "bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border-2 border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                  tempTimeFilter === "global"
                                    ? "bg-white/20 backdrop-blur-sm"
                                    : "bg-purple-100 group-hover:bg-purple-200"
                                }`}
                              >
                                <span className="text-2xl">🌍</span>
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-base">Todos los datos</div>
                                <div
                                  className={`text-sm transition-all duration-300 ${
                                    tempTimeFilter === "global" ? "text-white/80" : "text-gray-500"
                                  }`}
                                >
                                  Ver información histórica completa
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`px-3 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${
                                  tempTimeFilter === "global"
                                    ? "bg-white/20 text-white backdrop-blur-sm"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                Completo
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  tempTimeFilter === "global"
                                    ? "bg-white border-white"
                                    : "border-gray-300 group-hover:border-purple-400"
                                }`}
                              >
                                {tempTimeFilter === "global" && (
                                  <Check className="w-4 h-4 text-purple-600 animate-in zoom-in-50 duration-200" />
                                )}
                              </div>
                            </div>
                        </div>
                    </button>
                    
                        {/* Year */}
                      <button 
                          onClick={() => setTempTimeFilter("year")}
                          className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                            tempTimeFilter === "year"
                              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl border-2 border-purple-400"
                              : "bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border-2 border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                  tempTimeFilter === "year"
                                    ? "bg-white/20 backdrop-blur-sm"
                                    : "bg-purple-100 group-hover:bg-purple-200"
                                }`}
                              >
                                <span className="text-2xl">📅</span>
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-base">Por año</div>
                                <div
                                  className={`text-sm transition-all duration-300 ${
                                    tempTimeFilter === "year" ? "text-white/80" : "text-gray-500"
                                  }`}
                                >
                                  Filtrar por año específico
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`px-3 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${
                                  tempTimeFilter === "year"
                                    ? "bg-white/20 text-white backdrop-blur-sm"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {tempSelectedYear}
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  tempTimeFilter === "year"
                                    ? "bg-white border-white"
                                    : "border-gray-300 group-hover:border-purple-400"
                                }`}
                              >
                                {tempTimeFilter === "year" && (
                                  <Check className="w-4 h-4 text-purple-600 animate-in zoom-in-50 duration-200" />
                                )}
                              </div>
                            </div>
                          </div>
                      </button>
                      
                        {tempTimeFilter === "year" && (
                          <div className="ml-4 bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                            <p className="text-sm font-medium text-gray-700 mb-3">Seleccionar año:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {years.map((year) => (
                            <button
                              key={year}
                                  onClick={() => setTempSelectedYear(year)}
                                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium transform hover:scale-105 ${
                                    tempSelectedYear === year
                                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                                      : "bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 shadow-sm"
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                    </div>
                        )}
                    
                        {/* Month */}
                      <button 
                          onClick={() => setTempTimeFilter("month")}
                          className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                            tempTimeFilter === "month"
                              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl border-2 border-purple-400"
                              : "bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border-2 border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                  tempTimeFilter === "month"
                                    ? "bg-white/20 backdrop-blur-sm"
                                    : "bg-purple-100 group-hover:bg-purple-200"
                                }`}
                              >
                                <span className="text-2xl">🗓️</span>
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-base">Por mes</div>
                                <div
                                  className={`text-sm transition-all duration-300 ${
                                    tempTimeFilter === "month" ? "text-white/80" : "text-gray-500"
                                  }`}
                                >
                                  Filtrar por mes específico
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`px-3 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${
                                  tempTimeFilter === "month"
                                    ? "bg-white/20 text-white backdrop-blur-sm"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {months[tempSelectedMonth]?.substring(0, 3)} {tempSelectedYear}
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  tempTimeFilter === "month"
                                    ? "bg-white border-white"
                                    : "border-gray-300 group-hover:border-purple-400"
                                }`}
                              >
                                {tempTimeFilter === "month" && (
                                  <Check className="w-4 h-4 text-purple-600 animate-in zoom-in-50 duration-200" />
                                )}
                              </div>
                            </div>
                          </div>
                      </button>
                      
                        {tempTimeFilter === "month" && (
                          <div className="ml-4 bg-white rounded-xl p-4 border border-purple-200 shadow-sm space-y-4">
                            {/* Year selector */}
                          <div>
                              <p className="text-sm font-medium text-gray-700 mb-3">Año:</p>
                              <div className="grid grid-cols-4 gap-2">
                                {years.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setTempSelectedYear(year)}
                                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium transform hover:scale-105 ${
                                      tempSelectedYear === year
                                        ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                                        : "bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 shadow-sm"
                                  }`}
                                >
                                  {year}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Month selector */}
                          <div>
                              <p className="text-sm font-medium text-gray-700 mb-3">Mes:</p>
                              <div className="grid grid-cols-3 gap-2">
                              {months.map((month, idx) => {
                                  const available = isMonthAvailable(tempSelectedYear, idx)
                                  if (!available) return null
                                
                                return (
                                  <button
                                    key={month}
                                      onClick={() => setTempSelectedMonth(idx)}
                                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium transform hover:scale-105 ${
                                        tempSelectedMonth === idx
                                          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                                          : "bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 shadow-sm"
                                    }`}
                                  >
                                    {month.substring(0, 3)}
                                  </button>
                                  )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Sort Options - Enhanced */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-xl shadow-lg">
                          <SortAsc className="w-5 h-5 text-white" />
                </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Ordenamiento</h3>
                          <p className="text-sm text-gray-500">Configura cómo ordenar los resultados</p>
                        </div>
                      </div>

                      {/* Sort Summary */}
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          {tempSortOrder === "asc" ? (
                            <SortAsc className="w-4 h-4 text-orange-600" />
                          ) : (
                            <SortDesc className="w-4 h-4 text-orange-600" />
                          )}
                          <span className="text-sm font-semibold text-orange-800">Ordenamiento Actual</span>
                        </div>
                        <div className="text-lg font-bold text-orange-900">
                          {sortOptions.find((opt) => opt.value === tempSortBy)?.icon}{" "}
                          {sortOptions.find((opt) => opt.value === tempSortBy)?.label.replace(/^[🏆💰🚗⚡]\s/u, "")}
                        </div>
                        <div className="text-sm text-orange-700 mt-1">
                          {tempSortOrder === "asc" ? "📈 De menor a mayor" : "📉 De mayor a menor"}
            </div>
          </div>

                      {/* Quick Sort Presets */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                        <h5 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Ordenamientos Rápidos
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setTempSortBy("rank")
                              setTempSortOrder("asc")
                            }}
                            className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 transition-colors flex items-center gap-2"
                          >
                            <span>🏆</span>
                            Mejor Ranking
                          </button>
                          <button
                            onClick={() => {
                              setTempSortBy("bonus")
                              setTempSortOrder("desc")
                            }}
                            className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 transition-colors flex items-center gap-2"
                          >
                            <span>💰</span>
                            Más Bonos
                          </button>
                          <button
                            onClick={() => {
                              setTempSortBy("km")
                              setTempSortOrder("desc")
                            }}
                            className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 transition-colors flex items-center gap-2"
                          >
                            <span>🚗</span>
                            Más KM
                          </button>
                          <button
                            onClick={() => {
                              setTempSortBy("efficiency")
                              setTempSortOrder("desc")
                            }}
                            className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 transition-colors flex items-center gap-2"
                          >
                            <span>⚡</span>
                            Más Eficiente
                          </button>
                        </div>
            </div>
            
                      {/* Sort By Options - Enhanced */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Ordenar por:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {sortOptions.map((option) => {
                            const isSelected = tempSortBy === option.value

                            return (
                              <button
                                key={option.value}
                                onClick={() => setTempSortBy(option.value)}
                                className={`group relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                                  isSelected
                                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl border-2 border-orange-400"
                                    : "bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border-2 border-gray-200 hover:border-orange-300 shadow-sm hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center gap-3 p-3">
                                  <div
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                      isSelected
                                        ? "bg-white/20 backdrop-blur-sm"
                                        : "bg-orange-100 group-hover:bg-orange-200"
                                    }`}
                                  >
                                    <span className="text-lg">{option.icon}</span>
                                  </div>
                                  <div className="text-left flex-1">
                                    <div className="font-semibold text-sm">
                                      {option.label.replace(/^[🏆💰🚗⚡]\s/u, "")}
                                    </div>
                                  </div>
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                      isSelected
                                        ? "bg-white border-white"
                                        : "border-gray-300 group-hover:border-orange-400"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-orange-600 animate-in zoom-in-50 duration-200" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Sort Order Options - Enhanced */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Orden:</p>
                        <div className="grid grid-cols-2 gap-3">
              <button
                            onClick={() => setTempSortOrder("asc")}
                            className={`group relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                              tempSortOrder === "asc"
                                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl border-2 border-orange-400"
                                : "bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border-2 border-gray-200 hover:border-orange-300 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <div
                                className={`p-2 rounded-lg transition-all duration-300 ${
                                  tempSortOrder === "asc"
                                    ? "bg-white/20 backdrop-blur-sm"
                                    : "bg-orange-100 group-hover:bg-orange-200"
                                }`}
                              >
                                <SortAsc className="w-4 h-4" />
                              </div>
                              <div className="text-left flex-1">
                                <div className="font-semibold text-sm">Ascendente</div>
                                <div
                                  className={`text-xs transition-all duration-300 ${
                                    tempSortOrder === "asc" ? "text-white/80" : "text-gray-500"
                                  }`}
                                >
                                  📈 Menor a mayor
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  tempSortOrder === "asc"
                                    ? "bg-white border-white"
                                    : "border-gray-300 group-hover:border-orange-400"
                                }`}
                              >
                                {tempSortOrder === "asc" && (
                                  <Check className="w-3 h-3 text-orange-600 animate-in zoom-in-50 duration-200" />
                                )}
                              </div>
                            </div>
              </button>

                          <button
                            onClick={() => setTempSortOrder("desc")}
                            className={`group relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                              tempSortOrder === "desc"
                                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl border-2 border-orange-400"
                                : "bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border-2 border-gray-200 hover:border-orange-300 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <div
                                className={`p-2 rounded-lg transition-all duration-300 ${
                                  tempSortOrder === "desc"
                                    ? "bg-white/20 backdrop-blur-sm"
                                    : "bg-orange-100 group-hover:bg-orange-200"
                                }`}
                              >
                                <SortDesc className="w-4 h-4" />
                              </div>
                              <div className="text-left flex-1">
                                <div className="font-semibold text-sm">Descendente</div>
                                <div
                                  className={`text-xs transition-all duration-300 ${
                                    tempSortOrder === "desc" ? "text-white/80" : "text-gray-500"
                                  }`}
                                >
                                  📉 Mayor a menor
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  tempSortOrder === "desc"
                                    ? "bg-white border-white"
                                    : "border-gray-300 group-hover:border-orange-400"
                                }`}
                              >
                                {tempSortOrder === "desc" && (
                                  <Check className="w-3 h-3 text-orange-600 animate-in zoom-in-50 duration-200" />
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
            </div>
          </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-t border-gray-200 mt-6">
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restablecer</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAdvancedModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-2 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aplicar Filtros</span>
                    </button>
        </div>
      </div>
    </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
