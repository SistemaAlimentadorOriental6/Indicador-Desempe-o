"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  Route,
  Gift,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
} from "recharts"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import BonusDataFilter from "./bonus-data-filter"

// Types
type ChartType = "line" | "bar" | "area"
type DataMode = "kilometers" | "bonus"

interface DataPoint {
  name: string
  value: number
  prevValue?: number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
}

interface FilteredData {
  totalKilometers: number
  totalActivities: number
  chartData: DataPoint[]
}

// Process API data to chart format for yearly view
const processYearlyData = (apiData: any, year: number): DataPoint[] => {
  if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
    return []
  }

  // Month names in Spanish
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Initialize monthly data structure
  const monthlyData: { [key: number]: { executed: number; programmed: number } } = {}

  // Initialize all months with zeros
  for (let i = 0; i < 12; i++) {
    monthlyData[i] = { executed: 0, programmed: 0 }
  }

  // Process data from API
  apiData.data.forEach((item: any) => {
    // Check if the item has year and month properties
    if (item.year === year && item.month) {
      const month = item.month - 1 // Convert to 0-based index

      if (monthlyData[month]) {
        monthlyData[month].executed += Number(item.valor_ejecucion) || 0
        monthlyData[month].programmed += Number(item.valor_programacion) || 0
      }
    }
  })

  // Convert to chart format
  return Object.entries(monthlyData).map(([monthIndex, values]) => {
    const month = Number.parseInt(monthIndex)
    const value = values.executed
    const prevValue = values.programmed
    const change = value - prevValue
    const changeType = change > 0 ? "increase" : change < 0 ? "decrease" : "neutral"

    return {
      name: months[month],
      value,
      prevValue,
      change,
      changeType,
    }
  })
}

// Calculate statistics from API data
const calculateStatistics = (chartData: DataPoint[]): { totalKilometers: number; totalActivities: number } => {
  const totalKilometers = chartData.reduce((sum, item) => sum + item.value, 0)

  // Estimate activities based on kilometers (1 activity per 5km on average)
  const totalActivities = Math.round(totalKilometers / 5)

  return {
    totalKilometers,
    totalActivities,
  }
}

