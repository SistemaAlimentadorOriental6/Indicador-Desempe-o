"use client"

import type React from "react"
import { RefreshCw, Crown } from "lucide-react"
import type { ActiveUser } from "@/types/user-types"
import { getRankStats, getRankColor, getRankIcon } from "@/utils/user-utils"

interface UsersHeaderProps {
  users: ActiveUser[]
}

export const UsersHeader: React.FC<UsersHeaderProps> = ({ users }) => {
  const rankStats = getRankStats(users)

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-32 translate-x-32"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 bg-clip-text text-transparent mb-2">
              Usuarios Activos
            </h2>
            <p className="text-lg text-gray-600 font-medium">Monitoreo de los usuarios activos</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-700">En Vivo</span>
            </div>
            <button className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110">
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Rank Distribution */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span>Distribución por Rangos</span>
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(rankStats).map(([rank, count]) => {
              const rankColors = getRankColor(rank)
              return (
                <div
                  key={rank}
                  className={`p-4 rounded-2xl ${rankColors.bgLight} border ${rankColors.border} text-center hover:scale-105 transition-all duration-300`}
                >
                  <div className="flex items-center justify-center mb-2">{getRankIcon(rank)}</div>
                  <p className={`font-bold text-lg ${rankColors.text}`}>{count}</p>
                  <p className={`text-sm font-medium ${rankColors.text}`}>{rank}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
