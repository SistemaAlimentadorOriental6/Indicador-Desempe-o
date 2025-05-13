"use client"

import { motion } from "framer-motion"
import { type LucideIcon } from 'lucide-react'

interface HealthMetricItemProps {
  icon: LucideIcon
  label: string
  value: number
  unit: string
}

export default function HealthMetricItem({ icon: Icon, label, value, unit }: HealthMetricItemProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className="bg-green-50/70 p-2.5 rounded-xl flex flex-col items-center">
      <div className="bg-gradient-to-r from-green-200 to-emerald-100 w-8 h-8 rounded-full flex items-center justify-center mb-1">
        <Icon className="h-4 w-4 text-green-600" />
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-800 flex items-center justify-center">
          {value}
          <span className="text-[10px] text-gray-500 ml-0.5">{unit}</span>
        </p>
      </div>
    </motion.div>
  )
}
