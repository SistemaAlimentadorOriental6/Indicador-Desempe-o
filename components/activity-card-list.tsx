"use client"

import { memo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CheckCircle2, Clock, MapPin } from "lucide-react"

interface Activity {
  id: string
  month: string
  day: string
  title: string
  location: string
  time: string
}

interface ActivityCardListProps {
  activities: Activity[]
}

// Memoized component for better performance
const ActivityCardList = memo(function ActivityCardList({ activities }: ActivityCardListProps) {
  const prefersReducedMotion = useReducedMotion()

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p>No hay actividades programadas</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} prefersReducedMotion={prefersReducedMotion} />
      ))}
    </div>
  )
})

// Activity card component - memoized for performance
const ActivityCard = memo(function ActivityCard({
  activity,
  prefersReducedMotion,
}: {
  activity: Activity
  prefersReducedMotion?: boolean
}) {
  return (
    <motion.div
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              scale: 1.02,
              backgroundColor: "rgba(240, 253, 244, 0.8)",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
            }
      }
      className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/30 transition-all duration-200 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Actividad: ${activity.title} en ${activity.location} el ${activity.day} de ${activity.month} a las ${activity.time}`}
    >
      <div className="bg-gradient-to-b from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-lg h-12 w-12 flex flex-col items-center justify-center relative overflow-hidden">
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            aria-hidden="true"
          />
        )}
        <span className="text-xs font-medium">{activity.month}</span>
        <span className="text-lg font-bold leading-none">{activity.day}</span>
      </div>
      <div>
        <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
          {activity.title}
          <CheckCircle2 className="h-3.5 w-3.5 ml-1 text-green-500 dark:text-green-400" aria-hidden="true" />
        </h4>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="h-3 w-3 mr-1 text-green-600 dark:text-green-500" aria-hidden="true" />
          <span>{activity.location}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          <Clock className="h-3 w-3 mr-1 text-green-600 dark:text-green-500" aria-hidden="true" />
          <span>{activity.time}</span>
        </div>
      </div>
    </motion.div>
  )
})

// Calendar icon (missing from import)
function Calendar(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}

export default ActivityCardList
