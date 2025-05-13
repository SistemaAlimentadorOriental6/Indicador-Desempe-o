"use client"

import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  subtitle: string
  percentage: number
}

export default function StatCard({ title, subtitle, percentage }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)" }}
      className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-green-100/50 relative overflow-hidden group"
    >
      {/* Decorative background with enhanced effects */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
      </div>

      <div className="flex justify-between items-center mb-3 relative z-10">
        <h4 className="font-medium text-gray-800">{title}</h4>
        <div className="flex items-center gap-1 text-green-600">
          <span className="text-lg font-bold">{percentage}%</span>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4 relative z-10">{subtitle}</div>

      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="absolute h-full left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 0.5,
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
