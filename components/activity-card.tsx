"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, Route, User, ChevronUp } from "lucide-react"

interface Activity {
  id: number
  day: string
  month: string
  title: string
  time: string
  dayOfWeek: string
  distance: string
  location: string
  participants: number
  image: string
}

interface ActivityCardProps {
  activity: Activity
  isExpanded: boolean
  onToggle: () => void
}

export default function ActivityCard({ activity, isExpanded, onToggle }: ActivityCardProps) {
  const listItem = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  }

  return (
    <motion.div
      variants={listItem}
      onClick={onToggle}
      className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-green-100/50 hover:shadow-md transition-all cursor-pointer group relative"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-100/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-green-100/20 to-transparent rounded-full"></div>
      </div>

      <div className="flex items-stretch relative z-10">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-300/30 animate-pulse"></div>
          <div className="bg-gradient-to-b from-green-500 to-emerald-500 p-3 flex flex-col items-center justify-center w-20 relative z-10">
            <span className="text-2xl font-bold text-white">{activity.day}</span>
            <span className="text-xs text-white/80">{activity.month}</span>
          </div>
        </div>

        <div className="flex flex-1 justify-between items-center p-4">
          <div>
            <h4 className="font-medium text-gray-800 group-hover:text-green-700 transition-colors">{activity.title}</h4>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="h-4 w-4 mr-1 text-green-600" />
              <span>{activity.dayOfWeek}</span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1 text-green-600" />
              <span>{activity.time}</span>
            </div>
          </div>

          <motion.div
            animate={{
              rotate: isExpanded ? 180 : 0,
              backgroundColor: isExpanded ? "rgb(240, 253, 244)" : "rgb(240, 249, 244)",
            }}
            className="p-2 text-green-600 bg-green-50 rounded-lg shadow-sm transition-colors"
          >
            <ChevronUp className="h-5 w-5" />
          </motion.div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="px-4 overflow-hidden relative z-10"
          >
            <div className="py-4 border-t border-green-100">
              <div className="flex gap-3">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-16 h-16 rounded-lg overflow-hidden shadow-md"
                >
                  <img
                    src={activity.image || "/placeholder.svg"}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center text-sm"
                    >
                      <MapPin className="h-4 w-4 text-green-600 mr-1.5" />
                      <span>{activity.location}</span>
                    </motion.div>
                    <motion.div
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center text-sm"
                    >
                      <Route className="h-4 w-4 text-green-600 mr-1.5" />
                      <span>{activity.distance}</span>
                    </motion.div>
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center text-sm"
                    >
                      <User className="h-4 w-4 text-green-600 mr-1.5" />
                      <span>{activity.participants} participantes</span>
                    </motion.div>
                  </div>
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-sm rounded-lg font-medium shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="h-4 w-4" />
                    Registrarse
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
