"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { RefreshCw, AlertTriangle, Calendar, Target, Award } from "lucide-react"

// Mock API - Replace with your actual API
const api = {
  fetchKilometers: async ({ userCode, year }: { userCode: string; year?: number }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const currentYear = new Date().getFullYear()
    const years = year ? [year] : [currentYear - 2, currentYear - 1, currentYear]

    const mockData = years.map((y) => ({
      year: y,
      monthlyData: Array.from({ length: 12 }, (_, month) => ({
        year: y,
        month: month + 1,
        valor_programacion: Math.floor(Math.random() * 1000) + 500,
        valor_ejecucion: Math.floor(Math.random() * 900) + 400,
      })),
    }))

    return {
      availableYears: years,
      yearlyData: mockData,
      monthlyData: mockData.flatMap((y) => y.monthlyData),
    }
  },

  fetchBonuses: async ({ userCode, year }: { userCode: string; year?: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const currentYear = new Date().getFullYear()
    const years = year ? [year] : [currentYear - 2, currentYear - 1, currentYear]

    return {
      summary: {
        totalDeduction: Math.floor(Math.random() * 200) + 50,
      },
      yearlyData: years.map((y) => ({
        year: y,
        baseBonus: 1000,
        finalBonus: Math.floor(Math.random() * 800) + 600,
        deductions: Math.floor(Math.random() * 200) + 50,
      })),
    }
  },
}

const getBaseBonusForYear = (year: number) => 1000 // Base bonus per month

interface ThreeYearData {
  year: number
  kmExpected: number
  kmActual: number
  kmPercentage: number
  bonusExpected: number
  bonusActual: number
  bonusPercentage: number
  combinedPercentage: number
}

const ThreeYearProgressChart: React.FC<{ userCode: string }> = ({ userCode }) => {
  const [data, setData] = useState<any>(null)
  const [bonusData, setBonusData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const currentYear = new Date().getFullYear()
      const years = [currentYear - 2, currentYear - 1, currentYear]

      const [kmResults, bonusResults] = await Promise.all([
        Promise.all(years.map((year) => api.fetchKilometers({ userCode, year }))),
        Promise.all(years.map((year) => api.fetchBonuses({ userCode, year }))),
      ])

      setData({ years, results: kmResults })
      setBonusData({ years, results: bonusResults })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }, [userCode])

  useEffect(() => {
    if (userCode) {
      fetchData()
    }
  }, [userCode, fetchData])

  const threeYearData: ThreeYearData[] = useMemo(() => {
    if (!data || !bonusData) return []

    return data.years.map((year: number, index: number) => {
      const kmResult = data.results[index]
      const bonusResult = bonusData.results[index]

      // Calculate KM totals
      const yearKmData = kmResult.monthlyData || []
      const kmActual = yearKmData.reduce((sum: number, item: any) => sum + Number(item.valor_ejecucion || 0), 0)
      const kmExpected = yearKmData.reduce((sum: number, item: any) => sum + Number(item.valor_programacion || 0), 0)
      const kmPercentage = kmExpected > 0 ? Math.round((kmActual / kmExpected) * 100) : 0

      // Calculate Bonus totals
      const monthsWithData = yearKmData.length
      const bonusExpected = getBaseBonusForYear(year) * monthsWithData
      const bonusActual = Math.max(0, bonusExpected - (bonusResult.summary?.totalDeduction || 0))
      const bonusPercentage = bonusExpected > 0 ? Math.round((bonusActual / bonusExpected) * 100) : 0

      const combinedPercentage = Math.round((kmPercentage + bonusPercentage) / 2)

      return {
        year,
        kmExpected,
        kmActual,
        kmPercentage,
        bonusExpected,
        bonusActual,
        bonusPercentage,
        combinedPercentage,
      }
    })
  }, [data, bonusData])

  const chartData = useMemo(() => {
    return threeYearData.map((item) => ({
      year: item.year.toString(),
      "KM Esperados": Math.round(item.kmExpected),
      "KM Reales": Math.round(item.kmActual),
      "Bonus Esperado": Math.round(item.bonusExpected),
      "Bonus Real": Math.round(item.bonusActual),
      "Rendimiento KM (%)": item.kmPercentage,
      "Rendimiento Bonus (%)": item.bonusPercentage,
      "Rendimiento General (%)": item.combinedPercentage,
    }))
  }, [threeYearData])

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-80 w-full mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
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
            Error al cargar datos de 3 años
          </CardTitle>
          <CardDescription>Por favor, inténtalo de nuevo más tarde.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="relative bg-gradient-to-br from-white via-blue-50/30 to-white border-2 border-blue-100 shadow-xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                  Progreso Anual - 3 Generaciones
                </CardTitle>
                <CardDescription className="text-blue-600/70 font-medium">
                  Comparación de rendimiento esperado vs real
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={chartType} onValueChange={(value: "bar" | "line") => setChartType(value)}>
                <SelectTrigger className="w-32 h-9 border-blue-200 bg-white/80 backdrop-blur-sm shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="line">Líneas</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
                className="h-9 px-3 border-blue-200 hover:bg-blue-50 bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} text-blue-600`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10 pb-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {threeYearData.map((yearData, index) => (
              <motion.div
                key={yearData.year}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-700">{yearData.year}</h3>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-bold text-blue-700">{yearData.combinedPercentage}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600/70">KM:</span>
                    <span className="font-medium text-blue-700">{yearData.kmPercentage}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, yearData.kmPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600/70">Bonus:</span>
                    <span className="font-medium text-blue-700">{yearData.bonusPercentage}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, yearData.bonusPercentage)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Chart */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="year" stroke="#3b82f6" fontSize={12} fontWeight={500} />
                    <YAxis stroke="#3b82f6" fontSize={12} fontWeight={500} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #dbeafe",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="KM Esperados" fill="#93c5fd" name="KM Esperados" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="KM Reales" fill="#3b82f6" name="KM Reales" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Bonus Esperado" fill="#86efac" name="Bonus Esperado" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Bonus Real" fill="#22c55e" name="Bonus Real" radius={[2, 2, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="year" stroke="#3b82f6" fontSize={12} fontWeight={500} />
                    <YAxis stroke="#3b82f6" fontSize={12} fontWeight={500} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #dbeafe",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Rendimiento KM (%)"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="Rendimiento KM (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="Rendimiento Bonus (%)"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                      name="Rendimiento Bonus (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="Rendimiento General (%)"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                      name="Rendimiento General (%)"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-700">Análisis de Rendimiento</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Tendencias KM</h4>
                <div className="space-y-1">
                  {threeYearData.map((year, index) => (
                    <div key={year.year} className="flex justify-between">
                      <span className="text-blue-600/70">{year.year}:</span>
                      <span
                        className={`font-medium ${year.kmPercentage >= 90 ? "text-green-600" : year.kmPercentage >= 70 ? "text-yellow-600" : "text-red-600"}`}
                      >
                        {year.kmPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Tendencias Bonus</h4>
                <div className="space-y-1">
                  {threeYearData.map((year, index) => (
                    <div key={year.year} className="flex justify-between">
                      <span className="text-blue-600/70">{year.year}:</span>
                      <span
                        className={`font-medium ${year.bonusPercentage >= 90 ? "text-green-600" : year.bonusPercentage >= 70 ? "text-yellow-600" : "text-red-600"}`}
                      >
                        {year.bonusPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ThreeYearProgressChart
