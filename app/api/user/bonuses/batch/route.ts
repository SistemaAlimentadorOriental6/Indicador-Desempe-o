import { type NextRequest } from 'next/server'
import { withErrorHandling, apiResponse, ApiError } from '@/lib/api-helpers'
import { getBonusesService } from '@/lib/services/bonuses.service'
import { getDatabase } from '@/lib/database'

// Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development'

interface BatchRequest {
  codigos: string[]
  year?: number
  month?: number
}

interface BatchResult {
  [codigo: string]: {
    success: boolean
    baseBonus: number
    finalBonus: number
    deductionPercentage: number
    deductionAmount: number
    deductions: any[]
    availableYears: number[]
    availableMonths: number[]
    summary: any
    error?: string
  }
}

/**
 * Obtiene los años disponibles para una lista de códigos de empleado
 */
async function obtenerAñosDisponibles(codigos: string[]): Promise<number[]> {
  if (codigos.length === 0) return []

  const db = getDatabase()
  const placeholders = codigos.map(() => '?').join(',')

  const query = `
    SELECT DISTINCT YEAR(fecha_inicio_novedad) as year
    FROM novedades
    WHERE codigo_empleado IN (${placeholders})
    ORDER BY year DESC
  `

  const rows = await db.executeQuery<Array<{ year: number }>>(query, codigos)
  const years = rows.map(r => r.year).filter(y => y !== null)

  // Si no hay años, devolver años por defecto
  if (years.length === 0) {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }

  return years
}

/**
 * Obtiene el último año y mes con datos disponibles
 */
async function obtenerUltimaFechaDisponible(): Promise<{ year: number; month: number }> {
  const db = getDatabase()

  const query = `
    SELECT YEAR(MAX(fecha_inicio_novedad)) as year, 
           MONTH(MAX(fecha_inicio_novedad)) as month 
    FROM novedades
  `

  const rows = await db.executeQuery<Array<{ year: number; month: number }>>(query, [])

  if (rows.length > 0 && rows[0].year && rows[0].month) {
    return { year: rows[0].year, month: rows[0].month }
  }

  // Fallback a fecha actual
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/**
 * POST - Obtiene datos de bonificaciones para múltiples usuarios
 * 
 * Body:
 * - codigos (requerido): Array de códigos de empleados
 * - year (opcional): Año a consultar
 * - month (opcional): Mes a consultar
 */
async function handlePost(request: Request) {
  const body = await request.json() as BatchRequest
  const { codigos, year, month } = body

  // Validar entrada
  if (!codigos || !Array.isArray(codigos) || codigos.length === 0) {
    throw new ApiError('Se requiere un array de códigos de empleados', 400)
  }

  // Limitar cantidad de códigos para evitar sobrecarga
  if (codigos.length > 100) {
    throw new ApiError('El máximo de códigos por solicitud es 100', 400)
  }

  if (isDev) {
    console.log(`[Bonos Batch] Procesando ${codigos.length} usuarios, año: ${year || 'auto'}, mes: ${month || 'auto'}`)
  }

  // Determinar año y mes a usar
  let processingYear = year
  let processingMonth = month

  if (!processingMonth) {
    const ultimaFecha = await obtenerUltimaFechaDisponible()
    processingYear = processingYear || ultimaFecha.year
    processingMonth = ultimaFecha.month
  }

  // Obtener años disponibles para todos los códigos
  const availableYears = await obtenerAñosDisponibles(codigos)

  // Procesar cada usuario usando el servicio
  const bonusesService = getBonusesService()
  const results: BatchResult = {}

  // Procesar en paralelo con límite de concurrencia
  const BATCH_SIZE = 10
  for (let i = 0; i < codigos.length; i += BATCH_SIZE) {
    const batch = codigos.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(async (codigo) => {
        try {
          const userData = await bonusesService.getUserBonuses({
            userCode: codigo,
            year: processingYear,
            month: processingMonth,
          })

          return {
            codigo,
            data: {
              success: true,
              baseBonus: userData.baseBonus,
              finalBonus: userData.finalBonus,
              deductionPercentage: userData.deductionPercentage,
              deductionAmount: userData.deductionAmount,
              deductions: userData.deductions,
              availableYears: userData.availableYears,
              availableMonths: userData.availableMonths,
              summary: userData.summary,
              bonusesByYear: userData.bonusesByYear,
              lastMonthData: userData.lastMonthData,
            }
          }
        } catch (error) {
          if (isDev) {
            console.error(`[Bonos Batch] Error para usuario ${codigo}:`, error)
          }

          return {
            codigo,
            data: {
              success: false,
              baseBonus: 0,
              finalBonus: 0,
              deductionPercentage: 0,
              deductionAmount: 0,
              deductions: [],
              availableYears: [],
              availableMonths: [],
              summary: { totalProgrammed: 0, totalExecuted: 0, percentage: 0 },
              error: error instanceof Error ? error.message : 'Error desconocido',
            }
          }
        }
      })
    )

    // Agregar resultados del batch
    batchResults.forEach(({ codigo, data }) => {
      results[codigo] = data
    })
  }

  if (isDev) {
    console.log(`[Bonos Batch] Procesados ${codigos.length} usuarios`)
  }

  return apiResponse.success({
    results,
    availableYears,
    processedYear: processingYear,
    processedMonth: processingMonth,
    totalProcessed: codigos.length,
  })
}

// Exportar handler con manejo de errores
export const POST = withErrorHandling(handlePost)
