"use client"

import type React from "react"
import { Clock, Eye, ArrowRight, Star } from "lucide-react"
import type { PersonaBono } from "@/types/bono-types"
import { formatCurrency, getEficienciaColor } from "@/utils/bono-utils"

interface PersonaCardProps {
  persona: PersonaBono
  index: number
  animateCards: boolean
  onClick: (persona: PersonaBono) => void
}

export const PersonaCard: React.FC<PersonaCardProps> = ({ persona, index, animateCards, onClick }) => {
  return (
    <div
      onClick={() => onClick(persona)}
      className={`
        group relative p-6 rounded-3xl border border-green-100 hover:border-green-200 
        bg-gradient-to-br from-white to-green-50/30 hover:from-green-25 hover:to-green-50 
        transition-all duration-500 cursor-pointer shadow-lg hover:shadow-2xl 
        hover:-translate-y-2 transform
        ${animateCards ? "animate-fade-in-up" : ""}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center text-white font-bold text-lg shadow-xl group-hover:scale-110 transition-transform duration-300">
                {persona.foto}
              </div>
              <div
                className={`
                absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center
                ${getEficienciaColor(persona.eficiencia)}
              `}
              >
                <Star className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xl text-gray-900 group-hover:text-green-600 transition-colors mb-1">
                {persona.nombre}
              </h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <span className="flex items-center space-x-1 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{persona.codigo}</span>
                </span>
                <span className="flex items-center space-x-1 font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>CC: {persona.cedula}</span>
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm mb-3">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-xl font-semibold">
                  {persona.departamento}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl font-semibold">{persona.cargo}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-2xl border border-green-200">
              <p className="text-green-600 font-semibold text-xs mb-1">💰 Bono Base</p>
              <p className="font-bold text-green-800">{formatCurrency(persona.montoBase)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
              <p className="text-blue-600 font-semibold text-xs mb-1">💵 Actual (Último Mes)</p>
              <p className="font-bold text-blue-800">
                {formatCurrency(
                  // Usar directamente lastMonthData.finalValue si está disponible
                  persona.lastMonthData?.finalValue || 
                  persona.summary?.lastMonthFinalValue || 
                  (persona.historialMensual && persona.historialMensual.length > 0 
                    ? persona.historialMensual[0].montoFinal 
                    : persona.montoActual)
                )}
              </p>
            </div>
          </div>

          <div className="bg-red-50 p-3 rounded-2xl border border-red-200">
            <p className="text-red-600 font-semibold text-xs mb-1">📉 Descuentos (Último Mes)</p>
            <p className="font-bold text-red-800">
              {formatCurrency(
                // Usar directamente lastMonthData.deductionAmount si está disponible
                persona.lastMonthData?.deductionAmount || 
                (persona.historialMensual && persona.historialMensual.length > 0 
                  ? persona.historialMensual[0].descuentos 
                  : 0)
              )}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ 
                width: `${
                  // Calcular el porcentaje usando lastMonthData si está disponible
                  ((persona.lastMonthData?.finalValue || 
                    persona.summary?.lastMonthFinalValue || 
                    (persona.historialMensual && persona.historialMensual.length > 0 
                      ? persona.historialMensual[0].montoFinal 
                      : persona.montoActual)) / persona.montoBase) * 100
                }%` 
              }}
            >
              <span className="text-white text-xs font-bold">
                {(
                  // Calcular el porcentaje usando lastMonthData si está disponible
                  ((persona.lastMonthData?.finalValue || 
                    persona.summary?.lastMonthFinalValue || 
                    (persona.historialMensual && persona.historialMensual.length > 0 
                      ? persona.historialMensual[0].montoFinal 
                      : persona.montoActual)) / persona.montoBase) * 100
                ).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-green-100">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Actualizado: {persona.ultimaActualizacion}</span>
          </div>
          <div className="flex items-center space-x-2 text-green-600 group-hover:text-green-700 font-semibold">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Ver Detalles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
