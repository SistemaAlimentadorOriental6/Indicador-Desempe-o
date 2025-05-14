"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion"
import {
  User,
  Settings,
  Star,
  Phone,
  MessageSquare,
  Mail,
  Heart,
  Calendar,
  MapPin,
  Award,
  Shield,
  LogOut,
  Zap,
  Sparkles,
  Leaf,
  Activity,
  Briefcase,
  Map,
} from "lucide-react"
import type { HealthMetrics } from "@/types/kpi"
import { useUserCategory } from "../user-category"
import { useIsMobile } from "@/hooks/use-mobile"
import LogoutConfirmation from "../logout-confirmation"
import { useRouter } from "next/navigation"
import { useProfileData } from "@/hooks/use-profile-data"
import { Skeleton } from "@/components/ui/skeleton"

interface MobileProfileCardProps {
  user: any
  profileImageUrl: string
  handleImageError: () => void
  openProfile: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  healthMetrics: HealthMetrics
  handleLogout: () => void
}

// Componente de animación para aparecer al hacer scroll
const FadeInWhenVisible = ({ children, delay = 0, className = "" }) => {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: delay, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Componente para mostrar una métrica con icono
const MetricItem = ({ icon: Icon, title, value }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-green-100/70 shadow-sm"
    >
      <div className="p-2 rounded-full bg-green-50 text-green-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </motion.div>
  )
}

// Componente para mostrar un indicador circular
const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, showAnimation = true, delay = 0 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const dash = (percentage * circumference) / 100

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Fondo del círculo */}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradientGreen)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: showAnimation ? circumference - dash : 0 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-sm font-bold text-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.5 }}
        >
          {percentage}%
        </motion.span>
      </div>
    </div>
  )
}

