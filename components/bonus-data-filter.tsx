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
  Gift,
  DollarSign,
  Info,
  Download,
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

// Types
type ChartType = "line" | "bar" | "area"

interface DataPoint {
  name: string
  value: number
  prevValue?: number
  changeType?: "increase" | "decrease" | "neutral"
}

interface FilteredData {
  totalBonus: number
  chartData: DataPoint[]
}

// Modificar la función processYearlyBonusData para incluir diferentes valores de bono según el año
const processYearlyBonusData = (apiData: any, year: number): DataPoint[] => {
  if (!apiData) {
    return []
  }

  // Month names in Spanish
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Initialize monthly data structure
  const monthlyData: { [key: number]: { bonus: number; baseBonus: number } } = {}

  // Initialize all months with zeros
  for (let i = 0; i < 12; i++) {
    monthlyData[i] = { bonus: 0, baseBonus: 0 }
  }

  // Fecha límite para la regla de los bonos (marzo 2025)
  const limitDate = new Date(2025, 2, 31) // 31 de marzo de 2025
  const currentDate = new Date()

  // Determinar el valor base del bono según el año
  let baseBonusValue = 122000; // Valor por defecto para años no especificados
  
  // Valores consistentes con bonus-config.ts
  switch (year) {
    case 2025:
      baseBonusValue = 142000; // Valor para 2025
      break;
    case 2024:
      baseBonusValue = 135000; // Valor para 2024
      break;
    case 2023:
      baseBonusValue = 128000; // Valor para 2023
      break;
    case 2022:
    case 2021:
    case 2020:
      baseBonusValue = 122000; // Valor para 2022, 2021 y 2020
      break;
  }

  // If we have lastMonthData, use it to populate the corresponding month
  if (apiData.lastMonthData && apiData.lastMonthData.year === year) {
    const month = apiData.lastMonthData.month - 1 // Convert to 0-based index
    monthlyData[month] = {
      bonus: apiData.lastMonthData.finalValue || baseBonusValue,
      baseBonus: apiData.lastMonthData.bonusValue || baseBonusValue,
    }
  }

  // Si no hay datos pero estamos dentro del período válido (hasta marzo 2025),
  // aplicamos la regla del bono base correspondiente al año
  if (Object.values(monthlyData).every((data: any) => data.bonus === 0)) {
    // Para cada mes del año seleccionado
    for (let month = 0; month < 12; month++) {
      // Crear fecha para este mes y año
      const monthDate = new Date(year, month, 1)

      // Solo aplicar la regla si la fecha es anterior o igual a marzo 2025
      if (monthDate <= limitDate) {
        // Si es un mes pasado o actual (no futuro)
        if (monthDate <= currentDate) {
          monthlyData[month] = {
            bonus: baseBonusValue, // Bono completo
            baseBonus: baseBonusValue,
          }
        }
      }
    }
  }

  // Convert to chart format
  return Object.entries(monthlyData).map(([monthIndex, values]) => {
    const month = Number.parseInt(monthIndex)
    const value = values.bonus
    const prevValue = values.baseBonus

    return {
      name: months[month],
      value,
      prevValue,
      changeType: "neutral",
    }
  })
}

