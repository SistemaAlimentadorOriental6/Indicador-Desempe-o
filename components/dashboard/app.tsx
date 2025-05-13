"use client"

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

// Components
import SidebarOptimized from "./sidebar"
import MobileProfileCard from "./mobile-profile-card"
import DesktopHeader from "./desktop-header"
import { ChevronRight } from "lucide-react"

const ActivitiesTabContent = lazy(() => import("./tabs/activities-tab"))
const StatsTabContent = lazy(() => import("./tabs/stats-tab"))
const ProfileDrawer = lazy(() => import("../profile-drawer"))
const ProfileModal = lazy(() => import("../profile-modal"))
const DataFilter = lazy(() => import("../data-filter"))
const ProgressCards = lazy(() => import("../progress-cards"))
const ActivityDetailModal = lazy(() => import("../activity-detail-modal"))

// Types
import type { HealthMetrics, Activity } from "@/types/kpi"

// Skeleton loaders para evitar parpadeos
const TabContentSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-40 bg-gray-200 rounded-xl"></div>
      <div className="h-40 bg-gray-200 rounded-xl"></div>
      <div className="h-40 bg-gray-200 rounded-xl"></div>
      <div className="h-40 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
)

const FilterSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
  </div>
)

const ProgressCardsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-32 bg-gray-200 rounded-xl"></div>
      <div className="h-32 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
)

