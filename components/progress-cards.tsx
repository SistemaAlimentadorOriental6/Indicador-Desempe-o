"use client"

import { useRef } from "react"
import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw, Target, BarChart3, Car, BarChart, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { MonthlyPerformanceChart, KilometersMonthlyChart, BonusMonthlyChart, ThreeYearComparisonChart } from './chart-components'

// Debug flag - set to true to enable debug mode
const DEBUG_MODE = true

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
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      duration: 0.6,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.3, ease: "easeOut" as const },
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

// Helper function to safely format numbers and avoid concatenation
function safeFormatNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === "") {
    return defaultValue
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    return defaultValue
  }
  
  // Ensure the number is finite and within reasonable bounds
  return isFinite(num) ? num : defaultValue
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
            ? Number(((item.valor_ejecucion / item.valor_programacion) * 100).toFixed(1))
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
      
      // Fetch data for both chart (yearly) and details (monthly)
      const [yearlyResult, monthlyResult] = await Promise.all([
        // Fetch yearly data for chart
        selectedYear ? api.fetchKilometers({ userCode, year: selectedYear }) : Promise.resolve(null),
        // Fetch monthly data for details
        selectedYear && selectedMonth ? api.fetchKilometers({ userCode, year: selectedYear, month: selectedMonth }) : Promise.resolve(null)
      ])

      // Use yearly data as primary source
      const primaryResult = yearlyResult || monthlyResult || await api.fetchKilometers({ userCode })
      setData(primaryResult)

      // Set defaults if not set
      if (!selectedYear && primaryResult?.availableYears?.length) {
        setSelectedYear(primaryResult.availableYears[0])
      }
      if (!selectedMonth && primaryResult?.availableMonths?.length) {
        setSelectedMonth(primaryResult.availableMonths[primaryResult.availableMonths.length - 1])
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
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-10 w-40 mb-4" />
          <Skeleton className="h-2 w-full mb-2" />
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
            Error al cargar los datos
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
                  Evolución y desempeño mensual
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
          {/* Year Selector */}
          <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
              <SelectValue placeholder="Seleccionar Año" />
            </SelectTrigger>
            <SelectContent>
              {data?.availableYears?.map((year: number) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chart Section */}
          {selectedYear && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">Evolución Anual {selectedYear}</div>
              <KilometersMonthlyChart 
                data={data?.monthlyData || []} 
                year={selectedYear} 
                isLoading={isLoading} 
              />
            </div>
          )}

          {/* Detailed Information Section */}
          <div className="space-y-4 bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            {/* Month Selector */}
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
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

            {/* Main Metrics */}
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                {formatNumber(animatedKm)}
              </div>
              <div className="text-sm text-green-600/70 font-medium">
                de {formatNumber(Number(displayData.valor_programacion))} km
              </div>
              <div className="text-sm text-green-600/60 mt-1">
                {displayData.monthName} {displayData.year}
              </div>
            </div>

            {/* Progress Bar */}
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
      
      // Fetch data for both chart (yearly) and details (monthly)
      const [yearlyResult, monthlyResult] = await Promise.all([
        // Fetch yearly data for chart
        selectedYear ? api.fetchBonuses({ userCode, year: selectedYear }) : Promise.resolve(null),
        // Fetch monthly data for details
        selectedYear && selectedMonth ? api.fetchBonuses({ userCode, year: selectedYear, month: selectedMonth }) : Promise.resolve(null)
      ])

      // Use yearly data as primary source
      const primaryResult = yearlyResult || monthlyResult || await api.fetchBonuses({ userCode })
      setData(primaryResult)

      // Set defaults if not set
      if (!selectedYear && primaryResult?.bonusData?.availableYears?.length) {
        setSelectedYear(primaryResult.bonusData.availableYears[0])
      }
      if (!selectedMonth && primaryResult?.bonusData?.availableMonths?.length) {
        setSelectedMonth(primaryResult.bonusData.availableMonths[primaryResult.bonusData.availableMonths.length - 1])
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
          (item: any) => item.year === selectedYear && item.month === selectedMonth,
        )
        if (filtered) return filtered
      }
      return data.monthlyBonusData[0]
    }
    return data.bonusData?.lastMonthData
  }, [data, selectedYear, selectedMonth])

  const percentage = useMemo(() => {
    if (!displayData) return 0
    const base = displayData.bonusValue || 0
    const final = displayData.finalValue || 0
    if (base > 0) {
      return Math.max(0, Number(((final / base) * 100).toFixed(1)))
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

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-10 w-40 mb-4" />
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
            Error al cargar bonificaciones
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
                  Evolución y desempeño mensual
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
          {/* Year Selector */}
          <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
              <SelectValue placeholder="Seleccionar Año" />
            </SelectTrigger>
            <SelectContent>
              {data?.bonusData?.availableYears?.map((year: number) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chart Section */}
          {selectedYear && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">Evolución Anual {selectedYear}</div>
              <BonusMonthlyChart 
                data={data?.monthlyBonusData || []} 
                year={selectedYear} 
                isLoading={isLoading} 
              />
            </div>
          )}

          {/* Detailed Information Section */}
          <div className="space-y-4 bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            {/* Month Selector */}
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {data?.bonusData?.availableMonths?.map((month: number) => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Main Metrics */}
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                ${displayData ? formatCurrency(displayData.finalValue || 0) : "0"}
              </div>
              <div className="text-sm text-green-600/70 font-medium">
                de ${displayData ? formatCurrency(displayData.bonusValue || 0) : "0"}
              </div>
              <div className="text-sm text-green-600/60 mt-1">
                {displayData?.monthName} {displayData?.year}
              </div>
            </div>

            {/* Progress Bar */}
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

            {/* Deduction Alert */}
            {displayData?.deductionAmount && displayData.deductionAmount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="text-xs text-red-600 font-medium">Deducción Aplicada</div>
                    <div className="text-sm font-bold text-red-700">-${formatCurrency(displayData.deductionAmount)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
  const [lastThreeYearsData, setLastThreeYearsData] = useState<any[]>([])

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

  const fetchLastThreeYearsData = useCallback(
    async (currentYear: number) => {
      try {
        // Get the 3 years BEFORE the current year
        const actualCurrentYear = new Date().getFullYear()
        const years = [actualCurrentYear - 3, actualCurrentYear - 2, actualCurrentYear - 1]
        const promises = years.map(async (year) => {
          const [kmResult, bonusResult] = await Promise.all([
            api.fetchKilometers({ userCode, year }),
            api.fetchBonuses({ userCode, year })
          ])
          
          // Calculate totals for the year
          const yearKmData = kmResult.monthlyData?.filter((item: any) => item.year === year) || []
          const totalKmExecuted = yearKmData.reduce((sum: number, item: any) => sum + Number(item.valor_ejecucion || 0), 0)
          const totalKmProgrammed = yearKmData.reduce(
            (sum: number, item: any) => sum + Number(item.valor_programacion || 0),
            0,
          )
          const kmPercentage = totalKmProgrammed > 0 ? Number(((totalKmExecuted / totalKmProgrammed) * 100).toFixed(1)) : 0
          
          // Calculate bonus totals
          const monthsWithData = yearKmData.length
          const baseForYear = getBaseBonusForYear(year)
          const totalBonusBase = baseForYear * monthsWithData
          let totalDeductions = 0
          if (bonusResult.summary && bonusResult.summary.totalDeduction !== undefined) {
            totalDeductions = bonusResult.summary.totalDeduction
          }

          const totalBonusFinal = totalBonusBase - totalDeductions
          const bonusPercentage = totalBonusBase > 0 ? Math.min(100, Math.max(0, Number(((totalBonusFinal / totalBonusBase) * 100).toFixed(1)))) : 100
          
          // Calculate rendimiento general promediando los rendimientos mensuales
          let rendimientoGeneral = 0
          const monthlyRendimientos = []
          
          for (let month = 1; month <= 12; month++) {
            const monthKmData = yearKmData.find((item: any) => item.month === month)
            if (monthKmData) {
              // Calculate KM percentage for this month
              const monthKmPercentage = monthKmData.valor_programacion > 0 
                ? Number(((monthKmData.valor_ejecucion / monthKmData.valor_programacion) * 100).toFixed(1))
                : 0
              
              // Calculate Bonus percentage for this month
              let monthBonusPercentage = 100
              const monthBonusData = bonusResult.monthlyBonusData?.find(
                (item: any) => item.month === month && item.year === year
              )
              
              if (monthBonusData && baseForYear > 0) {
                const finalBonusForMonth = monthBonusData.finalValue !== undefined 
                  ? monthBonusData.finalValue 
                  : (monthBonusData.finalBonus !== undefined ? monthBonusData.finalBonus : baseForYear)
                monthBonusPercentage = Number(((finalBonusForMonth / baseForYear) * 100).toFixed(1))
              }
              
              // Calculate combined performance for this month
              const monthRendimiento = Number(((monthKmPercentage + monthBonusPercentage) / 2).toFixed(1))
              monthlyRendimientos.push(monthRendimiento)
            }
          }
          
          // Average of monthly rendimientos
          if (monthlyRendimientos.length > 0) {
            rendimientoGeneral = Number((
              monthlyRendimientos.reduce((sum, val) => sum + val, 0) / monthlyRendimientos.length
            ).toFixed(1))
          }
          
          return {
            year,
            kilómetros: totalKmExecuted,
            'kilómetros programados': totalKmProgrammed,
            'eficiencia km (%)': kmPercentage,
            'bonificaciones ($)': Math.max(0, totalBonusFinal),
            'eficiencia bonus (%)': bonusPercentage,
            'rendimiento general (%)': rendimientoGeneral
          }
        })
        
        const results = await Promise.all(promises)
        setLastThreeYearsData(results)
      } catch (err) {
        console.error('Error fetching 3-year data:', err)
      }
    },
    [userCode]
  )

  useEffect(() => {
    if (userCode) {
      if (selectedYear) {
        fetchData(selectedYear)
        fetchLastThreeYearsData(selectedYear)
      } else {
        // First, get available years to then fetch data for the latest one.
        setIsLoading(true)
        api
          .fetchKilometers({ userCode })
          .then((result) => {
            if (result.availableYears?.length) {
              setSelectedYear(result.availableYears[0])
            } else {
              setIsLoading(false)
            }
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Error desconocido")
            setIsLoading(false)
          })
      }
    }
  }, [userCode, selectedYear, fetchData, fetchLastThreeYearsData])

  // Calculate annual totals and percentages with monthly breakdown
  const annualData = useMemo(() => {
    if (!data || !bonusData || !selectedYear) return null

    // 1. Calculate KM Totals
    const yearKmData = data.monthlyData.filter((item: any) => item.year === selectedYear)
    const totalKmExecuted = yearKmData.reduce(
      (sum: number, item: any) => sum + Number(item.valor_ejecucion || 0),
      0,
    )
    const totalKmProgrammed = yearKmData.reduce(
      (sum: number, item: any) => sum + Number(item.valor_programacion || 0),
      0,
    )
    const kmPercentage =
      totalKmProgrammed > 0 ? Math.max(0, Number(((totalKmExecuted / totalKmProgrammed) * 100).toFixed(1))) : 0

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
      bonusPercentage = Math.min(100, Math.max(0, Number(((totalBonusFinal / totalBonusBase) * 100).toFixed(1))))
    }

    // 4. Calculate Combined Percentage usando el método CORRECTO:
    // Calcular el rendimiento de cada mes y luego promediar
    let combinedPercentage = 0
    const monthlyRendimientos = []
    
    for (let month = 1; month <= 12; month++) {
      const monthKmData = yearKmData.find((item: any) => item.month === month)
      if (monthKmData) {
        // Calculate KM percentage for this month
        const monthKmPercentage = monthKmData.valor_programacion > 0 
          ? Number(((monthKmData.valor_ejecucion / monthKmData.valor_programacion) * 100).toFixed(1))
          : 0
        
        // Calculate Bonus percentage for this month
        let monthBonusPercentage = 100
        const baseBonus = getBaseBonusForYear(selectedYear)
        const monthBonusData = bonusData.monthlyBonusData?.find(
          (item: any) => item.month === month && item.year === selectedYear
        )
        
        if (monthBonusData && baseBonus > 0) {
          const finalBonusForMonth = monthBonusData.finalValue !== undefined 
            ? monthBonusData.finalValue 
            : (monthBonusData.finalBonus !== undefined ? monthBonusData.finalBonus : baseBonus)
          monthBonusPercentage = Number(((finalBonusForMonth / baseBonus) * 100).toFixed(1))
        }
        
        // Calculate combined performance for this month
        const monthRendimiento = Number(((monthKmPercentage + monthBonusPercentage) / 2).toFixed(1))
        monthlyRendimientos.push(monthRendimiento)
      }
    }
    
    // Average of monthly rendimientos (same as avgPerformance in chart)
    if (monthlyRendimientos.length > 0) {
      combinedPercentage = Number((
        monthlyRendimientos.reduce((sum, val) => sum + val, 0) / monthlyRendimientos.length
      ).toFixed(1))
    }

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
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
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
          <Button
            variant="outline"
            size="sm"
            className="mt-4 bg-transparent"
            onClick={() => fetchData(selectedYear || 0)}
          >
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
                  Análisis de últimos 3 años y año actual
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
          {/* Year Selector */}
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

          {/* Chart Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
            <div className="text-sm font-medium text-green-700 mb-2">Comparación Últimos 3 Años</div>
            <ThreeYearComparisonChart 
              data={lastThreeYearsData} 
              isLoading={isLoading} 
              currentYearPerformance={selectedYear === 2025 ? annualData?.combinedPercentage : undefined}
            />
          </div>

          {/* Current Year Details */}
          <div className="space-y-3 bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                {animatedCombinedPercentage}%
              </div>
              <div className="text-sm text-green-600/70 font-medium">Rendimiento {annualData?.year || selectedYear}</div>
            </div>

            {/* Progress Indicators */}
            <div className="space-y-2">
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

            {/* Summary Stats */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
              <div className="text-xs text-green-600/70 font-medium mb-1">Meses con datos</div>
              <div className="text-lg font-bold text-green-700">{annualData?.monthsWithData || 0}/12</div>
            </div>
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
  const [yearlyData, setYearlyData] = useState<any[]>([])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      debugLog(`[MonthlyProgressCard] Fetching data for user: ${userCode}, year: ${selectedYear}, month: ${selectedMonth}`)

      // Fetch both kilometers and bonus data for the year (for chart) and specific month (for details)
      const [kmYearResult, bonusYearResult, kmMonthResult, bonusMonthResult] = await Promise.all([
        selectedYear ? api.fetchKilometers({ userCode, year: selectedYear }) : Promise.resolve(null),
        selectedYear ? api.fetchBonuses({ userCode, year: selectedYear }) : Promise.resolve(null),
        selectedYear && selectedMonth ? api.fetchKilometers({ userCode, year: selectedYear, month: selectedMonth }) : Promise.resolve(null),
        selectedYear && selectedMonth ? api.fetchBonuses({ userCode, year: selectedYear, month: selectedMonth }) : Promise.resolve(null)
      ])

      debugLog(`[MonthlyProgressCard] KM Year Result:`, kmYearResult)
      debugLog(`[MonthlyProgressCard] Bonus Year Result:`, bonusYearResult)
      debugLog(`[MonthlyProgressCard] KM Month Result:`, kmMonthResult)
      debugLog(`[MonthlyProgressCard] Bonus Month Result:`, bonusMonthResult)

      // Use year results as primary data source
      const primaryKmResult = kmYearResult || kmMonthResult || await api.fetchKilometers({ userCode })
      const primaryBonusResult = bonusYearResult || bonusMonthResult || await api.fetchBonuses({ userCode })
      
      debugLog(`[MonthlyProgressCard] Primary KM Result:`, primaryKmResult)
      debugLog(`[MonthlyProgressCard] Primary Bonus Result:`, primaryBonusResult)

      setData(primaryKmResult)
      setBonusData(primaryBonusResult)

      // Process yearly data for chart
      if (primaryKmResult?.monthlyData && selectedYear) {
        const processedYearlyData = []
        for (let month = 1; month <= 12; month++) {
          const monthKmData = primaryKmResult.monthlyData.find((item: any) => item.month === month && item.year === selectedYear)
          if (monthKmData) {
            // Calculate actual bonus percentage based on real bonus data for this month
            let bonusPercentage = 0
            const baseBonus = getBaseBonusForYear(selectedYear)
            
            // Try to find monthly bonus data for this specific month
            const monthBonusData = primaryBonusResult?.monthlyBonusData?.find(
              (item: any) => item.month === month && item.year === selectedYear
            )
            
            if (monthBonusData && baseBonus > 0) {
              // Handle finalBonus correctly for percentage calculation - finalValue=0 is valid
              let finalBonusForCalc = baseBonus
              if (monthBonusData.finalValue !== undefined) {
                finalBonusForCalc = monthBonusData.finalValue
              } else if (monthBonusData.finalBonus !== undefined) {
                finalBonusForCalc = monthBonusData.finalBonus
              }
              bonusPercentage = Number(((finalBonusForCalc / baseBonus) * 100).toFixed(1))
            } else if (monthBonusData) {
              // If there's bonus data but no baseBonus calculation possible, use finalValue directly
              bonusPercentage = monthBonusData.finalValue > 0 ? 100 : 0
            }
            
            // Handle finalBonus correctly - finalValue=0 is valid, not falsy
            let finalBonus = baseBonus
            if (monthBonusData?.finalValue !== undefined) {
              finalBonus = monthBonusData.finalValue
            } else if (monthBonusData?.finalBonus !== undefined) {
              finalBonus = monthBonusData.finalBonus
            }
            
            processedYearlyData.push({
              month,
              valor_ejecucion: monthKmData.valor_ejecucion,
              valor_programacion: monthKmData.valor_programacion,
              bonusPercentage,
              baseBonus,
              finalBonus
            })
          }
        }
        setYearlyData(processedYearlyData)
      }

      // Set defaults if not set
      if (!selectedYear && primaryKmResult?.availableYears?.length) {
        setSelectedYear(primaryKmResult.availableYears[0])
      }
      if (!selectedMonth && primaryKmResult?.availableMonths?.length) {
        setSelectedMonth(primaryKmResult.availableMonths[primaryKmResult.availableMonths.length - 1])
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

    debugLog(`[MonthlyProgressCard - monthlyData] Calculating for year: ${selectedYear}, month: ${selectedMonth}`)
    debugLog(`[MonthlyProgressCard - monthlyData] Data:`, data)
    debugLog(`[MonthlyProgressCard - monthlyData] BonusData:`, bonusData)

    // Get kilometers data for the specific month
    const kmMonthData = data.monthlyData?.find(
      (item: any) => item.year === selectedYear && item.month === selectedMonth,
    )

    debugLog(`[MonthlyProgressCard - monthlyData] KM Month Data found:`, kmMonthData)

    // Get bonus data for the specific month
    let bonusMonthData = bonusData?.monthlyBonusData?.find(
      (item: any) => item.year === selectedYear && item.month === selectedMonth,
    )

    debugLog(`[MonthlyProgressCard - monthlyData] Bonus Month Data found:`, bonusMonthData)

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
      debugLog(`[MonthlyProgressCard - monthlyData] Created bonus data from summary:`, bonusMonthData)
    }

    if (!kmMonthData && !bonusMonthData) {
      debugLog(`[MonthlyProgressCard - monthlyData] No data found for this month`)
      return null
    }

    const kmPercentage = kmMonthData?.percentage || 0
    debugLog(`[MonthlyProgressCard - monthlyData] KM Percentage:`, kmPercentage)

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
      bonusPercentage = Number(((finalBonus / baseBonus) * 100).toFixed(1))
    } else if (bonusMonthData) {
      // If there's data but baseBonus is 0, it might still be 100% if final is also 0
      bonusPercentage = 100
    }

    debugLog(`[MonthlyProgressCard - monthlyData] Base Bonus: ${baseBonus}, Deduction: ${deductionAmount}, Final: ${finalBonus}, Percentage: ${bonusPercentage}%`)

    // Calculate combined performance percentage
    const combinedPercentage = Number(((kmPercentage + bonusPercentage) / 2).toFixed(1))

    debugLog(`[MonthlyProgressCard - monthlyData] Combined Percentage: ${combinedPercentage}% = (${kmPercentage}% + ${bonusPercentage}%) / 2`)

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
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
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
    <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="w-full h-full">
      <Card className="relative bg-gradient-to-br from-white via-green-50/30 to-white border-2 border-green-100 shadow-xl overflow-hidden backdrop-blur-sm h-full flex flex-col">
        <DecorativePattern variant="dots" color="#10b981" />

        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />

        <CardHeader className="pb-4 relative z-10 flex-shrink-0">
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
                  Evolución anual y detalle mensual
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
          {/* Year Selector */}
          <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-full h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
              <SelectValue placeholder="Seleccionar año para análisis" />
            </SelectTrigger>
            <SelectContent>
              {data?.availableYears?.map((year: number) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chart Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
            <div className="text-sm font-medium text-green-700 mb-2">Evolución Anual {selectedYear}</div>
            <MonthlyPerformanceChart data={yearlyData} year={selectedYear || new Date().getFullYear()} isLoading={isLoading} />
          </div>

          {/* Monthly Details Section */}
          <div className="space-y-4 bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            {/* Month Selector */}
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="w-full h-9 border-green-200 bg-white/80 backdrop-blur-sm shadow-sm text-sm">
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

            {monthlyData ? (
              <div className="space-y-4">
                {/* Combined Performance Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-semibold text-sm">
                      {monthlyData.monthName} {monthlyData.year}
                    </span>
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                    {safeFormatNumber(animatedCombinedPercentage)}%
                  </div>
                  <p className="text-green-600 text-xs">Promedio de kilómetros y bonificaciones</p>
                </div>

                <div className="relative w-full bg-green-100 rounded-full h-3 mb-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(safeFormatNumber(monthlyData.combinedPercentage), 100)}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </div>

                {/* Detailed breakdown - Compact */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Kilometers Section */}
                  <div className="bg-white/60 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-semibold text-green-700 text-xs">KMs</span>
                      <Badge className="bg-green-100 text-green-700 border-0 ml-auto text-xs px-1 py-0">
                        {safeFormatNumber(monthlyData.kilometers.percentage)}%
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        {new Intl.NumberFormat('es-CO', { 
                          minimumFractionDigits: 0, 
                          maximumFractionDigits: 0 
                        }).format(safeFormatNumber(monthlyData.kilometers.executed))}
                      </div>
                      <div className="text-xs text-green-500 opacity-75">
                        de {new Intl.NumberFormat('es-CO').format(safeFormatNumber(monthlyData.kilometers.programmed))}
                      </div>
                    </div>
                  </div>

                  {/* Bonus Section */}
                  <div className="bg-white/60 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-1 mb-2">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="font-semibold text-green-700 text-xs">Bonos</span>
                      <Badge className="bg-green-100 text-green-700 border-0 ml-auto text-xs px-1 py-0">
                        {safeFormatNumber(monthlyData.bonus.percentage)}%
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        ${new Intl.NumberFormat('es-CO', { 
                          minimumFractionDigits: 0, 
                          maximumFractionDigits: 0 
                        }).format(safeFormatNumber(monthlyData.bonus.final))}
                      </div>
                      <div className="text-xs text-green-500 opacity-75">
                        de ${new Intl.NumberFormat('es-CO').format(safeFormatNumber(monthlyData.bonus.base))}
                      </div>
                      {safeFormatNumber(monthlyData.bonus.deduction) > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          -${new Intl.NumberFormat('es-CO').format(safeFormatNumber(monthlyData.bonus.deduction))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-green-600 font-medium text-sm">No hay datos disponibles</p>
                <p className="text-green-500 text-xs mt-1">Selecciona un período diferente</p>
              </div>
            )}
          </div>
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