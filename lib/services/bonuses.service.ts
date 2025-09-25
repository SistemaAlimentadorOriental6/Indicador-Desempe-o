import { getDatabase } from '../database'
import { getCacheManager } from '../cache-manager'
import { getDeductionRule } from '../deductions-config'

// Mapeo de códigos de factor a porcentajes de deducción y descripción exactos según tabla
// DEPRECATED: Se usará DEDUCTION_RULES de deductions-config.ts
// const FACTOR_DEDUCTIONS: Record<string, { porcentaje: number | string, descripcion: string }> = { ... }

// Conceptos por código
// DEPRECATED: Se usará DEDUCTION_RULES de deductions-config.ts
// const FACTOR_CONCEPTS: Record<string, string> = { ... }

// Valor por día para deducciones basadas en días (según tabla)
// DEPRECATED: Se usará DEDUCTION_RULES de deductions-config.ts
// const DAILY_DEDUCTION = 4733

export interface Deduction {
  id: number
  codigo: string
  concepto: string
  fechaInicio: string
  fechaFin: string | null
  dias: number
  porcentaje: number | string
  monto: number
  observaciones?: string
}

export interface MonthlyBonusData {
  year: number
  month: number
  monthName: string
  bonusValue: number
  deductionAmount: number
  finalValue: number
  hasDeductions?: boolean
}

export interface BonusData {
  baseBonus: number
  deductionPercentage: number
  deductionAmount: number
  finalBonus: number
  expiresInDays: number | null
  bonusesByYear: Record<string, number>
  deductions: Deduction[]
  monthlyBonusData?: MonthlyBonusData[]
  lastMonthData?: {
    year: number
    month: number
    monthName: string
    bonusValue: number
    deductionAmount: number
    finalValue: number
    hasDeductions?: boolean
    message?: string
  }
  availableYears: number[]
  availableMonths: number[]
  summary: {
    totalProgrammed: number
    totalExecuted: number
    percentage: number
  }
}

class BonusesService {
  private static instance: BonusesService
  private db = getDatabase()
  private cache = getCacheManager()

  private constructor() {}

  public static getInstance(): BonusesService {
    if (!BonusesService.instance) {
      BonusesService.instance = new BonusesService()
    }
    return BonusesService.instance
  }

