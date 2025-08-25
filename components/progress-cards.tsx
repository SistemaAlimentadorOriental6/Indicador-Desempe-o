"use client"

import { useRef } from "react"
import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw, Target, BarChart3, Car } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const cardVariants = {
  initial: { y: 30, opacity: 0, scale: 0.95 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      duration: 0.6,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

function DecorativePattern({
  className = "",
  variant = "dots",
  color = "currentColor",
}: {
  className?: string
  variant?: "dots" | "grid" | "waves" | "circles"
  color?: string
}) {
  if (variant === "waves") {
    return (
      <div className={`absolute inset-0 overflow-hidden opacity-5 pointer-events-none ${className}`}>
        <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <motion.path
            d="M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z"
            fill={color}
            opacity="0.3"
            animate={{
              d: [
                "M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z",
                "M 0 1000 Q 250 900 500 1000 Q 750 900 1000 1000 L 1000 0 L 0 0 Z",
                "M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z",
              ],
            }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 12, ease: "easeInOut" }}
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={`absolute inset-0 overflow-hidden opacity-5 pointer-events-none ${className}`}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={color} />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
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

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`)
    }

    const responseData = await response.json()
    if (!responseData.success) {
      throw new Error(responseData.error || "Error al cargar los datos")
    }

    const apiData = responseData.data || {}
    const processedData = (apiData.data || []).map((item: MonthData) => ({
      ...item,
      percentage:
        item.percentage !== undefined
          ? item.percentage
          : item.valor_programacion > 0
            ? Math.round((item.valor_ejecucion / item.valor_programacion) * 100)
            : 0,
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

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`)
    }

    const responseData = await response.json()
    if (!responseData.success) {
      throw new Error(responseData.error || "Error al cargar los datos de bonos")
    }

    const data = responseData.data || {}

    // If the response is for a single month, the data is directly in `data`
    if (month && data && !data.availableYears) {
      const monthData = {
        year: year,
        month: month,
        monthName: getMonthName(month),
        bonusValue: data.baseBonus,
        deductionAmount: data.deductionAmount,
        finalValue: data.finalBonus,
        ...data, // include any other properties from the response
      }

      return {
        monthlyBonusData: [monthData],
        // Also return available years/months if they are part of the initial data state
        // This part depends on how you want to handle state updates.
        // For now, we focus on returning the single month data correctly formatted.
      }
    }

    const filteredDeductions = data.deductions || []
    const totalDeduction = filteredDeductions.reduce(
      (sum: number, deduction: { monto: number }) => sum + deduction.monto,
      0,
    )
    const baseBonus = data.baseBonus || 130000
    const finalBonus = filteredDeductions.length === 0 ? baseBonus : baseBonus - totalDeduction

    return {
      bonusData: {
        availableYears: data.availableYears || [],
        availableMonths: data.availableMonths || [],
        lastMonthData: data.lastMonthData || null,
      },
      monthlyBonusData: data.monthlyBonusData || [],
      summary: {
        baseBonus,
        finalBonus,
        totalDeduction,
        deductions: filteredDeductions,
      },
    }
  },
}

