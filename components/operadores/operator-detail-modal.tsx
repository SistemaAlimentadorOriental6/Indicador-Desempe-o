"use client"

import type React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
import {
  X,
  DollarSign,
  MapPin,
  BarChart3,
  Calendar,
  Flame,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Star,
  Zap,
  Activity,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  Info,
  Route,
  Timer,
  Calculator,
  Loader,
  BadgeCheck,
  BadgeX,
  ListCollapse,
} from "lucide-react"
import { getCategoryIcon, getCategoryColor } from "@/utils/operator-utils"
import type { Operator } from "@/types/operator-types"
import { formatNumber, formatPercentage } from "@/utils/format-utils"

// Optimized helper functions with memoization
const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-4 h-4 text-emerald-500" aria-label="Tendencia ascendente" />
    case "down":
      return <TrendingDown className="w-4 h-4 text-red-500" aria-label="Tendencia descendente" />
    default:
      return <Minus className="w-4 h-4 text-gray-500" aria-label="Tendencia estable" />
  }
}

const getPerformanceLevel = (percentage: number) => {
  if (percentage >= 95)
    return { level: "Excelente", color: "emerald", icon: CheckCircle, description: "Rendimiento excepcional" }
  if (percentage >= 85)
    return { level: "Bueno", color: "blue", icon: CheckCircle, description: "Rendimiento satisfactorio" }
  if (percentage >= 70)
    return { level: "Regular", color: "yellow", icon: AlertTriangle, description: "Rendimiento mejorable" }
  return { level: "Necesita Mejora", color: "red", icon: AlertTriangle, description: "Requiere atención inmediata" }
}

const calculateBonusDetails = (operator: Operator) => {
  const totalExecuted = operator.km.total_ejecutado || operator.km.total
  const totalProgrammed = operator.km.total_programado || operator.km.total
  const bonusPerKm = totalExecuted > 0 ? operator.bonus.total / totalExecuted : 0
  const efficiencyRate = totalProgrammed > 0 ? (totalExecuted / totalProgrammed) * 100 : 0

  return {
    bonusPerKm,
    efficiencyRate,
    totalExecuted,
    totalProgrammed,
    kmDifference: totalExecuted - totalProgrammed,
    bonusEfficiency: operator.bonus.percentage,
  }
}

interface OperatorDetailModalProps {
  operator: Operator
  onClose: () => void
}

interface Deduction {
  id: number
  fecha: string
  concepto: string
  monto: number
  observaciones: string
  codigo_factor?: string
  dias?: number
  porcentaje?: number | string
}

interface BonusApiResponse {
  success: boolean
  baseBonus: number
  finalBonus: number
  deductionAmount: number
  deductions: Deduction[]
  availableBonuses?: any
  bonusesByYear?: any
  summary?: {
    availableBonuses: any
    totalProgrammed: number
    totalExecuted: number
    percentage: number
    lastMonthFinalValue?: number
  }
  // Campo para forzar la visualización de deducciones
  hasForcedDeduction?: boolean
}

