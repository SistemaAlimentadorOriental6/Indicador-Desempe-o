"use client"

import type React from "react"
import { Star, Eye } from "lucide-react"
import type { ActiveUser } from "@/types/user-types"
import { getStatusColor, getRankColor } from "@/utils/user-utils"
import { PerformanceChart } from "./performance-chart"

interface UserListItemProps {
  user: ActiveUser
  onClick: (user: ActiveUser) => void
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onClick }) => {
  const rankColors = getRankColor(user.rank)

  return (
    <div
      className="p-6 hover:bg-gray-25 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(user)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-green group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br ${rankColors.bg}`}
            >
              {user.avatar}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
            ></div>
            {user.isVip && (
              <div className="absolute -top-1 -left-1 bg-yellow-500 rounded-full p-1">
                <Star className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h4 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
                {user.name}
              </h4>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full ${rankColors.bgLight} ${rankColors.text} border ${rankColors.border}`}
              >
                {user.rank}
              </span>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full capitalize ${
                  user.status === "online"
                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                    : user.status === "away"
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : user.status === "busy"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {user.status}
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="font-medium">{user.role}</span>
              <span>Zona: {user.zone}</span>
              <span>Padrino: {user.sponsor}</span>
              <span>Activo: {user.activeTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Productividad</p>
            <p className="font-bold text-lg text-gray-900">{user.productivity}%</p>
          </div>

          <div className="w-24">
            <PerformanceChart data={user.performance} small />
          </div>

          <button className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
