"use client"

import React, { useState, useEffect, useRef, useCallback, memo } from "react"
import { createPortal } from "react-dom"
import {
  Search,
  Grid,
  List,
  Download,
  Calendar,
  ChevronDown,
  X,
  Loader2,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  Settings,
  Check,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Tipos locales
type SortType = "rank" | "bonus" | "km" | "efficiency"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type TimeFilterType = "global" | "year" | "month"
type ActivityFilter = "all" | "active" | "inactive" | "with-novelty"
type TimeFilter = { type: TimeFilterType; value?: string }

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

// Constantes
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MESES_COMPLETOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

const SORT_OPTIONS = [
  { value: "rank" as SortType, label: "Ranking" },
  { value: "bonus" as SortType, label: "Bonos" },
  { value: "km" as SortType, label: "Kilómetros" },
  { value: "efficiency" as SortType, label: "Eficiencia" },
]

const ACTIVITY_OPTIONS = [
  { value: "all" as ActivityFilter, label: "Todos", icon: Users },
  { value: "active" as ActivityFilter, label: "Activos", icon: UserCheck },
  { value: "inactive" as ActivityFilter, label: "Inactivos", icon: UserX },
  { value: "with-novelty" as ActivityFilter, label: "Con Novedad", icon: AlertCircle },
]

function SearchAndControlsBase({
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
  const [showModal, setShowModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Estados temporales del modal
  const [tempActivityFilter, setTempActivityFilter] = useState<ActivityFilter>(activityFilter)
  const [tempTimeFilter, setTempTimeFilter] = useState<TimeFilterType>(timeFilter)
  const [tempSelectedYear, setTempSelectedYear] = useState<number>(latestYear || new Date().getFullYear())
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number>(latestMonth !== null ? latestMonth - 1 : new Date().getMonth())
  const [tempSortBy, setTempSortBy] = useState<SortType>(sortBy)
  const [tempSortOrder, setTempSortOrder] = useState<SortOrder>(sortOrder)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2021 + 1 }, (_, i) => currentYear - i)

  // Conteos para opciones de actividad
  const activityCounts: Record<ActivityFilter, number> = {
    all: totalCount,
    active: activeCount,
    inactive: inactiveCount,
    "with-novelty": withNoveltyCount,
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Búsqueda con debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setSearchQuery(query), 300)
  }, [setSearchQuery])

  const clearSearch = () => {
    setSearchQuery("")
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
  }

  // Texto del filtro de tiempo
  const getTimeFilterText = () => {
    if (timeFilter === "year") return `Año ${tempSelectedYear}`
    if (timeFilter === "month") return `${MESES[tempSelectedMonth]} ${tempSelectedYear}`
    return "Todos"
  }

  // Aplicar filtros
  const handleApplyFilters = () => {
    if (setActivityFilter) setActivityFilter(tempActivityFilter)

    if (onTimeFilterChange) {
      if (tempTimeFilter === "global") {
        onTimeFilterChange({ type: "global" })
      } else if (tempTimeFilter === "year") {
        onTimeFilterChange({ type: "year", value: String(tempSelectedYear) })
      } else if (tempTimeFilter === "month") {
        const monthStr = (tempSelectedMonth + 1).toString().padStart(2, "0")
        onTimeFilterChange({ type: "month", value: `${tempSelectedYear}-${monthStr}` })
      }
    }

    setSortBy(tempSortBy)
    setSortOrder(tempSortOrder)
    setShowModal(false)
  }

  // Resetear filtros
  const handleResetFilters = () => {
    setTempActivityFilter("all")
    setTempTimeFilter("global")
    setTempSelectedYear(currentYear)
    setTempSelectedMonth(new Date().getMonth())
    setTempSortBy("rank")
    setTempSortOrder("desc")
  }

  // Exportar
  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (onExport) await onExport()
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  return (
    <>
      {/* Panel principal */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Búsqueda</h3>
              <p className="text-sm text-gray-500">
                {isLoading ? "Cargando..." : `${totalResults} resultados`}
              </p>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              title={viewMode === "grid" ? "Vista lista" : "Vista cuadrícula"}
            >
              {viewMode === "grid" ? <List className="w-4 h-4 text-gray-600" /> : <Grid className="w-4 h-4 text-gray-600" />}
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Exportar"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o cargo..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 text-sm"
            disabled={isLoading}
          />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros activos */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Filtros:</span>

          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
            <Users className="w-3 h-3" />
            {ACTIVITY_OPTIONS.find(o => o.value === activityFilter)?.label}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
            <Calendar className="w-3 h-3" />
            {getTimeFilterText()}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
            <SlidersHorizontal className="w-3 h-3" />
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label} {sortOrder === "asc" ? "↑" : "↓"}
          </div>
        </div>

        {/* Botón de filtros avanzados */}
        <Button
          onClick={() => setShowModal(true)}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurar Filtros
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Modal de filtros */}
      {showModal && isMounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Filtros Avanzados</h2>
                  <p className="text-sm text-gray-500">Personaliza tu búsqueda</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Filtro de actividad */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  Estado de Actividad
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const isSelected = tempActivityFilter === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTempActivityFilter(option.value)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {activityCounts[option.value]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filtro de tiempo */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Período de Tiempo
                </h3>

                {/* Tipo de filtro */}
                <div className="flex gap-2 mb-3">
                  {[
                    { value: "global", label: "Todos" },
                    { value: "year", label: "Año" },
                    { value: "month", label: "Mes" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTempTimeFilter(opt.value as TimeFilterType)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tempTimeFilter === opt.value
                          ? "bg-green-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Selectores de año/mes */}
                {tempTimeFilter !== "global" && (
                  <div className="flex gap-3">
                    <select
                      value={tempSelectedYear}
                      onChange={(e) => setTempSelectedYear(Number(e.target.value))}
                      className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    {tempTimeFilter === "month" && (
                      <select
                        value={tempSelectedMonth}
                        onChange={(e) => setTempSelectedMonth(Number(e.target.value))}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                      >
                        {MESES_COMPLETOS.map((mes, index) => (
                          <option key={index} value={index}>{mes}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Ordenamiento */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-green-600" />
                  Ordenar Por
                </h3>
                <div className="flex gap-2 mb-3">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTempSortBy(opt.value)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tempSortBy === opt.value
                          ? "bg-green-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTempSortOrder("desc")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tempSortOrder === "desc"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Mayor a Menor ↓
                  </button>
                  <button
                    onClick={() => setTempSortOrder("asc")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tempSortOrder === "asc"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Menor a Mayor ↑
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Restablecer
              </button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApplyFilters} className="bg-green-500 hover:bg-green-600">
                  <Check className="w-4 h-4 mr-2" />
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default memo(SearchAndControlsBase)