export const OperatorDetailModal: React.FC<OperatorDetailModalProps> = ({ operator, onClose }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "insights">("overview")

  const [bonusData, setBonusData] = useState<BonusApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOperatorAndBonusData = async () => {
      setIsLoading(true)
      setError(null)
      setBonusData(null) // Limpiar datos anteriores

      if (!operator) {
        setIsLoading(false)
        return
      }

      // Inspeccionar la estructura completa del objeto operator
      console.log("Estructura del objeto operator:", JSON.stringify(operator, null, 2))

      try {
        // Intentar obtener el código del operador de diferentes propiedades posibles
        let operatorCode = operator.codigo || 
                          (operator.document ? operator.document : null) || 
                          (operator.id ? String(operator.id) : null)

        // Si no tenemos código, intentar buscar por cédula o documento
        if (!operatorCode) {
          const documentId = operator.cedula || operator.document || 
                           (typeof operator.id === 'string' ? operator.id : null)

          if (!documentId) {
            throw new Error("No se encontró ningún identificador válido para el operador (código, cédula, documento o ID).")
          }

          console.log(`Intentando buscar operador por documento/cédula: ${documentId}`)
          const userResponse = await fetch(`/api/admin/users?cedula=${documentId}`)
          if (!userResponse.ok) {
            throw new Error("Error de red al buscar el operador por documento.")
          }
          const userData = await userResponse.json()
          console.log("Respuesta de la API de usuarios:", userData)

          if (userData.success && userData.data && userData.data.length > 0) {
            const foundOperator = userData.data[0]
            if (foundOperator.codigo) {
              operatorCode = foundOperator.codigo
              console.log(`Código encontrado para el operador: ${operatorCode}`)
            } else {
              throw new Error(`Operador con documento ${documentId} no tiene un código asignado.`)
            }
          } else {
            throw new Error(`No se encontró un operador con el documento ${documentId}.`)
          }
        }

        if (!operatorCode) {
          throw new Error("No se pudo obtener el código del operador por un motivo desconocido.")
        }

        const bonusResponse = await fetch(`/api/user/bonuses?codigo=${operatorCode}`)
        if (!bonusResponse.ok) {
          const errorData = await bonusResponse.json().catch(() => ({}))
          throw new Error(errorData.error || "No se pudieron cargar los datos del bono.")
        }

        const bonusDataPayload = await bonusResponse.json()
        console.log("Datos de bonificación recibidos:", JSON.stringify(bonusDataPayload, null, 2))
        
        if (bonusDataPayload.success) {
          // Asegurarse de que deductions sea siempre un array
          if (!bonusDataPayload.deductions) {
            bonusDataPayload.deductions = []
          }
          
          // SOLUCIÓN DIRECTA: Forzar la creación de una deducción cuando hay diferencia entre bono base y final
          if (bonusDataPayload.baseBonus > bonusDataPayload.finalBonus) {
            console.log("DIFERENCIA DETECTADA entre bono base y final:", 
                        bonusDataPayload.baseBonus, "-", bonusDataPayload.finalBonus, 
                        "=", bonusDataPayload.baseBonus - bonusDataPayload.finalBonus)
            
            // Crear una deducción genérica con el monto exacto de la diferencia
            const deductionAmount = bonusDataPayload.baseBonus - bonusDataPayload.finalBonus
            
            // Verificar si ya existe una deducción con este monto para evitar duplicados
            const existingDeduction = bonusDataPayload.deductions.find((d: Deduction) => d.monto === deductionAmount)
            
            if (!existingDeduction) {
              console.log("Añadiendo deducción forzada por diferencia de montos")
              bonusDataPayload.deductions.push({
                id: Date.now(), // ID único basado en timestamp
                fecha: new Date().toISOString(),
                concepto: "Deducción aplicada",
                monto: deductionAmount,
                observaciones: "Deducción general al bono"
              })
            }
            
            // Marcar que se ha forzado una deducción
            bonusDataPayload.hasForcedDeduction = true
          }
          
          console.log("Datos de bonificación procesados:", JSON.stringify(bonusDataPayload, null, 2))
          console.log("Número de deducciones:", bonusDataPayload.deductions.length)
          console.log("Deducciones:", bonusDataPayload.deductions)
          
          setBonusData(bonusDataPayload)
        } else {
          throw new Error(bonusDataPayload.error || "Error en la respuesta de la API de bonos.")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado."
        setError(errorMessage)
        console.error("Error al obtener datos de bonificación:", errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOperatorAndBonusData()
  }, [operator])

  // Memoized calculations for better performance
  const bonusDetails = useMemo(() => calculateBonusDetails(operator), [operator])
  const colors = useMemo(() => getCategoryColor(operator.category), [operator.category])
  const performanceLevel = useMemo(() => getPerformanceLevel(operator.efficiency), [operator.efficiency])

  const weeklyStats = useMemo(() => {
    const weeklyAverage = operator.weeklyPerformance.reduce((a, b) => a + b) / operator.weeklyPerformance.length
    const maxPerformance = Math.max(...operator.weeklyPerformance)
    const minPerformance = Math.min(...operator.weeklyPerformance)
    const consistency = 100 - (maxPerformance - minPerformance)

    return { weeklyAverage, maxPerformance, minPerformance, consistency }
  }, [operator.weeklyPerformance])

  // Optimized event handlers
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operator-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Enhanced Header */}
        <header className={`relative p-8 bg-gradient-to-br ${colors.bg} overflow-hidden`}>
          {/* Background decoration - optimized */}
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 z-20 backdrop-blur-sm border border-white/20 group focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Cerrar modal de detalles del operador"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div className="relative z-10">
            {/* Main Profile Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8 mb-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-bold backdrop-blur-sm border border-white/30 shadow-lg">
                    {operator.avatar}
                  </div>
                  {operator.streak >= 30 && (
                    <div
                      className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse"
                      title={`Racha de ${operator.streak} días`}
                    >
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 id="operator-modal-title" className="text-4xl font-bold mb-2 text-white">
                    {operator.name}
                  </h1>
                  <p className="text-xl opacity-90 mb-1 text-white/90">{operator.position}</p>
                  <p className="opacity-75 text-white/75 mb-3">{operator.department}</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                      {getCategoryIcon(operator.category)}
                      <span className="font-semibold text-white">{operator.category}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                      {getTrendIcon(operator.trend || "stable")}
                      <span className="font-semibold text-white capitalize">
                        {operator.trend === "up" ? "Ascendente" : operator.trend === "down" ? "Descendente" : "Estable"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Badge */}
              <div className="lg:ml-auto">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{formatPercentage(operator.efficiency, 1)}</div>
                  <div className="text-white/80 text-sm font-medium mb-2">Eficiencia Global</div>
                  <div
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-${performanceLevel.color}-500/20 text-white border border-white/20`}
                  >
                    <performanceLevel.icon className="w-3 h-3" />
                    <span>{performanceLevel.level}</span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{performanceLevel.description}</div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Bonos Totales</span>
                </div>
                <div className="text-2xl font-bold text-white">$ {formatNumber(operator.bonus.total, true, 0)}</div>
                <div className="text-white/60 text-xs">
                  {formatPercentage(operator.bonus.percentage, 1)} del objetivo
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <MapPin className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Kilómetros</span>
                </div>
                <div className="text-2xl font-bold text-white">{formatNumber(bonusDetails.totalExecuted, true, 0)}</div>
                <div className="text-white/60 text-xs">
                  {bonusDetails.kmDifference >= 0 ? "+" : ""}
                  {formatNumber(bonusDetails.kmDifference, true, 0)} vs programado
                </div>
                <div className="text-white/60 text-xs">
                  {formatPercentage(bonusDetails.efficiencyRate, 1)} eficiencia
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <Flame className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Racha Activa</span>
                </div>
                <div className="text-2xl font-bold text-white">{operator.streak}</div>
                <div className="text-white/60 text-xs">días consecutivos</div>
                <div className="text-white/60 text-xs">
                  {operator.streak >= 30
                    ? "Racha excepcional"
                    : operator.streak >= 14
                      ? "Muy buena racha"
                      : "Construyendo racha"}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <Target className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Consistencia</span>
                </div>
                <div className="text-2xl font-bold text-white">{formatPercentage(weeklyStats.consistency, 0)}</div>
                <div className="text-white/60 text-xs">estabilidad semanal</div>
                <div className="text-white/60 text-xs">
                  Rango: {formatPercentage(weeklyStats.minPerformance, 0)} -{" "}
                  {formatPercentage(weeklyStats.maxPerformance, 0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-gray-50 border-b border-gray-200" role="tablist">
          <div className="flex space-x-8 px-8">
            {[
              {
                id: "overview",
                label: "Vista General",
                icon: BarChart3,
                description: "Información general y métricas principales",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                title={tab.description}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <main className="p-8 max-h-[60vh] overflow-y-auto">
          {activeTab === "overview" && (
            <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab" className="space-y-8">
              {/* Enhanced Performance Cards */}
              <section aria-labelledby="performance-section">
                <h2 id="performance-section" className="sr-only">
                  Métricas de rendimiento
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Detailed Bonus Performance */}
                  <article className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <header className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-800 text-lg">Análisis de Bonos</h3>
                          <p className="text-sm text-emerald-600">Rendimiento económico detallado</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-700">
                          $ {formatNumber(operator.bonus.total, true, 0)}
                        </div>
                        <div className="text-sm text-emerald-600">Total acumulado</div>
                      </div>
                    </header>

                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="relative mb-4">
                        <div className="w-full bg-emerald-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full transition-all duration-1000 relative"
                            style={{ width: `${Math.min(operator.bonus.percentage, 100)}%` }}
                            role="progressbar"
                            aria-valuenow={operator.bonus.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progreso de bonos: ${formatPercentage(operator.bonus.percentage, 1)}`}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="absolute -top-8 right-0 text-xs text-emerald-600 font-medium">
                          {formatPercentage(operator.bonus.percentage, 1)} del objetivo
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Enhanced KM Performance */}
                  <article className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <header className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Route className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-blue-800 text-lg">Análisis de Kilómetros</h3>
                          <p className="text-sm text-blue-600">Rendimiento operativo detallado</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-700">
                          {formatNumber(bonusDetails.totalExecuted, true, 0)}
                        </div>
                        <div className="text-sm text-blue-600">km ejecutados</div>
                      </div>
                    </header>

                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="relative mb-4">
                        <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 relative"
                            style={{ width: `${Math.min(bonusDetails.efficiencyRate, 100)}%` }}
                            role="progressbar"
                            aria-valuenow={bonusDetails.efficiencyRate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Eficiencia de kilómetros: ${formatPercentage(bonusDetails.efficiencyRate, 1)}`}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="absolute -top-8 right-0 text-xs text-blue-600 font-medium">
                          {formatPercentage(bonusDetails.efficiencyRate, 1)} de eficiencia
                        </div>
                      </div>

                      {/* KM Comparison */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/50 rounded-xl p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Ejecutados</span>
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {formatNumber(bonusDetails.totalExecuted, true, 0)}
                          </div>
                        </div>
                        <div className="bg-white/50 rounded-xl p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Programados</span>
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {formatNumber(bonusDetails.totalProgrammed, true, 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              {/* Enhanced Weekly Performance Chart */}
              <section aria-labelledby="weekly-performance">
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
                  <header className="flex items-center justify-between mb-6">
                    <h2 id="weekly-performance" className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <Calendar className="w-6 h-6 text-primary-600" />
                      <span>Rendimiento Semanal Detallado</span>
                    </h2>
                    <div className="text-sm text-gray-500">
                      Promedio: {formatPercentage(weeklyStats.weeklyAverage, 1)}
                    </div>
                  </header>

                  <div
                    className="flex items-end justify-between space-x-3 h-32 mb-6"
                    role="img"
                    aria-label="Gráfico de rendimiento semanal"
                  >
                    {operator.weeklyPerformance.map((value, index) => (
                      <div key={index} className="flex flex-col items-center space-y-2 flex-1 group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-gradient-to-t from-primary-400 to-primary-600 rounded-t-xl transition-all duration-700 hover:from-primary-500 hover:to-primary-700 relative overflow-hidden group-hover:shadow-lg cursor-pointer"
                            style={{ height: `${(value / 100) * 120}px` }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][index]}: ${formatPercentage(value, 1)} de rendimiento`}
                          >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg z-10">
                              {formatPercentage(value, 1)}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-primary-600 transition-colors">
                          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][index]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatPercentage(weeklyStats.maxPerformance, 1)}
                      </p>
                      <p className="text-xs text-gray-500">Máximo</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {formatPercentage(weeklyStats.weeklyAverage, 1)}
                      </p>
                      <p className="text-xs text-gray-500">Promedio</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">
                        {formatPercentage(weeklyStats.minPerformance, 1)}
                      </p>
                      <p className="text-xs text-gray-500">Mínimo</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {formatPercentage(weeklyStats.consistency, 1)}
                      </p>
                      <p className="text-xs text-gray-500">Consistencia</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "analytics" && (
            <div role="tabpanel" id="analytics-panel" aria-labelledby="analytics-tab" className="space-y-8">
              {/* Advanced Metrics Grid */}
              <section aria-labelledby="advanced-metrics">
                <h2 id="advanced-metrics" className="text-2xl font-bold text-gray-900 mb-6">
                  Métricas Avanzadas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-purple-800">ROI por Kilómetro</h3>
                        <p className="text-xs text-purple-600">Retorno de inversión optimizado</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 mb-2">
                      $ {formatNumber(bonusDetails.bonusPerKm, true, 0)}
                    </div>
                    <div className="text-sm text-purple-600">por kilómetro ejecutado</div>
                    <div className="mt-3 text-xs text-purple-500">
                      {bonusDetails.bonusPerKm > 15000
                        ? "Excelente ROI"
                        : bonusDetails.bonusPerKm > 10000
                          ? "Buen ROI"
                          : "ROI mejorable"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-indigo-800">Índice de Variabilidad</h3>
                        <p className="text-xs text-indigo-600">Estabilidad del rendimiento</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700 mb-2">
                      {formatPercentage(100 - weeklyStats.consistency, 1)}
                    </div>
                    <div className="text-sm text-indigo-600">desviación estándar</div>
                    <div className="mt-3 text-xs text-indigo-500">
                      {weeklyStats.consistency > 80
                        ? "Muy estable"
                        : weeklyStats.consistency > 60
                          ? "Moderadamente estable"
                          : "Inestable"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                        <Timer className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-teal-800">Productividad Diaria</h3>
                        <p className="text-xs text-teal-600">Promedio de actividad</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-teal-700 mb-2">
                      {formatNumber(bonusDetails.totalExecuted / 30, true, 0)}
                    </div>
                    <div className="text-sm text-teal-600">km por día</div>
                    <div className="mt-3 text-xs text-teal-500">Racha activa: {operator.streak} días</div>
                  </div>
                </div>
              </section>

              {/* Enhanced Comparative Analysis */}
              <section aria-labelledby="comparative-analysis">
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
                  <h2
                    id="comparative-analysis"
                    className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2"
                  >
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                    <span>Análisis Comparativo Detallado</span>
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Performance Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 mb-4">Métricas de Rendimiento</h3>

                      <div className="space-y-3">
                        {[
                          { label: "Eficiencia Global", value: operator.efficiency, benchmark: 85, color: "primary" },
                          {
                            label: "Cumplimiento KM",
                            value: bonusDetails.efficiencyRate,
                            benchmark: 95,
                            color: "blue",
                          },
                          {
                            label: "Consistencia Semanal",
                            value: weeklyStats.consistency,
                            benchmark: 80,
                            color: "purple",
                          },
                          {
                            label: "Rendimiento Bonos",
                            value: operator.bonus.percentage,
                            benchmark: 90,
                            color: "emerald",
                          },
                        ].map((metric, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600 font-medium">{metric.label}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-1000`}
                                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-gray-900 w-12 text-right">
                                {formatPercentage(metric.value, 0)}
                              </span>
                              {metric.value > metric.benchmark ? (
                                <ArrowUp className="w-4 h-4 text-emerald-500" title="Por encima del benchmark" />
                              ) : metric.value < metric.benchmark * 0.8 ? (
                                <ArrowDown className="w-4 h-4 text-red-500" title="Por debajo del benchmark" />
                              ) : (
                                <Minus className="w-4 h-4 text-gray-500" title="Dentro del rango esperado" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rankings and Achievements */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 mb-4">Rankings y Logros</h3>

                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <Award className="w-6 h-6 text-yellow-600" />
                            <span className="font-bold text-yellow-800">Ranking General</span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-700">Top 15%</div>
                          <div className="text-sm text-yellow-600">Entre todos los operadores activos</div>
                          <div className="text-xs text-yellow-500 mt-1">Basado en eficiencia global</div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            <span className="font-bold text-blue-800">Ranking Departamental</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-700">#3</div>
                          <div className="text-sm text-blue-600">En {operator.department}</div>
                          <div className="text-xs text-blue-500 mt-1">De 24 operadores activos</div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <Star className="w-6 h-6 text-emerald-600" />
                            <span className="font-bold text-emerald-800">Logros Recientes</span>
                          </div>
                          <div className="space-y-1 text-sm text-emerald-700">
                            <div>• Racha de {operator.streak} días</div>
                            <div>• {formatPercentage(operator.bonus.percentage, 0)} del objetivo mensual</div>
                            <div>• Categoría {operator.category} mantenida</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "insights" && (
            <div role="tabpanel" id="insights-panel" aria-labelledby="insights-tab" className="space-y-8">
              {/* Predictions and Insights */}
              <section aria-labelledby="predictions">
                <h2 id="predictions" className="text-2xl font-bold text-gray-900 mb-6">
                  Predicciones e Insights
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Enhanced Performance Prediction */}
                  <article className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-3xl p-6 border border-violet-200 shadow-lg">
                    <header className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-violet-800 text-lg">Proyección de Rendimiento</h3>
                        <p className="text-sm text-violet-600">Análisis predictivo - 30 días</p>
                      </div>
                    </header>

                    <div className="space-y-4">
                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-violet-700 font-medium">Bonos Proyectados</span>
                          <span className="font-bold text-violet-800">
                            ${" "}
                            {formatNumber(
                              operator.bonus.total *
                                (operator.trend === "up" ? 1.15 : operator.trend === "down" ? 0.95 : 1.05),
                              true,
                              0,
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-violet-600">
                          {operator.trend === "up"
                            ? "+15% por tendencia positiva"
                            : operator.trend === "down"
                              ? "-5% por tendencia negativa"
                              : "+5% crecimiento esperado"}
                        </div>
                      </div>

                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-violet-700 font-medium">KM Estimados</span>
                          <span className="font-bold text-violet-800">
                            {formatNumber(
                              bonusDetails.totalExecuted * (weeklyStats.consistency > 80 ? 1.1 : 1.05),
                              true,
                              0,
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-violet-600">
                          Basado en consistencia actual ({formatPercentage(weeklyStats.consistency, 0)})
                        </div>
                      </div>

                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-violet-700 font-medium">Probabilidad de Mejora</span>
                          <span className="font-bold text-violet-800">
                            {operator.trend === "up" ? "85%" : operator.trend === "down" ? "45%" : "65%"}
                          </span>
                        </div>
                        <div className="text-xs text-violet-600">Factores: tendencia, consistencia y racha actual</div>
                      </div>

                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-violet-700 font-medium">Riesgo de Categoría</span>
                          <span
                            className={`font-bold ${operator.efficiency > 90 ? "text-emerald-600" : operator.efficiency > 75 ? "text-yellow-600" : "text-red-600"}`}
                          >
                            {operator.efficiency > 90 ? "Bajo" : operator.efficiency > 75 ? "Medio" : "Alto"}
                          </span>
                        </div>
                        <div className="text-xs text-violet-600">Probabilidad de cambio de categoría</div>
                      </div>
                    </div>
                  </article>

                  {/* Enhanced Recommendations */}
                  <article className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 border border-amber-200 shadow-lg">
                    <header className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-800 text-lg">Recomendaciones Personalizadas</h3>
                        <p className="text-sm text-amber-600">Acciones para optimizar rendimiento</p>
                      </div>
                    </header>

                    <div className="space-y-3">
                      {[
                        {
                          priority: "Alta",
                          color: "red",
                          text:
                            weeklyStats.consistency < 70
                              ? "Mejorar consistencia semanal para reducir variabilidad"
                              : "Mantener el excelente nivel de consistencia actual",
                          impact: weeklyStats.consistency < 70 ? "+8% eficiencia" : "+2% estabilidad",
                          action:
                            weeklyStats.consistency < 70
                              ? "Revisar planificación semanal"
                              : "Continuar con rutina actual",
                        },
                        {
                          priority: bonusDetails.efficiencyRate < 95 ? "Alta" : "Media",
                          color: bonusDetails.efficiencyRate < 95 ? "red" : "yellow",
                          text:
                            bonusDetails.efficiencyRate < 95
                              ? "Optimizar cumplimiento de kilómetros programados"
                              : "Explorar rutas adicionales para bonos extra",
                          impact: bonusDetails.efficiencyRate < 95 ? "+12% bonos" : "+5% bonos",
                          action:
                            bonusDetails.efficiencyRate < 95
                              ? "Analizar rutas no completadas"
                              : "Identificar oportunidades adicionales",
                        },
                        {
                          priority: operator.streak < 14 ? "Media" : "Baja",
                          color: operator.streak < 14 ? "yellow" : "green",
                          text:
                            operator.streak < 14
                              ? "Construir racha consistente para bonificaciones"
                              : "Mantener racha excepcional actual",
                          impact: operator.streak < 14 ? "+6% categoría" : "+3% bonos",
                          action: operator.streak < 14 ? "Establecer rutina diaria" : "Continuar con disciplina actual",
                        },
                      ].map((rec, index) => (
                        <div
                          key={index}
                          className="bg-white/50 rounded-xl p-4 hover:bg-white/70 transition-all duration-300 cursor-pointer"
                          tabIndex={0}
                          role="button"
                          aria-label={`Recomendación ${rec.priority}: ${rec.text}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 bg-${rec.color}-500`}></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded-full bg-${rec.color}-100 text-${rec.color}-800`}
                                >
                                  {rec.priority}
                                </span>
                                <span className="text-xs text-amber-600 font-medium">{rec.impact}</span>
                              </div>
                              <p className="text-sm text-amber-700 font-medium mb-1">{rec.text}</p>
                              <p className="text-xs text-amber-600">Acción: {rec.action}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </section>

              {/* Enhanced Goals and Targets */}
              <section aria-labelledby="goals-targets">
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
                  <h2 id="goals-targets" className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                    <Target className="w-6 h-6 text-primary-600" />
                    <span>Objetivos y Metas Personalizadas</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-emerald-800 mb-2">Meta Mensual Bonos</h3>
                      <div className="text-2xl font-bold text-emerald-700 mb-1">
                        $ {formatNumber(operator.monthlyGoal || 600000, true, 0)}
                      </div>
                      <div className="text-sm text-emerald-600 mb-2">
                        Progreso: {formatPercentage((operator.bonus.total / (operator.monthlyGoal || 600000)) * 100, 0)}
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((operator.bonus.total / (operator.monthlyGoal || 600000)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-emerald-500 mt-2">
                        Faltan $ {formatNumber((operator.monthlyGoal || 600000) - operator.bonus.total, true, 0)}
                      </div>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Route className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-blue-800 mb-2">Meta KM Optimizada</h3>
                      <div className="text-2xl font-bold text-blue-700 mb-1">
                        {formatNumber(bonusDetails.totalProgrammed * 1.08, true, 0)}
                      </div>
                      <div className="text-sm text-blue-600 mb-2">
                        Progreso:{" "}
                        {formatPercentage(
                          (bonusDetails.totalExecuted / (bonusDetails.totalProgrammed * 1.08)) * 100,
                          0,
                        )}
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((bonusDetails.totalExecuted / (bonusDetails.totalProgrammed * 1.08)) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-blue-500 mt-2">Objetivo: +8% sobre programado</div>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-purple-800 mb-2">Objetivo de Categoría</h3>
                      <div className="text-2xl font-bold text-purple-700 mb-1">
                        {operator.efficiency > 95
                          ? "Mantener Oro"
                          : operator.efficiency > 85
                            ? "Alcanzar Oro"
                            : "Subir a Plata"}
                      </div>
                      <div className="text-sm text-purple-600 mb-2">
                        Eficiencia requerida:{" "}
                        {operator.efficiency > 95 ? "95%" : operator.efficiency > 85 ? "95%" : "85%"}
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(operator.efficiency, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-purple-500 mt-2">
                        {operator.trend === "up" ? "En buen camino" : "Requiere esfuerzo adicional"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
