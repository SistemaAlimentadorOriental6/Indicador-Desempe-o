"use client"

import React, { useState, useMemo, useCallback, Suspense } from "react"
import {
  DollarSign,
  MapPin,
  Flame,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Search,
  Grid,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Award,
  AlertTriangle,
  AlertCircle,
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image'

// Types (manteniendo los originales)
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
  timeFilter?: {
    type: "year" | "month"
    value: string | number
  }
  realRank?: number // Ranking real basado en eficiencia global
}

interface OperatorsGridProps {
  operators: Operator[]
  onOperatorClick?: (operator: Operator) => void
}

// Utility functions (exactamente como las tenías)
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
    case "Revisar":
      return <Search className="w-4 h-4" />
    default:
      return <Award className="w-4 h-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Oro":
      return { bg: "bg-gradient-to-r from-yellow-400 to-yellow-600" }
    case "Plata":
      return { bg: "bg-gradient-to-r from-gray-400 to-gray-600" }
    case "Bronce":
      return { bg: "bg-gradient-to-r from-amber-400 to-amber-600" }
    case "Mejorar":
      return { bg: "bg-gradient-to-r from-orange-400 to-orange-600" }
    case "Taller Conciencia":
      return { bg: "bg-gradient-to-r from-red-400 to-red-600" }
    case "Revisar":
      return { bg: "bg-gradient-to-r from-purple-400 to-purple-600" }
    default:
      return { bg: "bg-gradient-to-r from-gray-400 to-gray-600" }
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-3 h-3 text-green-500" />
    case "down":
      return <TrendingDown className="w-3 h-3 text-red-500" />
    default:
      return <Minus className="w-3 h-3 text-gray-500" />
  }
}

