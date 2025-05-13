"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Clock, Users, ChevronDown, Mountain, Ruler } from "lucide-react"
import type { Activity } from "@/types/kpi"

interface ActivityCardProps {
  activity: Activity
  isExpanded: boolean
  onToggle: () => void
}

export default function ActivityCard({ activity, isExpanded, onToggle }: ActivityCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-100/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="p-4 cursor-pointer flex items-center gap-4" onClick={onToggle}>
        <div className="bg-gradient-to-b from-green-500 to-emerald-500 text-white rounded-lg h-14 w-14 flex flex-col items-center justify-center relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-xs font-medium">{activity.month}</span>
          <span className="text-xl font-bold leading-none">{activity.day}</span>
          <span className="text-[10px] opacity-80">{activity.dayOfWeek.substring(0, 3)}</span>
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-gray-800">{activity.title}</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="h-3 w-3 mr-1 text-green-600" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1 text-green-600" />
              <span>{activity.time}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Users className="h-3 w-3 mr-1 text-green-600" />
              <span>{activity.participants} participantes</span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-green-100/50 mt-2">
              <div className="flex gap-4 mb-4">
                <div className="w-full h-32 rounded-lg overflow-hidden relative">
                  <img
                    src={activity.image || "/placeholder.svg"}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs py-1 px-2 rounded-full backdrop-blur-sm">
                    {activity.distance}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-green-50/70 p-2 rounded-lg flex flex-col items-center">
                  <div className="bg-green-100 p-1.5 rounded-full mb-1">
                    <Mountain className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-500">Dificultad</span>
                  <span className="text-sm font-medium text-gray-700">{activity.difficulty}</span>
                </div>

                <div className="bg-green-50/70 p-2 rounded-lg flex flex-col items-center">
                  <div className="bg-green-100 p-1.5 rounded-full mb-1">
                    <Ruler className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-500">Elevación</span>
                  <span className="text-sm font-medium text-gray-700">{activity.elevation}</span>
                </div>

                <div className="bg-green-50/70 p-2 rounded-lg flex flex-col items-center">
                  <div className="bg-green-100 p-1.5 rounded-full mb-1">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-500">Terreno</span>
                  <span className="text-sm font-medium text-gray-700">{activity.terrain}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg font-medium shadow-sm flex items-center justify-center gap-2"
              >
                Inscribirse
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
