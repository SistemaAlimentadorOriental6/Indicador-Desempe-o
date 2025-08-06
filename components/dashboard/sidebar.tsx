"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Route,
  Gift,
  LogOut,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Menu,
  X,
  Home,
  Settings,
  TrendingUp,
  User,
  RefreshCw,
  ChevronDown,
  Calendar,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import LogoutConfirmation from "../logout-confirmation"
import { useRouter } from "next/navigation"
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query"

// Añadir declaración de tipo para window.__SIDEBAR_LOAD_TIME
declare global {
  interface Window {
    __SIDEBAR_LOAD_TIME?: number
  }
}

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
    id: number
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
    lastMonthData?: {
      year: number
      month: number
      monthName: string
      valor_programacion: number
      valor_ejecucion: number
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
      year: number
      month: number
      monthName: string
      finalValue: number
      bonusValue: number
      deductionAmount: number
    }
    baseBonus?: number
    finalBonus?: number
    percentage?: number
  }
}

// Modificar la configuración del QueryClient para evitar recargas automáticas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number.POSITIVE_INFINITY, // Evita que los datos se marquen como obsoletos
      cacheTime: 24 * 60 * 60 * 1000, // 24 horas de caché
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Desactivar refetch al reconectar
      retry: 1,
    },
  },
})

// Implementación personalizada de persistencia de caché
if (typeof window !== "undefined") {
  // Función para guardar el estado de la caché en localStorage
  const saveQueryCache = () => {
    try {
      const queryCache = queryClient.getQueryCache().getAll()
      const cachesToSave = queryCache
        .filter((query) => {
          const queryKey = JSON.stringify(query.queryKey)
          return queryKey.includes("kilometers") || queryKey.includes("bonuses")
        })
        .map((query) => ({
          queryKey: query.queryKey,
          state: query.state,
        }))

      if (cachesToSave.length > 0) {
        localStorage.setItem(
          "sidebar-cache-v1",
          JSON.stringify({
            timestamp: Date.now(),
            queries: cachesToSave,
          }),
        )
      }
    } catch (error) {
      console.error("Error saving query cache:", error)
    }
  }

  // Cargar caché guardada al iniciar
  try {
    const savedCache = localStorage.getItem("sidebar-cache-v1")
    if (savedCache) {
      const parsed = JSON.parse(savedCache)

      // Verificar si los datos han expirado (24 horas)
      const hasExpired = parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000

      if (!hasExpired && parsed.queries) {
        // Restaurar consultas guardadas
        parsed.queries.forEach((item) => {
          if (item.state.data) {
            queryClient.setQueryData(item.queryKey, item.state.data)
          }
        })
      }
    }
  } catch (error) {
    console.error("Error loading query cache:", error)
    // Si hay error al cargar, limpiar la caché para evitar problemas futuros
    localStorage.removeItem("sidebar-cache-v1")
  }

  // Suscribirse a cambios en la caché para guardarlos
  // Usar un debounce para no guardar demasiado frecuentemente
  let saveTimeout = null
  queryClient.getQueryCache().subscribe(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveQueryCache, 2000) // Guardar después de 2 segundos de inactividad
  })
}

