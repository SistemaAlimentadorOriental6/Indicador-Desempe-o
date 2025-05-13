"use client"

import { motion } from "framer-motion"
import { BarChart, Medal, User } from "lucide-react"

interface TopPerformersChartProps {
  data: any[]
  isLoading: boolean
  month: string
  year: number
  onUserSelect: (user: any) => void
}

export default function TopPerformersChart({ data, isLoading, month, year, onUserSelect }: TopPerformersChartProps) {
  // Find the maximum kilometers value for scaling
  const maxKilometers = Math.max(...data.map((user) => user.kilometros || 0), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 h-full"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <BarChart className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              Top Performers - {month} {year}
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-200 w-0"></div>
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Medal className="h-12 w-12 text-gray-300 mb-3" />
            <h4 className="text-lg font-medium text-gray-500">No hay datos disponibles</h4>
            <p className="text-sm text-gray-400 mt-1">
              No se encontraron registros para {month} {year}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((user, index) => (
              <motion.div
                key={user.codigo}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer group"
                onClick={() => onUserSelect(user)}
              >
                <div className="flex items-center mb-2">
                  <div className="relative mr-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    {index < 3 && (
                      <div
                        className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                        {user.nombre}
                      </h4>
                      <span className="font-bold text-gray-700">{user.kilometros?.toLocaleString() || 0} km</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{user.rol}</span>
                      <span>{user.bonos || 0} bonos</span>
                    </div>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(((user.kilometros || 0) / maxKilometers) * 100, 5)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full ${
                      index === 0
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-400 to-gray-300"
                          : index === 2
                            ? "bg-gradient-to-r from-amber-700 to-amber-600"
                            : "bg-gradient-to-r from-green-500 to-green-400"
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
