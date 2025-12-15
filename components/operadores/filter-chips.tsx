"use client"

import React, { memo } from "react"
import { Users, Crown, Medal, Award, AlertTriangle, AlertCircle } from "lucide-react"
import type { FilterType, CategoryStats } from "@/types/operator-types"

interface FilterChipsProps {
  filter: FilterType
  setFilter: (filter: FilterType) => void
  categoryStats: CategoryStats
  totalOperators: number
  operators?: any[] // Opcional, ya no se usa para el popover
}

// Obtener ícono de categoría
const obtenerIconoCategoria = (categoria: string) => {
  switch (categoria) {
    case "Oro": return <Crown className="w-4 h-4" />
    case "Plata": return <Medal className="w-4 h-4" />
    case "Bronce": return <Award className="w-4 h-4" />
    case "Mejorar": return <AlertTriangle className="w-4 h-4" />
    case "Taller Conciencia": return <AlertCircle className="w-4 h-4" />
    default: return null
  }
}

// Chip individual
const FilterChip = memo(({
  label,
  count,
  isActive,
  onClick,
  icon
}: {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  icon?: React.ReactNode
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
      ${isActive
        ? "bg-green-500 text-white"
        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
      }
    `}
  >
    {icon}
    <span>{label}</span>
    <span className={`
      text-xs px-2 py-0.5 rounded-full font-bold
      ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}
    `}>
      {count}
    </span>
  </button>
))

FilterChip.displayName = "FilterChip"

function FilterChipsBase({ filter, setFilter, categoryStats, totalOperators }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      {/* Chip "Todos" */}
      <FilterChip
        label="Todos"
        count={totalOperators}
        isActive={filter === "all"}
        onClick={() => setFilter("all")}
        icon={<Users className="w-4 h-4" />}
      />

      {/* Chips por categoría */}
      {Object.entries(categoryStats).map(([categoria, count]) => (
        <FilterChip
          key={categoria}
          label={categoria === "Taller Conciencia" ? "Taller" : categoria}
          count={count}
          isActive={filter === categoria}
          onClick={() => setFilter(categoria as FilterType)}
          icon={obtenerIconoCategoria(categoria)}
        />
      ))}
    </div>
  )
}

export const FilterChips = memo(FilterChipsBase)
export default FilterChips
