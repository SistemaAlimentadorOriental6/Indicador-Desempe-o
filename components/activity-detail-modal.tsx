"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Download,
  LineChart,
  AlertCircle,
  Route,
  Gift,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { cn } from "@/lib/utils"

interface ActivityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  type: "kilometros" | "bonos"
  userCode?: string
}

// Type for data points
interface DataPoint {
  day: number
  value: number
  date?: string // Fecha completa para referencia
}

export default function ActivityDetailModal({ isOpen, onClose, type, userCode }: ActivityDetailModalProps) {
  // Current date for defaults
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chartType, setChartType] = useState<"line" | "area">("area")
  const [error, setError] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState({
    totalValue: 0,
    activeDays: 0,
    averageValue: 0,
    maxValue: 0,
  })

  // Format month name
  const getMonthName = (month: number) => {
    return new Date(0, month).toLocaleDateString("es-ES", { month: "long" })
  }

  // Get month name with first letter capitalized
  const monthName = getMonthName(selectedMonth).charAt(0).toUpperCase() + getMonthName(selectedMonth).slice(1)

  // Handle month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth(11)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth(0)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Generate mock data for the selected month
  const generateMockData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const mockData: DataPoint[] = []

    // Generate data for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Skip some days randomly to simulate days without activity
      if (Math.random() > 0.7) continue

      const date = new Date(selectedYear, selectedMonth, day)

      // Don't include future dates
      if (date > currentDate) continue

      // Generate a random value based on the type
      const value =
        type === "kilometros" ? Math.round(Math.random() * 50 + 5) : Math.round(Math.random() * 50000 + 5000)

      mockData.push({
        day,
        value: type === "kilometros" ? Number.parseFloat(value.toFixed(1)) : value,
        date: date.toISOString().split("T")[0],
      })
    }

    return mockData
  }

  // Fetch data when month/year changes
  useEffect(() => {
    if (!isOpen) return

    setIsLoading(true)
    setError(null)

    // Simulate API call with a delay
    const timer = setTimeout(() => {
      try {
        // For real implementation, replace this with actual API call
        // const url = `/api/user/daily-activity?type=${type}&year=${selectedYear}&month=${selectedMonth + 1}&userCode=${userCode || ''}`
        // fetch(url).then(...)

        const data = generateMockData()

        if (data.length === 0) {
          setError("No hay datos disponibles para este período")
          setChartData([])
        } else {
          setChartData(data)

          // Calculate summary statistics
          const totalValue = data.reduce((sum, item) => sum + item.value, 0)
          const activeDays = data.length
          const averageValue = activeDays > 0 ? totalValue / activeDays : 0
          const maxValue = Math.max(...data.map((item) => item.value))

          setSummaryData({
            totalValue,
            activeDays,
            averageValue,
            maxValue,
          })
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Error processing data:", err)
        setError("Error al cargar los datos. Intente nuevamente.")
        setChartData([])
        setIsLoading(false)
      }
    }, 800) // Simulate network delay

    return () => clearTimeout(timer)
  }, [selectedMonth, selectedYear, type, userCode, isOpen])

  // Animation variants
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }

  // Format values based on type
  const formatValue = (value: number) => {
    if (type === "kilometros") {
      return `${value.toLocaleString("es-CO")} km`
    } else {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(value)
    }
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-green-100">
          <p className="font-medium text-gray-800">Día {label}</p>
          <p className="text-green-600 font-semibold">{formatValue(payload[0].value)}</p>
          {payload[0].payload.date && (
            <p className="text-gray-500 text-xs mt-1">
              {new Date(payload[0].payload.date).toLocaleDateString("es-ES")}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // To prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-white z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 md:p-6 text-white relative flex-shrink-0">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
              <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
              <motion.div
                className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full"
                animate={{
                  scale: [1, 1.1, 1],
                  x: [0, 10, 0],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              ></motion.div>

              <div className="flex justify-between items-center relative z-10">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                      {type === "kilometros" ? (
                        <Route className="h-5 w-5 text-white" />
                      ) : (
                        <Gift className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-xl md:text-2xl">
                        {type === "kilometros" ? "Detalle de Kilómetros" : "Detalle de Bonos"}
                      </h2>
                      <p className="text-green-50/90 mt-1 text-sm">
                        {type === "kilometros" ? "Registro de actividad por día" : "Registro de bonos por día"}
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex flex-col overflow-hidden">
              {/* Period selector */}
              <div className="px-4 md:px-6 pt-4 flex-shrink-0">
                <div className="flex items-center justify-between bg-green-50/50 rounded-xl p-3 border border-green-100/50">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-lg hover:bg-white/70 text-gray-600 hover:text-green-700 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-800 capitalize">
                      {monthName} {selectedYear}
                    </span>
                  </div>

                  <button
                    onClick={handleNextMonth}
                    className={cn(
                      "p-2 rounded-lg hover:bg-white/70 text-gray-600 hover:text-green-700 transition-colors",
                      selectedMonth === currentDate.getMonth() &&
                        selectedYear === currentDate.getFullYear() &&
                        "opacity-50 cursor-not-allowed",
                    )}
                    disabled={selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear()}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-6 pt-4 flex-shrink-0">
                <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-green-400/10 p-2.5 rounded-xl">
                      <Filter className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">
                        {type === "kilometros" ? "Total Kilómetros" : "Total Bonos"}
                      </p>
                      {isLoading ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-gray-800 font-bold text-lg">{formatValue(summaryData.totalValue)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-green-400/10 p-2.5 rounded-xl">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Días Activos</p>
                      {isLoading ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-gray-800 font-bold text-lg">{summaryData.activeDays}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-green-400/10 p-2.5 rounded-xl">
                      <LineChart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Promedio</p>
                      {isLoading ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-gray-800 font-bold text-lg">{formatValue(summaryData.averageValue)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-green-400/10 p-2.5 rounded-xl">
                      <Filter className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Máximo</p>
                      {isLoading ? (
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-gray-800 font-bold text-lg">{formatValue(summaryData.maxValue)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart controls */}
              <div className="flex justify-between items-center px-4 md:px-6 pt-4 flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType("area")}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      chartType === "area"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600",
                    )}
                  >
                    <AreaChart className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      chartType === "line"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600",
                    )}
                  >
                    <LineChart className="h-4 w-4" />
                  </button>
                </div>

                <button className="flex items-center gap-1 p-2 rounded-lg text-gray-600 text-sm hover:bg-gray-100 transition-colors">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>

              {/* Chart */}
              <div className="flex-1 px-4 md:px-6 pt-4 pb-6 overflow-auto">
                <div className="h-[300px] md:h-[400px] bg-white rounded-2xl border border-green-100 p-4 shadow-sm relative">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500 text-sm">Cargando datos...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <AlertCircle className="h-10 w-10 text-gray-400" />
                        <p className="mt-4 text-gray-500">{error}</p>
                      </div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <Calendar className="h-10 w-10 text-gray-400" />
                        <p className="mt-4 text-gray-500">No hay datos disponibles para este período</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "area" ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickFormatter={(value) => String(value)}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickFormatter={(value) =>
                              type === "kilometros" ? `${value}` : `$${(value / 1000).toFixed(0)}k`
                            }
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
                      ) : (
                        <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickFormatter={(value) => String(value)}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickFormatter={(value) =>
                              type === "kilometros" ? `${value}` : `$${(value / 1000).toFixed(0)}k`
                            }
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
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
