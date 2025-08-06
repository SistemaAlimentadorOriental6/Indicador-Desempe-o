"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Loader2,
  Info,
  X,
  DollarSign,
  TrendingDown,
  Filter,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calculator,
  Percent,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MinusCircle,
  XCircle,
  Calendar,
  Clock,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BonusDetailsTabProps {
  userCode: string
}

interface Deduction {
  id: number
  codigo: string
  concepto: string
  porcentaje: number | string
  monto: number
  fechaInicio: string
  fechaFin: string | null
  dias?: number
  observaciones?: string
}

interface BonusResponse {
  baseBonus: number
  finalBonus: number
  deductionPercentage: number
  deductionAmount: number
  summary: {
    totalProgrammed: number
    totalExecuted: number
    percentage: number
  }
  deductions: Deduction[]
  availableYears: number[]
  availableMonths: number[]
}

interface FaultRecord {
  codigo: string
  descripcion: string
  years: { [year: number]: number }
}

interface FaultsResponse {
  data: FaultRecord[]
  availableYears: number[]
  totalByYear: { [year: number]: number }
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount)

// Calcula el valor actual de la deducción según el tipo y el año
function calcularValorActual(d: Deduction, baseBonus: number): number {
  if (typeof d.porcentaje === "string" && d.porcentaje.toLowerCase().includes("día")) {
    const dias = d.dias || 1
    return 4733 * dias
  } else if (typeof d.porcentaje === "number") {
    // Los porcentajes vienen como decimales pero representan porcentajes enteros
    // Ej: 0.25 = 25%, 1 = 100%, 0.5 = 50%
    // Por eso multiplicamos por 100 para obtener el porcentaje real
    return Math.round((baseBonus * d.porcentaje * 100) / 100)
  } else if (typeof d.porcentaje === "string") {
    // Intentar convertir string a número si es posible
    const numValue = parseFloat(d.porcentaje)
    if (!isNaN(numValue)) {
      // Aplicar la misma lógica que para números
      return Math.round((baseBonus * numValue * 100) / 100)
    }
  }
  return 0
}