export default function MedicalApp() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, logout } = useAuth()

  // State
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileImageError, setProfileImageError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState("/focused-runner.png")
  const [kilometersData, setKilometersData] = useState<any>(null)
  const [bonusesData, setBonusesData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    heartRate: 72,
    sleep: 7.5,
    stress: 24,
    hydration: 85,
  })
  const [kilometrosDetailOpen, setKilometrosDetailOpen] = useState(false)
  const [bonosDetailOpen, setBonosDetailOpen] = useState(false)

  // Refs para controlar las solicitudes de red
  const abortControllerRef = useMemo(() => new AbortController(), [])

  // Set profile image URL
  useEffect(() => {
    setLoaded(true)

    // Set profile image URL
    if (user?.cedula) {
      setProfileImageUrl(`https://admon.sao6.com.co/web/uploads/empleados/${user.cedula}.jpg`)
      setProfileImageError(false)
    }

    // Limpiar controlador de aborto al desmontar
    return () => {
      abortControllerRef.signal.aborted || abortControllerRef.abort()
    }
  }, [user?.cedula, abortControllerRef])

  // Optimizar la carga de datos con caché y control de solicitudes
  useEffect(() => {
    // Fetch kilometers and bonuses data
    const fetchUserData = async () => {
      if (!user?.codigo) return

      setIsLoadingData(true)

      try {
        // Usar el controlador de aborto para cancelar solicitudes pendientes
        const signal = abortControllerRef.signal

        // Verificar si hay datos en sessionStorage para evitar solicitudes innecesarias
        const cachedKmData = sessionStorage.getItem(`km-data-${user.codigo}`)
        const cachedBonusData = sessionStorage.getItem(`bonus-data-${user.codigo}`)
        const cacheTimestamp = sessionStorage.getItem(`data-timestamp-${user.codigo}`)

        // Verificar si el caché es válido (menos de 5 minutos)
        const isCacheValid = cacheTimestamp && Date.now() - Number.parseInt(cacheTimestamp) < 300000

        if (isCacheValid && cachedKmData && cachedBonusData) {
          // Usar datos en caché
          setKilometersData(JSON.parse(cachedKmData))
          setBonusesData(JSON.parse(cachedBonusData))
          setIsLoadingData(false)
          return
        }

        // Función optimizada para fetch con timeout y caché
        const fetchWithCache = async (url: string) => {
          const response = await fetch(url, {
            signal,
            headers: {
              "Cache-Control": "no-store",
              Pragma: "no-cache",
            },
            next: { revalidate: 300 }, // Revalidar cada 5 minutos
          })

          if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status}`)
          }

          return response.json()
        }

        // Parallel data fetching with optimized fetch
        const [kmData, bonusData] = await Promise.all([
          fetchWithCache(`/api/user/kilometers?codigo=${user.codigo}`),
          fetchWithCache(`/api/user/bonuses?codigo=${user.codigo}`),
        ])

        // Guardar en sessionStorage para caché
        sessionStorage.setItem(`km-data-${user.codigo}`, JSON.stringify(kmData))
        sessionStorage.setItem(`bonus-data-${user.codigo}`, JSON.stringify(bonusData))
        sessionStorage.setItem(`data-timestamp-${user.codigo}`, Date.now().toString())

        // Process and set data with the real API response structure
        setBonusesData(bonusData)
        setKilometersData(kmData)
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching user data:", error)

          // Intentar usar datos en caché si hay un error
          try {
            const cachedKmData = sessionStorage.getItem(`km-data-${user.codigo}`)
            const cachedBonusData = sessionStorage.getItem(`bonus-data-${user.codigo}`)

            if (cachedKmData && cachedBonusData) {
              setKilometersData(JSON.parse(cachedKmData))
              setBonusesData(JSON.parse(cachedBonusData))
            }
          } catch (cacheError) {
            console.error("Error retrieving cached data:", cacheError)
          }
        }
      } finally {
        setIsLoadingData(false)
      }
    }

    if (user?.codigo) {
      fetchUserData()
    }
  }, [user?.codigo, abortControllerRef])

  // Optimizar el intervalo de actualización de métricas de salud
  useEffect(() => {
    let healthInterval: NodeJS.Timeout | null = null
    let isActive = true

    // Solo actualizar métricas si la pestaña está visible y el componente está montado
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive) {
        if (!healthInterval) {
          healthInterval = setInterval(() => {
            if (isActive) {
              setHealthMetrics((prev) => ({
                heartRate: prev.heartRate + (Math.random() > 0.5 ? 1 : -1),
                sleep: Math.max(5.5, Math.min(8.5, prev.sleep + (Math.random() > 0.5 ? 0.1 : -0.1))),
                stress: Math.max(10, Math.min(50, prev.stress + (Math.random() > 0.5 ? 1 : -1))),
                hydration: Math.max(70, Math.min(95, prev.hydration + (Math.random() > 0.5 ? 1 : -1))),
              }))
            }
          }, 30000) // 30 segundos
        }
      } else {
        if (healthInterval) {
          clearInterval(healthInterval)
          healthInterval = null
        }
      }
    }

    // Inicializar basado en la visibilidad actual
    handleVisibilityChange()

    // Agregar listener para cambios de visibilidad
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      isActive = false
      if (healthInterval) {
        clearInterval(healthInterval)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Efecto separado para los event listeners
  useEffect(() => {
    // Event listeners for detail modals
    const handleOpenKilometrosDetail = () => setKilometrosDetailOpen(true)
    const handleOpenBonosDetail = () => setBonosDetailOpen(true)

    window.addEventListener("openKilometrosDetail", handleOpenKilometrosDetail)
    window.addEventListener("openBonosDetail", handleOpenBonosDetail)

    return () => {
      window.removeEventListener("openKilometrosDetail", handleOpenKilometrosDetail)
      window.removeEventListener("openBonosDetail", handleOpenBonosDetail)
    }
  }, [])

  // Handle profile image error
  const handleImageError = useCallback(() => {
    console.log("Error al cargar la imagen de perfil, usando imagen por defecto")
    setProfileImageError(true)
    setProfileImageUrl("/focused-runner.png")
  }, [])

  // Profile actions
  const openProfile = useCallback(() => setIsProfileOpen(true), [])
  const closeProfile = useCallback(() => setIsProfileOpen(false), [])
  const handleLogout = useCallback(() => {
    logout()
    router.push("/")
  }, [logout, router])

  // Toggle card expansion
  const toggleCardExpand = useCallback((id: number) => {
    setExpandedCard((prev) => (prev === id ? null : id))
  }, [])

  // Update the data extraction to match the real API response structure
  // Data for display - use optional chaining to safely access nested properties
  const kilometersTotal = kilometersData?.summary?.totalExecuted || 0
  const kilometersGoal = kilometersData?.summary?.totalProgrammed || 0
  const kilometersPercentage = kilometersData?.summary?.percentage || 0
  const bonusesTotal = bonusesData?.summary?.totalExecuted || 0
  const bonusesGoal = bonusesData?.summary?.totalProgrammed || 0
  const bonusesPercentage = bonusesData?.summary?.percentage || 0
  const bonusesAvailable = bonusesData?.lastMonthData?.finalValue || 0
  const lastMonthName = bonusesData?.lastMonthData?.monthName || ""
  const lastMonthYear = bonusesData?.lastMonthData?.year || new Date().getFullYear()

  // Sample data - memoizado para evitar recreaciones
  const upcomingActivities = useMemo<Activity[]>(
    () => [
      {
        id: 1,
        day: "12",
        month: "Jun",
        title: "Ruta Montaña",
        time: "9am - 1pm",
        dayOfWeek: "Domingo",
        distance: "15 km",
        location: "Sierra Nevada",
        participants: 8,
        image: "/winding-mountain-path.png",
        difficulty: "Moderada",
        elevation: "650m",
        terrain: "Montañoso",
      },
      {
        id: 2,
        day: "15",
        month: "Jun",
        title: "Carrera Urbana",
        time: "8am - 10am",
        dayOfWeek: "Miércoles",
        distance: "10 km",
        location: "Centro Ciudad",
        participants: 24,
        image: "/urban-joggers.png",
        difficulty: "Fácil",
        elevation: "120m",
        terrain: "Pavimento",
      },
      {
        id: 3,
        day: "20",
        month: "Jun",
        title: "Trail Running",
        time: "7am - 12pm",
        dayOfWeek: "Lunes",
        distance: "18 km",
        location: "Bosque Nacional",
        participants: 15,
        image: "/placeholder.svg?key=ymnq6",
        difficulty: "Desafiante",
        elevation: "820m",
        terrain: "Senderos naturales",
      },
    ],
    [],
  )

  // Animation variants - memoizados
  const cardVariants = useMemo(
    () => ({
      initial: { scale: 1 },
      hover: { scale: 1.03, y: -5 },
      tap: { scale: 0.98 },
    }),
    [],
  )

  const fadeIn = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.6 },
      },
    }),
    [],
  )

  const staggerList = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    }),
    [],
  )

  // Optimizar las partículas de fondo
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 6,
        duration: 15 + Math.random() * 30,
        delay: Math.random() * 5,
      })),
    [],
  )

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-900/10 via-emerald-50/50 to-white overflow-x-hidden transform-gpu">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-green-600/30 to-emerald-400/30 -z-10"></div>
      <div className="absolute top-12 right-12 w-60 h-60 rounded-full bg-green-300/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-32 left-8 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl -z-10"></div>
      <motion.div
        initial={false}
        className="absolute top-1/3 left-1/2 w-80 h-80 rounded-full bg-green-100/20 -z-10 transform-gpu"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      ></motion.div>

      {/* Animated particles - optimizadas */}
      <AnimatePresence initial={false}>
        {loaded &&
          particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-gradient-to-r from-green-300/40 to-emerald-200/40 backdrop-blur-sm -z-10 transform-gpu"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: particle.duration,
                repeat: Number.POSITIVE_INFINITY,
                delay: particle.delay,
                ease: "easeInOut",
              }}
            />
          ))}
      </AnimatePresence>

      {/* Main content */}
      <div className="w-full mx-auto px-4 sm:px-6 py-8 relative z-0 lg:max-w-none lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar for desktop */}
          {!isMobile && (
            <SidebarOptimized
              user={user}
              profileImageUrl={profileImageUrl}
              handleImageError={handleImageError}
              openProfile={openProfile}
              handleLogout={handleLogout}
              kilometersTotal={kilometersTotal}
              bonusesAvailable={bonusesAvailable}
              lastMonthName={lastMonthName}
              healthMetrics={healthMetrics}
              upcomingActivities={upcomingActivities.slice(0, 2)}
              kilometersData={kilometersData}
              bonusesData={bonusesData}
            />
          )}

          {/* Main content area */}
          <div className={`${isMobile ? "w-full" : "lg:col-span-9 xl:col-span-9"}`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-full h-full transform-gpu ${isMobile ? "max-w-3xl mx-auto" : ""}`}
            >
              {/* Mobile Profile Card */}
              {isMobile && (
                <MobileProfileCard
                  user={user}
                  profileImageUrl={profileImageUrl}
                  handleImageError={handleImageError}
                  openProfile={openProfile}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  healthMetrics={healthMetrics}
                />
              )}

              {/* Desktop Content Header */}
              {!isMobile && (
                <DesktopHeader
                  user={user}
                  openProfile={openProfile}
                  handleLogout={handleLogout}
                  kilometersTotal={kilometersTotal}
                  bonusesAvailable={bonusesAvailable}
                  lastMonthName={lastMonthName}
                  lastMonthYear={lastMonthYear}
                />
              )}

              {/* Tab Content */}
              <div
                className={`${isMobile ? "pb-6 px-6" : "bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 p-6"} transform-gpu`}
              >
                <Suspense fallback={<TabContentSkeleton />}>

                  {activeTab === "activities" && (
                    <ActivitiesTabContent
                      upcomingActivities={upcomingActivities}
                      expandedCard={expandedCard}
                      toggleCardExpand={toggleCardExpand}
                      staggerList={staggerList}
                    />
                  )}

                  {activeTab === "stats" && (
                    <StatsTabContent
                      kilometersTotal={kilometersTotal}
                      kilometersGoal={kilometersGoal}
                      kilometersPercentage={kilometersPercentage}
                      cardVariants={cardVariants}
                      fadeIn={fadeIn}
                    />
                  )}
                </Suspense>
              </div>

              {/* Data Filter Component */}
              <div className="max-w-full mx-auto mt-8 mb-8 transform-gpu">
                <Suspense fallback={<FilterSkeleton />}>
                  <DataFilter />
                </Suspense>
              </div>

              {/* Progress Cards Section */}
              <div className="max-w-full mx-auto mt-8 transform-gpu">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center">
                    <div className="h-1.5 w-6 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mr-2"></div>
                    <h3 className="text-gray-800 font-bold text-xl">Mi Progreso</h3>
                  </div>
                  <button className="text-green-600 text-sm font-medium hover:text-emerald-500 transition-colors flex items-center gap-1 transform-gpu">
                    Ver todos
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <Suspense fallback={<ProgressCardsSkeleton />}>
                  <ProgressCards
                    kilometersData={{
                      total: kilometersTotal,
                      goal: kilometersGoal,
                      percentage: kilometersPercentage,
                    }}
                    bonusesData={{
                      available: bonusesAvailable,
                      total: bonusesTotal,
                      goal: bonusesGoal,
                      percentage: bonusesPercentage,
                    }}
                    userCode={user?.codigo}
                  />
                </Suspense>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Profile Drawer/Modal */}
      <Suspense fallback={null}>
        {isProfileOpen &&
          (isMobile ? (
            <ProfileDrawer isOpen={isProfileOpen} onClose={closeProfile} />
          ) : (
            <ProfileModal isOpen={isProfileOpen} onClose={closeProfile} />
          ))}
      </Suspense>

      {/* Activity Detail Modals */}
      <Suspense fallback={null}>
        {kilometrosDetailOpen && (
          <ActivityDetailModal
            isOpen={kilometrosDetailOpen}
            onClose={() => setKilometrosDetailOpen(false)}
            type="kilometros"
            userCode={user?.codigo}
          />
        )}

        {bonosDetailOpen && (
          <ActivityDetailModal
            isOpen={bonosDetailOpen}
            onClose={() => setBonosDetailOpen(false)}
            type="bonos"
            userCode={user?.codigo}
          />
        )}
      </Suspense>
    </div>
  )
}
