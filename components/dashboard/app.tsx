"use client"

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import SidebarOptimized from "./sidebar"
import MobileProfileCard from "./mobile-profile-card"
import DesktopHeader from "./desktop-header"
import { ArrowRight, Activity, Percent, TrendingUp } from "lucide-react"

// Lazy load components
const ActivitiesTabContent = lazy(() => import("./tabs/activities-tab"))
const StatsTabContent = lazy(() => import("./tabs/stats-tab"))
const ProfileDrawer = lazy(() => import("../profile-drawer"))
const ProfileModal = lazy(() => import("../profile-modal"))
const ProgressCards = lazy(() => import("../progress-cards"))
const ActivityDetailModal = lazy(() => import("../activity-detail-modal"))

import type { HealthMetrics } from "@/types/kpi"

// Skeleton simulando la carga de contenido
const ContentSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-40 bg-gray-100 rounded-2xl w-full"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-gray-100 rounded-2xl"></div>
      <div className="h-64 bg-gray-100 rounded-2xl"></div>
    </div>
  </div>
)

export default function MedicalApp() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, logout } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState("profile")
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [kilometersData, setKilometersData] = useState<any>(null)
  const [bonusesData, setBonusesData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Modals state
  const [kilometrosDetailOpen, setKilometrosDetailOpen] = useState(false)
  const [bonosDetailOpen, setBonosDetailOpen] = useState(false)

  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    heartRate: 72,
    sleep: 7.5,
    stress: 24,
    hydration: 85,
  })

  // Data fetching optimizado
  useEffect(() => {
    if (!user?.codigo) return

    const fetchData = async () => {
      setIsLoadingData(true)
      try {
        // Verificar caché sesional (5 minutos)
        const cacheKeyKm = `km-${user.codigo}`
        const cacheKeyBonus = `bonus-${user.codigo}`
        const cacheTimeKey = `time-${user.codigo}`

        const cachedTime = sessionStorage.getItem(cacheTimeKey)
        const now = Date.now()

        if (cachedTime && (now - Number(cachedTime) < 300000)) {
          const cachedKm = sessionStorage.getItem(cacheKeyKm)
          const cachedBonus = sessionStorage.getItem(cacheKeyBonus)

          if (cachedKm && cachedBonus) {
            setKilometersData(JSON.parse(cachedKm))
            setBonusesData(JSON.parse(cachedBonus))
            setIsLoadingData(false)
            return
          }
        }

        // Fetch paralelo
        const [kmRes, bonusRes] = await Promise.all([
          fetch(`/api/user/kilometers?codigo=${user.codigo}`),
          fetch(`/api/user/bonuses?codigo=${user.codigo}`)
        ])

        if (kmRes.ok && bonusRes.ok) {
          const kmData = await kmRes.json()
          const bonusData = await bonusRes.json()

          setKilometersData(kmData)
          setBonusesData(bonusData)

          // Guardar en caché
          sessionStorage.setItem(cacheKeyKm, JSON.stringify(kmData))
          sessionStorage.setItem(cacheKeyBonus, JSON.stringify(bonusData))
          sessionStorage.setItem(cacheTimeKey, now.toString())
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [user?.codigo])

  // Custom Event Listeners
  useEffect(() => {
    const handleOpenKm = () => setKilometrosDetailOpen(true)
    const handleOpenBonus = () => setBonosDetailOpen(true)

    window.addEventListener("openKilometrosDetail", handleOpenKm)
    window.addEventListener("openBonosDetail", handleOpenBonus)

    return () => {
      window.removeEventListener("openKilometrosDetail", handleOpenKm)
      window.removeEventListener("openBonosDetail", handleOpenBonus)
    }
  }, [])

  // Handlers
  const handleLogout = useCallback(() => {
    logout()
    router.push("/")
  }, [logout, router])

  const openProfile = useCallback(() => setIsProfileOpen(true), [])
  const closeProfile = useCallback(() => setIsProfileOpen(false), [])

  // Datos procesados
  const summaryData = useMemo(() => ({
    kilometersTotal: kilometersData?.summary?.totalExecuted || 0,
    kilometersGoal: kilometersData?.summary?.totalProgrammed || 0,
    kilometersPercentage: kilometersData?.summary?.percentage || 0,
    bonusesAvailable: bonusesData?.lastMonthData?.finalValue || 0,
    lastMonthName: bonusesData?.lastMonthData?.monthName || "",
    lastMonthYear: bonusesData?.lastMonthData?.year || new Date().getFullYear(),
  }), [kilometersData, bonusesData])

  // Variantes de animación
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  }

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar Desktop */}
      {!isMobile && user && (
        <div className="w-[280px] xl:w-[320px] flex-shrink-0 bg-white border-r border-gray-100 z-20">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <SidebarOptimized
              user={user}
              openProfile={openProfile}
              handleLogout={handleLogout}
              kilometersTotal={summaryData.kilometersTotal}
              bonusesAvailable={summaryData.bonusesAvailable}
              lastMonthName={summaryData.lastMonthName}
              lastMonthYear={summaryData.lastMonthYear}
              kilometersData={kilometersData}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header / Mobile Profile */}
            {isMobile ? (
              <div className="mb-6">
                <MobileProfileCard
                  user={user}
                  openProfile={openProfile}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  healthMetrics={healthMetrics}
                />
              </div>
            ) : (
              <div className="mb-8">
                <DesktopHeader
                  user={user}
                  bonusesAvailable={summaryData.bonusesAvailable}
                  lastMonthName={summaryData.lastMonthName}
                  lastMonthYear={summaryData.lastMonthYear}
                  openProfile={openProfile}
                />
              </div>
            )}

            {/* Dashboard Sections */}
            <div className="space-y-8">
              {/* Progress Title */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Resumen de Progreso</h3>
                </div>
              </div>

              {/* Progress Cards */}
              <Suspense fallback={<ContentSkeleton />}>
                <ProgressCards
                  userCode={user?.codigo || ""}
                  kilometersData={kilometersData}
                  bonusesData={bonusesData}
                />
              </Suspense>

              {/* Tabs Content (si es necesario) */}
              <div className="mt-8">
                <Suspense fallback={null}>
                  {activeTab === "stats" && !isMobile && (
                    <StatsTabContent
                      kilometersTotal={summaryData.kilometersTotal}
                      kilometersGoal={summaryData.kilometersGoal}
                      kilometersPercentage={summaryData.kilometersPercentage}
                      cardVariants={cardVariants}
                      fadeIn={fadeIn}
                    />
                  )}
                </Suspense>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <Suspense fallback={null}>
        {isProfileOpen && (isMobile ?
          <ProfileDrawer isOpen={isProfileOpen} onClose={closeProfile} /> :
          <ProfileModal isOpen={isProfileOpen} onClose={closeProfile} />
        )}

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
