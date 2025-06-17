"use client"

import type React from "react"
import { Target, Activity, BarChart3, Users } from "lucide-react"
import type { GlobalStats } from "@/types/km-types"

interface GlobalStatsCardsProps {
  stats: GlobalStats
}

export const GlobalStatsCards: React.FC<GlobalStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
            Total Programado
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalProgrammed.toLocaleString()} km</h3>
        <p className="text-sm text-gray-500 font-medium">Objetivo global histórico</p>
        <div className="mt-3 flex items-center space-x-2">
          <div className="flex-1 bg-blue-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "100%" }}></div>
          </div>
          <span className="text-xs font-semibold text-blue-600">100%</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-soft">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            Total Ejecutado
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalExecuted.toLocaleString()} km</h3>
        <p className="text-sm text-gray-500 font-medium">Kilómetros realmente recorridos</p>
        <div className="mt-3 flex items-center space-x-2">
          <div className="flex-1 bg-green-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(stats.totalExecuted / stats.totalProgrammed) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-green-600">
            {((stats.totalExecuted / stats.totalProgrammed) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-soft">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full border border-primary-200">
            Confiabilidad
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.averageReliability.toFixed(1)}%</h3>
        <p className="text-sm text-gray-500 font-medium">Promedio de confiabilidad del equipo</p>
        <div className="mt-3 flex items-center space-x-2">
          <div className="flex-1 bg-primary-100 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.averageReliability}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-primary-600">{stats.averageReliability.toFixed(1)}%</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-soft">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
            Rendimiento
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {stats.excellentPerformers}/{stats.totalPeople}
        </h3>
        <p className="text-sm text-gray-500 font-medium">Personas con rendimiento excelente</p>
        <div className="mt-3 grid grid-cols-4 gap-1 text-xs">
          <div className="text-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
            <span className="font-semibold text-green-600">{stats.excellentPerformers}</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"></div>
            <span className="font-semibold text-blue-600">{stats.goodPerformers}</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1"></div>
            <span className="font-semibold text-yellow-600">{stats.needsAttention}</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
            <span className="font-semibold text-red-600">{stats.criticalPerformers}</span>
          </div>
        </div>
      </div>
    </div>
  )
}