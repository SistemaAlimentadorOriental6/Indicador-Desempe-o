import { CheckCircle, XCircle, AlertTriangle, Activity, TrendingUp, TrendingDown } from "lucide-react"
import type { PersonKmData, GlobalStats, SortBy, FilterBy, SearchType } from "@/types/km-types"

export const getStatusColor = (status: string) => {
  switch (status) {
    case "excellent":
      return "text-green-700 bg-green-50 border-green-200"
    case "good":
      return "text-blue-700 bg-blue-50 border-blue-200"
    case "warning":
      return "text-yellow-700 bg-yellow-50 border-yellow-200"
    case "poor":
      return "text-red-700 bg-red-50 border-red-200"
    default:
      return "text-gray-700 bg-gray-50 border-gray-200"
  }
}

// Return icon name as string instead of JSX
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "excellent":
      return "CheckCircle"
    case "good":
      return "CheckCircle"
    case "warning":
      return "AlertTriangle"
    case "poor":
      return "XCircle"
    default:
      return "Activity"
  }
}

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "excellent":
      return "Excelente (95%)"
    case "good":
      return "Bueno (85-95%)"
    case "warning":
      return "Atención (75-85%)"
    case "poor":
      return "Crítico (75%)"
    default:
      return "Normal"
  }
}

// Return icon name as string instead of JSX
export const getTrendIcon = (status: string) => {
  switch (status) {
    case "up":
      return "TrendingUp"
    case "down":
      return "TrendingDown"
    default:
      return "Activity"
  }
}

export const calculateGlobalStats = (data: PersonKmData[]): GlobalStats => {
  const totalProgrammed = data.reduce((sum, person) => sum + person.totalProgrammed, 0)
  const totalExecuted = data.reduce((sum, person) => sum + person.totalExecuted, 0)
  const averageReliability = data.reduce((sum, person) => sum + person.overallReliability, 0) / data.length

  return {
    totalProgrammed,
    totalExecuted,
    averageReliability,
    totalPeople: data.length,
    excellentPerformers: data.filter((p) => p.status === "excellent").length,
    goodPerformers: data.filter((p) => p.status === "good").length,
    needsAttention: data.filter((p) => p.status === "warning").length,
    criticalPerformers: data.filter((p) => p.status === "poor").length,
    topPerformer: data.reduce((prev, current) =>
      prev.overallReliability > current.overallReliability ? prev : current,
    ),
    lowestPerformer: data.reduce((prev, current) =>
      prev.overallReliability < current.overallReliability ? prev : current,
    ),
  }
}

export const filterAndSortData = (
  data: PersonKmData[],
  filterBy: FilterBy,
  searchQuery: string,
  searchType: SearchType,
  sortBy: SortBy,
): PersonKmData[] => {
  let filtered = data

  // Filter by status
  if (filterBy !== "all") {
    filtered = filtered.filter((person) => person.status === filterBy)
  }

  // Filter by search
  if (searchQuery.trim()) {
    filtered = filtered.filter((person) => {
      const query = searchQuery.toLowerCase().trim()
      switch (searchType) {
        case "name":
          return person.name.toLowerCase().includes(query)
        case "code":
          return typeof person.code === 'string' && person.code.toLowerCase().includes(query) || 
                 typeof (person as any).codigo === 'string' && (person as any).codigo.toLowerCase().includes(query)
        case "cedula":
          return typeof person.cedula === 'string' && person.cedula.toLowerCase().includes(query) || 
                 typeof (person as any).document === 'string' && (person as any).document.toLowerCase().includes(query)
        default:
          // Buscar en todos los campos disponibles
          return (
            (typeof person.name === 'string' && person.name.toLowerCase().includes(query)) ||
            (typeof person.code === 'string' && person.code.toLowerCase().includes(query)) ||
            (typeof (person as any).codigo === 'string' && (person as any).codigo.toLowerCase().includes(query)) ||
            (typeof person.cedula === 'string' && person.cedula.toLowerCase().includes(query)) ||
            (typeof (person as any).document === 'string' && (person as any).document.toLowerCase().includes(query))
          )
      }
    })
  }

  // Sort
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case "reliability":
        return b.overallReliability - a.overallReliability
      case "executed":
        return b.totalExecuted - a.totalExecuted
      case "performance":
        return b.performanceScore - a.performanceScore
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })
}

export const getReliabilityColor = (reliability: number) => {
  if (reliability >= 95) return "text-green-700 bg-green-50 border-green-200"
  if (reliability >= 85) return "text-blue-700 bg-blue-50 border-blue-200"
  if (reliability >= 75) return "text-yellow-700 bg-yellow-50 border-yellow-200"
  return "text-red-700 bg-red-50 border-red-200"
}

export const getReliabilityGradient = (reliability: number) => {
  if (reliability >= 95) return "bg-gradient-to-r from-green-500 to-green-600"
  if (reliability >= 85) return "bg-gradient-to-r from-blue-500 to-blue-600"
  if (reliability >= 75) return "bg-gradient-to-r from-yellow-500 to-yellow-600"
  return "bg-gradient-to-r from-red-500 to-red-600"
}
