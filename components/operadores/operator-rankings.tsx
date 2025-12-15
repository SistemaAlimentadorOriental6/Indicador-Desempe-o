"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Loader2, AlertTriangle, Calendar, RefreshCw } from "lucide-react"
import { calculateCategoryStats, filterAndSortOperators } from "@/utils/operator-utils"
import { fetchRealOperatorsData } from "@/utils/ranking-utils"
import { RankingsHeader } from "./rankings-header"
import { CategoryStatsGrid } from "./category-stats"
import SearchAndControls from "./search-and-controls"
import { FilterChips } from "./filter-chips"
import { OperatorCard } from "./operator-grid-card"
import { OperatorListItem } from "./operator-list-item"
import { OperatorDetailModal } from "./operator-detail-modal"
import { WeeklyChart } from "./weekly-chart"
import { NoResults } from "./no-results"
import { Button } from "@/components/ui/button"
import type { Operator, FilterType, SortType, SortOrder, ViewMode, TimeFilterType, TimeFilter } from "@/types/operator-types"

// Constantes
const ITEMS_POR_PAGINA = 50

// Estado de carga
const EstadoCarga = memo(() => (
  <div className="bg-white rounded-xl p-8 border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
    <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
    <p className="text-gray-600 font-medium">Cargando datos de operadores...</p>
  </div>
))
EstadoCarga.displayName = "EstadoCarga"

// Banner de error
const BannerError = memo(({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-amber-800">{mensaje}</p>
        <p className="text-sm text-amber-600 mt-1">Se están mostrando datos de demostración.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReintentar} className="text-amber-700">
        <RefreshCw className="w-4 h-4 mr-1" />
        Reintentar
      </Button>
    </div>
  </div>
))
BannerError.displayName = "BannerError"