  // Obtener datos de usuario con caché
  async getUserBonuses(params: {
    userCode: string
    year?: number
    month?: number
  }): Promise<BonusData> {
    // Generar clave de caché específica
    const cacheKey = `bonuses:${params.userCode}:${params.year || 'current'}:${params.month || 'all'}`

    // Usar getOrSet para simplificar la lógica
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchBonusesFromDB(params),
      604800, // 7 días en segundos (TTL semanal como solicitado)
      'bonuses'
    )
  }

  // Obtener datos de bonos de la base de datos
  private async fetchBonusesFromDB(params: {
    userCode: string
    year?: number
    month?: number
  }): Promise<BonusData> {
    const currentYear = params.year || new Date().getFullYear()
    const currentMonth = params.month
    const baseBonus = this.getBaseBonusForYear(currentYear)

    // Construir consulta para novedades
    let query = `
      SELECT id, fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, 
             observaciones,
             DATEDIFF(IFNULL(fecha_fin_novedad, CURDATE()), fecha_inicio_novedad) + 1 as dias_novedad
      FROM novedades
      WHERE codigo_empleado = ?
    `
    
    const queryParams: any[] = [params.userCode]

    // Agregar filtros de fecha
    if (params.year && params.month) {
      // Para un mes específico, buscar novedades que afecten ese mes
      query += ` AND (
        (YEAR(fecha_inicio_novedad) = ? AND MONTH(fecha_inicio_novedad) = ?) OR
        (fecha_fin_novedad IS NOT NULL AND 
         YEAR(fecha_fin_novedad) = ? AND MONTH(fecha_fin_novedad) = ?) OR
        (fecha_inicio_novedad <= LAST_DAY(?) AND 
         (fecha_fin_novedad IS NULL OR fecha_fin_novedad >= ?))
      )`
      
      const firstDayOfMonth = `${params.year}-${String(params.month).padStart(2, '0')}-01`
      const lastDayOfMonth = new Date(params.year, params.month, 0).toISOString().split('T')[0]
      
      queryParams.push(params.year, params.month, params.year, params.month, lastDayOfMonth, firstDayOfMonth)
    } else if (params.year) {
      query += " AND YEAR(fecha_inicio_novedad) = ?"
      queryParams.push(params.year)
    }

    query += " ORDER BY fecha_inicio_novedad DESC"

    // Ejecutar consultas en paralelo
    const [novedades, availableYears, availableMonths, bonusesByYear] = await Promise.all([
      this.db.executeQuery<any[]>(query, queryParams),
      this.getAvailableYears(params.userCode),
      this.getAvailableMonths(params.userCode, params.year),
      this.getBonusesByYear(params.userCode),
    ])

    // Si estamos consultando un mes específico y no hay novedades, 
    // significa que el bono del mes es completo
    const isSpecificMonth = params.year && params.month
    const hasNoDeductions = novedades.length === 0

    // Procesar deducciones
    const deductions = this.processDeductions(novedades, baseBonus)
    const totalDeductionAmount = Math.min(
      deductions.reduce((sum, d) => sum + d.monto, 0),
      baseBonus
    )

    const deductionPercentage = Math.round((totalDeductionAmount / baseBonus) * 100)
    const finalBonus = baseBonus - totalDeductionAmount

    // Calcular fecha de expiración
    const expiresInDays = this.calculateExpirationDays(novedades)

    // Obtener datos del último mes o del mes consultado
    let lastMonthData
    let monthlyBonusData: MonthlyBonusData[] | undefined

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    if (isSpecificMonth) {
      // Si es un mes específico, mostrar los datos de ese mes
      lastMonthData = {
        year: currentYear,
        month: currentMonth!,
        monthName: monthNames[currentMonth! - 1],
        bonusValue: baseBonus,
        deductionAmount: totalDeductionAmount,
        finalValue: finalBonus,
        hasDeductions: !hasNoDeductions,
        message: hasNoDeductions ? "Sin deducciones - Bono completo" : undefined
      }
    } else if (params.year && !params.month) {
      // Si solo se especifica el año, generar datos mensuales para todo el año
      monthlyBonusData = []
      
      for (let month = 1; month <= 12; month++) {
        // Obtener deducciones específicas para este mes
        const monthQuery = `
          SELECT id, fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, 
                 observaciones,
                 DATEDIFF(IFNULL(fecha_fin_novedad, CURDATE()), fecha_inicio_novedad) + 1 as dias_novedad
          FROM novedades
          WHERE codigo_empleado = ?
            AND (
              (YEAR(fecha_inicio_novedad) = ? AND MONTH(fecha_inicio_novedad) = ?) OR
              (fecha_fin_novedad IS NOT NULL AND 
               YEAR(fecha_fin_novedad) = ? AND MONTH(fecha_fin_novedad) = ?) OR
              (fecha_inicio_novedad <= LAST_DAY(?) AND 
               (fecha_fin_novedad IS NULL OR fecha_fin_novedad >= ?))
            )
          ORDER BY fecha_inicio_novedad DESC
        `
        
        const firstDayOfMonth = `${params.year}-${String(month).padStart(2, '0')}-01`
        const lastDayOfMonth = new Date(params.year, month, 0).toISOString().split('T')[0]
        
        const monthNovedades = await this.db.executeQuery<any[]>(monthQuery, [
          params.userCode, params.year, month, params.year, month, lastDayOfMonth, firstDayOfMonth
        ])
        
        // Procesar deducciones del mes
        const monthDeductions = this.processDeductions(monthNovedades, baseBonus)
        const monthDeductionAmount = Math.min(
          monthDeductions.reduce((sum, d) => sum + d.monto, 0),
          baseBonus
        )
        const monthFinalBonus = baseBonus - monthDeductionAmount
        
        monthlyBonusData.push({
          year: currentYear,
          month: month,
          monthName: monthNames[month - 1],
          bonusValue: baseBonus,
          deductionAmount: monthDeductionAmount,
          finalValue: monthFinalBonus,
          hasDeductions: monthNovedades.length > 0
        })
      }
      
      lastMonthData = this.getLastMonthData(novedades, params.userCode)
    } else {
      lastMonthData = this.getLastMonthData(novedades, params.userCode)
    }

    return {
      baseBonus,
      deductionPercentage,
      deductionAmount: totalDeductionAmount,
      finalBonus,
      expiresInDays,
      bonusesByYear,
      deductions,
      monthlyBonusData,
      lastMonthData,
      availableYears,
      availableMonths,
      summary: {
        totalProgrammed: baseBonus,
        totalExecuted: finalBonus,
        percentage: parseFloat(((finalBonus / baseBonus) * 100).toFixed(2)),
      },
    }
  }

  // Procesar deducciones
  private processDeductions(novedades: any[], baseBonus: number): Deduction[] {
    if (!novedades || novedades.length === 0) {
      return []
    }

    return novedades.map((novedad) => {
      const rule = getDeductionRule(novedad.codigo_factor)

      if (!rule) {
        // Si no hay regla, devolver una deducción vacía o registrar un error
        return {
          id: novedad.id,
          codigo: novedad.codigo_factor,
          concepto: `Factor no reconocido: ${novedad.codigo_factor}`,
          fechaInicio: novedad.fecha_inicio_novedad,
          fechaFin: novedad.fecha_fin_novedad,
          dias: novedad.dias_novedad,
          porcentaje: 0,
          monto: 0,
          observaciones: novedad.observaciones,
        }
      }

      let monto = 0
      if (rule.porcentajeRetirar === 'Día') {
        monto = rule.valorActual * (novedad.dias_novedad || 1)
      } else if (typeof rule.porcentajeRetirar === 'number') {
        monto = baseBonus * rule.porcentajeRetirar
      }

      return {
        id: novedad.id,
        codigo: rule.item,
        concepto: rule.causa,
        fechaInicio: novedad.fecha_inicio_novedad,
        fechaFin: novedad.fecha_fin_novedad,
        dias: novedad.dias_novedad,
        porcentaje: rule.porcentajeRetirar || 0,
        monto,
        observaciones: novedad.observaciones,
      }
    })
  }

  // Calcular días de expiración
  private calculateExpirationDays(novedades: any[]): number | null {
    if (novedades.length === 0) return null

    const latestDate = new Date(novedades[0].fecha_inicio_novedad)
    const expirationDate = new Date(latestDate)
    expirationDate.setDate(expirationDate.getDate() + 14)

    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  // Obtener datos del último mes
  private getLastMonthData(novedades: any[], userCode: string) {
    if (novedades.length === 0) return undefined

    const latestDate = new Date(novedades[0].fecha_inicio_novedad)
    const latestYear = latestDate.getFullYear()
    const latestMonth = latestDate.getMonth() + 1
    const lastMonthBaseBonus = this.getBaseBonusForYear(latestYear)

    // Filtrar novedades del último mes
    const lastMonthNovedades = novedades.filter((novedad) => {
      const date = new Date(novedad.fecha_inicio_novedad)
      return date.getFullYear() === latestYear && date.getMonth() + 1 === latestMonth
    })

    // Calcular deducciones del último mes
    const lastMonthDeductions = this.processDeductions(lastMonthNovedades, lastMonthBaseBonus)
    const lastMonthDeduction = lastMonthDeductions.reduce((sum, d) => sum + d.monto, 0)
    const finalLastMonthDeduction = Math.min(lastMonthDeduction, lastMonthBaseBonus)

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    return {
      year: latestYear,
      month: latestMonth,
      monthName: monthNames[latestMonth - 1],
      bonusValue: lastMonthBaseBonus,
      deductionAmount: finalLastMonthDeduction,
      finalValue: lastMonthBaseBonus - finalLastMonthDeduction,
    }
  }

  // Obtener bonos por año
  private async getBonusesByYear(userCode: string): Promise<Record<string, number>> {
    try {
      // Primero, obtener todos los años con novedades
      const novedadesQuery = `
        SELECT 
          YEAR(fecha_inicio_novedad) as year,
          MONTH(fecha_inicio_novedad) as month
        FROM novedades 
        WHERE codigo_empleado = ? 
        ORDER BY year DESC, month DESC
      `
      
      const novedadesResult = await this.db.executeQuery<Array<{ year: number; month: number }>>(
        novedadesQuery,
        [userCode]
      )

      // Agrupar por año y contar meses únicos con novedades
      const yearMonthMap = new Map<number, Set<number>>()
      
      novedadesResult.forEach((row) => {
        if (!yearMonthMap.has(row.year)) {
          yearMonthMap.set(row.year, new Set())
        }
        yearMonthMap.get(row.year)!.add(row.month)
      })

      // Calcular bonos disponibles por año
      const bonusesByYear: Record<string, number> = {}
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1

      // Para cada año desde 2020 hasta el año actual
      for (let year = 2020; year <= currentYear; year++) {
        let monthsInYear = 12
        
        // Si es el año actual, solo contar hasta el mes actual
        if (year === currentYear) {
          monthsInYear = currentMonth
        }
        
        // Obtener meses con novedades para este año
        const _monthsWithNovedades = yearMonthMap.get(year)?.size || 0
        
        // Los bonos disponibles son los meses totales del año
        // (todos los meses cuentan, tengan o no deducciones)
        bonusesByYear[year.toString()] = monthsInYear
      }

      return bonusesByYear
    } catch (error) {
      console.error('[Bonos] Error al obtener bonos por año:', error)
      
      // En caso de error, devolver datos por defecto
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const defaultBonuses: Record<string, number> = {}
      
      for (let year = 2020; year <= currentYear; year++) {
        defaultBonuses[year.toString()] = year === currentYear ? currentMonth : 12
      }
      
      return defaultBonuses
    }
  }

  // Obtener años disponibles
  private async getAvailableYears(userCode: string): Promise<number[]> {
    try {
      const query = `
        SELECT DISTINCT YEAR(fecha_inicio_novedad) as year 
        FROM novedades 
        WHERE codigo_empleado = ? 
        ORDER BY year DESC
      `
      
      const result = await this.db.executeQuery<Array<{ year: number }>>(query, [userCode])
      const dbYears = result.map(r => r.year).filter(y => y !== null && y !== undefined)
      
      // Si hay años en la base de datos, devolverlos
      if (dbYears.length > 0) {
        return dbYears
      }
      
      // Si no hay años en la base de datos, devolver años por defecto
      // Incluir el año actual y los 4 años anteriores
      const currentYear = new Date().getFullYear()
      const defaultYears = Array.from({ length: 6 }, (_, i) => currentYear - i)
      
      console.log(`[Bonos] No se encontraron años en BD para usuario ${userCode}, usando años por defecto:`, defaultYears)
      return defaultYears
      
    } catch (error) {
      console.error(`[Bonos] Error al obtener años disponibles para usuario ${userCode}:`, error)
      
      // En caso de error, devolver años por defecto
      const currentYear = new Date().getFullYear()
      return Array.from({ length: 6 }, (_, i) => currentYear - i)
    }
  }

  // Obtener meses disponibles
  private async getAvailableMonths(userCode: string, year?: number): Promise<number[]> {
    try {
      // Si no se proporciona año, usar el año actual
      const targetYear = year || new Date().getFullYear()

      const query = `
        SELECT DISTINCT MONTH(fecha_inicio_novedad) as month
        FROM novedades
        WHERE codigo_empleado = ?
        AND YEAR(fecha_inicio_novedad) = ?
        ORDER BY month ASC
      `

      const result = await this.db.executeQuery<Array<{ month: number }>>(query, [userCode, targetYear])
      const months = result.map(r => r.month).filter(m => m !== null && m !== undefined)

      // Si hay meses en la base de datos, devolverlos
      if (months.length > 0) {
        return months
      }

      // Si no hay meses en la base de datos para el año especificado,
      // devolver todos los meses hasta el mes actual si es el año actual,
      // o todos los meses si es un año anterior
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1

      if (targetYear === currentYear) {
        // Para el año actual, devolver meses hasta el mes actual
        return Array.from({ length: currentMonth }, (_, i) => i + 1)
      } else if (targetYear < currentYear) {
        // Para años anteriores, devolver todos los meses
        return Array.from({ length: 12 }, (_, i) => i + 1)
      } else {
        // Para años futuros, devolver array vacío
        return []
      }
    } catch (error) {
      console.error('Error getting available months:', error)
      return []
    }
  }

  // Obtener valor base del bono según el año
  private getBaseBonusForYear(year: number): number {
    // Valores exactos según tabla proporcionada
    switch (year) {
      case 2025:
        return 142000; // Valor para 2025
      case 2024:
        return 135000; // Valor para 2024
      case 2023:
        return 128000; // Valor para 2023
      case 2022:
      case 2021:
      case 2020:
        return 122000; // Valor para 2022, 2021 y 2020
      default:
        // Para años anteriores a 2020, usar valor base
        return 122000;
    }
  }

  // Invalidar caché de usuario
  async invalidateUserCache(userCode: string): Promise<void> {
    await this.cache.invalidateUserCache(userCode)
  }

  // Obtener estadísticas rápidas para dashboard
  async getQuickStats(userCode: string): Promise<{
    currentBonus: number
    currentDeductionPercentage: number
    totalDeductions: number
    expiresInDays: number | null
  }> {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const cacheKey = this.cache.getUserDataKey(userCode, 'bonus-quick-stats', {
      year: currentYear,
      month: currentMonth,
    })

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const bonusData = await this.getUserBonuses({ 
          userCode, 
          year: currentYear, 
          month: currentMonth 
        })

        return {
          currentBonus: bonusData.finalBonus,
          currentDeductionPercentage: bonusData.deductionPercentage,
          totalDeductions: bonusData.deductionAmount,
          expiresInDays: bonusData.expiresInDays,
        }
      },
      this.cache.TTL.SHORT
    )
  }
}

// Función helper para obtener instancia del servicio
export const getBonusesService = () => BonusesService.getInstance()

export default BonusesService 