"use client"

import { motion } from "framer-motion"
import { Users, Award, Gift, ArrowUpRight, ArrowDownRight, User } from "lucide-react"

interface UserStatisticsGridProps {
  users: any[]
  isLoading: boolean
  onUserSelect: (user: any) => void
  month: string
  year: number
}

export default function UserStatisticsGrid({ users, isLoading, onUserSelect, month, year }: UserStatisticsGridProps) {
  // Sort users by kilometers in descending order
  const sortedUsers = [...users].sort((a, b) => (b.kilometros || 0) - (a.kilometros || 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              Estadísticas de Usuarios - {month} {year}
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <div key={index} className="animate-pulse bg-gray-50 rounded-xl p-5">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <h4 className="text-lg font-medium text-gray-500">No hay usuarios disponibles</h4>
            <p className="text-sm text-gray-400 mt-1">No se encontraron usuarios para mostrar estadísticas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedUsers.slice(0, 6).map((user, index) => (
              <motion.div
                key={user.codigo}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="bg-gradient-to-br from-green-50 to-green-100/40 rounded-xl p-5 border border-green-100/40 shadow-sm cursor-pointer"
                onClick={() => onUserSelect(user)}
              >
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-800">{user.nombre}</h4>
                    <p className="text-xs text-gray-500">{user.rol}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Kilómetros</span>
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-800">
                          {user.kilometros?.toLocaleString() || 0}
                        </span>
                        {user.kilometros_change && (
                          <div
                            className={`flex items-center ml-2 text-xs ${
                              user.kilometros_change > 0 ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {user.kilometros_change > 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-0.5" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-0.5" />
                            )}
                            {Math.abs(user.kilometros_change)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((user.kilometros || 0) / 10, 100)}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Bonos</span>
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-800">{user.bonos || 0}</span>
                        {user.bonos_change && (
                          <div
                            className={`flex items-center ml-2 text-xs ${
                              user.bonos_change > 0 ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {user.bonos_change > 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-0.5" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-0.5" />
                            )}
                            {Math.abs(user.bonos_change)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((user.bonos || 0) * 10, 100)}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-xs text-gray-600">Nivel {user.nivel || "Bronce"}</span>
                    </div>
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-gray-600">{user.bonos_disponibles || 0} disponibles</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