// Función para convertir número de mes a nombre
const obtenerNombreMes = (numeroMes: number): string => {
  const meses = [
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
  return meses[numeroMes - 1] || ""
}

const getDeductionSeverity = (percentage: number | string) => {
  const numPercentage = typeof percentage === "number" ? percentage : 0
  if (numPercentage >= 20) return { color: "red", label: "Alto", icon: XCircle }
  if (numPercentage >= 10) return { color: "amber", label: "Medio", icon: AlertCircle }
  if (numPercentage > 0) return { color: "blue", label: "Bajo", icon: MinusCircle }
  return { color: "emerald", label: "Sin impacto", icon: CheckCircle }
}

const BonusDetailsTab: React.FC<BonusDetailsTabProps> = ({ userCode }) => {
  const [data, setData] = useState<BonusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  const [selectedRow, setSelectedRow] = useState<Deduction | null>(null)
  const [faultsData, setFaultsData] = useState<FaultsResponse | null>(null)
  const [faultsLoading, setFaultsLoading] = useState(false)
  const [showFaultsMatrix, setShowFaultsMatrix] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [faultDaysByYear, setFaultDaysByYear] = useState<{ [key: string]: { [year: number]: number } }>({})
  // Estado para el modal de detalle de faltas
  const [detalleFaltas, setDetalleFaltas] = useState<any[] | null>(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleModal, setDetalleModal] = useState<{codigo: string, year: number, descripcion: string} | null>(null)
  
  // Estado para el modal de tabla de deducciones
  const [showDeductionsTable, setShowDeductionsTable] = useState(false)
  const [selectedFaultCode, setSelectedFaultCode] = useState<string | null>(null)

  useEffect(() => {
    if (data?.deductions) {
      const daysByYear: { [key: string]: { [year: number]: number } } = {}

      data.deductions.forEach(deduction => {
        if (deduction.dias && deduction.dias > 0) {
          const year = new Date(deduction.fechaInicio).getFullYear()
          if (!daysByYear[deduction.codigo]) {
            daysByYear[deduction.codigo] = {}
          }
          if (!daysByYear[deduction.codigo][year]) {
            daysByYear[deduction.codigo][year] = 0
          }
          daysByYear[deduction.codigo][year] += deduction.dias
        }
      })
      setFaultDaysByYear(daysByYear)
    }
  }, [data])

  // Inicializar con el año y mes actual
  useEffect(() => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() devuelve 0-11
    
    console.log(`[BonusDetailsTab] Initializing with current date: ${currentYear}-${currentMonth}`)
    
    // Solo inicializar si no hay filtros seleccionados
    if (!selectedYear && !selectedMonth) {
      setSelectedYear(currentYear)
      setSelectedMonth(currentMonth)
    }
  }, []) // Solo se ejecuta una vez al montar el componente

  // Función para abrir el modal y cargar el detalle
  const handleOpenDetalle = async (codigo: string, year: number, descripcion: string) => {
    setDetalleModal({ codigo, year, descripcion })
    setDetalleLoading(true)
    setDetalleFaltas(null)
    try {
      const res = await fetch(`/api/user/faults?codigo=${userCode}&codigo=${codigo}&year=${year}&detalle=1`)
      const json = await res.json()
      setDetalleFaltas(json?.data ?? json)
    } catch (e) {
      setDetalleFaltas([])
    } finally {
      setDetalleLoading(false)
    }
  }

  // Función para abrir la tabla de deducciones
  const handleOpenDeductionsTable = (codigo: string) => {
    console.log("Abriendo tabla de deducciones para código:", codigo)
    setSelectedFaultCode(codigo)
    setShowDeductionsTable(true)
    console.log("Estado showDeductionsTable:", true)
  }

  useEffect(() => {
    const fetchBonus = async () => {
      try {
        setLoading(true)
        setError(null)
        let url = `/api/user/bonuses?codigo=${userCode}`
        if (selectedYear) url += `&year=${selectedYear}`
        if (selectedMonth) url += `&month=${selectedMonth}`
        
        console.log(`[BonusDetailsTab] Fetching bonuses from: ${url}`)
        
        const res = await fetch(url)
        if (!res.ok) throw new Error("Error al obtener datos de bonos")
        const json = await res.json()
        const payload = json?.data ?? json
        
        console.log(`[BonusDetailsTab] Received data:`, {
          baseBonus: payload.baseBonus,
          finalBonus: payload.finalBonus,
          deductionAmount: payload.deductionAmount,
          deductionsCount: payload.deductions?.length || 0,
          deductions: payload.deductions,
          selectedYear,
          selectedMonth
        })
        
        // Asegurar que deductions sea siempre un array
        const processedPayload = {
          ...payload,
          deductions: Array.isArray(payload.deductions) ? payload.deductions : []
        }
        
        console.log(`[BonusDetailsTab] Processed payload:`, {
          deductionsCount: processedPayload.deductions.length,
          hasDeductions: processedPayload.deductions.length > 0
        })
        
        setData(processedPayload)
        setAvailableYears(processedPayload.availableYears || [])
        setAvailableMonths(processedPayload.availableMonths || [])
      } catch (err: any) {
        console.error(`[BonusDetailsTab] Error fetching bonuses:`, err)
        setError(err.message ?? "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    const fetchFaults = async () => {
      try {
        setFaultsLoading(true)
        const res = await fetch(`/api/user/faults?codigo=${userCode}`)
        if (!res.ok) throw new Error("Error al obtener datos de faltas")
        const json = await res.json()
        setFaultsData(json?.data ?? json)
      } catch (err: any) {
        console.error("Error fetching faults:", err)
        // No mostrar error al usuario ya que las faltas son opcionales
        setFaultsData(null)
      } finally {
        setFaultsLoading(false)
      }
    }

    if (userCode) {
      console.log(`[BonusDetailsTab] Fetching data for user: ${userCode}, year: ${selectedYear}, month: ${selectedMonth}`)
      fetchBonus()
      fetchFaults()
    }
  }, [userCode, selectedYear, selectedMonth])

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
        <p className="text-slate-600 font-medium">Cargando datos de bonificaciones...</p>
      </div>
    )

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <X className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Error al cargar datos</h3>
        <p className="text-red-600">{error}</p>
      </div>
    )

  if (!data)
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <DollarSign className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-600 mb-2">Sin datos disponibles</h3>
        <p className="text-slate-500">
          {selectedYear && selectedMonth 
            ? `No se encontraron registros de bonificaciones para ${obtenerNombreMes(selectedMonth)} ${selectedYear}`
            : "No se encontraron registros de bonificaciones"
          }
        </p>
        {selectedYear && selectedMonth && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600">
              <Info className="w-4 h-4 inline mr-1" />
              Intenta seleccionar un año o mes diferente, o verifica que el usuario tenga registros en este período.
            </p>
          </div>
        )}
      </div>
    )

  return (
    <>
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">Análisis de Bonificaciones</h2>
            <p className="text-slate-600">Seguimiento detallado de bonos y deducciones</p>
            {selectedYear && selectedMonth && (
              <div className="mt-2 flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {obtenerNombreMes(selectedMonth)} {selectedYear}
          </div>
                {data && (data.deductionAmount ?? 0) === 0 && (
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Bono Completo
                  </div>
                )}
                {data && (data.deductionAmount ?? 0) > 0 && (
                  <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Con Deducciones
                  </div>
                )}
              </div>
            )}
          </div>
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Cargando...</span>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Año
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  value={selectedYear ?? ""}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Todos los años</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Mes
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  value={selectedMonth ?? ""}
                  onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Todos los meses</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {obtenerNombreMes(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {(selectedYear || selectedMonth) && (
                  <button
                    className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    onClick={() => {
                      setSelectedYear(null)
                      setSelectedMonth(null)
                    }}
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>
          </div>

        {/* Resumen de bonificaciones */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Bono Base</p>
                <p className="text-lg font-bold text-slate-800">{formatCurrency(data.baseBonus ?? 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Deducción</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(data.deductionAmount ?? 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Percent className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">% Descuento</p>
                <p className="text-lg font-bold text-amber-600">{(data.deductionPercentage ?? 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 shadow-sm border-2 ${
            (data.deductionAmount ?? 0) === 0 
              ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200" 
              : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (data.deductionAmount ?? 0) === 0 
                  ? "bg-emerald-100" 
                  : "bg-emerald-100"
              }`}>
                <CheckCircle className={`w-4 h-4 ${
                  (data.deductionAmount ?? 0) === 0 
                    ? "text-emerald-600" 
                    : "text-emerald-600"
                }`} />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Bono Final</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(data.finalBonus ?? 0)}</p>
                {(data.deductionAmount ?? 0) === 0 && selectedYear && selectedMonth && (
                  <div className="text-xs text-emerald-600 font-medium mt-1">
                    ¡Completo!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de estado del mes */}
        {selectedYear && selectedMonth && (data.deductionAmount ?? 0) === 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-emerald-800">
                  Bono Completo en {obtenerNombreMes(selectedMonth)} {selectedYear}
                </h4>
                <p className="text-emerald-600 text-sm">
                  No se registraron deducciones que afecten este mes. El bono se mantiene completo.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(data.baseBonus ?? 0)}
                </div>
                <div className="text-xs text-emerald-600">Bono íntegro</div>
              </div>
            </div>
          </div>
        )}

        {/* Faults Matrix Section */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Historial Completo de Faltas</h3>
                  <p className="text-sm text-slate-600">Registro detallado de todas las incidencias por año</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {faultsData && faultsData.data && faultsData.data.length > 0 && (
                  <div className="bg-emerald-100 px-3 py-1 rounded-lg">
                    <span className="text-xs font-semibold text-emerald-700">
                      {faultsData.data.length} tipos de faltas registradas
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowFaultsMatrix(!showFaultsMatrix)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                    showFaultsMatrix
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                      : "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 hover:from-orange-100 hover:to-orange-200"
                  }`}
                >
                  {showFaultsMatrix ? "Ocultar Matriz" : "Ver Matriz Completa"}
                </button>
              </div>
            </div>
          </div>

          {showFaultsMatrix && (
            <div className="p-6">
              {faultsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                  <span className="text-slate-600">Cargando historial completo de faltas...</span>
                </div>
              ) : faultsData && faultsData.data && faultsData.data.length > 0 ? (
                <div className="space-y-6">
                  {/* Estadísticas Generales */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                    <h4 className="text-lg font-bold text-orange-800 mb-3">Resumen Estadístico</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">
                          {Object.values(faultsData.totalByYear).reduce((a, b) => a + b, 0)}
                        </div>
                        <div className="text-sm font-semibold text-orange-600">Total Faltas</div>
                        <div className="text-xs text-orange-500">Historial completo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">{faultsData.availableYears.length}</div>
                        <div className="text-sm font-semibold text-orange-600">Años con Registro</div>
                        <div className="text-xs text-orange-500">
                          {Math.min(...faultsData.availableYears)} - {Math.max(...faultsData.availableYears)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">{faultsData.data.length}</div>
                        <div className="text-sm font-semibold text-orange-600">Tipos Diferentes</div>
                        <div className="text-xs text-orange-500">Códigos únicos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700">
                          {(Object.values(faultsData.totalByYear).reduce((a, b) => a + b, 0) / faultsData.availableYears.length).toFixed(1)}
                        </div>
                        <div className="text-sm font-semibold text-orange-600">Promedio Anual</div>
                        <div className="text-xs text-orange-500">Faltas por año</div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen por año - Extendido */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4">Distribución por Año</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {faultsData.availableYears.map((year) => {
                        const yearTotal = faultsData.totalByYear[year] || 0
                        const maxTotal = Math.max(...Object.values(faultsData.totalByYear))
                        const percentage = maxTotal > 0 ? (yearTotal / maxTotal) * 100 : 0
                        return (
                          <div
                            key={year}
                            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 hover:shadow-md transition-all"
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-800">{yearTotal}</div>
                              <div className="text-sm font-semibold text-orange-600">{year}</div>
                              <div className="text-xs text-orange-500">Total faltas</div>
                              <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Matriz de Faltas Completa */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4">Matriz Detallada de Incidencias</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-100 to-orange-200">
                            <th className="border-2 border-orange-300 px-4 py-3 text-left text-sm font-bold text-orange-800 sticky left-0 bg-orange-100 min-w-[200px]">
                              Tipo de Falta
                            </th>
                            <th className="border-2 border-orange-300 px-3 py-3 text-center text-sm font-bold text-orange-800 min-w-[60px]">
                              Código
                            </th>
                            {faultsData.availableYears.map((year) => (
                              <th
                                key={year}
                                className="border-2 border-orange-300 px-4 py-3 text-center text-sm font-bold text-orange-800 min-w-[80px]"
                              >
                                {year}
                              </th>
                            ))}
                            <th className="border-2 border-orange-300 px-4 py-3 text-center text-sm font-bold text-orange-800 min-w-[80px]">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {faultsData.data
                            .sort((a, b) => {
                              const totalA = Object.values(a.years).reduce((sum, count) => sum + count, 0)
                              const totalB = Object.values(b.years).reduce((sum, count) => sum + count, 0)
                              return totalB - totalA // Ordenar por total descendente
                            })
                            .map((fault, index) => {
                              const totalFaults = Object.values(fault.years).reduce((sum, count) => sum + count, 0)
                              const hasIncidents = totalFaults > 0
                              return (
                                <tr
                                  key={fault.codigo}
                                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-orange-50 transition-colors`}
                                >
                                  <td className="border border-slate-300 px-4 py-3 sticky left-0 bg-inherit">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-3 h-3 rounded-full ${hasIncidents ? "bg-red-500" : "bg-emerald-500"}`}
                                      ></div>
                                      <span className="text-sm font-medium text-slate-800">{fault.descripcion}</span>
                                    </div>
                                  </td>
                                  <td className="border border-slate-300 px-3 py-3 text-center">
                                    <span
                                      className={`text-xs font-bold px-2 py-1 rounded ${
                                        hasIncidents ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {fault.codigo}
                                    </span>
                                  </td>
                                  {faultsData.availableYears.map((year) => {
                                    const count = fault.years[year] || 0
                                    const days = faultDaysByYear[fault.codigo]?.[year] || 0
                                    return (
                                      <td key={year} className="border border-slate-300 px-4 py-3 text-center">
                                        {count > 0 ? (
                                          <div className="flex flex-col items-center">
                                            <button
                                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 hover:scale-110
                                                ${
                                                  count >= 5
                                                    ? "bg-red-500 text-white"
                                                    : count >= 3
                                                      ? "bg-amber-500 text-white"
                                                      : count >= 1
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-slate-100 text-slate-400"
                                                }`}
                                              title="Ver tabla de deducciones"
                                              onClick={() => handleOpenDeductionsTable(fault.codigo)}
                                            >
                                              {count}
                                            </button>
                                            {days > 0 && (
                                              <span className="text-xs text-slate-500 mt-1">({days}d)</span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400">-</span>
                                        )}
                                      </td>
                                    )
                                  })}
                                  <td className="border border-slate-300 px-4 py-3 text-center">
                                    {totalFaults > 0 ? (
                                      <span
                                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                                          totalFaults >= 10
                                            ? "bg-red-500 text-white"
                                            : totalFaults >= 5
                                              ? "bg-amber-500 text-white"
                                              : "bg-orange-500 text-white"
                                        }`}
                                      >
                                        {totalFaults}
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-semibold text-sm">Sin faltas</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Análisis de Tendencias */}
                  {faultsData.availableYears.length > 1 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <h4 className="text-lg font-bold text-blue-800 mb-3">Análisis de Tendencias</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-700">
                            {faultsData.totalByYear[Math.max(...faultsData.availableYears)] || 0}
                          </div>
                          <div className="text-sm font-semibold text-blue-600">Año Más Reciente</div>
                          <div className="text-xs text-blue-500">{Math.max(...faultsData.availableYears)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-700">
                            {Math.max(...Object.values(faultsData.totalByYear))}
                          </div>
                          <div className="text-sm font-semibold text-blue-600">Año con Más Faltas</div>
                          <div className="text-xs text-blue-500">
                            {Object.keys(faultsData.totalByYear).find(
                              year => faultsData.totalByYear[Number(year)] === Math.max(...Object.values(faultsData.totalByYear))
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-700">
                            {Math.min(...Object.values(faultsData.totalByYear))}
                          </div>
                          <div className="text-sm font-semibold text-blue-600">Año con Menos Faltas</div>
                          <div className="text-xs text-blue-500">
                            {Object.keys(faultsData.totalByYear).find(
                              year => faultsData.totalByYear[Number(year)] === Math.min(...Object.values(faultsData.totalByYear))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600 mb-2">¡Excelente Historial!</h3>
                  <p className="text-slate-500">No se encontraron faltas registradas en todo el período analizado</p>
                  <div className="mt-4 text-xs text-slate-400">
                    Esto indica un desempeño ejemplar sin incidencias disciplinarias
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explicación de las deducciones */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">¿Cómo se calculan las deducciones?</h3>
              <p className="text-sm text-blue-600">Explicación de los valores mostrados</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">% a Retirar</span>
              </div>
              <p className="text-sm text-slate-700">
                Porcentaje del bono base que se descuenta. Puede ser un valor fijo (ej: 1%) o por día.
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Valor Calculado</span>
              </div>
              <p className="text-sm text-slate-700">
                Monto calculado basado en el porcentaje y el bono base actual ({formatCurrency(data.baseBonus ?? 0)}).
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Monto Real</span>
              </div>
              <p className="text-sm text-slate-700">
                Cantidad efectivamente descontada del bono final. Puede diferir del valor calculado.
              </p>
            </div>
          </div>
          
          {/* Nueva sección sobre bonos completos */}
          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-emerald-800">Sistema de Bonos Completos</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/70 rounded-lg p-3 border border-emerald-200">
                <p className="font-semibold text-emerald-700 mb-1">¿Cuándo se considera completo?</p>
                <p className="text-slate-700">
                  Un mes se considera con bono completo cuando no hay deducciones registradas que afecten ese período específico.
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-emerald-200">
                <p className="font-semibold text-emerald-700 mb-1">¿Cómo se mantiene?</p>
                <p className="text-slate-700">
                  El bono se mantiene completo hasta que se registre una deducción que afecte ese mes específico.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de deducciones */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Registro de Deducciones</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <TooltipProvider>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Causa
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      % a Retirar
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Valor Actual
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {(() => {
                    console.log('[BonusDetailsTab] Debugging deductions:', {
                      deductions: data.deductions,
                      deductionsLength: data.deductions?.length,
                      hasDeductions: data.deductions && data.deductions.length > 0,
                      deductionAmount: data.deductionAmount
                    })
                    
                    const hasDeductions = data.deductions && data.deductions.length > 0
                    
                    if (!hasDeductions) {
                      console.log('[BonusDetailsTab] Showing "Sin Deducciones" row')
                      return (
                        <tr className="hover:bg-emerald-50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-700">0</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">Sin Deducciones</div>
                            <div className="text-xs text-emerald-600 font-medium">
                              Impacto: Sin impacto
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                              <div className="text-sm font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                0%
                          </div>
                              <div className="text-xs text-emerald-500 mt-1">
                                0 día(s)
                              </div>
                        </div>
                      </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-sm font-bold text-slate-800">
                                {formatCurrency(0)}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Valor calculado
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-sm font-bold text-emerald-600">
                                {formatCurrency(0)}
                              </div>
                              <div className="text-xs text-emerald-500 mt-1">
                                Monto real
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs text-slate-600">
                              <div className="font-semibold">
                                {selectedYear && selectedMonth 
                                  ? `${obtenerNombreMes(selectedMonth)} ${selectedYear}`
                                  : "Período actual"
                                }
                              </div>
                              <div className="text-slate-500">
                                Mes completo
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                                  <Info className="w-4 h-4 text-emerald-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-md p-4 text-sm bg-white text-slate-800 shadow-xl border-2 border-emerald-200 rounded-xl"
                              >
                                <div className="space-y-2">
                                  <p className="font-semibold text-emerald-700">Mes Completo</p>
                                  <p className="text-slate-700">
                                    No se registraron deducciones que afecten este mes. El bono se mantiene completo.
                                  </p>
                                  <div className="text-xs text-emerald-600">
                                    <p><strong>Bono Base:</strong> {formatCurrency(data.baseBonus ?? 0)}</p>
                                    <p><strong>Bono Final:</strong> {formatCurrency(data.finalBonus ?? 0)}</p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                    </tr>
                      )
                    } else {
                      console.log('[BonusDetailsTab] Showing deductions rows:', data.deductions.length)
                      return data.deductions.map((d) => {
                      const severity = getDeductionSeverity(d.porcentaje)
                      return (
                        <tr
                          key={d.id}
                          className={`hover:bg-slate-50 transition-all duration-200 cursor-pointer ${
                            selectedRow === d ? "bg-blue-50 border-l-4 border-blue-500" : ""
                          }`}
                          onClick={() => setSelectedRow(selectedRow === d ? null : d)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 bg-gradient-to-br from-${severity.color}-100 to-${severity.color}-200 rounded-lg flex items-center justify-center`}
                              >
                                <span className={`text-xs font-bold text-${severity.color}-700`}>{d.codigo}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{d.concepto}</div>
                            <div className={`text-xs text-${severity.color}-600 font-medium`}>
                              Impacto: {severity.label}
                            </div>
                          </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <div className={`text-sm font-bold px-2 py-1 rounded-full ${
                                  typeof d.porcentaje === "string" && d.porcentaje.toLowerCase().includes("día")
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}>
                                  {d.porcentaje}
                                </div>
                                {typeof d.porcentaje === "string" && d.porcentaje.toLowerCase().includes("día") && (
                                  <div className="text-xs text-blue-500 mt-1">
                                    {d.dias || 1} día(s)
                                  </div>
                                )}
                              </div>
                          </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                            <div className="text-sm font-bold text-slate-800">
                              {formatCurrency(calcularValorActual(d, data.baseBonus ?? 0))}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Valor calculado
                                </div>
                            </div>
                          </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <div className="text-sm font-bold text-red-600">
                                  {formatCurrency(d.monto ?? 0)}
                                </div>
                                <div className="text-xs text-red-500 mt-1">
                                  Monto real
                                </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs text-slate-600">
                              <div className="font-semibold">{new Date(d.fechaInicio).toLocaleDateString("es-CO")}</div>
                              {d.fechaFin && (
                                <div className="text-slate-500">
                                  hasta {new Date(d.fechaFin).toLocaleDateString("es-CO")}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {d.observaciones && d.observaciones.trim() !== "" ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`w-8 h-8 ${d.observaciones?.toLowerCase().includes('sin impacto') || !d.observaciones ? 'bg-emerald-100 hover:bg-emerald-200' : 'bg-blue-100 hover:bg-blue-200'} rounded-lg flex items-center justify-center cursor-pointer transition-colors`}>
                                    <Info className={
                                      `w-4 h-4 ` +
                                      (d.observaciones?.toLowerCase().includes('sin impacto') || !d.observaciones
                                        ? 'text-emerald-600'
                                        : 'text-blue-600')
                                    } />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className={`max-w-md p-4 text-sm bg-white text-slate-800 shadow-xl border-2 rounded-xl ${d.observaciones?.toLowerCase().includes('sin impacto') || !d.observaciones ? 'border-emerald-200' : 'border-blue-200'}`}
                                >
                                  {d.observaciones}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Info className="w-4 h-4 text-slate-300" />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                    }
                  })()}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        </div>

        {/* Detalles de fila seleccionada */}
        {selectedRow && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-blue-800">Detalle de la Deducción</h4>
                  <p className="text-sm text-blue-600">Código: {selectedRow.codigo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-2 bg-blue-200 hover:bg-blue-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-blue-700" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Causa</span>
                </div>
                <p className="text-base font-bold text-slate-800">{selectedRow.concepto}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">% a Retirar</span>
                </div>
                <div className="flex flex-col">
                <p className="text-base font-bold text-slate-800">{selectedRow.porcentaje}</p>
                  {typeof selectedRow.porcentaje === "string" && selectedRow.porcentaje.toLowerCase().includes("día") && (
                    <p className="text-sm text-blue-600 mt-1">
                      Tipo: Por día ({selectedRow.dias || 1} día(s))
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Valor Calculado</span>
                </div>
                <div className="flex flex-col">
                <p className="text-base font-bold text-slate-800">
                  {formatCurrency(calcularValorActual(selectedRow, data.baseBonus ?? 0))}
                </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Basado en bono base: {formatCurrency(data.baseBonus ?? 0)}
                  </p>
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Monto Real</span>
                </div>
                <div className="flex flex-col">
                <p className="text-base font-bold text-red-600">{formatCurrency(selectedRow.monto ?? 0)}</p>
                  <p className="text-sm text-red-500 mt-1">
                    Monto efectivamente descontado
                  </p>
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Fecha Inicio</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {new Date(selectedRow.fechaInicio).toLocaleDateString("es-CO")}
                </p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Fecha Fin</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {selectedRow.fechaFin ? new Date(selectedRow.fechaFin).toLocaleDateString("es-CO") : "Sin fecha fin"}
                </p>
              </div>
              {selectedRow.observaciones && (
                <div className="bg-white/70 rounded-xl p-4 border border-blue-200 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">Observaciones</span>
                  </div>
                  <p className="text-base text-slate-700">{selectedRow.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {detalleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 p-2 bg-slate-100 hover:bg-slate-200 rounded-full"
              onClick={() => setDetalleModal(null)}
              title="Cerrar"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <h3 className="text-xl font-bold text-orange-700 mb-2">Detalle de {detalleModal.descripcion}</h3>
            <p className="text-sm text-slate-600 mb-4">Año: {detalleModal.year}</p>
            {detalleLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                <span className="text-slate-600">Cargando detalles...</span>
              </div>
            ) : detalleFaltas && detalleFaltas.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {detalleFaltas.map((falta) => (
                  <div key={falta.id} className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-slate-800">
                        {new Date(falta.fechaInicio).toLocaleDateString("es-CO")}
                        {falta.fechaFin && falta.fechaFin !== falta.fechaInicio ? ` al ${new Date(falta.fechaFin).toLocaleDateString("es-CO")}` : ""}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">{falta.dias} día(s)</span>
                    </div>
                    {falta.observaciones && (
                      <div className="text-xs text-slate-600 mt-1">
                        <Info className="inline w-3 h-3 mr-1 text-blue-400 align-text-bottom" />
                        {falta.observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No hay detalles registrados para este año y tipo.</div>
            )}
          </div>
        </div>
      )}

      
      {/* Modal de Tabla de Deducciones */}
      {showDeductionsTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-6 flex items-center justify-between relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
    </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Tabla de Deducciones</h2>
                  <p className="text-emerald-100 text-sm font-medium">
                    Código: <span className="bg-white/20 px-2 py-1 rounded-lg font-bold">{selectedFaultCode}</span> - Información detallada
                  </p>
                </div>
              </div>
              <button
                className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl transition-all duration-200 hover:scale-110 shadow-lg relative z-10"
                onClick={() => setShowDeductionsTable(false)}
                title="Cerrar"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          Item
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          Causa
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          % a Retirar
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          Valor Actual
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-emerald-800 uppercase tracking-wider">
                          Observación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {/* Primera sección - Deducciones básicas */}
                      <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                        <td colSpan={5} className="px-6 py-4">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            Deducciones Básicas
                          </h3>
                        </td>
                      </tr>
                      <tr className="hover:bg-emerald-50 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 border-r border-slate-200">1</td>
                        <td className="px-6 py-4 text-sm text-slate-800 border-r border-slate-200">Incapacidad</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                            25%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                            Sí
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">2</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Ausentismo</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">50%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(71000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">3</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Retardo</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">25%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">4</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Calamidad</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">Día</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(4733)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">5</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Renuncia</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">6</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Suspensión</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">7</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Vacaciones</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">Día</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(4733)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">8</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Permiso</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">Día</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(4733)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">9</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">No Ingreso</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">10</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Descanso</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">0%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(0)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">11</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Día No Remunerado</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">Día</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(4733)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">12</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Compensatorio</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">0%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(0)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">13</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Día No Remunerado por Horas</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">0%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(0)}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">No Afecta Desempeño</td>
                      </tr>

                      {/* Segunda sección - Daños y faltas */}
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-4 py-2">
                          <h3 className="text-sm font-bold text-slate-700">Daños y Faltas</h3>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">DL</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Daño Leve</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">25%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">DG</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Daño Grave</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">50%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(71000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">DGV</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Daño Gravísimo</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">DEL</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Desincentivo Leve</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">25%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">DEG</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Desincentivo Grave</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">50%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(71000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">DEGV</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Desincentivo Gravísimo</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">INT</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Falta Menor</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">25%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">OM</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Falta Grave</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">50%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(71000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">OMD</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Falta Gravísima</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">OG</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Falta Gravísima</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">NPF</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">No Presentó Firma</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">25%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">HCC-L</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Hábitos, Conductas Y Comportamientos - Leve</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">25%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">HCC-G</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Hábitos, Conductas Y Comportamientos - Grave</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">50%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(71000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">HCC-GV</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Hábitos, Conductas Y Comportamientos - Gravísimo</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">100%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(142000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">Información Importante</h3>
                    <p className="text-blue-600 text-sm">Detalles sobre el cálculo de deducciones</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Bono Base
                    </p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(142000)}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Valor por Día
                    </p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(4733)}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Deducciones por Día
                    </p>
                    <p className="text-slate-700">Se calculan multiplicando el valor por día por el número de días</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Deducciones por Porcentaje
                    </p>
                    <p className="text-slate-700">Se calculan sobre el bono base según el porcentaje indicado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Modal de Tabla de Deducciones */}
      {console.log("Estado actual de showDeductionsTable:", showDeductionsTable)}
      {showDeductionsTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-6 flex items-center justify-between relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Tabla de Deducciones</h2>
                  <p className="text-emerald-100 text-sm font-medium">
                    Código: <span className="bg-white/20 px-2 py-1 rounded-lg font-bold">{selectedFaultCode}</span> - Información detallada
                  </p>
                </div>
              </div>
              <button
                className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl transition-all duration-200 hover:scale-110 shadow-lg relative z-10"
                onClick={() => setShowDeductionsTable(false)}
                title="Cerrar"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          Item
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          Causa
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          % a Retirar
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-emerald-800 uppercase tracking-wider border-r border-emerald-200">
                          Valor Actual
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-emerald-800 uppercase tracking-wider">
                          Observación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {/* Primera sección - Deducciones básicas */}
                      <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                        <td colSpan={5} className="px-6 py-4">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            Deducciones Básicas
                          </h3>
                        </td>
                      </tr>
                      <tr className="hover:bg-emerald-50 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 border-r border-slate-200">1</td>
                        <td className="px-6 py-4 text-sm text-slate-800 border-r border-slate-200">Incapacidad</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                            25%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(35500)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                            Sí
                          </span>
                        </td>
                      </tr>
                      {/* Aquí irían todas las demás filas de la tabla... */}
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200">2</td>
                        <td className="px-4 py-3 text-sm text-slate-800 border-r border-slate-200">Ausentismo</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">50%</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">{formatCurrency(71000)}</td>
                        <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Sí</td>
                      </tr>
                      {/* Continuar con todas las filas... */}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">Información Importante</h3>
                    <p className="text-blue-600 text-sm">Detalles sobre el cálculo de deducciones</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Bono Base
                    </p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(142000)}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Valor por Día
                    </p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(4733)}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Deducciones por Día
                    </p>
                    <p className="text-slate-700">Se calculan multiplicando el valor por día por el número de días</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Deducciones por Porcentaje
                    </p>
                    <p className="text-slate-700">Se calculan sobre el bono base según el porcentaje indicado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BonusDetailsTab
