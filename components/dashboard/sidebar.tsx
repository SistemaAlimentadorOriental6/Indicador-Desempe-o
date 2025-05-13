"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Route,
  Award,
  Gift,
  LogOut,
  Star,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Menu,
  X,
  Home,
  Settings,
  TrendingUp,
  ChevronDown,
  User,
  Info,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserCategory, type CategoryLevel } from "../user-category"
import { CategoryParticles, CategoryHalo, CategoryIcon, CategoryBadge3D, GoldenCrown } from "../category-effects"
import LogoutConfirmation from "../logout-confirmation"
import { useRouter } from "next/navigation"

interface SidebarProps {
  user: { nombre: string; rol: string; codigo?: string }
  profileImageUrl: string
  handleImageError: () => void
  openProfile: () => void
  handleLogout: () => void
  kilometersTotal?: number
  bonusesAvailable: number
  lastMonthName: string
  healthMetrics: {
    heartRate: number
    sleep: number
    stress: number
    hydration: number
  }
  upcomingActivities: {
    id: string
    month: string
    day: string
    title: string
    location: string
    time: string
  }[]
  kilometersData?: {
    data: { valor_ejecucion: number }[]
    summary?: {
      totalProgrammed: number
      totalExecuted: number
      percentage: number
    }
  }
  bonusesData?: {
    summary?: {
      totalProgrammed: number
      totalExecuted: number
      percentage: number
    }
    lastMonthData?: {
      finalValue: number
      monthName: string
    }
  }
}

