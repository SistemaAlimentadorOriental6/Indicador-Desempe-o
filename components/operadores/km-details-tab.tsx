"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import {
    Loader2,
    Calendar,
    TrendingUp,
    Target,
    CheckCircle,
    Filter,
    BarChart3,
    MapPin,
    Clock,
    X,
    Activity,
    Zap,
} from "lucide-react"

interface KmDetailsTabProps {
    userCode: string
}

interface KmRecord {
    year: number
    month: number
    monthName: string
    valor_programacion: string | number
    valor_ejecucion: string | number
    percentage: number
}

interface KmSummary {
    totalProgrammed: string | number
    totalExecuted: string | number
    percentage: number
}

interface KmResponse {
    data: KmRecord[]
    summary: KmSummary
    availableYears?: number[]
    availableMonths?: number[]
}

const KmDetailsTab: React.FC<KmDetailsTabProps> = ({ userCode }) => {
    const [data, setData] = useState<KmResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [availableYears, setAvailableYears] = useState<number[]>([])
    const [availableMonths, setAvailableMonths] = useState<number[]>([])
    const [selectedRow, setSelectedRow] = useState<KmRecord | null>(null)
    const [chartYearFilter, setChartYearFilter] = useState<number | null>(null)
    const [hoveredPoint, setHoveredPoint] = useState<KmRecord | null>(null)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(false)
    const [sliderDirection, setSliderDirection] = useState<"next" | "prev">("next")

    const itemsPerSlide = 6

    useEffect(() => {
        const fetchKm = async () => {
            try {
                setLoading(true)
                setError(null)
                let url = `/api/user/kilometers?codigo=${userCode}`
                if (selectedYear) url += `&year=${selectedYear}`
                if (selectedMonth) url += `&month=${selectedMonth}`
                const res = await fetch(url)
                if (!res.ok) throw new Error("Error al obtener datos de kilómetros")
                const json = await res.json()
                const payload = json?.data ?? json
                setData(payload)
                setAvailableYears(payload.availableYears || [])
                setAvailableMonths(payload.availableMonths || [])
                setCurrentSlide(0)
            } catch (err: any) {
                setError(err.message ?? "Error desconocido")
            } finally {
                setLoading(false)
            }
        }
        if (userCode) fetchKm()
    }, [userCode, selectedYear, selectedMonth])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (isAutoPlaying && data?.data && data.data.length > itemsPerSlide) {
            interval = setInterval(() => {
                nextSlide()
            }, 3000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isAutoPlaying, currentSlide, data])

    // Initialize chart year filter with the first available year
    useEffect(() => {
        if (availableYears.length > 0 && chartYearFilter === null) {
            setChartYearFilter(availableYears[0])
        }
    }, [availableYears, chartYearFilter])

    const chartData = useMemo(() => {
        if (!data?.data) return []

        let filteredData = [...data.data]
        if (chartYearFilter) {
            filteredData = filteredData.filter((d) => d.year === chartYearFilter)
        }

        return filteredData.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            return a.month - b.month
        })
    }, [data, chartYearFilter])

    const totalSlides = Math.ceil((data?.data?.length || 0) / itemsPerSlide)

    const nextSlide = () => {
        setSliderDirection("next")
        setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }

    const prevSlide = () => {
        setSliderDirection("prev")
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
    }

    const goToSlide = (index: number) => {
        setSliderDirection(index > currentSlide ? "next" : "prev")
        setCurrentSlide(index)
    }

    const visibleRecords = useMemo(() => {
        if (!data?.data) return []
        const start = currentSlide * itemsPerSlide
        return data.data.slice(start, start + itemsPerSlide)
    }, [data, currentSlide, itemsPerSlide])

    const getEfficiencyColor = (percentage: number) => {
        if (percentage >= 100) return "text-emerald-700"
        if (percentage >= 80) return "text-emerald-600"
        if (percentage >= 60) return "text-yellow-600"
        return "text-orange-600"
    }

    const getEfficiencyBg = (percentage: number) => {
        if (percentage >= 100) return "bg-emerald-50 border-emerald-300"
        if (percentage >= 80) return "bg-emerald-50/70 border-emerald-200"
        if (percentage >= 60) return "bg-yellow-50 border-yellow-200"
        return "bg-orange-50 border-orange-200"
    }

    const getEfficiencyGradient = (percentage: number) => {
        if (percentage >= 100) return "from-emerald-500 to-emerald-600"
        if (percentage >= 80) return "from-emerald-400 to-emerald-500"
        if (percentage >= 60) return "from-yellow-400 to-yellow-500"
        return "from-orange-400 to-orange-500"
    }

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-3xl animate-pulse shadow-2xl"></div>
                    <div className="absolute inset-2 bg-white rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                    </div>
                </div>
                <p className="text-emerald-700 font-bold text-lg animate-pulse">Cargando datos de kilómetros...</p>
                <div className="flex gap-2 mt-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
            </div>
        )

    if (error)
        return (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-8 text-center shadow-xl animate-shake">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                    <X className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Error al cargar datos</h3>
                <p className="text-red-600">{error}</p>
            </div>
        )

    if (!data)
        return (
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 text-center shadow-xl animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <BarChart3 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-emerald-700 mb-2">Sin datos disponibles</h3>
                <p className="text-emerald-600">No se encontraron registros de kilómetros</p>
            </div>
        )

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-8 pb-20">
                <div className="flex items-center gap-4 mb-6 animate-slide-in-left">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl shadow-2xl animate-pulse-slow"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                            <MapPin className="w-8 h-8 text-white animate-float" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                            Análisis de Kilómetros
                        </h2>
                        <p className="text-emerald-600 font-semibold text-lg">Seguimiento detallado del rendimiento operativo</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-emerald-100 hover:shadow-3xl transition-all duration-500 animate-slide-in-right">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                            <Filter className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-800">Filtros de Búsqueda</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
                            <label className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                                <Calendar className="w-5 h-5 text-emerald-500 animate-pulse-slow" />
                                Año
                            </label>
                            <select
                                className="w-full appearance-none bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-xl px-4 py-4 text-emerald-800 font-semibold shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-400 transition-all hover:border-emerald-300 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer"
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

                        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
                            <label className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                                <Clock className="w-5 h-5 text-emerald-500 animate-pulse-slow" />
                                Mes
                            </label>
                            <select
                                className="w-full appearance-none bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-xl px-4 py-4 text-emerald-800 font-semibold shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-400 transition-all hover:border-emerald-300 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer"
                                value={selectedMonth ?? ""}
                                onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Todos los meses</option>
                                {availableMonths.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end animate-fade-in" style={{ animationDelay: "300ms" }}>
                            {(selectedYear || selectedMonth) && (
                                <button
                                    className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 duration-300"
                                    onClick={() => {
                                        setSelectedYear(null)
                                        setSelectedMonth(null)
                                    }}
                                >
                  <span className="flex items-center justify-center gap-2">
                    <X className="w-5 h-5" />
                    Limpiar Filtros
                  </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-emerald-100 hover:shadow-3xl transition-all duration-500 animate-slide-in-up">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                <TrendingUp className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-800">Rendimiento Mensual</h3>
                        </div>

                        <div className="flex items-center gap-3 animate-fade-in">
                            <label className="text-sm font-bold text-emerald-700">Año:</label>
                            <select
                                className="appearance-none bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-xl px-4 py-2 text-emerald-800 font-semibold shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-400 transition-all hover:border-emerald-300 hover:shadow-lg cursor-pointer"
                                value={chartYearFilter ?? ""}
                                onChange={(e) => setChartYearFilter(e.target.value ? Number(e.target.value) : null)}
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {chartYearFilter && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-white border-2 border-emerald-200 rounded-2xl shadow-md animate-fade-in">
                            <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-700 font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-pulse" />
                  Mostrando datos del año {chartYearFilter}
                </span>
                                <span className="text-emerald-600 font-semibold px-4 py-2 bg-white rounded-lg shadow-sm">
                  {chartData.length} registros
                </span>
                            </div>
                        </div>
                    )}

                    <div className="relative bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 rounded-2xl p-8 border-2 border-emerald-100 overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 animate-shimmer"></div>

                        {chartData.length > 0 ? (
                            <div className="relative">
                                <svg width="100%" height="600" viewBox="0 0 1200 600" className="overflow-visible">
                                    <defs>
                                        <linearGradient id="kmEfficiencyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.05" />
                                        </linearGradient>
                                        <filter id="kmGlow">
                                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                        <filter id="kmShadow">
                                            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" />
                                        </filter>
                                    </defs>

                                    {/* Background grid */}
                                    <rect
                                        x="120"
                                        y="60"
                                        width="1000"
                                        height="400"
                                        fill="rgb(249, 252, 251)"
                                        stroke="rgb(209, 250, 229)"
                                        strokeWidth="2"
                                        rx="16"
                                    />

                                    {/* Horizontal grid lines */}
                                    {[0, 20, 40, 60, 80, 100, 120].map((percent) => {
                                        const y = 460 - (percent / 120) * 400
                                        return (
                                            <g key={`hgrid-${percent}`}>
                                                <line
                                                    x1="120"
                                                    y1={y}
                                                    x2="1120"
                                                    y2={y}
                                                    stroke="rgb(209, 250, 229)"
                                                    strokeWidth="1.5"
                                                    strokeDasharray="8 4"
                                                    opacity="0.6"
                                                />
                                                <text x="105" y={y + 5} textAnchor="end" className="text-sm fill-emerald-700 font-bold">
                                                    {percent}%
                                                </text>
                                            </g>
                                        )
                                    })}

                                    {/* Vertical grid lines */}
                                    {chartData.map((_, index) => {
                                        const x = 120 + (index / Math.max(chartData.length - 1, 1)) * 1000
                                        return (
                                            <line
                                                key={`grid-${index}`}
                                                x1={x}
                                                y1="60"
                                                x2={x}
                                                y2="460"
                                                stroke="rgb(209, 250, 229)"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                                opacity="0.4"
                                            />
                                        )
                                    })}

                                    {/* 100% target line */}
                                    <line
                                        x1="120"
                                        y1={460 - (100 / 120) * 400}
                                        x2="1120"
                                        y2={460 - (100 / 120) * 400}
                                        stroke="rgb(5, 150, 105)"
                                        strokeWidth="3"
                                        strokeDasharray="12 6"
                                        opacity="0.9"
                                        filter="url(#kmGlow)"
                                    />

                                    {/* Area fill */}
                                    {chartData.length > 0 && (
                                        <path
                                            d={
                                                `M 120 460 ` +
                                                chartData
                                                    .map((record, index) => {
                                                        const x = 120 + (index / Math.max(chartData.length - 1, 1)) * 1000
                                                        const y = 460 - (Math.min(record.percentage, 120) / 120) * 400
                                                        return `L ${x} ${y}`
                                                    })
                                                    .join(" ") +
                                                ` L ${120 + ((chartData.length - 1) / Math.max(chartData.length - 1, 1)) * 1000} 460 Z`
                                            }
                                            fill="url(#kmEfficiencyGradient)"
                                            opacity="0.6"
                                        />
                                    )}

                                    {/* Line chart */}
                                    {chartData.length > 1 && (
                                        <path
                                            d={chartData
                                                .map((record, index) => {
                                                    const x = 120 + (index / Math.max(chartData.length - 1, 1)) * 1000
                                                    const y = 460 - (Math.min(record.percentage, 120) / 120) * 400
                                                    return `${index === 0 ? "M" : "L"} ${x} ${y}`
                                                })
                                                .join(" ")}
                                            fill="none"
                                            stroke="rgb(16, 185, 129)"
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            filter="url(#kmGlow)"
                                        />
                                    )}

                                    {/* Data points */}
                                    {chartData.map((record, index) => {
                                        const x = 120 + (index / Math.max(chartData.length - 1, 1)) * 1000
                                        const y = 460 - (Math.min(record.percentage, 120) / 120) * 400
                                        const isHovered = hoveredPoint === record
                                        const isExcellent = record.percentage >= 100
                                        const isGood = record.percentage >= 80

                                        return (
                                            <g
                                                key={`point-${index}`}
                                                className="animate-pop-in"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <circle
                                                    cx={x}
                                                    cy={y}
                                                    r={isHovered ? "12" : "8"}
                                                    fill={isExcellent ? "rgb(5, 150, 105)" : isGood ? "rgb(16, 185, 129)" : "rgb(34, 197, 94)"}
                                                    stroke="white"
                                                    strokeWidth="4"
                                                    className="cursor-pointer transition-all duration-300"
                                                    onMouseEnter={() => setHoveredPoint(record)}
                                                    onMouseLeave={() => setHoveredPoint(null)}
                                                    filter="url(#kmShadow)"
                                                />
                                                <text
                                                    x={x}
                                                    y={y - 20}
                                                    textAnchor="middle"
                                                    className="text-sm fill-emerald-900 font-bold"
                                                    filter="drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9))"
                                                >
                                                    {record.percentage.toFixed(1)}%
                                                </text>
                                                {isHovered && (
                                                    <>
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r="20"
                                                            fill="none"
                                                            stroke="rgb(16, 185, 129)"
                                                            strokeWidth="3"
                                                            opacity="0.6"
                                                            className="animate-ping-slow"
                                                        />
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r="15"
                                                            fill="none"
                                                            stroke="rgb(16, 185, 129)"
                                                            strokeWidth="2"
                                                            opacity="0.4"
                                                        />
                                                    </>
                                                )}
                                            </g>
                                        )
                                    })}

                                    {/* Month labels */}
                                    {chartData.map((record, index) => {
                                        const x = 120 + (index / Math.max(chartData.length - 1, 1)) * 1000
                                        return (
                                            <text
                                                key={`label-${index}`}
                                                x={x}
                                                y="490"
                                                textAnchor="middle"
                                                className="text-sm fill-emerald-800 font-bold"
                                                transform={`rotate(-45 ${x} 490)`}
                                            >
                                                {record.monthName.substring(0, 3)}
                                            </text>
                                        )
                                    })}

                                    {/* Axis labels */}
                                    <text
                                        x="40"
                                        y="260"
                                        textAnchor="middle"
                                        className="text-lg fill-emerald-800 font-bold"
                                        transform="rotate(-90 40 260)"
                                    >
                                        Eficiencia (%)
                                    </text>
                                    <text x="620" y="560" textAnchor="middle" className="text-lg fill-emerald-800 font-bold">
                                        Período
                                    </text>
                                </svg>

                                {/* Legend */}
                                <div className="flex items-center justify-center gap-8 mt-6">
                                    <div className="flex items-center gap-2 animate-fade-in">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg animate-pulse-slow"></div>
                                        <span className="text-sm font-bold text-emerald-800">Eficiencia Mensual</span>
                                    </div>
                                    <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
                                        <div className="w-5 h-1 bg-emerald-700 shadow-md"></div>
                                        <span className="text-sm font-bold text-emerald-800">Meta 100%</span>
                                    </div>
                                </div>

                                {/* Hover tooltip */}
                                {hoveredPoint && (
                                    <div className="absolute top-4 right-4 bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-2xl z-10 animate-scale-in backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-base font-bold text-emerald-900 mb-4">
                                            <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                                            {hoveredPoint.monthName} {hoveredPoint.year}
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between gap-8 p-2 bg-emerald-50 rounded-lg">
                        <span className="text-emerald-700 font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Programado:
                        </span>
                                                <span className="font-bold text-emerald-900">
                          {Number(hoveredPoint.valor_programacion).toLocaleString("es-CO")} km
                        </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-8 p-2 bg-emerald-50 rounded-lg">
                        <span className="text-emerald-700 font-semibold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Ejecutado:
                        </span>
                                                <span className="font-bold text-emerald-900">
                          {Number(hoveredPoint.valor_ejecucion).toLocaleString("es-CO")} km
                        </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-8 pt-3 border-t-2 border-emerald-200">
                        <span className="text-emerald-700 font-semibold flex items-center gap-2">
                          <Zap className="w-4 h-4 animate-pulse" />
                          Eficiencia:
                        </span>
                                                <span className={`font-bold text-xl ${getEfficiencyColor(hoveredPoint.percentage)}`}>
                          {hoveredPoint.percentage.toFixed(1)}%
                        </span>
                                            </div>
                                            <div className="text-center pt-2">
                        <span
                            className={`inline-block px-4 py-2 rounded-xl text-xs font-bold border-2 ${getEfficiencyBg(hoveredPoint.percentage)} shadow-md`}
                        >
                          {hoveredPoint.percentage >= 100
                              ? "🏆 Excelente"
                              : hoveredPoint.percentage >= 80
                                  ? "👍 Bueno"
                                  : hoveredPoint.percentage >= 60
                                      ? "⚠️ Regular"
                                      : "📊 Necesita Mejorar"}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[600px] text-emerald-600">
                                <div className="text-center animate-fade-in">
                                    <TrendingUp className="w-24 h-24 mx-auto mb-6 text-emerald-400 animate-float" />
                                    <p className="font-bold text-2xl">No hay datos para mostrar</p>
                                    <p className="text-xl text-emerald-500 mt-3">
                                        {chartYearFilter
                                            ? `No se encontraron registros para el año ${chartYearFilter}`
                                            : "Selecciona un año para ver los datos"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        className="bg-white rounded-2xl p-6 shadow-xl border-2 border-emerald-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-in-up"
                        style={{ animationDelay: "100ms" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                <Target className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-emerald-600 font-bold mb-1">Programado</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                                    {Number(data.summary?.totalProgrammed ?? 0).toLocaleString("es-CO")}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-4 shadow-inner overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 h-4 rounded-full w-full animate-shimmer"></div>
                        </div>
                        <p className="text-xs text-emerald-600 font-bold mt-3">Kilómetros planificados</p>
                    </div>

                    <div
                        className="bg-white rounded-2xl p-6 shadow-xl border-2 border-emerald-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-in-up"
                        style={{ animationDelay: "200ms" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-emerald-600 font-bold mb-1">Ejecutado</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                                    {Number(data.summary?.totalExecuted ?? 0).toLocaleString("es-CO")}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-4 shadow-inner overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 h-4 rounded-full transition-all duration-1000 ease-out animate-grow-width"
                                style={{ width: `${Math.min(data.summary?.percentage ?? 0, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-emerald-600 font-bold mt-3">Kilómetros completados</p>
                    </div>

                    <div
                        className="bg-white rounded-2xl p-6 shadow-xl border-2 border-emerald-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-in-up"
                        style={{ animationDelay: "300ms" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-emerald-600 font-bold mb-1">Eficiencia</p>
                                <p className={`text-3xl font-bold ${getEfficiencyColor(data.summary?.percentage ?? 0)}`}>
                                    {(data.summary?.percentage ?? 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-4 shadow-inner overflow-hidden">
                            <div
                                className={`bg-gradient-to-r ${getEfficiencyGradient(data.summary?.percentage ?? 0)} h-4 rounded-full transition-all duration-1000 ease-out animate-grow-width`}
                                style={{ width: `${Math.min(data.summary?.percentage ?? 0, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-emerald-600 font-bold mt-3">Porcentaje de cumplimiento</p>
                    </div>
                </div>

                {data?.data && data.data.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden hover:shadow-3xl transition-all duration-500 animate-slide-in-up">
                        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-8 py-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Registro Detallado por Período</h3>
                                    <p className="text-emerald-100 text-sm font-medium">Total de {data.data.length} registros</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-emerald-50 to-white border-b-2 border-emerald-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Período
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Programado
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Ejecutado
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Eficiencia
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-emerald-100">
                                {data.data.map((rec, idx) => (
                                    <tr
                                        key={`${rec.year}-${rec.month}`}
                                        className="hover:bg-emerald-50/50 transition-all duration-200 cursor-pointer animate-fade-in transform hover:scale-[1.01]"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                        onClick={() => setSelectedRow(selectedRow === rec ? null : rec)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center shadow-sm">
                                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-emerald-900">
                                                        {rec.monthName} {rec.year}
                                                    </div>
                                                    <div className="text-xs text-emerald-600">Período de análisis</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-emerald-900">
                                                {Number(rec.valor_programacion).toLocaleString("es-CO")}
                                            </div>
                                            <div className="text-xs text-emerald-600">km</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-emerald-900">
                                                {Number(rec.valor_ejecucion).toLocaleString("es-CO")}
                                            </div>
                                            <div className="text-xs text-emerald-600">km</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className={`text-sm font-bold ${getEfficiencyColor(rec.percentage)}`}>
                                                {rec.percentage.toFixed(1)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {rec.percentage >= 100 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border-2 border-emerald-300 shadow-sm">
                            <TrendingUp className="w-3.5 h-3.5 mr-1" />
                            Excelente
                          </span>
                                            ) : rec.percentage >= 80 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600 border-2 border-emerald-200 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Bueno
                          </span>
                                            ) : rec.percentage >= 60 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border-2 border-yellow-200 shadow-sm">
                            <Target className="w-3.5 h-3.5 mr-1" />
                            Regular
                          </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border-2 border-orange-200 shadow-sm">
                            <X className="w-3.5 h-3.5 mr-1" />
                            Bajo
                          </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {selectedRow && (
                    <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
                                    <Activity className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-emerald-800">Detalle del Período Seleccionado</h4>
                                    <p className="text-base text-emerald-600 font-bold">{`${selectedRow.monthName} ${selectedRow.year}`}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRow(null)}
                                className="p-3 bg-white hover:bg-red-50 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 border-2 border-emerald-200 hover:border-red-300"
                            >
                                <X className="w-6 h-6 text-emerald-700 hover:text-red-600" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-6 h-6 text-emerald-600 animate-pulse-slow" />
                                    <span className="text-sm font-bold text-emerald-700">Año</span>
                                </div>
                                <p className="text-3xl font-bold text-emerald-900">{selectedRow.year}</p>
                            </div>

                            <div
                                className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                                style={{ animationDelay: "100ms" }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-6 h-6 text-emerald-600 animate-pulse-slow" />
                                    <span className="text-sm font-bold text-emerald-700">Mes</span>
                                </div>
                                <p className="text-3xl font-bold text-emerald-900">{selectedRow.monthName}</p>
                            </div>

                            <div
                                className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                                style={{ animationDelay: "200ms" }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Target className="w-6 h-6 text-emerald-600 animate-pulse-slow" />
                                    <span className="text-sm font-bold text-emerald-700">Programado</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-900">
                                    {Number(selectedRow.valor_programacion).toLocaleString("es-CO")} km
                                </p>
                            </div>

                            <div
                                className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                                style={{ animationDelay: "300ms" }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-6 h-6 text-emerald-600 animate-pulse-slow" />
                                    <span className="text-sm font-bold text-emerald-700">Ejecutado</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-900">
                                    {Number(selectedRow.valor_ejecucion).toLocaleString("es-CO")} km
                                </p>
                            </div>

                            <div
                                className="bg-white rounded-2xl p-8 border-2 border-emerald-200 shadow-lg hover:shadow-2xl transition-all duration-300 md:col-span-2 lg:col-span-4 animate-fade-in"
                                style={{ animationDelay: "400ms" }}
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <Zap className="w-6 h-6 text-emerald-600 animate-pulse" />
                                    <span className="text-base font-bold text-emerald-700">Análisis de Eficiencia</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className={`text-4xl font-bold ${getEfficiencyColor(selectedRow.percentage)}`}>
                                        {selectedRow.percentage.toFixed(1)}%
                                    </p>
                                    <div className="flex-1 bg-emerald-100 rounded-full h-6 shadow-inner overflow-hidden">
                                        <div
                                            className={`bg-gradient-to-r ${getEfficiencyGradient(selectedRow.percentage)} h-6 rounded-full transition-all duration-1000 shadow-lg animate-grow-width`}
                                            style={{ width: `${Math.min(selectedRow.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span
                                        className={`text-lg font-bold min-w-[120px] px-4 py-2 rounded-xl border-2 ${getEfficiencyBg(selectedRow.percentage)} shadow-md`}
                                    >
                    {selectedRow.percentage >= 100
                        ? "🏆 Excelente"
                        : selectedRow.percentage >= 80
                            ? "👍 Bueno"
                            : selectedRow.percentage >= 60
                                ? "⚠️ Regular"
                                : "📊 Mejorar"}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slide-in-left {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes pop-in {
                    from {
                        opacity: 0;
                        transform: scale(0);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }

                @keyframes ping-slow {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                @keyframes grow-width {
                    from {
                        width: 0;
                    }
                }

                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-5px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(5px);
                    }
                }

                .animate-slide-in-left {
                    animation: slide-in-left 0.6s ease-out;
                }

                .animate-slide-in-right {
                    animation: slide-in-right 0.6s ease-out;
                }

                .animate-slide-in-up {
                    animation: slide-in-up 0.6s ease-out;
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-scale-in {
                    animation: scale-in 0.4s ease-out;
                }

                .animate-pop-in {
                    animation: pop-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }

                .animate-ping-slow {
                    animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
                    background-size: 1000px 100%;
                    animation: shimmer 2s infinite;
                }

                .animate-grow-width {
                    animation: grow-width 1.5s ease-out;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .shadow-3xl {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </div>
    )
}

export default KmDetailsTab
