"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Route,
  Gift,
  Award,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Zap,
  Target,
  CheckCircle2,
  Star,
  Calendar,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Debug flag - set to true to enable debug mode
const DEBUG_MODE = false

// Debug logger function
function debugLog(...args: any[]) {
  if (DEBUG_MODE) {
    console.log("[DEBUG]", ...args)
  }
}

interface YearlyData {
  year: number
  kilometers: number
  bonuses: number
  score: number
}

interface Deduction {
  id: number
  codigo: string
  concepto: string
  fechaInicio: string
  fechaFin: string | null
  dias: number
  porcentaje: number | string
  monto: number
}

interface LastMonthData {
  year: number
  month: number
  monthName: string
  bonusValue: number
  deductionAmount: number
  finalValue: number
  isLastAvailableMonth?: boolean
}

interface BonusData {
  baseBonus: number | null
  deductionPercentage: number | null
  deductionAmount: number | null
  finalBonus: number | null
  expiresInDays: number | null
  bonusesByYear: Record<string, number> | null
  deductions: Deduction[] | null
  lastMonthData?: LastMonthData | null
  isLastAvailableMonth?: boolean
  availableYears?: number[]
  availableMonths?: number[]
  summary?: {
    totalProgrammed: number
    totalExecuted: number
    percentage: number
  }
}

interface MonthData {
  year: number
  month: number
  monthName: string
  valor_programacion: number
  valor_ejecucion: number
  percentage?: number
  registros?: any[]
}

interface ApiResponse {
  success: boolean
  data: MonthData[]
  summary: {
    totalProgrammed: number
    totalExecuted: number
    percentage: number
  }
  availableYears: number[]
  availableMonths: number[]
  message?: string
  error?: string
}

interface ProgressCardsProps {
  kilometersData?: {
    total: number
    goal: number
    percentage: number
    isLastAvailableMonth?: boolean
    lastMonthInfo?: {
      year: number
      month: number
      monthName: string
    }
    monthlyData?: MonthData[]
    availableMonths?: number[]
    availableYears?: number[]
  }
  bonusesData?: {
    available: number
    total: number
    goal: number
    percentage: number
    isLastAvailableMonth?: boolean
    lastMonthInfo?: LastMonthData
    monthlyData?: {
      year: number
      month: number
      monthName: string
      bonusValue: number
      deductionAmount: number
      finalValue: number
    }[]
  }
  userCode?: string
  error?: string
}

// Animation variants
const cardVariants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  hover: { y: -5, transition: { duration: 0.3 } },
}