// Modificar las funciones de API para implementar prefetching y optimistic updates
const api = {
  fetchKilometers: async (userCode: string) => {
    if (!userCode) return null

    // Intentar obtener datos de localStorage primero para carga instantánea
    if (typeof window !== "undefined") {
      try {
        const cachedData = localStorage.getItem(`km-data-${userCode}`)
        if (cachedData) {
          // Devolver datos en caché inmediatamente mientras se actualiza en segundo plano
          setTimeout(() => {
            // Actualizar en segundo plano sin bloquear la UI
            fetch(`/api/user/kilometers?codigo=${userCode}&_t=${Date.now()}`)
              .then((response) => response.json())
              .then((freshData) => {
                localStorage.setItem(`km-data-${userCode}`, JSON.stringify(freshData))
                queryClient.setQueryData(["kilometers", userCode], freshData)
              })
              .catch(console.error)
          }, 100)

          return JSON.parse(cachedData)
        }
      } catch (e) {
        console.error("Error reading from cache:", e)
      }
    }

    const url = `/api/user/kilometers?codigo=${userCode}&_t=${Date.now()}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Guardar en localStorage para acceso instantáneo en futuras visitas
      if (typeof window !== "undefined") {
        localStorage.setItem(`km-data-${userCode}`, JSON.stringify(data))
      }

      return data
    } catch (error) {
      console.error("Error fetching kilometers data:", error)
      throw error
    }
  },

  fetchBonuses: async (userCode: string) => {
    if (!userCode) return null

    // Intentar obtener datos de localStorage primero para carga instantánea
    if (typeof window !== "undefined") {
      try {
        const cachedData = localStorage.getItem(`bonus-data-${userCode}`)
        if (cachedData) {
          // Devolver datos en caché inmediatamente mientras se actualiza en segundo plano
          setTimeout(() => {
            // Actualizar en segundo plano sin bloquear la UI
            fetch(`/api/user/bonuses?codigo=${userCode}&_t=${Date.now()}`)
              .then((response) => response.json())
              .then((freshData) => {
                localStorage.setItem(`bonus-data-${userCode}`, JSON.stringify(freshData))
                queryClient.setQueryData(["bonuses", userCode], freshData)
              })
              .catch(console.error)
          }, 200) // Ligero retraso para no competir con la primera solicitud

          return JSON.parse(cachedData)
        }
      } catch (e) {
        console.error("Error reading from cache:", e)
      }
    }

    const url = `/api/user/bonuses?codigo=${userCode}&_t=${Date.now()}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Guardar en localStorage para acceso instantáneo en futuras visitas
      if (typeof window !== "undefined") {
        localStorage.setItem(`bonus-data-${userCode}`, JSON.stringify(data))
      }

      return data
    } catch (error) {
      console.error("Error fetching bonuses data:", error)
      throw error
    }
  },

  // Método para prefetch de datos
  prefetchAll: async (userCode: string) => {
    if (!userCode) return

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["kilometers", userCode],
        queryFn: () => api.fetchKilometers(userCode),
      }),
      queryClient.prefetchQuery({
        queryKey: ["bonuses", userCode],
        queryFn: () => api.fetchBonuses(userCode),
      }),
    ])
  },
}

function isMobileInit(): boolean {
  if (typeof window !== "undefined") {
    return window.innerWidth < 1024
  }
  return false
}

// Modificar el componente SidebarOptimizedWithProvider para implementar prefetching y optimizaciones

