"use client"

import React, { useState, useMemo, useCallback, Suspense } from "react"
import {
    MapPin,
    Flame,
    ChevronLeft,
    ChevronRight,
    Search,
    TrendingUp,
    TrendingDown,
    Minus,
    Medal,
    Award,
    AlertTriangle,
    AlertCircle,
    Crown,
    CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

// Types
interface Operator {
    id: string
    codigo: string
    name: string
    cedula: string
    document?: string
    position: string
    zona?: string
    padrino?: string
    category: string
    avatar?: string
    image?: string
    streak: number
    trend?: "up" | "down" | "stable"
    lastUpdate?: string
    km: {
        total: number
        total_programado?: number
        total_ejecutado?: number
        percentage: number
        category: string
    }
    bonus: {
        total: number
        percentage: number
        category: string
    }
    efficiency: number
    annualEfficiency?: number
    timeFilter?: {
        type: "year" | "month"
        value: string | number
    }
    realRank?: number
}

interface OperatorsGridProps {
    operators: Operator[]
    onOperatorClick?: (operator: Operator) => void
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case "Oro":
            return <Crown className="w-4 h-4" />
        case "Plata":
            return <Medal className="w-4 h-4" />
        case "Bronce":
            return <Award className="w-4 h-4" />
        case "Mejorar":
            return <AlertTriangle className="w-4 h-4" />
        case "Taller Conciencia":
            return <AlertCircle className="w-4 h-4" />
        default:
            return <Award className="w-4 h-4" />
    }
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case "Oro":
            return { bg: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-700" }
        case "Plata":
            return { bg: "bg-gradient-to-r from-emerald-300 to-emerald-500", text: "text-emerald-600" }
        case "Bronce":
            return { bg: "bg-gradient-to-r from-emerald-200 to-emerald-400", text: "text-emerald-500" }
        case "Mejorar":
            return { bg: "bg-gradient-to-r from-green-300 to-green-500", text: "text-green-600" }
        case "Taller Conciencia":
            return { bg: "bg-gradient-to-r from-green-200 to-green-400", text: "text-green-500" }
        default:
            return { bg: "bg-gradient-to-r from-emerald-300 to-emerald-500", text: "text-emerald-600" }
    }
}

const getTrendIcon = (trend: string) => {
    switch (trend) {
        case "up":
            return <TrendingUp className="w-3 h-3 text-emerald-600" />
        case "down":
            return <TrendingDown className="w-3 h-3 text-green-600" />
        default:
            return <Minus className="w-3 h-3 text-gray-400" />
    }
}

const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/50"
    if (rank <= 10) return "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-400/40"
    return "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md shadow-green-400/30"
}

const formatNumber = (num: number, abbreviated = false, decimals = 0) => {
    if (abbreviated && num >= 1000000) {
        return (num / 1000000).toFixed(decimals) + "M"
    }
    if (abbreviated && num >= 1000) {
        return (num / 1000).toFixed(decimals) + "K"
    }
    return num.toLocaleString("es-CO", { maximumFractionDigits: decimals })
}

const formatPercentage = (num: number, decimals = 2) => {
    return `${num.toFixed(decimals)}%`
}

