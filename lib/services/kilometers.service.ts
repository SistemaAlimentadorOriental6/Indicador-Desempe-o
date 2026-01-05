import { getDatabase, dbHelpers } from '../database'
import { getCache } from '../cache'

export interface KilometersData {
  year: number
  month: number
  monthName: string
  valor_programacion: number
  valor_ejecucion: number
  percentage: number
  registros?: any[]
}

export interface KilometersSummary {
  totalProgrammed: number
  totalExecuted: number
  percentage: number
}

export interface KilometersResponse {
  data: KilometersData[]
  summary: KilometersSummary
  availableYears: number[]
  availableMonths: number[]
}

class KilometersService {
  private static instance: KilometersService
  private db = getDatabase()
  private cache = getCache()

  private constructor() { }

  public static getInstance(): KilometersService {
    if (!KilometersService.instance) {
      KilometersService.instance = new KilometersService()
    }
    return KilometersService.instance
  }

  // Obtener datos de kilómetros para un usuario específico
  async getUserKilometers(params: {
    userCode: string
    year?: number
    month?: number
  }): Promise<KilometersResponse> {
    // Generar clave de caché
    const cacheKey = this.cache.getUserDataKey(params.userCode, 'kilometers', {
      year: params.year || 'all',
      month: params.month || 'all',
    })

    // Intentar obtener de caché
    const cached = await this.cache.get<KilometersResponse>(cacheKey)
    if (cached) {
      return cached
    }

    // Si no está en caché, obtener de base de datos
    const result = await this.fetchKilometersFromDB(params)

    // Guardar en caché
    await this.cache.set(cacheKey, result, this.cache.TTL.DEFAULT)

    return result
  }

  // Obtener kilómetros agregados (para admin)
  async getAggregatedKilometers(params: {
    year?: number
    month?: number
    limit?: number
  }): Promise<KilometersResponse> {
    const cacheKey = this.cache.getAdminDataKey('kilometers-aggregated', {
      year: params.year || 'all',
      month: params.month || 'all',
      limit: params.limit || 'all',
    })

    return this.cache.getOrSet(
      cacheKey,
      () => this.fetchAggregatedKilometersFromDB(params),
      this.cache.TTL.SHORT // Caché más corto para datos agregados
    )
  }

  // Obtener datos de la base de datos
  private async fetchKilometersFromDB(params: {
    userCode: string
    year?: number
    month?: number
  }): Promise<KilometersResponse> {
    // ✅ OPTIMIZACIÓN: Consulta simple sin cross-joins pesados
    let query = `
      SELECT 
        codigo_variable,
        codigo_empleado,
        valor_programacion,
        valor_ejecucion,
        fecha_inicio_programacion,
        fecha_fin_programacion
      FROM variables_control
      WHERE codigo_variable = 'KMS'
      AND codigo_empleado = ?
    `

    const queryParams: any[] = [params.userCode]

    // Filtrar por año en la consulta si se especifica
    if (params.year) {
      query += " AND (YEAR(fecha_inicio_programacion) = ? OR (fecha_fin_programacion IS NOT NULL AND YEAR(fecha_fin_programacion) = ?) OR (YEAR(fecha_inicio_programacion) <= ? AND (fecha_fin_programacion IS NULL OR YEAR(fecha_fin_programacion) >= ?)))"
      queryParams.push(params.year, params.year, params.year, params.year)
    }

    query += " ORDER BY fecha_inicio_programacion DESC"

    // Ejecutar consultas en paralelo
    const [rawData, years, months] = await Promise.all([
      this.db.executeQuery<any[]>(query, queryParams),
      this.getAvailableYears(params.userCode),
      this.getAvailableMonths(params.userCode, params.year),
    ])

    // Procesar datos
    let processedData = this.processKilometersData(rawData, params.year, params.month)

    // Filtrar para mostrar solo meses que realmente existen en el sistema para ese año
    if (params.year && !params.month && months.length > 0) {
      processedData = processedData.filter(d => months.includes(d.month))
    }

    // Si es el año actual, limitamos por seguridad al mes presente
    const hoy = new Date()
    if (params.year === hoy.getFullYear() && !params.month) {
      const mesActual = hoy.getMonth() + 1
      processedData = processedData.filter(d => d.month <= mesActual)
    }
    const summary = this.calculateSummary(processedData)

    return {
      data: processedData,
      summary,
      availableYears: years,
      availableMonths: months,
    }
  }

  // Obtener datos agregados de la base de datos
  private async fetchAggregatedKilometersFromDB(params: {
    year?: number
    month?: number
    limit?: number
  }): Promise<KilometersResponse> {
    let query = `
      SELECT 
        YEAR(fecha_inicio_programacion) as year,
        MONTH(fecha_inicio_programacion) as month,
        SUM(valor_programacion) as valor_programacion,
        SUM(valor_ejecucion) as valor_ejecucion,
        COUNT(DISTINCT codigo_empleado) as total_empleados
      FROM variables_control
      WHERE codigo_variable = 'KMS'
    `

    const queryParams: any[] = []

    if (params.year) {
      query += " AND YEAR(fecha_inicio_programacion) = ?"
      queryParams.push(params.year)
    }

    if (params.month) {
      query += " AND MONTH(fecha_inicio_programacion) = ?"
      queryParams.push(params.month)
    }

    query += " GROUP BY YEAR(fecha_inicio_programacion), MONTH(fecha_inicio_programacion)"
    query += " ORDER BY year DESC, month DESC"

    if (params.limit) {
      query += " LIMIT ?"
      queryParams.push(params.limit)
    }

    const [rawData, years, months] = await Promise.all([
      this.db.executeQuery<any[]>(query, queryParams),
      dbHelpers.getAvailableYears('variables_control', 'fecha_inicio_programacion', "codigo_variable = 'KMS'"),
      params.year
        ? dbHelpers.getAvailableMonths(
          'variables_control',
          'fecha_inicio_programacion',
          "codigo_variable = 'KMS' AND YEAR(fecha_inicio_programacion) = ?",
          [params.year]
        )
        : []
    ])

    const processedData = this.processKilometersData(rawData, params.year, params.month)
    const summary = this.calculateSummary(processedData)

    return {
      data: processedData,
      summary,
      availableYears: years,
      availableMonths: months,
    }
  }

