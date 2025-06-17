"use client"

import type React from "react"
import {
  XCircle,
  Star,
  Clock,
  Phone,
  Mail,
  MapPin,
  Users,
  User,
  Shield,
  Building,
  Calendar,
  Target,
  Activity,
  TrendingUp,
  Award,
} from "lucide-react"
import type { ActiveUser } from "@/types/user-types"
import { getRankColor, getRankIcon, getStatusColor } from "@/utils/user-utils"

interface UserDetailModalProps {
  user: ActiveUser
  onClose: () => void
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const rankColors = getRankColor(user.rank)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className={`relative p-8 bg-gradient-to-r ${rankColors.bg} text-white rounded-t-3xl overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 z-10"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-3xl font-bold backdrop-blur-sm border border-white/30">
                  {user.avatar}
                </div>
                <div
                  className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white ${getStatusColor(user.status)}`}
                ></div>
                {user.isVip && (
                  <div className="absolute -top-2 -left-2 bg-yellow-500 rounded-full p-1.5">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                <p className="text-xl opacity-90 mb-1">{user.role}</p>
                <p className="opacity-75">
                  {user.zone} - {user.department}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    {getRankIcon(user.rank)}
                    <span className="font-semibold">{user.rank}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{user.activeTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{user.productivity}%</div>
                <div className="text-sm opacity-75">Productividad</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{user.zone}</div>
                <div className="text-sm opacity-75">Zona Asignada</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{user.rank}</div>
                <div className="text-sm opacity-75">Rango Actual</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{user.activeTime}</div>
                <div className="text-sm opacity-75">En la Empresa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Contact & Zone Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center space-x-2">
                <Phone className="w-6 h-6" />
                <span>Información de Contacto</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">{user.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">Zona: {user.zone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">Horario: {user.workingHours}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-6 border border-primary-200">
              <h3 className="text-xl font-bold text-primary-800 mb-4 flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>Información Organizacional</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700">Padrino: {user.sponsor}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700">Líder: {user.teamLead}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700">Cargo: {user.role}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span className="text-primary-700">Ingreso: {user.joinDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Specialization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center space-x-2">
                <Target className="w-6 h-6" />
                <span>Experiencia y Especialización</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Experiencia Previa</p>
                  <p className="text-purple-800 font-semibold">{user.experience}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Especialización</p>
                  <p className="text-purple-800 font-semibold">{user.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Proyecto Actual</p>
                  <p className="text-purple-800 font-semibold">{user.currentProject}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 border border-orange-200">
              <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center space-x-2">
                <Activity className="w-6 h-6" />
                <span>Actividad Actual</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Estado</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status)}`}></div>
                    <span className="text-orange-800 font-semibold capitalize">{user.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Actividad</p>
                  <p className="text-orange-800 font-semibold">{user.activity}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Último acceso</p>
                  <p className="text-orange-800 font-semibold">{user.lastLogin}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              <span>Rendimiento Semanal</span>
            </h3>
            <div className="flex items-end justify-between space-x-4 h-40 mb-4">
              {user.performance.map((value, index) => (
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
          </div>

          {/* Badges */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <span>Logros y Reconocimientos</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.badges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200"
                >
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
