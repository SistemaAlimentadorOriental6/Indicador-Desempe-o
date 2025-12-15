import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers'
import { getBonusesService } from '@/lib/services/bonuses.service'

// Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development'

/**
 * GET - Obtiene los datos de bonificaciones de un usuario
 * 
 * Query params:
 * - codigo (requerido): Código del empleado
 * - year (opcional): Año a consultar
 * - month (opcional): Mes a consultar
 * - quick (opcional): Si es "true", retorna solo estadísticas rápidas
 */
async function handleGet(request: Request) {
  const { searchParams } = new URL(request.url)

  // Validar parámetros
  const validator = new QueryValidator(searchParams)
  validator
    .required('codigo', 'Código de usuario')
    .optionalNumber('year', 'Año')
    .optionalNumber('month', 'Mes')

  validator.throwIfErrors()

  // Extraer parámetros validados
  const userCode = commonParams.getUserCode(searchParams)!
  const { year, month } = commonParams.getDateFilters(searchParams)
  const quickStats = searchParams.get('quick') === 'true'

  if (isDev) {
    console.log(`[Bonos] Usuario: ${userCode}, año: ${year || 'actual'}, mes: ${month || 'actual'}, quick: ${quickStats}`)
  }

  const bonusesService = getBonusesService()

  // Si se solicitan estadísticas rápidas
  if (quickStats) {
    const stats = await bonusesService.getQuickStats(userCode)

    return apiResponse.success({
      currentBonus: stats.currentBonus,
      currentDeductionPercentage: stats.currentDeductionPercentage,
      totalDeductions: stats.totalDeductions,
      expiresInDays: stats.expiresInDays,
    }, 'Estadísticas rápidas obtenidas')
  }

  // Obtener datos completos del servicio
  const result = await bonusesService.getUserBonuses({ userCode, year, month })

  // Calcular bonos disponibles
  const availableBonuses = Object.values(result.bonusesByYear).reduce((sum, count) => sum + count, 0)

  // Respuesta sin deducciones
  if (!result.deductions || result.deductions.length === 0) {
    if (isDev) {
      console.log(`[Bonos] Sin deducciones para ${userCode}, bono completo: ${result.baseBonus}`)
    }

    return apiResponse.success({
      data: {
        baseBonus: result.baseBonus,
        finalBonus: result.baseBonus,
        deductionPercentage: 0,
        deductionAmount: 0,
        deductions: [],
        availableYears: result.availableYears,
        availableMonths: result.availableMonths,
        summary: {
          totalProgrammed: result.baseBonus,
          totalExecuted: result.baseBonus,
          percentage: 100,
        },
      },
      baseBonus: result.baseBonus,
      deductionPercentage: 0,
      finalBonus: result.baseBonus,
      deductionAmount: 0,
      deductions: [],
      bonusesByYear: result.bonusesByYear,
      monthlyBonusData: result.monthlyBonusData,
      availableBonuses,
      availableYears: result.availableYears,
      availableMonths: result.availableMonths,
      summary: {
        availableBonuses,
        totalProgrammed: result.baseBonus,
        totalExecuted: result.baseBonus,
        percentage: 100,
      },
    })
  }

  if (isDev) {
    console.log(`[Bonos] ${result.deductions.length} deducciones, bono final: ${result.finalBonus}`)
  }

  // Respuesta con deducciones
  return apiResponse.success({
    data: {
      baseBonus: result.baseBonus,
      finalBonus: result.finalBonus,
      deductionPercentage: result.deductionPercentage,
      deductionAmount: result.deductionAmount,
      deductions: result.deductions,
      availableYears: result.availableYears,
      availableMonths: result.availableMonths,
      summary: result.summary,
    },
    availableBonuses,
    baseBonus: result.baseBonus,
    deductionPercentage: result.deductionPercentage,
    deductionAmount: result.deductionAmount,
    finalBonus: result.finalBonus,
    expiresInDays: result.expiresInDays,
    bonusesByYear: result.bonusesByYear,
    deductions: result.deductions,
    monthlyBonusData: result.monthlyBonusData,
    lastMonthData: result.lastMonthData,
    availableYears: result.availableYears,
    availableMonths: result.availableMonths,
    summary: result.summary,
  })
}

// Exportar handler con manejo de errores
export const GET = withErrorHandling(handleGet)