// Decorative pattern component with enhanced animations
function DecorativePattern({
  className = "",
  variant = "dots" | "grid" | "waves" | "circles",
  color = "currentColor",
}: {
  className?: string
  variant?: "dots" | "grid" | "waves" | "circles"
  color?: string
}) {
  if (variant === "waves") {
    return (
      <div className={`absolute inset-0 overflow-hidden opacity-10 pointer-events-none ${className}`}>
        <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <motion.path
            d="M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z"
            fill={color}
            opacity="0.2"
            animate={{
              d: [
                "M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z",
                "M 0 1000 Q 250 900 500 1000 Q 750 900 1000 1000 L 1000 0 L 0 0 Z",
                "M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z",
              ],
            }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 10, ease: "easeInOut" }}
          />
          <motion.path
            d="M 0 1000 Q 250 950 500 1000 Q 750 950 1000 1000 L 1000 100 L 0 100 Z"
            fill={color}
            opacity="0.3"
            animate={{
              d: [
                "M 0 1000 Q 250 950 500 1000 Q 750 950 1000 1000 L 1000 100 L 0 100 Z",
                "M 0 1000 Q 250 920 500 1000 Q 750 920 1000 1000 L 1000 100 L 0 100 Z",
                "M 0 1000 Q 250 950 500 1000 Q 750 950 1000 1000 L 1000 100 L 0 100 Z",
              ],
            }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 8, ease: "easeInOut", delay: 0.5 }}
          />
        </svg>
      </div>
    )
  }

  if (variant === "circles") {
    return (
      <div className={`absolute inset-0 overflow-hidden opacity-10 pointer-events-none ${className}`}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <motion.circle
                cx="20"
                cy="20"
                r="3"
                fill={color}
                animate={{ r: [3, 4, 3] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
              />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#circles)" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`absolute inset-0 overflow-hidden opacity-10 pointer-events-none ${className}`}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={color} />
          </pattern>
          <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${variant === "grid" ? "grid" : "dots"})`} />
      </svg>
    </div>
  )
}

// Enhanced animated counter hook with easing
function useAnimatedCounter(targetValue: number, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    const startAnimation = () => {
      startTimeRef.current = Date.now() + delay

      const updateValue = () => {
        const now = Date.now()
        if (startTimeRef.current && now < startTimeRef.current) {
          frameRef.current = requestAnimationFrame(updateValue)
          return
        }

        const elapsed = startTimeRef.current ? (startTimeRef.current ? now - startTimeRef.current : 0) : 0
        const progress = Math.min(1, elapsed / duration)

        // Use easeOutExpo for smoother animation
        const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

        if (progress === 1) {
          setValue(targetValue)
        } else {
          setValue(Math.floor(easedProgress * targetValue))
          frameRef.current = requestAnimationFrame(updateValue)
        }
      }

      frameRef.current = requestAnimationFrame(updateValue)
    }

    startAnimation()

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [targetValue, duration, delay])

  return value
}

// Helper function to get month name
function getMonthName(monthNumber: number): string {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]
  const index = Math.max(0, Math.min(11, Number(monthNumber) - 1))
  return months[index] || ""
}

// Enhanced KilometersCard component with more interactive elements and monthly focus
function KilometersCard({
  userCode,
  initialData = null,
}: {
  userCode: string
  initialData?: {
    monthlyData?: MonthData[]
    availableMonths?: number[]
    availableYears?: number[]
    summary?: {
      totalProgrammed: number
      totalExecuted: number
      percentage: number
    }
  } | null
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [currentMonthData, setCurrentMonthData] = useState<MonthData | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    totalProgrammed: number
    totalExecuted: number
    percentage: number
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch data from API
  const fetchData = async (year?: number | null, month?: number | null) => {
    try {
      setIsLoading(true)

      let url = `/api/user/kilometers?codigo=${userCode}`
      if (year) url += `&year=${year}`
      if (month) url += `&month=${month}`

      // Add timestamp to prevent caching
      url += `&_t=${Date.now()}`

      console.log("Fetching data from:", url)

      const response = await fetch(url)

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API response error:", response.status, errorText)
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      // Intentar parsear la respuesta como JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Error al procesar la respuesta del servidor. La respuesta no es un JSON válido.")
      }

      if (!data.success && data.error) {
        throw new Error(data.message || "Error al cargar los datos")
      }

      // Process data
      const processedData = data.data.map((item: MonthData) => ({
        ...item,
        percentage:
          item.valor_programacion > 0 ? Math.round((item.valor_ejecucion / item.valor_programacion) * 100) : 0,
      }))

      setMonthlyData(processedData)
      setAvailableYears(data.availableYears || [])
      setAvailableMonths(data.availableMonths || [])
      setSummary(data.summary || null)

      // Set default selections if not already set
      if (!selectedYear && data.availableYears && data.availableYears.length) {
        setSelectedYear(data.availableYears[0])
      }

      if (!selectedMonth && data.availableMonths && data.availableMonths.length) {
        setSelectedMonth(data.availableMonths[data.availableMonths.length - 1])
      }

      // Find current month data
      if (year && month) {
        const matchingData = processedData.find((item: MonthData) => item.year === year && item.month === month)
        setCurrentMonthData(matchingData || null)
      } else if (processedData.length > 0) {
        setCurrentMonthData(processedData[0])
      }

      setError(null)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initialize with provided data or fetch from API
  useEffect(() => {
    if (initialData) {
      if (initialData.monthlyData) {
        setMonthlyData(initialData.monthlyData)
      }
      if (initialData.availableYears) {
        setAvailableYears(initialData.availableYears)
        if (initialData.availableYears.length) {
          setSelectedYear(initialData.availableYears[0])
        }
      }
      if (initialData.availableMonths) {
        setAvailableMonths(initialData.availableMonths)
        if (initialData.availableMonths.length) {
          setSelectedMonth(initialData.availableMonths[initialData.availableMonths.length - 1])
        }
      }
      if (initialData.summary) {
        setSummary(initialData.summary)
      }
      setIsLoading(false)
    } else {
      fetchData()
    }
  }, [userCode, initialData])

  // Update when year selection changes
  useEffect(() => {
    if (selectedYear) {
      fetchData(selectedYear)
    }
  }, [selectedYear])

  // Update current month data when month selection changes
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      fetchData(selectedYear, selectedMonth)
    }
  }, [selectedMonth])

  // Handle refresh data
  const handleRefreshData = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    await fetchData(selectedYear, selectedMonth)
  }

  // Use either currently selected month data or fallback to summary
  const displayData = currentMonthData || {
    year: selectedYear || new Date().getFullYear(),
    month: selectedMonth || new Date().getMonth() + 1,
    monthName: getMonthName(selectedMonth || new Date().getMonth() + 1),
    valor_programacion: summary?.totalProgrammed || 0,
    valor_ejecucion: summary?.totalExecuted || 0,
    percentage: summary?.percentage || 0,
  }

  const animatedKm = useAnimatedCounter(Number(displayData.valor_ejecucion))
  const animatedKmPercentage = useAnimatedCounter(displayData.percentage || 0)

  // Calculate daily average - divide by days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(displayData.year, displayData.month)
  const dailyAverage = Math.round(Number(displayData.valor_ejecucion) / daysInMonth)

  // Helper function to navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    if (!availableMonths || !availableMonths.length) return

    const currentIndex = availableMonths.findIndex((m) => m === selectedMonth)
    if (currentIndex === -1) return

    if (direction === "prev" && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1])
    } else if (direction === "next" && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1])
    }
  }

  // Format number with commas and decimal points
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-10 w-40 mb-4" />
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-20 w-full rounded-lg mb-4" />
        </CardContent>
        <CardFooter className="bg-gray-50 pt-3 pb-3 border-t">
          <Skeleton className="h-9 w-full rounded-md" />
        </CardFooter>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Error al cargar los datos
          </CardTitle>
          <CardDescription>Por favor, inténtalo de nuevo más tarde.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden"
    >
      <DecorativePattern variant="waves" />

      {/* Decorative elements with enhanced animations */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 bg-white/10 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 5,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-24 h-24 -mb-8 -ml-8 bg-white/10 rounded-full blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 4,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
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
              duration: 2 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <CardHeader className="pb-2 text-white relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Route className="h-5 w-5 mr-2" />
              <span className="flex items-center">
                Kilómetros Mensuales
                <Badge className="ml-2 bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  {animatedKmPercentage}% completado
                </Badge>
              </span>
            </CardTitle>
            <CardDescription className="text-green-100">Seguimiento de kilómetros recorridos</CardDescription>
          </div>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className={`h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white ${isRefreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Actualizar datos</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-2 text-white relative z-10">
        {/* Year/Month Selector */}
        <div className="mb-4">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                  Filtrar por período
                </h3>
                {selectedYear && selectedMonth && (
                  <Badge className="bg-emerald-500/30 text-white hover:bg-emerald-500/40 border-0">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 flex items-center">
                    <ArrowLeft className="h-3 w-3 mr-1 opacity-70" />
                    Año
                  </label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-white/20 text-white border-white/20 rounded-lg text-sm py-1.5 px-3 h-9 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 justify-between"
                      >
                        {selectedYear ? selectedYear : "Seleccionar año"}
                        <Calendar className="h-4 w-4 ml-2 opacity-70" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-500/95 to-emerald-600/95 text-white border-white/20 backdrop-blur-md">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Seleccionar año
                        </DialogTitle>
                        <DialogDescription className="text-green-100">
                          Elige el año para filtrar los datos de kilómetros
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="mt-4 max-h-[40vh]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {availableYears.map((year) => (
                            <Button
                              key={year}
                              variant="outline"
                              className={`border-white/20 hover:bg-white/20 hover:text-white ${
                                selectedYear === year
                                  ? "bg-white/30 border-white/40 ring-2 ring-white/30"
                                  : "bg-white/10"
                              }`}
                              onClick={() => setSelectedYear(year)}
                            >
                              {year}
                              {selectedYear === year && <CheckCircle2 className="h-4 w-4 ml-2" />}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                      <DialogFooter className="flex flex-row justify-between items-center mt-4 pt-3 border-t border-white/20">
                        <Button
                          variant="ghost"
                          className="text-white/80 hover:text-white hover:bg-white/20"
                          onClick={() => {
                            setSelectedYear(null)
                            fetchData()
                          }}
                        >
                          Limpiar selección
                        </Button>
                        <DialogClose asChild>
                          <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20">Aceptar</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1 opacity-70" />
                    Mes
                  </label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-white/20 text-white border-white/20 rounded-lg text-sm py-1.5 px-3 h-9 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 justify-between"
                        disabled={!selectedYear}
                      >
                        {selectedMonth ? getMonthName(selectedMonth) : "Seleccionar mes"}
                        <Calendar className="h-4 w-4 ml-2 opacity-70" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-500/95 to-emerald-600/95 text-white border-white/20 backdrop-blur-md">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Seleccionar mes
                        </DialogTitle>
                        <DialogDescription className="text-green-100">
                          Elige el mes para filtrar los datos de kilómetros
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                            const isAvailable = availableMonths.includes(month)
                            return (
                              <Button
                                key={month}
                                variant="outline"
                                className={`border-white/20 hover:bg-white/20 hover:text-white ${
                                  selectedMonth === month
                                    ? "bg-white/30 border-white/40 ring-2 ring-white/30"
                                    : "bg-white/10"
                                } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                                disabled={!isAvailable}
                                onClick={() => {
                                  if (isAvailable) {
                                    setSelectedMonth(month)
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center">
                                  <span className="text-xs">{getMonthName(month).substring(0, 3)}</span>
                                  <span className="text-lg font-semibold">{month}</span>
                                </div>
                                {selectedMonth === month && <CheckCircle2 className="h-4 w-4 absolute top-1 right-1" />}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row justify-between items-center mt-4 pt-3 border-t border-white/20">
                        <Button
                          variant="ghost"
                          className="text-white/80 hover:text-white hover:bg-white/20"
                          onClick={() => {
                            setSelectedMonth(null)
                            fetchData(selectedYear)
                          }}
                        >
                          Limpiar selección
                        </Button>
                        <DialogClose asChild>
                          <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20">Aceptar</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {(selectedYear || selectedMonth) && (
              <motion.div
                className="bg-white/5 border-t border-white/10 px-3 py-2 flex justify-between items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-xs text-white/60">Filtros aplicados</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => {
                    setSelectedYear(null)
                    setSelectedMonth(null)
                    fetchData()
                  }}
                >
                  Limpiar filtros
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>

        <motion.div
          className="flex items-center justify-between mb-2"
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-lg font-semibold flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {displayData.monthName} {displayData.year}
          </span>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
            >
              {animatedKmPercentage}% completado
            </motion.span>
          </Badge>
        </motion.div>

        <div className="flex items-baseline mb-4">
          <motion.p
            className="text-5xl font-bold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {formatNumber(Number(displayData.valor_ejecucion))}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col ml-3"
          >
            <span className="text-white/90 text-sm">/ {formatNumber(Number(displayData.valor_programacion))} km</span>
            <span className="text-white/70 text-xs">este mes</span>
          </motion.div>
        </div>

        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-2 backdrop-blur-sm">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${animatedKmPercentage}%` }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className="h-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, rgba(255,255,255,0.9) 0%, ${
                animatedKmPercentage >= 90
                  ? "rgba(52,211,153,0.9)"
                  : animatedKmPercentage >= 70
                    ? "rgba(251,191,36,0.9)"
                    : "rgba(239,68,68,0.9)"
              } 100%)`,
              boxShadow: "0 0 10px rgba(255,255,255,0.5)",
            }}
          >
            {/* Enhanced glow effect */}
            <motion.div
              className="absolute top-0 right-0 h-full w-6 bg-white/80 blur-sm"
              animate={{
                x: [0, 8, 0],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2,
                ease: "easeInOut",
              }}
            />

            {/* Animated dots along the progress bar */}
            {animatedKmPercentage > 10 &&
              [...Array(Math.floor(animatedKmPercentage / 20))].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"
                  style={{
                    left: `${(i + 1) * 20}%`,
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2,
                    delay: i * 0.3,
                  }}
                />
              ))}
          </motion.div>
        </div>

        <div className="flex justify-between text-xs text-white/70 mb-4">
          <span>0 km</span>
          <span>{formatNumber(Number(displayData.valor_programacion))} km</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10"
            whileHover={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              y: -2,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center text-xs text-green-100 mb-1">
              <Target className="h-3 w-3 mr-1" />
              <span>Meta mensual</span>
            </div>
            <div className="font-medium text-lg">{formatNumber(Number(displayData.valor_programacion))} km</div>
          </motion.div>
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10"
            whileHover={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              y: -2,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center text-xs text-green-100 mb-1">
              <Zap className="h-3 w-3 mr-1" />
              <span>Promedio diario</span>
            </div>
            <div className="font-medium text-lg">{dailyAverage.toLocaleString()} km</div>
          </motion.div>
        </div>
      </CardContent>

      <CardFooter className="bg-emerald-700/30 backdrop-blur-sm pt-3 pb-3 border-t border-white/10 relative z-10">
        <motion.div
          className="flex items-center w-full justify-center text-white/90 text-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {(displayData.percentage || 0) >= 90
            ? "¡Excelente progreso!"
            : (displayData.percentage || 0) >= 70
              ? "Buen progreso"
              : "Continúa esforzándote"}
        </motion.div>
      </CardFooter>
    </motion.div>
  )
}

// Enhanced BonusCard component with more interactive elements and monthly focus
function BonusCard({
  userCode,
  bonusData: initialBonusData,
  lastMonthData: initialLastMonthData,
  isLoading: initialIsLoading,
  monthlyBonusData: initialMonthlyBonusData,
}: {
  userCode: string
  bonusData: BonusData
  lastMonthData: LastMonthData | null
  isLoading: boolean
  monthlyBonusData?: {
    year: number
    month: number
    monthName: string
    bonusValue: number
    deductionAmount: number
    finalValue: number
  }[]
}) {
  const [showDeductions, setShowDeductions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [bonusError, setBonusError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(initialIsLoading)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to check API directly
  const checkApiDirectly = async () => {
    try {
      setIsLoading(true)

      // Create a basic URL without any parameters
      const baseUrl = `/api/user/bonuses?codigo=${userCode}&_t=${Date.now()}`
      console.log("Checking API directly:", baseUrl)

      const response = await fetch(baseUrl)
      const responseStatus = response.status
      const responseStatusText = response.statusText

      // Try to get the response as text first
      const responseText = await response.text()
      console.log("API Direct Check - Status:", responseStatus, responseStatusText)
      console.log("API Direct Check - Response:", responseText)

      // Try to parse as JSON if possible
      try {
        const responseJson = JSON.parse(responseText)
        console.log("API Direct Check - Parsed JSON:", responseJson)

        // If we got valid JSON, update the UI with this data
        if (responseJson && !responseJson.error) {
          // Process the data as in fetchBonusData
          const validData = {
            baseBonus: responseJson.baseBonus || responseJson.summary?.totalProgrammed || 130000,
            deductionPercentage:
              responseJson.deductionPercentage || (responseJson.summary ? 100 - responseJson.summary.percentage : 0),
            deductionAmount:
              responseJson.deductionAmount ||
              (responseJson.summary?.totalProgrammed && responseJson.summary?.totalExecuted
                ? responseJson.summary.totalProgrammed - responseJson.summary.totalExecuted
                : 0),
            finalBonus: responseJson.finalBonus || responseJson.summary?.totalExecuted || 130000,
            expiresInDays: responseJson.expiresInDays || null,
            bonusesByYear: responseJson.bonusesByYear || {},
            deductions: responseJson.deductions || [],
            lastMonthData: responseJson.lastMonthData || null,
            availableYears: responseJson.availableYears || [],
            availableMonths: responseJson.availableMonths || [],
            summary: responseJson.summary || null,
          }

          setBonusData(validData)

          if (responseJson.lastMonthData) {
            setLastMonthData(responseJson.lastMonthData)
          }

          // Update monthly data
          if (responseJson.lastMonthData && responseJson.lastMonthData.year) {
            setMonthlyBonusData([
              {
                year: responseJson.lastMonthData.year,
                month: responseJson.lastMonthData.month,
                monthName: responseJson.lastMonthData.monthName || getMonthName(responseJson.lastMonthData.month),
                bonusValue: responseJson.lastMonthData.bonusValue || validData.baseBonus,
                deductionAmount: responseJson.lastMonthData.deductionAmount || 0,
                finalValue: responseJson.lastMonthData.finalValue || validData.finalBonus,
              },
            ])
          }

          setBonusError(null)
        } else {
          // If there's an error in the JSON, set default values
          setDefaultValues()
          setBonusError(responseJson.error || "Error en la respuesta de la API")
        }
      } catch (parseError) {
        console.error("API Direct Check - JSON Parse Error:", parseError)
        // If we couldn't parse JSON, set default values
        setDefaultValues()
        setBonusError("Error al procesar la respuesta de la API")
      }
    } catch (error) {
      console.error("API Direct Check - Fetch Error:", error)
      setDefaultValues()
      setBonusError(`Error al verificar la API: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to set default values
  const setDefaultValues = () => {
    const currentDate = new Date()
    setBonusData({
      ...defaultBonusData,
      baseBonus: 130000,
      finalBonus: 130000,
      deductionPercentage: 0,
      deductionAmount: 0,
    })

    setMonthlyBonusData([
      {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        monthName: getMonthName(currentDate.getMonth() + 1),
        bonusValue: 130000,
        deductionAmount: 0,
        finalValue: 130000,
      },
    ])
  }

  // Add this useEffect to automatically check the API directly if the normal fetch fails
  useEffect(() => {
    if (bonusError) {
      console.log("Detected bonus error, trying direct API check as fallback")
      // Wait a moment before trying the direct check
      const timer = setTimeout(() => {
        checkApiDirectly()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [bonusError])

  // Safety timeout to ensure loading state is never stuck
  useEffect(() => {
    // Safety timeout to ensure loading state is never stuck
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Safety timeout triggered - forcing loading state to false")
        setIsLoading(false)

        // Set default data if we're still loading
        if (!displayData) {
          const currentDate = new Date()
          setBonusData({
            ...defaultBonusData,
            baseBonus: 130000,
            finalBonus: 130000,
            deductionPercentage: 0,
            deductionAmount: 0,
          })

          setMonthlyBonusData([
            {
              year: currentDate.getFullYear(),
              month: currentDate.getMonth() + 1,
              monthName: getMonthName(currentDate.getMonth() + 1),
              bonusValue: 130000,
              deductionAmount: 0,
              finalValue: 130000,
            },
          ])
        }
      }
    }, 8000) // 8 seconds max loading time

    return () => clearTimeout(safetyTimeout)
  }, [isLoading])

  // Asegurar que bonusData siempre tenga valores por defecto
  const defaultBonusData: BonusData = {
    baseBonus: null,
    deductionPercentage: null,
    deductionAmount: null,
    finalBonus: null,
    expiresInDays: null,
    bonusesByYear: null,
    deductions: null,
    lastMonthData: null,
    availableYears: [],
    availableMonths: [],
  }

  // Estados locales para manejar los datos filtrados
  const [bonusData, setBonusData] = useState<BonusData>(
    initialBonusData && Object.keys(initialBonusData).length > 0
      ? {
          ...defaultBonusData,
          ...initialBonusData,
        }
      : defaultBonusData,
  )

  // Asegurar que lastMonthData tenga valores por defecto
  // No crear valores por defecto, simplemente inicializar como null
  const [lastMonthData, setLastMonthData] = useState<LastMonthData | null>(initialLastMonthData || null)

  const [monthlyBonusData, setMonthlyBonusData] = useState<
    {
      year: number
      month: number
      monthName: string
      bonusValue: number
      deductionAmount: number
      finalValue: number
    }[]
  >(initialMonthlyBonusData || [])

  // Inicializar años y meses disponibles
  useEffect(() => {
    // Si no hay datos iniciales, establecer valores por defecto
    if (!initialBonusData || Object.keys(initialBonusData).length === 0) {
      setBonusData(defaultBonusData)
      setLastMonthData(null)
      setIsLoading(false)
      return
    }

    if (initialBonusData.availableYears && initialBonusData.availableYears.length > 0) {
      // Establecer el año más reciente como predeterminado
      setSelectedYear(initialBonusData.availableYears[0])
    }

    setBonusData({
      ...defaultBonusData,
      ...initialBonusData,
    })

    setLastMonthData(initialLastMonthData || null)
    setMonthlyBonusData(initialMonthlyBonusData || [])
  }, [initialBonusData, initialLastMonthData, initialMonthlyBonusData])

  // Fetch bonus data with filters
  // Modificar la función fetchBonusData en el componente BonusCard para manejar correctamente la respuesta
  const fetchBonusData = async (year?: number | null, month?: number | null) => {
    try {
      setIsLoading(true)
      setError(null)

      let url = `/api/user/bonuses?codigo=${userCode}`
      if (year) url += `&year=${year}`
      if (month) url += `&month=${month}`

      // Add timestamp to prevent caching
      url += `&_t=${Date.now()}`

      console.log("Fetching bonus data from:", url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      // Log the raw response for debugging
      const rawData = await response.text()
      console.log("Raw bonus data response:", rawData)

      // Parse the JSON data
      let data
      try {
        data = JSON.parse(rawData)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Error al procesar la respuesta del servidor. La respuesta no es un JSON válido.")
      }

      console.log("Parsed bonus data:", data)

      // Considerar la respuesta exitosa incluso si no tiene el campo success explícito
      // pero tiene datos relevantes
      if (data.error) {
        throw new Error(data.error || "Error al cargar los datos de bonos")
      }

      // Filtrar deducciones duplicadas por fecha
      let filteredDeductions = data.deductions || []
      if (filteredDeductions.length > 0) {
        // Crear un mapa para agrupar por fecha
        const deductionsByDate = new Map()

        filteredDeductions.forEach((deduction) => {
          const dateKey = deduction.fechaInicio // Usar la fecha como clave

          // Si ya existe una entrada para esta fecha, mantener solo la más reciente (asumiendo que el ID más alto es más reciente)
          if (!deductionsByDate.has(dateKey) || deductionsByDate.get(dateKey).id < deduction.id) {
            deductionsByDate.set(dateKey, deduction)
          }
        })

        // Convertir el mapa de vuelta a un array
        filteredDeductions = Array.from(deductionsByDate.values())
      }

      // Calcular correctamente el monto de deducción total
      const totalDeduction =
        filteredDeductions.length > 0 ? filteredDeductions.reduce((sum, deduction) => sum + deduction.monto, 0) : 0

      // Si no hay deducciones, asegurar que el bono sea 100%
      const baseBonus = data.baseBonus || data.summary?.totalProgrammed || 130000
      const finalBonus =
        filteredDeductions.length === 0
          ? baseBonus
          : (data.baseBonus && totalDeduction ? data.baseBonus - totalDeduction : data.finalBonus) ||
            data.summary?.totalExecuted ||
            130000

      // Ensure we have valid data or use defaults
      const validData = {
        baseBonus: baseBonus,
        deductionPercentage:
          filteredDeductions.length === 0
            ? 0
            : data.deductionPercentage ||
              (data.baseBonus && totalDeduction
                ? Math.round((totalDeduction / data.baseBonus) * 100)
                : data.summary
                  ? 100 - data.summary.percentage
                  : 0),
        deductionAmount:
          filteredDeductions.length === 0
            ? 0
            : totalDeduction ||
              data.deductionAmount ||
              (data.summary?.totalProgrammed && data.summary?.totalExecuted
                ? data.summary.totalProgrammed - data.summary.totalExecuted
                : 0),
        finalBonus: finalBonus,
        expiresInDays: data.expiresInDays || null,
        bonusesByYear: data.bonusesByYear || {},
        deductions: filteredDeductions,
        lastMonthData: data.lastMonthData || null,
        availableYears: data.availableYears || [],
        availableMonths: data.availableMonths || [],
        summary: data.summary || null,
      }

      // Actualizar los datos de bonos
      setBonusData(validData)

      // Actualizar lastMonthData si está disponible
      if (data.lastMonthData) {
        // Asegurarse de que los valores de lastMonthData sean correctos
        const lastMonth = {
          ...data.lastMonthData,
          deductionAmount: data.lastMonthData.deductionAmount || totalDeduction || 0,
          finalValue:
            data.lastMonthData.finalValue ||
            (data.lastMonthData.bonusValue && data.lastMonthData.deductionAmount
              ? data.lastMonthData.bonusValue - data.lastMonthData.deductionAmount
              : validData.finalBonus),
        }
        setLastMonthData(lastMonth)
      }

      // Crear datos mensuales a partir de lastMonthData si está disponible
      if (data.lastMonthData && data.lastMonthData.year) {
        const monthlyData = [
          {
            year: data.lastMonthData.year,
            month: data.lastMonthData.month,
            monthName: data.lastMonthData.monthName || getMonthName(data.lastMonthData.month),
            bonusValue: data.lastMonthData.bonusValue || validData.baseBonus,
            deductionAmount: data.lastMonthData.deductionAmount || totalDeduction || 0,
            finalValue:
              data.lastMonthData.finalValue ||
              (data.lastMonthData.bonusValue && data.lastMonthData.deductionAmount
                ? data.lastMonthData.bonusValue - data.lastMonthData.deductionAmount
                : validData.finalBonus),
          },
        ]
        setMonthlyBonusData(monthlyData)
      } else {
        // Set default monthly data if none is available
        const currentDate = new Date()
        setMonthlyBonusData([
          {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            monthName: getMonthName(currentDate.getMonth() + 1),
            bonusValue: validData.baseBonus,
            deductionAmount: validData.deductionAmount,
            finalValue: validData.finalBonus,
          },
        ])
      }

      setBonusError(null)
    } catch (err) {
      console.error("Error fetching bonus data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")

      // Always set default values in case of error to prevent loading state
      const currentDate = new Date()
      const defaultData = {
        ...defaultBonusData,
        baseBonus: 130000,
        finalBonus: 130000,
        deductionPercentage: 0,
        deductionAmount: 0,
      }

      setBonusData(defaultData)

      setMonthlyBonusData([
        {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          monthName: getMonthName(currentDate.getMonth() + 1),
          bonusValue: 130000,
          deductionAmount: 0,
          finalValue: 130000,
        },
      ])
    } finally {
      // Always set loading to false, even if there's an error
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Handle refresh data
  const handleRefreshData = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    await fetchBonusData(selectedYear, selectedMonth)
  }

  // Determinar qué datos mostrar basado en los filtros
  const displayData = useMemo(() => {
    // Si no hay datos reales, retornar null
    if (!bonusData || (!bonusData.baseBonus && bonusData.baseBonus !== 0)) {
      return null
    }

    // Si hay datos mensuales y están filtrados, usar esos
    if (monthlyBonusData && monthlyBonusData.length > 0) {
      // Buscar datos que coincidan con los filtros
      if (selectedYear && selectedMonth) {
        const filtered = monthlyBonusData.find((item) => item.year === selectedYear && item.month === selectedMonth)
        if (filtered) return filtered
      }

      // Si no hay coincidencia exacta, usar el primer elemento
      return monthlyBonusData[0]
    }

    // Si hay datos del último mes, usarlos
    if (lastMonthData) {
      return {
        year: lastMonthData.year,
        month: lastMonthData.month,
        monthName: lastMonthData.monthName?.toLowerCase(),
        bonusValue: lastMonthData.bonusValue,
        deductionAmount: lastMonthData.deductionAmount,
        finalValue: lastMonthData.finalValue,
      }
    }

    // Si hay datos base pero no datos específicos de mes
    if (bonusData.baseBonus !== null && bonusData.finalBonus !== null) {
      return {
        year: selectedYear || new Date().getFullYear(),
        month: selectedMonth || new Date().getMonth() + 1,
        monthName: selectedMonth ? getMonthName(selectedMonth).toLowerCase() : "",
        bonusValue: bonusData.baseBonus,
        deductionAmount: bonusData.deductionAmount || 0,
        finalValue: bonusData.finalBonus,
      }
    }

    return null
  }, [monthlyBonusData, lastMonthData, bonusData, selectedYear, selectedMonth])

  // Calculate values (con protección contra valores nulos o indefinidos)
  const bonusValue = displayData?.finalValue || 0
  const animatedBonus = useAnimatedCounter(bonusValue)
  const deductionPercentage =
    displayData?.bonusValue && displayData.bonusValue > 0 && displayData.deductionAmount != null
      ? Math.min(100, Math.round((displayData.deductionAmount / displayData.bonusValue) * 100))
      : 0

  // Format currency con protección contra nulos
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "$0"
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Manejar cambio de año
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? Number(e.target.value) : null
    setSelectedYear(year)
    setSelectedMonth(null) // Resetear el mes al cambiar el año
    fetchBonusData(year, null)
  }

  // Manejar cambio de mes
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value ? Number(e.target.value) : null
    setSelectedMonth(month)
    fetchBonusData(selectedYear, month)
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedYear(null)
    setSelectedMonth(null)
    fetchBonusData()
  }

  if (isLoading) {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg overflow-hidden"
      >
        <DecorativePattern variant="waves" />

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 -mt-10 -ml-10 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 -mb-8 -mr-8 bg-white/10 rounded-full blur-xl"></div>

        <CardHeader className="pb-2 text-white relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Bonos Mensuales
              </CardTitle>
              <CardDescription className="text-emerald-100">Valor después de descuentos</CardDescription>
            </div>

            {/* Add a retry button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchBonusData()}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="sr-only">Reintentar carga</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4 text-white relative z-10">
          <div className="flex items-baseline mb-4">
            <p className="text-4xl font-bold">$130.000</p>
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1, 0.98],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="ml-2 bg-white/20 rounded-md px-2 py-1 text-xs"
            >
              Cargando...
            </motion.div>
          </div>

          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-2 backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full relative bg-white/60"
              animate={{
                width: ["0%", "30%", "60%", "100%", "60%", "30%", "0%"],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-white/70 mb-4">
            <span>Cargando datos...</span>
            <span>Base: $130.000</span>
          </div>

          <motion.div
            className="bg-teal-600/30 backdrop-blur-sm rounded-lg p-4 mb-3 border border-white/10"
            whileHover={{
              backgroundColor: "rgba(13, 148, 136, 0.4)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              y: -2,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <div className="flex items-center text-teal-100 text-xs mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  <span>Valor base</span>
                </div>
                <span className="font-medium">$130.000</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center text-teal-100 text-xs mb-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Deducción</span>
                </div>
                <span className="font-medium text-red-200">-$0</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-teal-500/30 flex justify-between items-center">
              <span className="text-teal-100 text-xs">Valor final</span>
              <span className="font-bold text-lg">$130.000</span>
            </div>
          </motion.div>

          {/* Add a message about the loading state */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm border border-white/10">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-300" />
              <span>
                Cargando datos de bonificaciones. Si esto toma demasiado tiempo,
                <Button
                  variant="link"
                  className="text-white underline p-0 h-auto font-normal"
                  onClick={() => fetchBonusData()}
                >
                  haz clic aquí para reintentar
                </Button>
                .
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-teal-700/30 backdrop-blur-sm pt-3 pb-3 border-t border-white/10 relative z-10">
          <div className="flex items-center w-full justify-between text-white/90 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkApiDirectly}
              className="text-white/80 hover:text-white hover:bg-white/20 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Verificar API
            </Button>

            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2" />
              <motion.span
                animate={{
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                Cargando información...
              </motion.span>
            </div>
          </div>
        </CardFooter>
      </motion.div>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Error al cargar los datos
          </CardTitle>
          <CardDescription>Por favor, inténtalo de nuevo más tarde.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!displayData) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Gift className="h-5 w-5 mr-2" />
            Bonos Mensuales
          </CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">No se pudo cargar la información de bonos en este momento.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg overflow-hidden"
      >
        <DecorativePattern variant="waves" />

        {/* Enhanced decorative elements with animations */}
        <motion.div
          className="absolute top-0 left-0 w-32 h-32 -mt-10 -ml-10 bg-white/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 5,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-24 h-24 -mb-8 -mr-8 bg-white/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Enhanced animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
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
                duration: 2 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        <CardHeader className="pb-2 text-white relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Bonos Mensuales
              </CardTitle>
              <CardDescription className="text-emerald-100">Valor después de descuentos</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {bonusData.expiresInDays !== null && bonusData.expiresInDays !== undefined && (
                <Badge className="bg-white/20 text-white border-0 flex items-center backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                  >
                    {bonusData.expiresInDays} días
                  </motion.span>
                </Badge>
              )}

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className={`h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white ${isRefreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Actualizar datos</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4 text-white relative z-10">
          {/* Year/Month Selector */}
          {bonusData.availableYears && bonusData.availableYears.length > 0 && (
            <div className="mb-4">
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                      Filtrar bonificaciones
                    </h3>
                    {selectedYear && selectedMonth && (
                      <Badge className="bg-teal-500/30 text-white hover:bg-teal-500/40 border-0">
                        {getMonthName(selectedMonth)} {selectedYear}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/70 flex items-center">
                        <ArrowLeft className="h-3 w-3 mr-1 opacity-70" />
                        Año
                      </label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full bg-white/20 text-white border-white/20 rounded-lg text-sm py-1.5 px-3 h-9 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 justify-between"
                          >
                            {selectedYear ? selectedYear : "Seleccionar año"}
                            <Calendar className="h-4 w-4 ml-2 opacity-70" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-gradient-to-br from-emerald-500/95 to-teal-600/95 text-white border-white/20 backdrop-blur-md">
                          <DialogHeader>
                            <DialogTitle className="text-white flex items-center">
                              <Calendar className="h-5 w-5 mr-2" />
                              Seleccionar año
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100">
                              Elige el año para filtrar los datos de bonificaciones
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="mt-4 max-h-[40vh]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {bonusData.availableYears &&
                                bonusData.availableYears.map((year) => (
                                  <Button
                                    key={year}
                                    variant="outline"
                                    className={`border-white/20 hover:bg-white/20 hover:text-white ${
                                      selectedYear === year
                                        ? "bg-white/30 border-white/40 ring-2 ring-white/30"
                                        : "bg-white/10"
                                    }`}
                                    onClick={() => {
                                      setSelectedYear(year)
                                      setSelectedMonth(null)
                                      fetchBonusData(year, null)
                                    }}
                                  >
                                    {year}
                                    {selectedYear === year && <CheckCircle2 className="h-4 w-4 ml-2" />}
                                  </Button>
                                ))}
                            </div>
                          </ScrollArea>
                          <DialogFooter className="flex flex-row justify-between items-center mt-4 pt-3 border-t border-white/20">
                            <Button
                              variant="ghost"
                              className="text-white/80 hover:text-white hover:bg-white/20"
                              onClick={() => {
                                setSelectedYear(null)
                                fetchBonusData(null, null)
                              }}
                            >
                              Limpiar selección
                            </Button>
                            <DialogClose asChild>
                              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                                Aceptar
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/70 flex items-center">
                        <ArrowRight className="h-3 w-3 mr-1 opacity-70" />
                        Mes
                      </label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full bg-white/20 text-white border-white/20 rounded-lg text-sm py-1.5 px-3 h-9 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 justify-between"
                            disabled={!selectedYear}
                          >
                            {selectedMonth ? getMonthName(selectedMonth) : "Seleccionar mes"}
                            <Calendar className="h-4 w-4 ml-2 opacity-70" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-gradient-to-br from-emerald-500/95 to-teal-600/95 text-white border-white/20 backdrop-blur-md">
                          <DialogHeader>
                            <DialogTitle className="text-white flex items-center">
                              <Calendar className="h-5 w-5 mr-2" />
                              Seleccionar mes
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100">
                              Elige el mes para filtrar los datos de bonificaciones
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                                const isAvailable = bonusData.availableMonths?.includes(month) || false
                                return (
                                  <Button
                                    key={month}
                                    variant="outline"
                                    className={`border-white/20 hover:bg-white/20 hover:text-white ${
                                      selectedMonth === month
                                        ? "bg-white/30 border-white/40 ring-2 ring-white/30"
                                        : "bg-white/10"
                                    } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                                    disabled={!isAvailable}
                                    onClick={() => {
                                      if (isAvailable) {
                                        setSelectedMonth(month)
                                        fetchBonusData(selectedYear, month)
                                      }
                                    }}
                                  >
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs">{getMonthName(month).substring(0, 3)}</span>
                                      <span className="text-lg font-semibold">{month}</span>
                                    </div>
                                    {selectedMonth === month && (
                                      <CheckCircle2 className="h-4 w-4 absolute top-1 right-1" />
                                    )}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                          <DialogFooter className="flex flex-row justify-between items-center mt-4 pt-3 border-t border-white/20">
                            <Button
                              variant="ghost"
                              className="text-white/80 hover:text-white hover:bg-white/20"
                              onClick={() => {
                                setSelectedMonth(null)
                                fetchBonusData(selectedYear, null)
                              }}
                            >
                              Limpiar selección
                            </Button>
                            <DialogClose asChild>
                              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                                Aceptar
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                {(selectedYear || selectedMonth) && (
                  <motion.div
                    className="bg-white/5 border-t border-white/10 px-3 py-2 flex justify-between items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-xs text-white/60">Filtros aplicados</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/20"
                      onClick={handleClearFilters}
                    >
                      Limpiar filtros
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          <div className="flex items-baseline mb-4">
            <motion.p
              className="text-4xl font-bold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {formatCurrency(animatedBonus)}
            </motion.p>

            {/* Enhanced sparkle animation */}
            <motion.div
              className="ml-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </motion.div>
            </motion.div>
          </div>

          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-2 backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.max(0, 100 - deductionPercentage)}%`,
              }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="h-full rounded-full relative"
              style={{
                background: `linear-gradient(90deg, rgba(255,255,255,0.9) 0%, ${
                  deductionPercentage <= 10
                    ? "rgba(52,211,153,0.9)"
                    : deductionPercentage <= 30
                      ? "rgba(251,191,36,0.9)"
                      : "rgba(239,68,68,0.9)"
                } 100%)`,
              }}
            >
              {/* Enhanced glow effect */}
              <motion.div
                className="absolute top-0 right-0 h-full w-6 bg-white/80 blur-sm"
                animate={{
                  x: [0, 8, 0],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  ease: "easeInOut",
                }}
              />

              {/* Animated dots along the progress bar */}
              {deductionPercentage < 90 &&
                [...Array(Math.floor((100 - deductionPercentage) / 20))].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"
                    style={{
                      left: `${(i + 1) * 20}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      delay: i * 0.3,
                    }}
                  />
                ))}
            </motion.div>
          </div>

          <div className="flex justify-between text-xs text-white/70 mb-4">
            <span>Deducción: {formatCurrency(displayData.deductionAmount || 0)}</span>
            <span>Base: {formatCurrency(displayData.bonusValue || 0)}</span>
          </div>

          <motion.div
            className="bg-teal-600/30 backdrop-blur-sm rounded-lg p-4 mb-3 border border-white/10"
            whileHover={{
              backgroundColor: "rgba(13, 148, 136, 0.4)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              y: -2,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <div className="flex items-center text-teal-100 text-xs mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  <span>Valor base</span>
                </div>
                <span className="font-medium">{formatCurrency(displayData.bonusValue || 0)}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center text-teal-100 text-xs mb-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Deducción</span>
                </div>
                <span className="font-medium text-red-200">-{formatCurrency(displayData.deductionAmount || 0)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-teal-500/30 flex justify-between items-center">
              <span className="text-teal-100 text-xs">Valor final</span>
              <motion.span
                className="font-bold text-lg"
                animate={{
                  scale: [1, 1.03, 1],
                  textShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 3px rgba(255,255,255,0.5)",
                    "0 0 0px rgba(255,255,255,0)",
                  ],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                {formatCurrency(displayData.finalValue || 0)}
              </motion.span>
            </div>
          </motion.div>

          {bonusData.deductions && bonusData.deductions.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeductions(!showDeductions)}
              className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm group"
            >
              {showDeductions ? "Ocultar deducciones" : `Ver deducciones (${bonusData.deductions.length})`}
              <motion.div animate={{ rotate: showDeductions ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="h-4 w-4 ml-1" />
              </motion.div>
            </Button>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm border border-white/10 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-300" />
                <span>Sin deducciones - Bono completo</span>
              </div>
            </div>
          )}

          <AnimatePresence>
            {showDeductions && bonusData.deductions && bonusData.deductions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 overflow-hidden"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 max-h-60 overflow-y-auto">
                  <h6 className="font-medium text-white/90 mb-2 text-sm flex items-center justify-between">
                    <span>Deducciones aplicadas:</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Total: {formatCurrency(bonusData.deductions.reduce((sum, d) => sum + d.monto, 0))}
                    </span>
                  </h6>
                  <div className="space-y-2">
                    {bonusData.deductions.map((deduction) => (
                      <motion.div
                        key={deduction.id}
                        className="bg-white/10 rounded-lg p-3 text-xs border border-white/10"
                        whileHover={{
                          backgroundColor: "rgba(255, 255, 255, 0.15)",
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          y: -1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{deduction.concepto}</span>
                          <Badge variant="outline" className="border-white/20 text-white">
                            {typeof deduction.porcentaje === "number"
                              ? `${deduction.porcentaje}%`
                              : deduction.porcentaje}
                          </Badge>
                        </div>
                        <div className="mt-2 text-white/70">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span>Fecha: {new Date(deduction.fechaInicio).toLocaleDateString("es-CO")}</span>
                            <span>ID: {deduction.id}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20 flex justify-between">
                          <span>Monto:</span>
                          <span className="font-medium">-{formatCurrency(deduction.monto)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-teal-700/30 backdrop-blur-sm pt-3 pb-3 border-t border-white/10 relative z-10">
          <motion.div
            className="flex items-center w-full justify-center text-white/90 text-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <Star className="h-4 w-4 mr-2" />
            {deductionPercentage <= 10
              ? "¡Bonificación completa!"
              : deductionPercentage <= 30
                ? "Bonificación parcial"
                : "Bonificación reducida"}
          </motion.div>
        </CardFooter>
      </motion.div>
    </TooltipProvider>
  )
}

// Enhanced ScoreCard component with more interactive elements
function ScoreCard({
  score,
  monthlyScores,
}: {
  score: number
  monthlyScores?: {
    year: number
    month: number
    monthName: string
    score: number
  }[]
}) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)

  // Use monthly data if available
  const displayData =
    monthlyScores && monthlyScores.length > 0
      ? monthlyScores[selectedMonthIndex]
      : {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          monthName: getMonthName(new Date().getMonth() + 1),
          score: score,
        }

  const animatedScore = useAnimatedCounter(displayData.score, 1500, 600)
  const levels = [
    { name: "Bronce", threshold: 50, color: "text-amber-700" },
    { name: "Plata", threshold: 75, color: "text-gray-400" },
    { name: "Oro", threshold: 90, color: "text-yellow-500" },
    { name: "Platino", threshold: 95, color: "text-blue-300" },
  ]

  const currentLevel = levels.reduce((prev, curr) => {
    return displayData.score >= curr.threshold ? curr : prev
  }, levels[0])

  const nextLevel = levels.find((level) => level.threshold > displayData.score) || levels[levels.length - 1]
  const pointsToNextLevel = nextLevel.threshold - displayData.score

  // Navigate through available months
  const navigateMonth = (direction: "prev" | "next") => {
    if (!monthlyScores || !monthlyScores.length) return

    if (direction === "prev" && selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1)
    } else if (direction === "next" && selectedMonthIndex < monthlyScores.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1)
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="relative bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg overflow-hidden"
    >
      <DecorativePattern variant="circles" />

      {/* Enhanced decorative elements with animations */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 bg-white/10 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 5,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-24 h-24 -mb-8 -ml-8 bg-white/10 rounded-full blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 4,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Enhanced animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
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
              duration: 2 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <CardHeader className="pb-2 text-white relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Mi Puntaje Mensual
            </CardTitle>
            <CardDescription className="text-teal-100">Rendimiento general</CardDescription>
          </div>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <motion.span
              animate={{
                color: ["#ffffff", currentLevel.color.replace("text-", "#"), "#ffffff"],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
              }}
            >
              Nivel {currentLevel.name}
            </motion.span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 text-white relative z-10">
        {/* Month navigation */}
        {monthlyScores && monthlyScores.length > 0 && (
          <div className="flex items-center justify-between mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 h-8 w-8"
              onClick={() => navigateMonth("prev")}
              disabled={selectedMonthIndex <= 0}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">
                {displayData.monthName} {displayData.year}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 h-8 w-8"
              onClick={() => navigateMonth("next")}
              disabled={selectedMonthIndex >= monthlyScores.length - 1}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex justify-center my-4">
          <div className="relative w-36 h-36">
            {/* Enhanced background circle with subtle animation */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.2) 100%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Enhanced background circle with gradient */}
              <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                </linearGradient>
              </defs>
              |
              <circle cx="50" cy="50" r="45" fill="url(#bgGradient)" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                strokeWidth="4"
                stroke="rgba(255,255,255,0.5)"
                style={{
                  strokeDasharray: 264,
                  strokeDashoffset: 264 - (animatedScore / 100) * 264,
                }}
                animate={{
                  strokeDashoffset: [264, 264 - (animatedScore / 100) * 264],
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.span className="text-4xl font-bold text-white drop-shadow-md">{animatedScore}</motion.span>
            </motion.div>
          </div>
        </div>

        <div className="text-center text-white/80 mb-3">
          {pointsToNextLevel > 0 ? (
            <span>
              Faltan <span className="font-medium">{pointsToNextLevel} puntos</span> para alcanzar el nivel{" "}
              <span className="font-medium">{nextLevel.name}</span>
            </span>
          ) : (
            <span>¡Felicidades! Has alcanzado el nivel máximo</span>
          )}
        </div>

        <motion.div
          className="flex items-center text-teal-100 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm border border-white/10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            x: 2,
          }}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          <span>Progreso del mes</span>
        </motion.div>
      </CardContent>
      <CardFooter className="bg-cyan-700/30 backdrop-blur-sm pt-3 pb-3 border-t border-white/10 relative z-10">
        <motion.div
          className="flex items-center w-full justify-center text-white/90 text-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <Star className="h-4 w-4 mr-2" />
          Sigue mejorando tu puntaje
        </motion.div>
      </CardFooter>
    </motion.div>
  )
}

// Main ProgressCards component
export default function ProgressCards({ userCode }: { userCode: string }) {
  // Valores por defecto para bonusData
  const defaultBonusData: BonusData = {
    baseBonus: null,
    deductionPercentage: null,
    deductionAmount: null,
    finalBonus: null,
    expiresInDays: null,
    bonusesByYear: null,
    deductions: null,
    lastMonthData: null,
    availableYears: [],
    availableMonths: [],
  }

  const [bonusData, setBonusData] = useState<BonusData>(defaultBonusData)
  const [isLoadingBonus, setIsLoadingBonus] = useState(true)
  const [bonusError, setBonusError] = useState<string | null>(null)
  const [monthlyBonusData, setMonthlyBonusData] = useState<
    {
      year: number
      month: number
      monthName: string
      bonusValue: number
      deductionAmount: number
      finalValue: number
    }[]
  >([])

  // Fetch bonus data
  const fetchBonusData = async () => {
    try {
      // Set default values immediately to show something
      setBonusData({
        ...defaultBonusData,
        baseBonus: 130000, // Default value
        finalBonus: 130000, // Default value
        deductionPercentage: 0,
        deductionAmount: 0,
      })

      setIsLoadingBonus(true)

      // Cargar datos de bonos desde la API
      const response = await fetch(`/api/user/bonuses?codigo=${userCode}&_t=${Date.now()}`)

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      // Si la API existe, usar los datos reales
      const data = await response.json()
      console.log("Main component received bonus data:", data)

      if (data.error) {
        throw new Error(data.error || "Error al cargar los datos de bonos")
      }

      setBonusData({
        baseBonus: data.baseBonus || data.summary?.totalProgrammed || 130000,
        deductionPercentage: data.deductionPercentage || (data.summary ? 100 - data.summary.percentage : 0),
        deductionAmount:
          data.deductionAmount ||
          (data.summary?.totalProgrammed && data.summary?.totalExecuted
            ? data.summary.totalProgrammed - data.summary.totalExecuted
            : 0),
        finalBonus: data.finalBonus || data.summary?.totalExecuted || 130000,
        expiresInDays: data.expiresInDays || null,
        bonusesByYear: data.bonusesByYear || {},
        deductions: data.deductions || [],
        lastMonthData: data.lastMonthData || null,
        availableYears: data.availableYears || [],
        availableMonths: data.availableMonths || [],
        summary: data.summary || null,
      })

      // Crear datos mensuales a partir de lastMonthData si está disponible
      if (data.lastMonthData && data.lastMonthData.year) {
        const monthlyData = [
          {
            year: data.lastMonthData.year,
            month: data.lastMonthData.month,
            monthName: data.lastMonthData.month || getMonthName(data.lastMonthData.month),
            bonusValue: data.lastMonthData.bonusValue || data.baseBonus || data.summary?.totalProgrammed || 130000,
            deductionAmount: data.lastMonthData.deductionAmount || 0,
            finalValue: data.lastMonthData.finalValue || data.finalBonus || data.summary?.totalExecuted || 130000,
          },
        ]
        setMonthlyBonusData(monthlyData)
      } else {
        // Set default monthly data if none is available
        const currentDate = new Date()
        setMonthlyBonusData([
          {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            monthName: getMonthName(currentDate.getMonth() + 1),
            bonusValue: 130000,
            deductionAmount: 0,
            finalValue: 130000,
          },
        ])
      }

      setBonusError(null)
    } catch (err) {
      console.error("Error fetching bonus data:", err)
      setBonusError(err instanceof Error ? err.message : "Error desconocido")

      // Set default values in case of error
      const currentDate = new Date()
      setBonusData({
        ...defaultBonusData,
        baseBonus: 130000,
        finalBonus: 130000,
        deductionPercentage: 0,
        deductionAmount: 0,
      })

      setMonthlyBonusData([
        {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          monthName: getMonthName(currentDate.getMonth() + 1),
          bonusValue: 130000,
          deductionAmount: 0,
          finalValue: 130000,
        },
      ])
    } finally {
      setIsLoadingBonus(false)
    }
  }

  useEffect(() => {
    // Set default values immediately
    const currentDate = new Date()
    setBonusData({
      ...defaultBonusData,
      baseBonus: 130000,
      finalBonus: 130000,
      deductionPercentage: 0,
      deductionAmount: 0,
      lastMonthData: {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        monthName: getMonthName(currentDate.getMonth() + 1),
        bonusValue: 130000,
        deductionAmount: 0,
        finalValue: 130000,
      },
    })

    setMonthlyBonusData([
      {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        monthName: getMonthName(currentDate.getMonth() + 1),
        bonusValue: 130000,
        deductionAmount: 0,
        finalValue: 130000,
      },
    ])

    // Then fetch the real data
    const fetchBonusDataWrapper = async () => {
      if (userCode) {
        try {
          await fetchBonusData()
        } catch (error) {
          console.error("Error in fetchBonusDataWrapper:", error)
          // Ensure loading state is set to false even if fetchBonusData fails
          setIsLoadingBonus(false)
        }
      } else {
        // If no userCode, set loading to false
        setIsLoadingBonus(false)
      }
    }

    fetchBonusDataWrapper()

    // Add a safety timeout to ensure loading state is never stuck
    const safetyTimeout = setTimeout(() => {
      setIsLoadingBonus(false)
    }, 10000) // 10 seconds max loading time

    return () => clearTimeout(safetyTimeout)
  }, [userCode])

  // Debug panel for troubleshooting
  const DebugPanel = () => {
    if (!DEBUG_MODE) return null

    return (
      <div className="mb-6 p-4 bg-gray-800 text-white rounded-lg text-xs font-mono">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Debug Panel</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={() => {
              fetchBonusData()
              console.log("Manual refresh triggered from debug panel")
            }}
          >
            Refresh Data
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-gray-400 mb-1">Bonus Data:</h4>
            <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(
                {
                  baseBonus: bonusData.baseBonus,
                  finalBonus: bonusData.finalBonus,
                  deductionAmount: bonusData.deductionAmount,
                  isLoading: isLoadingBonus,
                  error: bonusError,
                  availableYears: bonusData.availableYears,
                  availableMonths: bonusData.availableMonths,
                },
                null,
                2,
              )}
            </pre>
          </div>
          <div>
            <h4 className="text-gray-400 mb-1">API Info:</h4>
            <div className="bg-gray-900 p-2 rounded">
              <p>User Code: {userCode || "Not set"}</p>
              <p>API URL: {`/api/user/bonuses?codigo=${userCode}`}</p>
              <p>Loading: {isLoadingBonus ? "Yes" : "No"}</p>
              <p>Error: {bonusError || "None"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <DebugPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCode && <KilometersCard userCode={userCode} />}

        {userCode && (
          <BonusCard
            userCode={userCode}
            bonusData={bonusData}
            lastMonthData={bonusData.lastMonthData || null}
            isLoading={isLoadingBonus}
            monthlyBonusData={monthlyBonusData}
          />
        )}

        {/* El componente ScoreCard se añadirá cuando tenga su propia API */}
      </div>
    </>
  )
}
