"use client"

import { motion } from "framer-motion"
import { Activity, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import StatCard from "../stat-card"

interface StatsTabContentProps {
  kilometersTotal: number
  kilometersGoal: number
  kilometersPercentage: number
  cardVariants: any
  fadeIn: any
}

export default function StatsTabContent({
  kilometersTotal,
  kilometersGoal,
  kilometersPercentage,
  cardVariants,
  fadeIn,
}: StatsTabContentProps) {
  return (
    <motion.div key="stats" variants={fadeIn} initial="hidden" animate="visible">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
        <h3 className="text-gray-800 font-semibold">Mis Estadísticas</h3>
      </div>

      <div className="space-y-6">
        <StatCard
          title="Progreso Semanal"
          subtitle={`${kilometersTotal} km de ${kilometersGoal} km`}
          percentage={kilometersPercentage}
        />

        <motion.div
          variants={cardVariants}
          initial="initial"
          whileHover="hover"
          className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-green-100/50 relative overflow-hidden group"
        >
          {/* Decorative background with enhanced effects */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
          </div>

          <div className="flex justify-between items-center mb-3 relative z-10">
            <h4 className="font-medium text-gray-800">Ritmo Promedio</h4>
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-lg font-bold">5:30</span>
              <span className="text-xs">min/km</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 relative z-10">
            <Activity className="h-4 w-4 text-green-600" />
            <span>Mejora de 15 segundos respecto a la semana pasada</span>
          </div>

          {/* Pace chart with enhanced animations and glow effects*/}
          <div className="mt-4 h-24 relative z-10">
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 300 100">
                <defs>
                  <linearGradient id="paceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                  d="M0,70 C20,65 40,80 60,50 C80,20 100,30 120,40 C140,50 160,30 180,20 C200,10 220,30 240,25 C260,20 280,30 300,20"
                  fill="none"
                  stroke="url(#paceGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glowFilter)"
                />

                {/* Animated dots along the path with enhanced glow */}
                <motion.circle
                  cx="0"
                  cy="0"
                  r="4"
                  fill="#059669"
                  filter="url(#glowFilter)"
                  animate={{
                    cx: [0, 60, 120, 180, 240, 300],
                    cy: [70, 50, 40, 20, 25, 20],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }}
                />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="initial"
          whileHover="hover"
          className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-green-100/50 relative overflow-hidden group"
        >
          {/* Decorative background with enhanced effects */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
          </div>

          <div className="flex justify-between items-center mb-3 relative z-10">
            <h4 className="font-medium text-gray-800">Próximo Nivel</h4>
            <span className="text-amber-500 font-semibold">Oro</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              transition={{ delay: 1, duration: 1, ease: "easeOut" }}
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
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Nivel Plata</span>
            <span>Faltan 2,500 km</span>
          </div>

          {/* Level badges with enhanced animations and glow effects */}
          <div className="flex justify-between mt-6 px-4 relative z-10">
            {["Bronce", "Plata", "Oro", "Platino", "Diamante"].map((level, idx) => (
              <div key={level} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: idx === 1 ? 1.2 : idx === 2 ? 1 : 0.8,
                    opacity: idx <= 1 ? 1 : 0.5,
                    y: idx === 1 ? -3 : 0,
                  }}
                  whileHover={{
                    scale: idx === 1 ? 1.3 : idx === 2 ? 1.1 : 0.9,
                    y: -3,
                  }}
                  transition={{ delay: 1 + idx * 0.1, duration: 0.5 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-1 shadow-sm transition-all",
                    idx <= 1
                      ? "bg-gradient-to-br from-green-500 to-emerald-400 text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {idx <= 1 ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <Award className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Award className="h-4 w-4" />
                  )}
                </motion.div>
                <span className={`text-xs ${idx <= 1 ? "text-green-700 font-medium" : "text-gray-400"}`}>{level}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
