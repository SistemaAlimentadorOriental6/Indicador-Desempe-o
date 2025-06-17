"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  User,
  LogOut,
  Route,
  Award,
  Sparkles,
  Star,
  Bell,
  ChevronRight,
  Briefcase,
  Map,
  Shield,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import LogoutConfirmation from "../logout-confirmation"
import { useUserCategory } from "../user-category"
import { useProfileData } from "@/hooks/use-profile-data"
import { Skeleton } from "@/components/ui/skeleton"

interface DesktopHeaderProps {
  user: any
  openProfile: () => void
  handleLogout: () => void
  kilometersTotal: number
  bonusesAvailable: number
  lastMonthName: string
  lastMonthYear: number
  kilometersData: any
}

export default function DesktopHeader({
  user,
  openProfile,
  handleLogout,
  kilometersTotal,
  bonusesAvailable,
  lastMonthName,
  lastMonthYear,
  kilometersData,
}: DesktopHeaderProps) {
  const [currentDate, setCurrentDate] = useState<string>("")
  const [animateStats, setAnimateStats] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [hoverCard, setHoverCard] = useState<number | null>(null)

  // Obtener datos adicionales del perfil
  const { profileData, isLoading, error } = useProfileData(user?.cedula)

  // Log para depuración
  useEffect(() => {
    console.log("DesktopHeader - Datos de perfil:", { profileData, isLoading, error, cedula: user?.cedula })
  }, [profileData, isLoading, error, user?.cedula])

  // Calculate user category based on metrics
  const bonusPercentage = kilometersData?.summary?.percentage || 96
  const kmPercentage = kilometersData?.data?.[0]?.valor_programacion
    ? Math.min(
        100,
        Math.round((kilometersData.data[0].valor_ejecucion / kilometersData.data[0].valor_programacion) * 100),
      )
    : 92

  const { finalCategory } = useUserCategory(bonusPercentage, kmPercentage)

  // Format current date
  useEffect(() => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    setCurrentDate(date.toLocaleDateString("es-CO", options))

    // Trigger stats animation after component mounts
    const timer = setTimeout(() => {
      setAnimateStats(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  // Handle logout with confirmation
  const confirmLogout = () => {
    setShowLogoutConfirm(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-xl overflow-hidden mb-8 relative"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/80 to-green-600/90 z-0"></div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-md"></div>

          {/* Animated particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 5,
              }}
            />
          ))}

          {/* Animated light beams */}
          <motion.div
            className="absolute h-[300px] w-[30px] bg-white/5 rounded-full blur-md"
            style={{ top: "10%", left: "20%", rotate: "45deg" }}
            animate={{
              opacity: [0.05, 0.1, 0.05],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute h-[200px] w-[20px] bg-white/5 rounded-full blur-md"
            style={{ top: "30%", right: "25%", rotate: "-30deg" }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, delay: 2 }}
          />
        </div>

        <div className="p-6 relative z-10">
          {/* Header content */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-1 w-10 bg-white rounded-full"></div>
                <h2 className="text-white font-bold text-2xl">Dashboard Personal</h2>
              </div>
              <p className="text-green-50/90 mt-2 font-light flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-white" />
                Bienvenido de nuevo, {user?.nombre?.split(" ")[0] || "Francisco"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 py-1.5 px-3 rounded-lg backdrop-blur-sm text-white border-0 hover:bg-white/30 transition-colors">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{currentDate}</span>
              </Badge>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openProfile}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all hover:scale-105"
                >
                  <User className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all hover:scale-105"
                >
                  <Bell className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={confirmLogout}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all hover:scale-105"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* User profile summary */}
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5 mb-6 hover:bg-white/15 transition-colors"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-4">
                <motion.div className="relative" whileHover={{ scale: 1.05 }}>
                  <div className="bg-white/15 p-3 rounded-xl">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-white/30"
                    animate={{
                      boxShadow: ["0 0 0 0 rgba(255,255,255,0.3)", "0 0 0 4px rgba(255,255,255,0)"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                </motion.div>
                <div>
                  <h3 className="text-white font-medium text-lg">{user?.nombre || "Francisco Javier Soto"}</h3>

                  {/* Información adicional: Cargo y Zona */}
                  <div className="flex flex-col gap-1">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-4 w-32 bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center text-emerald-100 text-sm">
                          <Briefcase className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                          <span>{profileData?.cargo || "Cargo no disponible"}</span>
                        </div>
                        <div className="flex items-center text-emerald-100 text-sm">
                          <Map className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                          <span>Zona: {profileData?.zona || "No especificada"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">

                  {/* Categoría dinámica basada en los datos reales */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`backdrop-blur-sm border-0 rounded-xl px-3 py-1.5 flex items-center gap-2 ${
                      finalCategory === "Oro"
                        ? "bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border border-yellow-400/20"
                        : finalCategory === "Plata"
                          ? "bg-gradient-to-r from-gray-400/30 to-gray-500/30 border border-gray-400/20"
                          : finalCategory === "Bronce"
                            ? "bg-gradient-to-r from-amber-600/30 to-amber-700/30 border border-amber-600/20"
                            : finalCategory === "Mejorar"
                              ? "bg-gradient-to-r from-blue-500/30 to-blue-600/30 border border-blue-500/20"
                              : finalCategory === "Taller Conciencia"
                                ? "bg-gradient-to-r from-red-500/30 to-red-600/30 border border-red-500/20"
                                : "bg-gradient-to-r from-green-500/30 to-emerald-600/30 border border-green-500/20"
                    }`}
                  >
                    <div
                      
                    >
                      
                    </div>
                  </motion.div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 flex items-center gap-2 text-sm"
                onClick={openProfile}
              >
                Ver perfil completo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Logout confirmation dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <LogoutConfirmation
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
          />
        )}
      </AnimatePresence>
    </>
  )
}
