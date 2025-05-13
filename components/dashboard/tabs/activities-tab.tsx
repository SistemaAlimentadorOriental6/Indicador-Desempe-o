"use client"

import { motion } from "framer-motion"
import ActivityCard from "../activity-card"
import type { Activity } from "@/types/kpi"

interface ActivitiesTabContentProps {
  upcomingActivities: Activity[]
  expandedCard: number | null
  toggleCardExpand: (id: number) => void
  staggerList: any
}

export default function ActivitiesTabContent({
  upcomingActivities,
  expandedCard,
  toggleCardExpand,
  staggerList,
}: ActivitiesTabContentProps) {
  return (
    <motion.div key="activities" variants={staggerList} initial="hidden" animate="visible">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
        <h3 className="text-gray-800 font-semibold">Próximas Actividades</h3>
      </div>

      <div className="space-y-4">
        {upcomingActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isExpanded={expandedCard === activity.id}
            onToggle={() => toggleCardExpand(activity.id)}
          />
        ))}
      </div>
    </motion.div>
  )
}
