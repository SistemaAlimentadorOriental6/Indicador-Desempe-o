"use client"

import type React from "react"
import { Eye, Clock } from "lucide-react"
import type { PersonKmData } from "@/types/km-types"
import { getStatusColor, getStatusIcon, getStatusLabel, getTrendIcon, getReliabilityGradient } from "@/utils/km-utils"

interface PersonCardProps {
  person: PersonKmData
  onViewDetails: (id: number) => void
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, onViewDetails }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-soft group-hover:scale-105 transition-transform duration-300">
            {person.avatar}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{person.name}</h4>
            <p className="text-xs text-gray-500 font-medium">
              {person.department} • {person.position}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-400">#{person.code}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{person.cedula}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(person.status)}`}>
            {getStatusIcon(person.status)}
            <span className="ml-1">{getStatusLabel(person.status).split(" ")[0]}</span>
          </span>
          <div className="flex items-center justify-end space-x-1 mt-1">
            {getTrendIcon(person.trend)}
            <span className="text-xs text-gray-500 font-medium">
              {person.trend === "up" ? "Mejorando" : person.trend === "down" ? "Declinando" : "Estable"}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-blue-25 rounded-2xl border border-blue-100">
          <p className="text-sm font-bold text-blue-700">{person.totalProgrammed}</p>
          <p className="text-xs text-blue-600 font-medium">Programado</p>
        </div>
        <div className="text-center p-3 bg-green-25 rounded-2xl border border-green-100">
          <p className="text-sm font-bold text-green-700">{person.totalExecuted}</p>
          <p className="text-xs text-green-600 font-medium">Ejecutado</p>
        </div>
        <div className="text-center p-3 bg-primary-25 rounded-2xl border border-primary-100">
          <p className="text-sm font-bold text-primary-700">{person.overallReliability.toFixed(1)}%</p>
          <p className="text-xs text-primary-600 font-medium">Confiabilidad</p>
        </div>
      </div>

      {/* Performance Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Score de Rendimiento</span>
          <span className="text-sm font-bold text-gray-900">{person.performanceScore.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${getReliabilityGradient(person.performanceScore)}`}
            style={{ width: `${person.performanceScore}%` }}
          ></div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Tendencia últimos 6 meses</p>
        <div className="flex items-end space-x-1 h-8">
          {person.monthlyData.map((month, index) => (
            <div
              key={index}
              className={`flex-1 rounded-t transition-all duration-500 ${
                month.reliability >= 95
                  ? "bg-green-400"
                  : month.reliability >= 85
                    ? "bg-blue-400"
                    : month.reliability >= 75
                      ? "bg-yellow-400"
                      : "bg-red-400"
              }`}
              style={{ height: `${(month.reliability / 100) * 100}%` }}
              title={`${month.month}: ${month.reliability.toFixed(1)}%`}
            ></div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(person.id)}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent"
        >
          <Eye className="w-4 h-4" />
          <span>Ver Detalle</span>
        </button>
      </div>

      {/* Last Update */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Actualizado: {person.lastUpdate}</span>
        </p>
      </div>
    </div>
  )
}
