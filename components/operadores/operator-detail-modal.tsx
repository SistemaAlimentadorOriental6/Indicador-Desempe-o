"use client"

import type React from "react"
import { X, DollarSign, MapPin, BarChart3, Calendar, Flame } from "lucide-react"
import { getCategoryIcon, getCategoryColor, getTrendIcon } from "@/utils/operator-utils"
import type { Operator } from "@/types/operator-types"

interface OperatorDetailModalProps {
  operator: Operator
  onClose: () => void
}

export const OperatorDetailModal: React.FC<OperatorDetailModalProps> = ({ operator, onClose }) => {
  const colors = getCategoryColor(operator.category)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
        {/* Enhanced Header */}
        <div className={`relative p-8 bg-gradient-to-r ${colors.bg} text-white rounded-t-3xl overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-3xl font-bold backdrop-blur-sm border border-white/30">
                {operator.avatar}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{operator.name}</h2>
                <p className="text-xl opacity-90 mb-1">{operator.position}</p>
                <p className="opacity-75">{operator.department}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    {getCategoryIcon(operator.category)}
                    <span className="font-semibold">{operator.category}</span>
                  </div>
                  {operator.streak >= 30 && (
                    <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
                      <Flame className="w-4 h-4" />
                      <span className="font-semibold">{operator.streak} días</span>
                    </div>
                  )}
                  {operator.trend && getTrendIcon(operator.trend)}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{operator.efficiency}%</div>
                <div className="text-sm opacity-75">Eficiencia</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">${operator.bonus.total.toLocaleString('es-CO')}</div>
                <div className="text-sm opacity-75">
                  Bonos {operator.timeFilter?.type === 'year' ? `(${operator.timeFilter.value})` : 
                         operator.timeFilter?.type === 'month' ? `(${operator.timeFilter.value?.toString().split('-')[0]})` : 
                         '(2025)'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{operator.km.total.toLocaleString()}</div>
                <div className="text-sm opacity-75">KM Totales</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-6 border border-primary-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-800 text-lg">Rendimiento Bonos</h3>
                  <p className="text-sm text-primary-600">Categoría: {operator.bonus.category}</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-primary-700 mb-4">{operator.bonus.percentage.toFixed(2)}%</div>
              <div className="w-full bg-primary-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${operator.bonus.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-primary-600">
                <span>Total: ${operator.bonus.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 text-lg">Rendimiento KM</h3>
                  <p className="text-sm text-blue-600">Categoría: {operator.km.category}</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-700 mb-4">{operator.km.percentage.toFixed(2)}%</div>
              <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(operator.km.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Total: {operator.km.total.toLocaleString()} km</span>
                <span>Promedio Mensual: {Math.round(operator.km.total / 52)} km</span>
              </div>
            </div>
          </div>

          {/* Weekly Performance Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary-600" />
              <span>Rendimiento Semanal</span>
            </h3>
            <div className="flex items-end justify-between space-x-4 h-40 mb-4">
              {operator.weeklyPerformance.map((value, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary-400 to-primary-600 rounded-t-lg transition-all duration-500 hover:from-primary-500 hover:to-primary-700 relative group"
                    style={{ height: `${(value / 100) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {value}%
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {["L", "M", "X", "J", "V", "S", "D"][index]}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{Math.max(...operator.weeklyPerformance)}%</p>
                <p className="text-xs text-gray-500">Máximo</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {Math.round(operator.weeklyPerformance.reduce((a, b) => a + b) / operator.weeklyPerformance.length)}%
                </p>
                <p className="text-xs text-gray-500">Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{Math.min(...operator.weeklyPerformance)}%</p>
                <p className="text-xs text-gray-500">Mínimo</p>
              </div>
            </div>
          </div>

          {/* Achievements and Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-primary-600" />
                <span>Información General</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-600 font-medium">Fecha de Ingreso</span>
                  <span className="font-semibold text-gray-900">{operator.joinDate || 'No disponible'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-600 font-medium">Meta Mensual</span>
                  <span className="font-semibold text-gray-900">${operator.monthlyGoal ? operator.monthlyGoal.toLocaleString() : 'No definida'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-600 font-medium">Racha Actual</span>
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-gray-900">{operator.streak} días</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-600 font-medium">Última Actualización</span>
                  <span className="font-semibold text-gray-900">{operator.lastUpdate || new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