const KilometersCard: React.FC<{ userCode: string }> = ({ userCode }) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await api.fetchKilometers({
        userCode,
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      })
      setData(result)

      // Set defaults if not set
      if (!selectedYear && result.availableYears?.length) {
        setSelectedYear(result.availableYears[0])
      }
      if (!selectedMonth && result.availableMonths?.length) {
        setSelectedMonth(result.availableMonths[result.availableMonths.length - 1])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userCode) {
      fetchData()
    }
  }, [userCode, selectedYear, selectedMonth])

  const currentMonthData = useMemo(() => {
    if (!data?.monthlyData) return null
    if (selectedYear && selectedMonth) {
      return (
        data.monthlyData.find((item: MonthData) => item.year === selectedYear && item.month === selectedMonth) || null
      )
    }
    return data.monthlyData[0] || null
  }, [data, selectedYear, selectedMonth])

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
          <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => fetchData()}>
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
      className="w-full h-full"
    >
      <Card className="relative bg-gradient-to-br from-white via-green-50/30 to-white border-2 border-green-100 shadow-xl overflow-hidden backdrop-blur-sm h-full flex flex-col">
        <DecorativePattern variant="waves" color="#10b981" />

        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />

        <CardHeader className="pb-3 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                  Kilómetros
                </CardTitle>
                <CardDescription className="text-green-600/70 font-medium text-sm">
                  {displayData.monthName} {displayData.year}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="h-9 px-3 border-green-200 hover:bg-green-50 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} text-green-600`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 relative z-10 pb-4">
          {/* Month/Year Selectors - Compact */}
          <div className="flex gap-2">
            <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="flex-1 h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {data?.availableYears?.map((year: number) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="flex-1 h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {data?.availableMonths?.map((month: number) => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main Metric - Compact */}
          <div className="text-center py-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
              {formatNumber(animatedKm)}
            </div>
            <div className="text-sm text-green-600/70 font-medium">
              de {formatNumber(Number(displayData.valor_programacion))} km
            </div>
          </div>

          {/* Progress Bar - Compact */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">Progreso</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                {animatedKmPercentage}%
              </Badge>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2.5 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, animatedKmPercentage)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const BonusCard: React.FC<{ userCode: string }> = ({ userCode }) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await api.fetchBonuses({
        userCode,
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      })
      setData(result)

      if (!selectedYear && result.bonusData.availableYears?.length) {
        setSelectedYear(result.bonusData.availableYears[0])
      }
      if (!selectedMonth && result.bonusData.availableMonths?.length) {
        setSelectedMonth(result.bonusData.availableMonths[result.bonusData.availableMonths.length - 1])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userCode) {
      fetchData()
    }
  }, [userCode, selectedYear, selectedMonth])

  const displayData = useMemo(() => {
    if (!data) return null
    if (data.monthlyBonusData?.length > 0) {
      if (selectedYear && selectedMonth) {
        const filtered = data.monthlyBonusData.find(
          (item) => item.year === selectedYear && item.month === selectedMonth,
        )
        if (filtered) return filtered
      }
      return data.monthlyBonusData[0]
    }
    return data.bonusData.lastMonthData
  }, [data, selectedYear, selectedMonth])

  const percentage = useMemo(() => {
    if (!displayData) return 0
    const base = displayData.bonusValue || 0
    const final = displayData.finalValue || 0
    if (base > 0) {
      return Math.max(0, Math.round((final / base) * 100))
    }
    return 100 // If no base, assume 100% unless there are deductions
  }, [displayData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "decimal",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="w-full h-full"
    >
      <Card className="relative bg-gradient-to-br from-white via-green-50/30 to-white border-2 border-green-100 shadow-xl overflow-hidden backdrop-blur-sm h-full flex flex-col">
        <DecorativePattern variant="dots" color="#3b82f6" />

        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-14 translate-x-14" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-10 -translate-x-10" />

        <CardHeader className="pb-3 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                  Bonificaciones
                </CardTitle>
                <CardDescription className="text-green-600/70 font-medium text-sm">
                  {displayData?.monthName} {displayData?.year}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="h-9 px-3 border-green-200 hover:bg-green-50 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} text-green-600`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 relative z-10 pb-4">
          {/* Month/Year Selectors - Compact */}
          <div className="flex gap-2">
            <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="flex-1 h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {data?.bonusData.availableYears?.map((year: number) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="flex-1 h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {data?.bonusData.availableMonths?.map((month: number) => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main Metric - Compact */}
          <div className="text-center py-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
              ${displayData ? formatCurrency(displayData.finalValue || 0) : "0"}
            </div>
            <div className="text-sm text-green-600/70 font-medium">
              de ${displayData ? formatCurrency(displayData.bonusValue || 0) : "0"}
            </div>
          </div>

          {/* Progress Bar - Compact */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">Eficiencia</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                {percentage}%
              </Badge>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2.5 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, percentage)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stats - Compact */}
          {displayData?.deductionAmount && displayData.deductionAmount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-xs text-red-600 font-medium">Deducción</div>
                  <div className="text-sm font-bold text-red-700">-${formatCurrency(displayData.deductionAmount)}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const AnnualProgressCard: React.FC<{ userCode: string }> = ({ userCode }) => {
  const [data, setData] = useState<any>(null)
  const [bonusData, setBonusData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const fetchData = useCallback(
    async (year: number) => {
      try {
        setIsLoading(true)
        setError(null)

        const [kmResult, bonusResult] = await Promise.all([
          api.fetchKilometers({
            userCode,
            year: year,
          }),
          api.fetchBonuses({
            userCode,
            year: year,
          }),
        ])

        setData(kmResult)
        setBonusData(bonusResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    },
    [userCode],
  )

  useEffect(() => {
    if (userCode) {
      if (selectedYear) {
        fetchData(selectedYear)
      } else {
        // First, get available years to then fetch data for the latest one.
        setIsLoading(true)
        api
          .fetchKilometers({ userCode })
          .then(result => {
            if (result.availableYears?.length) {
              // Set the fetched years in the state of the parent component if needed,
              // but for this card, just select the most recent year.
              setSelectedYear(result.availableYears[0])
            } else {
              setIsLoading(false)
            }
          })
          .catch(err => {
            setError(err instanceof Error ? err.message : "Error desconocido")
            setIsLoading(false)
          })
      }
    }
  }, [userCode, selectedYear, fetchData])

  // Calculate annual totals and percentages with monthly breakdown
  const annualData = useMemo(() => {
    if (!data || !bonusData || !selectedYear) return null

    // 1. Calculate Kilometer Totals
    const yearKmData = data.monthlyData?.filter((item: any) => item.year === selectedYear) || []
    const totalKmExecuted = yearKmData.reduce((sum: number, item: any) => sum + Number(item.valor_ejecucion || 0), 0)
    const totalKmProgrammed = yearKmData.reduce(
      (sum: number, item: any) => sum + Number(item.valor_programacion || 0),
      0,
    )
    const kmPercentage =
      totalKmProgrammed > 0 ? Math.max(0, Math.round((totalKmExecuted / totalKmProgrammed) * 100)) : 0

    // 2. Calculate Bonus Totals
    let totalBonusBase = 0
    let totalBonusFinal = 0
    let totalDeductions = 0

    const monthsWithData = yearKmData.length
    if (monthsWithData > 0) {
      const baseForYear = getBaseBonusForYear(selectedYear)
      totalBonusBase = baseForYear * monthsWithData

      // The summary from the year-long API call contains the total deductions for the year so far
      if (bonusData.summary && bonusData.summary.totalDeduction !== undefined) {
        totalDeductions = bonusData.summary.totalDeduction
      }

      totalBonusFinal = totalBonusBase - totalDeductions
    }

    // 3. Calculate Bonus Percentage (0-100%)
    let bonusPercentage = 100
    if (totalBonusBase > 0) {
      bonusPercentage = Math.min(100, Math.max(0, Math.round((totalBonusFinal / totalBonusBase) * 100)))
    }

    // 4. Calculate Combined Percentage (0-100%)
    const combinedPercentage = Math.max(0, Math.round((kmPercentage + bonusPercentage) / 2))

    return {
      year: selectedYear,
      kilometers: {
        executed: totalKmExecuted,
        programmed: totalKmProgrammed,
        percentage: kmPercentage,
      },
      bonus: {
        base: Math.max(0, totalBonusBase),
        final: Math.max(0, totalBonusFinal),
        percentage: bonusPercentage,
        deductions: Math.max(0, totalDeductions),
      },
      combinedPercentage,
      monthsWithData: yearKmData.length,
      monthlyBreakdown: [], // Removed as per previous request
    }
  }, [data, bonusData, selectedYear])

  const animatedCombinedPercentage = useAnimatedCounter(annualData?.combinedPercentage || 0)

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Error al cargar datos anuales
          </CardTitle>
          <CardDescription>Por favor, inténtalo de nuevo más tarde.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => fetchData(selectedYear || 0)}>
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
      className="w-full h-full"
    >
      <Card className="relative bg-gradient-to-br from-white via-green-50/30 to-white border-2 border-green-100 shadow-xl overflow-hidden backdrop-blur-sm h-full flex flex-col">
        <DecorativePattern variant="grid" color="#8b5cf6" />

        <CardHeader className="pb-3 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                  Progreso Anual
                </CardTitle>
                <CardDescription className="text-green-600/70 font-medium text-sm">
                  {annualData?.year || selectedYear}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(selectedYear || 0)}
              disabled={isLoading}
              className="h-9 px-3 border-green-200 hover:bg-green-50 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} text-green-600`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 relative z-10 pb-4">
          {/* Year Selector - Compact */}
          <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-full h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {data?.availableYears?.map((year: number) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Main Metric - Compact */}
          <div className="text-center py-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
              {animatedCombinedPercentage}%
            </div>
            <div className="text-sm text-green-600/70 font-medium">Rendimiento general</div>
          </div>

          {/* Progress Indicators - Compact */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-green-700">Kilómetros</span>
              <span className="text-xs font-bold text-green-700">{annualData?.kilometers.percentage || 0}%</span>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, annualData?.kilometers.percentage || 0)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-green-700">Bonificaciones</span>
              <span className="text-xs font-bold text-green-700">{annualData?.bonus.percentage || 0}%</span>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, annualData?.bonus.percentage || 0)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>

          {/* Summary Stats - Compact */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
            <div className="text-xs text-green-600/70 font-medium mb-1">Meses con datos</div>
            <div className="text-lg font-bold text-green-700">{annualData?.monthsWithData || 0}/12</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const MonthlyProgressCard: React.FC<{ userCode: string }> = ({ userCode }) => {
  const [data, setData] = useState<any>(null)
  const [bonusData, setBonusData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch both kilometers and bonus data for the specific month
      const [kmResult, bonusResult] = await Promise.all([
        api.fetchKilometers({
          userCode,
          year: selectedYear || undefined,
          month: selectedMonth || undefined,
        }),
        api.fetchBonuses({
          userCode,
          year: selectedYear || undefined,
          month: selectedMonth || undefined,
        }),
      ])

      setData(kmResult)
      setBonusData(bonusResult)

      // Set defaults if not set
      if (!selectedYear && kmResult.availableYears?.length) {
        setSelectedYear(kmResult.availableYears[0])
      }
      if (!selectedMonth && kmResult.availableMonths?.length) {
        setSelectedMonth(kmResult.availableMonths[kmResult.availableMonths.length - 1])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userCode) {
      fetchData()
    }
  }, [userCode, selectedYear, selectedMonth])

  // Calculate monthly combined performance
  const monthlyData = useMemo(() => {
    if (!data || !bonusData || !selectedYear || !selectedMonth) return null

    // Get kilometers data for the specific month
    const kmMonthData = data.monthlyData?.find(
      (item: any) => item.year === selectedYear && item.month === selectedMonth,
    )

    // Get bonus data for the specific month
    let bonusMonthData = bonusData?.monthlyBonusData?.find(
      (item: any) => item.year === selectedYear && item.month === selectedMonth,
    )

    // If monthlyBonusData is empty but we have bonusData, use the direct data
    if (!bonusMonthData && bonusData?.bonusData) {
      bonusMonthData = {
        year: selectedYear,
        month: selectedMonth,
        bonusValue: bonusData.summary?.baseBonus || getBaseBonusForYear(selectedYear),
        baseBonus: bonusData.summary?.baseBonus || getBaseBonusForYear(selectedYear),
        finalValue: bonusData.summary?.finalBonus,
        finalBonus: bonusData.summary?.finalBonus,
        deductionAmount: bonusData.summary?.totalDeduction || 0,
      }
    }

    if (!kmMonthData && !bonusMonthData) return null

    const kmPercentage = kmMonthData?.percentage || 0

    // Handle bonus data with more robust logic
    let baseBonus = bonusMonthData?.bonusValue || bonusMonthData?.baseBonus || 0
    if (!baseBonus && selectedYear) {
      // Fallback to year-specific base bonus if no bonus data is found for the month
      baseBonus = getBaseBonusForYear(selectedYear)
    }

    const deductionAmount = bonusMonthData?.deductionAmount || 0
    const finalBonus = baseBonus - deductionAmount
    let bonusPercentage = 0

    if (baseBonus > 0) {
      bonusPercentage = Math.round((finalBonus / baseBonus) * 100)
    } else if (bonusMonthData) {
      // If there's data but baseBonus is 0, it might still be 100% if final is also 0
      bonusPercentage = 100
    }

    // Calculate combined performance percentage
    const combinedPercentage = Math.round((kmPercentage + bonusPercentage) / 2)

    return {
      year: selectedYear,
      month: selectedMonth,
      monthName: getMonthName(selectedMonth),
      kilometers: {
        executed: kmMonthData?.valor_ejecucion || 0,
        programmed: kmMonthData?.valor_programacion || 0,
        percentage: kmPercentage,
      },
      bonus: {
        base: baseBonus,
        final: finalBonus,
        percentage: bonusPercentage,
        deduction: deductionAmount,
      },
      combinedPercentage,
    }
  }, [data, bonusData, selectedYear, selectedMonth])

  const animatedCombinedPercentage = useAnimatedCounter(monthlyData?.combinedPercentage || 0)

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Error al cargar datos mensuales
          </CardTitle>
          <CardDescription>Por favor, inténtalo de nuevo más tarde.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="w-full">
      <Card className="relative bg-gradient-to-br from-white via-green-50/30 to-white border-2 border-green-100 shadow-xl overflow-hidden backdrop-blur-sm">
        <DecorativePattern variant="dots" color="#10b981" />

        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                  Progreso Mensual
                </CardTitle>
                <CardDescription className="text-green-600/70 font-medium">
                  Rendimiento detallado del mes
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="h-10 px-4 border-green-200 hover:bg-green-50 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} text-green-600`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <div className="flex gap-3">
            <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-36 h-10 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm">
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {data?.availableYears?.map((year: number) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="w-36 h-10 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {data?.availableMonths?.map((month: number) => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2024, month - 1).toLocaleDateString("es-ES", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {monthlyData ? (
            <div className="space-y-6">
              {/* Combined Performance Score */}
              <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl p-6 border border-green-100 shadow-sm">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-semibold">
                      Rendimiento {monthlyData.monthName} {monthlyData.year}
                    </span>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                    {animatedCombinedPercentage}%
                  </div>
                  <p className="text-green-600 text-sm">Promedio de kilómetros y bonificaciones</p>
                </div>

                <div className="relative w-full bg-green-100 rounded-full h-4 mb-6 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(monthlyData.combinedPercentage, 100)}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </div>

                {/* Detailed breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kilometers Section */}
                  <div className="bg-white/60 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700">Kilómetros</span>
                      <Badge className="bg-green-100 text-green-700 border-0 ml-auto">
                        {monthlyData.kilometers.percentage}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Ejecutado:</span>
                        <span className="font-medium">{monthlyData.kilometers.executed.toLocaleString()} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Programado:</span>
                        <span className="font-medium">{monthlyData.kilometers.programmed.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Bonus Section */}
                  <div className="bg-white/60 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700">Bonificaciones</span>
                      <Badge className="bg-green-100 text-green-700 border-0 ml-auto">
                        {monthlyData.bonus.percentage}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Bono Final:</span>
                        <span className="font-medium">${monthlyData.bonus.final.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Bono Base:</span>
                        <span className="font-medium">${monthlyData.bonus.base.toLocaleString()}</span>
                      </div>
                      {monthlyData.bonus.deduction > 0 && (
                        <div className="flex justify-between text-sm pt-1 mt-1 border-t border-green-100">
                          <span className="text-red-600">Deducciones:</span>
                          <span className="font-medium text-red-600">
                            -${monthlyData.bonus.deduction.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">No hay datos disponibles para este mes</p>
              <p className="text-green-500 text-sm mt-1">Selecciona un período diferente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function getBaseBonusForYear(year: number): number {
  switch (year) {
    case 2025:
      return 142000
    case 2024:
      return 135000
    case 2023:
      return 128000
    case 2022:
    case 2021:
    case 2020:
      return 122000
    default:
      return 122000
  }
}

const ProgressCardsOptimized: React.FC<{ userCode: string }> = ({ userCode }) => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <AnnualProgressCard userCode={userCode} />
        <MonthlyProgressCard userCode={userCode} />
        <KilometersCard userCode={userCode} />
        <BonusCard userCode={userCode} />
      </motion.div>
    </div>
  )
}

export default ProgressCardsOptimized
