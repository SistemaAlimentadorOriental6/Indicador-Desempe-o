"use client"

import type React from "react"
import type { PersonKmData } from "@/types/km-types"
import { months } from "@/data/km-data"
import { getReliabilityColor } from "@/utils/km-utils"

interface GlobalChartProps {
  data: PersonKmData[]
}

export const GlobalChart: React.FC<GlobalChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Análisis Global por Mes</h3>
          <p className="text-sm text-gray-500 font-medium">Comparación programado vs ejecutado con tendencias</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">Programado</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">Ejecutado</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">Confiabilidad</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {months.slice(0, 6).map((month, index) => {
          const monthData = data.reduce(
            (acc, person) => {
              // Verificar si existe personMonth y tiene datos válidos
              const personMonth = person.monthlyData && person.monthlyData[index]
              if (!personMonth) {
                return acc; // Si no hay datos para este mes, devolver el acumulador sin cambios
              }
              
              // Usar valores por defecto de 0 si programmed o executed son undefined
              const programmed = typeof personMonth.programmed === 'number' ? personMonth.programmed : 0;
              const executed = typeof personMonth.executed === 'number' ? personMonth.executed : 0;
              
              return {
                programmed: acc.programmed + programmed,
                executed: acc.executed + executed,
              }
            },
            { programmed: 0, executed: 0 },
          )

          const reliability = (monthData.executed / monthData.programmed) * 100

          return (
            <div key={month} className="text-center">
              <div className="mb-3">
                <div className="h-40 flex items-end justify-center space-x-2">
                  <div className="relative group">
                    <div
                      className="w-6 bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                      style={{ height: `${(monthData.programmed / 2000) * 100}%` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {monthData.programmed} km
                    </div>
                  </div>
                  <div className="relative group">
                    <div
                      className="w-6 bg-green-500 rounded-t-lg transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${(monthData.executed / 2000) * 100}%` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {monthData.executed} km
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-2">{month}</p>
              <p className={`text-xs font-bold px-2 py-1 rounded-full border ${getReliabilityColor(reliability)}`}>
                {reliability.toFixed(1)}%
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p className="font-medium">
                  {monthData.executed.toLocaleString()} / {monthData.programmed.toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
