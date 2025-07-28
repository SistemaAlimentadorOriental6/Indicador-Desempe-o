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

  private constructor() {}

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
    // Query principal para obtener datos de kilómetros
    let query = `
      SELECT 
        vc.codigo_variable,
        vc.codigo_empleado,
        vc.valor_programacion,
        vc.valor_ejecucion,
        months.month_date,
        YEAR(months.month_date) as year,
        MONTH(months.month_date) as month,
        vc.fecha_inicio_programacion,
        vc.fecha_fin_programacion
      FROM variables_control vc
      JOIN (
        SELECT 
          vc2.codigo_empleado,
          DATE_ADD(vc2.fecha_inicio_programacion, 
            INTERVAL (t4.num*1000 + t3.num*100 + t2.num*10 + t1.num) MONTH
          ) as month_date
        FROM variables_control vc2,
          (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t1,
          (SELECT 0 as num UNION SELECT 4 UNION SELECT 8) t2,
          (SELECT 0 as num UNION SELECT 6) t3,
          (SELECT 0 as num) t4
        WHERE 
          vc2.codigo_variable = 'KMS'
          AND DATE_ADD(vc2.fecha_inicio_programacion, 
                      INTERVAL (t4.num*1000 + t3.num*100 + t2.num*10 + t1.num) MONTH) 
                      <= COALESCE(vc2.fecha_fin_programacion, CURDATE())
      ) months ON vc.codigo_empleado = months.codigo_empleado
        AND months.month_date BETWEEN 
          vc.fecha_inicio_programacion AND 
          COALESCE(vc.fecha_fin_programacion, CURDATE())
      WHERE vc.codigo_variable = 'KMS'
      AND vc.codigo_empleado = ?
    `

    const queryParams: any[] = [params.userCode]

    // Agregar filtros de fecha
    if (params.year) {
      query += " AND YEAR(months.month_date) = ?"
      queryParams.push(params.year)
    }

    if (params.month) {
      query += " AND MONTH(months.month_date) = ?"
      queryParams.push(params.month)
    }

    query += " ORDER BY months.month_date DESC"

    // Ejecutar consultas en paralelo
    const [rawData, years, months] = await Promise.all([
      this.db.executeQuery<any[]>(query, queryParams),
      this.getAvailableYears(params.userCode),
      this.getAvailableMonths(params.userCode, params.year),
    ])

    // Procesar datos
    const processedData = this.processKilometersData(rawData)
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

    const processedData = this.processKilometersData(rawData)
    const summary = this.calculateSummary(processedData)

    return {
      data: processedData,
      summary,
      availableYears: years,
      availableMonths: months,
    }
  }

  // Procesar datos de kilómetros
  private processKilometersData(rawData: any[]): KilometersData[] {
    const groupedData = rawData.reduce((acc: any, item) => {
      const key = `${item.year}-${String(item.month).padStart(2, "0")}`
      
      if (!acc[key]) {
        acc[key] = {
          year: item.year,
          month: item.month,
          monthName: this.getMonthName(item.month),
          valor_programacion: 0,
          valor_ejecucion: 0,
          registros: [],
        }
      }

      acc[key].valor_programacion += Number(item.valor_programacion) || 0
      acc[key].valor_ejecucion += Number(item.valor_ejecucion) || 0
      acc[key].registros.push(item)

      return acc
    }, {})

    return Object.values(groupedData).map((item: any) => ({
      ...item,
      percentage: item.valor_programacion > 0 
        ? parseFloat(((item.valor_ejecucion / item.valor_programacion) * 100).toFixed(2)) // SIN LÍMITE - mostrar valor real
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