// Calculate statistics from API data
const calculateBonusStatistics = (chartData: DataPoint[]): { totalBonus: number } => {
  const totalBonus = chartData.reduce((sum, item) => sum + item.value, 0)

  return {
    totalBonus,
  }
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BonusDataFilter() {
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
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)

  // Verificar si el año seleccionado es 2025 o posterior
  const showTemporalRuleMessage = selectedYear >= 2025

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.codigo) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/user/bonuses?codigo=${user.codigo}&year=${selectedYear}`)

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.status}`)
        }

        const data = await response.json()
        console.log("Bonus API data for year", selectedYear, ":", data)

        // Verificar si la respuesta tiene error
        if (data.error) {
          throw new Error(data.message || data.error || "Error al cargar los datos de bonos")
        }

        setApiData(data)

        // Procesar datos para el año seleccionado
        const yearlyData = processYearlyBonusData(data, parseInt(selectedYear))
        const statistics = calculateBonusStatistics(yearlyData)
        
        setFilteredData({
          totalBonus: statistics.totalBonus,
          chartData: yearlyData
        })

        // Set available years from API data with fallback
        const yearsFromApi = data.availableYears || []
        if (yearsFromApi.length > 0) {
          setAvailableYears(yearsFromApi)
        } else {
          // Fallback: usar año actual y 5 años anteriores
          const currentYear = new Date().getFullYear()
          const fallbackYears = Array.from({ length: 6 }, (_, i) => currentYear - i)
          setAvailableYears(fallbackYears.map(String)) // Convertir a string
        }

        setIsLoading(false)
      } catch (err: any) {
        console.error("Error fetching bonus data:", err)
        setError(err.message || "Error al cargar los datos")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.codigo, selectedYear])

  // Handle year navigation
  const handlePrevYear = () => {
    const minYear = Math.min(...availableYears.map(Number))
    if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextYear = () => {
    const maxYear = Math.max(...availableYears.map(Number))
    if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1)
    }
  }

  // Handle export data
  const handleExportData = () => {
    if (!filteredData) return

    // Create CSV content
    const headers = ["Mes", "Bono Base", "Bono Final"]
    const rows = filteredData.chartData.map((item) => [item.name, item.prevValue || 0, item.value])

    const csvContent = headers.join(",") + "\n" + rows.map((row) => row.join(",")).join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `bonos_${selectedYear}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <div className="bg-white p-3 rounded-lg shadow-md border border-teal-100">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-teal-600 font-semibold">{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.prevValue !== undefined && payload[0].payload.prevValue > 0 && (
            <div className="flex items-center mt-1 text-xs">
              <span className="text-gray-500 mr-1">Bono base:</span>
              <span className="font-medium">{formatCurrency(payload[0].payload.prevValue)}</span>
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
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-teal-100 p-3 sm:p-6"
    >
      {/* Header with title and period selector */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4"
      >
        <div className="flex items-center">
          <div className="h-1.5 w-6 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full mr-2"></div>
          <h3 className="text-gray-800 font-bold text-xl flex items-center">
            <Gift className="h-5 w-5 mr-2 text-teal-600" />
            Análisis de Bonos
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-teal-50 rounded-xl p-1 flex">
            <button
              onClick={() => setChartType("area")}
              className={cn(
                "p-2 rounded-lg transition-all",
                chartType === "area" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-teal-700"
              )}
            >
              <AreaChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "p-2 rounded-lg transition-all",
                chartType === "bar" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-teal-700"
              )}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={cn(
                "p-2 rounded-lg transition-all",
                chartType === "line" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-teal-700"
              )}
            >
              <LineChart className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleExportData}
            disabled={isLoading || !filteredData}
            className={cn(
              "p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-1",
              (isLoading || !filteredData) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Exportar</span>
          </button>
        </div>
      </motion.div>

      {/* Period selector */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between bg-teal-50/50 rounded-xl p-3 border border-teal-100/50">
          <button
            onClick={handlePrevYear}
            className={cn(
              "p-2 rounded-lg hover:bg-white/70 transition-colors",
              selectedYear === Math.min(...availableYears.map(Number))
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-teal-700")
            }
            disabled={selectedYear === Math.min(...availableYears.map(Number))}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 font-medium text-gray-800 hover:text-teal-700 transition-colors"
            >
              <Calendar className="h-5 w-5 text-teal-600" />
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
                  className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-teal-100 p-2 z-10 w-32"
                >
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(Number(year))
                        setShowYearDropdown(false)
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedYear === Number(year)
                          ? "bg-teal-50 text-teal-700 font-medium"
                          : "hover:bg-teal-50/50 text-gray-700"
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
              selectedYear === Math.max(...availableYears.map(Number))
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-teal-700")
            }
            disabled={selectedYear === Math.max(...availableYears.map(Number))}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Mensaje informativo sobre la regla temporal */}
      {showTemporalRuleMessage && (
        <motion.div
          variants={itemVariants}
          className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="font-medium">Información importante</p>
              <p className="mt-1">
                Para el año 2024, el bono base sin deducciones es de $130.000. Para el año 2025, el bono base es de
                $142.000. Esta regla solo aplica hasta marzo de 2025. A partir de abril de 2025, se aplicará una nueva
                política de bonificaciones.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats summary */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/40 p-4 rounded-2xl border border-teal-100/40 shadow-sm transition-all group hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-100/40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-100/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 relative z-10">
            <div className="bg-teal-400/10 p-2 sm:p-2.5 rounded-lg sm:rounded-xl hidden sm:block">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Bonos</p>
              {isLoading ? (
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-gray-800 font-bold text-xl">{formatCurrency(filteredData?.totalBonus || 0)}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        variants={chartContainerVariants}
        className="bg-white rounded-2xl border border-teal-100 p-2 sm:p-4 shadow-sm h-60 sm:h-80 relative"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
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
        ) : filteredData?.chartData.length === 0 || filteredData?.chartData.every((item) => item.value === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                <Filter className="h-8 w-8 text-teal-400" />
              </div>
              <p className="text-gray-800 font-medium mb-2">No hay datos disponibles</p>
              <p className="text-gray-500 text-sm">
                No se encontraron registros de bonos para el período seleccionado.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={filteredData?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorBonusValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0d9488"
                  fillOpacity={1}
                  fill="url(#colorBonusValue)"
                  strokeWidth={2}
                  animationDuration={1500}
                  activeDot={{ r: 6, stroke: "#0d9488", strokeWidth: 2, fill: "white" }}
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
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} animationDuration={1500} />
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
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 4, stroke: "#0d9488", strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6, stroke: "#0d9488", strokeWidth: 2, fill: "white" }}
                  animationDuration={1500}
                />
              </RechartsLineChart>
            )}
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Legend and info */}
      <motion.div
        variants={itemVariants}
        className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500"
      >
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <div className="w-3 h-3 rounded-full bg-teal-500"></div>
          <span>Bonos mensuales</span>
        </div>

        <div className="flex items-center">
          <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
          <span>Filtro: Anual • Año {selectedYear}</span>
        </div>
      </motion.div>

      {/* Info tooltip */}
      <div className="relative">
        <AnimatePresence>
          {showInfoTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-teal-100 p-3 text-xs text-gray-600 z-20"
            >
              <p className="font-medium text-gray-800 mb-1">Acerca de los bonos</p>
              <p>
                Los bonos se calculan mensualmente y pueden tener deducciones por diferentes conceptos como retardos,
                incapacidades u otros eventos.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
