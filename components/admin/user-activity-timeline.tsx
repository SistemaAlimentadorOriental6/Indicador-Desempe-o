"use client"

import { motion } from "framer-motion"
import { Activity, Route, Gift, Clock, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface UserActivityTimelineProps {
  activities: any[]
  isLoading: boolean
  onUserSelect: (user: any) => void
}

export default function UserActivityTimeline({ activities, isLoading, onUserSelect }: UserActivityTimelineProps) {
  // Format timestamp to relative time (e.g., "hace 5 minutos")
  const formatRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: es })
    } catch (e) {
      return "hace un momento"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 h-full"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Actividad Reciente</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div key={index} className="animate-pulse flex">
                <div className="mr-4 relative">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="absolute top-12 bottom-0 left-1/2 w-0.5 bg-gray-100 -translate-x-1/2"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Clock className="h-12 w-12 text-gray-300 mb-3" />
            <h4 className="text-lg font-medium text-gray-500">No hay actividad reciente</h4>
            <p className="text-sm text-gray-400 mt-1">No se han registrado actividades recientemente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-100"></div>

            {/* Activity items */}
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex"
                >
                  <div className="mr-4 relative">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center cursor-pointer"
                      onClick={() => onUserSelect({ codigo: activity.userId, nombre: activity.userName })}
                    >
                      <User className="h-5 w-5 text-green-600" />
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      <span
                        className="hover:text-green-600 cursor-pointer"
                        onClick={() => onUserSelect({ codigo: activity.userId, nombre: activity.userName })}
                      >
                        {activity.userName}
                      </span>{" "}
                      {activity.activityType === "KILOMETROS" ? "recorrió" : "recibió"}{" "}
                      <span className="font-bold">
                        {activity.value} {activity.activityType === "KILOMETROS" ? "km" : "bonos"}
                      </span>
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                    <div className="mt-2 flex">
                      {activity.activityType === "KILOMETROS" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                          <Route className="h-3 w-3 mr-1" />
                          Kilómetros
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center">
                          <Gift className="h-3 w-3 mr-1" />
                          Bonos
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
