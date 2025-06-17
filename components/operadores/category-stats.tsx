"use client"

import type React from "react"
import { getCategoryIcon, getCategoryColor } from "@/utils/operator-utils"
import type { CategoryStats } from "@/types/operator-types"

interface CategoryStatsProps {
  categoryStats: CategoryStats
  totalOperators: number
}

export const CategoryStatsGrid: React.FC<CategoryStatsProps> = ({ categoryStats, totalOperators }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {Object.entries(categoryStats).map(([category, count]) => {
        const colors = getCategoryColor(category)
        const percentage = Math.round((count / totalOperators) * 100)
        return (
          <div
            key={category}
            className={`p-6 rounded-3xl ${colors.bgLight} border ${colors.border} hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-5 group-hover:opacity-10 transition-opacity`}
            ></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {getCategoryIcon(category)}
                </div>
                <div>
                  <h3 className={`font-bold ${colors.text} text-lg`}>{category}</h3>
                  <p className="text-sm text-gray-500">Operadores</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{count}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 bg-gradient-to-r ${colors.bg}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{percentage}% del total</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
