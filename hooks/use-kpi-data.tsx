"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { UserData, KpiData, FilterOptions, KilometersByMonth } from "@/types/kpi"

export function useKpiData(initialUsers: UserData[] = [], initialLoading = false) {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>(initialUsers)
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading)
  const [error, setError] = useState<string | null>(null)

  // Filtros y opciones
  const [filters, setFilters] = useState<FilterOptions>({
    year: new Date().getFullYear(),
    month: null,
    role: null,
    minKm: null,
    maxKm: null,
  })
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [compareMode, setCompareMode] = useState<boolean>(false)
  const [compareYear, setCompareYear] = useState<number | null>(null)
  const [compareMonth, setCompareMonth] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [chartType, setChartType] = useState<"area" | "bar" | "line" | "pie" | "table" | "composed">("bar")
  const [fullscreenChart, setFullscreenChart] = useState<boolean>(false)

  // Datos KPI calculados
  const [kpiData, setKpiData] = useState<KpiData>({
    totalKilometers: 0,
    averageKilometers: 0,
    userCount: 0,
    trend: 0,
    topPerformer: null,
    monthlyData: [],
    kilometersPerRole: [],
    kilometersByMonth: [],
  })

  // Función para calcular la tendencia basada en datos reales
  const calculateTrend = useCallback((currentData: number, previousData: number): number => {
    if (previousData === 0) return 0
    return ((currentData - previousData) / previousData) * 100
  }, [])

  // Función para cargar datos de manera segura
  const fetchWithErrorHandling = useCallback(async (url: string, errorMessage: string) => {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No hay detalles disponibles")
        console.error(`Error en ${url}:`, errorText)
        throw new Error(`${errorMessage} (Status: ${response.status})`)
      }

      return await response.json()
    } catch (err) {
      console.error(`Error fetching ${url}:`, err)
      throw err
    }
  }, [])

  // Función para cargar datos
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verificar si estamos en un entorno de desarrollo y usar datos de ejemplo si es necesario
      const isDev = process.env.NODE_ENV === "development"

      // Construir URLs
      const kmUrl = `/api/admin/statistics?year=${filters.year}${filters.month ? `&month=${filters.month}` : ""}`
      const bonusUrl = `/api/user/bonuses?year=${filters.year}${filters.month ? `&month=${filters.month}` : ""}`
      const progressUrl = `/api/admin/statistics?type=yearly&year=${filters.year}`
      const previousYearUrl = `/api/admin/statistics?year=${filters.year - 1}`

      console.log("Fetching data from:", kmUrl)

      // Obtener datos principales
      const kmData = await fetchWithErrorHandling(kmUrl, "Error al cargar datos de estadísticas")

      // Intentar obtener datos de bonos, pero continuar si falla
      let bonusData = []
      try {
        bonusData = await fetchWithErrorHandling(bonusUrl, "Error al cargar datos de bonos")
      } catch (err) {
        console.warn("No se pudieron cargar los datos de bonos, continuando sin ellos:", err)
      }

      // Intentar obtener datos de progreso, pero continuar si falla
      let progressData = { monthlyData: [] }
      try {
        progressData = await fetchWithErrorHandling(progressUrl, "Error al cargar datos de progreso")
      } catch (err) {
        console.warn("No se pudieron cargar los datos de progreso, continuando sin ellos:", err)
      }

      // Intentar obtener datos del año anterior, pero continuar si falla
      let previousYearData = []
      try {
        previousYearData = await fetchWithErrorHandling(previousYearUrl, "Error al cargar datos del año anterior")
      } catch (err) {
        console.warn("No se pudieron cargar los datos del año anterior, continuando sin ellos:", err)
      }

      // Extraer los usuarios de los datos de estadísticas
      const users = kmData.users || []

      // Combinar datos
      const combinedData = users.map((user: any) => {
        const userBonuses = bonusData.find((b: any) => b.userId === user.id || b.userId === user.userId)
        return {
          ...user,
          id: user.id || user.userId,
          kilometros: user.kilometers || user.kilometros || 0,
          bonos: userBonuses ? userBonuses.total : 0,
          ultimaActividad: user.lastActivity || user.ultimaActividad || "No disponible",
          role: user.role || user.rol || "Usuario",
          nombre: user.name || user.nombre || "Usuario",
          cedula: user.cedula || user.id || "N/A",
        }
      })

      setUsers(combinedData)

      // Procesar datos mensuales para gráficos
      const monthlyData = progressData.monthlyData || progressData.monthly || []

      // Calcular datos por rol
      const roleData = combinedData.reduce((acc: any, user: UserData) => {
        const role = user.role || "Sin rol"
        if (!acc[role]) acc[role] = 0
        acc[role] += user.kilometros || 0
        return acc
      }, {})

      const kilometersPerRole = Object.entries(roleData).map(([name, value]) => ({
        name,
        value: value as number,
      }))

      // Procesar datos por mes
      const monthNames = [
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

      // Crear datos mensuales si no están disponibles
      const kilometersByMonth: KilometersByMonth[] =
        monthlyData.length > 0
          ? monthlyData.map((item: any, index: number) => {
              const monthUsers = item.users || 0
              return {
                month: monthNames[index],
                kilometers: item.kilometers || 0,
                users: monthUsers,
                average: monthUsers > 0 ? (item.kilometers || 0) / monthUsers : 0,
              }
            })
          : monthNames.map((month, index) => ({
              month,
              kilometers: 0,
              users: 0,
              average: 0,
            }))

      // Calcular tendencia basada en datos reales
      const currentTotalKm = combinedData.reduce((sum: number, user: UserData) => sum + (user.kilometros || 0), 0)
      const previousUsers = previousYearData.users || []
      const previousTotalKm = previousUsers.reduce(
        (sum: number, user: any) => sum + (user.kilometers || user.kilometros || 0),
        0,
      )
      const trend = calculateTrend(currentTotalKm, previousTotalKm)

      setKpiData({
        totalKilometers: currentTotalKm,
        averageKilometers: combinedData.length > 0 ? currentTotalKm / combinedData.length : 0,
        userCount: combinedData.length,
        trend: trend,
        topPerformer: [...combinedData].sort((a, b) => (b.kilometros || 0) - (a.kilometros || 0))[0] || null,
        monthlyData,
        kilometersPerRole,
        kilometersByMonth,
      })
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Error al cargar los datos")

      toast({
        title: "Error al cargar datos",
        description: err instanceof Error ? err.message : "Ocurrió un error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast, calculateTrend, fetchWithErrorHandling])

  // Función para actualizar datos
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true)
      await fetchData()

      toast({
        title: "Datos actualizados",
        description: "Los datos se han actualizado correctamente",
      })
    } catch (err) {
      toast({
        title: "Error al actualizar",
        description: err instanceof Error ? err.message : "Ocurrió un error al actualizar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchData, toast])

  // Función para exportar a CSV
  const exportToCSV = useCallback(() => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "Ajusta los filtros para obtener resultados",
        variant: "destructive",
      })
      return
    }

    try {
      const headers = ["Nombre", "Cédula", "Rol", "Kilómetros", "Bonos", "Última Actividad"]
      const csvData = filteredUsers.map((user) => [
        user.nombre || "",
        user.cedula || "",
        user.role || "",
        user.kilometros || 0,
        user.bonos || 0,
        user.ultimaActividad || "",
      ])

      const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `kpi_dashboard_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportación completada",
        description: `Se han exportado ${filteredUsers.length} registros a CSV`,
      })
    } catch (err) {
      toast({
        title: "Error al exportar",
        description: "No se pudo completar la exportación a CSV",
        variant: "destructive",
      })
    }
  }, [filteredUsers, toast])

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let result = [...users]

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) => user.nombre?.toLowerCase().includes(query) || user.cedula?.toLowerCase().includes(query),
      )
    }

    // Filtrar por rol
    if (filters.role) {
      result = result.filter((user) => user.role === filters.role)
    }

    // Filtrar por rango de kilómetros
    if (filters.minKm !== null) {
      result = result.filter((user) => (user.kilometros || 0) >= (filters.minKm || 0))
    }

    if (filters.maxKm !== null) {
      result = result.filter((user) => (user.kilometros || 0) <= (filters.maxKm || 0))
    }

    setFilteredUsers(result)
  }, [users, searchQuery, filters])

  // Cargar datos iniciales
  useEffect(() => {
    if (users.length === 0 && !initialLoading) {
      fetchData()
    }
  }, [fetchData, users.length, initialLoading])

  return {
    users,
    filteredUsers,
    kpiData,
    filters,
    setFilters,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    compareMode,
    setCompareMode,
    compareYear,
    setCompareYear,
    compareMonth,
    setCompareMonth,
    showFilters,
    setShowFilters,
    refreshData,
    exportToCSV,
    chartType,
    setChartType,
    fullscreenChart,
    setFullscreenChart,
  }
}