// Optimized sidebar component with improved performance
const SidebarOptimized = memo(function SidebarOptimized({
  user,
  profileImageUrl,
  handleImageError,
  openProfile,
  handleLogout,
  bonusesAvailable,
  lastMonthName,
  healthMetrics,
  upcomingActivities,
  kilometersData,
  bonusesData,
}: SidebarProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("perfil")
  const [expandedSections, setExpandedSections] = useState<string[]>(["resumen"])
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refs to avoid unnecessary re-renders
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const prevScrollY = useRef(0)
  const ticking = useRef(false)

  // Calculate percentages for categories with better error handling
  const bonusPercentage = useMemo(() => {
    if (!bonusesData || !bonusesData.summary) return 0
    return typeof bonusesData.summary.percentage === "number" ? bonusesData.summary.percentage : 0
  }, [bonusesData])

  const kmPercentage = useMemo(() => {
    if (!kilometersData || !kilometersData.summary) return 0
    return typeof kilometersData.summary.percentage === "number" ? kilometersData.summary.percentage : 0
  }, [kilometersData])

  // Get user category
  const { finalCategory } = useUserCategory(bonusPercentage, kmPercentage)

  // Handle data refresh
  const refreshData = useCallback(async () => {
    if (!user?.codigo || isRefreshing) return

    setIsRefreshing(true)

    try {
      // Clear cache by adding a timestamp to the URL
      const timestamp = new Date().getTime()

      // Fetch fresh data
      const [kmResponse, bonusResponse] = await Promise.all([
        fetch(`/api/user/kilometers?codigo=${user.codigo}&_t=${timestamp}`),
        fetch(`/api/user/bonuses?codigo=${user.codigo}&_t=${timestamp}`),
      ])

      if (kmResponse.ok && bonusResponse.ok) {
        // Clear sessionStorage cache
        sessionStorage.removeItem(`km-data-${user.codigo}`)
        sessionStorage.removeItem(`bonus-data-${user.codigo}`)
        sessionStorage.removeItem(`data-timestamp-${user.codigo}`)

        // Force reload the page to refresh all data
        window.location.reload()
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.codigo, isRefreshing])

  // SEO optimization with structured data - only execute once
  useEffect(() => {
    if (typeof document !== "undefined" && !document.querySelector("script[data-sidebar-schema]")) {
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.setAttribute("data-sidebar-schema", "true")
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Medical App Dashboard",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      })
      document.head.appendChild(script)

      return () => {
        const scriptToRemove = document.querySelector("script[data-sidebar-schema]")
        if (scriptToRemove) {
          document.head.removeChild(scriptToRemove)
        }
      }
    }
  }, [])

  // Handle responsive behavior - using ResizeObserver for better performance
  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024)
      }

      // Initial check
      checkMobile()

      // Use ResizeObserver instead of resize events
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver((entries) => {
          if (!ticking.current) {
            window.requestAnimationFrame(() => {
              checkMobile()
              ticking.current = false
            })
            ticking.current = true
          }
        })

        // Observe the body element to detect size changes
        resizeObserverRef.current.observe(document.body)
      }

      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect()
          resizeObserverRef.current = null
        }
      }
    }
  }, [])

  // Reset mobile menu when screen size changes
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false)
    }
  }, [isMobile, mobileOpen])

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }, [])

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  // Navigation items with descriptions for better UX
  const navItems = useMemo(
    () => [
      { id: "perfil", name: "Perfil", icon: User, description: "Información personal" },
      { id: "dashboard", name: "Dashboard", icon: Home, description: "Vista general" },
      { id: "configuracion", name: "Configuración", icon: Settings, description: "Ajustes del sistema" },
    ],
    [],
  )

  // Mobile toggle button with improved animation
  const MobileToggle = useCallback(
    () => (
      <motion.button
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg border border-green-100 transform-gpu"
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <AnimatePresence initial={false} mode="wait">
          {mobileOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
              className="transform-gpu"
            >
              <X className="h-6 w-6 text-green-600" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
              className="transform-gpu"
            >
              <Menu className="h-6 w-6 text-green-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    ),
    [mobileOpen],
  )

  // Sidebar container with responsive behavior
  const SidebarContainer = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <>
          <MobileToggle />

          {/* Desktop sidebar */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "hidden lg:block lg:col-span-3 xl:col-span-3 transition-all duration-300 transform-gpu",
              collapsed ? "lg:col-span-1 xl:col-span-1" : "",
            )}
          >
            {children}
          </motion.div>

          {/* Mobile sidebar overlay */}
          <AnimatePresence initial={false}>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>

          {/* Mobile sidebar */}
          <AnimatePresence initial={false}>
            {mobileOpen && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 left-0 h-full w-[280px] z-50 lg:hidden overflow-hidden bg-white shadow-2xl transform-gpu"
              >
                <div className="h-full flex flex-col">
                  {/* Fixed profile in mobile */}
                  <div className="sticky top-0 z-10 bg-white transform-gpu">
                    {/* Mobile profile content */}
                    <ProfileHeader
                      user={user}
                      profileImageUrl={profileImageUrl}
                      handleImageError={handleImageError}
                      openProfile={openProfile}
                      collapsed={collapsed}
                      category={finalCategory}
                      bonusPercentage={bonusPercentage}
                      kmPercentage={kmPercentage}
                    />
                  </div>

                  {/* Scrollable content in mobile */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
                    <div className="p-4">
                      {/* Rest of mobile content */}
                      <SidebarContent
                        navItems={navItems}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                        collapsed={collapsed}
                        expandedSections={expandedSections}
                        toggleSection={toggleSection}
                        kilometersData={kilometersData}
                        lastMonthName={lastMonthName}
                        bonusesAvailable={bonusesAvailable}
                        formatCurrency={formatCurrency}
                        bonusPercentage={bonusPercentage}
                        kmPercentage={kmPercentage}
                        openProfile={openProfile}
                        onLogoutClick={() => setShowLogoutConfirm(true)}
                        refreshData={refreshData}
                        isRefreshing={isRefreshing}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )
    },
    [
      MobileToggle,
      collapsed,
      mobileOpen,
      user,
      profileImageUrl,
      handleImageError,
      openProfile,
      navItems,
      activeSection,
      setActiveSection,
      expandedSections,
      toggleSection,
      kilometersData,
      lastMonthName,
      bonusesAvailable,
      formatCurrency,
      bonusPercentage,
      kmPercentage,
      finalCategory,
      refreshData,
      isRefreshing,
    ],
  )

  // If not mounted yet (SSR), return a minimal placeholder to avoid hydration issues
  if (!mounted) {
    return (
      <div className="hidden lg:block lg:col-span-3 xl:col-span-3">
        <div className="sticky top-8 p-4">
          <div className="bg-white/90 rounded-3xl shadow-xl h-[600px] animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Main sidebar content
  return (
    <SidebarContainer>
      <div ref={sidebarRef} className={cn("sticky top-8 transform-gpu", collapsed ? "px-2" : "")}>
        {/* Collapse toggle button (desktop only) */}

        {/* Main container with full height and scroll */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 mb-6 flex flex-col h-[calc(100vh-6rem)] will-change-transform transform-gpu">
          {/* Fixed profile at the top */}
          <div className="sticky top-0 z-10 will-change-transform transform-gpu">
            <ProfileHeader
              user={user}
              profileImageUrl={profileImageUrl}
              handleImageError={handleImageError}
              openProfile={openProfile}
              collapsed={collapsed}
              category={finalCategory}
              bonusPercentage={bonusPercentage}
              kmPercentage={kmPercentage}
            />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
            <div className={cn(collapsed ? "p-2" : "p-4")}>
              <SidebarContent
                navItems={navItems}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                collapsed={collapsed}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                kilometersData={kilometersData}
                lastMonthName={lastMonthName}
                bonusesAvailable={bonusesAvailable}
                formatCurrency={formatCurrency}
                bonusPercentage={bonusPercentage}
                kmPercentage={kmPercentage}
                openProfile={openProfile}
                onLogoutClick={() => setShowLogoutConfirm(true)}
                refreshData={refreshData}
                isRefreshing={isRefreshing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logout confirmation dialog */}
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          // More robust implementation for desktop
          try {
            // First try to use the provided handleLogout function
            if (typeof handleLogout === "function") {
              handleLogout()
            }

            // As a fallback, implement our own logout logic
            // to ensure it works on desktop
            if (typeof window !== "undefined") {
              // Clear cookies
              const cookies = document.cookie.split(";")
              for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i]
                const eqPos = cookie.indexOf("=")
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
              }

              // Clear storage
              localStorage.clear()
              sessionStorage.clear()

              // Redirect
              window.location.replace("/")
            }
          } catch (error) {
            console.error("Error logging out:", error)
            // If all else fails, try a last resort
            window.location.href = "/"
          }
        }}
      />
    </SidebarContainer>
  )
})

