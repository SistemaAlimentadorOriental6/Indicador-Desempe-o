"use client"

import type React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
import {
    X,
    DollarSign,
    MapPin,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle,
    AlertTriangle,
    Route,
    Crown,
    Shield,
    KeyRound,
    Activity,
    Calendar,
    CalendarCheck,
    CalendarX,
    Cake,
    Fingerprint,
    Briefcase,
} from "lucide-react"
import type { Operator } from "@/types/operator-types"
import KmDetailsTab from "./km-details-tab"
import BonusDetailsTab from "./bonus-details-tab"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Area, Line, LineChart, LabelList } from "recharts"

const getTrendIcon = (trend: string) => {
    switch (trend) {
        case "up":
            return <TrendingUp className="w-4 h-4 text-emerald-600" />
        case "down":
            return <TrendingDown className="w-4 h-4 text-red-500" />
        default:
            return <Minus className="w-4 h-4 text-slate-500" />
    }
}

const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 95)
        return {
            level: "Excelente",
            icon: CheckCircle,
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-700",
            borderColor: "border-emerald-200",
            gradientFrom: "from-emerald-500",
            gradientTo: "to-emerald-600",
        }
    if (percentage >= 85)
        return {
            level: "Bueno",
            icon: CheckCircle,
            bgColor: "bg-teal-50",
            textColor: "text-teal-700",
            borderColor: "border-teal-200",
            gradientFrom: "from-teal-500",
            gradientTo: "to-teal-600",
        }
    if (percentage >= 70)
        return {
            level: "Regular",
            icon: AlertTriangle,
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-700",
            borderColor: "border-yellow-200",
            gradientFrom: "from-yellow-500",
            gradientTo: "to-yellow-600",
        }
    return {
        level: "Necesita Mejora",
        icon: AlertTriangle,
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        gradientFrom: "from-red-500",
        gradientTo: "to-red-600",
    }
}

const calculateAge = (birthDate: string | null | undefined): string => {
    if (!birthDate) return "No disponible"
    try {
        const today = new Date()
        const birth = new Date(birthDate)
        if (isNaN(birth.getTime())) return "Fecha inválida"

        let years = today.getFullYear() - birth.getFullYear()
        let months = today.getMonth() - birth.getMonth()
        let days = today.getDate() - birth.getDate()

        if (days < 0) {
            months -= 1
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
        }

        if (months < 0) {
            years -= 1
            months += 12
        }

        const parts = []
        if (years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`)
        if (months > 0) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`)
        if (days > 0) parts.push(`${days} ${days === 1 ? "día" : "días"}`)

        return parts.join(", ") || "Recién nacido"
    } catch (e) {
        return "Error calculando"
    }
}

const calculateTenure = (joinDate: string | null | undefined): string => {
    if (!joinDate) return "No disponible"
    try {
        const today = new Date()
        const start = new Date(joinDate)
        if (isNaN(start.getTime())) return "Fecha inválida"

        if (start > today) return "Fecha futura"

        let years = today.getFullYear() - start.getFullYear()
        let months = today.getMonth() - start.getMonth()
        let days = today.getDate() - start.getDate()

        if (days < 0) {
            months -= 1
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
        }

        if (months < 0) {
            years -= 1
            months += 12
        }

        const parts = []
        if (years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`)
        if (months > 0) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`)
        if (days > 0) parts.push(`${days} ${days === 1 ? "día" : "días"}`)

        return parts.join(", ") || "Hoy"
    } catch (e) {
        return "Error calculando"
    }
}

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "No disponible"
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "Fecha inválida"
        return new Intl.DateTimeFormat("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date)
    } catch (error) {
        return "Fecha inválida"
    }
}

interface OperatorDetailModalProps {
    operator: Operator
    onClose: () => void
}