const getRankBadgeColor = (rank: number) => {
  if (rank <= 3) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
  if (rank <= 10) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
  return "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
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

// Optimized Operator Card Component (manteniendo tu diseño exacto)
const OperatorCard = React.memo<{
  operator: Operator
  rank: number
  onClick: () => void
  allOperators: Operator[] // Agregar todos los operadores para calcular ranking
}>(({ operator, rank, onClick, allOperators }) => {
  const [imageError, setImageError] = useState(false)
  const colors = getCategoryColor(operator.category)
  
  // Calcular ranking real directamente en el componente
  const realRank = useMemo(() => {
    if (!allOperators || allOperators.length === 0) return rank
    
    const validOperators = allOperators.filter(op => 
      typeof op.efficiency === 'number' && !isNaN(op.efficiency)
    )
    
    if (validOperators.length === 0) return rank
    
    const sortedByEfficiency = [...validOperators].sort((a, b) => b.efficiency - a.efficiency)
    const identifier = operator.id || operator.codigo
    const foundRank = sortedByEfficiency.findIndex(op => (op.id || op.codigo) === identifier) + 1
    
    return foundRank > 0 ? foundRank : validOperators.length
  }, [allOperators, operator.id, operator.codigo, rank])
  
  // Debug: mostrar el ranking que se está usando
  console.log(`Operador ${operator.name}:`, {
    realRank: realRank,
    efficiency: operator.efficiency,
    id: operator.id,
    rank: rank
  })
  
  // Construir la URL de la imagen usando la cédula o documento como respaldo
  const documentId = operator.cedula || operator.document || String(operator.id)
  const imageUrl = `https://admon.sao6.com.co/web/uploads/empleados/${documentId}.jpg`

  // Obtener iniciales del nombre
  const initials = operator.avatar || operator.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // Función para manejar error de carga de imagen
  const handleImageError = () => {
    console.log('Error al cargar la imagen del operador:', operator.name)
    setImageError(true)
  }

  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group hover:scale-[1.02]"
      onClick={onClick}
    >
      {/* Rank Badge - ajustado a la esquina superior derecha */}
      <div
        className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full ${getRankBadgeColor(realRank)} flex items-center justify-center text-sm font-bold shadow-lg`}
        title={`Ranking real: ${realRank}`}
      >
        {realRank}
      </div>

      {/* Background Pattern - manteniendo tu patrón */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50" />

      <div className="relative z-10 p-6">
        {/* Header con imagen ajustada */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {/* Contenedor para la imagen con tamaño ajustado */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 relative">
              {!imageError ? (
                <Image
                  src={imageUrl}
                  alt={operator.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  priority
                />
              ) : null}

              {/* Fallback cuando no hay imagen */}
              <div
                className={`absolute inset-0 ${imageError ? "flex" : "hidden"} items-center justify-center`}
              >
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                  {initials}
                </div>
              </div>
            </div>

            <div
              className={`absolute -bottom-2 -right-2 w-6 h-6 ${colors.bg} rounded-full flex items-center justify-center text-white shadow-md`}
            >
              {getCategoryIcon(operator.category)}
            </div>

            {operator.streak >= 30 && (
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1 shadow-md">
                <Flame className="w-3 h-3" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-lg truncate" title={operator.name}>
              {operator.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Código: {operator.codigo}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate" title={operator.zona || ''}>
                  {operator.zona || "Sin zona"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate" title={operator.padrino || ''}>
                  {operator.padrino || "Sin padrino"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            {operator.trend && getTrendIcon(operator.trend)}
            {operator.lastUpdate || new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Performance Metrics - exactamente como las tenías */}
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Kilómetros</span>
              </div>

              <div className="text-right">
                <div className={`text-lg font-bold ${operator.km.percentage >= 100 ? 'text-green-700' : 'text-blue-900'}`}>
                  {formatPercentage(operator.km.percentage, 2)}
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">{operator.km.category}</div>
              </div>
            </div>

            {/* Barra de progreso para kilómetros */}
            <div className="w-full bg-blue-200 rounded-full h-2 mb-3 relative overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500 relative"
                style={{
                  width: `${Math.min(operator.km.percentage || 0, 200)}%`,
                  maxWidth: '100%',
                  background: `linear-gradient(90deg, ${
                    operator.km.percentage >= 100
                      ? "#10B981" // Verde para valores superiores al 100%
                      : "#3B82F6"
                  }, ${
                    operator.km.percentage >= 100
                      ? "#059669" // Verde más oscuro para valores superiores al 100%
                      : "#1E40AF"
                  })`,
                }}
              />
              {/* Línea de referencia al 100% */}
              {operator.km.percentage > 100 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20"></div>
                  <div className="absolute top-0 right-0 w-0.5 h-full bg-white opacity-60"></div>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Prog:{" "}
                  {operator.km.total_programado === 142000 &&
                  (operator.timeFilter?.type === "year" || operator.timeFilter?.type === "month")
                    ? "N/A"
                    : `${(operator.km.total_programado || 0).toLocaleString("es-CO")} km`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Ejec:{" "}
                  {operator.km.total_ejecutado === 142000 &&
                  (operator.timeFilter?.type === "year" || operator.timeFilter?.type === "month")
                    ? "N/A"
                    : `${(operator.km.total_ejecutado || 0).toLocaleString("es-CO")} km`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Rendimiento Bonos</span>
              </div>

              <div className="text-right">
                <div className={`text-lg font-bold ${operator.bonus.percentage >= 100 ? 'text-emerald-700' : 'text-green-900'}`}>
                  {formatPercentage(operator.bonus.percentage, 2)}
                </div>
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">{operator.bonus.category}</div>
              </div>
            </div>

            {/* Barra de progreso para bonos */}
            <div className="w-full bg-green-200 rounded-full h-2 mb-3 relative overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500 relative"
                style={{
                  width: `${Math.min(operator.bonus.percentage || 0, 200)}%`,
                  maxWidth: '100%',
                  background: `linear-gradient(90deg, ${
                    operator.bonus.percentage >= 100
                      ? "#10B981" // Verde para valores superiores al 100%
                      : "#10B981"
                  }, ${
                    operator.bonus.percentage >= 100
                      ? "#059669" // Verde más oscuro para valores superiores al 100%
                      : "#059669"
                  })`,
                }}
              />
              {/* Línea de referencia al 100% */}
              {operator.bonus.percentage > 100 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20"></div>
                  <div className="absolute top-0 right-0 w-0.5 h-full bg-white opacity-60"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Final Category - exactamente como lo tenías */}
        <div className="bg-gray-50 rounded-lg p-4">
          {/* Encabezado con icono */}
          <div className="flex items-center gap-2 mb-3">
            {getCategoryIcon(operator.category)}
            {operator.category}
          </div>

          {/* Información de eficiencia y valoración */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Valoración general:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg ${operator.efficiency >= 100 ? 'text-green-700' : 'text-gray-900'}`}>
                {formatPercentage(operator.efficiency || 0, 2)}
              </span>
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor:
                    operator.efficiency >= 100
                      ? "#10B981" // Verde para valores superiores al 100%
                      : operator.efficiency >= 95
                      ? "#F59E0B"
                      : operator.efficiency >= 85
                        ? "#9CA3AF"
                        : operator.efficiency >= 75
                          ? "#CD7F32"
                          : operator.efficiency >= 60
                            ? "#EF4444"
                            : "#6B7280",
                }}
              />
            </div>
          </div>

          {/* Barra de progreso para la eficiencia */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 relative overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500 relative"
              style={{
                width: `${Math.min(operator.efficiency || 0, 200)}%`,
                maxWidth: '100%',
                background: `linear-gradient(90deg, ${
                  operator.efficiency >= 100
                    ? "#10B981" // Verde para valores superiores al 100%
                    : operator.efficiency >= 95
                    ? "#FBBF24"
                    : operator.efficiency >= 85
                      ? "#D1D5DB"
                      : operator.efficiency >= 75
                        ? "#E3A982"
                        : operator.efficiency >= 60
                          ? "#F87171"
                          : "#9CA3AF"
                }, ${
                  operator.efficiency >= 100
                    ? "#059669" // Verde más oscuro para valores superiores al 100%
                    : operator.efficiency >= 95
                    ? "#F59E0B"
                    : operator.efficiency >= 85
                      ? "#9CA3AF"
                      : operator.efficiency >= 75
                        ? "#CD7F32"
                        : operator.efficiency >= 60
                          ? "#EF4444"
                          : "#6B7280"
                })`,
              }}
            />
            {/* Línea de referencia al 100% */}
            {operator.efficiency > 100 && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20"></div>
                <div className="absolute top-0 right-0 w-0.5 h-full bg-white opacity-60"></div>
              </div>
            )}
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Eficiencia</div>
              <div className="font-bold text-sm">{formatPercentage(operator.efficiency || 0, 2)}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">
                Bonos{" "}
                {operator.timeFilter?.type === "year"
                  ? `(${operator.timeFilter.value})`
                  : operator.timeFilter?.type === "month"
                    ? `(${operator.timeFilter.value?.toString().split("-")[0]})`
                    : "(2025)"}
              </div>
              <div className="font-bold text-sm">$ {formatNumber(operator.bonus.total, true, 0)}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">KM</div>
              <div className="font-bold text-sm">
                {formatNumber(operator.km.total_ejecutado || operator.km.total, true, 2)} km
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

