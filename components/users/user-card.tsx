"use client"

import type React from "react"
import { MapPin, User, Clock, Star } from "lucide-react"
import type { ActiveUser } from "@/types/user-types"
import { getStatusColor, getRankColor, getRankIcon } from "@/utils/user-utils"

interface UserCardProps {
  user: ActiveUser
  onClick: (user: ActiveUser) => void
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const rankColors = getRankColor(user.rank)

  return (
    <div
      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-large transition-all duration-500 group hover:-translate-y-2 cursor-pointer relative overflow-hidden"
      onClick={() => onClick(user)}
    >
      {/* Background Pattern */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${rankColors.bg} opacity-5 group-hover:opacity-10 transition-opacity`}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-green group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br ${rankColors.bg}`}
              >
                {user.avatar}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
              ></div>
              {user.isVip && (
                <div className="absolute -top-1 -left-1 bg-yellow-500 rounded-full p-1">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500 font-medium">{user.role}</p>
              <p className="text-xs text-gray-400">{user.zone}</p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full ${rankColors.bgLight} ${rankColors.border} border`}
            >
              {getRankIcon(user.rank)}
              <span className={`text-xs font-bold ${rankColors.text}`}>{user.rank}</span>
            </div>
          </div>
        </div>

        {/* Zone and Sponsor Info */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center space-x-3">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Zona: {user.zone}</span>
          </div>
          <div className="flex items-center space-x-3">
            <User className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Padrino: {user.sponsor}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Tiempo activo: {user.activeTime}</span>
          </div>
        </div>

        {/* Productivity */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Productividad</span>
            <span className="font-bold text-gray-900">{user.productivity}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${user.productivity}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
