"use client"

import type React from "react"
import { Hash, CreditCard, Clock, Target, Activity, BarChart3 } from "lucide-react"
import type { PersonKmData } from "@/types/km-types"
import { getStatusColor, getStatusIcon, getStatusLabel, getReliabilityColor } from "@/utils/km-utils"

interface PersonDetailModalProps {
  person: PersonKmData
  onClose: () => void
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({ person, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-green">
                {person.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{person.name}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500 font-medium">
                    {person.department} • {person.position}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(person.status)}`}
                  >
                    {getStatusIcon(person.status)}
                    <span className="px-10 ml-1">{getStatusLabel(person.status)}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Hash className="w-4 h-4" />
                    <span>Código: {person.code}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CreditCard className="w-4 h-4" />
                    <span>Cédula: {person.cedula}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Actualizado: {person.lastUpdate}</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Total Programado</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{person.totalProgrammed.toLocaleString()}</p>
              <p className="text-xs text-blue-700">kilómetros</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Total Ejecutado</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{person.totalExecuted.toLocaleString()}</p>
              <p className="text-xs text-green-700">kilómetros</p>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-2xl border border-primary-200">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-800">Confiabilidad</span>
              </div>
              <p className="text-2xl font-bold text-primary-900">{person.overallReliability.toFixed(1)}%</p>
              <p className="text-xs text-primary-700">promedio general</p>
            </div>
          </div>

          {/* Gráfico de Tendencia Mensual */}
          <div className="bg-gray-25 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia Mensual de Confiabilidad</h3>
            <div className="grid grid-cols-6 gap-4">
              {person.monthlyData.map((month, index) => (
                <div key={index} className="text-center">
                  <div className="mb-3">
                    <div className="h-32 flex items-end justify-center space-x-1">
                      <div className="relative group">
                        <div
                          className="w-4 bg-blue-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${(month.programmed / 250) * 100}%` }}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {month.programmed} km
                        </div>
                      </div>
                      <div className="relative group">
                        <div
                          className="w-4 bg-green-500 rounded-t-lg transition-all duration-500"
                          style={{ height: `${(month.executed / 250) * 100}%` }}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {month.executed} km
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{month.month}</p>
                  <p className={`text-xs font-bold px-2 py-1 rounded-full ${getReliabilityColor(month.reliability)}`}>
                    {month.reliability.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detalle Mensual */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Detalle Mensual Completo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person.monthlyData.map((month, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">
                      {month.month} {month.year}
                    </h4>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${getReliabilityColor(month.reliability)}`}
                    >
                      {month.reliability.toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Programado</p>
                      <p className="text-lg font-bold text-blue-700">{month.programmed} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ejecutado</p>
                      <p className="text-lg font-bold text-green-700">{month.executed} km</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        month.reliability >= 95
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : month.reliability >= 85
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : month.reliability >= 75
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              : "bg-gradient-to-r from-red-500 to-red-600"
                      }`}
                      style={{ width: `${month.reliability}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