// Wrapper component with QueryClientProvider
const SidebarOptimizedWithProvider = (props: SidebarProps) => {
  // Prefetch data on component mount
  useEffect(() => {
    if (props.user?.codigo) {
      api.prefetchAll(props.user.codigo)
    }
  }, [props.user?.codigo])

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarOptimized {...props} />
    </QueryClientProvider>
  )
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
  kilometersData: initialKilometersData,
  bonusesData: initialBonusesData,
}: SidebarProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("perfil")
  const [expandedSections, setExpandedSections] = useState<string[]>(["resumen"])
  const [isMobile, setIsMobile] = useState(isMobileInit())
  const [mounted, setMounted] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const queryClient = useQueryClient()

  // Refs to avoid unnecessary re-renders
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const prevScrollY = useRef(0)
  const ticking = useRef(false)

  // Fetch kilometers data with React Query - optimizado con placeholderData
  const {
    data: kilometersData,
    isLoading: isLoadingKilometers,
    error: kilometersError,
    refetch: refetchKilometers,
    isFetching: isFetchingKilometers,
    dataUpdatedAt: kilometersUpdatedAt,
  } = useQuery({
    queryKey: ["kilometers", user?.codigo],
    queryFn: () => api.fetchKilometers(user?.codigo || ""),
    enabled: !!user?.codigo,
    placeholderData: initialKilometersData, // Usar datos iniciales como placeholder
    initialData: () => {
      // Intentar obtener datos de localStorage para carga instantánea
      if (typeof window !== "undefined" && user?.codigo) {
        try {
          const cachedData = localStorage.getItem(`km-data-${user.codigo}`)
          if (cachedData) {
            return JSON.parse(cachedData)
          }
        } catch (e) {
          console.error("Error reading from cache:", e)
        }
      }
      return initialKilometersData
    },
  })

  // Fetch bonuses data with React Query - optimizado con placeholderData
  const {
    data: bonusesData,
    isLoading: isLoadingBonuses,
    error: bonusesError,
    refetch: refetchBonuses,
    isFetching: isFetchingBonuses,
    dataUpdatedAt: bonusesUpdatedAt,
  } = useQuery({
    queryKey: ["bonuses", user?.codigo],
    queryFn: () => api.fetchBonuses(user?.codigo || ""),
    enabled: !!user?.codigo,
    placeholderData: initialBonusesData, // Usar datos iniciales como placeholder
    initialData: () => {
      // Intentar obtener datos de localStorage para carga instantánea
      if (typeof window !== "undefined" && user?.codigo) {
        try {
          const cachedData = localStorage.getItem(`bonus-data-${user.codigo}`)
          if (cachedData) {
            return JSON.parse(cachedData)
          }
        } catch (e) {
          console.error("Error reading from cache:", e)
        }
      }
      return initialBonusesData
    },
  })

  // Optimización: Precalcular valores derivados con useMemo para evitar cálculos repetidos
  const { bonusPercentage, kmPercentage } = useMemo(() => {
    // Calcular bonusPercentage
    let bonusPerc = 0
    // Determinar el año actual o el año de los datos si está disponible
    const currentYear = bonusesData?.lastMonthData?.year || new Date().getFullYear()
    // Determinar el valor base del bono según el año
    const baseBonus = currentYear >= 2025 ? 142000 : 130000

    // Si tenemos el valor final del bono, calcular el porcentaje
    if (bonusesData?.lastMonthData?.finalValue !== undefined) {
      const finalValue = bonusesData.lastMonthData.finalValue
      bonusPerc = Math.round((finalValue / baseBonus) * 100)
    } else if (bonusesData?.finalBonus !== undefined) {
      bonusPerc = Math.round((bonusesData.finalBonus / baseBonus) * 100)
    } else if (bonusesData?.summary?.percentage !== undefined) {
      bonusPerc = bonusesData.summary.percentage
    } else if (bonusesData?.summary?.totalProgrammed && bonusesData?.summary?.totalExecuted) {
      const programmed = Number(bonusesData.summary.totalProgrammed)
      const executed = Number(bonusesData.summary.totalExecuted)
      bonusPerc = programmed > 0 ? Math.round((executed / programmed) * 100) : 0
    } else if (bonusesData?.percentage !== undefined) {
      bonusPerc = typeof bonusesData.percentage === "number" ? bonusesData.percentage : 0
    }

    // Calcular kmPercentage
    let kmPerc = 0
    if (kilometersData?.lastMonthData?.percentage !== undefined) {
      kmPerc = kilometersData.lastMonthData.percentage
    } else if (kilometersData?.summary?.percentage !== undefined) {
      kmPerc = kilometersData.summary.percentage
    } else if (kilometersData?.summary?.totalProgrammed && kilometersData.summary.totalExecuted) {
      const programmed = Number(kilometersData.summary.totalProgrammed)
      const executed = Number(kilometersData.summary.totalExecuted)
      kmPerc = programmed > 0 ? Math.round((executed / programmed) * 100) : 0
    }

    return { bonusPercentage: bonusPerc, kmPercentage: kmPerc }
  }, [bonusesData, kilometersData])

  // Modificar la función refreshData para evitar ciclos de actualización
  const refreshData = useCallback(async () => {
    if (!user?.codigo || isFetchingKilometers || isFetchingBonuses || !navigator.onLine) return

    try {
      // Obtener timestamp de la última actualización
      const lastRefreshStr = localStorage.getItem(`last-refresh-${user.codigo}`)
      const lastRefresh = lastRefreshStr ? Number.parseInt(lastRefreshStr, 10) : 0

      // Evitar actualizaciones demasiado frecuentes (mínimo 5 minutos entre actualizaciones)
      if (lastRefresh && Date.now() - lastRefresh < 5 * 60 * 1000) {
        console.log("Skipping refresh - too soon since last refresh")
        return
      }

      // Use React Query's refetch to get fresh data
      await Promise.all([refetchKilometers({ cancelRefetch: false }), refetchBonuses({ cancelRefetch: false })])

      // Actualizar timestamp en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`last-refresh-${user.codigo}`, Date.now().toString())
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      // No mostrar alerta para mejorar UX, manejar error silenciosamente
      console.warn(`Error al actualizar datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }, [user?.codigo, refetchKilometers, refetchBonuses, isFetchingKilometers, isFetchingBonuses])

  // Optimización: Cargar datos en segundo plano al montar el componente
  useEffect(() => {
    if (user?.codigo && mounted) {
      // Verificar si ya tenemos datos en caché antes de intentar actualizar
      const hasKilometersData = queryClient.getQueryData(["kilometers", user.codigo])
      const hasBonusesData = queryClient.getQueryData(["bonuses", user.codigo])

      // Solo actualizar si no tenemos datos o si han pasado más de 30 minutos desde la última actualización
      const lastRefreshStr = localStorage.getItem(`last-refresh-${user.codigo}`)
      const lastRefresh = lastRefreshStr ? Number.parseInt(lastRefreshStr, 10) : 0
      const shouldRefresh = !lastRefresh || Date.now() - lastRefresh > 30 * 60 * 1000

      if ((!hasKilometersData || !hasBonusesData || shouldRefresh) && navigator.onLine) {
        // Pequeño retraso para priorizar la renderización inicial
        const timer = setTimeout(() => {
          refreshData()
        }, 2000) // Aumentar a 2 segundos para dar más tiempo a la renderización inicial

        return () => clearTimeout(timer)
      }
    }
  }, [user?.codigo, mounted, refreshData, queryClient])

  // Añadir un mecanismo para detectar y prevenir recargas automáticas
  useEffect(() => {
    if (typeof window !== "undefined" && mounted) {
      // Guardar el tiempo de carga inicial
      if (!window.__SIDEBAR_LOAD_TIME) {
        window.__SIDEBAR_LOAD_TIME = Date.now()

        // Guardar en sessionStorage para persistir entre recargas
        sessionStorage.setItem("__SIDEBAR_LOAD_TIME", window.__SIDEBAR_LOAD_TIME.toString())
      }

      // Verificar si ha habido una recarga reciente
      const lastLoadTimeStr = sessionStorage.getItem("__SIDEBAR_LOAD_TIME")
      const currentTime = Date.now()
      const lastLoadTime = lastLoadTimeStr ? Number.parseInt(lastLoadTimeStr, 10) : currentTime

      // Si la página se ha recargado en menos de 10 segundos, podría ser un ciclo de recargas
      if (currentTime - lastLoadTime < 10000 && lastLoadTime !== currentTime) {
        console.warn("Detected potential reload cycle. Stabilizing...")

        // Limpiar caché problemática que podría estar causando recargas
        queryClient.clear()

        // Actualizar el tiempo de carga para evitar falsos positivos
        window.__SIDEBAR_LOAD_TIME = currentTime
        sessionStorage.setItem("__SIDEBAR_LOAD_TIME", currentTime.toString())
      }

      // Prevenir recargas automáticas causadas por errores no capturados
      const originalOnError = window.onerror
      window.onerror = (message, source, lineno, colno, error) => {
        console.error("Uncaught error:", { message, source, lineno, colno, error })

        // Evitar que el error cause una recarga
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error)
        }
        return true // Prevenir comportamiento por defecto
      }

      return () => {
        window.onerror = originalOnError
      }
    }
  }, [mounted, queryClient])

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
                        isRefreshing={isFetchingKilometers || isFetchingBonuses}
                        bonusesData={bonusesData}
                        user={user}
                        lastRefreshTime={Math.max(kilometersUpdatedAt, bonusesUpdatedAt)}
                        upcomingActivities={upcomingActivities}
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
      refreshData,
      isFetchingKilometers,
      isFetchingBonuses,
      bonusesData,
      kilometersUpdatedAt,
      bonusesUpdatedAt,
      upcomingActivities,
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-12 z-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-green-100 text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", collapsed ? "rotate-180" : "")}
            aria-hidden="true"
          />
        </button>

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
                isRefreshing={isFetchingKilometers || isFetchingBonuses}
                bonusesData={bonusesData}
                user={user}
                lastRefreshTime={Math.max(kilometersUpdatedAt, bonusesUpdatedAt)}
                upcomingActivities={upcomingActivities}
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

// Modified ProfileHeader component with category elements removed
const ProfileHeader = memo(function ProfileHeader({
  user,
  profileImageUrl,
  handleImageError,
  openProfile,
  collapsed,
  bonusPercentage,
  kmPercentage,
}: {
  user: { nombre: string; rol: string }
  profileImageUrl: string
  handleImageError: () => void
  openProfile: () => void
  collapsed: boolean
  bonusPercentage: number
  kmPercentage: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  // Optimización: Evitar re-renderizados innecesarios
  const memoizedGradientStyle = useMemo(
    () => ({
      background: `conic-gradient(
      from 180deg at 50% 50%,
      #10b981 0deg,
      #34d399 72deg,
      #6ee7b7 144deg,
      #a7f3d0 216deg,
      #10b981 288deg,
      #10b981 360deg
    )`,
    }),
    [],
  )

  const memoizedInnerGradientStyle = useMemo(
    () => ({
      background: `conic-gradient(
      from 0deg at 50% 50%,
      #059669 0deg,
      #10b981 72deg,
      #34d399 144deg,
      #6ee7b7 216deg,
      #059669 288deg,
      #059669 360deg
    )`,
    }),
    [],
  )

  const memoizedPulseStyle = useMemo(
    () => ({
      background: "radial-gradient(circle, rgba(16,185,129,0.7) 0%, rgba(16,185,129,0) 70%)",
    }),
    [],
  )

  // Optimización: Cargar imagen con prioridad alta y dimensiones correctas
  const imageUrl = useMemo(() => {
    return profileImageUrl || `/placeholder.svg?height=${collapsed ? 56 : 96}&width=${collapsed ? 56 : 96}&query=user`
  }, [profileImageUrl, collapsed])

  return (
    <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-500 relative overflow-hidden transform-gpu">
      {/* Enhanced background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="url(#smallGrid)" />
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Animated light beam */}
      <motion.div
        className="absolute -inset-full h-[500%] w-[100px] bg-white/20 blur-2xl transform -rotate-45 z-0"
        animate={{
          left: ["-100%", "200%"],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 15,
          ease: "easeInOut",
        }}
      />

      {/* Profile content */}
      <div className={cn("relative z-10 transform-gpu", collapsed ? "p-3" : "p-6")}>
        <div className="flex items-center justify-center mb-4">
          <div
            className="relative group cursor-pointer"
            onClick={openProfile}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Decorative rings */}
            <motion.div
              className="absolute -inset-3 rounded-full opacity-70 z-0"
              style={memoizedGradientStyle}
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />

            <motion.div
              className="absolute -inset-1.5 rounded-full opacity-80 z-0"
              style={memoizedInnerGradientStyle}
              animate={{ rotate: [360, 0] }}
              transition={{
                duration: 15,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />

            {/* Pulse effect */}
            <motion.div
              className="absolute -inset-6 rounded-full z-0 opacity-0"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0, 0.1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
              style={memoizedPulseStyle}
            />

            {/* Main image container with enhanced styling */}
            <div
              className={cn(
                "rounded-full relative z-10 flex items-center justify-center transform-gpu",
                collapsed ? "h-14 w-14" : "h-24 w-24",
              )}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300 to-green-600 p-0.5">
                <div className="absolute inset-0 rounded-full overflow-hidden backdrop-blur-sm">
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
                      src={imageUrl || "/placeholder.svg"}
                      alt="User profile"
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      width={collapsed ? 56 : 96}
                      height={collapsed ? 56 : 96}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 z-20"
                animate={{
                  opacity: [0, 0.3, 0],
                  left: ["-100%", "100%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 5,
                }}
              />
            </div>

            {/* Interactive hover effect with improved animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.7 : 0 }}
              whileHover={{ opacity: 0.7 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-green-900/80 to-emerald-800/80 flex items-center justify-center z-30 transform-gpu"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: isHovered ? 1 : 0.8,
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <User className={cn("text-white", collapsed ? "h-6 w-6" : "h-8 w-8")} />
              </motion.div>
            </motion.div>

            {/* Subtle border glow on hover */}
            <motion.div
              className="absolute -inset-1 rounded-full z-5 opacity-0"
              animate={{
                opacity: isHovered ? 0.6 : 0,
                boxShadow: isHovered ? "0 0 15px 5px rgba(16,185,129,0.5)" : "0 0 0 0 rgba(16,185,129,0)",
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {!collapsed && (
          <div className="text-center relative z-10 transform-gpu">
            <h2 className="text-xl font-bold text-white cursor-pointer group" onClick={openProfile}>
              {user?.nombre || "Usuario"}
              <div className="h-0.5 w-0 group-hover:w-full bg-white/60 transition-all duration-300 mx-auto"></div>
            </h2>
            <p className="text-white/90 text-sm mt-1">{user?.rol || "Operador"}</p>
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
  bonusesData,
  user,
  lastRefreshTime,
  upcomingActivities,
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
  bonusesData?: any
  user?: { nombre: string; rol: string; codigo?: string }
  lastRefreshTime: number
  upcomingActivities?: {
    id: string
    month: string
    day: string
    title: string
    location: string
    time: string
  }[]
}) {


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
          entries.forEach((entry: IntersectionObserverEntry) => {
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

  // Function to determine bonus level based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "Excelente"
    if (percentage >= 90) return "Muy Bueno"
    if (percentage >= 80) return "Bueno"
    if (percentage >= 70) return "Regular"
    return "Necesita Mejorar"
  }

  // Improved kmValue calculation with better data source prioritization
  const kmValue = useMemo(() => {
    // First check if we have data from lastMonthData
    if (kilometersData?.lastMonthData?.valor_ejecucion) {
      return kilometersData.lastMonthData.valor_ejecucion
    }

    // Then check if we have data array
    if (kilometersData?.data && Array.isArray(kilometersData.data) && kilometersData.data.length > 0) {
      // Find the first non-zero value in the data array (most recent first)
      const nonZeroEntry = kilometersData.data.find(
        (entry) => entry && typeof entry.valor_ejecucion === "number" && entry.valor_ejecucion > 0,
      )

      if (nonZeroEntry) {
        return nonZeroEntry.valor_ejecucion
      }
    }

    // If no non-zero value in data array, try the summary
    if (kilometersData?.summary?.totalExecuted && kilometersData.summary.totalExecuted > 0) {
      return kilometersData.summary.totalExecuted
    }

    // Default fallback
    return 0
  }, [kilometersData])

  const bonusValue = useMemo(() => {
    // Determinar el año actual o el año de los datos si está disponible
    const currentYear = bonusesData?.lastMonthData?.year || new Date().getFullYear()

    // Determinar el valor base del bono según el año
    const baseBonus = currentYear >= 2025 ? 142000 : 130000

    // First check if we have lastMonthData with a non-zero value
    if (bonusesData?.lastMonthData?.finalValue && bonusesData.lastMonthData.finalValue > 0) {
      return bonusesData.lastMonthData.finalValue
    }

    // Check if we have the format from the JSON response
    if (bonusesData?.finalBonus && bonusesData.finalBonus > 0) {
      return bonusesData.finalBonus
    }

    // Otherwise try the summary data
    if (bonusesData?.summary?.totalExecuted && bonusesData.summary.totalExecuted > 0) {
      return bonusesData.summary.totalExecuted
    }

    // Use the provided bonusesAvailable if it's non-zero
    if (bonusesAvailable > 0) {
      return bonusesAvailable
    }

    // Si no hay datos, usar el valor base según el año
    return baseBonus
  }, [bonusesData, bonusesAvailable])

  // Format the last refresh time
  const formattedLastRefreshTime = useMemo(() => {
    if (!lastRefreshTime) return "Nunca"

    const now = new Date()
    const refreshDate = new Date(lastRefreshTime)
    const diffMs = now.getTime() - refreshDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Hace unos segundos"
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins === 1 ? "" : "s"}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours === 1 ? "" : "s"}`
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? "" : "s"}`

    return refreshDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [lastRefreshTime])

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
        <div ref={sectionRefs.resumen} className="mt-6 pt-5 border-t border-green-100 transform-gpu">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center cursor-pointer flex-1 group" onClick={() => toggleSection("resumen")}>
              <div className="h-1.5 w-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full mr-2 group-hover:w-6 transition-all duration-300"></div>
              <div className="text-sm font-medium text-gray-700">{kilometersData?.lastMonthData?.monthName || "Kilómetros del Mes"}</div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-300 ml-2 group-hover:text-green-500",
                  expandedSections.includes("resumen") ? "transform rotate-180" : "",
                )}
                aria-hidden="true"
              />
            </div>

            {/* Refresh button with enhanced animation */}
            <div className="relative group z-10">
              <motion.button
                whileHover={{ scale: 1.1, rotate: isRefreshing ? 360 : 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={isRefreshing}
                className={cn(
                  "p-1.5 rounded-full text-gray-500 hover:text-white transition-all duration-300",
                  "shadow-sm border border-green-100 hover:border-green-400 bg-white hover:bg-gradient-to-r from-green-500 to-emerald-400",
                  isRefreshing && "animate-spin text-green-600",
                )}
                title="Actualizar datos"
              >
                <RefreshCw className="h-4 w-4" />
              </motion.button>

              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <div className="bg-gray-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap">
                  {isRefreshing ? (
                    <span className="flex items-center">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                      Actualizando datos...
                    </span>
                  ) : (
                    <>
                      Actualizar datos
                      <div className="text-gray-300 text-[10px] mt-1 flex items-center">
                        <span className="h-1 w-1 rounded-full bg-green-400 mr-1.5"></span>
                        Última actualización: {formattedLastRefreshTime}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expandedSections.includes("resumen") && visibleSections.resumen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4 overflow-hidden transform-gpu"
              >
                {/* Kilómetros Card */}
                <div className="relative overflow-hidden bg-white rounded-xl transition-all duration-200 hover:shadow-md shadow-sm border border-green-100 transform-gpu group">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-full"></div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg mr-3 shadow-md group-hover:shadow-lg transition-all">
                          <Route className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{kilometersData?.lastMonthData?.monthName || "Kilómetros del Mes"}</div>
                          <p className="text-xs text-gray-500">
                            {kilometersData?.lastMonthData?.monthName || lastMonthName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        {isRefreshing ? (
                          <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          <>
                            <span className="text-xl font-extrabold text-gray-800 tabular-nums group-hover:text-green-600 transition-colors">
                              {kmValue > 0 ? kmValue.toLocaleString() : "0"}
                            </span>
                            <span className="text-xs text-gray-500">km</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative mt-2">
                      <div className="w-full bg-gradient-to-r from-gray-200/80 to-gray-100/80 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${kmPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-inner relative"
                        >
                          {kmPercentage > 15 && (
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute inset-0 opacity-30">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <pattern id="smallDots" width="8" height="8" patternUnits="userSpaceOnUse">
                                      <circle cx="4" cy="4" r="1" fill="white" />
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#smallDots)" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Fancy animated percentage indicator */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="absolute -right-1 -top-1 bg-white shadow-md rounded-md px-1.5 py-0.5 border border-green-100"
                      >
                        <div className="text-xs font-bold tabular-nums flex items-center">
                          <div
                            className={`h-1.5 w-1.5 rounded-full mr-1 ${
                              kmPercentage >= 80 ? "bg-green-500" : kmPercentage >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                          ></div>
                          {kmPercentage}%
                        </div>
                      </motion.div>
                    </div>

                    {/* Target indicators */}
                    <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                      <div className="flex flex-col items-left">
                        <span className="text-xs text-gray-500 text-right-12">Nivel</span>
                        <span
                          className={`font-medium ${
                            kmPercentage >= 90
                              ? "text-green-600"
                              : kmPercentage >= 70
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {getProgressColor(kmPercentage)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rendimiento Global Card - Circular progress with animation */}
                <div className="relative overflow-hidden bg-white rounded-xl transition-all duration-200 hover:shadow-md shadow-sm border border-green-100 transform-gpu">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-full"></div>

                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-400 p-2 rounded-lg mr-3 shadow-md">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{kilometersData?.summary?.totalExecuted?.toLocaleString("es-CO", { maximumFractionDigits: 0 }) || 0} km</div>
                        <p className="text-xs text-gray-500">Métricas combinadas</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      {/* Circular indicator for overall performance */}
                      <div className="flex-shrink-0 relative h-20 w-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />

                          {/* Progress circle - animated */}
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#circleGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="283"
                            initial={{ strokeDashoffset: 283 }}
                            animate={{
                              strokeDashoffset: 283 - (283 * ((bonusPercentage + kmPercentage) / 2)) / 100,
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            transform="rotate(-90, 50, 50)"
                          />

                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Center percentage */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-lg font-bold text-gray-800 tabular-nums">
                            {Math.round((bonusPercentage + kmPercentage) / 2)}%
                          </span>
                          <span className="text-[10px] text-gray-500">promedio</span>
                        </div>
                      </div>

                      {/* Split metric breakdown */}
                      <div className="flex-1 space-y-3">
                        {/* KM Metric */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-600 flex items-center">
                              <Route className="h-3 w-3 mr-1 text-green-500" />
                              Kilómetros
                            </span>
                            <span className="text-xs font-bold tabular-nums text-gray-700">{kmPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                            <motion.div
                              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                              style={{ width: `${kmPercentage}%` }}
                            ></motion.div>
                          </div>
                        </div>

                        {/* Bonus Metric */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-600 flex items-center">
                              <Gift className="h-3 w-3 mr-1 text-green-500" />
                              Bonificación
                            </span>
                            <span className="text-xs font-bold tabular-nums text-gray-700">{bonusPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bonusPercentage}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${
                                bonusPercentage >= 80
                                  ? "bg-green-500"
                                  : bonusPercentage >= 60
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance evaluation with badge */}
                    <div className="mt-3 flex justify-end">
                      <div
                        className={`
                          text-xs px-2.5 py-1 rounded-full font-medium
                          ${
                            (bonusPercentage + kmPercentage) / 2 >= 90
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : (bonusPercentage + kmPercentage) / 2 >= 70
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                          }
                        `}
                      >
                        {(bonusPercentage + kmPercentage) / 2 >= 90
                          ? "Rendimiento Excepcional"
                          : (bonusPercentage + kmPercentage) / 2 >= 80
                            ? "Muy Buen Rendimiento"
                            : (bonusPercentage + kmPercentage) / 2 >= 70
                              ? "Buen Rendimiento"
                              : (bonusPercentage + kmPercentage) / 2 >= 60
                                ? "Rendimiento Regular"
                                : "Necesita Mejorar"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonificación Card with animated bars */}
                <div className="relative overflow-hidden bg-white rounded-xl transition-all duration-200 hover:shadow-md shadow-sm border border-green-100 transform-gpu group">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-full"></div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg mr-3 shadow-md group-hover:shadow-lg transition-all">
                          <Gift className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">Bonificación</h4>
                          <p className="text-xs text-gray-500">
                            {bonusesData?.lastMonthData?.monthName || lastMonthName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        {isRefreshing ? (
                          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          <span className="text-xl font-extrabold text-gray-800 tabular-nums group-hover:text-green-600 transition-colors">
                            {formatCurrency(bonusValue)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative mt-2">
                      <div className="w-full bg-gradient-to-r from-gray-200/80 to-gray-100/80 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bonusPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-inner"
                        >
                          {/* Pattern overlay for visual interest */}
                          {bonusPercentage > 15 && (
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute inset-0 opacity-30">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <pattern id="smallDashes" width="10" height="10" patternUnits="userSpaceOnUse">
                                      <path d="M0,5 L10,5" stroke="white" strokeWidth="2" strokeDasharray="2,2" />
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#smallDashes)" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Fancy animated percentage indicator */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="absolute -right-1 -top-1 bg-white shadow-md rounded-md px-1.5 py-0.5 border border-green-100"
                      >
                        <div className="text-xs font-bold tabular-nums flex items-center">
                          <div
                            className={`h-1.5 w-1.5 rounded-full mr-1 ${bonusPercentage >= 80 ? "bg-green-500" : bonusPercentage >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                          ></div>
                          {bonusPercentage}%
                        </div>
                      </motion.div>
                    </div>

                    {/* Información detallada del bono */}
                    <div className="mt-4 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Base</div>
                          <div className="font-medium text-gray-800">
                            {formatCurrency(bonusesData?.lastMonthData?.year >= 2025 ? 142000 : 130000)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Final</div>
                          <div className="font-medium text-gray-800">{formatCurrency(bonusValue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Porcentaje</div>
                          <div className="font-medium text-gray-800">{bonusPercentage}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison with previous periods */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Nivel de Desempeño:</span>
                        <span
                          className={`text-xs font-medium ${
                            bonusPercentage >= 90
                              ? "text-green-600"
                              : bonusPercentage >= 70
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {getProgressColor(bonusPercentage)}
                        </span>
                      </div>

                      {/* Compare base vs final bonus if available */}
                      {bonusesData?.baseBonus && bonusesData?.finalBonus && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500">Base</div>
                              <div className="font-medium text-gray-800">{formatCurrency(bonusesData.baseBonus)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Final</div>
                              <div className="font-medium text-gray-800">{formatCurrency(bonusesData.finalBonus)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Last updated timestamp */}
                      <div className="mt-3 flex items-center justify-end text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Actualizado: {formattedLastRefreshTime}</span>
                      </div>
                    </div>
                  </div>
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

export default SidebarOptimizedWithProvider