  // Procesar datos de kilómetros expandiendo rangos de fechas
  private processKilometersData(rawData: any[], filterYear?: number, filterMonth?: number): KilometersData[] {
    const groupedData: Record<string, any> = {}

    rawData.forEach((item) => {
      const start = new Date(item.fecha_inicio_programacion)
      const end = item.fecha_fin_programacion ? new Date(item.fecha_fin_programacion) : new Date()

      // Normalizar fechas al primer día del mes para facilitar iteración
      let currentIter = new Date(start.getFullYear(), start.getMonth(), 1)
      const lastMonthDate = new Date(end.getFullYear(), end.getMonth(), 1)

      while (currentIter <= lastMonthDate) {
        const year = currentIter.getFullYear()
        const month = currentIter.getMonth() + 1

        // Verificar si este mes debe ser incluido según filtros
        const matchYear = !filterYear || year === filterYear
        const matchMonth = !filterMonth || month === filterMonth

        if (matchYear && matchMonth) {
          const key = `${year}-${String(month).padStart(2, "0")}`

          if (!groupedData[key]) {
            groupedData[key] = {
              year,
              month,
              monthName: this.getMonthName(month),
              valor_programacion: 0,
              valor_ejecucion: 0,
              registros: [],
            }
          }

          // Sumar valores
          groupedData[key].valor_programacion += Number(item.valor_programacion) || 0
          groupedData[key].valor_ejecucion += Number(item.valor_ejecucion) || 0
          groupedData[key].registros.push(item)
        }

        // Avanzar al siguiente mes
        currentIter.setMonth(currentIter.getMonth() + 1)
      }
    })

    return Object.values(groupedData).map((item: any) => ({
      ...item,
      percentage: item.valor_programacion > 0
        ? parseFloat(((item.valor_ejecucion / item.valor_programacion) * 100).toFixed(2))
        : 0
    }))
  }

  // Calcular resumen
  private calculateSummary(data: KilometersData[]): KilometersSummary {
    const totalProgrammed = data.reduce((sum, item) => sum + item.valor_programacion, 0)
    const totalExecuted = data.reduce((sum, item) => sum + item.valor_ejecucion, 0)
    const percentage = totalProgrammed > 0
      ? parseFloat(((totalExecuted / totalProgrammed) * 100).toFixed(2)) // SIN LÍMITE - mostrar valor real
      : 0

    return {
      totalProgrammed,
      totalExecuted,
      percentage,
    }
  }

  // Obtener años disponibles para un usuario
  async getAvailableYears(userCode: string): Promise<number[]> {
    return dbHelpers.getAvailableYears(
      'variables_control',
      'fecha_inicio_programacion',
      "codigo_variable = 'KMS' AND codigo_empleado = ?",
      [userCode]
    )
  }

  // Obtener meses disponibles para un usuario
  async getAvailableMonths(userCode: string, year?: number): Promise<number[]> {
    if (!year) return []

    return dbHelpers.getAvailableMonths(
      'variables_control',
      'fecha_inicio_programacion',
      "codigo_variable = 'KMS' AND codigo_empleado = ? AND YEAR(fecha_inicio_programacion) = ?",
      [userCode, year]
    )
  }

  // Invalidar caché de usuario
  async invalidateUserCache(userCode: string): Promise<void> {
    await this.cache.invalidateUserCache(userCode)
  }

  // Obtener estadísticas rápidas (para dashboard)
  async getQuickStats(userCode: string): Promise<{
    currentMonthKm: number
    currentMonthPercentage: number
    totalKmThisYear: number
  }> {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const cacheKey = this.cache.getUserDataKey(userCode, 'quick-stats', {
      year: currentYear,
      month: currentMonth,
    })

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const [currentMonthData, yearData] = await Promise.all([
          this.getUserKilometers({ userCode, year: currentYear, month: currentMonth }),
          this.getUserKilometers({ userCode, year: currentYear }),
        ])

        const currentMonthKm = currentMonthData.data[0]?.valor_ejecucion || 0
        const currentMonthPercentage = currentMonthData.data[0]?.percentage || 0
        const totalKmThisYear = yearData.summary.totalExecuted

        return {
          currentMonthKm,
          currentMonthPercentage,
          totalKmThisYear,
        }
      },
      this.cache.TTL.SHORT
    )
  }

  // Utilidad para obtener nombre del mes
  private getMonthName(monthNumber: number): string {
    return new Date(2000, monthNumber - 1).toLocaleString('es-ES', { month: 'long' })
  }
}

// Función helper para obtener instancia del servicio
export const getKilometersService = () => KilometersService.getInstance()

export default KilometersService 