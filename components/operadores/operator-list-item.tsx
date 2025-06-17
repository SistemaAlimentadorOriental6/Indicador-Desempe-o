"use client"

import type React from "react"
import { Eye, Flame } from "lucide-react"
import { getCategoryIcon, getCategoryColor, getTrendIcon, getRankTextColor } from "@/utils/operator-utils"
import type { Operator } from "@/types/operator-types"

interface OperatorListItemProps {
  operator: Operator
  rank: number
  onClick: () => void
  renderWeeklyChart: (data: number[], small?: boolean) => React.ReactNode
}

export const OperatorListItem: React.FC<OperatorListItemProps> = ({ operator, rank, onClick, renderWeeklyChart }) => {
  const colors = getCategoryColor(operator.category)

  return (
    <div className="p-6 hover:bg-gray-25 transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className={`text-2xl font-bold w-12 text-center ${getRankTextColor(rank)}`}>#{rank}</div>

          <div className="relative">
            <div
              className={`
              w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg
              bg-gradient-to-br ${colors.bg} shadow-lg group-hover:scale-105 transition-transform duration-300
            `}
            >
              {operator.avatar}
            </div>
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-soft border border-gray-100">
              {getCategoryIcon(operator.category)}
            </div>
            {operator.streak >= 30 && (
              <div className="absolute -bottom-1 -left-1 bg-orange-500 rounded-full p-1 shadow-soft">
                <Flame className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h4 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
                {operator.name}
              </h4>
              <span
                className={`
                text-sm font-semibold px-3 py-1 rounded-full border
                ${colors.bgLight} ${colors.text} ${colors.border}
              `}
              >
                {operator.category}
              </span>
              {operator.trend && getTrendIcon(operator.trend)}
              {operator.streak >= 30 && (
                <div className="flex items-center space-x-1 bg-orange-50 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold border border-orange-200">
                  <Flame className="w-3 h-3" />
                  <span>{operator.streak}d</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="font-medium">{operator.position}</span>
              <span>{operator.department}</span>
              <span>Actualizado {operator.lastUpdate || new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">
              Bonos {operator.timeFilter?.type === 'year' ? `(${operator.timeFilter.value})` : 
                     operator.timeFilter?.type === 'month' ? `(${operator.timeFilter.value?.toString().split('-')[0]})` : 
                     '(2025)'}
            </p>
            <p className="font-bold text-lg text-gray-900">
              {typeof operator.bonus.percentage === 'number' ? operator.bonus.percentage.toFixed(2) : parseFloat(String(operator.bonus.percentage || 0)).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-600">$ {operator.bonus.total.toLocaleString('es-CO')}</p>
            <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(typeof operator.bonus.percentage === 'number' ? operator.bonus.percentage : parseFloat(String(operator.bonus.percentage || 0)), 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Kilómetros</p>
            <p className="font-bold text-lg text-gray-900">{typeof operator.km.percentage === 'number' ? operator.km.percentage.toFixed(2) : parseFloat(String(operator.km.percentage || 0)).toFixed(2)}%</p>
            <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(typeof operator.km.percentage === 'number' ? operator.km.percentage : parseFloat(String(operator.km.percentage || 0)), 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Eficiencia</p>
            <p className="font-bold text-lg text-gray-900">{operator.efficiency}%</p>
            <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 bg-gradient-to-r ${colors.bg}`}
                style={{ width: `${operator.efficiency}%` }}
              ></div>
            </div>
          </div>

          <div className="w-24">{renderWeeklyChart(operator.weeklyPerformance, true)}</div>

          <button className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
