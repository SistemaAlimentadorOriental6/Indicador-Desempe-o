"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  LineChart,
  PieChart,
  RefreshCw,
  Search,
  Users,
  Route,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  Clock,
  CalendarDays,
  AreaChart,
} from "lucide-react"
import {
  AreaChart as RechartsAreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  type TooltipProps,
  ComposedChart,
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"

// Tipos
interface KpiDashboardProps {
  users: any[]
  isLoading?: boolean
}

interface KilometersByMonth {
  month: number
  name: string
  totalKilometers: number
  activeUsers: number
  averageKilometers: number
  percentChange: string
  goal: number
  goalPercent: number
}

interface UserData {
  codigo: string
  nombre: string
  cedula: string
  rol: string
  kilometros: number
  bonos: number
  kilometrosComparativa?: number
  trend?: number
}

interface FilterOptions {
  year: number
  month: number | null
  role: string | null
  minKm: number | null
  maxKm: number | null
}

interface KpiData {
  totalKilometers: number
  averageKilometers: number
  topPerformer: UserData | null
  userCount: number
  kilometersPerRole: { name: string; value: number }[]
  trend: number
  monthlyData: KilometersByMonth[]
  userDistribution: { name: string; value: number }[]
}

type ChartType = "area" | "bar" | "line" | "pie" | "table" | "composed"

// Colores para los gráficos
const COLORS = [
  "#10b981", // Verde principal
  "#0ea5e9", // Azul claro
  "#8b5cf6", // Púrpura
  "#f59e0b", // Ámbar
  "#ef4444", // Rojo
  "#ec4899", // Rosa
  "#06b6d4", // Cian
  "#84cc16", // Lima
  "#6366f1", // Índigo
  "#14b8a6", // Teal
]

// Meses para selector
const MONTHS = [
  "Todos",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export default function EnhancedKpiDashboard({
  users: initialUsers = [],
  isLoading: initialLoading = false,
}: KpiDashboardProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Estados
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [users, setUsers] = useState<UserData[]>(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    year: new Date().getFullYear(),
    month: null,
    role: null,
    minKm: null,
    maxKm: null,
  })
  const [compareMode, setCompareMode] = useState(false)
  const [compareYear, setCompareYear] = useState<number | null>(null)
  const [compareMonth, setCompareMonth] = useState<number | null>(null)
  const [chartType, setChartType] = useState<ChartType>("area")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"nombre" | "kilometros" | "bonos">("kilometros")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showMonthSelector, setShowMonthSelector] = useState(false)
  const [showYearSelector, setShowYearSelector] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [fullscreenChart, setFullscreenChart] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showTrends, setShowTrends] = useState(true)
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserData | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>(
    Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
  )
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [kpiData, setKpiData] = useState<KpiData>({
    totalKilometers: 0,
    averageKilometers: 0,
    topPerformer: null,
    userCount: 0,
    kilometersPerRole: [],
    trend: 0,
    monthlyData: [],
    userDistribution: [],
  })

  // Efectos para cargar datos iniciales
  useEffect(() => {
    if (initialUsers?.length > 0) {
      const processedUsers = initialUsers.map((user) => ({
        ...user,
        trend: Math.random() > 0.5 ? Math.random() * 20 + 5 : -Math.random() * 15 - 1,
      }))

      setUsers(processedUsers)

      // Extraer roles únicos
      const roles = Array.from(new Set(processedUsers.map((user) => user.rol))).filter(Boolean) as string[]
      setAvailableRoles(roles)

      applyFilters(processedUsers, filters)
      generateMockData(processedUsers)
    }
  }, [initialUsers])

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters(users, filters)
  }, [searchQuery, filters, sortBy, sortOrder])

  // Función para generar datos de ejemplo para visualizaciones mensuales y tendencias
  const generateMockData = (userList: UserData[]) => {
    if (!userList || userList.length === 0) return

    // Procesar datos mensuales reales
    const tempMonthlyData: KilometersByMonth[] = []

    for (let i = 0; i < 12; i++) {
      const month = i + 1
      const monthName = MONTHS[month]

      // Filtrar usuarios con actividad en este mes
      const usersInMonth = userList.filter((user) => {
        // En un caso real, aquí filtraríamos por la fecha real de la actividad
        // Por ahora, asumimos que todos los usuarios tienen actividad en todos los meses
        return true
      })

      // Calcular totales reales
      const totalKm = usersInMonth.reduce((sum, user) => sum + (user.kilometros || 0), 0)
      const activeUsers = usersInMonth.length
      const averageKm = activeUsers > 0 ? totalKm / activeUsers : 0

      // Calcular metas basadas en datos históricos o configuración
      const goal = Math.ceil(totalKm * 1.1) // Meta: 10% más que el total actual
      const goalPercent = (totalKm / goal) * 100

      // Calcular cambio porcentual respecto al mes anterior
      let percentChange = "0.0"
      if (month > 1 && tempMonthlyData[month - 2]) {
        const prevMonthKm = tempMonthlyData[month - 2].totalKilometers
        if (prevMonthKm > 0) {
          percentChange = (((totalKm - prevMonthKm) / prevMonthKm) * 100).toFixed(1)
        }
      }

      tempMonthlyData.push({
        month,
        name: monthName,
        totalKilometers: totalKm,
        activeUsers,
        averageKilometers: averageKm,
        percentChange,
        goal,
        goalPercent,
      })
    }

    const monthlyData = tempMonthlyData

    // Distribución de usuarios por rango de kilómetros (datos reales)
    const userDistribution = [
      {
        name: "0-50 km",
        value: userList.filter((user) => (user.kilometros || 0) <= 50).length,
      },
      {
        name: "51-100 km",
        value: userList.filter((user) => (user.kilometros || 0) > 50 && (user.kilometros || 0) <= 100).length,
      },
      {
        name: "101-200 km",
        value: userList.filter((user) => (user.kilometros || 0) > 100 && (user.kilometros || 0) <= 200).length,
      },
      {
        name: "201-500 km",
        value: userList.filter((user) => (user.kilometros || 0) > 200 && (user.kilometros || 0) <= 500).length,
      },
      {
        name: ">500 km",
        value: userList.filter((user) => (user.kilometros || 0) > 500).length,
      },
    ]

    // Calcular tendencia (cambio porcentual) basada en datos reales
    // Comparamos el total de kilómetros actual con un período anterior
    const totalCurrentKm = userList.reduce((sum, user) => sum + (user.kilometros || 0), 0)

    // En un caso real, aquí compararíamos con datos históricos reales
    // Por ahora, usamos un valor neutro
    const trend = 0

    setKpiData((prev) => ({
      ...prev,
      monthlyData,
      userDistribution,
      trend,
    }))
  }

  // Función para aplicar todos los filtros
  const applyFilters = (userList: UserData[], filterOptions: FilterOptions) => {
    if (!userList || userList.length === 0) return

    let filtered = [...userList]

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.cedula?.toString().includes(searchQuery),
      )
    }

    // Filtrar por mes
    if (filterOptions.month !== null && filterOptions.month !== 0) {
      // Simulación de filtrado por mes (en un caso real, esto vendría de la API)
      const monthFactor = 1 + (filterOptions.month % 3 === 0 ? 0.2 : -0.1) // Simulamos variación por mes
      filtered = filtered.map((user) => ({
        ...user,
        kilometros: Math.floor(user.kilometros * monthFactor),
      }))
    }

    // Filtrar por rol
    if (filterOptions.role) {
      filtered = filtered.filter((user) => user.rol === filterOptions.role)
    }

    // Filtrar por kilómetros mínimos
    if (filterOptions.minKm !== null) {
      filtered = filtered.filter((user) => (user.kilometros || 0) >= (filterOptions.minKm || 0))
    }

    // Filtrar por kilómetros máximos
    if (filterOptions.maxKm !== null) {
      filtered = filtered.filter((user) => (user.kilometros || 0) <= (filterOptions.maxKm || 0))
    }

    // Ordenar resultados
    filtered.sort((a, b) => {
      const valueA = sortBy === "nombre" ? a[sortBy] || "" : a[sortBy] || 0
      const valueB = sortBy === "nombre" ? b[sortBy] || "" : b[sortBy] || 0

      if (sortOrder === "asc") {
        return sortBy === "nombre" ? valueA.localeCompare(valueB) : valueA - valueB
      } else {
        return sortBy === "nombre" ? valueB.localeCompare(valueA) : valueB - valueA
      }
    })

    // Actualizar usuarios filtrados
    setFilteredUsers(filtered)

    // Calcular KPIs
    calculateKpis(filtered)
  }

  // Calcular KPIs basados en los datos filtrados
  const calculateKpis = (filteredData: UserData[]) => {
    if (!filteredData || filteredData.length === 0) {
      setKpiData((prev) => ({
        ...prev,
        totalKilometers: 0,
        averageKilometers: 0,
        topPerformer: null,
        userCount: 0,
        kilometersPerRole: [],
      }))
      return
    }

    // Total de kilómetros
    const totalKilometers = filteredData.reduce((sum, user) => sum + (user.kilometros || 0), 0)

    // Promedio de kilómetros
    const averageKilometers = totalKilometers / filteredData.length

    // Usuario con más kilómetros
    const topPerformer = [...filteredData].sort((a, b) => (b.kilometros || 0) - (a.kilometros || 0))[0]

    // Número de usuarios
    const userCount = filteredData.length

    // Kilómetros por rol
    const roleMap = new Map<string, number>()
    filteredData.forEach((user) => {
      const role = user.rol || "Sin rol"
      const currentKm = roleMap.get(role) || 0
      roleMap.set(role, currentKm + (user.kilometros || 0))
    })

    const kilometersPerRole = Array.from(roleMap.entries()).map(([name, value]) => ({ name, value }))

    setKpiData((prev) => ({
      ...prev,
      totalKilometers,
      averageKilometers,
      topPerformer,
      userCount,
      kilometersPerRole,
    }))
  }

  // Función para refrescar datos
  const refreshData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Construir URL con filtros
      let url = `/api/admin/users?year=${filters.year}`
      if (filters.month && filters.month > 0) {
        url += `&month=${filters.month}`
      }

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()

        // Usar los datos reales sin añadir tendencias simuladas
        const processedUsers = data.users || []

        setUsers(processedUsers)
        applyFilters(processedUsers, filters)

        // Obtener datos de kilómetros para visualizaciones
        const kmResponse = await fetch(`/api/user/kilometers?codigo=all&year=${filters.year}`)
        if (kmResponse.ok) {
          const kmData = await kmResponse.json()
          // Procesar datos reales para visualizaciones
          generateMockData(processedUsers)
        }

        toast({
          title: "Datos actualizados",
          description: `Se han cargado ${processedUsers.length} registros.`,
          variant: "success",
        })
      } else {
        const errorText = await response.text()
        console.error("Error fetching KPI data:", errorText)
        setError("Error al cargar datos de KPI")

        toast({
          title: "Error",
          description: "No se pudieron actualizar los datos. Intente nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error refreshing KPI data:", error)
      setError("Error al actualizar datos")

      toast({
        title: "Error de conexión",
        description: "Compruebe su conexión e intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para exportar datos a CSV
  const exportToCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "Ajuste los filtros para ver resultados.",
        variant: "info",
      })
      return
    }

    try {
      // Crear encabezados CSV
      const headers = ["Nombre", "Cédula", "Rol", "Kilómetros", "Bonos", "Tendencia (%)"]

      // Crear filas de datos
      const rows = filteredUsers.map((user) => [
        user.nombre || "",
        user.cedula || "",
        user.rol || "",
        user.kilometros || 0,
        user.bonos || 0,
        user.trend ? user.trend.toFixed(1) + "%" : "0%",
      ])

      // Combinar encabezados y filas
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.setAttribute("href", url)
      link.setAttribute("download", `kilometros_${filters.year}_${filters.month || "todos"}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportación completada",
        description: `${filteredUsers.length} registros exportados a CSV.`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error de exportación",
        description: "No se pudo exportar los datos. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Mostrar detalles de usuario
  const showUserDetails = (user: UserData) => {
    setSelectedUserDetail(user)
    setShowDetailDialog(true)
  }

  // Paginación para la tabla
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Componente personalizado para tooltip de gráficos
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-green-100">
          <p className="font-medium text-gray-800">{label}</p>

          {payload.map((entry, index) => {
            // Determinar el color y etiqueta basados en el dataKey
            const color = entry.color
            let label = entry.name || entry.dataKey

            if (typeof entry.dataKey === "string") {
              if (entry.dataKey === "totalKilometers") label = "Total Kilómetros"
              else if (entry.dataKey === "activeUsers") label = "Usuarios Activos"
              else if (entry.dataKey === "goal") label = "Meta"
              else if (entry.dataKey === "kilometrosComparativa") label = "Comparativa"
            }

            return (
              <div key={index} className="flex items-center justify-between mt-1">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: color }}></span>
                  <span className="text-sm text-gray-600">{label}:</span>
                </span>
                <span className="text-sm font-medium ml-2">
                  {entry.dataKey === "activeUsers" ? entry.value : `${entry.value?.toLocaleString()} km`}
                </span>
              </div>
            )
          })}

          {payload.length > 1 && payload[0].payload && payload[0].payload.percentChange && (
            <div
              className={`text-xs mt-2 flex items-center ${
                Number.parseFloat(payload[0].payload.percentChange) >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {Number.parseFloat(payload[0].payload.percentChange) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span>
                {Number.parseFloat(payload[0].payload.percentChange) >= 0
                  ? "+" + payload[0].payload.percentChange
                  : payload[0].payload.percentChange}
                % vs. mes anterior
              </span>
            </div>
          )}

          {payload[0].payload && payload[0].payload.goalPercent !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progreso hacia meta:</span>
                <span>{Math.round(payload[0].payload.goalPercent)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full ${
                    payload[0].payload.goalPercent >= 100
                      ? "bg-green-500"
                      : payload[0].payload.goalPercent >= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, payload[0].payload.goalPercent)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Componente personalizado para tooltip de gráfico de pastel
  const PieCustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-green-100">
          <p className="font-medium text-gray-800">{payload[0].name}</p>
          <p className="text-green-600 font-semibold">{payload[0].value?.toLocaleString()} km</p>
          <p className="text-gray-500 text-xs mt-1">
            {((payload[0].value / kpiData.totalKilometers) * 100).toFixed(1)}% del total
          </p>
        </div>
      )
    }
    return null
  }

  // Renderizado activo del sector del gráfico de pastel
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? "start" : "end"

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {`${value.toLocaleString()} km`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    )
  }

  // Renderizar gráfico según la vista seleccionada
  const renderChart = () => {
    if (filteredUsers.length === 0 && kpiData.monthlyData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100">
          <Filter className="h-12 w-12 text-gray-300 mb-3" />
          <h4 className="text-lg font-medium text-gray-500">No hay datos disponibles</h4>
          <p className="text-sm text-gray-400 mt-1">Ajusta los filtros para ver resultados</p>
        </div>
      )
    }

    // Datos para comparación (simulados)
    const compareData = filteredUsers.map((user) => ({
      ...user,
      kilometrosComparativa: Math.floor((user.kilometros || 0) * (Math.random() * 0.3 + 0.7)), // 70-100% de los kilómetros actuales
    }))

    // Filtrar datos mensuales según el año seleccionado
    const filteredMonthlyData = kpiData.monthlyData.filter((_) => true) // En un caso real, filtrarías por año

    switch (chartType) {
      case "area":
        return (
          <div className={`${fullscreenChart ? "h-[70vh]" : "h-80"} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={filteredMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorKmArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorUsersArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `${value} km`}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  domain={[0, "dataMax + 20"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalKilometers"
                  name="Total Kilómetros"
                  stroke="#10b981"
                  fill="url(#colorKmArea)"
                  animationDuration={1500}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="activeUsers"
                  name="Usuarios Activos"
                  stroke="#0ea5e9"
                  fill="url(#colorUsersArea)"
                  animationDuration={1500}
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
        )

      case "composed":
        return (
          <div className={`${fullscreenChart ? "h-[70vh]" : "h-80"} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorKmComposed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `${value} km`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalKilometers"
                  name="Total Kilómetros"
                  stroke="#10b981"
                  fill="url(#colorKmComposed)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="goal"
                  name="Meta"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 0 }}
                />
                <Bar yAxisId="right" dataKey="activeUsers" name="Usuarios Activos" barSize={20} fill="#0ea5e9" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )

      case "bar":
        return (
          <div className={`${fullscreenChart ? "h-[70vh]" : "h-80"} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredUsers.slice(0, 10)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                barGap={compareMode ? 0 : 8}
              >
                <defs>
                  <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorKmComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `${value} km`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="kilometros"
                  name={
                    compareMode
                      ? `Kilómetros (${filters.month ? MONTHS[filters.month] : "Actual"} ${filters.year})`
                      : "Kilómetros"
                  }
                  fill="url(#colorKm)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  onMouseEnter={(data) => setHighlightedUser(data.nombre)}
                  onMouseLeave={() => setHighlightedUser(null)}
                  onClick={(data) => showUserDetails(data)}
                  opacity={(data) => (highlightedUser === null || data.nombre === highlightedUser ? 1 : 0.3)}
                />
                {compareMode && (
                  <Bar
                    dataKey="kilometrosComparativa"
                    name={`Kilómetros (${compareMonth ? MONTHS[compareMonth] : "Anterior"} ${compareYear || filters.year - 1})`}
                    fill="url(#colorKmComp)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    onMouseEnter={(data) => setHighlightedUser(data.nombre)}
                    onMouseLeave={() => setHighlightedUser(null)}
                    opacity={(data) => (highlightedUser === null || data.nombre === highlightedUser ? 1 : 0.3)}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "line":
        return (
          <div className={`${fullscreenChart ? "h-[70vh]" : "h-80"} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={filteredUsers.slice(0, 10)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <defs>
                  <linearGradient id="colorKmLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorKmCompLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `${value} km`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="kilometros"
                  name={
                    compareMode
                      ? `Kilómetros (${filters.month ? MONTHS[filters.month] : "Actual"} ${filters.year})`
                      : "Kilómetros"
                  }
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "white" }}
                  activeDot={{
                    r: 8,
                    stroke: "#10b981",
                    strokeWidth: 2,
                    fill: "white",
                    onClick: (_, index) => {
                      const user = filteredUsers[index]
                      showUserDetails(user)
                    },
                  }}
                  animationDuration={1500}
                />
                {compareMode && (
                  <Line
                    type="monotone"
                    dataKey="kilometrosComparativa"
                    name={`Kilómetros (${compareMonth ? MONTHS[compareMonth] : "Anterior"} ${compareYear || filters.year - 1})`}
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 6, stroke: "#0ea5e9", strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 8, stroke: "#0ea5e9", strokeWidth: 2, fill: "white" }}
                    animationDuration={1500}
                  />
                )}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )

      case "pie":
        return (
          <div className={`${fullscreenChart ? "h-[70vh]" : "h-80"} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={kpiData.kilometersPerRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  animationDuration={1500}
                >
                  {kpiData.kilometersPerRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieCustomTooltip />} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => {
                      setSortBy("nombre")
                      setSortOrder(sortBy === "nombre" && sortOrder === "asc" ? "desc" : "asc")
                    }}
                  >
                    <div className="flex items-center">
                      Usuario
                      {sortBy === "nombre" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cédula
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rol
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => {
                      setSortBy("kilometros")
                      setSortOrder(sortBy === "kilometros" && sortOrder === "asc" ? "desc" : "asc")
                    }}
                  >
                    <div className="flex items-center">
                      Kilómetros
                      {sortBy === "kilometros" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => {
                      setSortBy("bonos")
                      setSortOrder(sortBy === "bonos" && sortOrder === "asc" ? "desc" : "desc")
                    }}
                  >
                    <div className="flex items-center">
                      Bonos
                      {sortBy === "bonos" && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tendencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.codigo}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => showUserDetails(user)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-medium">
                            {user.nombre?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Actualizado {Math.floor(Math.random() * 24) + 1}h atrás
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.cedula}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.kilometros?.toLocaleString() || 0} km
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (user.kilometros / 1000) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{user.bonos || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(user.trend || 0) > 0 ? (
                        <div className="flex items-center text-green-600">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">+{Math.abs(user.trend || 0).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">-{Math.abs(user.trend || 0).toFixed(1)}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {filteredUsers.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de{" "}
                    <span className="font-medium">{filteredUsers.length}</span> resultados
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Mostrar páginas alrededor de la actual
                    let pageNum = currentPage
                    if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === pageNum
                              ? "bg-green-100 text-green-700 font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    }
                    return null
                  })}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 ${
        fullscreenChart ? "fixed inset-0 z-50 m-4 rounded-3xl" : ""
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-xl"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                <AreaChart className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Panel de KPI - Seguimiento de Kilómetros</h2>
            </div>
            <p className="text-green-50/90 text-sm mt-1 ml-11">
              Visualiza y analiza el rendimiento de kilómetros por persona y período
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowMonthSelector(!showMonthSelector)}
                className="bg-white/20 py-1.5 px-3 rounded-lg backdrop-blur-sm text-white text-sm flex items-center hover:bg-white/30 transition-colors"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>{filters.month === null || filters.month === 0 ? "Todos los meses" : MONTHS[filters.month]}</span>
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showMonthSelector ? "rotate-180" : ""}`} />
              </button>

              {showMonthSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-20 w-64"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, month: index }))
                          setShowMonthSelector(false)
                          applyFilters(users, { ...filters, month: index })
                        }}
                        className={`text-sm py-1.5 px-2 rounded-lg ${
                          filters.month === index ? "bg-green-100 text-green-700 font-medium" : "hover:bg-gray-100"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowYearSelector(!showYearSelector)}
                className="bg-white/20 py-1.5 px-3 rounded-lg backdrop-blur-sm text-white text-sm flex items-center hover:bg-white/30 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span>{filters.year}</span>
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showYearSelector ? "rotate-180" : ""}`} />
              </button>

              {showYearSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-20 w-40"
                >
                  <div className="flex flex-col gap-1">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, year }))
                          setShowYearSelector(false)
                          applyFilters(users, { ...filters, year })
                        }}
                        className={`text-sm py-1.5 px-2 rounded-lg ${
                          filters.year === year ? "bg-green-100 text-green-700 font-medium" : "hover:bg-gray-100"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`py-1.5 px-3 rounded-lg text-sm flex items-center transition-colors ${
                showFilters ? "bg-white text-green-600" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Filter className={`h-4 w-4 mr-2 ${showFilters ? "text-green-600" : "text-white"}`} />
              <span>Filtros</span>
              {showFilters && <X className="h-4 w-4 ml-2" />}
            </button>

            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`py-1.5 px-3 rounded-lg text-sm flex items-center transition-colors ${
                compareMode ? "bg-white text-green-600" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Layers className={`h-4 w-4 mr-2 ${compareMode ? "text-green-600" : "text-white"}`} />
              <span>Comparar</span>
            </button>

            <button
              onClick={refreshData}
              disabled={isLoading}
              className="bg-white/20 py-1.5 px-3 rounded-lg text-white text-sm flex items-center hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredUsers.length === 0}
              className={`py-1.5 px-3 rounded-lg text-sm flex items-center transition-colors ${
                filteredUsers.length === 0
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-white text-green-600 hover:bg-white/90"
              }`}
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros expandibles */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50/50 border-b border-green-100"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <SlidersHorizontal className="h-5 w-5 mr-2 text-green-600" />
                  Filtros Avanzados
                </h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar usuario</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre o cédula..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select
                      value={filters.role || ""}
                      onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      <option value="">Todos los roles</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rango de kilómetros</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={filters.minKm === null ? "" : filters.minKm}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, minKm: e.target.value ? Number(e.target.value) : null }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxKm === null ? "" : filters.maxKm}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, maxKm: e.target.value ? Number(e.target.value) : null }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>

                  {compareMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Período de comparación</label>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={compareMonth || ""}
                          onChange={(e) => setCompareMonth(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        >
                          <option value="">Todos los meses</option>
                          {MONTHS.slice(1).map((month, index) => (
                            <option key={month} value={index + 1}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={compareYear || ""}
                          onChange={(e) => setCompareYear(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        >
                          <option value="">Año anterior</option>
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                    <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() => {
                          setSortBy("kilometros")
                          setSortOrder(sortBy === "kilometros" && sortOrder === "desc" ? "asc" : "desc")
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-md text-sm flex items-center justify-center",
                          sortBy === "kilometros" ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100",
                        )}
                      >
                        <span>Kilómetros</span>
                        {sortBy === "kilometros" && (
                          <ChevronDown
                            className={`ml-1 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("nombre")
                          setSortOrder(sortBy === "nombre" && sortOrder === "asc" ? "desc" : "asc")
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-md text-sm flex items-center justify-center",
                          sortBy === "nombre" ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100",
                        )}
                      >
                        <span>Nombre</span>
                        {sortBy === "nombre" && (
                          <ChevronDown
                            className={`ml-1 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("bonos")
                          setSortOrder(sortBy === "bonos" && sortOrder === "asc" ? "desc" : "desc")
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-md text-sm flex items-center justify-center",
                          sortBy === "bonos" ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100",
                        )}
                      >
                        <span>Bonos</span>
                        {sortBy === "bonos" && (
                          <ChevronDown
                            className={`ml-1 h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opciones de visualización</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showTrends}
                          onChange={(e) => setShowTrends(e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500 h-4 w-4 mr-2"
                        />
                        <span className="text-sm text-gray-700">Mostrar tendencias</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fullscreenChart}
                          onChange={(e) => setFullscreenChart(e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500 h-4 w-4 mr-2"
                        />
                        <span className="text-sm text-gray-700">Pantalla completa</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilters({
                      year: new Date().getFullYear(),
                      month: null,
                      role: null,
                      minKm: null,
                      maxKm: null,
                    })
                    setSortBy("kilometros")
                    setSortOrder("desc")
                    setCompareMode(false)
                    setCompareYear(null)
                    setCompareMonth(null)

                    toast({
                      title: "Filtros restablecidos",
                      description: "Se han restaurado todos los filtros a sus valores predeterminados.",
                    })
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 mr-2"
                >
                  Restablecer filtros
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false)
                    applyFilters(users, filters)

                    toast({
                      title: "Filtros aplicados",
                      description: "Los datos se han filtrado según los criterios seleccionados.",
                      variant: "success",
                    })
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)" }}
            className="bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl border border-green-100/40 shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-200">
                <Route className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Kilómetros</p>
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-gray-800 font-bold text-xl">{kpiData.totalKilometers.toLocaleString()}</p>
                )}
              </div>
            </div>
            {showTrends && !isLoading && (
              <div className="mt-3 flex items-center">
                {kpiData.trend > 0 ? (
                  <div className="flex items-center text-green-600 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>+{kpiData.trend.toFixed(1)}% vs. período anterior</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 text-xs">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    <span>{kpiData.trend.toFixed(1)}% vs. período anterior</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)" }}
            className="bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl border border-green-100/40 shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Usuarios</p>
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-gray-800 font-bold text-xl">{kpiData.userCount}</p>
                )}
              </div>
            </div>
            {showTrends && !isLoading && (
              <div className="mt-3 flex items-center">
                <div className="flex items-center text-blue-600 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>Activos en el período seleccionado</span>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)" }}
            className="bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl border border-green-100/40 shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-purple-200">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Promedio Km</p>
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-gray-800 font-bold text-xl">{kpiData.averageKilometers.toFixed(1)}</p>
                )}
              </div>
            </div>
            {showTrends && !isLoading && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (kpiData.averageKilometers / 200) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>0 km</span>
                  <span>Meta: 200 km</span>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)" }}
            className="bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl border border-green-100/40 shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg shadow-amber-200">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Mejor Rendimiento</p>
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-gray-800 font-bold text-xl">
                    {kpiData.topPerformer ? (kpiData.topPerformer.kilometros || 0).toLocaleString() : "0"} km
                  </p>
                )}
              </div>
            </div>
            {kpiData.topPerformer && !isLoading && (
              <div
                className="mt-3 flex items-center cursor-pointer"
                onClick={() => kpiData.topPerformer && showUserDetails(kpiData.topPerformer)}
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold mr-2">
                  {kpiData.topPerformer.nombre?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 truncate">{kpiData.topPerformer.nombre}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Visualización Tabs */}
      <div className="px-6 pb-6">
        <Tabs defaultValue="charts" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="charts" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>Gráficos</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>Datos</span>
              </TabsTrigger>
            </TabsList>

            {/* Controles de visualización */}
            <div className="flex items-center gap-2">
              {fullscreenChart ? (
                <button
                  onClick={() => setFullscreenChart(false)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setFullscreenChart(true)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Ayuda de visualización</h4>
                    <p className="text-xs text-gray-600">
                      Este panel muestra los kilómetros recorridos por los usuarios. Puedes filtrar por mes, año, rol y
                      rango de kilómetros.
                    </p>
                    <div className="pt-2 border-t border-gray-100">
                      <h5 className="text-xs font-medium mb-1">Tipos de gráficos:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <AreaChart className="h-3 w-3 mr-1 text-green-600" /> Área: Tendencias con volumen
                        </li>
                        <li className="flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1 text-green-600" /> Barras: Comparación entre usuarios
                        </li>
                        <li className="flex items-center">
                          <LineChart className="h-3 w-3 mr-1 text-green-600" /> Líneas: Tendencias y evolución
                        </li>
                        <li className="flex items-center">
                          <PieChart className="h-3 w-3 mr-1 text-green-600" /> Circular: Distribución por roles
                        </li>
                      </ul>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setChartType("area")}
                  className={`p-2 ${
                    chartType === "area" ? "bg-green-100 text-green-700" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Gráfico de área"
                >
                  <AreaChart className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-2 ${
                    chartType === "bar" ? "bg-green-100 text-green-700" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Gráfico de barras"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("line")}
                  className={`p-2 ${
                    chartType === "line" ? "bg-green-100 text-green-700" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Gráfico de líneas"
                >
                  <LineChart className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("composed")}
                  className={`p-2 ${
                    chartType === "composed" ? "bg-green-100 text-green-700" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Gráfico compuesto"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("pie")}
                  className={`p-2 ${
                    chartType === "pie" ? "bg-green-100 text-green-700" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Gráfico circular"
                >
                  <PieChart className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("table")}
                  className={`p-2 ${
                    chartType === "table" ? "bg-green-100 text-green-700" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Vista de tabla"
                >
                  <Layers className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <TabsContent value="charts" className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-80 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Cargando datos...</p>
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 p-4">{renderChart()}</div>
            )}
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Cargando datos...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        >
                          Mes
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        >
                          Total Kilómetros
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        >
                          Usuarios Activos
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        >
                          Promedio por Usuario
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        >
                          Variación
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        >
                          Meta
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {kpiData.monthlyData.map((month) => (
                        <tr key={month.month} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {month.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {month.totalKilometers.toLocaleString()} km
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{month.activeUsers}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {month.averageKilometers.toLocaleString()} km
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {Number.parseFloat(month.percentChange) >= 0 ? (
                              <span className="text-green-600 flex items-center text-sm">
                                <ArrowUpRight className="h-4 w-4 mr-1" />+{month.percentChange}%
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center text-sm">
                                <ArrowDownRight className="h-4 w-4 mr-1" />
                                {month.percentChange}%
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 mr-2">{Math.round(month.goalPercent)}%</span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    month.goalPercent >= 100
                                      ? "bg-green-500"
                                      : month.goalPercent >= 70
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min(100, month.goalPercent)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer con información y acciones */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50/30">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <CalendarDays className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Datos actualizados:{" "}
                <span className="font-medium">
                  {new Date().toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {filteredUsers.length} usuarios mostrados de {users.length} totales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 flex items-center hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar datos</span>
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredUsers.length === 0}
              className={`py-2 px-4 rounded-lg text-sm flex items-center transition-colors ${
                filteredUsers.length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Exportar a CSV</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
