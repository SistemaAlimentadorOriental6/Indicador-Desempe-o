"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Route,
  Gift,
  Award,
  TrendingUp,
  Clock,
  AlertTriangle,
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
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query"

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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

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

// API functions for React Query
const api = {
  fetchKilometers: async ({ userCode, year, month }: { userCode: string; year?: number; month?: number }) => {
    let url = `/api/user/kilometers?codigo=${userCode}`
    if (year) url += `&year=${year}`
    if (month) url += `&month=${month}`
    url += `&_t=${Date.now()}`

    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    
    // Manejar el nuevo formato de respuesta estandarizada
    if (!responseData.success) {
      throw new Error(responseData.error || responseData.message || "Error al cargar los datos")
    }

    // Los datos ahora vienen en responseData.data
    const apiData = responseData.data || {}
    
    // Process data - los datos ya vienen procesados desde el servicio
    const processedData = (apiData.data || []).map((item: MonthData) => ({
      ...item,
      // Asegurar que el percentage esté calculado
      percentage: item.percentage !== undefined ? item.percentage : 
        (item.valor_programacion > 0 ? Math.round((item.valor_ejecucion / item.valor_programacion) * 100) : 0),
    }))

    return {
      monthlyData: processedData,
      availableYears: apiData.availableYears || [],
      availableMonths: apiData.availableMonths || [],
      summary: apiData.summary || null,
    }
  },

  fetchBonuses: async ({ userCode, year, month }: { userCode: string; year?: number; month?: number }) => {
    let url = `/api/user/bonuses?codigo=${userCode}`
    if (year) url += `&year=${year}`
    if (month) url += `&month=${month}`
    url += `&_t=${Date.now()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
    }

    // Parse the JSON data
    const responseData = await response.json()
    
    // Manejar el nuevo formato de respuesta estandarizada
    if (!responseData.success) {
      throw new Error(responseData.error || responseData.message || "Error al cargar los datos de bonos")
    }

    // Los datos ahora vienen en responseData.data
    const data = responseData.data || {}

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

    // Create monthly data from lastMonthData if available
    let monthlyBonusData = []
    if (data.lastMonthData && data.lastMonthData.year) {
      monthlyBonusData = [
        {
          year: data.lastMonthData.year,
          month: data.lastMonthData.month,
          monthName: data.lastMonthData.monthName || getMonthName(data.lastMonthData.month),
          bonusValue: data.lastMonthData.bonusValue || baseBonus,
          deductionAmount: data.lastMonthData.deductionAmount || totalDeduction || 0,
          finalValue:
            data.lastMonthData.finalValue ||
            (data.lastMonthData.bonusValue && data.lastMonthData.deductionAmount
              ? data.lastMonthData.bonusValue - data.lastMonthData.deductionAmount
              : finalBonus),
        },
      ]
    }

    return {
      bonusData: {
        baseBonus: baseBonus,
        deductionPercentage:
          filteredDeductions.length === 0
            ? 0
            : data.deductionPercentage ||
              (data.baseBonus && totalDeduction
                ? Math.round((totalDeduction / data.baseBonus) * 100)
                : data.summary && data.summary.percentage !== undefined
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
      },
      monthlyBonusData,
    }
  },
}

// Enhanced KilometersCard component with React Query
function KilometersCard({
  userCode,
}: {
  userCode: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const queryClient = useQueryClient()

  // Main query for kilometers data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["kilometers", userCode, selectedYear, selectedMonth],
    queryFn: () =>
      api.fetchKilometers({
        userCode,
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      }),
    onSuccess: (data) => {
      // Set default selections if not already set
      if (!selectedYear && data.availableYears && data.availableYears.length) {
        setSelectedYear(data.availableYears[0])
      }

      if (!selectedMonth && data.availableMonths && data.availableMonths.length) {
        setSelectedMonth(data.availableMonths[data.availableMonths.length - 1])
      }
    },
  })

  // Find current month data
  const currentMonthData = useMemo(() => {
    if (!data?.monthlyData) return null

    if (selectedYear && selectedMonth) {
      return (
        data.monthlyData.find((item: MonthData) => item.year === selectedYear && item.month === selectedMonth) || null
      )
    } else if (data.monthlyData.length > 0) {
      return data.monthlyData[0]
    }

    return null
  }, [data?.monthlyData, selectedYear, selectedMonth])

  // Handle refresh data
  const handleRefreshData = () => {
    if (isFetching) return
    refetch()
  }

  // Use either currently selected month data or fallback to summary
  const displayData = currentMonthData || {
    year: selectedYear || new Date().getFullYear(),
    month: selectedMonth || new Date().getMonth() + 1,
    monthName: getMonthName(selectedMonth || new Date().getMonth() + 1),
    valor_programacion: data?.summary?.totalProgrammed || 0,
    valor_ejecucion: data?.summary?.totalExecuted || 0,
    percentage: data?.summary?.percentage || 0,
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
    if (!data?.availableMonths || !data.availableMonths.length) return

    const currentIndex = data.availableMonths.findIndex((m) => m === selectedMonth)
    if (currentIndex === -1) return

    if (direction === "prev" && currentIndex > 0) {
      setSelectedMonth(data.availableMonths[currentIndex - 1])
    } else if (direction === "next" && currentIndex < data.availableMonths.length - 1) {
      setSelectedMonth(data.availableMonths[currentIndex + 1])
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
          <p className="text-gray-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
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
            disabled={isFetching}
            className={`h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white ${isFetching ? "animate-spin" : ""}`}
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
                          {data?.availableYears?.map((year) => (
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
                            setSelectedMonth(null)
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
                            const isAvailable = data?.availableMonths?.includes(month) || false
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

// Enhanced BonusCard component with React Query
function BonusCard({
  userCode,
}: {
  userCode: string
}) {
  const [showDeductions, setShowDeductions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const queryClient = useQueryClient()

  // Default bonus data
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

  // Main query for bonus data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["bonuses", userCode, selectedYear, selectedMonth],
    queryFn: () =>
      api.fetchBonuses({
        userCode,
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      }),
    onSuccess: (data) => {
      // Set default selections if not already set
      if (!selectedYear && data.bonusData.availableYears && data.bonusData.availableYears.length) {
        setSelectedYear(data.bonusData.availableYears[0])
      }

      if (!selectedMonth && data.bonusData.availableMonths && data.bonusData.availableMonths.length) {
        setSelectedMonth(data.bonusData.availableMonths[data.bonusData.availableMonths.length - 1])
      }
    },
  })

  // Handle refresh data
  const handleRefreshData = () => {
    if (isFetching) return
    refetch()
  }

  // Determine display data based on filters
  const displayData = useMemo(() => {
    if (!data) return null

    // If there are monthly data and they are filtered, use those
    if (data.monthlyBonusData && data.monthlyBonusData.length > 0) {
      // Look for data that match the filters
      if (selectedYear && selectedMonth) {
        const filtered = data.monthlyBonusData.find(
          (item) => item.year === selectedYear && item.month === selectedMonth,
        )
        if (filtered) return filtered
      }

      // If no exact match, use the first element
      return data.monthlyBonusData[0]
    }

    // If there is lastMonthData, use it
    if (data.bonusData.lastMonthData) {
      return {
        year: data.bonusData.lastMonthData.year,
        month: data.bonusData.lastMonthData.month,
        monthName: data.bonusData.lastMonthData.monthName?.toLowerCase(),
        bonusValue: data.bonusData.lastMonthData.bonusValue,
        deductionAmount: data.bonusData.lastMonthData.deductionAmount,
        finalValue: data.bonusData.lastMonthData.finalValue,
      }
    }

    // If there is base data but no specific month data
    if (data.bonusData.baseBonus !== null && data.bonusData.finalBonus !== null) {
      return {
        year: selectedYear || new Date().getFullYear(),
        month: selectedMonth || new Date().getMonth() + 1,
        monthName: selectedMonth ? getMonthName(selectedMonth).toLowerCase() : "",
        bonusValue: data.bonusData.baseBonus,
        deductionAmount: data.bonusData.deductionAmount || 0,
        finalValue: data.bonusData.finalBonus,
      }
    }

    return null
  }, [data, selectedYear, selectedMonth])

  // Calculate values
  const bonusValue = displayData?.finalValue || 0
  const animatedBonus = useAnimatedCounter(bonusValue)
  const deductionPercentage =
    displayData?.bonusValue && displayData.bonusValue > 0 && displayData.deductionAmount != null
      ? Math.min(100, Math.round((displayData.deductionAmount / displayData.bonusValue) * 100))
      : 0

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "$0"
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Clear filters
  const handleClearFilters = () => {
    setSelectedYear(null)
    setSelectedMonth(null)
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
          <p className="text-gray-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
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
              {data?.bonusData.expiresInDays !== null && data?.bonusData.expiresInDays !== undefined && (
                <Badge className="bg-white/20 text-white border-0 flex items-center backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                  >
                    {data.bonusData.expiresInDays} días
                  </motion.span>
                </Badge>
              )}

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshData}
                disabled={isFetching}
                className={`h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white ${isFetching ? "animate-spin" : ""}`}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Actualizar datos</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4 text-white relative z-10">
          {/* Year/Month Selector */}
          {data?.bonusData.availableYears && data.bonusData.availableYears.length > 0 && (
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
                              {data.bonusData.availableYears &&
                                data.bonusData.availableYears.map((year) => (
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
                                const isAvailable = data.bonusData.availableMonths?.includes(month) || false
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

          {data?.bonusData.deductions && data.bonusData.deductions.length > 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm border border-white/10 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-300" />
                <span>Sin deducciones - Bono completo</span>
              </div>
            </div>
          ) : null}

          <AnimatePresence>
            {showDeductions && data?.bonusData.deductions && data.bonusData.deductions.length > 0 && (
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
                      Total: {formatCurrency(data.bonusData.deductions.reduce((sum, d) => sum + d.monto, 0))}
                    </span>
                  </h6>
                  <div className="space-y-2">
                    {data.bonusData.deductions.map((deduction) => (
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

// Main ProgressCards component with React Query
function ProgressCardsWithProvider({ userCode }: { userCode: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProgressCards userCode={userCode} />
    </QueryClientProvider>
  )
}

// Main ProgressCards component
function ProgressCards({ userCode }: { userCode: string }) {
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
              queryClient.invalidateQueries({ queryKey: ["kilometers"] })
              queryClient.invalidateQueries({ queryKey: ["bonuses"] })
              console.log("Manual refresh triggered from debug panel")
            }}
          >
            Refresh Data
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-gray-400 mb-1">Cache Info:</h4>
            <div className="bg-gray-900 p-2 rounded">
              <p>User Code: {userCode || "Not set"}</p>
              <p>Kilometers Cache: {queryClient.getQueryState(["kilometers", userCode])?.status || "unknown"}</p>
              <p>Bonuses Cache: {queryClient.getQueryState(["bonuses", userCode])?.status || "unknown"}</p>
            </div>
          </div>
          <div>
            <h4 className="text-gray-400 mb-1">React Query:</h4>
            <div className="bg-gray-900 p-2 rounded">
              <p>Cache Time: 10 minutes</p>
              <p>Stale Time: 5 minutes</p>
              <p>Auto Refetch: Disabled</p>
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
        {userCode && <BonusCard userCode={userCode} />}
        {/* El componente ScoreCard se añadirá cuando tenga su propia API */}
      </div>
    </>
  )
}

export default ProgressCardsWithProvider