export default function DataFilter() {
  const { user } = useAuth()

  // Current date for defaults
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  // State
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [chartType, setChartType] = useState<ChartType>("area")
  const [filteredData, setFilteredData] = useState<FilteredData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [apiData, setApiData] = useState<any>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dataMode, setDataMode] = useState<DataMode>("kilometers")

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.codigo) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/user/kilometers?codigo=${user.codigo}`)

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.status}`)
        }

        const data = await response.json()
        console.log("API data:", data)

        // Verificar si la respuesta es exitosa
        if (data.error) {
          throw new Error(data.message || data.error || "Error al cargar los datos")
        }

        setApiData(data)

        // Set available years from API data
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears)

          // Si hay años disponibles, seleccionar el más reciente por defecto
          if (!selectedYear || !data.availableYears.includes(selectedYear)) {
            setSelectedYear(data.availableYears[0])
          }
        } else {
          // Fallback to current year and 4 previous years
          setAvailableYears(Array.from({ length: 5 }, (_, i) => currentYear - i))
        }
      } catch (err) {
        console.error("Error fetching kilometers data:", err)
        setError("No se pudieron cargar los datos. Intente nuevamente más tarde.")

        // Fallback to current year and 4 previous years
        setAvailableYears(Array.from({ length: 5 }, (_, i) => currentYear - i))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Process data when filters change
  useEffect(() => {
    if (!apiData) return

    setIsLoading(true)

    // Use setTimeout to simulate processing time and show loading state
    const timer = setTimeout(() => {
      try {
        // Process data for the selected year
        const chartData = processYearlyData(apiData, selectedYear)

        // Calculate statistics
        const stats = calculateStatistics(chartData)

        setFilteredData({
          ...stats,
          chartData,
        })
      } catch (err) {
        console.error("Error processing data:", err)
        setError("Error al procesar los datos")
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [apiData, selectedYear])

  // Handle year navigation
  const handlePrevYear = () => {
    const minYear = Math.min(...availableYears)
    if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextYear = () => {
    const maxYear = Math.max(...availableYears)
    if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const chartContainerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.2,
      },
    },
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-green-100">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-green-600 font-semibold">{payload[0].value.toFixed(1)} km</p>
          {payload[0].payload.prevValue !== undefined && (
            <div className="flex items-center mt-1 text-xs">
              <span className="text-gray-500 mr-1">Programado:</span>
              <span className="font-medium">{payload[0].payload.prevValue.toFixed(1)} km</span>
              {payload[0].payload.change !== 0 && (
                <span
                  className={cn(
                    "ml-2 flex items-center",
                    payload[0].payload.changeType === "increase" ? "text-green-600" : "text-red-500",
                  )}
                >
                  {payload[0].payload.changeType === "increase" ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(payload[0].payload.change).toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 p-3 sm:p-6"
    >
      {/* Header with title and period selector */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4"
      >
        <div className="flex items-center">
          <div
            className={cn(
              "h-1.5 w-6 rounded-full mr-2",
              dataMode === "kilometers"
                ? "bg-gradient-to-r from-green-500 to-emerald-400"
                : "bg-gradient-to-r from-teal-500 to-emerald-400",
            )}
          ></div>
          <h3 className="text-gray-800 font-bold text-xl flex items-center">
            {dataMode === "kilometers" ? (
              <>
                <Route className="h-5 w-5 mr-2 text-green-600" />
                Análisis de Kilómetros
              </>
            ) : (
              <>
                <Gift className="h-5 w-5 mr-2 text-teal-600" />
                Análisis de Bonos
              </>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-green-50 rounded-xl p-1 flex">
            <button
              onClick={() => setChartType("area")}
              className={cn(
                "p-2 rounded-lg transition-all",
                chartType === "area" ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-green-700",
              )}
            >
              <AreaChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "p-2 rounded-lg transition-all",
                chartType === "bar" ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-green-700",
              )}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={cn(
                "p-2 rounded-lg transition-all",
                chartType === "line" ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-green-700",
              )}
            >
              <LineChart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Period selector */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between bg-green-50/50 rounded-xl p-3 border border-green-100/50">
          <button
            onClick={handlePrevYear}
            className={cn(
              "p-2 rounded-lg hover:bg-white/70 transition-colors",
              selectedYear === Math.min(...availableYears)
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-green-700",
            )}
            disabled={selectedYear === Math.min(...availableYears)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 font-medium text-gray-800 hover:text-green-700 transition-colors"
            >
              <Calendar className="h-5 w-5 text-green-600" />
              <span>{selectedYear}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {showYearDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-green-100 p-2 z-10 w-32"
                >
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setShowYearDropdown(false)
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedYear === year
                          ? "bg-green-50 text-green-700 font-medium"
                          : "hover:bg-green-50/50 text-gray-700",
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleNextYear}
            className={cn(
              "p-2 rounded-lg hover:bg-white/70 transition-colors",
              selectedYear === Math.max(...availableYears)
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-green-700",
            )}
            disabled={selectedYear === Math.max(...availableYears)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Mode selector */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="bg-gray-50/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setDataMode("kilometers")}
              className={cn(
                "py-3 px-3 font-medium text-sm transition-colors flex justify-center items-center gap-2",
                dataMode === "kilometers"
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-gray-100",
              )}
            >
              <Route className="h-4 w-4" />
              Kilómetros
            </button>
            <button
              onClick={() => setDataMode("bonus")}
              className={cn(
                "py-3 px-3 font-medium text-sm transition-colors flex justify-center items-center gap-2",
                dataMode === "bonus"
                  ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-gray-100",
              )}
            >
              <Gift className="h-4 w-4" />
              Bonos
            </button>
          </div>
        </div>
      </motion.div>

      {/* Conditional rendering based on dataMode */}
      {dataMode === "kilometers" ? (
        <>
          {/* Stats summary for kilometers */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm transition-all group hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-100/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 relative z-10">
                <div className="bg-green-400/10 p-2 sm:p-2.5 rounded-lg sm:rounded-xl hidden sm:block">
                  <Route className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total Kilómetros</p>
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-gray-800 font-bold text-xl">{filteredData?.totalKilometers.toFixed(1) || "0"}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm transition-all group hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-100/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 relative z-10">
                <div className="bg-green-400/10 p-2 sm:p-2.5 rounded-lg sm:rounded-xl hidden sm:block">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Viajes</p>
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-gray-800 font-bold text-xl">{filteredData?.totalActivities || "0"}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chart for kilometers */}
          <motion.div
            variants={chartContainerVariants}
            className="bg-white rounded-2xl border border-green-100 p-2 sm:p-4 shadow-sm h-60 sm:h-80 relative"
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-500 text-sm">Cargando datos...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center text-center px-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Filter className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-gray-800 font-medium mb-2">Error al cargar los datos</p>
                  <p className="text-gray-500 text-sm">{error}</p>
                </div>
              </div>
            ) : filteredData?.chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center text-center px-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <Filter className="h-8 w-8 text-green-400" />
                  </div>
                  <p className="text-gray-800 font-medium mb-2">No hay datos disponibles</p>
                  <p className="text-gray-500 text-sm">No se encontraron registros para el período seleccionado.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={filteredData?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickFormatter={(value) => `${value}km`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={2}
                      animationDuration={1500}
                      activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "white" }}
                    />
                  </AreaChart>
                ) : chartType === "bar" ? (
                  <BarChart data={filteredData?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickFormatter={(value) => `${value}km`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  </BarChart>
                ) : (
                  <RechartsLineChart
                    data={filteredData?.chartData || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickFormatter={(value) => `${value}km`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, stroke: "#10b981", strokeWidth: 2, fill: "white" }}
                      activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "white" }}
                      animationDuration={1500}
                    />
                  </RechartsLineChart>
                )}
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Legend for kilometers */}
          <motion.div
            variants={itemVariants}
            className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500"
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Kilómetros mensuales</span>
            </div>

            <div className="flex items-center">
              <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <span>Filtro: Anual • Año {selectedYear}</span>
            </div>
          </motion.div>
        </>
      ) : (
        <BonusDataFilter />
      )}
    </motion.div>
  )
}
