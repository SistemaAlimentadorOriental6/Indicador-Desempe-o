"use client"

import type React from "react"
import { Users } from "lucide-react"
import { getCategoryIcon, getCategoryColor } from "@/utils/operator-utils"
import type { FilterType, CategoryStats } from "@/types/operator-types"

interface FilterChipsProps {
  filter: FilterType
  setFilter: (filter: FilterType) => void
  categoryStats: CategoryStats
  totalOperators: number
}

export const FilterChips: React.FC<FilterChipsProps> = ({ filter, setFilter, categoryStats, totalOperators }) => {
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button
        onClick={() => setFilter("all")}
        className={`
          flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105
          ${
            filter === "all"
              ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-green"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          }
        `}
      >
        <Users className="w-5 h-5" />
        <span>Todos</span>
        <span
          className={`
          text-sm px-3 py-1 rounded-full font-bold
          ${filter === "all" ? "bg-white/20 text-white" : "bg-white text-gray-600"}
        `}
        >
          {totalOperators}
        </span>
      </button>

      {Object.entries(categoryStats).map(([category, count]) => {
        const colors = getCategoryColor(category)
        return (
          <button
            key={category}
            onClick={() => setFilter(category as FilterType)}
            className={`
              flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105
              ${
                filter === category
                  ? `bg-gradient-to-r ${colors.bg} text-white ${colors.shadow} shadow-lg`
                  : `${colors.bgLight} ${colors.text} hover:bg-opacity-80 border ${colors.border}`
              }
            `}
          >
            {getCategoryIcon(category)}
            <span>{category}</span>
            <span
              className={`
              text-sm px-2 py-1 rounded-full font-bold
              ${filter === category ? "bg-white/20 text-white" : "bg-white text-gray-600"}
            `}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
