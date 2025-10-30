"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
    Loader2,
    Info,
    X,
    DollarSign,
    TrendingDown,
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
    Sparkles,
    TrendingUp,
    BarChart3,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

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

interface MonthlyPerformance {
    month: string
    monthNumber: number
    percentage: number
    baseBonus: number
    finalBonus: number
    deductionAmount: number
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(amount)

function calcularValorActual(d: Deduction, baseBonus: number): number {
    if (typeof d.porcentaje === "string" && d.porcentaje.toLowerCase().includes("día")) {
        const dias = d.dias || 1
        return 4733 * dias
    } else if (typeof d.porcentaje === "number") {
        return Math.round((baseBonus * d.porcentaje * 100) / 100)
    } else if (typeof d.porcentaje === "string") {
        const numValue = Number.parseFloat(d.porcentaje)
        if (!isNaN(numValue)) {
            return Math.round((baseBonus * numValue * 100) / 100)
        }
    }
    return 0
}

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
    if (numPercentage >= 20) return { color: "green", label: "Alto", icon: XCircle }
    if (numPercentage >= 10) return { color: "green", label: "Medio", icon: AlertCircle }
    if (numPercentage > 0) return { color: "green", label: "Bajo", icon: MinusCircle }
    return { color: "green", label: "Sin impacto", icon: CheckCircle }
}

