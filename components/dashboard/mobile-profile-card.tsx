"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"

import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  LogOut,
  RefreshCw,
  Route,
  Gift,
  TrendingUp,
  Award,
  ChevronDown,
  Clock,
  Calendar,
  MapPin,
  Zap,
  ArrowUpRight,
  Check,
  AlertTriangle,
  Shield,
  Star,
  Sparkles,
  CircleCheck,
  CircleAlert,
  BadgeCheck,
  Gauge,
  Flame,
  Target,
  Lightbulb,
  Rocket,
} from "lucide-react"
import LogoutConfirmation from "../logout-confirmation"

interface MobileProfileCardProps {
  user: { nombre: string; rol: string; codigo?: string }
  profileImageUrl: string
  handleImageError: () => void
  openProfile: () => void
  handleLogout: () => void
  kilometersData?: any
  bonusesData?: any
  lastMonthName: string
  bonusesAvailable: number
}

declare global {
  interface Window {
    __MOBILE_PROFILE_LOAD_TIME?: number
    sidebarData?: {
      kmPercentage?: number
      bonusPercentage?: number
      kmValue?: number
      bonusValue?: number
    }
  }
}

export default function MobileProfileCard({
  user,
  profileImageUrl,
  handleImageError,
  openProfile,
  handleLogout,
  kilometersData: propKilometersData,
  bonusesData: propBonusesData,
  lastMonthName,
}: MobileProfileCardProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("resumen")
  const [expandedSections, setExpandedSections] = useState<string[]>(["rendimiento"])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Añadir estados para almacenar los datos obtenidos directamente
  const [kilometersData, setKilometersData] = useState<any>(propKilometersData)
  const [bonusesData, setBonusesData] = useState<any>(propBonusesData)

  // Referencia para controlar si ya se han cargado los datos
  const dataLoaded = useRef(false)
  // Referencia para controlar si el componente está montado
  const isMounted = useRef(false)
  // Referencia para almacenar el tiempo de la última actualización
  const lastUpdateRef = useRef<number>(0)

  // Implementar caché persistente para datos
  useEffect(() => {
    // Marcar el componente como montado
    isMounted.current = true

    // Guardar el tiempo de carga inicial
    if (typeof window !== "undefined" && !window.__MOBILE_PROFILE_LOAD_TIME) {
      window.__MOBILE_PROFILE_LOAD_TIME = Date.now()

      // Guardar en sessionStorage para persistir entre recargas
      sessionStorage.setItem("__MOBILE_PROFILE_LOAD_TIME", window.__MOBILE_PROFILE_LOAD_TIME.toString())
    }

    // Verificar si ha habido una recarga reciente
    if (typeof window !== "undefined") {
      const lastLoadTimeStr = sessionStorage.getItem("__MOBILE_PROFILE_LOAD_TIME")
      const currentTime = Date.now()
      const lastLoadTime = lastLoadTimeStr ? Number.parseInt(lastLoadTimeStr, 10) : currentTime

      // Si la página se ha recargado en menos de 10 segundos, podría ser un ciclo de recargas
      if (currentTime - lastLoadTime < 10000 && lastLoadTime !== currentTime) {
        console.warn("Detected potential reload cycle in MobileProfileCard. Stabilizing...")

        // Limpiar caché problemática que podría estar causando recargas
        if (user?.codigo) {
          localStorage.removeItem(`km-data-${user.codigo}`)
          localStorage.removeItem(`bonus-data-${user.codigo}`)
        }

        // Actualizar el tiempo de carga para evitar falsos positivos
        window.__MOBILE_PROFILE_LOAD_TIME = currentTime
        sessionStorage.setItem("__MOBILE_PROFILE_LOAD_TIME", currentTime.toString())
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [user?.codigo])

  // Modificar el efecto para cargar datos para ser más agresivo en la obtención de datos reales
  useEffect(() => {
    console.log("MobileProfileCard - Props recibidos:", {
      propKilometersData,
      propBonusesData,
      user,
    })

    // Si no tenemos código de usuario, no hacemos nada
    if (!user?.codigo) return

    // Intentar cargar datos siempre, incluso si ya tenemos algunos
    const loadData = async () => {
      try {
        setIsLoading(true)
        console.log("MobileProfileCard - Cargando datos para usuario:", user.codigo)

        // Intentar obtener datos de localStorage primero (más persistente que sessionStorage)
        const kmDataStr = localStorage.getItem(`km-data-${user.codigo}`)
        const bonusDataStr = localStorage.getItem(`bonus-data-${user.codigo}`)
        const lastRefreshStr = localStorage.getItem(`last-refresh-${user.codigo}`)

        let kmData, bonusData

        if (kmDataStr) {
          try {
            kmData = JSON.parse(kmDataStr)
            console.log("MobileProfileCard - Datos de kilómetros obtenidos de localStorage:", kmData)
            setKilometersData(kmData)
          } catch (e) {
            console.error("Error al parsear datos de kilómetros de localStorage:", e)
          }
        }

        if (bonusDataStr) {
          try {
            bonusData = JSON.parse(bonusDataStr)
            console.log("MobileProfileCard - Datos de bonos obtenidos de localStorage:", bonusData)
            setBonusesData(bonusData)
          } catch (e) {
            console.error("Error al parsear datos de bonos de localStorage:", e)
          }
        }

        if (lastRefreshStr) {
          try {
            const timestamp = Number.parseInt(lastRefreshStr, 10)
            setLastRefreshTime(new Date(timestamp))
            lastUpdateRef.current = timestamp
          } catch (e) {
            console.error("Error al parsear timestamp de localStorage:", e)
          }
        }

        // Si no tenemos datos en localStorage o props, o si los datos son antiguos, hacemos peticiones a la API
        const shouldFetchData =
          (!kmData && !propKilometersData) ||
          (!bonusData && !propBonusesData) ||
          (lastUpdateRef.current && Date.now() - lastUpdateRef.current > 30 * 60 * 1000) // 30 minutos

        if (shouldFetchData && navigator.onLine) {
          console.log("MobileProfileCard - Obteniendo datos de la API")

          try {
            // Añadir timestamp para evitar caché del navegador
            const timestamp = Date.now()
            const [kmResponse, bonusResponse] = await Promise.all([
              fetch(`/api/user/kilometers?codigo=${user.codigo}&_t=${timestamp}`),
              fetch(`/api/user/bonuses?codigo=${user.codigo}&_t=${timestamp}`),
            ])

            if (kmResponse.ok) {
              const kmDataFromApi = await kmResponse.json()
              console.log("MobileProfileCard - Datos de kilómetros obtenidos de API:", kmDataFromApi)
              setKilometersData(kmDataFromApi)
              localStorage.setItem(`km-data-${user.codigo}`, JSON.stringify(kmDataFromApi))
            } else {
              console.error("Error al obtener datos de kilómetros:", kmResponse.status)
            }

            if (bonusResponse.ok) {
              const bonusDataFromApi = await bonusResponse.json()
              console.log("MobileProfileCard - Datos de bonos obtenidos de API:", bonusDataFromApi)
              setBonusesData(bonusDataFromApi)
              localStorage.setItem(`bonus-data-${user.codigo}`, JSON.stringify(bonusDataFromApi))
            } else {
              console.error("Error al obtener datos de bonos:", bonusResponse.status)
            }

            // Actualizar timestamp de última actualización
            const refreshTime = Date.now()
            setLastRefreshTime(new Date(refreshTime))
            localStorage.setItem(`last-refresh-${user.codigo}`, refreshTime.toString())
            lastUpdateRef.current = refreshTime
          } catch (fetchError) {
            console.error("Error al hacer fetch de datos:", fetchError)
          }
        } else {
          console.log("MobileProfileCard - Usando datos en caché, no es necesario actualizar")
        }

        // Si tenemos datos de props, los usamos (tienen prioridad sobre localStorage)
        if (propKilometersData) {
          console.log("MobileProfileCard - Usando datos de kilómetros de props")
          setKilometersData(propKilometersData)

          // También guardar en localStorage para futuras visitas
          localStorage.setItem(`km-data-${user.codigo}`, JSON.stringify(propKilometersData))
        }

        if (propBonusesData) {
          console.log("MobileProfileCard - Usando datos de bonos de props")
          setBonusesData(propBonusesData)

          // También guardar en localStorage para futuras visitas
          localStorage.setItem(`bonus-data-${user.codigo}`, JSON.stringify(propBonusesData))
        }

        dataLoaded.current = true
      } catch (error) {
        console.error("MobileProfileCard - Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Pequeño retraso para priorizar la renderización inicial
    const timer = setTimeout(() => {
      if (isMounted.current) {
        loadData()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [propKilometersData, propBonusesData, user?.codigo])

  // Mejorado: Cálculo de porcentaje de bonificación con mejor manejo de datos
  const bonusPercentage = useMemo(() => {
    console.log("Calculando bonusPercentage con datos:", bonusesData)

    // Si no tenemos datos, intentar obtener del sidebar
    if (!bonusesData && window && window.sidebarData && window.sidebarData.bonusPercentage) {
      console.log("Usando bonusPercentage del sidebar:", window.sidebarData.bonusPercentage)
      return window.sidebarData.bonusPercentage
    }

    // Primero verificar si tenemos datos del último mes
    if (bonusesData?.lastMonthData?.percentage !== undefined) {
      console.log("Usando porcentaje del último mes:", bonusesData.lastMonthData.percentage)
      return bonusesData.lastMonthData.percentage
    }

    // Luego verificar si tenemos datos de resumen
    if (bonusesData?.summary?.percentage !== undefined) {
      console.log("Usando porcentaje del resumen:", bonusesData.summary.percentage)
      return bonusesData.summary.percentage
    }

    // Verificar si tenemos el formato de la respuesta JSON
    if (bonusesData?.baseBonus && bonusesData?.finalBonus) {
      const baseBonus = bonusesData.baseBonus || 0
      const finalBonus = bonusesData.finalBonus || 0
      const calculatedPercentage = baseBonus > 0 ? Math.round((finalBonus / baseBonus) * 100) : 0
      console.log("Calculando porcentaje desde baseBonus y finalBonus:", calculatedPercentage)
      return calculatedPercentage
    }

    // Si tenemos el porcentaje directamente en bonusesData
    if (bonusesData?.percentage !== undefined) {
      console.log("Usando porcentaje directo:", bonusesData.percentage)
      return typeof bonusesData.percentage === "number" ? bonusesData.percentage : 0
    }

    // Determinar el año actual o el año de los datos si está disponible
    const currentYear = bonusesData?.lastMonthData?.year || new Date().getFullYear()
    // Determinar el valor base del bono según el año
    const baseBonus = currentYear >= 2025 ? 142000 : 130000

    // Si tenemos el valor final del bono, calcular el porcentaje
    if (bonusesData?.lastMonthData?.finalValue !== undefined) {
      const finalValue = bonusesData.lastMonthData.finalValue
      const calculatedPercentage = Math.round((finalValue / baseBonus) * 100)
      console.log("Calculando porcentaje desde finalValue:", calculatedPercentage)
      return calculatedPercentage
    }

    // No usar valor por defecto, retornar 0 cuando no hay datos reales
    console.log("No se encontró un valor válido para bonusPercentage, usando 0")
    return 0
  }, [bonusesData])

  // Mejorado: Cálculo de porcentaje de kilómetros con mejor manejo de datos
  const kmPercentage = useMemo(() => {
    console.log("Calculando kmPercentage con datos:", kilometersData)

    // Si no tenemos datos, intentar obtener del sidebar
    if (!kilometersData && window && window.sidebarData && window.sidebarData.kmPercentage) {
      console.log("Usando kmPercentage del sidebar:", window.sidebarData.kmPercentage)
      return window.sidebarData.kmPercentage
    }

    // Primero verificar si tenemos datos del último mes
    if (kilometersData?.lastMonthData?.percentage !== undefined) {
      console.log("Usando porcentaje del último mes:", kilometersData.lastMonthData.percentage)
      return kilometersData.lastMonthData.percentage
    }

    // Luego verificar si tenemos datos de resumen
    if (kilometersData?.summary?.percentage !== undefined) {
      console.log("Usando porcentaje del resumen:", kilometersData.summary.percentage)
      return kilometersData.summary.percentage
    }

    // Calcular manualmente si tenemos los valores necesarios
    if (kilometersData?.summary?.totalProgrammed && kilometersData.summary.totalExecuted) {
      const programmed = Number(kilometersData.summary.totalProgrammed)
      const executed = Number(kilometersData.summary.totalExecuted)
      const calculatedPercentage = programmed > 0 ? Math.round((executed / programmed) * 100) : 0
      console.log("Calculando porcentaje manualmente:", calculatedPercentage)
      return calculatedPercentage
    }

    // Si tenemos datos en el array de datos
    if (kilometersData?.data && Array.isArray(kilometersData.data) && kilometersData.data.length > 0) {
      const firstEntry = kilometersData.data[0]
      if (firstEntry && firstEntry.valor_programacion && firstEntry.valor_ejecucion) {
        const programmed = Number(firstEntry.valor_programacion)
        const executed = Number(firstEntry.valor_ejecucion)
        const calculatedPercentage = programmed > 0 ? Math.round((executed / programmed) * 100) : 0
        console.log("Calculando porcentaje desde el primer entry:", calculatedPercentage)
        return calculatedPercentage
      }
    }

    // No usar valor por defecto, retornar 0 cuando no hay datos reales
    console.log("No se encontró un valor válido para kmPercentage, usando 0")
    return 0
  }, [kilometersData])

  // Mejorado: Cálculo del valor de kilómetros con mejor manejo de datos
  const kmValue = useMemo(() => {
    console.log("Calculando kmValue con datos:", kilometersData)

    // Si no tenemos datos, intentar obtener del sidebar
    if (!kilometersData && window && window.sidebarData && window.sidebarData.kmValue) {
      console.log("Usando kmValue del sidebar:", window.sidebarData.kmValue)
      return window.sidebarData.kmValue
    }

    // Primero verificar si tenemos datos del último mes
    if (kilometersData?.lastMonthData?.valor_ejecucion) {
      console.log("Usando valor de ejecución del último mes:", kilometersData.lastMonthData.valor_ejecucion)
      return kilometersData.lastMonthData.valor_ejecucion
    }

    // Luego verificar si tenemos datos en el array
    if (kilometersData?.data && Array.isArray(kilometersData.data) && kilometersData.data.length > 0) {
      // Encontrar el primer valor no cero en el array (el más reciente primero)
      const nonZeroEntry = kilometersData.data.find(
        (entry) => entry && typeof entry.valor_ejecucion === "number" && entry.valor_ejecucion > 0,
      )

      if (nonZeroEntry) {
        console.log("Encontrado valor no cero de km:", nonZeroEntry.valor_ejecucion)
        return nonZeroEntry.valor_ejecucion
      }
    }

    // Si no hay valor no cero en el array de datos, intentar con el resumen
    if (kilometersData?.summary?.totalExecuted && kilometersData.summary.totalExecuted > 0) {
      console.log("Usando valor de resumen de km:", kilometersData.summary.totalExecuted)
      return kilometersData.summary.totalExecuted
    }

    // No usar valor por defecto, retornar 0 cuando no hay datos reales
    console.log("No se encontró valor válido de km, usando 0")
    return 0
  }, [kilometersData])

  // Mejorado: Cálculo del valor de bonificación con mejor manejo de datos
  const bonusValue = useMemo(() => {
    console.log("Calculando bonusValue con datos:", bonusesData)

    // Si no tenemos datos, intentar obtener del sidebar
    if (!bonusesData && window && window.sidebarData && window.sidebarData.bonusValue) {
      console.log("Usando bonusValue del sidebar:", window.sidebarData.bonusValue)
      return window.sidebarData.bonusValue
    }

    // Primero verificar si tenemos datos del último mes
    if (bonusesData?.lastMonthData?.finalValue && bonusesData.lastMonthData.finalValue > 0) {
      console.log("Usando valor final de bonificación del último mes:", bonusesData.lastMonthData.finalValue)
      return bonusesData.lastMonthData.finalValue
    }

    // Verificar si tenemos el formato de la respuesta JSON
    if (bonusesData?.finalBonus && bonusesData.finalBonus > 0) {
      console.log("Usando finalBonus:", bonusesData.finalBonus)
      return bonusesData.finalBonus
    }

    // Si tenemos datos de resumen con un valor no cero, usarlo
    if (bonusesData?.summary?.totalExecuted && bonusesData.summary.totalExecuted > 0) {
      console.log("Usando valor de resumen de bonificación:", bonusesData.summary.totalExecuted)
      return bonusesData.summary.totalExecuted
    }

    // No usar valor por defecto, retornar 0 cuando no hay datos reales
    console.log("No se encontró valor válido de bonificación, usando 0")
    return 0
  }, [bonusesData])

  // Mejorado: Obtener el valor programado de kilómetros
  const kmProgrammed = useMemo(() => {
    if (kilometersData?.lastMonthData?.valor_programacion) {
      return kilometersData.lastMonthData.valor_programacion
    }

    if (kilometersData?.summary?.totalProgrammed) {
      return kilometersData.summary.totalProgrammed
    }

    if (kilometersData?.data && Array.isArray(kilometersData.data) && kilometersData.data.length > 0) {
      const nonZeroEntry = kilometersData.data.find(
        (entry) => entry && typeof entry.valor_programacion === "number" && entry.valor_programacion > 0,
      )

      if (nonZeroEntry) {
        return nonZeroEntry.valor_programacion
      }
    }

    return 0
  }, [kilometersData])

  // Mejorado: Obtener el valor base de bonificación
  const bonusBase = useMemo(() => {
    // Determinar el año actual o el año de los datos si está disponible
    const currentYear = bonusesData?.lastMonthData?.year || new Date().getFullYear()
    // Determinar el valor base del bono según el año
    return currentYear >= 2025 ? 142000 : 130000
  }, [bonusesData])

  // Determinar la categoría del usuario basada en los porcentajes
  const getUserCategory = useCallback(() => {
    const avgPercentage = (bonusPercentage + kmPercentage) / 2
    if (avgPercentage >= 90) return "Platino"
    if (avgPercentage >= 80) return "Oro"
    if (avgPercentage >= 70) return "Plata"
    if (avgPercentage >= 60) return "Bronce"
    return "Estándar"
  }, [bonusPercentage, kmPercentage])

  // Formatear moneda
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  // Función para determinar nivel de bono basado en el porcentaje
  const getBonusLevel = useCallback((percentage: number) => {
    if (percentage >= 100) return "Excelente"
    if (percentage >= 90) return "Muy Bueno"
    if (percentage >= 80) return "Bueno"
    if (percentage >= 70) return "Regular"
    return "Necesita Mejorar"
  }, [])

  // Modificar la función refreshData para mostrar un mensaje cuando no hay datos
  const refreshData = useCallback(async () => {
    if (!user?.codigo || isRefreshing || !navigator.onLine) return

    // Obtener timestamp de la última actualización
    const lastRefreshStr = localStorage.getItem(`last-refresh-${user.codigo}`)
    const lastRefresh = lastRefreshStr ? Number.parseInt(lastRefreshStr, 10) : 0

    // Evitar actualizaciones demasiado frecuentes (mínimo 2 minutos entre actualizaciones)
    if (lastRefresh && Date.now() - lastRefresh < 2 * 60 * 1000) {
      console.log("Skipping refresh - too soon since last refresh")
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
      return
    }

    setIsRefreshing(true)

    try {
      // Clear cache by adding a timestamp to the URL
      const timestamp = new Date().getTime()

      // Fetch fresh data for kilometers and bonuses using the original routes
      const kmUrl = `/api/user/kilometers?codigo=${user.codigo}&_t=${timestamp}`
      const bonusUrl = `/api/user/bonuses?codigo=${user.codigo}&_t=${timestamp}`

      console.log("MobileProfileCard - Fetching data from:", kmUrl, bonusUrl)

      const [kmResponse, bonusResponse] = await Promise.all([fetch(kmUrl), fetch(bonusUrl)])

      // Check if responses are successful
      if (!kmResponse.ok || !bonusResponse.ok) {
        throw new Error("Error al obtener datos del servidor")
      }

      // Parse responses as JSON
      let kmData, bonusData
      try {
        kmData = await kmResponse.json()
        bonusData = await bonusResponse.json()

        // Verificar si los datos son válidos
        if (!kmData || !bonusData) {
          throw new Error("Los datos recibidos no son válidos")
        }

        // Actualizar los estados locales
        setKilometersData(kmData)
        setBonusesData(bonusData)

        console.log("MobileProfileCard - Datos actualizados:", { kmData, bonusData })
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Error al procesar la respuesta del servidor. La respuesta no es un JSON válido.")
      }

      // Store the timestamp of the last refresh
      const refreshTime = new Date()
      setLastRefreshTime(refreshTime)
      localStorage.setItem(`last-refresh-${user.codigo}`, refreshTime.getTime().toString())
      lastUpdateRef.current = refreshTime.getTime()

      // Store the data in localStorage for persistence
      localStorage.setItem(`km-data-${user.codigo}`, JSON.stringify(kmData))
      localStorage.setItem(`bonus-data-${user.codigo}`, JSON.stringify(bonusData))

      // Compartir datos con el sidebar si existe
      if (window && !window.sidebarData) {
        window.sidebarData = {
          kmPercentage: kmPercentage,
          bonusPercentage: bonusPercentage,
          kmValue: kmValue,
          bonusValue: bonusValue,
        }
      }

      // Mostrar mensaje de éxito
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      console.error("Error refreshing data:", error)
      alert(`Error al actualizar datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.codigo, isRefreshing, kmPercentage, bonusPercentage, kmValue, bonusValue])

  // Format the last refresh time
  const formattedLastRefreshTime = useMemo(() => {
    if (!lastRefreshTime) return "Nunca"

    const now = new Date()
    const diffMs = now.getTime() - lastRefreshTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Hace unos segundos"
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins === 1 ? "" : "s"}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours === 1 ? "" : "s"}`
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? "" : "s"}`

    return lastRefreshTime.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [lastRefreshTime])

  // Cargar la hora de la última actualización desde localStorage
  useEffect(() => {
    if (user?.codigo && typeof window !== "undefined") {
      const timestampStr = localStorage.getItem(`last-refresh-${user.codigo}`)
      if (timestampStr) {
        const timestamp = Number.parseInt(timestampStr, 10)
        setLastRefreshTime(new Date(timestamp))
        lastUpdateRef.current = timestamp
      }
    }
  }, [user?.codigo])

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }, [])

  // Determinar el color de fondo según la categoría
  const getCategoryGradient = useCallback(() => {
    const category = getUserCategory()
    switch (category) {
      case "Platino":
        return "from-indigo-600 via-purple-600 to-indigo-700"
      case "Oro":
        return "from-amber-500 via-yellow-500 to-amber-600"
      case "Plata":
        return "from-slate-400 via-gray-500 to-slate-500"
      case "Bronce":
        return "from-amber-700 via-orange-600 to-amber-800"
      default:
        return "from-green-600 via-emerald-500 to-green-700"
    }
  }, [getUserCategory])

  // Determinar el color del texto según la categoría
  const getCategoryTextColor = useCallback(() => {
    const category = getUserCategory()
    switch (category) {
      case "Platino":
        return "text-indigo-600"
      case "Oro":
        return "text-amber-600"
      case "Plata":
        return "text-gray-600"
      case "Bronce":
        return "text-amber-700"
      default:
        return "text-green-600"
    }
  }, [getUserCategory])

  // Determinar el color del fondo claro según la categoría
  const getCategoryLightBg = useCallback(() => {
    const category = getUserCategory()
    switch (category) {
      case "Platino":
        return "bg-indigo-50"
      case "Oro":
        return "bg-amber-50"
      case "Plata":
        return "bg-gray-50"
      case "Bronce":
        return "bg-amber-50"
      default:
        return "bg-green-50"
    }
  }, [getUserCategory])

  // Obtener el icono según la categoría
  const getCategoryIcon = useCallback(() => {
    const category = getUserCategory()
    switch (category) {
      case "Platino":
        return <Star className="h-5 w-5" />
      case "Oro":
        return <Award className="h-5 w-5" />
      case "Plata":
        return <Shield className="h-5 w-5" />
      case "Bronce":
        return <Badge className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }, [getUserCategory])

  // Precargar imágenes críticas
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Precargar avatar
      if (profileImageUrl) {
        const img = new Image()
        img.src = profileImageUrl
      }

      // Precargar imágenes de fondo si las hubiera
      const preloadBackgroundImages = () => {
        const images = [
          // Añadir aquí URLs de imágenes de fondo si las hay
        ]

        images.forEach((url) => {
          if (url) {
            const img = new Image()
            img.src = url
          }
        })
      }

      preloadBackgroundImages()
    }
  }, [profileImageUrl])

  return (
    <div className="pb-6 bg-gray-50 min-h-screen">
      {/* Mensaje de éxito */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-0 right-0 mx-auto w-4/5 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-center"
            style={{ maxWidth: "300px" }}
          >
            <CircleCheck className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Datos actualizados correctamente</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header con diseño mejorado */}
      <div className={`bg-gradient-to-r ${getCategoryGradient()} relative overflow-hidden w-full`}>
        {/* Elementos decorativos del fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* Patrón de puntos */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          {/* Círculos decorativos */}
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
        </div>

        {/* Contenido del header */}
        <div className="relative z-10 pt-12 pb-6 px-5">
          <div className="flex justify-between items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center">
                <div className="h-0.5 w-5 bg-white/80 rounded-full mr-2" />
                <h2 className="text-white font-bold text-xl">Mi Perfil</h2>
              </div>
              <p className="text-white/80 mt-1 pl-7 text-xs font-light">
                {bonusesData?.lastMonthData?.monthName || lastMonthName} · {getUserCategory()}
              </p>
            </motion.div>

            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10"
                onClick={openProfile}
              >
                <User className="h-4 w-4 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10"
                onClick={refreshData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 text-white ${isRefreshing ? "animate-spin" : ""}`} />
              </motion.button>
            </div>
          </div>

          {/* Perfil y métricas principales */}
          <div className="mt-4 flex items-center">
            {/* Avatar con efectos */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openProfile}
            >
              <motion.div
                className="absolute -inset-1 rounded-full opacity-30 z-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                style={{
                  background: `conic-gradient(from 0deg, white, transparent, white)`,
                }}
              />
              <div className="h-16 w-16 rounded-full border-2 border-white overflow-hidden shadow-lg relative z-10">
                <img
                  src={profileImageUrl || "/placeholder.svg?height=64&width=64&query=profile"}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </motion.div>

            {/* Información del usuario */}
            <div className="ml-4 flex-1">
              <h3 className="text-white font-bold text-lg truncate">{user?.nombre || "Usuario"}</h3>
              <p className="text-white/80 text-xs">{user?.rol || "Operador"}</p>

              {/* Insignia de categoría */}
              <div className="mt-1 inline-flex items-center">
                <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/10 flex items-center gap-1">
                  <Award className="h-3 w-3 text-white" />
                  <span className="text-white">{getUserCategory()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas rápidas con diseño mejorado */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 relative overflow-hidden">
              {/* Fondo decorativo */}
              <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%">
                  <pattern
                    id="diagonalLines"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="5" x2="10" y2="5" stroke="white" strokeWidth="1" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#diagonalLines)" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <Gift className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">Bonificación</span>
                </div>
                {bonusValue > 0 ? (
                  <div className="text-white font-bold text-lg">{formatCurrency(bonusValue)}</div>
                ) : (
                  <div className="text-white/70 font-medium text-sm italic">Sin datos</div>
                )}
                <div className="flex items-center mt-1">
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${bonusPercentage}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-white text-xs ml-2 font-medium">{bonusPercentage}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 relative overflow-hidden">
              {/* Fondo decorativo */}
              <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%">
                  <pattern id="dots2" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="1" fill="white" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#dots2)" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <Route className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">Kilómetros</span>
                </div>
                {kmValue > 0 ? (
                  <div className="text-white font-bold text-lg">{kmValue.toLocaleString()}</div>
                ) : (
                  <div className="text-white/70 font-medium text-sm italic">Sin datos</div>
                )}
                <div className="flex items-center mt-1">
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${kmPercentage}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-white text-xs ml-2 font-medium">{kmPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas con diseño mejorado */}
      <div className="px-4 -mt-5 relative z-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-1 flex justify-between"
        >
          {[
            { id: "resumen", label: "Resumen", icon: TrendingUp },
            { id: "kilometros", label: "Kilómetros", icon: Route },
            { id: "bonos", label: "Bonos", icon: Gift },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? `${getCategoryLightBg()} ${getCategoryTextColor()} shadow-sm border border-${getCategoryTextColor().replace("text-", "")}-100`
                  : "text-gray-500 hover:text-gray-700"
              }`}
              whileTap={{ scale: 0.97 }}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Contenido principal con diseño mejorado */}
      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === "resumen" && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Tarjeta de rendimiento global con diseño mejorado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`bg-gradient-to-br ${getCategoryGradient()} p-2 rounded-lg shadow-sm`}>
                        <Gauge className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Rendimiento Global</h3>
                        <p className="text-xs text-gray-500">Promedio de métricas</p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (bonusPercentage + kmPercentage) / 2 >= 90
                          ? "bg-green-100 text-green-700"
                          : (bonusPercentage + kmPercentage) / 2 >= 70
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {Math.round((bonusPercentage + kmPercentage) / 2)}%
                    </div>
                  </div>

                  {/* Indicador circular mejorado */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Fondo del círculo con patrón */}
                        <defs>
                          <pattern id="circlePattern" width="4" height="4" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="0.5" fill="#f3f4f6" />
                          </pattern>
                        </defs>
                        <circle cx="50" cy="50" r="45" fill="url(#circlePattern)" stroke="#f3f4f6" strokeWidth="2" />

                        {/* Círculo de progreso */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={`url(#${getUserCategory().toLowerCase()}Gradient)`}
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

                        {/* Definiciones de gradientes */}
                        <defs>
                          <linearGradient id="platinoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                          <linearGradient id="oroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#eab308" />
                          </linearGradient>
                          <linearGradient id="plataGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#64748b" />
                          </linearGradient>
                          <linearGradient id="bronceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#b45309" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                          <linearGradient id="estándarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>

                        {/* Efecto de brillo */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="283"
                          initial={{ strokeDashoffset: 283, opacity: 0 }}
                          animate={{
                            strokeDashoffset: [283, 0],
                            opacity: [0.7, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatDelay: 5,
                          }}
                          transform="rotate(-90, 50, 50)"
                        />
                      </svg>

                      {/* Contenido central */}
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-lg font-bold text-gray-800">
                          {Math.round((bonusPercentage + kmPercentage) / 2)}%
                        </span>
                      </div>
                    </div>

                    {/* Métricas detalladas con diseño mejorado */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 flex items-center">
                            <Gift className="h-3 w-3 mr-1 text-green-500" />
                            Bonificación
                          </span>
                          <span className="font-medium">{bonusPercentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${bonusPercentage}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${
                              bonusPercentage >= 80
                                ? "bg-gradient-to-r from-green-400 to-green-500"
                                : bonusPercentage >= 60
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                            }`}
                          />

                          {/* Marcadores de progreso */}
                          <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
                            {[25, 50, 75].map((mark) => (
                              <div
                                key={mark}
                                className="h-2 w-0.5 bg-white/50"
                                style={{ marginLeft: `${mark}%`, transform: "translateX(-50%)" }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 flex items-center">
                            <Route className="h-3 w-3 mr-1 text-blue-500" />
                            Kilómetros
                          </span>
                          <span className="font-medium">{kmPercentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${kmPercentage}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${
                              kmPercentage >= 80
                                ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                : kmPercentage >= 60
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                            }`}
                          />

                          {/* Marcadores de progreso */}
                          <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
                            {[25, 50, 75].map((mark) => (
                              <div
                                key={mark}
                                className="h-2 w-0.5 bg-white/50"
                                style={{ marginLeft: `${mark}%`, transform: "translateX(-50%)" }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional con diseño mejorado */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${getCategoryLightBg()}`}>
                          <BadgeCheck className={`h-4 w-4 ${getCategoryTextColor()}`} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Nivel</div>
                          <div className={`text-sm font-medium ${getCategoryTextColor()}`}>
                            {(bonusPercentage + kmPercentage) / 2 >= 90
                              ? "Excepcional"
                              : (bonusPercentage + kmPercentage) / 2 >= 80
                                ? "Sobresaliente"
                                : (bonusPercentage + kmPercentage) / 2 >= 70
                                  ? "Bueno"
                                  : (bonusPercentage + kmPercentage) / 2 >= 60
                                    ? "Regular"
                                    : "Básico"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-blue-50">
                          <Clock className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Actualizado</div>
                          <div className="text-xs font-medium text-gray-700">{formattedLastRefreshTime}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de rendimiento con diseño mejorado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection("rendimiento")}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-400 p-2 rounded-lg shadow-sm">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Métricas Principales</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSections.includes("rendimiento") ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("rendimiento") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 grid grid-cols-1 gap-3">
                        {/* Tarjeta de bonificación con diseño mejorado */}
                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 shadow-sm relative overflow-hidden">
                          {/* Fondo decorativo */}
                          <div className="absolute inset-0 opacity-5">
                            <svg width="100%" height="100%">
                              <pattern
                                id="diagonalLinesGreen"
                                width="10"
                                height="10"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(45)"
                              >
                                <line x1="0" y1="5" x2="10" y2="5" stroke="#10b981" strokeWidth="1" />
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#diagonalLinesGreen)" />
                            </svg>
                          </div>

                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg shadow-sm">
                                  <Gift className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">Bonificación</h4>
                                  <p className="text-xs text-gray-500">
                                    {bonusesData?.lastMonthData?.monthName || lastMonthName}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  bonusPercentage >= 90
                                    ? "bg-green-100 text-green-700"
                                    : bonusPercentage >= 70
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {bonusPercentage}%
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-16 h-16 relative">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                                  <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="283"
                                    initial={{ strokeDashoffset: 283 }}
                                    animate={{
                                      strokeDashoffset: 283 - (283 * bonusPercentage) / 100,
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    transform="rotate(-90, 50, 50)"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-800">{bonusPercentage}%</span>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Valor actual</div>
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(bonusValue)}</div>
                                <div className="text-xs text-gray-500 mt-1">Base: {formatCurrency(bonusBase)}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center text-xs">
                              {bonusPercentage >= 90 ? (
                                <div className="flex items-center text-green-600">
                                  <CircleCheck className="h-3.5 w-3.5 mr-1" />
                                  <span>Excelente nivel de bonificación</span>
                                </div>
                              ) : bonusPercentage >= 70 ? (
                                <div className="flex items-center text-amber-600">
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Buen nivel de bonificación</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-red-600">
                                  <CircleAlert className="h-3.5 w-3.5 mr-1" />
                                  <span>Necesitas mejorar tu nivel de bonificación</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tarjeta de kilómetros con diseño mejorado */}
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 shadow-sm relative overflow-hidden">
                          {/* Fondo decorativo */}
                          <div className="absolute inset-0 opacity-5">
                            <svg width="100%" height="100%">
                              <pattern id="dotsBlue" width="8" height="8" patternUnits="userSpaceOnUse">
                                <circle cx="4" cy="4" r="1" fill="#3b82f6" />
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#dotsBlue)" />
                            </svg>
                          </div>

                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-400 p-2 rounded-lg shadow-sm">
                                  <Route className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">Kilómetros</h4>
                                  <p className="text-xs text-gray-500">
                                    {kilometersData?.lastMonthData?.monthName || lastMonthName}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  kmPercentage >= 90
                                    ? "bg-green-100 text-green-700"
                                    : kmPercentage >= 70
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {kmPercentage}%
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-16 h-16 relative">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                                  <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="283"
                                    initial={{ strokeDashoffset: 283 }}
                                    animate={{
                                      strokeDashoffset: 283 - (283 * kmPercentage) / 100,
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    transform="rotate(-90, 50, 50)"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-800">{kmPercentage}%</span>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Recorridos</div>
                                <div className="text-xl font-bold text-gray-800">{kmValue.toLocaleString()} km</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Meta: {kmProgrammed ? kmProgrammed.toLocaleString() : "N/A"} km
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center text-xs">
                              {kmPercentage >= 90 ? (
                                <div className="flex items-center text-green-600">
                                  <CircleCheck className="h-3.5 w-3.5 mr-1" />
                                  <span>Has superado la meta de kilómetros</span>
                                </div>
                              ) : kmPercentage >= 70 ? (
                                <div className="flex items-center text-amber-600">
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Estás cerca de alcanzar la meta</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-red-600">
                                  <CircleAlert className="h-3.5 w-3.5 mr-1" />
                                  <span>Necesitas mejorar para alcanzar la meta</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

          {activeTab === "kilometros" && (
            <motion.div
              key="kilometros"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Tarjeta principal de kilómetros con diseño mejorado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative">
                {/* Fondo decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50"></div>

                <div className="p-4 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-400 p-2 rounded-lg shadow-sm">
                        <Route className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Kilómetros</h3>
                        <p className="text-xs text-gray-500">
                          {kilometersData?.lastMonthData?.monthName || lastMonthName}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        kmPercentage >= 90
                          ? "bg-green-100 text-green-700"
                          : kmPercentage >= 70
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {kmPercentage}%
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-gray-500 text-xs">Kilómetros recorridos</span>
                      <span className="text-2xl font-bold text-gray-800">{kmValue.toLocaleString()}</span>
                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-2 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${kmPercentage}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full ${
                          kmPercentage >= 90
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : kmPercentage >= 70
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                              : "bg-gradient-to-r from-red-400 to-rose-500"
                        }`}
                      />

                      {/* Marcadores de progreso */}
                      <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
                        {[25, 50, 75].map((mark) => (
                          <div
                            key={mark}
                            className="h-3 w-0.5 bg-white/70"
                            style={{ marginLeft: `${mark}%`, transform: "translateX(-50%)" }}
                          />
                        ))}
                      </div>

                      {/* Indicador de meta */}
                      {kmProgrammed > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute top-0 h-3 border-r-2 border-indigo-600 z-10"
                          style={{ left: "100%", transform: "translateX(-2px)" }}
                        >
                          <div className="absolute -top-5 -right-1 bg-indigo-100 text-indigo-700 text-[10px] px-1 py-0.5 rounded">
                            Meta
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>0</span>
                      <span>Meta: {kmProgrammed ? kmProgrammed.toLocaleString() : "N/A"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-blue-100">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Meta</div>
                        <div className="text-sm font-bold text-gray-800">
                          {kmProgrammed ? kmProgrammed.toLocaleString() : "N/A"} km
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-blue-100">
                        <Award className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Nivel</div>
                        <div
                          className={`text-sm font-bold ${
                            kmPercentage >= 90
                              ? "text-green-600"
                              : kmPercentage >= 70
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {kmPercentage >= 90
                            ? "Excelente"
                            : kmPercentage >= 80
                              ? "Muy bueno"
                              : kmPercentage >= 70
                                ? "Bueno"
                                : kmPercentage >= 50
                                  ? "Regular"
                                  : "Bajo"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>Actualizado: {formattedLastRefreshTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Categoría:</span>
                      <span className="font-medium text-blue-600">
                        {kmPercentage >= 90
                          ? "Premium"
                          : kmPercentage >= 80
                            ? "Avanzado"
                            : kmPercentage >= 70
                              ? "Intermedio"
                              : "Básico"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles adicionales con diseño mejorado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection("kmDetalles")}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-400 p-2 rounded-lg shadow-sm">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Detalles de Kilómetros</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSections.includes("kmDetalles") ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("kmDetalles") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Kilómetros programados:</span>
                              <span className="text-xs font-medium text-gray-800">
                                {kmProgrammed ? kmProgrammed.toLocaleString() : "N/A"} km
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Kilómetros ejecutados:</span>
                              <span className="text-xs font-medium text-gray-800">
                                {kmValue ? kmValue.toLocaleString() : "N/A"} km
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Porcentaje de cumplimiento:</span>
                              <span className="text-xs font-medium text-gray-800">{kmPercentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Mes:</span>
                              <span className="text-xs font-medium text-gray-800">
                                {kilometersData?.lastMonthData?.monthName || lastMonthName}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center">
                            {kmPercentage >= 90 ? (
                              <div className="flex items-center text-green-600 text-xs">
                                <Check className="h-3.5 w-3.5 mr-1" />
                                <span>¡Excelente! Has superado la meta de kilómetros.</span>
                              </div>
                            ) : kmPercentage >= 70 ? (
                              <div className="flex items-center text-amber-600 text-xs">
                                <Check className="h-3.5 w-3.5 mr-1" />
                                <span>Buen trabajo. Estás cerca de alcanzar la meta.</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                <span>Necesitas mejorar para alcanzar la meta de kilómetros.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "bonos" && (
            <motion.div
              key="bonos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Tarjeta principal de bonificación con diseño mejorado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative">
                {/* Fondo decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full opacity-50"></div>

                <div className="p-4 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg shadow-sm">
                        <Gift className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Bonificación</h3>
                        <p className="text-xs text-gray-500">
                          {bonusesData?.lastMonthData?.monthName || lastMonthName}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bonusPercentage >= 90
                          ? "bg-green-100 text-green-700"
                          : bonusPercentage >= 70
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {bonusPercentage}%
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-gray-500 text-xs">Valor de bonificación</span>
                      <span className="text-2xl font-bold text-gray-800">{formatCurrency(bonusValue)}</span>
                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-2 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bonusPercentage}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full ${
                          bonusPercentage >= 90
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : bonusPercentage >= 70
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                              : "bg-gradient-to-r from-red-400 to-rose-500"
                        }`}
                      />

                      {/* Marcadores de progreso */}
                      <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
                        {[25, 50, 75].map((mark) => (
                          <div
                            key={mark}
                            className="h-3 w-0.5 bg-white/70"
                            style={{ marginLeft: `${mark}%`, transform: "translateX(-50%)" }}
                          />
                        ))}
                      </div>

                      {/* Indicador de 100% */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-0 h-3 border-r-2 border-green-600 z-10"
                        style={{ left: "100%", transform: "translateX(-2px)" }}
                      >
                        <div className="absolute -top-5 -right-1 bg-green-100 text-green-700 text-[10px] px-1 py-0.5 rounded">
                          100%
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Información detallada del bono con diseño mejorado */}
                  <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="text-gray-500 mb-1">Base</div>
                        <div className="font-medium text-gray-800 text-sm">{formatCurrency(bonusBase)}</div>
                      </div>
                      <div className="flex flex-col items-center border-x border-green-100">
                        <div className="text-gray-500 mb-1">Final</div>
                        <div className="font-medium text-gray-800 text-sm">{formatCurrency(bonusValue)}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-gray-500 mb-1">Nivel</div>
                        <div className="font-medium text-green-600 text-sm">{getBonusLevel(bonusPercentage)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>Actualizado: {formattedLastRefreshTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Categoría:</span>
                      <span className="font-medium text-green-600">{getUserCategory()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles adicionales con diseño mejorado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection("bonosDetalles")}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg shadow-sm">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Detalles de Bonificación</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSections.includes("bonosDetalles") ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("bonosDetalles") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Bono base:</span>
                              <span className="text-xs font-medium text-gray-800">{formatCurrency(bonusBase)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Deducciones:</span>
                              <span className="text-xs font-medium text-gray-800">
                                {formatCurrency(bonusBase - bonusValue)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Bono final:</span>
                              <span className="text-xs font-medium text-gray-800">{formatCurrency(bonusValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Porcentaje:</span>
                              <span className="text-xs font-medium text-gray-800">{bonusPercentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Mes:</span>
                              <span className="text-xs font-medium text-gray-800">
                                {bonusesData?.lastMonthData?.monthName || lastMonthName}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center">
                            {bonusPercentage >= 90 ? (
                              <div className="flex items-center text-green-600 text-xs">
                                <Check className="h-3.5 w-3.5 mr-1" />
                                <span>¡Excelente! Has mantenido un alto nivel de bonificación.</span>
                              </div>
                            ) : bonusPercentage >= 70 ? (
                              <div className="flex items-center text-amber-600 text-xs">
                                <Check className="h-3.5 w-3.5 mr-1" />
                                <span>Buen trabajo. Mantén tu rendimiento para mejorar tu bonificación.</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                <span>Necesitas mejorar para aumentar tu nivel de bonificación.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botón de cerrar sesión con diseño mejorado */}
      <div className="px-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 font-medium text-sm flex items-center justify-center gap-2 border border-red-200/50 shadow-sm relative overflow-hidden group"
        >
          {/* Efecto de brillo */}
          <motion.div
            className="absolute inset-0 bg-white/20 -translate-x-full"
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          />

          <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          <span>Cerrar Sesión</span>
        </motion.button>
      </div>

      {/* Indicador de carga */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-5 shadow-xl flex flex-col items-center"
            >
              <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700 font-medium">Cargando datos...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diálogo de confirmación de cierre de sesión */}
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}