// Componente principal
export default function MobileProfileCard({
  user,
  profileImageUrl,
  handleImageError,
  openProfile,
  activeTab,
  setActiveTab,
  healthMetrics,
  handleLogout,
}: MobileProfileCardProps) {
  const router = useRouter()

  // Obtener datos adicionales del perfil
  const { profileData, isLoading, error } = useProfileData(user?.cedula)

  // Log para depuración
  useEffect(() => {
    console.log("MobileProfileCard - Datos de perfil:", { profileData, isLoading, error, cedula: user?.cedula })
  }, [profileData, isLoading, error, user?.cedula])

  // Calcular la categoría del usuario basada en métricas
  const [bonusPercentage, setBonusPercentage] = useState(0)
  const [kmPercentage, setKmPercentage] = useState(0)
  const [lastMonthInfo, setLastMonthInfo] = useState({
    month: "",
    year: 0,
  })

  // Efecto para cargar los datos del último mes
  useEffect(() => {
    // Función para obtener los datos del último mes
    const fetchLastMonthData = async () => {
      try {
        if (user?.cedula) {
          // Obtener datos de bonos
          const bonusResponse = await fetch(`/api/get-base-bonus-for-year?codigo=${user.cedula}`)
          const bonusData = await bonusResponse.json()

          // Obtener datos de kilometraje
          const kmsResponse = await fetch(`/api/data-repository?codigo=${user.cedula}`)
          const kmsData = await kmsResponse.json()

          // Usar datos del último mes de bonos
          if (bonusData.success && bonusData.lastMonthData) {
            const bonusValue = bonusData.lastMonthData.finalValue
            const bonusBase = bonusData.lastMonthData.bonusValue
            // Calcular porcentaje: (valor final / valor base) * 100
            const bonusPercent = bonusBase > 0 ? Math.round((bonusValue / bonusBase) * 100) : 0

            setBonusPercentage(bonusPercent)
            setLastMonthInfo({
              month: bonusData.lastMonthData.monthName,
              year: bonusData.lastMonthData.year,
            })

            console.log("Datos de bono cargados:", {
              bonusBase,
              bonusValue,
              bonusPercent,
              month: bonusData.lastMonthData.monthName,
              year: bonusData.lastMonthData.year,
            })
          }

          // Usar datos del último mes de kilometraje
          if (kmsData.success && kmsData.data && kmsData.data.length > 0) {
            // Obtener el registro más reciente (los datos vienen ordenados por fecha DESC)
            const lastKmsData = kmsData.data[0]
            const kmsProgValue = Number.parseFloat(lastKmsData.valor_programacion) || 0
            const kmsExecValue = Number.parseFloat(lastKmsData.valor_ejecucion) || 0

            // Calcular porcentaje: (valor ejecutado / valor programado) * 100
            const kmsPercent = kmsProgValue > 0 ? Math.round((kmsExecValue / kmsProgValue) * 100) : 0

            setKmPercentage(kmsPercent)
            console.log("Datos de kilometraje cargados:", {
              kmsProgValue,
              kmsExecValue,
              kmsPercent,
              month: lastKmsData.monthName,
              year: lastKmsData.year,
            })
          }
        } else if (healthMetrics) {
          // Fallback a los datos proporcionados por props si no hay cédula
          console.log("Usando datos de props healthMetrics")
          setBonusPercentage(healthMetrics.bonusPercentage || 0)
          setKmPercentage(healthMetrics.kmPercentage || 0)
        }
      } catch (error) {
        console.error("Error al cargar datos del último mes:", error)
        // Usar datos de props como fallback en caso de error
        if (healthMetrics) {
          setBonusPercentage(healthMetrics.bonusPercentage || 0)
          setKmPercentage(healthMetrics.kmPercentage || 0)
        }
      }
    }

    fetchLastMonthData()
  }, [user?.cedula, healthMetrics])

  const { finalCategory } = useUserCategory(bonusPercentage, kmPercentage)
  const isMobile = useIsMobile()

  // Estados
  const [activeMetric, setActiveMetric] = useState("general")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Efecto de partículas flotantes
  const FloatingParticle = ({ delay = 0, size = 4, duration = 3, x = 0, y = 0 }) => (
    <motion.div
      className="absolute rounded-full bg-green-200/30"
      style={{
        width: size,
        height: size,
        top: `${y}%`,
        left: `${x}%`,
      }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        delay,
      }}
    />
  )

  return (
    <div className="pb-6">
      {/* Header con diseño mejorado - Ahora ocupa todo el ancho */}
      <motion.div
        className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 relative overflow-hidden w-full"
        style={{
          borderRadius: "0 0 30px 30px",
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Elementos decorativos del fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <motion.div
            className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white opacity-10"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 10, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white opacity-10"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -5, 0],
              y: [0, 5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />

          {/* Partículas flotantes */}
          {[...Array(8)].map((_, i) => (
            <FloatingParticle
              key={i}
              delay={Math.random() * 2}
              size={2 + Math.random() * 4}
              duration={3 + Math.random() * 3}
              x={10 + Math.random() * 80}
              y={10 + Math.random() * 80}
            />
          ))}
        </div>

        {/* Contenido del header */}
        <div className="relative z-10 pt-12 pb-24 px-5">
          <div className="flex justify-between items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center">
                <div className="h-0.5 w-5 bg-white/80 rounded-full mr-2" />
                <h2 className="text-white font-bold text-xl">Mi Perfil</h2>
              </div>
              <p className="text-white/80 mt-1 pl-7 text-xs font-light">Tu zona personal de bienestar</p>
            </motion.div>

            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10"
              >
                <User className="h-4 w-4 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10"
              >
                <Settings className="h-4 w-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="px-5 -mt-20 relative z-20">
        {/* Tarjeta de perfil */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-green-100/50"
        >
          <div className="p-5">
            {/* Foto de perfil y nombre */}
            <div className="flex flex-col items-center">
              {/* Avatar con efecto de brillo */}
              <div className="relative mb-3" onClick={openProfile}>
                {/* Efecto de brillo detrás del avatar */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 blur-md opacity-30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  style={{ transform: "translateZ(0)" }}
                />

                {/* Anillo de categoría */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-green-400/70"
                  style={{
                    width: "calc(100% + 10px)",
                    height: "calc(100% + 10px)",
                    top: -5,
                    left: -5,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />

                {/* Imagen de perfil */}
                <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden shadow-lg relative z-10">
                  <img
                    src={profileImageUrl || "/placeholder.svg?height=96&width=96&query=profile"}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />

                  {/* Overlay al hacer hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
                  >
                    <User className="text-white h-6 w-6" />
                  </motion.div>
                </div>

                {/* Insignia de categoría */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="px-3 py-1 rounded-full text-xs font-semibold border shadow-lg bg-gradient-to-r from-green-500 to-emerald-400 text-white border-green-300 shadow-green-300/30"
                  >
                    {finalCategory}
                  </motion.div>
                </div>
              </div>

              {/* Nombre y estado */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-center mt-3"
              >
                <h1
                  className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
                  onClick={openProfile}
                >
                  {user?.nombre || "Usuario"}
                </h1>

                {/* Información de cargo y zona */}
                <div className="mt-1 flex flex-col items-center gap-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-32 bg-gray-100" />
                      <Skeleton className="h-4 w-24 bg-gray-100" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-gray-600 text-xs">
                        <Briefcase className="h-3 w-3 mr-1 text-green-500" />
                        <span>{profileData?.cargo || "Cargo no disponible"}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-xs">
                        <Map className="h-3 w-3 mr-1 text-green-500" />
                        <span>Zona: {profileData?.zona || "No especificada"}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Badge Premium */}
                <div className="mt-1.5 flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center border border-green-200/50 shadow-sm"
                  >
                    <Star className="w-3 h-3 mr-1 text-green-500" fill="#10b981" />
                    Premium
                  </motion.div>
                </div>
              </motion.div>

              {/* Botones de contacto */}
              <div className="flex justify-center mt-4 space-x-3">
                {[
                  { icon: Phone, label: "Llamar" },
                  { icon: MessageSquare, label: "Mensaje" },
                  { icon: Mail, label: "Email" },
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-full shadow-sm bg-green-50 text-green-600 border border-green-100/70"
                  >
                    <item.icon className="h-4 w-4" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Separador con degradado */}
            <div className="my-5 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />

            {/* Métricas principales */}
            <FadeInWhenVisible delay={0.5} className="mb-5">
              <div className="text-xs text-center text-gray-500 mb-2">
                Datos del último mes: {lastMonthInfo.month || new Date().toLocaleDateString("es-ES", { month: "long" })}{" "}
                {lastMonthInfo.year || new Date().getFullYear()}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-green-50 to-white border border-green-100/50 shadow-sm">
                  <CircularProgress percentage={bonusPercentage} size={50} delay={0.6} />
                  <p className="text-xs font-medium text-gray-600 mt-2">Bonos</p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-green-50 to-white border border-green-100/50 shadow-sm">
                  <CircularProgress percentage={kmPercentage} size={50} delay={0.8} />
                  <p className="text-xs font-medium text-gray-600 mt-2">Kilómetros</p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-green-50 to-white border border-green-100/50 shadow-sm">
                  <CircularProgress percentage={88} size={50} delay={1} />
                  <p className="text-xs font-medium text-gray-600 mt-2">Bienestar</p>
                </div>
              </div>
            </FadeInWhenVisible>

            {/* Selector de métricas */}
            <FadeInWhenVisible delay={0.7} className="mb-4">
              <div className="bg-green-50/70 p-1 rounded-xl flex justify-between">
                {[
                  { id: "general", label: "General", icon: User },
                  { id: "health", label: "Bienestar", icon: Heart },
                  { id: "achievements", label: "Logros", icon: Award },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveMetric(tab.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
                      activeMetric === tab.id
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </FadeInWhenVisible>

            {/* Contenido según la métrica seleccionada */}
            <AnimatePresence mode="wait">
              {activeMetric === "general" && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Información personal */}
                  <div className="bg-gradient-to-br from-green-50/50 to-white p-4 rounded-xl border border-green-100/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Información personal</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-full">
                          <MapPin className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ubicación</p>
                          <p className="text-sm font-medium text-gray-700">
                            {profileData?.zona &&
                            profileData.zona !== "Zona no disponible" &&
                            profileData.zona !== "Zona no especificada"
                              ? `${profileData.zona}, Colombia`
                              : "Colombia"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-full">
                          <Briefcase className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cargo</p>
                          <p className="text-sm font-medium text-gray-700">{profileData?.cargo || "No especificado"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-full">
                          <Award className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Categoría máxima</p>
                          <p className="text-sm font-medium text-gray-700">{finalCategory} (7 meses consecutivos)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen profesional */}
                  <div className="bg-gradient-to-br from-green-50/50 to-white p-4 rounded-xl border border-green-100/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Resumen profesional</h3>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {profileData?.cargo &&
                      profileData.cargo !== "Cargo no disponible" &&
                      profileData.cargo !== "Cargo no especificado"
                        ? `${profileData.cargo} con más de 8 años de experiencia y excelente récord de seguridad.
                      Especializado en conducción eficiente y comprometido con el servicio de calidad.`
                        : `Profesional con más de 8 años de experiencia y excelente récord de seguridad.
                      Especializado en conducción eficiente y comprometido con el servicio de calidad.`}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-2 border border-green-100/50">
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-medium text-gray-700">Experiencia</span>
                        </div>
                        <p className="text-sm font-bold text-green-700 mt-1">8+ años</p>
                      </div>

                      <div className="bg-white rounded-lg p-2 border border-green-100/50">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-medium text-gray-700">Eficiencia</span>
                        </div>
                        <p className="text-sm font-bold text-green-700 mt-1">95%</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeMetric === "health" && (
                <motion.div
                  key="health"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Métricas de bienestar */}
                  <div className="bg-gradient-to-br from-green-50/50 to-white p-4 rounded-xl border border-green-100/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Métricas de bienestar</h3>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Descanso", value: 94 },
                        { label: "Nutrición", value: 88 },
                        { label: "Actividad", value: 78 },
                      ].map((metric, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{metric.label}</span>
                            <span className="text-green-600 font-medium">{metric.value}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consejos de bienestar */}
                  <div className="bg-gradient-to-br from-green-50/50 to-white p-4 rounded-xl border border-green-100/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Consejo del día</h3>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-green-100/50">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Recuerda mantener una postura correcta mientras conduces. Ajusta tu asiento para que tus
                        rodillas estén ligeramente dobladas y tus brazos puedan alcanzar el volante sin estirarte.
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <MetricItem icon={Calendar} title="Horas de descanso" value="7.5h/día" />
                      <MetricItem icon={Heart} title="Nivel de estrés" value="Bajo" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeMetric === "achievements" && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Logros destacados */}
                  <div className="bg-gradient-to-br from-green-50/50 to-white p-4 rounded-xl border border-green-100/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Logros destacados</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: Star, text: "100,000 km" },
                        { icon: Award, text: `Categoría ${finalCategory}` },
                      ].map((achievement, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 * i }}
                          className="bg-green-100 text-green-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-green-200/50 shadow-sm"
                        >
                          <achievement.icon className="h-3.5 w-3.5" />
                          {achievement.text}
                        </motion.div>
                      ))}
                    </div>

                    {/* Último logro */}
                    <div className="mt-3 bg-gradient-to-r from-green-100/50 to-emerald-100/50 border border-green-200/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-gradient-to-br from-green-500 to-emerald-400 p-2 shadow-sm">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-800">Nuevo logro desbloqueado</p>
                          <p className="text-xs text-green-700">7 meses consecutivos en categoría {finalCategory}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reconocimientos */}
                  <div className="bg-gradient-to-br from-green-50/50 to-white p-4 rounded-xl border border-green-100/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Reconocimientos</h3>
                    </div>

                    <div className="space-y-2">
                      {[
                        { text: "Conductor del mes - Abril 2023", icon: Award },
                        { text: "Excelencia en seguridad vial", icon: Shield },
                        { text: "Conducción eco-eficiente", icon: Leaf },
                      ].map((recognition, index) => (
                        <div key={index} className="bg-white p-2.5 rounded-lg border border-green-100/50">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-50 rounded-full">
                              <recognition.icon className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-700">{recognition.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de cerrar sesión */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 font-medium text-sm flex items-center justify-center gap-2 border border-red-200/50 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Diálogo de confirmación de cierre de sesión */}
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          if (typeof handleLogout === "function") {
            try {
              handleLogout()
            } catch (error) {
              console.error("Error al cerrar sesión:", error)
            }
          }
        }}
      />
    </div>
  )
}
