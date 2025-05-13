"use client"

import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  subtitle: string
  percentage: number
}

export default function StatCard({ title, subtitle, percentage }: StatCardProps) {
  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02, y: -5 },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-green-100/50 relative overflow-hidden group"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-l from-green-100/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-70 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-t from-emerald-100/20 to-transparent rounded-full opacity-70 group-hover:scale-110 transition-transform duration-700"></div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h4 className="font-medium text-gray-800">{title}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold px-3 py-1 rounded-full shadow-sm">
          {percentage}%
        </div>
      </div>

      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
          className="absolute h-full left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Lunes</span>
        <span>Domingo</span>
      </div>

      {/* Weekly progress bars with animation */}
      <div className="flex gap-1.5 items-end mt-5 h-24 pt-6 relative z-10">
        {[35, 60, 80, 45, 70, 90, 55].map((height, index) => {
          const isHighest = index === 2 || index === 5
          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.8, ease: "easeOut" }}
              className="relative group/bar flex-1"
            >
              <motion.div
                className={`rounded-t-md w-full ${
                  isHighest
                    ? "bg-gradient-to-t from-green-600 to-emerald-500"
                    : "bg-gradient-to-t from-green-200 to-green-100"
                }`}
                style={{ height: "100%" }}
                whileHover={{ scaleY: 1.1 }}
                transition={{ duration: 0.2 }}
              />

              {/* Value tooltips that appear on hover */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200">
                <div
                  className={`px-2 py-1 rounded-md text-xs text-white ${isHighest ? "bg-green-600" : "bg-green-400"}`}
                >
                  {height}%
                </div>
                <div
                  className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${isHighest ? "border-t-green-600" : "border-t-green-400"} mx-auto`}
                ></div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-between text-xs font-medium text-gray-500 mt-1 px-1">
        <span>L</span>
        <span>M</span>
        <span>X</span>
        <span>J</span>
        <span>V</span>
        <span>S</span>
        <span>D</span>
      </div>
    </motion.div>
  )
}