OperatorCard.displayName = "OperatorCard"

// Exportar OperatorCard para uso individual
export { OperatorCard }

// Loading Skeleton
const OperatorCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
      </div>
    </div>
    <div className="space-y-4 mb-6">
      <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
    </div>
    <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
  </div>
)

// Main Grid Component
export default function OperatorsGrid({ operators, onOperatorClick }: OperatorsGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"rank" | "efficiency" | "bonus" | "km">("rank")

  // Calcular ranking real basado en eficiencia (ranking global)
  const operatorsWithRealRank = useMemo(() => {
    console.log('=== INICIO CÁLCULO RANKING REAL ===')
    console.log('Operadores recibidos:', operators.length)
    
    if (operators.length === 0) {
      console.log('No hay operadores para calcular ranking')
      return []
    }
    
    // Verificar que todos los operadores tengan efficiency
    const validOperators = operators.filter(op => typeof op.efficiency === 'number' && !isNaN(op.efficiency))
    console.log('Operadores válidos con efficiency:', validOperators.length)
    
    if (validOperators.length === 0) {
      console.log('No hay operadores con efficiency válida')
      return operators.map(op => ({ ...op, realRank: 1 }))
    }
    
    // Crear una copia de los operadores y ordenarlos por eficiencia para el ranking real
    const sortedByEfficiency = [...validOperators].sort((a, b) => b.efficiency - a.efficiency)
    
    console.log('Top 5 por eficiencia:', sortedByEfficiency.slice(0, 5).map((op, index) => ({
      rank: index + 1,
      name: op.name,
      efficiency: op.efficiency,
      id: op.id || op.codigo
    })))
    
    // Asignar el ranking real a cada operador
    const operatorsWithRank = operators.map(operator => {
      const identifier = operator.id || operator.codigo
      const realRank = sortedByEfficiency.findIndex(op => (op.id || op.codigo) === identifier) + 1
      
      // Si no se encuentra, asignar el último ranking
      const finalRank = realRank > 0 ? realRank : sortedByEfficiency.length
      
      return {
        ...operator,
        realRank: finalRank
      }
    })
    
    console.log('=== FIN CÁLCULO RANKING REAL ===')
    return operatorsWithRank
  }, [operators])
  
  // Forzar el cálculo si no se ejecutó el useMemo
  const finalOperators = operatorsWithRealRank.length > 0 ? operatorsWithRealRank : (() => {
    console.log('=== FORZANDO CÁLCULO RANKING REAL ===')
    
    if (operators.length === 0) return []
    
    const validOperators = operators.filter(op => typeof op.efficiency === 'number' && !isNaN(op.efficiency))
    
    if (validOperators.length === 0) {
      return operators.map(op => ({ ...op, realRank: 1 }))
    }
    
    const sortedByEfficiency = [...validOperators].sort((a, b) => b.efficiency - a.efficiency)
    
    return operators.map(operator => {
      const identifier = operator.id || operator.codigo
      const realRank = sortedByEfficiency.findIndex(op => (op.id || op.codigo) === identifier) + 1
      const finalRank = realRank > 0 ? realRank : sortedByEfficiency.length
      
      return {
        ...operator,
        realRank: finalRank
      }
    })
  })()

  // Filtered and sorted operators
  const filteredOperators = useMemo(() => {
    const filtered = finalOperators.filter((operator) => {
      const matchesSearch =
        operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (operator.zona?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (operator.padrino?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || operator.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    // Sort operators (pero mantener el ranking real)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "efficiency":
          return b.efficiency - a.efficiency
        case "bonus":
          return b.bonus.total - a.bonus.total
        case "km":
          return (b.km.total_ejecutado || 0) - (a.km.total_ejecutado || 0)
        default:
          return 0 // Keep original rank order
      }
    })

    return filtered
  }, [finalOperators, searchTerm, categoryFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOperators = filteredOperators.slice(startIndex, startIndex + itemsPerPage)

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(finalOperators.map((op) => op.category))]
    // Agregar 'Revisar' como categoría estática
    if (!uniqueCategories.includes('Revisar')) {
      uniqueCategories.push('Revisar')
    }
    return uniqueCategories
  }, [finalOperators])

  // Reset page when filters change
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
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operadores</h1>
          <p className="text-gray-600 mt-1">
            {filteredOperators.length} de {finalOperators.length} operadores
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar operadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white">
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

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48 bg-white">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Ranking</SelectItem>
            <SelectItem value="efficiency">Eficiencia</SelectItem>
            <SelectItem value="bonus">Bonos</SelectItem>
            <SelectItem value="km">Kilómetros</SelectItem>
          </SelectContent>
        </Select>

        {/* Items per page */}
        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
          <SelectTrigger className="w-full sm:w-32 bg-white">
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

      {/* Grid */}
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
          {paginatedOperators.map((operator, index) => (
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

      {/* Empty State */}
      {filteredOperators.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron operadores</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOperators.length)} de{" "}
            {filteredOperators.length} resultados
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
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
                    className="w-10 h-10"
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
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