const getAvailableMonthsForYear = async (userCode: string, year: number): Promise<number[]> => {
    try {
        // Get current date to limit future months
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1
        
        const availableMonths: number[] = []
        
        // Determine the maximum month to check based on the year
        let maxMonth = 12 // Default to all months for past years
        if (year === currentYear) {
            maxMonth = currentMonth // For current year, up to current month
        } else if (year > currentYear) {
            return [] // No data for future years
        }
        
        // Check each month to see if it has real data
        for (let month = 1; month <= maxMonth; month++) {
            try {
                const res = await fetch(`/api/user/bonuses?codigo=${userCode}&year=${year}&month=${month}`)
                if (res.ok) {
                    const json = await res.json()
                    const payload = json?.data ?? json
                    
                    // Only include months with real data:
                    // Real data = records exist in database (even if codigo_factor 0)
                    // No data = no records found (person didn't work that month)
                    // Check for explicit "no data" message from API
                    const isDefaultResponse = payload.message && 
                                             payload.message.includes('No se encontraron novedades')
                    
                    // Has real data if: 
                    // 1. Has deductions (with or without amounts), OR
                    // 2. Has baseBonus but is NOT a default "no data" response
                    const hasRealData = !isDefaultResponse && 
                                       payload.baseBonus && 
                                       payload.baseBonus > 0
                    
                    if (hasRealData) {
                        availableMonths.push(month)
                    }
                }
            } catch (err) {
                // Skip months with errors
                continue
            }
        }
        
        return availableMonths
    } catch (error) {
        console.error("Error getting available months for year:", error)
        return []
    }
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
    const [detalleNovedades, setDetalleNovedades] = useState<any[] | null>(null)
    const [detalleLoading, setDetalleLoading] = useState(false)
    const [detalleModal, setDetalleModal] = useState<{ codigo: string; year: number; descripcion: string } | null>(null)
    const [showDeductionsTable, setShowDeductionsTable] = useState(false)
    const [selectedFaultCode, setSelectedFaultCode] = useState<string | null>(null)
    const [showFaultDetailsModal, setShowFaultDetailsModal] = useState(false)
    const [selectedFaultDetails, setSelectedFaultDetails] = useState<{
        codigo: string
        descripcion: string
        year?: number
        deductions: Deduction[]
    } | null>(null)
    const [faultDetailsLoading, setFaultDetailsLoading] = useState(false)

    const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([])
    const [chartYear, setChartYear] = useState<number>(new Date().getFullYear())
    const [performanceLoading, setPerformanceLoading] = useState(false)

    useEffect(() => {
        if (data?.deductions) {
            const daysByYear: { [key: string]: { [year: number]: number } } = {}

            data.deductions.forEach((deduction) => {
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

    useEffect(() => {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1

        if (!selectedYear && !selectedMonth) {
            setSelectedYear(currentYear)
            setSelectedMonth(currentMonth)
        }
    }, [])

    useEffect(() => {
        const fetchMonthlyPerformance = async () => {
            if (!chartYear) return

            try {
                setPerformanceLoading(true)
                const monthlyData: MonthlyPerformance[] = []

                // First get available months for the selected year
                const availableMonthsForYear = await getAvailableMonthsForYear(userCode, chartYear)
                
                // Fetch data only for months with available data
                for (const month of availableMonthsForYear) {
                    try {
                        const res = await fetch(`/api/user/bonuses?codigo=${userCode}&year=${chartYear}&month=${month}`)
                        if (res.ok) {
                            const json = await res.json()
                            const payload = json?.data ?? json

                            // Only add if there's real data (records exist in database)
                            // Exclude default responses when no records found
                            const isDefaultResponse = payload.message && 
                                                     payload.message.includes('No se encontraron novedades')
                            
                            const hasRealData = !isDefaultResponse && 
                                               payload.baseBonus && 
                                               payload.baseBonus > 0
                            
                            if (hasRealData) {
                                const percentage = (payload.finalBonus / payload.baseBonus) * 100

                                monthlyData.push({
                                    month: obtenerNombreMes(month).substring(0, 3),
                                    monthNumber: month,
                                    percentage: Math.round(percentage * 10) / 10,
                                    baseBonus: payload.baseBonus,
                                    finalBonus: payload.finalBonus,
                                    deductionAmount: payload.deductionAmount || 0,
                                })
                            }
                        }
                    } catch (err) {
                        // Skip months with no data
                        console.log(`No data for month ${month}`)
                    }
                }

                // Sort by month number to ensure chronological order
                monthlyData.sort((a, b) => a.monthNumber - b.monthNumber)

                setMonthlyPerformance(monthlyData)
            } catch (error) {
                console.error("Error fetching monthly performance:", error)
            } finally {
                setPerformanceLoading(false)
            }
        }

        if (userCode && chartYear) {
            fetchMonthlyPerformance()
        }
    }, [userCode, chartYear])

    const handleOpenDetalle = async (codigo: string, year: number, descripcion: string) => {
        setDetalleModal({ codigo, year, descripcion })
        setDetalleLoading(true)
        setDetalleNovedades(null)
        try {
            const res = await fetch(`/api/user/faults?codigo=${userCode}&codigo=${codigo}&year=${year}&detalle=1`)
            const json = await res.json()
            setDetalleNovedades(json?.data ?? json)
        } catch (e) {
            setDetalleNovedades([])
        } finally {
            setDetalleLoading(false)
        }
    }

    const handleOpenDeductionsTable = (codigo: string) => {
        setSelectedFaultCode(codigo)
        setShowDeductionsTable(true)
    }

    const handleOpenFaultDetails = async (codigo: string, descripcion: string, year?: number) => {
        setFaultDetailsLoading(true)
        setShowFaultDetailsModal(true)
        setSelectedFaultDetails({ codigo, descripcion, year, deductions: [] })

        try {
            const filteredDeductions =
                data?.deductions?.filter((deduction) => {
                    const matchesCode = deduction.codigo === codigo
                    const matchesYear = year ? new Date(deduction.fechaInicio).getFullYear() === year : true
                    return matchesCode && matchesYear
                }) || []

            setSelectedFaultDetails({
                codigo,
                descripcion,
                year,
                deductions: filteredDeductions,
            })
        } catch (error) {
            console.error("Error al cargar detalles de falta:", error)
        } finally {
            setFaultDetailsLoading(false)
        }
    }

    useEffect(() => {
        const fetchBonus = async () => {
            try {
                setLoading(true)
                setError(null)
                let url = `/api/user/bonuses?codigo=${userCode}`
                if (selectedYear) url += `&year=${selectedYear}`
                if (selectedMonth) url += `&month=${selectedMonth}`

                const res = await fetch(url)
                if (!res.ok) throw new Error("Error al obtener datos de bonos")
                const json = await res.json()
                const payload = json?.data ?? json

                const processedPayload = {
                    ...payload,
                    deductions: Array.isArray(payload.deductions) ? payload.deductions : [],
                }

                setData(processedPayload)
                setAvailableYears(processedPayload.availableYears || [])
                setAvailableMonths(processedPayload.availableMonths || [])
            } catch (err: any) {
                setError(err.message ?? "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        const fetchFaults = async () => {
            try {
                setFaultsLoading(true)
                const res = await fetch(`/api/user/faults?codigo=${userCode}`)
                if (!res.ok) throw new Error("Error al obtener datos de Novedades")
                const json = await res.json()
                setFaultsData(json?.data ?? json)
            } catch (err: any) {
                setFaultsData(null)
            } finally {
                setFaultsLoading(false)
            }
        }

        if (userCode) {
            fetchBonus()
            fetchFaults()
        }
    }, [userCode, selectedYear, selectedMonth])

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce-subtle">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-green-200 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                </div>
                <p className="text-green-800 font-semibold mt-6 animate-pulse">Cargando datos de bonificaciones...</p>
            </div>
        )

    if (error)
        return (
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-shake">
                    <X className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Error al cargar datos</h3>
                <p className="text-green-700">{error}</p>
            </div>
        )

    if (!data)
        return (
            <div className="bg-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Sin datos disponibles</h3>
                <p className="text-green-700">
                    {selectedYear && selectedMonth
                        ? `No se encontraron registros de bonificaciones para ${obtenerNombreMes(selectedMonth)} ${selectedYear}`
                        : "No se encontraron registros de bonificaciones"}
                </p>
            </div>
        )

    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-green-50 via-white to-green-50 scroll-smooth">
                <div className="space-y-8 pb-20 p-6 animate-fade-in">
                    <div className="flex items-center gap-4 mb-6 animate-slide-in-from-top">
                        <div className="relative group">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -inset-1 bg-green-300 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-4xl font-bold text-green-900 mb-1">Análisis de Bonificaciones</h2>
                            <p className="text-green-700 text-lg">Seguimiento detallado de bonos y deducciones</p>
                            {selectedYear && selectedMonth && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap animate-fade-in">
                                    <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-900 rounded-full text-sm font-semibold border-2 border-green-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                        {obtenerNombreMes(selectedMonth)} {selectedYear}
                                    </div>
                                    {data && (data.deductionAmount ?? 0) === 0 && (
                                        <div className="px-4 py-2 bg-gradient-to-r from-green-200 to-green-300 text-green-900 rounded-full text-sm font-semibold flex items-center gap-2 border-2 border-green-400 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 animate-bounce-subtle">
                                            <CheckCircle className="w-4 h-4" />
                                            Bono Completo
                                            <Sparkles className="w-3 h-3" />
                                        </div>
                                    )}
                                    {data && (data.deductionAmount ?? 0) > 0 && (
                                        <div className="px-4 py-2 bg-white text-green-900 rounded-full text-sm font-semibold flex items-center gap-2 border-2 border-green-400 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <TrendingDown className="w-4 h-4" />
                                            Con Deducciones
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {loading && (
                            <div className="flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 rounded-xl border-2 border-green-200 shadow-md animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-semibold">Cargando...</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all duration-300 animate-slide-in-from-left">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="group">
                                <label className="flex items-center gap-2 text-sm font-semibold text-green-800 mb-3">
                                    <Calendar className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                    Año
                                </label>
                                <select
                                    className="w-full bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 text-green-900 font-medium shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
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
                            <div className="group">
                                <label className="flex items-center gap-2 text-sm font-semibold text-green-800 mb-3">
                                    <Clock className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                    Mes
                                </label>
                                <select
                                    className="w-full bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 text-green-900 font-medium shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
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
                                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                        onClick={() => {
                                            setSelectedYear(null)
                                            setSelectedMonth(null)
                                        }}
                                    >
                                        <X className="w-5 h-5" />
                                        Limpiar Filtros
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-from-bottom">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Calculator className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-700 font-semibold mb-1">Bono Base</p>
                                    <p className="text-xl font-bold text-green-900">{formatCurrency(data.baseBonus ?? 0)}</p>
                                </div>
                            </div>
                            <div className="h-1 bg-gradient-to-r from-green-200 to-green-400 rounded-full"></div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <TrendingDown className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-700 font-semibold mb-1">Deducción</p>
                                    <p className="text-xl font-bold text-green-800">{formatCurrency(data.deductionAmount ?? 0)}</p>
                                </div>
                            </div>
                            <div className="h-1 bg-gradient-to-r from-green-200 to-green-400 rounded-full"></div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Percent className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-700 font-semibold mb-1">% Descuento</p>
                                    <p className="text-xl font-bold text-green-800">{(data.deductionPercentage ?? 0).toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="h-1 bg-gradient-to-r from-green-200 to-green-400 rounded-full"></div>
                        </div>

                        <div
                            className={`rounded-2xl p-6 shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group ${
                                (data.deductionAmount ?? 0) === 0
                                    ? "bg-gradient-to-br from-green-100 via-green-200 to-green-300 border-green-400"
                                    : "bg-white border-green-200"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                                        (data.deductionAmount ?? 0) === 0
                                            ? "bg-green-300 shadow-lg"
                                            : "bg-gradient-to-br from-green-100 to-green-200"
                                    }`}
                                >
                                    <CheckCircle
                                        className={`w-6 h-6 ${(data.deductionAmount ?? 0) === 0 ? "text-green-800" : "text-green-600"}`}
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-700 font-semibold mb-1">Bono Final</p>
                                    <p className="text-xl font-bold text-green-900">{formatCurrency(data.finalBonus ?? 0)}</p>
                                    {(data.deductionAmount ?? 0) === 0 && selectedYear && selectedMonth && (
                                        <div className="text-xs text-green-800 font-bold mt-1 flex items-center gap-1 justify-end animate-bounce-subtle">
                                            <Sparkles className="w-3 h-3" />
                                            ¡Completo!
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`h-1 rounded-full ${
                                    (data.deductionAmount ?? 0) === 0
                                        ? "bg-gradient-to-r from-green-400 to-green-600"
                                        : "bg-gradient-to-r from-green-200 to-green-400"
                                }`}
                            ></div>
                        </div>
                    </div>

                    {selectedYear && selectedMonth && (data.deductionAmount ?? 0) === 0 && (
                        <div className="bg-gradient-to-r from-green-100 via-green-200 to-green-300 rounded-2xl p-8 border-2 border-green-400 shadow-2xl animate-fade-in hover:shadow-3xl transition-all duration-300">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-xl animate-bounce-subtle">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute -inset-2 bg-green-400 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-2xl font-bold text-green-900 mb-2 flex items-center gap-2">
                                        Bono Completo en {obtenerNombreMes(selectedMonth)} {selectedYear}
                                        <Sparkles className="w-5 h-5 text-green-700 animate-pulse" />
                                    </h4>
                                    <p className="text-green-800 text-base">
                                        No se registraron deducciones que afecten este mes. El bono se mantiene completo.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-900 mb-1">{formatCurrency(data.baseBonus ?? 0)}</div>
                                    <div className="text-sm text-green-800 font-semibold">Bono íntegro</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden hover:shadow-3xl transition-all duration-300 animate-slide-in-from-right">
                        <div className="bg-gradient-to-r from-green-100 via-green-200 to-green-100 px-6 py-5 border-b-2 border-green-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <AlertTriangle className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute -inset-1 bg-green-400 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-900">Historial Completo de Novedades</h3>
                                        <p className="text-sm text-green-800">Registro detallado de todas las incidencias por año</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {faultsData && faultsData.data && faultsData.data.length > 0 && (
                                        <div className="bg-gradient-to-r from-green-200 to-green-300 px-4 py-2 rounded-xl border-2 border-green-400 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <span className="text-sm font-bold text-green-900">
                        {faultsData.data.length} tipos de Novedades registradas
                      </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setShowFaultsMatrix(!showFaultsMatrix)}
                                        className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                                            showFaultsMatrix
                                                ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
                                                : "bg-white text-green-800 border-2 border-green-300 hover:bg-green-50"
                                        }`}
                                    >
                                        {showFaultsMatrix ? (
                                            <>
                                                <ChevronUp className="w-5 h-5" />
                                                Ocultar Matriz
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-5 h-5" />
                                                Ver Matriz Completa
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showFaultsMatrix && (
                            <div className="p-6 animate-fade-in">
                                {faultsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="relative">
                                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                            <div className="absolute -inset-2 bg-green-200 rounded-full blur-lg opacity-30 animate-pulse"></div>
                                        </div>
                                        <span className="text-green-800 font-semibold ml-4">
                      Cargando historial completo de Novedades...
                    </span>
                                    </div>
                                ) : faultsData && faultsData.data && faultsData.data.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="bg-gradient-to-r from-green-50 via-green-100 to-green-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300">
                                            <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                                                <Calculator className="w-5 h-5" />
                                                Resumen Estadístico
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <div className="text-center group">
                                                    <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                        {Object.values(faultsData.totalByYear).reduce((a, b) => a + b, 0)}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-700">Total Novedades</div>
                                                    <div className="text-xs text-green-600 mt-1">Historial completo</div>
                                                </div>
                                                <div className="text-center group">
                                                    <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                        {faultsData.availableYears.length}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-700">Años con Registro</div>
                                                    <div className="text-xs text-green-600 mt-1">
                                                        {Math.min(...faultsData.availableYears)} - {Math.max(...faultsData.availableYears)}
                                                    </div>
                                                </div>
                                                <div className="text-center group">
                                                    <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                        {faultsData.data.length}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-700">Tipos Diferentes</div>
                                                    <div className="text-xs text-green-600 mt-1">Códigos únicos</div>
                                                </div>
                                                <div className="text-center group">
                                                    <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                        {(
                                                            Object.values(faultsData.totalByYear).reduce((a, b) => a + b, 0) /
                                                            faultsData.availableYears.length
                                                        ).toFixed(1)}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-700">Promedio Anual</div>
                                                    <div className="text-xs text-green-600 mt-1">Novedades por año</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xl font-bold text-green-900 mb-5 flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                Distribución por Año
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                {faultsData.availableYears.map((year, index) => {
                                                    const yearTotal = faultsData.totalByYear[year] || 0
                                                    const maxTotal = Math.max(...Object.values(faultsData.totalByYear))
                                                    const percentage = maxTotal > 0 ? (yearTotal / maxTotal) * 100 : 0
                                                    return (
                                                        <div
                                                            key={year}
                                                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-green-200 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group animate-fade-in"
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                        >
                                                            <div className="text-center">
                                                                <div className="text-3xl font-bold text-green-900 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                                    {yearTotal}
                                                                </div>
                                                                <div className="text-base font-bold text-green-700">{year}</div>
                                                                <div className="text-xs text-green-600 mb-3">Total Novedades</div>
                                                                <div className="w-full bg-green-200 rounded-full h-2.5 overflow-hidden">
                                                                    <div
                                                                        className="bg-gradient-to-r from-green-600 to-green-700 h-2.5 rounded-full transition-all duration-1000 ease-out"
                                                                        style={{ width: `${percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xl font-bold text-green-900 mb-5 flex items-center gap-2">
                                                <FileText className="w-5 h-5" />
                                                Matriz Detallada de Incidencias
                                            </h4>
                                            <div className="overflow-x-auto rounded-2xl shadow-xl border-2 border-green-200">
                                                <table className="min-w-full border-collapse">
                                                    <thead>
                                                    <tr className="bg-gradient-to-r from-green-200 via-green-300 to-green-200">
                                                        <th className="border-2 border-green-400 px-5 py-4 text-left text-sm font-bold text-green-900 sticky left-0 bg-green-200 min-w-[200px]">
                                                            Tipo de Falta
                                                        </th>
                                                        <th className="border-2 border-green-400 px-4 py-4 text-center text-sm font-bold text-green-900 min-w-[60px]">
                                                            Código
                                                        </th>
                                                        {faultsData.availableYears.map((year) => (
                                                            <th
                                                                key={year}
                                                                className="border-2 border-green-400 px-5 py-4 text-center text-sm font-bold text-green-900 min-w-[80px]"
                                                            >
                                                                {year}
                                                            </th>
                                                        ))}
                                                        <th className="border-2 border-green-400 px-5 py-4 text-center text-sm font-bold text-green-900 min-w-[80px]">
                                                            Total Novedades
                                                        </th>
                                                        <th className="border-2 border-green-400 px-5 py-4 text-center text-sm font-bold text-green-900 min-w-[80px]">
                                                            Total Días
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {faultsData.data
                                                        .sort((a, b) => {
                                                            const totalA = Object.values(a.years).reduce((sum, count) => sum + count, 0)
                                                            const totalB = Object.values(b.years).reduce((sum, count) => sum + count, 0)
                                                            return totalB - totalA
                                                        })
                                                        .map((fault, index) => {
                                                            const totalFaults = Object.values(fault.years).reduce((sum, count) => sum + count, 0)
                                                            const hasIncidents = totalFaults > 0
                                                            return (
                                                                <tr
                                                                    key={fault.codigo}
                                                                    className={`${index % 2 === 0 ? "bg-white" : "bg-green-50"} hover:bg-green-100 transition-all duration-200`}
                                                                >
                                                                    <td className="border border-green-300 px-5 py-4 sticky left-0 bg-inherit">
                                                                        <div className="flex items-center gap-3">
                                                                            <div
                                                                                className={`w-3 h-3 rounded-full ${hasIncidents ? "bg-green-600 animate-pulse" : "bg-green-300"}`}
                                                                            ></div>
                                                                            <span className="text-sm font-semibold text-green-900">
                                          {fault.descripcion}
                                        </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="border border-green-300 px-4 py-4 text-center">
                                      <span
                                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                                              hasIncidents
                                                  ? "bg-green-200 text-green-900 shadow-md"
                                                  : "bg-white text-green-700 border-2 border-green-300"
                                          }`}
                                      >
                                        {fault.codigo}
                                      </span>
                                                                    </td>
                                                                    {faultsData.availableYears.map((year) => {
                                                                        const count = fault.years[year] || 0
                                                                        const days = faultDaysByYear[fault.codigo]?.[year] || 0
                                                                        return (
                                                                            <td key={year} className="border border-green-300 px-5 py-4 text-center">
                                                                                {count > 0 ? (
                                                                                    <div className="flex flex-col items-center gap-1">
                                                                                        <button
                                                                                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-300 hover:scale-125 hover:rotate-3 shadow-md hover:shadow-lg
                                                                                                ${
                                                                                                count >= 5
                                                                                                    ? "bg-gradient-to-br from-green-700 to-green-800 text-white"
                                                                                                    : count >= 3
                                                                                                        ? "bg-gradient-to-br from-green-600 to-green-700 text-white"
                                                                                                        : count >= 1
                                                                                                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                                                                                                            : "bg-white text-green-700 border-2 border-green-300"
                                                                                            }`}
                                                                                            title={`Ver detalles de ${fault.descripcion} en ${year}`}
                                                                                            onClick={() =>
                                                                                                handleOpenFaultDetails(fault.codigo, fault.descripcion, year)
                                                                                            }
                                                                                        >
                                                                                            {count}
                                                                                        </button>
                                                                                        {days > 0 && (
                                                                                            <span className="text-xs text-green-700 font-semibold">({days}d)</span>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-green-400 text-lg">-</span>
                                                                                )}
                                                                            </td>
                                                                        )
                                                                    })}
                                                                    <td className="border border-green-300 px-5 py-4 text-center">
                                                                        {totalFaults > 0 ? (
                                                                            <span
                                                                                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 ${
                                                                                    totalFaults >= 10
                                                                                        ? "bg-gradient-to-br from-green-700 to-green-800 text-white"
                                                                                        : totalFaults >= 5
                                                                                            ? "bg-gradient-to-br from-green-600 to-green-700 text-white"
                                                                                            : "bg-gradient-to-br from-green-500 to-green-600 text-white"
                                                                                }`}
                                                                            >
                                          {totalFaults}
                                        </span>
                                                                        ) : (
                                                                            <span className="text-green-700 font-bold text-sm">Sin Novedades</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="border border-green-300 px-5 py-4 text-center">
                                                                        {(() => {
                                                                            const totalDays = Object.values(faultDaysByYear[fault.codigo] || {}).reduce(
                                                                                (sum: number, days: number) => sum + days,
                                                                                0,
                                                                            )
                                                                            return totalDays > 0 ? (
                                                                                <span
                                                                                    className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 ${
                                                                                        totalDays >= 30
                                                                                            ? "bg-gradient-to-br from-green-800 to-green-900 text-white"
                                                                                            : totalDays >= 15
                                                                                                ? "bg-gradient-to-br from-green-700 to-green-800 text-white"
                                                                                                : totalDays >= 5
                                                                                                    ? "bg-gradient-to-br from-green-600 to-green-700 text-white"
                                                                                                    : "bg-gradient-to-br from-green-500 to-green-600 text-white"
                                                                                    }`}
                                                                                    title={`Total de días históricos: ${totalDays}`}
                                                                                >
                                            {totalDays}d
                                          </span>
                                                                            ) : (
                                                                                <span className="text-green-700 font-bold text-sm">0d</span>
                                                                            )
                                                                        })()}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    <tr className="bg-gradient-to-r from-green-200 via-green-300 to-green-200 font-bold">
                                                        <td className="border-2 border-green-500 px-5 py-4 sticky left-0 bg-green-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full bg-green-800 animate-pulse"></div>
                                                                <span className="text-sm font-bold text-green-900">TOTAL HISTÓRICO</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-2 border-green-500 px-4 py-4 text-center">
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-300 text-green-900 shadow-md">
                                  ALL
                                </span>
                                                        </td>
                                                        {faultsData.availableYears.map((year) => {
                                                            const yearTotal = faultsData.totalByYear[year] || 0
                                                            const yearTotalDays = Object.values(faultDaysByYear).reduce((sum, faultYears) => {
                                                                return sum + (faultYears[year] || 0)
                                                            }, 0)
                                                            return (
                                                                <td key={year} className="border-2 border-green-500 px-5 py-4 text-center">
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <span className="text-base font-bold text-green-900">{yearTotal}</span>
                                                                        {yearTotalDays > 0 && (
                                                                            <span className="text-xs text-green-800 font-semibold">({yearTotalDays}d)</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )
                                                        })}
                                                        <td className="border-2 border-green-500 px-5 py-4 text-center">
                                <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-br from-green-700 to-green-800 text-white shadow-lg">
                                  {Object.values(faultsData.totalByYear).reduce((a, b) => a + b, 0)}
                                </span>
                                                        </td>
                                                        <td className="border-2 border-green-500 px-5 py-4 text-center">
                                <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-br from-green-700 to-green-800 text-white shadow-lg">
                                  {Object.values(faultDaysByYear).reduce((sum, faultYears) => {
                                      return (
                                          sum +
                                          Object.values(faultYears).reduce(
                                              (yearSum: number, days: number) => yearSum + days,
                                              0,
                                          )
                                      )
                                  }, 0)}
                                    d
                                </span>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {faultsData.availableYears.length > 1 && (
                                            <div className="bg-gradient-to-r from-green-50 via-green-100 to-green-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300">
                                                <h4 className="text-xl font-bold text-green-900 mb-5 flex items-center gap-2">
                                                    <TrendingDown className="w-5 h-5" />
                                                    Análisis de Tendencias
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="text-center group">
                                                        <div className="text-3xl font-bold text-green-800 mb-2 group-hover:scale-110 transition-transform duration-300">
                                                            {faultsData.totalByYear[Math.max(...faultsData.availableYears)] || 0}
                                                        </div>
                                                        <div className="text-sm font-bold text-green-700">Año Más Reciente</div>
                                                        <div className="text-xs text-green-600 mt-1">{Math.max(...faultsData.availableYears)}</div>
                                                    </div>
                                                    <div className="text-center group">
                                                        <div className="text-3xl font-bold text-green-800 mb-2 group-hover:scale-110 transition-transform duration-300">
                                                            {Math.max(...Object.values(faultsData.totalByYear))}
                                                        </div>
                                                        <div className="text-sm font-bold text-green-700">Año con Más Novedades</div>
                                                        <div className="text-xs text-green-600 mt-1">
                                                            {Object.keys(faultsData.totalByYear).find(
                                                                (year) =>
                                                                    faultsData.totalByYear[Number(year)] ===
                                                                    Math.max(...Object.values(faultsData.totalByYear)),
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center group">
                                                        <div className="text-3xl font-bold text-green-800 mb-2 group-hover:scale-110 transition-transform duration-300">
                                                            {Math.min(...Object.values(faultsData.totalByYear))}
                                                        </div>
                                                        <div className="text-sm font-bold text-green-700">Año con Menos Novedades</div>
                                                        <div className="text-xs text-green-600 mt-1">
                                                            {Object.keys(faultsData.totalByYear).find(
                                                                (year) =>
                                                                    faultsData.totalByYear[Number(year)] ===
                                                                    Math.min(...Object.values(faultsData.totalByYear)),
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 animate-fade-in">
                                        <div className="relative inline-block">
                                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                                                <CheckCircle className="w-10 h-10 text-green-600" />
                                            </div>
                                            <div className="absolute -inset-2 bg-green-200 rounded-3xl blur-xl opacity-30"></div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-green-800 mb-3">¡Excelente Historial!</h3>
                                        <p className="text-green-700 text-lg">
                                            No se encontraron Novedades registradas en todo el período analizado
                                        </p>
                                        <div className="mt-4 text-sm text-green-600 font-medium">
                                            Esto indica un desempeño ejemplar sin incidencias disciplinarias
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden hover:shadow-3xl transition-all duration-300 animate-slide-in-from-right">
                        <div className="bg-gradient-to-r from-green-100 via-green-200 to-green-100 px-6 py-5 border-b-2 border-green-300">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <BarChart3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute -inset-1 bg-green-400 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-900">Rendimiento Mensual del Bono</h3>
                                        <p className="text-sm text-green-800">Porcentaje de cumplimiento mes a mes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-green-800 mb-2">
                                            <Calendar className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                                            Año del Gráfico
                                        </label>
                                        <select
                                            className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 text-green-900 font-bold shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                                            value={chartYear}
                                            onChange={(e) => setChartYear(Number(e.target.value))}
                                        >
                                            {availableYears.map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 animate-fade-in">
                            {performanceLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="relative">
                                        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                                        <div className="absolute -inset-3 bg-green-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                    </div>
                                    <span className="text-green-800 font-bold ml-4 text-lg">Cargando datos mensuales...</span>
                                </div>
                            ) : monthlyPerformance.length > 0 ? (
                                <div className="space-y-8">
                                    {/* Statistics Summary */}
                                    <div className="bg-gradient-to-r from-green-50 via-green-100 to-green-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            Estadísticas del Año {chartYear}
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="text-center group">
                                                <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                    {(
                                                        monthlyPerformance.reduce((sum, m) => sum + m.percentage, 0) / monthlyPerformance.length
                                                    ).toFixed(1)}
                                                    %
                                                </div>
                                                <div className="text-sm font-bold text-green-700">Promedio Anual</div>
                                                <div className="text-xs text-green-600 mt-1">Cumplimiento general</div>
                                            </div>
                                            <div className="text-center group">
                                                <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                    {Math.max(...monthlyPerformance.map((m) => m.percentage)).toFixed(1)}%
                                                </div>
                                                <div className="text-sm font-bold text-green-700">Mejor Mes</div>
                                                <div className="text-xs text-green-600 mt-1">
                                                    {
                                                        monthlyPerformance.find(
                                                            (m) => m.percentage === Math.max(...monthlyPerformance.map((m) => m.percentage)),
                                                        )?.month
                                                    }
                                                </div>
                                            </div>
                                            <div className="text-center group">
                                                <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                    {monthlyPerformance.filter((m) => m.percentage === 100).length}
                                                </div>
                                                <div className="text-sm font-bold text-green-700">Meses Completos</div>
                                                <div className="text-xs text-green-600 mt-1">Sin deducciones</div>
                                            </div>
                                            <div className="text-center group">
                                                <div className="text-3xl font-bold text-green-800 mb-1 group-hover:scale-110 transition-transform duration-300">
                                                    {formatCurrency(monthlyPerformance.reduce((sum, m) => sum + m.deductionAmount, 0))}
                                                </div>
                                                <div className="text-sm font-bold text-green-700">Total Deducido</div>
                                                <div className="text-xs text-green-600 mt-1">En el año</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Area Chart */}
                                    <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                                        <h4 className="text-lg font-bold text-green-900 mb-6 flex items-center gap-2">
                                            <Percent className="w-5 h-5" />
                                            Porcentaje de Cumplimiento Mensual
                                        </h4>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <AreaChart data={monthlyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                                                <XAxis dataKey="month" stroke="#166534" style={{ fontSize: "14px", fontWeight: "bold" }} />
                                                <YAxis
                                                    stroke="#166534"
                                                    style={{ fontSize: "14px", fontWeight: "bold" }}
                                                    domain={[0, 100]}
                                                    tickFormatter={(value) => `${value}%`}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: "white",
                                                        border: "2px solid #16a34a",
                                                        borderRadius: "16px",
                                                        padding: "12px",
                                                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                                    }}
                                                    labelStyle={{ color: "#166534", fontWeight: "bold", marginBottom: "8px" }}
                                                    formatter={(value: any, name: string) => {
                                                        if (name === "percentage") return [`${value}%`, "Cumplimiento"]
                                                        return [value, name]
                                                    }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload as MonthlyPerformance
                                                            return (
                                                                <div className="bg-white border-2 border-green-300 rounded-2xl p-4 shadow-2xl">
                                                                    <p className="text-green-900 font-bold text-base mb-3">
                                                                        {obtenerNombreMes(data.monthNumber)} {chartYear}
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-green-800 font-semibold text-sm">Cumplimiento:</span>
                                                                            <span
                                                                                className={`font-bold text-base ${data.percentage === 100 ? "text-green-700" : "text-green-600"}`}
                                                                            >
                                      {data.percentage}%
                                    </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-green-800 font-semibold text-sm">Bono Base:</span>
                                                                            <span className="font-bold text-sm text-green-900">
                                      {formatCurrency(data.baseBonus)}
                                    </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-green-800 font-semibold text-sm">Bono Final:</span>
                                                                            <span className="font-bold text-sm text-green-900">
                                      {formatCurrency(data.finalBonus)}
                                    </span>
                                                                        </div>
                                                                        {data.deductionAmount > 0 && (
                                                                            <div className="flex items-center justify-between gap-4 pt-2 border-t-2 border-green-200">
                                                                                <span className="text-green-800 font-semibold text-sm">Deducción:</span>
                                                                                <span className="font-bold text-sm text-green-700">
                                        {formatCurrency(data.deductionAmount)}
                                      </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="percentage"
                                                    stroke="#16a34a"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorPercentage)"
                                                    animationDuration={1500}
                                                    animationEasing="ease-in-out"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Monthly Details Grid */}
                                    <div>
                                        <h4 className="text-lg font-bold text-green-900 mb-5 flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Detalle Mensual
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                            {monthlyPerformance.map((month, index) => (
                                                <div
                                                    key={month.monthNumber}
                                                    className={`rounded-2xl p-5 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group animate-fade-in ${
                                                        month.percentage === 100
                                                            ? "bg-gradient-to-br from-green-100 via-green-200 to-green-300 border-green-400"
                                                            : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                                                    }`}
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="text-center">
                                                        <div className="text-sm font-bold text-green-800 mb-2">{month.month}</div>
                                                        <div
                                                            className={`text-3xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300 ${
                                                                month.percentage === 100 ? "text-green-900" : "text-green-800"
                                                            }`}
                                                        >
                                                            {month.percentage}%
                                                        </div>
                                                        <div className="text-xs text-green-700 mb-3 font-semibold">
                                                            {month.percentage === 100 ? "¡Completo!" : "Cumplimiento"}
                                                        </div>
                                                        <div className="w-full bg-green-200 rounded-full h-2.5 overflow-hidden mb-3">
                                                            <div
                                                                className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                                                                    month.percentage === 100
                                                                        ? "bg-gradient-to-r from-green-600 to-green-700"
                                                                        : "bg-gradient-to-r from-green-500 to-green-600"
                                                                }`}
                                                                style={{ width: `${month.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="text-xs text-green-800 font-bold">{formatCurrency(month.finalBonus)}</div>
                                                        {month.deductionAmount > 0 && (
                                                            <div className="text-xs text-green-700 mt-1 font-medium">
                                                                -{formatCurrency(month.deductionAmount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-16 animate-fade-in">
                                    <div className="relative inline-block">
                                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                                            <BarChart3 className="w-10 h-10 text-green-600" />
                                        </div>
                                        <div className="absolute -inset-2 bg-green-200 rounded-3xl blur-xl opacity-30"></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-800 mb-3">Sin Datos Disponibles</h3>
                                    <p className="text-green-700 text-lg">
                                        No se encontraron datos de bonificaciones para el año {chartYear}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden hover:shadow-2xl transition-all duration-300 animate-slide-in-from-bottom">
                        <div className="px-6 py-5 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-200 to-green-300 rounded-xl flex items-center justify-center shadow-md">
                                    <FileText className="w-5 h-5 text-green-700" />
                                </div>
                                <h3 className="text-xl font-bold text-green-900">Registro de Deducciones</h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <TooltipProvider>
                                <table className="min-w-full divide-y divide-green-200">
                                    <thead className="bg-gradient-to-r from-green-100 to-green-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-green-900 uppercase tracking-wider">
                                            Código
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-green-900 uppercase tracking-wider">
                                            Causa
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-green-900 uppercase tracking-wider">
                                            % a Retirar
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-green-900 uppercase tracking-wider">
                                            Valor Actual
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-green-900 uppercase tracking-wider">
                                            Monto
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-green-900 uppercase tracking-wider">
                                            Período
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-green-900 uppercase tracking-wider">
                                            Observaciones
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-green-100">
                                    {(() => {
                                        const hasDeductions = data.deductions && data.deductions.length > 0

                                        if (!hasDeductions) {
                                            return (
                                                <tr className="hover:bg-green-50 transition-all duration-300 animate-fade-in">
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-green-200 to-green-300 rounded-xl flex items-center justify-center shadow-md">
                                                                <span className="text-sm font-bold text-green-800">0</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="text-base font-bold text-green-900">Sin Deducciones</div>
                                                        <div className="text-sm text-green-700 font-semibold mt-1">Impacto: Sin impacto</div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-sm font-bold px-3 py-2 rounded-xl bg-green-200 text-green-900 shadow-md">
                                                                0%
                                                            </div>
                                                            <div className="text-xs text-green-700 mt-2 font-medium">0 día(s)</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-base font-bold text-green-900">{formatCurrency(0)}</div>
                                                            <div className="text-xs text-green-700 mt-1 font-medium">Valor calculado</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-base font-bold text-green-800">{formatCurrency(0)}</div>
                                                            <div className="text-xs text-green-700 mt-1 font-medium">Monto real</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="text-sm text-green-800">
                                                            <div className="font-bold">
                                                                {selectedYear && selectedMonth
                                                                    ? `${obtenerNombreMes(selectedMonth)} ${selectedYear}`
                                                                    : "Período actual"}
                                                            </div>
                                                            <div className="text-green-700 mt-1 font-medium">Mes completo</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="w-10 h-10 bg-green-200 hover:bg-green-300 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 mx-auto shadow-md">
                                                                    <Info className="w-5 h-5 text-green-800" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="top"
                                                                className="max-w-md p-5 text-sm bg-white text-green-900 shadow-2xl border-2 border-green-300 rounded-2xl"
                                                            >
                                                                <div className="space-y-3">
                                                                    <p className="font-bold text-green-900 text-base">Mes Completo</p>
                                                                    <p className="text-green-800">
                                                                        No se registraron deducciones que afecten este mes. El bono se mantiene completo.
                                                                    </p>
                                                                    <div className="text-sm text-green-700 space-y-1">
                                                                        <p>
                                                                            <strong>Bono Base:</strong> {formatCurrency(data.baseBonus ?? 0)}
                                                                        </p>
                                                                        <p>
                                                                            <strong>Bono Final:</strong> {formatCurrency(data.finalBonus ?? 0)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </td>
                                                </tr>
                                            )
                                        } else {
                                            return data.deductions.map((d, index) => {
                                                const severity = getDeductionSeverity(d.porcentaje)
                                                return (
                                                    <tr
                                                        key={d.id}
                                                        className={`hover:bg-green-50 transition-all duration-300 cursor-pointer animate-fade-in ${
                                                            selectedRow === d ? "bg-green-100 border-l-4 border-green-600 shadow-md" : ""
                                                        }`}
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                        onClick={() => setSelectedRow(selectedRow === d ? null : d)}
                                                    >
                                                        <td className="px-6 py-5 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-green-200 to-green-300 rounded-xl flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-300">
                                                                    <span className="text-sm font-bold text-green-900">{d.codigo}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="text-base font-bold text-green-900">{d.concepto}</div>
                                                            <div className="text-sm text-green-700 font-semibold mt-1">
                                                                Impacto: {severity.label}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div
                                                                    className={`text-sm font-bold px-3 py-2 rounded-xl shadow-md hover:scale-110 transition-transform duration-300 ${
                                                                        typeof d.porcentaje === "string" && d.porcentaje.toLowerCase().includes("día")
                                                                            ? "bg-green-200 text-green-900"
                                                                            : "bg-green-100 text-green-800"
                                                                    }`}
                                                                >
                                                                    {d.porcentaje}
                                                                </div>
                                                                {typeof d.porcentaje === "string" && d.porcentaje.toLowerCase().includes("día") && (
                                                                    <div className="text-xs text-green-700 mt-2 font-medium">{d.dias || 1} día(s)</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-base font-bold text-green-900">
                                                                    {formatCurrency(calcularValorActual(d, data.baseBonus ?? 0))}
                                                                </div>
                                                                <div className="text-xs text-green-700 mt-1 font-medium">Valor calculado</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-base font-bold text-green-800">
                                                                    {formatCurrency(d.monto ?? 0)}
                                                                </div>
                                                                <div className="text-xs text-green-700 mt-1 font-medium">Monto real</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="text-sm text-green-800">
                                                                <div className="font-bold">{new Date(d.fechaInicio).toLocaleDateString("es-CO")}</div>
                                                                {d.fechaFin && (
                                                                    <div className="text-green-700 mt-1 font-medium">
                                                                        hasta {new Date(d.fechaFin).toLocaleDateString("es-CO")}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            {d.observaciones && d.observaciones.trim() !== "" ? (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="w-10 h-10 bg-green-200 hover:bg-green-300 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 mx-auto shadow-md">
                                                                            <Info className="w-5 h-5 text-green-800" />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="top"
                                                                        className="max-w-md p-5 text-sm bg-white text-green-900 shadow-2xl border-2 border-green-300 rounded-2xl"
                                                                    >
                                                                        {d.observaciones}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ) : (
                                                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                                                                    <Info className="w-5 h-5 text-green-400" />
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

                    {selectedRow && (
                        <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-100 border-2 border-green-300 rounded-2xl p-8 shadow-2xl animate-fade-in hover:shadow-3xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute -inset-1 bg-green-400 rounded-2xl blur-md opacity-30"></div>
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-green-900">Detalle de la Deducción</h4>
                                        <p className="text-base text-green-800 font-medium">Código: {selectedRow.codigo}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRow(null)}
                                    className="p-3 bg-green-300 hover:bg-green-400 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-md"
                                >
                                    <X className="w-5 h-5 text-green-900" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FileText className="w-5 h-5 text-green-700" />
                                        <span className="text-sm font-bold text-green-800">Causa</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-900">{selectedRow.concepto}</p>
                                </div>
                                <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Percent className="w-5 h-5 text-green-700" />
                                        <span className="text-sm font-bold text-green-800">% a Retirar</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-lg font-bold text-green-900">{selectedRow.porcentaje}</p>
                                        {typeof selectedRow.porcentaje === "string" &&
                                            selectedRow.porcentaje.toLowerCase().includes("día") && (
                                                <p className="text-sm text-green-700 mt-2 font-medium">
                                                    Tipo: Por día ({selectedRow.dias || 1} día(s))
                                                </p>
                                            )}
                                    </div>
                                </div>
                                <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Calculator className="w-5 h-5 text-green-700" />
                                        <span className="text-sm font-bold text-green-800">Valor Calculado</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-lg font-bold text-green-900">
                                            {formatCurrency(calcularValorActual(selectedRow, data.baseBonus ?? 0))}
                                        </p>
                                        <p className="text-sm text-green-700 mt-2 font-medium">
                                            Basado en bono base: {formatCurrency(data.baseBonus ?? 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center gap-3 mb-3">
                                        <DollarSign className="w-5 h-5 text-green-700" />
                                        <span className="text-sm font-bold text-green-800">Monto Real</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-lg font-bold text-green-800">{formatCurrency(selectedRow.monto ?? 0)}</p>
                                        <p className="text-sm text-green-700 mt-2 font-medium">Monto efectivamente descontado</p>
                                    </div>
                                </div>
                                <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Calendar className="w-5 h-5 text-green-700" />
                                        <span className="text-sm font-bold text-green-800">Fecha Inicio</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-900">
                                        {new Date(selectedRow.fechaInicio).toLocaleDateString("es-CO")}
                                    </p>
                                </div>
                                <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Clock className="w-5 h-5 text-green-700" />
                                        <span className="text-sm font-bold text-green-800">Fecha Fin</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-900">
                                        {selectedRow.fechaFin
                                            ? new Date(selectedRow.fechaFin).toLocaleDateString("es-CO")
                                            : "Sin fecha fin"}
                                    </p>
                                </div>
                                {selectedRow.observaciones && (
                                    <div className="bg-white/95 rounded-2xl p-5 border-2 border-green-300 md:col-span-2 lg:col-span-3 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Info className="w-5 h-5 text-green-700" />
                                            <span className="text-sm font-bold text-green-800">Observaciones</span>
                                        </div>
                                        <p className="text-base text-green-900 font-medium">{selectedRow.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {showFaultDetailsModal && selectedFaultDetails && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-3xl border-2 border-green-300 animate-scale-in">
                            <div className="bg-gradient-to-r from-green-100 via-green-200 to-green-100 px-8 py-6 border-b-2 border-green-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="absolute -inset-1 bg-green-400 rounded-2xl blur-md opacity-30"></div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-green-900">
                                                Registro de Deducciones - {selectedFaultDetails.descripcion}
                                            </h3>
                                            <p className="text-green-800 text-base font-medium">
                                                Código: {selectedFaultDetails.codigo}
                                                {selectedFaultDetails.year && ` • Año: ${selectedFaultDetails.year}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowFaultDetailsModal(false)
                                            setSelectedFaultDetails(null)
                                        }}
                                        className="p-3 hover:bg-green-300 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
                                    >
                                        <X className="w-6 h-6 text-green-800" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)] scroll-smooth">
                                {faultDetailsLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="relative">
                                            <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                                            <div className="absolute -inset-3 bg-green-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                        </div>
                                        <span className="text-green-800 font-bold ml-4 text-lg">Cargando detalles...</span>
                                    </div>
                                ) : selectedFaultDetails.deductions.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="bg-gradient-to-r from-green-100 via-green-200 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                                <div className="group">
                                                    <div className="text-3xl font-bold text-green-900 mb-2 group-hover:scale-110 transition-transform duration-300">
                                                        {selectedFaultDetails.deductions.length}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-800">Total Registros</div>
                                                </div>
                                                <div className="group">
                                                    <div className="text-3xl font-bold text-green-900 mb-2 group-hover:scale-110 transition-transform duration-300">
                                                        {selectedFaultDetails.deductions.reduce((sum, d) => sum + (d.dias || 0), 0)}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-800">Total Días</div>
                                                </div>
                                                <div className="group">
                                                    <div className="text-3xl font-bold text-green-900 mb-2 group-hover:scale-110 transition-transform duration-300">
                                                        {formatCurrency(
                                                            selectedFaultDetails.deductions.reduce(
                                                                (sum, d) => sum + calcularValorActual(d, data?.baseBonus || 142000),
                                                                0,
                                                            ),
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-bold text-green-800">Total Deducido</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-2xl shadow-xl border-2 border-green-200">
                                            <table className="min-w-full border-collapse bg-white overflow-hidden">
                                                <thead>
                                                <tr className="bg-gradient-to-r from-green-100 via-green-200 to-green-100">
                                                    <th className="border-2 border-green-300 px-5 py-4 text-left text-sm font-bold text-green-900">
                                                        CÓDIGO
                                                    </th>
                                                    <th className="border-2 border-green-300 px-5 py-4 text-left text-sm font-bold text-green-900">
                                                        CAUSA
                                                    </th>
                                                    <th className="border-2 border-green-300 px-5 py-4 text-center text-sm font-bold text-green-900">
                                                        % A RETIRAR
                                                    </th>
                                                    <th className="border-2 border-green-300 px-5 py-4 text-center text-sm font-bold text-green-900">
                                                        VALOR ACTUAL
                                                    </th>
                                                    <th className="border-2 border-green-300 px-5 py-4 text-center text-sm font-bold text-green-900">
                                                        MONTO
                                                    </th>
                                                    <th className="border-2 border-green-300 px-5 py-4 text-center text-sm font-bold text-green-900">
                                                        PERÍODO
                                                    </th>
                                                    <th className="border-2 border-green-300 px-5 py-4 text-center text-sm font-bold text-green-900">
                                                        OBSERVACIONES
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {selectedFaultDetails.deductions.map((deduction, index) => {
                                                    const valorActual = calcularValorActual(deduction, data?.baseBonus || 142000)
                                                    return (
                                                        <tr
                                                            key={deduction.id}
                                                            className={`${index % 2 === 0 ? "bg-white" : "bg-green-50"} hover:bg-green-100 transition-all duration-300`}
                                                        >
                                                            <td className="border border-green-200 px-5 py-4">
                                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-green-200 text-green-900 shadow-md hover:scale-110 transition-transform duration-300">
                                    {deduction.codigo}
                                  </span>
                                                            </td>
                                                            <td className="border border-green-200 px-5 py-4">
                                                                <div className="font-bold text-green-900">{deduction.concepto}</div>
                                                            </td>
                                                            <td className="border border-green-200 px-5 py-4 text-center">
                                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-green-200 text-green-900 shadow-md hover:scale-110 transition-transform duration-300">
                                    {typeof deduction.porcentaje === "string" &&
                                    deduction.porcentaje.toLowerCase().includes("día")
                                        ? `Día${deduction.dias ? ` (${deduction.dias} días)` : ""}`
                                        : `${typeof deduction.porcentaje === "number" ? (deduction.porcentaje * 100).toFixed(1) : deduction.porcentaje}%`}
                                  </span>
                                                            </td>
                                                            <td className="border border-green-200 px-5 py-4 text-center">
                                                                <div className="text-base font-bold text-green-900">
                                                                    {formatCurrency(valorActual)}
                                                                </div>
                                                                <div className="text-xs text-green-700 mt-1 font-medium">Valor calculado</div>
                                                            </td>
                                                            <td className="border border-green-200 px-5 py-4 text-center">
                                                                <div className="text-base font-bold text-green-800">
                                                                    {formatCurrency(valorActual)}
                                                                </div>
                                                                <div className="text-xs text-green-700 mt-1 font-medium">Monto real</div>
                                                            </td>
                                                            <td className="border border-green-200 px-5 py-4 text-center">
                                                                <div className="text-sm font-semibold text-green-900">
                                                                    {new Date(deduction.fechaInicio).toLocaleDateString("es-CO", {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "numeric",
                                                                    })}
                                                                </div>
                                                                {deduction.fechaFin && (
                                                                    <div className="text-xs text-green-700 mt-1 font-medium">
                                                                        hasta{" "}
                                                                        {new Date(deduction.fechaFin).toLocaleDateString("es-CO", {
                                                                            day: "2-digit",
                                                                            month: "2-digit",
                                                                            year: "numeric",
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="border border-green-200 px-5 py-4">
                                                                <div className="flex items-center justify-center">
                                                                    {deduction.observaciones ? (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger>
                                                                                    <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-green-300 transition-all duration-300 hover:scale-110 shadow-md">
                                                                                        <Info className="w-5 h-5 text-green-800" />
                                                                                    </div>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="max-w-xs p-4 bg-white border-2 border-green-300 rounded-2xl shadow-2xl">
                                                                                    <p>{deduction.observaciones}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    ) : (
                                                                        <span className="text-green-500 text-sm font-medium">Sin observaciones</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 animate-fade-in">
                                        <div className="relative inline-block">
                                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                                                <FileText className="w-10 h-10 text-green-600" />
                                            </div>
                                            <div className="absolute -inset-2 bg-green-200 rounded-3xl blur-xl opacity-30"></div>
                                        </div>
                                        <h4 className="text-2xl font-bold text-green-800 mb-3">No hay registros</h4>
                                        <p className="text-green-700 text-lg">
                                            No se encontraron deducciones para {selectedFaultDetails.descripcion}
                                            {selectedFaultDetails.year && ` en el año ${selectedFaultDetails.year}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default BonusDetailsTab
