"use client"

import type React from "react"
import { Award, TrendingDown } from "lucide-react"
import type { GlobalStats } from "@/types/km-types"

interface PerformanceHighlightsProps {
  stats: GlobalStats
}

export const PerformanceHighlights: React.FC<PerformanceHighlightsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Mejor Rendimiento</h3>
            <p className="text-sm text-gray-500 font-medium">Mayor confiabilidad del período</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 p-4 bg-green-25 rounded-2xl border border-green-100">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold">
            {stats.topPerformer.avatar}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">{stats.topPerformer.name}</h4>
            <p className="text-sm text-gray-600">{stats.topPerformer.department}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg font-bold text-green-700">
                {stats.topPerformer.overallReliability.toFixed(1)}%
              </span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                {stats.topPerformer.totalExecuted} km ejecutados
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Requiere Atención</h3>
            <p className="text-sm text-gray-500 font-medium">Menor confiabilidad del período</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 p-4 bg-red-25 rounded-2xl border border-red-100">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold">
            {stats.lowestPerformer.avatar}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">{stats.lowestPerformer.name}</h4>
            <p className="text-sm text-gray-600">{stats.lowestPerformer.department}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg font-bold text-red-700">
                {stats.lowestPerformer.overallReliability.toFixed(1)}%
              </span>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                Necesita seguimiento
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