export const EnhancedOperatorDetailModal: React.FC<OperatorDetailModalProps> = ({ operator, onClose }) => {
    const [activeTab, setActiveTab] = useState<"overview" | "kilometers" | "bonuses">("overview")
    const [imageError, setImageError] = useState(false)
    const [showImageModal, setShowImageModal] = useState(false)

    const [currentOperator, setCurrentOperator] = useState<Operator>(operator)
    const [isLoading, setIsLoading] = useState(false)

    const [globalEfficiency, setGlobalEfficiency] = useState<number | null>(null)
    const [isGlobalEfficiencyLoading, setIsGlobalEfficiencyLoading] = useState(true)

    const [selectedYear, setSelectedYear] = useState<number>()
    const [selectedMonth, setSelectedMonth] = useState<number>()
    const [filterType, setFilterType] = useState<"month" | "year">("month")
    const [availableDates, setAvailableDates] = useState<{ years: number[]; months: { [year: number]: number[] } }>({
        years: [],
        months: {},
    })
    const [areDatesLoading, setAreDatesLoading] = useState(true)

    const [yearlyPerformanceData, setYearlyPerformanceData] = useState<
        Array<{ month: string; efficiency: number; monthNumber: number; year?: number }>
    >([])
    const [isYearlyPerformanceLoading, setIsYearlyPerformanceLoading] = useState(false)
    const [chartYearFilter, setChartYearFilter] = useState<number>()
    const [chartViewType, setChartViewType] = useState<"monthly" | "yearly">("monthly")
    const [annualPerformanceData, setAnnualPerformanceData] = useState<
        Array<{ year: number; efficiency: number }>
    >([])

    const operatorCodigo = operator.codigo

    useEffect(() => {
        const fetchAvailableDates = async () => {
            if (!operatorCodigo) return
            setAreDatesLoading(true)
            try {
                const response = await fetch(`/api/user/available-dates?userCode=${operatorCodigo}`)
                const result = await response.json()

                if (result.success && result.data) {
                    const { years, months } = result.data
                    setAvailableDates({ years, months })

                    if (years.length > 0) {
                        const latestYear = years[0] // Already sorted descending
                        setSelectedYear(latestYear)
                        if (months[latestYear] && months[latestYear].length > 0) {
                            const latestMonth = months[latestYear][0] // Already sorted descending
                            setSelectedMonth(latestMonth)
                        }
                    }
                }
            } catch (error) {
                console.error("Falló al obtener fechas disponibles:", error)
                const fallbackYear = new Date().getFullYear()
                const fallbackMonth = new Date().getMonth() + 1
                setSelectedYear(fallbackYear)
                setSelectedMonth(fallbackMonth)
                setAvailableDates({ years: [fallbackYear], months: { [fallbackYear]: [fallbackMonth] } })
            } finally {
                setAreDatesLoading(false)
            }
        }

        fetchAvailableDates()
    }, [operatorCodigo])

    useEffect(() => {
        const fetchGlobalEfficiency = async () => {
            if (!operatorCodigo || !selectedYear) return
            setIsGlobalEfficiencyLoading(true)
            try {
                const response = await fetch(`/api/user/global-efficiency?userCode=${operatorCodigo}&year=${selectedYear}`)
                const result = await response.json()
                if (result.success) {
                    setGlobalEfficiency(result.data.efficiency)
                } else {
                    console.error("Error fetching global efficiency from API:", result.message)
                    setGlobalEfficiency(0)
                }
            } catch (error) {
                console.error("Falló al obtener eficiencia global:", error)
                setGlobalEfficiency(0)
            } finally {
                setIsGlobalEfficiencyLoading(false)
            }
        }

        fetchGlobalEfficiency()
    }, [operatorCodigo, selectedYear])

    useEffect(() => {
        const fetchData = async () => {
            if (!operatorCodigo || !selectedYear) return
            if (filterType === "month" && !selectedMonth) return

            setIsLoading(true)
            try {
                let apiUrl = ""
                if (filterType === "year") {
                    apiUrl = `/api/user/rankings?filterType=year&filterValue=${selectedYear}&userCode=${operatorCodigo}`
                } else {
                    apiUrl = `/api/user/rankings?filterType=month&filterValue=${selectedYear}-${String(selectedMonth).padStart(
                        2,
                        "0",
                    )}&userCode=${operatorCodigo}`
                }

                const response = await fetch(apiUrl)
                if (!response.ok) throw new Error("La respuesta de la red no fue correcta")

                const result = await response.json()

                if (result.success && result.data && result.data.length > 0) {
                    setCurrentOperator(result.data[0])
                } else {
                    const periodText = filterType === "year" ? `año ${selectedYear}` : `${selectedYear}-${selectedMonth}`
                    console.warn(`No se encontraron datos para ${periodText}`)
                    setCurrentOperator({
                        ...operator,
                        bonus: {
                            percentage: 0,
                            total: 0,
                            category: "Taller Conciencia",
                            trend: "stable",
                            date: null,
                        },
                        km: {
                            percentage: 0,
                            total_ejecutado: 0,
                            total_programado: 0,
                            category: "Taller Conciencia",
                            trend: "stable",
                            date: null,
                        },
                        efficiency: 0,
                        weeklyPerformance: [],
                        consistency: 0,
                    })
                }
            } catch (error) {
                console.error("Falló al obtener los datos actualizados del operador:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (activeTab === "overview") {
            fetchData()
        }
    }, [selectedYear, selectedMonth, filterType, operatorCodigo, activeTab, operator])

    useEffect(() => {
        const fetchYearlyPerformance = async () => {
            if (!operatorCodigo || !chartYearFilter) return

            setIsYearlyPerformanceLoading(true)
            try {
                // Get available months for the selected year
                const availableMonths = availableDates.months[chartYearFilter] || []

                if (availableMonths.length === 0) {
                    setYearlyPerformanceData([])
                    return
                }

                // Fetch data only for available months
                const monthPromises = availableMonths.map((month) => {
                    const monthStr = `${chartYearFilter}-${String(month).padStart(2, "0")}`
                    return fetch(`/api/user/rankings?filterType=month&filterValue=${monthStr}&userCode=${operatorCodigo}`)
                        .then((res) => res.json())
                        .then((result) => ({
                            month: new Date(0, month - 1).toLocaleString("es-CO", { month: "short" }),
                            monthNumber: month,
                            efficiency: result.success && result.data && result.data.length > 0 ? result.data[0].efficiency : 0,
                        }))
                })

                const monthlyData = await Promise.all(monthPromises)
                // Filter out months with 0 efficiency (no real data) and sort by month number
                const filteredData = monthlyData
                    .filter(data => data.efficiency > 0)
                    .sort((a, b) => a.monthNumber - b.monthNumber)
                setYearlyPerformanceData(filteredData)
            } catch (error) {
                console.error("Error fetching yearly performance:", error)
                setYearlyPerformanceData([])
            } finally {
                setIsYearlyPerformanceLoading(false)
            }
        }

        fetchYearlyPerformance()
    }, [operatorCodigo, chartYearFilter, availableDates.months])

    useEffect(() => {
        const fetchAnnualPerformance = async () => {
            if (!operatorCodigo || chartViewType !== "yearly") return

            setIsYearlyPerformanceLoading(true)
            try {
                // Fetch data for all available years
                const yearPromises = availableDates.years.map((year) =>
                    fetch(`/api/user/rankings?filterType=year&filterValue=${year}&userCode=${operatorCodigo}`)
                        .then((res) => res.json())
                        .then((result) => ({
                            year,
                            efficiency: result.success && result.data && result.data.length > 0 ? result.data[0].efficiency : 0,
                        }))
                )

                const annualData = await Promise.all(yearPromises)
                setAnnualPerformanceData(annualData.filter(d => d.efficiency > 0))
            } catch (error) {
                console.error("Error fetching annual performance:", error)
                setAnnualPerformanceData([])
            } finally {
                setIsYearlyPerformanceLoading(false)
            }
        }

        fetchAnnualPerformance()
    }, [operatorCodigo, chartViewType, availableDates.years])

    useEffect(() => {
        if (availableDates.years.length > 0 && !chartYearFilter) {
            setChartYearFilter(availableDates.years[0])
        }
    }, [availableDates.years, chartYearFilter])

    useEffect(() => {
        // Si el año seleccionado es el año actual, asegurarse de que el mes seleccionado no sea futuro
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        if (selectedYear === currentYear && selectedMonth && selectedMonth > currentMonth) {
            if (availableDates.months[currentYear] && availableDates.months[currentYear].includes(currentMonth)) {
                setSelectedMonth(currentMonth)
            } else if (availableDates.months[currentYear]?.length > 0) {
                setSelectedMonth(availableDates.months[currentYear][0]) // Latest available in current year
            }
        }
    }, [selectedYear, selectedMonth, availableDates])

    useEffect(() => {
        console.log("Información del operador:", {
            nombre: operator.name, // Usar `operator` para datos estáticos
            cedula: operator.cedula,
            id: operator.id,
            avatar: operator.avatar,
            operadorCompleto: currentOperator, // Usar `currentOperator` para datos dinámicos
        })
    }, [operator, currentOperator])

    const performanceLevel = useMemo(() => getPerformanceLevel(currentOperator.efficiency), [currentOperator.efficiency])

    const globalPerformanceLevel = useMemo(() => {
        if (globalEfficiency === null) {
            return getPerformanceLevel(0) // Default for loading or error
        }
        return getPerformanceLevel(globalEfficiency)
    }, [globalEfficiency])

    const formatCurrency = (amount: number): string =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        }).format(amount)

    const initials = useMemo(() => {
        if (operator.avatar && operator.avatar.trim() !== "") {
            return operator.avatar
        }
        if (operator.name) {
            const nameParts = operator.name.split(" ")
            if (nameParts.length >= 2) {
                return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
            }
            return operator.name.substring(0, 2).toUpperCase()
        }
        return "OP"
    }, [operator.avatar, operator.name])

    const bonusTotal = currentOperator.bonus?.total ?? 0
    const bonusPercentage = currentOperator.bonus?.percentage ?? 0
    const bonusPercentClamped = Math.min(bonusPercentage, 100)
    const bonusTotalText = formatCurrency(bonusTotal)
    const bonusObjectiveText = `${bonusPercentage.toFixed(1)}% del objetivo`

    const bonusDeductions: Array<{
        reason: string
        observation?: string
        start?: string
        end?: string
        amount?: number
        days?: number
        affectsPerformance?: boolean
    }> = (currentOperator as any).bonus?.deductions || []

    const executedKm = currentOperator.km?.total_ejecutado ?? currentOperator.km?.total ?? 0
    const programmedKm = currentOperator.km?.total_programado ?? currentOperator.km?.total ?? 0
    const kmDiff = executedKm - programmedKm
    const kmDiffText = `${kmDiff >= 0 ? "+" : ""}${kmDiff.toLocaleString("es-CO")}`
    const kmEfficiency = programmedKm > 0 ? (executedKm / programmedKm) * 100 : 0
    const kmEfficiencyClamped = Math.min(kmEfficiency, 100)

    const consistency =
        currentOperator.consistency ??
        (currentOperator.weeklyPerformance && currentOperator.weeklyPerformance.length > 0
            ? 100 - (Math.max(...currentOperator.weeklyPerformance) - Math.min(...currentOperator.weeklyPerformance))
            : 0)
    const consistencyText = `${consistency.toFixed(0)}%`
    const consistencyRangeText =
        currentOperator.weeklyPerformance && currentOperator.weeklyPerformance.length > 0
            ? `Rango: ${Math.min(...currentOperator.weeklyPerformance)}% - ${Math.max(...currentOperator.weeklyPerformance)}%`
            : ""

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        },
        [onClose],
    )

    const employeeImageUrl = useMemo(() => {
        const documentId = operator.cedula || operator.document || String(operator.id)
        if (!documentId) {
            console.log("No se encontró número de documento para:", operator.name)
            return null
        }
        const url = `https://admon.sao6.com.co/web/uploads/empleados/${documentId}.jpg`
        console.log("URL de la imagen:", url)
        return url
    }, [operator])

    const handleImageError = () => {
        console.log("Error al cargar la imagen del operador:", operator.name)
        setImageError(true)
    }

    const handleImageClick = () => {
        if (employeeImageUrl && !imageError) {
            setShowImageModal(true)
        }
    }

    const chartConfig = {
        efficiency: {
            label: "Eficiencia",
            color: "hsl(160 84% 39%)", // Using a more vibrant emerald color
        },
    } satisfies ChartConfig

    const renderCustomLabel = (props: any) => {
        const { x, y, value } = props
        if (value === 0) return null // Don't show label for 0 values

        return (
            <g>
                <text
                    x={x}
                    y={y - 20}
                    fill="hsl(160 84% 39%)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold drop-shadow-sm"
                    style={{
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                    }}
                >
                    {`${Number(value).toFixed(1)}%`}
                </text>
            </g>
        )
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                {/* Header Section - Redesigned */}
                <header className="relative bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 border-b border-emerald-100 flex-shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5" aria-hidden="true">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full -translate-y-48 translate-x-48"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-300 to-teal-300 rounded-full translate-y-32 -translate-x-32"></div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-all duration-200 z-20 shadow-md border border-slate-200"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>

                    <div className="relative z-10 p-4">
                        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
                            {/* Profile Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    {employeeImageUrl && !imageError ? (
                                        <div
                                            className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-lg border-3 border-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
                                            onClick={handleImageClick}
                                            title="Click para ver imagen completa"
                                        >
                                            <Image
                                                src={employeeImageUrl || "/placeholder.svg"}
                                                alt={operator.name || "Foto del operador"}
                                                width={80}
                                                height={80}
                                                className="object-cover w-full h-full"
                                                onError={handleImageError}
                                                priority
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg border-3 border-white">
                                            <span className="text-emerald-700">{initials}</span>
                                        </div>
                                    )}
                                    {operator.category === "Oro" && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            <Crown className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-bold text-slate-800 mb-1 truncate">{operator.name}</h1>
                                    {operator.position && (
                                        <p className="text-base text-emerald-600 font-medium mb-2">{operator.position}</p>
                                    )}

                                    {/* Compact Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <KeyRound className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Código:</span>
                                                <span className="font-semibold text-slate-800 ml-1">{operator.codigo}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Fingerprint className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Cédula:</span>
                                                <span className="font-semibold text-slate-800 ml-1">
                          {operator.cedula || operator.document || "N/A"}
                        </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Cake className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Edad:</span>
                                                <span className="font-semibold text-slate-800 ml-1">{calculateAge(operator.birthDate)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Ingreso:</span>
                                                <span className="font-semibold text-slate-800 ml-1">{formatDate(operator.joinDate)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Antigüedad:</span>
                                                <span className="font-semibold text-slate-800 ml-1">{calculateTenure(operator.joinDate)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {operator.retirementDate ? (
                                                <CalendarX className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                            ) : (
                                                <CalendarCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                            )}
                                            <div>
                                                <span className="text-slate-500">Estado:</span>
                                                {operator.retirementDate ? (
                                                    <span className="font-semibold text-red-600 ml-1">
                            Retirado ({formatDate(operator.retirementDate)})
                          </span>
                                                ) : (
                                                    <span className="font-semibold text-emerald-600 ml-1">Vigente</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Zona:</span>
                                                <span
                                                    className="font-semibold text-slate-800 ml-1 truncate"
                                                    title={operator.zona || "Sin zona"}
                                                >
                          {operator.zona || "Sin zona"}
                        </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-slate-500">Padrino:</span>
                                                <span
                                                    className="font-semibold text-slate-800 ml-1 truncate"
                                                    title={operator.padrino || "Sin padrino"}
                                                >
                          {operator.padrino || "Sin padrino"}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Card - Redesigned */}
                            <div className="w-full xl:w-auto">
                                <div
                                    className={`bg-gradient-to-br ${performanceLevel.gradientFrom} ${performanceLevel.gradientTo} rounded-2xl p-4 text-white shadow-xl min-w-[240px]`}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-1">{currentOperator.efficiency.toFixed(1)}%</div>
                                        <div className="text-white/90 text-sm font-medium mb-2">
                                            Eficiencia {filterType === "year" ? "Anual" : "Mensual"}
                                        </div>
                                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                            <performanceLevel.icon className="w-3 h-3" />
                                            <span>{performanceLevel.level}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Global Performance Card */}
                            <div className="w-full xl:w-auto">
                                <div
                                    className={`bg-gradient-to-br ${globalPerformanceLevel.gradientFrom} ${globalPerformanceLevel.gradientTo} rounded-2xl p-4 text-white shadow-xl min-w-[240px]`}
                                >
                                    {isGlobalEfficiencyLoading ? (
                                        <div className="flex items-center justify-center h-[88px]">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-3xl font-bold mb-1">
                                                {globalEfficiency !== null ? globalEfficiency.toFixed(1) : "0.0"}%
                                            </div>
                                            <div className="text-white/90 text-sm font-medium mb-2">Eficiencia Global {selectedYear}</div>
                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                                <globalPerformanceLevel.icon className="w-3 h-3" />
                                                <span>{globalPerformanceLevel.level}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs - Improved */}
                <nav
                    className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto flex-shrink-0"
                    role="tablist"
                >
                    {[
                        { id: "overview", label: "Vista General", icon: BarChart3 },
                        { id: "kilometers", label: "Kilómetros", icon: Route },
                        { id: "bonuses", label: "Bonos", icon: DollarSign },
                    ].map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-all whitespace-nowrap rounded-t-lg ${
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                                        : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                                }`}
                                role="tab"
                                aria-selected={isActive}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* Content Area - Scrollable */}
                <main className="flex-1 overflow-hidden bg-gradient-to-b from-slate-50/30 to-white min-h-0">
                    <div className="h-full overflow-y-auto">
                        {activeTab === "overview" && (
                            <div className="p-6 relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-2xl">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                                    </div>
                                )}
                                <div className={`space-y-6 ${isLoading ? "opacity-50" : ""}`}>
                                    {/* Key Performance Indicators */}
                                    <section>
                                        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-emerald-600" />
                                                Indicadores Clave de Rendimiento
                                            </h2>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Selector de tipo de filtro */}
                                                <Select
                                                    value={filterType}
                                                    onValueChange={(value: "month" | "year") => {
                                                        setFilterType(value)
                                                        if (value === "year") {
                                                            setSelectedMonth(undefined)
                                                        } else if (
                                                            selectedYear &&
                                                            availableDates.months[selectedYear] &&
                                                            availableDates.months[selectedYear].length > 0
                                                        ) {
                                                            setSelectedMonth(availableDates.months[selectedYear][0])
                                                        }
                                                    }}
                                                    disabled={isLoading || areDatesLoading}
                                                >
                                                    <SelectTrigger className="w-[100px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="month">Mes</SelectItem>
                                                        <SelectItem value="year">Año</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {/* Selector de año */}
                                                <Select
                                                    value={selectedYear ? String(selectedYear) : ""}
                                                    onValueChange={(value) => {
                                                        const newYear = Number(value)
                                                        setSelectedYear(newYear)
                                                        if (
                                                            filterType === "month" &&
                                                            availableDates.months[newYear] &&
                                                            availableDates.months[newYear].length > 0
                                                        ) {
                                                            setSelectedMonth(availableDates.months[newYear][0])
                                                        }
                                                    }}
                                                    disabled={isLoading || areDatesLoading}
                                                >
                                                    <SelectTrigger className="w-[120px] bg-white">
                                                        <SelectValue placeholder="Año" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableDates.years.map((year) => (
                                                            <SelectItem key={year} value={String(year)}>
                                                                {year}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {/* Selector de mes (solo visible cuando filterType es 'month') */}
                                                {filterType === "month" && (
                                                    <Select
                                                        value={selectedMonth ? String(selectedMonth) : ""}
                                                        onValueChange={(value) => setSelectedMonth(Number(value))}
                                                        disabled={isLoading || areDatesLoading || !selectedYear}
                                                    >
                                                        <SelectTrigger className="w-[140px] bg-white">
                                                            <SelectValue placeholder="Mes" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(availableDates.months[selectedYear!] || []).map((month) => (
                                                                <SelectItem key={month} value={String(month)}>
                                                                    {new Date(0, month - 1).toLocaleString("es-CO", {
                                                                        month: "long",
                                                                    })}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Bonos Card */}
                                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center">
                                                        <DollarSign className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-slate-800">{bonusTotalText}</div>
                                                        <div className="text-sm text-emerald-600 font-medium">{bonusObjectiveText}</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-emerald-100 rounded-full h-2 relative">
                                                    <div
                                                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                                                        style={{ width: `${bonusPercentClamped}%` }}
                                                    />
                                                    {bonusDeductions.length > 0 && (
                                                        <div
                                                            className="absolute top-0 right-0 h-2 bg-red-400 rounded-r-full"
                                                            style={{ width: `${Math.min(100 - bonusPercentClamped, 20)}%` }}
                                                            title="Deducciones aplicadas"
                                                        />
                                                    )}
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    Bonos {filterType === "year" ? "Anuales" : "Mensuales"}
                                                </div>
                                            </div>

                                            {/* Kilómetros Card */}
                                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center">
                                                        <Route className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-slate-800">
                                                            {executedKm.toLocaleString("es-CO")}
                                                        </div>
                                                        <div className="text-sm text-teal-600 font-medium">{kmDiffText} vs objetivo</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-teal-100 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-teal-400 to-teal-500 h-2 rounded-full transition-all duration-1000"
                                                        style={{ width: `${kmEfficiencyClamped}%` }}
                                                    />
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    Kilómetros {filterType === "year" ? "Anuales" : "Mensuales"}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                                    Rendimiento {chartViewType === "yearly" ? "Histórico" : "Anual"}
                                                </h2>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {chartViewType === "yearly"
                                                        ? "Comparación de eficiencia por año"
                                                        : "Evolución mensual del porcentaje de eficiencia"
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={chartViewType}
                                                    onValueChange={(value: "monthly" | "yearly") => setChartViewType(value)}
                                                    disabled={isYearlyPerformanceLoading || areDatesLoading}
                                                >
                                                    <SelectTrigger className="w-[130px] bg-white border-emerald-200 focus:ring-emerald-500">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">Por Mes</SelectItem>
                                                        <SelectItem value="yearly">Por Año</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {chartViewType === "monthly" && (
                                                    <Select
                                                        value={chartYearFilter ? String(chartYearFilter) : ""}
                                                        onValueChange={(value) => setChartYearFilter(Number(value))}
                                                        disabled={isYearlyPerformanceLoading || areDatesLoading}
                                                    >
                                                        <SelectTrigger className="w-[140px] bg-white border-emerald-200 focus:ring-emerald-500">
                                                            <SelectValue placeholder="Seleccionar año" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableDates.years.map((year) => (
                                                                <SelectItem key={year} value={String(year)}>
                                                                    Año {year}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-6 border-2 border-emerald-100 shadow-lg">
                                            {isYearlyPerformanceLoading ? (
                                                <div className="flex items-center justify-center h-[400px]">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
                                                        <p className="text-sm text-slate-500">Cargando datos de rendimiento...</p>
                                                    </div>
                                                </div>
                                            ) : (chartViewType === "monthly" ? yearlyPerformanceData.length > 0 : annualPerformanceData.length > 0) ? (
                                                <div className="space-y-6">
                                                    {/* Chart Legend */}
                                                    <div className="flex items-center justify-between text-sm bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm"></div>
                                                                <span className="text-slate-700 font-medium">
                                                                    Eficiencia {chartViewType === "yearly" ? "Anual" : "Mensual"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-slate-600">
                                                                <span className="font-semibold text-emerald-700">
                                                                    {chartViewType === "yearly"
                                                                        ? (annualPerformanceData.length > 0 ? (annualPerformanceData.reduce((sum, d) => sum + d.efficiency, 0) / annualPerformanceData.length).toFixed(1) : "0.0")
                                                                        : (yearlyPerformanceData.length > 0 ? (yearlyPerformanceData.reduce((sum, d) => sum + d.efficiency, 0) / yearlyPerformanceData.length).toFixed(1) : "0.0")
                                                                    }%
                                                                </span>
                                                                <span className="ml-1">promedio {chartViewType === "yearly" ? "histórico" : "anual"}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Enhanced Chart */}
                                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                                        <ChartContainer config={chartConfig} className="h-[380px] w-full">
                                                            <LineChart
                                                                data={chartViewType === "yearly" ? annualPerformanceData : yearlyPerformanceData}
                                                                margin={{ top: 35, right: 30, left: 10, bottom: 10 }}
                                                            >
                                                                <defs>
                                                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                                                        <stop offset="0%" stopColor="hsl(160 84% 39%)" />
                                                                        <stop offset="50%" stopColor="hsl(173 80% 40%)" />
                                                                        <stop offset="100%" stopColor="hsl(160 84% 39%)" />
                                                                    </linearGradient>
                                                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.2} />
                                                                        <stop offset="50%" stopColor="hsl(173 80% 40%)" stopOpacity={0.1} />
                                                                        <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0.05} />
                                                                    </linearGradient>
                                                                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                                        <feDropShadow
                                                                            dx="0"
                                                                            dy="2"
                                                                            stdDeviation="3"
                                                                            floodOpacity="0.3"
                                                                            floodColor="hsl(160 84% 39%)"
                                                                        />
                                                                    </filter>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" vertical={false} />
                                                                <XAxis
                                                                    dataKey={chartViewType === "yearly" ? "year" : "month"}
                                                                    className="text-xs font-medium"
                                                                    tick={{ fill: "hsl(215 16% 47%)" }}
                                                                    axisLine={{ stroke: "hsl(215 20% 85%)" }}
                                                                    tickLine={{ stroke: "hsl(215 20% 85%)" }}
                                                                />
                                                                <YAxis
                                                                    className="text-xs font-medium"
                                                                    tick={{ fill: "hsl(215 16% 47%)" }}
                                                                    domain={[0, 100]}
                                                                    tickFormatter={(value) => `${value}%`}
                                                                    axisLine={{ stroke: "hsl(215 20% 85%)" }}
                                                                    tickLine={{ stroke: "hsl(215 20% 85%)" }}
                                                                />
                                                                <ChartTooltip
                                                                    content={
                                                                        <ChartTooltipContent
                                                                            formatter={(value) => (
                                                                                <span className="font-bold text-emerald-700">{Number(value).toFixed(1)}%</span>
                                                                            )}
                                                                            className="bg-white/95 backdrop-blur-sm border-emerald-200 shadow-xl"
                                                                        />
                                                                    }
                                                                />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="efficiency"
                                                                    stroke="none"
                                                                    fill="url(#areaGradient)"
                                                                    name="Eficiencia"
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="efficiency"
                                                                    stroke="url(#lineGradient)"
                                                                    strokeWidth={3}
                                                                    dot={{
                                                                        fill: "white",
                                                                        stroke: "hsl(160 84% 39%)",
                                                                        strokeWidth: 3,
                                                                        r: 5,
                                                                        filter: "url(#shadow)",
                                                                    }}
                                                                    activeDot={{
                                                                        r: 7,
                                                                        fill: "hsl(160 84% 39%)",
                                                                        stroke: "white",
                                                                        strokeWidth: 3,
                                                                        filter: "url(#shadow)",
                                                                    }}
                                                                    name="Eficiencia"
                                                                >
                                                                    <LabelList dataKey="efficiency" position="top" content={renderCustomLabel} />
                                                                </Line>
                                                            </LineChart>
                                                        </ChartContainer>
                                                    </div>

                                                    {/* Enhanced Performance Summary Cards */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <TrendingUp className="w-5 h-5 opacity-80" />
                                                                <div className="text-2xl font-bold">
                                                                    {chartViewType === "yearly"
                                                                        ? (annualPerformanceData.length > 0 ? Math.max(...annualPerformanceData.map((d) => d.efficiency)).toFixed(1) : "0.0")
                                                                        : (yearlyPerformanceData.length > 0 ? Math.max(...yearlyPerformanceData.map((d) => d.efficiency)).toFixed(1) : "0.0")
                                                                    }%
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-emerald-100 font-medium">
                                                                Máximo {chartViewType === "yearly" ? "Histórico" : "del Año"}
                                                            </div>
                                                            <div className="text-xs text-emerald-200 mt-1">
                                                                {chartViewType === "yearly"
                                                                    ? (annualPerformanceData.length > 0 ? annualPerformanceData.find(
                                                                        (d) => d.efficiency === Math.max(...annualPerformanceData.map((d) => d.efficiency))
                                                                    )?.year : "-")
                                                                    : (yearlyPerformanceData.length > 0 ? yearlyPerformanceData.find(
                                                                        (d) => d.efficiency === Math.max(...yearlyPerformanceData.map((d) => d.efficiency))
                                                                    )?.month : "-")
                                                                }
                                                            </div>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <TrendingDown className="w-5 h-5 opacity-80" />
                                                                <div className="text-2xl font-bold">
                                                                    {chartViewType === "yearly"
                                                                        ? (annualPerformanceData.length > 0 ? Math.min(...annualPerformanceData.map((d) => d.efficiency)).toFixed(1) : "0.0")
                                                                        : (yearlyPerformanceData.length > 0 ? Math.min(...yearlyPerformanceData.map((d) => d.efficiency)).toFixed(1) : "0.0")
                                                                    }%
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-slate-100 font-medium">
                                                                Mínimo {chartViewType === "yearly" ? "Histórico" : "del Año"}
                                                            </div>
                                                            <div className="text-xs text-slate-200 mt-1">
                                                                {chartViewType === "yearly"
                                                                    ? (annualPerformanceData.length > 0 ? annualPerformanceData.find(
                                                                        (d) => d.efficiency === Math.min(...annualPerformanceData.map((d) => d.efficiency))
                                                                    )?.year : "-")
                                                                    : (yearlyPerformanceData.length > 0 ? yearlyPerformanceData.find(
                                                                        (d) => d.efficiency === Math.min(...yearlyPerformanceData.map((d) => d.efficiency))
                                                                    )?.month : "-")
                                                                }
                                                            </div>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <Activity className="w-5 h-5 opacity-80" />
                                                                <div className="text-2xl font-bold">
                                                                    {chartViewType === "yearly"
                                                                        ? (annualPerformanceData.length > 0 ? (annualPerformanceData.reduce((sum, d) => sum + d.efficiency, 0) / annualPerformanceData.length).toFixed(1) : "0.0")
                                                                        : (yearlyPerformanceData.length > 0 ? (yearlyPerformanceData.reduce((sum, d) => sum + d.efficiency, 0) / yearlyPerformanceData.length).toFixed(1) : "0.0")
                                                                    }%
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-teal-100 font-medium">
                                                                Promedio {chartViewType === "yearly" ? "Histórico" : "Anual"}
                                                            </div>
                                                            <div className="text-xs text-teal-200 mt-1">
                                                                {chartViewType === "yearly"
                                                                    ? `${annualPerformanceData.length} años activos`
                                                                    : `${yearlyPerformanceData.length} meses activos`
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                                                    <BarChart3 className="w-20 h-20 mb-4 opacity-30" />
                                                    <p className="text-base font-medium">No hay datos disponibles</p>
                                                    <p className="text-sm mt-2">
                                                        {chartViewType === "yearly"
                                                            ? "No se encontraron registros históricos"
                                                            : `No se encontraron registros para el año ${chartYearFilter}`
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Detailed Analysis */}
                                    <section>
                                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                                            Análisis Detallado
                                        </h2>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Análisis de Bonos */}
                                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center">
                                                        <DollarSign className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">Rendimiento Económico</h3>
                                                        <p className="text-sm text-slate-500">Análisis de bonificaciones</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Total Acumulado</span>
                                                        <span className="font-bold text-emerald-600">{bonusTotalText}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Progreso del Objetivo</span>
                                                        <span className="font-bold text-slate-800">{bonusPercentage.toFixed(1)}%</span>
                                                    </div>
                                                    {bonusDeductions.length > 0 && (
                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                            <span className="text-sm text-red-600">Total Deducciones</span>
                                                            <span className="font-bold text-red-600">
                                -{formatCurrency(bonusDeductions.reduce((sum, ded) => sum + (ded.amount || 0), 0))}
                              </span>
                                                        </div>
                                                    )}

                                                    {bonusDeductions && bonusDeductions.length > 0 && (
                                                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                            <h4 className="text-sm font-semibold text-red-700 mb-2">
                                                                Deducciones del Periodo ({bonusDeductions.length})
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {bonusDeductions.slice(0, 4).map((ded, idx) => (
                                                                    <div key={idx} className="text-xs border-l-2 border-red-300 pl-3">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <div className="font-medium text-red-700">{ded.reason}</div>
                                                                            {ded.amount && (
                                                                                <div className="font-bold text-red-600">-{formatCurrency(ded.amount)}</div>
                                                                            )}
                                                                        </div>
                                                                        {ded.observation && <div className="text-red-500 mb-1">{ded.observation}</div>}
                                                                        <div className="flex gap-2 text-red-400">
                                                                            {ded.days && ded.days > 1 && <span>{ded.days} días</span>}
                                                                            {ded.start && <span>{new Date(ded.start).toLocaleDateString("es-CO")}</span>}
                                                                            {ded.affectsPerformance && (
                                                                                <span className="bg-red-100 px-1 rounded text-red-600 font-medium">
                                          Afecta rendimiento
                                        </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {bonusDeductions.length > 4 && (
                                                                    <div className="text-xs text-red-500 font-medium text-center pt-2 border-t border-red-200">
                                                                        +{bonusDeductions.length - 4} deducciones más...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Análisis de Kilómetros */}
                                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center">
                                                        <Route className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">Rendimiento Operativo</h3>
                                                        <p className="text-sm text-slate-500">Análisis de kilómetros</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="text-center p-3 bg-teal-50 rounded-lg">
                                                            <div className="text-lg font-bold text-teal-700">
                                                                {executedKm.toLocaleString("es-CO")}
                                                            </div>
                                                            <div className="text-xs text-teal-600">Ejecutados</div>
                                                        </div>
                                                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                                                            <div className="text-lg font-bold text-slate-700">
                                                                {programmedKm.toLocaleString("es-CO")}
                                                            </div>
                                                            <div className="text-xs text-slate-600">Programados</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Eficiencia</span>
                                                        <span className="font-bold text-teal-600">{kmEfficiencyClamped.toFixed(1)}%</span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-600">Diferencia</span>
                                                        <span className={`font-bold ${kmDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {kmDiffText} km
                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {activeTab === "kilometers" && (
                            <div className="p-6">
                                <KmDetailsTab userCode={operator.cedula ?? String(operator.id)} />
                            </div>
                        )}

                        {activeTab === "bonuses" && (
                            <div className="p-6">
                                <BonusDetailsTab userCode={operator.cedula ?? String(operator.id)} />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal de Imagen */}
            {showImageModal && employeeImageUrl && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        {/* Botón de cerrar */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowImageModal(false)
                            }}
                            className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 text-white"
                            aria-label="Cerrar imagen"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Imagen */}
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                                src={employeeImageUrl || "/placeholder.svg"}
                                alt={operator.name || "Foto del operador"}
                                width={800}
                                height={800}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                priority
                            />
                        </div>

                        {/* Información del empleado */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold">{operator.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-white/80 mt-1">
                                        {operator.position && <span>{operator.position}</span>}
                                        <span>Cédula: {operator.cedula || operator.document || "N/A"}</span>
                                        {operator.zona && <span>Zona: {operator.zona}</span>}
                                    </div>
                                </div>
                                {operator.category === "Oro" && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                                        <Crown className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export const OperatorDetailModal = EnhancedOperatorDetailModal
export default EnhancedOperatorDetailModal
