"use client"

import type React from "react"
import { DollarSign, MapPin, Flame, User } from "lucide-react"
import { getCategoryIcon, getCategoryColor, getTrendIcon, getRankBadgeColor } from "@/utils/operator-utils"
import type { Operator } from "@/types/operator-types"
import { formatNumber, formatPercentage } from "@/utils/format-utils"

interface OperatorGridCardProps {
  operator: Operator
  rank: number
  onClick: () => void
}

export const OperatorGridCard: React.FC<OperatorGridCardProps> = ({ operator, rank, onClick }) => {
  const colors = getCategoryColor(operator.category)

  return (
    <div
      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-large transition-all duration-500 group hover:-translate-y-2 cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      {/* Rank Badge */}
      <div
        className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${getRankBadgeColor(rank)}`}
      >
        {rank}
      </div>

      {/* Background Pattern */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-5 group-hover:opacity-10 transition-opacity`}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div
              className={`
              w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden text-white font-bold text-xl
              bg-gradient-to-br ${colors.bg} shadow-lg group-hover:scale-110 transition-transform duration-300
              relative
            `}
            >
              {/* Contenedor para la imagen con redimensionamiento mejorado */}
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={`https://admon.sao6.com.co/web/uploads/empleados/${operator.document || ''}.jpg`} 
                  alt={operator.name || "Operador"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si la imagen falla, mostrar el avatar por defecto
                    e.currentTarget.style.display = 'none';
                    // Usar referencia segura al elemento con el fallback
                    const fallbackEl = e.currentTarget.parentElement?.nextElementSibling;
                    if (fallbackEl instanceof HTMLElement) {
                      fallbackEl.style.display = 'flex';
                    }
                  }}
                />
              </div>
              
              {/* Fallback cuando no hay imagen */}
              <div 
                className="flex flex-col items-center justify-center w-full h-full" 
                style={{ display: 'none' }}
              >
                <User className="w-8 h-8 text-white opacity-80" />
                <div className="text-xs mt-1 font-medium text-center leading-tight">
                  Sin imagen registrada
                </div>
              </div>
              
              {/* Avatar genérico (sólo como último recurso) */}
              {operator.avatar && (
                <div 
                  className="absolute inset-0 w-full h-full flex items-center justify-center" 
                  style={{ display: 'none' }}
                  data-avatar="true"
                >
                  {operator.avatar}
                </div>
              )}
            </div>
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-soft border border-gray-100">
              {getCategoryIcon(operator.category)}
            </div>
            {operator.streak >= 30 && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-1.5 shadow-soft">
                <Flame className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
              {operator.name}
            </h3>
            <p className="text-sm text-gray-500 font-medium">{operator.position}</p>
            <p className="text-xs text-gray-400">{operator.department}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {operator.trend && getTrendIcon(operator.trend)}
            <span className="text-xs text-gray-500">{operator.lastUpdate || new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Kilómetros</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{formatPercentage(operator.km.percentage, 2)}</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryColor(operator.km.category).bgLight} ${getCategoryColor(operator.km.category).text}`}
                >
                  {operator.km.category}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(typeof operator.km.percentage === 'number' ? operator.km.percentage : parseFloat(String(operator.km.percentage || 0)), 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <div>
                <span className="font-semibold">Prog:</span> {
                  // Verificar si el valor es 142000 (valor predeterminado) y si es un filtro por año o mes
                  operator.km.total_programado === 142000 && (operator.timeFilter?.type === 'year' || operator.timeFilter?.type === 'month') 
                    ? 'N/A' 
                    : `${(operator.km.total_programado || 0).toLocaleString('es-CO')} km`
                }
              </div>
              <div>
                <span className="font-semibold">Ejec:</span> {
                  // Verificar si el valor es 142000 (valor predeterminado) y si es un filtro por año o mes
                  operator.km.total_ejecutado === 142000 && (operator.timeFilter?.type === 'year' || operator.timeFilter?.type === 'month') 
                    ? 'N/A' 
                    : `${(operator.km.total_ejecutado || 0).toLocaleString('es-CO')} km`
                }
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-gray-600">Rendimiento Bonos</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{formatPercentage(operator.bonus.percentage, 2)}</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryColor(operator.bonus.category).bgLight} ${getCategoryColor(operator.bonus.category).text}`}
                >
                  {operator.bonus.category}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(typeof operator.bonus.percentage === 'number' ? operator.bonus.percentage : parseFloat(String(operator.bonus.percentage || 0)), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Final Category */}
        <div className={`p-4 rounded-2xl ${colors.bgLight} border ${colors.border} text-center`}>
          {/* Encabezado con icono */}
          <div className="flex items-center justify-center space-x-2 mb-3">
            {getCategoryIcon(operator.category)}
            <span className={`font-semibold text-lg ${colors.text}`}>{operator.category}</span>
          </div>

          {/* Información de eficiencia y valoración */}
          <div className="mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-gray-700">Valoración general:</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">{formatPercentage(operator.efficiency || 0, 2)}</span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: operator.efficiency >= 95 ? '#F59E0B' : 
                                   operator.efficiency >= 85 ? '#9CA3AF' : 
                                   operator.efficiency >= 75 ? '#CD7F32' : 
                                   operator.efficiency >= 60 ? '#EF4444' : 
                                   '#6B7280'
                  }}
                />
              </div>
            </div>
            
            {/* Barra de progreso para la eficiencia */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min(operator.efficiency || 0, 100)}%`,
                  background: `linear-gradient(to right, 
                    ${operator.efficiency >= 95 ? '#FBBF24' : 
                      operator.efficiency >= 85 ? '#D1D5DB' : 
                      operator.efficiency >= 75 ? '#E3A982' : 
                      operator.efficiency >= 60 ? '#F87171' : 
                      '#9CA3AF'}, 
                    ${operator.efficiency >= 95 ? '#F59E0B' : 
                      operator.efficiency >= 85 ? '#9CA3AF' : 
                      operator.efficiency >= 75 ? '#CD7F32' : 
                      operator.efficiency >= 60 ? '#EF4444' : 
                      '#6B7280'})` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Eficiencia</p>
              <p className="font-semibold text-gray-900">{formatPercentage(operator.efficiency || 0, 2)}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Bonos {operator.timeFilter?.type === 'year' ? `(${operator.timeFilter.value})` : operator.timeFilter?.type === 'month' ? `(${operator.timeFilter.value?.toString().split('-')[0]})` : '(2025)'}</p>
              <p className="font-semibold text-gray-900">$ {formatNumber(operator.bonus.total, true, 0)}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">KM</p>
              <p className="font-semibold text-gray-900">{formatNumber(operator.km.total_ejecutado || operator.km.total, true, 2)} km</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}