// Modified ProfileHeader component for a more creative design
const ProfileHeader = memo(function ProfileHeader({
  user,
  profileImageUrl,
  handleImageError,
  openProfile,
  collapsed,
  category,
  bonusPercentage,
  kmPercentage,
}: {
  user: { nombre: string; rol: string }
  profileImageUrl: string
  handleImageError: () => void
  openProfile: () => void
  collapsed: boolean
  category: CategoryLevel
  bonusPercentage: number
  kmPercentage: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const showCrown = category === "Oro"

  return (
    <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-500 relative overflow-hidden transform-gpu">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>

      {/* Animated background based on category */}
      <div className="absolute inset-0 opacity-30">
        <CategoryParticles category={category} size={collapsed ? "small" : "large"} />
      </div>

      {/* Profile content */}
      <div className={cn("relative z-10 transform-gpu", collapsed ? "p-3" : "p-6")}>
        <div className="flex items-center justify-center mb-4">
          <div
            className="relative group cursor-pointer"
            onClick={openProfile}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Crown for Gold category */}
            <GoldenCrown visible={showCrown} />

            {/* Halo effects */}
            <CategoryHalo category={category} size={collapsed ? "small" : "large"} />

            {/* Decorative animated border based on category */}
            <motion.div
              className={`absolute -inset-1 rounded-full opacity-70 z-10`}
              style={{
                background: `conic-gradient(
                  ${
                    category === "Oro"
                      ? "#fbbf24"
                      : category === "Plata"
                        ? "#d1d5db"
                        : category === "Bronce"
                          ? "#b45309"
                          : category === "Mejorar"
                            ? "#22c55e"
                            : "#f87171"
                  },
                  transparent 40%,
                  transparent 60%,
                  ${
                    category === "Oro"
                      ? "#fbbf24"
                      : category === "Plata"
                        ? "#d1d5db"
                        : category === "Bronce"
                          ? "#b45309"
                          : category === "Mejorar"
                            ? "#22c55e"
                            : "#f87171"
                  }
                )`,
              }}
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />

            {/* Main image container */}
            <div className="absolute inset-1 rounded-full overflow-hidden border-4 border-white shadow-2xl z-20 transform-gpu">
              <motion.div
                className="w-full h-full"
                animate={{
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <img
                  src={profileImageUrl || "/placeholder.svg?height=96&width=96&query=user"}
                  alt="User profile"
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="high"
                />
              </motion.div>
            </div>

            {/* Container for image and effects */}
            <div
              className={cn(
                "rounded-full relative z-0 flex items-center justify-center transform-gpu",
                collapsed ? "h-14 w-14" : "h-24 w-24",
              )}
            >
              {/* Space to maintain dimensions */}
            </div>

            {/* 3D category badge */}
            <motion.div
              className="absolute z-30 -bottom-2 -right-2"
              animate={{
                y: [0, -2, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                },
                rotate: {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                },
              }}
            >
              <CategoryBadge3D category={category} size={collapsed ? "small" : "medium"} showText={!collapsed} />
            </motion.div>

            {/* Interactive hover effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center z-50 transform-gpu"
            >
              <User className={cn("text-white", collapsed ? "h-6 w-6" : "h-8 w-8")} />
            </motion.div>
          </div>
        </div>

        {!collapsed && (
          <div className="text-center relative z-10 transform-gpu">
            <h2 className="text-xl font-bold text-white cursor-pointer group" onClick={openProfile}>
              {user?.nombre || "Usuario"}
              <div className="h-0.5 w-0 group-hover:w-full bg-white/60 transition-all duration-300 mx-auto"></div>
            </h2>
            <p className="text-white/90 text-sm mt-1">{user?.rol || "Operador"}</p>

            {/* Badges with 3D effect */}
            <div className="flex justify-center mt-3 gap-2">
              <motion.div
                className="bg-gradient-to-br from-green-400/30 to-green-500/30 py-1 px-3 rounded-full backdrop-blur-sm inline-flex items-center border border-green-400/30"
                whileHover={{ scale: 1.05 }}
                style={{
                  boxShadow: "0 3px 5px -1px rgba(0,0,0,0.1), 0 2px 3px -1px rgba(0,0,0,0.06)",
                }}
              >
                <Star className="w-3.5 h-3.5 mr-1 text-green-300" fill="#86efac" />
                <span className="text-xs text-white font-medium">Premium</span>
              </motion.div>

              {/* Category badge with glow effect */}
              <motion.div
                className={`py-1 px-3 rounded-full backdrop-blur-sm inline-flex items-center border transform-gpu
                  ${
                    category === "Oro"
                      ? "bg-gradient-to-br from-yellow-400/30 to-amber-500/30 border-yellow-300/40"
                      : category === "Plata"
                        ? "bg-gradient-to-br from-gray-300/30 to-gray-500/30 border-gray-300/40"
                        : category === "Bronce"
                          ? "bg-gradient-to-br from-amber-600/30 to-amber-800/30 border-amber-500/40"
                          : category === "Mejorar"
                            ? "bg-gradient-to-br from-green-400/30 to-green-600/30 border-green-300/40"
                            : "bg-gradient-to-br from-red-400/30 to-red-600/30 border-red-300/40"
                  }`}
                whileHover={{ scale: 1.05 }}
                animate={{
                  boxShadow: [
                    `0 0 5px 0 ${
                      category === "Oro"
                        ? "rgba(251, 191, 36, 0.5)"
                        : category === "Plata"
                          ? "rgba(209, 213, 219, 0.5)"
                          : category === "Bronce"
                            ? "rgba(180, 83, 9, 0.5)"
                            : category === "Mejorar"
                              ? "rgba(34, 197, 94, 0.5)"
                              : "rgba(248, 113, 113, 0.5)"
                    }`,
                    `0 0 10px 2px ${
                      category === "Oro"
                        ? "rgba(251, 191, 36, 0.3)"
                        : category === "Plata"
                          ? "rgba(209, 213, 219, 0.3)"
                          : category === "Bronce"
                            ? "rgba(180, 83, 9, 0.3)"
                            : category === "Mejorar"
                              ? "rgba(34, 197, 94, 0.3)"
                              : "rgba(248, 113, 113, 0.3)"
                    }`,
                    `0 0 5px 0 ${
                      category === "Oro"
                        ? "rgba(251, 191, 36, 0.5)"
                        : category === "Plata"
                          ? "rgba(209, 213, 219, 0.5)"
                          : category === "Bronce"
                            ? "rgba(180, 83, 9, 0.5)"
                            : category === "Mejorar"
                              ? "rgba(34, 197, 94, 0.5)"
                              : "rgba(248, 113, 113, 0.5)"
                    }`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <CategoryIcon category={category} />
                <span className="text-xs text-white font-medium ml-1">{category}</span>
              </motion.div>
            </div>

            {/* Enhanced info modal */}
            <div className="mt-3 relative group">
              <motion.button
                className="bg-white/20 py-1 px-2 rounded-lg backdrop-blur-sm inline-flex items-center shadow-lg border border-white/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                }}
              >
                <Info className="w-3.5 h-3.5 mr-1 text-white" />
                <span className="text-xs text-white font-medium">Detalles</span>
              </motion.button>

              <motion.div
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 w-64 border border-white/40">
                  <div className="font-bold mb-3 text-center bg-gradient-to-r from-green-600 to-emerald-500 text-white py-1.5 rounded-lg">
                    Métricas de Rendimiento
                  </div>

                  {/* Barra de rendimiento bono */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Bono</span>
                      <span className="font-medium">{bonusPercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          bonusPercentage >= 100
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                            : bonusPercentage >= 95
                              ? "bg-gradient-to-r from-gray-400 to-gray-500"
                              : bonusPercentage >= 90
                                ? "bg-gradient-to-r from-amber-600 to-amber-700"
                                : bonusPercentage >= 60
                                  ? "bg-gradient-to-r from-green-400 to-green-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${bonusPercentage}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    {/* Indicadores de nivel */}
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-0.5">
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0 px-0.5">
                      <span>60%</span>
                      <span>90%</span>
                      <span>95%</span>
                      <span>100%</span>
                      <span></span>
                    </div>
                  </div>

                  {/* Barra de rendimiento km */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Kilómetros</span>
                      <span className="font-medium">{kmPercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          kmPercentage >= 94
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                            : kmPercentage >= 90
                              ? "bg-gradient-to-r from-gray-400 to-gray-500"
                              : kmPercentage >= 85
                                ? "bg-gradient-to-r from-amber-600 to-amber-700"
                                : kmPercentage >= 70
                                  ? "bg-gradient-to-r from-green-400 to-green-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${kmPercentage}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    {/* Indicadores de nivel */}
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-0.5">
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0 px-0.5">
                      <span>70%</span>
                      <span>85%</span>
                      <span>90%</span>
                      <span>94%</span>
                      <span></span>
                    </div>
                  </div>

                  {/* Categoría final con estilo */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-gray-700">Categoría Final:</span>
                      <span
                        className={`
                          ${
                            category === "Oro"
                              ? "text-yellow-500"
                              : category === "Plata"
                                ? "text-gray-500"
                                : category === "Bronce"
                                  ? "text-amber-700"
                                  : category === "Mejorar"
                                    ? "text-green-500"
                                    : "text-red-500"
                          }`}
                      >
                        <CategoryBadge3D category={category} showText={true} />
                      </span>
                    </div>
                  </div>
                </div>
                {/* Flecha del tooltip */}
                <motion.div
                  className="w-4 h-4 bg-white/90 rotate-45 absolute left-1/2 -bottom-2 -translate-x-1/2 border-r border-b border-white/40"
                  animate={{
                    y: [0, 2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// Component for scrollable sidebar content
const SidebarContent = memo(function SidebarContent({
  navItems,
  activeSection,
  setActiveSection,
  collapsed,
  expandedSections,
  toggleSection,
  kilometersData,
  lastMonthName,
  bonusesAvailable,
  formatCurrency,
  openProfile,
  onLogoutClick,
  bonusPercentage,
  kmPercentage,
  refreshData,
  isRefreshing,
}: {
  navItems: any[]
  activeSection: string
  setActiveSection: (section: string) => void
  collapsed: boolean
  expandedSections: string[]
  toggleSection: (section: string) => void
  kilometersData?: any
  lastMonthName: string
  bonusesAvailable: number
  formatCurrency: (amount: number) => string
  openProfile: () => void
  onLogoutClick: () => void
  bonusPercentage: number
  kmPercentage: number
  refreshData: () => void
  isRefreshing: boolean
}) {
  // Añadir después de la declaración de SidebarContent
  console.log("SidebarContent rendering with data:", {
    kilometersData,
    bonusesAvailable,
    bonusPercentage,
    kmPercentage,
  })

  // Use IntersectionObserver to load components only when visible
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    navigation: true,
    resumen: false,
    contacto: false,
  })

  const sectionRefs = {
    navigation: useRef<HTMLDivElement>(null),
    resumen: useRef<HTMLDivElement>(null),
    contacto: useRef<HTMLDivElement>(null),
  }

  // Set up IntersectionObserver to detect visible sections
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }

    const observers: IntersectionObserver[] = []

    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleSections((prev) => ({ ...prev, [key]: true }))
            }
          })
        }, observerOptions)

        observer.observe(ref.current)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  // Get user category
  const { finalCategory } = useUserCategory(bonusPercentage, kmPercentage)

  // Extraer kilometros de manera más segura
  const kmValue = useMemo(() => {
    if (kilometersData?.data && kilometersData.data.length > 0) {
      return kilometersData.data[0].valor_ejecucion
    }
    return kilometersData?.summary?.totalExecuted || 0
  }, [kilometersData])

  // Extract kilometer data safely
  // const kmValue = useMemo(() => {
  //   // First try to get the most recent month's data
  //   if (kilometersData?.data?.[0]?.valor_ejecucion !== undefined) {
  //     return kilometersData.data[0].valor_ejecucion
  //   }

  //   // If that's not available, try the summary total
  //   if (kilometersData?.summary?.totalExecuted !== undefined) {
  //     return kilometersData.summary.totalExecuted
  //   }

  //   // Default fallback
  //   return 0
  // }, [kilometersData])

  // Añadir para mostrar valores reales
  useEffect(() => {
    console.log("Valores actuales:", {
      kmValue: kilometersData?.data?.[0]?.valor_ejecucion,
      kmSummary: kilometersData?.summary?.totalExecuted,
      bonusValue: bonusesAvailable,
      bonusPercentage,
      kmPercentage,
    })
  }, [kilometersData, bonusesAvailable, bonusPercentage, kmPercentage])

  return (
    <>
      {/* Sidebar navigation */}
      <nav ref={sectionRefs.navigation} className="space-y-1 transform-gpu" aria-label="Main navigation">
        {navItems.map((item) => (
          <motion.div
            key={item.id}
            className="relative group transform-gpu"
            initial={false}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-150 transform-gpu",
                activeSection === item.id
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-green-50",
                collapsed ? "justify-center px-2" : "w-full",
              )}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  activeSection === item.id ? "text-white" : "text-green-500",
                  collapsed ? "mr-0" : "mr-3",
                )}
                aria-hidden="true"
              />
              {!collapsed && (
                <>
                  <span>{item.name}</span>
                  {activeSection === item.id && (
                    <div className="ml-auto bg-white/20 rounded-full h-5 w-5 flex items-center justify-center">
                      <ChevronRight className="h-3 w-3 text-white" />
                    </div>
                  )}
                </>
              )}
            </button>

            {/* Tooltip description on hover */}
            {!collapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                  {item.description}
                </div>
              </div>
            )}

            {/* Tooltip for collapsed mode */}
            {collapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                  {item.name} - {item.description}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </nav>

      {/* Quick stats */}
      {!collapsed && (
        <div ref={sectionRefs.resumen} className="mt-6 pt-6 border-t border-green-100 transform-gpu">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center cursor-pointer flex-1" onClick={() => toggleSection("resumen")}>
              <h3 className="text-sm font-medium text-gray-600 flex items-center">
                <div className="h-1 w-4 bg-green-500 rounded-full mr-2"></div>
                Resumen
              </h3>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200 ml-2",
                  expandedSections.includes("resumen") ? "transform rotate-180" : "",
                )}
                aria-hidden="true"
              />
            </div>

            {/* Refresh button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshData}
              disabled={isRefreshing}
              className={cn(
                "p-1 rounded-md text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors",
                isRefreshing && "animate-spin text-green-600",
              )}
              title="Actualizar datos"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {expandedSections.includes("resumen") && visibleSections.resumen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden transform-gpu"
              >
                <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 p-3 rounded-xl transition-colors duration-150 hover:from-green-50/90 hover:to-emerald-50/90 transform-gpu shadow-sm border border-green-100/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-1.5 rounded-lg mr-2">
                        <Route className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600">Km {lastMonthName}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {kilometersData?.data && kilometersData.data.length > 0
                        ? kilometersData.data[0].valor_ejecucion.toLocaleString()
                        : kilometersData?.summary?.totalExecuted?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-green-200/50 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${kmPercentage}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-inner"
                    />
                  </div>
                  <div className="mt-1 text-xs text-right text-gray-500 font-medium">{kmPercentage}%</div>
                </div>

                <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 p-3 rounded-xl transition-colors duration-150 hover:from-green-50/90 hover:to-emerald-50/90 transform-gpu shadow-sm border border-green-100/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-1.5 rounded-lg mr-2">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600">Nivel</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                      <span className="text-sm font-bold text-gray-800">
                        <CategoryBadge3D category={finalCategory} size="small" />
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span>
                      Bono: {bonusPercentage}% | KM: {kmPercentage}%
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 p-3 rounded-xl transition-colors duration-150 hover:from-green-50/90 hover:to-emerald-50/90 transform-gpu shadow-sm border border-green-100/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-1.5 rounded-lg mr-2">
                        <Gift className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600">Bono {lastMonthName}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(bonusesAvailable || 0)}</span>
                  </div>
                  <div className="mt-2 w-full bg-green-200/50 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${bonusPercentage}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-inner"
                    />
                  </div>
                  <div className="mt-1 text-xs text-right text-gray-500 font-medium">{bonusPercentage}%</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Contact buttons */}
      {!collapsed && (
        <div ref={sectionRefs.contacto} className="mt-6 flex justify-between transform-gpu">
          <ContactCard icon={Phone} tooltip="Llamar" />
          <ContactCard icon={MessageSquare} tooltip="Mensaje" />
          <ContactCard icon={Mail} tooltip="Correo" />
          <ContactCard icon={User} tooltip="Perfil" onClick={openProfile} />
        </div>
      )}

      {/* Logout button */}
      <motion.button
        initial={false}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogoutClick}
        className={cn(
          "mt-6 py-2.5 flex items-center justify-center gap-2 text-red-600 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl font-medium transition-colors duration-150 transform-gpu shadow-sm border border-red-100",
          collapsed ? "p-2" : "w-full",
        )}
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span>Cerrar Sesión</span>}
      </motion.button>
    </>
  )
})

// Memoized ContactCard component
const ContactCard = memo(function ContactCard({
  icon: Icon,
  tooltip,
  onClick,
}: { icon: any; tooltip: string; onClick?: () => void }) {
  return (
    <div className="relative group transform-gpu">
      <motion.button
        onClick={onClick}
        className="bg-gradient-to-br from-green-50 to-emerald-50 p-2.5 rounded-xl shadow-sm border border-green-100 text-green-600 hover:from-green-100 hover:to-emerald-100 transition-colors duration-150 transform-gpu"
        whileHover={{ y: -2, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={tooltip}
      >
        <Icon className="h-5 w-5" />
      </motion.button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded-lg shadow-md whitespace-nowrap">{tooltip}</div>
      </div>
    </div>
  )
})

export default SidebarOptimized