// Paginación simple
const Paginacion = memo(({
  paginaActual,
  totalPaginas,
  onCambiarPagina
}: {
  paginaActual: number
  totalPaginas: number
  onCambiarPagina: (pagina: number) => void
}) => {
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCambiarPagina(Math.max(1, paginaActual - 1))}
        disabled={paginaActual === 1}
      >
        Anterior
      </Button>

      <div className="flex gap-1">
        {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
          let numPagina: number
          if (totalPaginas <= 5) {
            numPagina = i + 1
          } else if (paginaActual <= 3) {
            numPagina = i + 1
          } else if (paginaActual >= totalPaginas - 2) {
            numPagina = totalPaginas - 4 + i
          } else {
            numPagina = paginaActual - 2 + i
          }

          return (
            <button
              key={numPagina}
              onClick={() => onCambiarPagina(numPagina)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${paginaActual === numPagina
                ? "bg-green-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
            >
              {numPagina}
            </button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onCambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
        disabled={paginaActual === totalPaginas}
      >
        Siguiente
      </Button>
    </div>
  )
})
Paginacion.displayName = "Paginacion"

// Componente principal
function OperatorRankingsBase() {
  // Estados principales
  const [operadores, setOperadores] = useState<Operator[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usandoDatosDemo, setUsandoDatosDemo] = useState(false)

  // Estados de filtros
  const [filtroCategoria, setFiltroCategoria] = useState<FilterType>("all")
  const [busqueda, setBusqueda] = useState("")
  const [ordenarPor, setOrdenarPor] = useState<SortType>("rank")
  const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("desc")
  const [modoVista, setModoVista] = useState<ViewMode>("grid")
  const [filtroActividad, setFiltroActividad] = useState<"all" | "active" | "inactive" | "with-novelty">("all")
  const [filtroTiempo, setFiltroTiempo] = useState<TimeFilterType>("global")
  const [valorFiltroTiempo, setValorFiltroTiempo] = useState<string | null>(null)

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1)

  // Estados de información de filtros disponibles
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([])
  const [ultimoAnio, setUltimoAnio] = useState<number | null>(null)
  const [ultimoMes, setUltimoMes] = useState<number | null>(null)

  // Estado de operador seleccionado
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<Operator | null>(null)

  // Cargar datos
  const cargarDatos = useCallback(async (tipoFiltro: TimeFilterType = "global", valorFiltro: string | number | null = null) => {
    try {
      setCargando(true)
      setError(null)

      const resultado = await fetchRealOperatorsData(tipoFiltro, valorFiltro)

      if (resultado.filterInfo) {
        if (resultado.filterInfo.availableYears?.length > 0) {
          setAniosDisponibles(resultado.filterInfo.availableYears)
        }
        if (resultado.filterInfo.latestYear) {
          setUltimoAnio(resultado.filterInfo.latestYear)
        }
        if (resultado.filterInfo.latestMonth) {
          setUltimoMes(resultado.filterInfo.latestMonth)
        }
      }

      if (!resultado.operators || resultado.operators.length === 0) {
        setError(resultado.message || "No hay datos disponibles")
        setUsandoDatosDemo(true)
        setCargando(false)
        return
      }

      // Procesar operadores
      const operadoresProcesados = resultado.operators.map(op => ({
        ...op,
        bonus: {
          total: Number(op.bonus?.total) || 0,
          percentage: Number(op.bonus?.percentage) || 0,
          category: op.bonus?.category ?? "Taller Conciencia",
          trend: op.bonus?.trend ?? "stable",
          date: op.bonus?.date ?? null,
        },
        km: {
          percentage: Number(op.km?.percentage) || 0,
          total: Number(op.km?.total) || 0,
          total_programado: Number(op.km?.total_programado) || 0,
          total_ejecutado: Number(op.km?.total_ejecutado) || 0,
          category: op.km?.category ?? "Taller Conciencia",
          trend: op.km?.trend ?? "stable",
          date: op.km?.date ?? null,
        },
      }))

      setOperadores(operadoresProcesados)
      setUsandoDatosDemo(resultado.isUsingDemoData)
      setFiltroTiempo(tipoFiltro)
      setValorFiltroTiempo(valorFiltro?.toString() || null)
      setCargando(false)
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("Error al cargar datos. Por favor, intente de nuevo.")
      setCargando(false)
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroCategoria, busqueda, ordenarPor, ordenDireccion, filtroActividad])

  // Determinar si un operador está activo
  const esOperadorActivo = useCallback((operador: Operator): boolean => {
    return !operador.retirementDate
  }, [])

  // Determinar si tiene novedad
  const tieneNovedad = useCallback((operador: Operator): boolean => {
    return !!(operador.tarea && operador.tarea.trim() !== "")
  }, [])

  // Filtrar por actividad
  const operadoresFiltradosActividad = useMemo(() => {
    return operadores.filter(op => {
      if (filtroActividad === "all") return true
      if (filtroActividad === "active") return esOperadorActivo(op)
      if (filtroActividad === "inactive") return !esOperadorActivo(op)
      if (filtroActividad === "with-novelty") return tieneNovedad(op)
      return true
    })
  }, [operadores, filtroActividad, esOperadorActivo, tieneNovedad])

  // Estadísticas de actividad
  const estadisticasActividad = useMemo(() => ({
    totalCount: operadores.length,
    activeCount: operadores.filter(esOperadorActivo).length,
    inactiveCount: operadores.filter(op => !esOperadorActivo(op)).length,
    withNoveltyCount: operadores.filter(tieneNovedad).length,
  }), [operadores, esOperadorActivo, tieneNovedad])

  // Filtrar y ordenar operadores
  const operadoresFiltrados = useMemo(() => {
    return filterAndSortOperators(operadoresFiltradosActividad, filtroCategoria, busqueda, ordenarPor, ordenDireccion)
  }, [operadoresFiltradosActividad, filtroCategoria, busqueda, ordenarPor, ordenDireccion])

  // Calcular estadísticas de categorías
  const estadisticasCategorias = useMemo(() => {
    return calculateCategoryStats(operadoresFiltradosActividad)
  }, [operadoresFiltradosActividad])

  // Paginación
  const totalPaginas = Math.ceil(operadoresFiltrados.length / ITEMS_POR_PAGINA)
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA
  const indiceFin = indiceInicio + ITEMS_POR_PAGINA
  const operadoresPaginados = operadoresFiltrados.slice(indiceInicio, indiceFin)

  // Manejar cambio de filtro de tiempo
  const manejarCambioFiltroTiempo = useCallback((filtro: TimeFilter) => {
    cargarDatos(filtro.type, filtro.value || null)
  }, [cargarDatos])

  // Limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltroCategoria("all")
    setBusqueda("")
  }, [])

  // Exportar datos
  const exportarDatos = useCallback(async () => {
    const headers = ["Ranking", "Nombre", "Cédula", "Cargo", "Categoría", "Bonos (%)", "Kilómetros (%)"]
    const rows = operadoresFiltrados.map((op, idx) => [
      idx + 1,
      op.name || "N/A",
      op.cedula || op.document || "N/A",
      op.position || "N/A",
      op.category || "N/A",
      op.bonus?.percentage ?? 0,
      op.km?.percentage ?? 0,
    ])

    const csvContent = [headers, ...rows].map(row => row.map(field => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `ranking_operadores_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [operadoresFiltrados])

  // Renderizar gráfica semanal
  const renderizarGraficaSemanal = useCallback((data: number[], small = false) => (
    <WeeklyChart data={data} small={small} />
  ), [])

  // Si está cargando
  if (cargando) {
    return (
      <div className="space-y-4">
        <RankingsHeader />
        <EstadoCarga />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <RankingsHeader />

      {/* Banner de error si aplica */}
      {error && <BannerError mensaje={error} onReintentar={() => cargarDatos()} />}

      {/* Filtro de tiempo activo */}
      {filtroTiempo !== "global" && valorFiltroTiempo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <Calendar className="w-4 h-4" />
          <span>
            {filtroTiempo === "year"
              ? `Año: ${valorFiltroTiempo}`
              : `Mes: ${valorFiltroTiempo.split("-")[1]}/${valorFiltroTiempo.split("-")[0]}`}
          </span>
        </div>
      )}

      {/* Controles de búsqueda */}
      <SearchAndControls
        searchQuery={busqueda}
        setSearchQuery={setBusqueda}
        sortBy={ordenarPor}
        setSortBy={setOrdenarPor}
        sortOrder={ordenDireccion}
        setSortOrder={setOrdenDireccion}
        viewMode={modoVista}
        setViewMode={setModoVista}
        timeFilter={filtroTiempo}
        timeFilterValue={valorFiltroTiempo}
        onTimeFilterChange={manejarCambioFiltroTiempo}
        availableYears={aniosDisponibles}
        latestYear={ultimoAnio}
        latestMonth={ultimoMes}
        activityFilter={filtroActividad}
        setActivityFilter={setFiltroActividad}
        isLoading={cargando}
        totalResults={operadoresFiltrados.length}
        activeCount={estadisticasActividad.activeCount}
        inactiveCount={estadisticasActividad.inactiveCount}
        totalCount={estadisticasActividad.totalCount}
        withNoveltyCount={estadisticasActividad.withNoveltyCount}
        onExport={exportarDatos}
      />

      {/* Chips de filtro por categoría */}
      <FilterChips
        filter={filtroCategoria}
        setFilter={setFiltroCategoria}
        categoryStats={estadisticasCategorias}
        totalOperators={operadoresFiltradosActividad.length}
        operators={operadoresFiltrados}
      />

      {/* Info de paginación */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Mostrando {indiceInicio + 1} a {Math.min(indiceFin, operadoresFiltrados.length)} de{" "}
          {operadoresFiltrados.length} operadores
        </span>
        <span>Página {paginaActual} de {totalPaginas}</span>
      </div>

      {/* Lista de operadores */}
      {operadoresFiltrados.length === 0 ? (
        <NoResults
          onClearFilters={limpiarFiltros}
          searchQuery={busqueda}
          isFiltered={filtroCategoria !== "all" || busqueda !== ""}
          errorMessage={error || undefined}
          latestYear={ultimoAnio}
          latestMonth={ultimoMes}
          onLoadLatestData={
            ultimoAnio && ultimoMes
              ? () => cargarDatos("month", `${ultimoAnio}-${ultimoMes.toString().padStart(2, "0")}`)
              : undefined
          }
        />
      ) : modoVista === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {operadoresPaginados.map((operador, index) => (
            <OperatorCard
              key={operador.id}
              operator={operador}
              rank={indiceInicio + index + 1}
              onClick={() => setOperadorSeleccionado(operador)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Lista de Operadores</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {operadoresPaginados.map((operador, index) => (
              <OperatorListItem
                key={operador.id}
                operator={operador}
                rank={indiceInicio + index + 1}
                onClick={() => setOperadorSeleccionado(operador)}
                renderWeeklyChart={renderizarGraficaSemanal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paginación */}
      <Paginacion
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onCambiarPagina={setPaginaActual}
      />

      {/* Modal de detalle */}
      {operadorSeleccionado && (
        <OperatorDetailModal operator={operadorSeleccionado} onClose={() => setOperadorSeleccionado(null)} />
      )}

      {/* Banner de datos demo */}
      {usandoDatosDemo && !cargando && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800">Datos de demostración</p>
              <p className="text-sm text-amber-600 mt-1">
                Verifique la conexión a la base de datos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2 text-amber-700"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OperatorRankings() {
  return <OperatorRankingsBase />
}