const OperatorCard = React.memo<{
    operator: Operator
    rank: number
    onClick: () => void
    allOperators: Operator[]
}>(({ operator, rank, onClick, allOperators }) => {
    const [imageError, setImageError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const colors = getCategoryColor(operator.category)

    const realRank = useMemo(() => {
        if (!allOperators || allOperators.length === 0) return rank

        const validOperators = allOperators.filter((op) => typeof op.efficiency === "number" && !isNaN(op.efficiency))

        if (validOperators.length === 0) return rank

        const sortedByEfficiency = [...validOperators].sort((a, b) => b.efficiency - a.efficiency)
        const identifier = operator.id || operator.codigo
        const foundRank = sortedByEfficiency.findIndex((op) => (op.id || op.codigo) === identifier) + 1

        return foundRank > 0 ? foundRank : validOperators.length
    }, [allOperators, operator.id, operator.codigo, rank])

    const documentId = operator.cedula || operator.document || String(operator.id)
    const imageUrl = `https://admon.sao6.com.co/web/uploads/empleados/${documentId}.jpg`

    const initials =
        operator.avatar ||
        operator.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()

    const handleImageError = () => {
        setImageError(true)
    }

    return (
        <div
            className="relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden group border border-gray-100 hover:border-emerald-300 hover:-translate-y-2 hover:scale-[1.02]"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-emerald-500/0 group-hover:from-emerald-500/8 group-hover:via-teal-500/5 group-hover:to-emerald-500/8 transition-all duration-700 pointer-events-none" />

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <div
                className={`absolute top-4 right-4 z-20 w-11 h-11 rounded-full ${getRankBadgeColor(realRank)} flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
            >
                #{realRank}
            </div>

            {operator.streak >= 30 && (
                <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                    <Flame className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-xs font-semibold">{operator.streak}</span>
                </div>
            )}

            <div className="p-6 relative z-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                        {/* Contenedor estilo tarjeta de identificación */}
                        <div className="w-32 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:scale-105">
                            {/* Foto del operador */}
                            <div className="w-full h-32 relative overflow-hidden">
                                {!imageError ? (
                                    <Image
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={operator.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                                        onError={handleImageError}
                                        priority
                                    />
                                ) : null}

                                {imageError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-xl">
                                        {initials}
                                    </div>
                                )}
                            </div>

                            {/* Banda inferior con categoría con curva hacia arriba */}
                            <div className="absolute bottom-0 left-0 right-0 h-8">
                                {/* Curva cóncava hacia arriba */}
                                <div
                                    className={`w-full h-full ${colors.bg} relative`}
                                    style={{
                                        clipPath: 'ellipse(60% 100% at 50% 100%)'
                                    }}
                                />
                                <div className={`absolute inset-0 ${colors.bg} flex items-center justify-center text-white shadow-inner`}>
                                    <div className="flex items-center gap-1.5 relative z-10">
                                        {getCategoryIcon(operator.category)}
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {operator.category === "Taller Conciencia" ? "TALLER DE CONCIENCIA" : operator.category.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-xl leading-tight transition-colors duration-300 group-hover:text-emerald-700">
                                {operator.name}
                            </h3>
                            {operator.efficiency >= 95 && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                            )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium transition-colors duration-300 group-hover:text-emerald-600">
                            {operator.position}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">{operator.zona || "Sin zona"}</span>
                        </div>
                        {operator.trend && (
                            <div className="flex items-center gap-1 transition-transform duration-300 group-hover:scale-110">
                                {getTrendIcon(operator.trend)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:-translate-y-1"
                        style={{ transitionDelay: "50ms" }}
                    >
                        <div className="text-xs text-emerald-600 mb-1 font-semibold">Eficiencia Actual</div>
                        <div
                            className={`font-bold text-base transition-all duration-300 ${operator.efficiency >= 100 ? "text-emerald-600" : "text-gray-900"} group-hover:scale-110`}
                        >
                            {formatPercentage(operator.efficiency || 0, 1)}
                        </div>
                    </div>

                    <div
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:-translate-y-1"
                        style={{ transitionDelay: "75ms" }}
                    >
                        <div className="text-xs text-green-600 mb-1 font-semibold">Eficiencia Anual</div>
                        {operator.annualEfficiency !== undefined ? (
                            <div
                                className={`font-bold text-base transition-all duration-300 ${(operator.annualEfficiency || 0) >= 100 ? "text-green-600" : "text-gray-900"} group-hover:scale-110`}
                            >
                                {formatPercentage(operator.annualEfficiency || 0, 1)}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-6">
                                <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    <div
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:-translate-y-1"
                        style={{ transitionDelay: "100ms" }}
                    >
                        <div className="text-xs text-teal-600 mb-1 font-semibold">Bonos</div>
                        <div className="font-bold text-base text-gray-900 transition-all duration-300 group-hover:scale-110">
                            ${formatNumber(operator.bonus.total, true, 0)}
                        </div>
                    </div>

                    <div
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:-translate-y-1"
                        style={{ transitionDelay: "125ms" }}
                    >
                        <div className="text-xs text-green-600 mb-1 font-semibold">KM</div>
                        <div className="font-bold text-base text-gray-900 transition-all duration-300 group-hover:scale-110">
                            {formatNumber(operator.km.total_ejecutado || operator.km.total, true, 1)}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Kilómetros</span>
                            <span
                                className={`text-xs font-bold transition-colors duration-300 ${operator.km.percentage >= 100 ? "text-emerald-600" : "text-gray-700"} group-hover:text-emerald-600`}
                            >
                {formatPercentage(operator.km.percentage, 1)}
              </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                                className="h-2.5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-sm relative overflow-hidden"
                                style={{
                                    width: `${Math.min(operator.km.percentage || 0, 100)}%`,
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Bonos</span>
                            <span
                                className={`text-xs font-bold transition-colors duration-300 ${operator.bonus.percentage >= 100 ? "text-emerald-600" : "text-gray-700"} group-hover:text-emerald-600`}
                            >
                {formatPercentage(operator.bonus.percentage, 1)}
              </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                                className="h-2.5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-sm relative overflow-hidden"
                                style={{
                                    width: `${Math.min(operator.bonus.percentage || 0, 100)}%`,
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-2xl flex items-center justify-center gap-2 group-hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10">Ver Detalles</span>
                        <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2 relative z-10" />
                    </button>
                </div>
            </div>
        </div>
    )
})

OperatorCard.displayName = "OperatorCard"

export { OperatorCard }

const OperatorCardSkeleton = () => (
    <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col items-center mb-6">
            <div className="w-28 h-28 bg-gray-200 rounded-3xl animate-pulse mb-4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4 mb-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
    </div>
)

export default function OperatorsGrid({ operators, onOperatorClick }: OperatorsGridProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(12)
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"rank" | "efficiency" | "annualEfficiency" | "bonus" | "km">("rank")
    const [operatorsWithAnnualEfficiency, setOperatorsWithAnnualEfficiency] = useState<Operator[]>([])
    const [isLoadingAnnualEfficiency, setIsLoadingAnnualEfficiency] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [lastOperatorsHash, setLastOperatorsHash] = useState<string>("")

    const operatorsWithRealRank = useMemo(() => {
        const sourceOperators = operatorsWithAnnualEfficiency.length > 0 ? operatorsWithAnnualEfficiency : operators
        
        if (sourceOperators.length === 0) return []

        const validOperators = sourceOperators.filter((op) => typeof op.efficiency === "number" && !isNaN(op.efficiency))

        if (validOperators.length === 0) {
            return sourceOperators.map((op) => ({ ...op, realRank: 1 }))
        }

        const sortedByEfficiency = [...validOperators].sort((a, b) => b.efficiency - a.efficiency)

        const operatorsWithRank = sourceOperators.map((operator) => {
            const identifier = operator.id || operator.codigo
            const realRank = sortedByEfficiency.findIndex((op) => (op.id || op.codigo) === identifier) + 1
            const finalRank = realRank > 0 ? realRank : sortedByEfficiency.length

            return {
                ...operator,
                realRank: finalRank,
            }
        })

        return operatorsWithRank
    }, [operators, operatorsWithAnnualEfficiency])

    const finalOperators =
        operatorsWithRealRank.length > 0
            ? operatorsWithRealRank
            : (() => {
                if (operators.length === 0) return []

                const validOperators = operators.filter((op) => typeof op.efficiency === "number" && !isNaN(op.efficiency))

                if (validOperators.length === 0) {
                    return operators.map((op) => ({ ...op, realRank: 1 }))
                }

                const sortedByEfficiency = [...validOperators].sort((a, b) => b.efficiency - a.efficiency)

                return operators.map((operator) => {
                    const identifier = operator.id || operator.codigo
                    const realRank = sortedByEfficiency.findIndex((op) => (op.id || op.codigo) === identifier) + 1
                    const finalRank = realRank > 0 ? realRank : sortedByEfficiency.length

                    return {
                        ...operator,
                        realRank: finalRank,
                    }
                })
            })()

    const filteredOperators = useMemo(() => {
        const filtered = finalOperators.filter((operator) => {
            const matchesSearch =
                operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (operator.zona?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (operator.padrino?.toLowerCase() || "").includes(searchTerm.toLowerCase())
            const matchesCategory = categoryFilter === "all" || operator.category === categoryFilter
            return matchesSearch && matchesCategory
        })

        filtered.sort((a, b) => {
            switch (sortBy) {
                case "efficiency":
                    return b.efficiency - a.efficiency
                case "annualEfficiency":
                    return (b.annualEfficiency || 0) - (a.annualEfficiency || 0)
                case "bonus":
                    return b.bonus.total - a.bonus.total
                case "km":
                    return (b.km.total_ejecutado || 0) - (a.km.total_ejecutado || 0)
                default:
                    return 0
            }
        })

        return filtered
    }, [finalOperators, searchTerm, categoryFilter, sortBy])

    const totalPages = Math.ceil(filteredOperators.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedOperators = filteredOperators.slice(startIndex, startIndex + itemsPerPage)

    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(finalOperators.map((op) => op.category))]
        return uniqueCategories
    }, [finalOperators])

    // Fetch annual efficiency for all operators in batches
    React.useEffect(() => {
        const fetchAnnualEfficiency = async () => {
            if (operators.length === 0) return
            
            // Create a simple hash to detect if operators changed
            const operatorsHash = operators.map(op => op.codigo || op.id).join(',')
            if (operatorsHash === lastOperatorsHash && operatorsWithAnnualEfficiency.length === operators.length) {
                return // Skip if same operators and already loaded
            }

            setIsLoadingAnnualEfficiency(true)
            setLoadingProgress(0)
            setLastOperatorsHash(operatorsHash)
            const currentYear = new Date().getFullYear()
            const batchSize = 10 // Process 10 operators at a time
            const results: Operator[] = []

            try {
                // Process operators in batches to avoid overwhelming the server
                for (let i = 0; i < operators.length; i += batchSize) {
                    const batch = operators.slice(i, i + batchSize)
                    
                    const batchResults = await Promise.all(
                        batch.map(async (operator, batchIndex) => {
                            try {
                                const operatorCode = operator.codigo
                                if (!operatorCode) {
                                    return {
                                        ...operator,
                                        annualEfficiency: 0
                                    }
                                }

                                const response = await fetch(`/api/user/global-efficiency?userCode=${operatorCode}&year=${currentYear}`)
                                const result = await response.json()
                                
                                return {
                                    ...operator,
                                    annualEfficiency: result.success ? result.data.efficiency : 0
                                }
                            } catch (error) {
                                return {
                                    ...operator,
                                    annualEfficiency: 0
                                }
                            }
                        })
                    )
                    
                    results.push(...batchResults)
                    
                    // Update progress
                    const progress = Math.min((results.length / operators.length) * 100, 100)
                    setLoadingProgress(progress)
                    
                    // Update state with partial results for better UX
                    setOperatorsWithAnnualEfficiency([...results])
                    
                    // Small delay between batches to be nice to the server
                    if (i + batchSize < operators.length) {
                        await new Promise(resolve => setTimeout(resolve, 100))
                    }
                }
                
            } catch (error) {
                setOperatorsWithAnnualEfficiency(operators.map(op => ({ ...op, annualEfficiency: 0 })))
            } finally {
                setIsLoadingAnnualEfficiency(false)
            }
        }

        fetchAnnualEfficiency()
    }, [operators, lastOperatorsHash, operatorsWithAnnualEfficiency.length])

    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, categoryFilter, sortBy])

    const handleOperatorClick = useCallback(
        (operator: Operator) => {
            onOperatorClick?.(operator)
        },
        [onOperatorClick],
    )

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 min-h-screen">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-1">Operadores</h1>
                    <p className="text-gray-600 text-base font-medium">
                        {filteredOperators.length} de {finalOperators.length} operadores
                        {isLoadingAnnualEfficiency && (
                            <span className="ml-2 text-green-600 text-sm flex items-center gap-2">
                                • Cargando eficiencia anual... ({Math.round(loadingProgress)}%)
                                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        placeholder="Buscar operadores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 bg-white rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 h-12 text-base shadow-sm"
                    />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-white rounded-xl border-gray-200 h-12 shadow-sm">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-48 bg-white rounded-xl border-gray-200 h-12 shadow-sm">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="rank">Ranking</SelectItem>
                        <SelectItem value="efficiency">Eficiencia Actual</SelectItem>
                        <SelectItem value="annualEfficiency">Eficiencia Anual</SelectItem>
                        <SelectItem value="bonus">Bonos</SelectItem>
                        <SelectItem value="km">Kilómetros</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-full sm:w-32 bg-white rounded-xl border-gray-200 h-12 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="6">6 por página</SelectItem>
                        <SelectItem value="12">12 por página</SelectItem>
                        <SelectItem value="24">24 por página</SelectItem>
                        <SelectItem value="48">48 por página</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Suspense
                fallback={
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: itemsPerPage }).map((_, i) => (
                            <OperatorCardSkeleton key={i} />
                        ))}
                    </div>
                }
            >
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedOperators.map((operator) => (
                        <OperatorCard
                            key={operator.id}
                            operator={operator}
                            rank={0}
                            onClick={() => handleOperatorClick(operator)}
                            allOperators={finalOperators}
                        />
                    ))}
                </div>
            </Suspense>

            {filteredOperators.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-28 h-28 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron operadores</h3>
                    <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-5 rounded-xl shadow-md border border-gray-100">
                    <div className="text-sm text-gray-600 font-medium">
                        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOperators.length)} de{" "}
                        {filteredOperators.length} resultados
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-xl h-10 px-4 font-semibold"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Anterior
                        </Button>

                        <div className="flex items-center gap-1">
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
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl font-semibold ${currentPage === pageNum ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md" : ""}`}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded-xl h-10 px-4 font-semibold"
                        >
                            Siguiente
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
