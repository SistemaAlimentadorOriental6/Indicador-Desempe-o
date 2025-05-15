"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
  BarChart3,
  Sparkles,
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

// Modificar la función principal para incluir la obtención directa de datos
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

  // Añadir estados para almacenar los datos obtenidos directamente
  const [kilometersData, setKilometersData] = useState<any>(propKilometersData)
  const [bonusesData, setBonusesData] = useState<any>(propBonusesData)

  // Referencia para controlar si ya se han cargado los datos
  const dataLoaded = useRef(false)

  // Efecto para cargar datos directamente si no están disponibles a través de props
  useEffect(() => {
    console.log("MobileProfileCard - Props recibidos:", {
      propKilometersData,
      propBonusesData,
      user,
    })

    // Si ya tenemos datos o no tenemos código de usuario, no hacemos nada
    if (dataLoaded.current || !user?.codigo) return

    // Si no tenemos datos de props, intentamos cargarlos directamente
    const loadData = async () => {
      try {
        console.log("MobileProfileCard - Cargando datos directamente para usuario:", user.codigo)

        // Intentar obtener datos de sessionStorage primero
        const kmDataStr = sessionStorage.getItem(`km-data-${user.codigo}`)
        const bonusDataStr = sessionStorage.getItem(`bonus-data-${user.codigo}`)

        let kmData, bonusData

        if (kmDataStr) {
          kmData = JSON.parse(kmDataStr)
          console.log("MobileProfileCard - Datos de kilómetros obtenidos de sessionStorage:", kmData)
          setKilometersData(kmData)
        }

        if (bonusDataStr) {
          bonusData = JSON.parse(bonusDataStr)
          console.log("MobileProfileCard - Datos de bonos obtenidos de sessionStorage:", bonusData)
          setBonusesData(bonusData)
        }

        // Si no tenemos datos en sessionStorage, hacemos peticiones a la API
        if (!kmData || !bonusData) {
          console.log("MobileProfileCard - Obteniendo datos de la API")

          const [kmResponse, bonusResponse] = await Promise.all([
            fetch(`/api/user/kilometers?codigo=${user.codigo}`),
            fetch(`/api/user/bonuses?codigo=${user.codigo}`),
          ])

          if (kmResponse.ok) {
            const kmDataFromApi = await kmResponse.json()
            console.log("MobileProfileCard - Datos de kilómetros obtenidos de API:", kmDataFromApi)
            setKilometersData(kmDataFromApi)
            sessionStorage.setItem(`km-data-${user.codigo}`, JSON.stringify(kmDataFromApi))
          }

          if (bonusResponse.ok) {
            const bonusDataFromApi = await bonusResponse.json()
            console.log("MobileProfileCard - Datos de bonos obtenidos de API:", bonusDataFromApi)
            setBonusesData(bonusDataFromApi)
            sessionStorage.setItem(`bonus-data-${user.codigo}`, JSON.stringify(bonusDataFromApi))
          }
        }

        dataLoaded.current = true
      } catch (error) {
        console.error("MobileProfileCard - Error al cargar datos:", error)
      }
    }

    // Si no tenemos datos de props, los cargamos directamente
    if (!propKilometersData || !propBonusesData) {
      loadData()
    } else {
      // Si tenemos datos de props, los usamos
      console.log("MobileProfileCard - Usando datos de props")
      setKilometersData(propKilometersData)
      setBonusesData(propBonusesData)
      dataLoaded.current = true
    }
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

    // Valor por defecto para desarrollo
    console.log("No se encontró un valor válido para bonusPercentage, usando valor por defecto")
    return 85 // Valor por defecto para desarrollo
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

    // Valor por defecto para desarrollo
    console.log("No se encontró un valor válido para kmPercentage, usando valor por defecto")
    return 75 // Valor por defecto para desarrollo
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

    // Valor por defecto para desarrollo
    console.log("No se encontró valor válido de km, usando valor por defecto")
    return 2826.04 // Valor por defecto para desarrollo (basado en los logs)
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

    // Valor por defecto para desarrollo
    console.log("No se encontró valor válido de bonificación, usando valor por defecto")
    return 35500 // Valor por defecto para desarrollo (basado en los logs)
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

  // Actualizar el refreshData para que actualice también los estados locales
  const refreshData = useCallback(async () => {
    if (!user?.codigo || isRefreshing) return

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
      sessionStorage.setItem(`data-timestamp-${user.codigo}`, refreshTime.getTime().toString())

      // Store the data in sessionStorage
      sessionStorage.setItem(`km-data-${user.codigo}`, JSON.stringify(kmData))
      sessionStorage.setItem(`bonus-data-${user.codigo}`, JSON.stringify(bonusData))

      // No recargamos la página para evitar perder el estado
      // window.location.reload()
    } catch (error) {
      console.error("Error refreshing data:", error)
      alert(`Error al actualizar datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.codigo, isRefreshing])

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

  // Cargar la hora de la última actualización desde sessionStorage
  useEffect(() => {
    if (user?.codigo && typeof window !== "undefined") {
      const timestampStr = sessionStorage.getItem(`data-timestamp-${user.codigo}`)
      if (timestampStr) {
        setLastRefreshTime(new Date(Number(timestampStr)))
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

  return (
    <div className="pb-6 bg-gray-50 min-h-screen">
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

          {/* Métricas rápidas */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-white" />
                <span className="text-white text-xs font-medium">Bonificación</span>
              </div>
              <div className="text-white font-bold text-lg">{formatCurrency(bonusValue)}</div>
              <div className="flex items-center mt-1">
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${bonusPercentage}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <span className="text-white text-xs ml-2">{bonusPercentage}%</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Route className="h-4 w-4 text-white" />
                <span className="text-white text-xs font-medium">Kilómetros</span>
              </div>
              <div className="text-white font-bold text-lg">{kmValue.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${kmPercentage}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <span className="text-white text-xs ml-2">{kmPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
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

      {/* Contenido principal */}
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
              {/* Tarjeta de rendimiento global */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`bg-gradient-to-br ${getCategoryGradient()} p-2 rounded-lg shadow-sm`}>
                        <TrendingUp className="h-4 w-4 text-white" />
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

                  <div className="flex items-center gap-4">
                    {/* Indicador circular */}
                    <div className="relative h-20 w-20 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
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
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-lg font-bold text-gray-800">
                          {Math.round((bonusPercentage + kmPercentage) / 2)}%
                        </span>
                      </div>
                    </div>

                    {/* Métricas detalladas */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 flex items-center">
                            <Gift className="h-3 w-3 mr-1 text-green-500" />
                            Bonificación
                          </span>
                          <span className="font-medium">{bonusPercentage}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 flex items-center">
                            <Route className="h-3 w-3 mr-1 text-blue-500" />
                            Kilómetros
                          </span>
                          <span className="font-medium">{kmPercentage}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${kmPercentage}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${
                              kmPercentage >= 80 ? "bg-blue-500" : kmPercentage >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>Actualizado: {formattedLastRefreshTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Categoría:</span>
                      <span className={`font-medium ${getCategoryTextColor()}`}>{getUserCategory()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de rendimiento */}
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
                      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                        {/* Tarjeta de bonificación */}
                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-3 border border-green-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Gift className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 text-xs font-medium">Bonificación</span>
                          </div>
                          <div className="text-gray-900 font-bold text-lg">{formatCurrency(bonusValue)}</div>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-green-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${bonusPercentage}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                            <span className="text-gray-600 text-xs ml-2">{bonusPercentage}%</span>
                          </div>
                        </div>

                        {/* Tarjeta de kilómetros */}
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Route className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700 text-xs font-medium">Kilómetros</span>
                          </div>
                          <div className="text-gray-900 font-bold text-lg">{kmValue.toLocaleString()}</div>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-blue-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${kmPercentage}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                            <span className="text-gray-600 text-xs ml-2">{kmPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sección de estado */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection("estado")}
                >
                  <div className="flex items-center gap-2">
                    <div className={`bg-gradient-to-br ${getCategoryGradient()} p-2 rounded-lg shadow-sm`}>
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Estado y Categoría</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSections.includes("estado") ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("estado") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div
                          className={`${getCategoryLightBg()} rounded-xl p-4 border border-${getCategoryTextColor().replace("text-", "")}-200`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-full ${getCategoryLightBg()} ${getCategoryTextColor()}`}>
                                <Award className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">Categoría {getUserCategory()}</h4>
                                <p className="text-xs text-gray-500">Basado en tu rendimiento</p>
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05, rotate: 5 }}
                              className={`h-10 w-10 flex items-center justify-center rounded-full ${getCategoryLightBg()} ${getCategoryTextColor()}`}
                            >
                              <Sparkles className="h-5 w-5" />
                            </motion.div>
                          </div>

                          <div className="mt-2 space-y-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Rendimiento Global</span>
                                <span className="font-medium text-gray-800">
                                  {Math.round((bonusPercentage + kmPercentage) / 2)}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round((bonusPercentage + kmPercentage) / 2)}%` }}
                                  transition={{ duration: 1 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    getUserCategory() === "Platino"
                                      ? "from-indigo-400 to-purple-500"
                                      : getUserCategory() === "Oro"
                                        ? "from-amber-400 to-yellow-500"
                                        : getUserCategory() === "Plata"
                                          ? "from-gray-400 to-slate-500"
                                          : getUserCategory() === "Bronce"
                                            ? "from-orange-400 to-amber-500"
                                            : "from-green-400 to-emerald-500"
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="bg-white rounded-lg p-2 border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Nivel de Bonificación</div>
                                <div
                                  className={`text-sm font-medium ${
                                    bonusPercentage >= 90
                                      ? "text-green-600"
                                      : bonusPercentage >= 70
                                        ? "text-amber-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {getBonusLevel(bonusPercentage)}
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-2 border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Nivel de Kilómetros</div>
                                <div
                                  className={`text-sm font-medium ${
                                    kmPercentage >= 90
                                      ? "text-green-600"
                                      : kmPercentage >= 70
                                        ? "text-amber-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {getBonusLevel(kmPercentage)}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-gray-600 flex items-center">
                              <ArrowUpRight className="h-3.5 w-3.5 text-green-500 mr-1" />
                              <span>
                                Mantén un rendimiento superior al 90% para alcanzar la categoría{" "}
                                {getUserCategory() === "Platino"
                                  ? "Diamante"
                                  : getUserCategory() === "Oro"
                                    ? "Platino"
                                    : getUserCategory() === "Plata"
                                      ? "Oro"
                                      : getUserCategory() === "Bronce"
                                        ? "Plata"
                                        : "Bronce"}
                              </span>
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
              {/* Tarjeta principal de kilómetros */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-4">
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

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
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
                    </div>

                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>0</span>
                      <span>Meta: {kmProgrammed ? kmProgrammed.toLocaleString() : "N/A"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-medium text-gray-700">Meta</span>
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {kmProgrammed ? kmProgrammed.toLocaleString() : "N/A"} km
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-medium text-gray-700">Nivel</span>
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          kmPercentage >= 90 ? "text-green-600" : kmPercentage >= 70 ? "text-amber-600" : "text-red-600"
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

              {/* Gráfico de kilómetros */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection("kmGrafico")}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-400 p-2 rounded-lg shadow-sm">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Gráfico de Rendimiento</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSections.includes("kmGrafico") ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("kmGrafico") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="bg-white rounded-xl p-4 border border-blue-100">
                          <div className="h-40 flex items-end justify-between gap-1">
                            {[
                              { month: "Ene", value: 65 },
                              { month: "Feb", value: 72 },
                              { month: "Mar", value: 58 },
                              { month: "Abr", value: 80 },
                              { month: "May", value: 85 },
                              { month: "Jun", value: kmPercentage },
                            ].map((item, index) => (
                              <div key={index} className="flex flex-col items-center flex-1">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${item.value}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                  className={`w-full rounded-t-md ${
                                    item.value >= 80 ? "bg-blue-500" : item.value >= 60 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                />
                                <div className="text-xs text-gray-500 mt-1">{item.month}</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            Porcentaje de cumplimiento mensual
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Detalles adicionales */}
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
              {/* Tarjeta principal de bonificación */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-4">
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

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
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
                    </div>
                  </div>

                  {/* Información detallada del bono */}
                  <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Base</div>
                        <div className="font-medium text-gray-800">{formatCurrency(bonusBase)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Final</div>
                        <div className="font-medium text-gray-800">{formatCurrency(bonusValue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Nivel</div>
                        <div className="font-medium text-green-600">{getBonusLevel(bonusPercentage)}</div>
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

              {/* Gráfico de bonificación */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection("bonosGrafico")}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg shadow-sm">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Gráfico de Bonificación</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSections.includes("bonosGrafico") ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("bonosGrafico") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="bg-white rounded-xl p-4 border border-green-100">
                          <div className="h-40 flex items-end justify-between gap-1">
                            {[
                              { month: "Ene", value: 85 },
                              { month: "Feb", value: 92 },
                              { month: "Mar", value: 78 },
                              { month: "Abr", value: 88 },
                              { month: "May", value: 95 },
                              { month: "Jun", value: bonusPercentage },
                            ].map((item, index) => (
                              <div key={index} className="flex flex-col items-center flex-1">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${item.value}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                  className={`w-full rounded-t-md ${
                                    item.value >= 80 ? "bg-green-500" : item.value >= 60 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                />
                                <div className="text-xs text-gray-500 mt-1">{item.month}</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            Porcentaje de bonificación mensual
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Detalles adicionales */}
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

      {/* Botón de cerrar sesión */}
      <div className="px-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 font-medium text-sm flex items-center justify-center gap-2 border border-red-200/50 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </motion.button>
      </div>

      {/* Diálogo de confirmación de cierre de sesión */}
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}
