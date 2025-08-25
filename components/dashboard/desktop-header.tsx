"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeScreenProps {
  user: any
  openProfile: () => void
  handleLogout: () => void
}

export default function WelcomeScreen({ user, openProfile, handleLogout }: WelcomeScreenProps) {
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8 relative border-2 border-green-200"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-white z-0"></div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-green-100/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-100/15 rounded-full translate-y-1/2 -translate-x-1/4 blur-md"></div>
      </div>

      <div className="p-6 relative z-10">
        {/* Header content */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-1 w-10 bg-green-400 rounded-full"></div>
              <h2 className="text-green-700 font-bold text-2xl">SAO6</h2>
            </div>
            <p className="text-green-600 mt-2 font-light flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-green-500" />
              {getGreeting()}, {user?.nombre?.split(" ")[0] || "Francisco"}
            </p>
          </div>

          <div className="flex items-center gap-4">{/* Placeholder for badges and buttons */}</div>
        </div>

        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-green-200 p-8 text-center hover:bg-green-50/50 transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-green-700 font-bold text-3xl">SAO6 te desea un excelente día</h3>

            <p className="text-green-600 text-lg font-light">
              Esperamos que tengas una jornada productiva y exitosa, {user?.nombre?.split(" ")[0] || "Francisco"}
            </p>

            <motion.div
              className="flex justify-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Button
                onClick={openProfile}
                className="bg-white hover:bg-green-50 text-green-700 px-8 py-3 rounded-xl border-2 border-green-300 transition-all hover:scale-105 font-medium"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Comenzar mi día
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
