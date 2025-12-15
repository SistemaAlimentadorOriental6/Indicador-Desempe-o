import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers'
import { getKilometersService, type KilometersData } from '@/lib/services/kilometers.service'

// Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development'

/**
 * Formatea los datos de kilómetros para la respuesta
 */
function formatearDatos(data: KilometersData[]) {
  return data.map(item => ({
    year: item.year,
    month: item.month,
    monthName: item.monthName,
    valor_programacion: Number(item.valor_programacion.toFixed(2)),
    valor_ejecucion: Number(item.valor_ejecucion.toFixed(2)),
    percentage: item.percentage,
  }))
}

/**
 * GET - Obtiene los datos de kilómetros de un usuario
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
    console.log(`[Kilómetros] Usuario: ${userCode}, año: ${year || 'todos'}, mes: ${month || 'todos'}, quick: ${quickStats}`)
  }

  const kilometersService = getKilometersService()

  // Si se solicitan estadísticas rápidas, usar endpoint optimizado
  if (quickStats) {
    const stats = await kilometersService.getQuickStats(userCode)

    return apiResponse.success({
      currentMonthKm: stats.currentMonthKm,
      currentMonthPercentage: stats.currentMonthPercentage,
      totalKmThisYear: stats.totalKmThisYear,
    }, 'Estadísticas rápidas obtenidas')
  }

  // Obtener datos completos
  const result = await kilometersService.getUserKilometers({ userCode, year, month })

  // Respuesta vacía si no hay datos
  if (!result.data || result.data.length === 0) {
    return apiResponse.success({
      data: [],
      summary: { totalProgrammed: 0, totalExecuted: 0, percentage: 0 },
      availableYears: result.availableYears,
      availableMonths: result.availableMonths,
    }, `Sin datos de kilómetros${year ? ` para ${year}` : ''}${month ? `/${month}` : ''}`)
  }

  if (isDev) {
    console.log(`[Kilómetros] ${result.data.length} registros encontrados`)
  }

  // Respuesta exitosa con datos formateados
  return apiResponse.success({
    data: formatearDatos(result.data),
    summary: {
      totalProgrammed: Number(result.summary.totalProgrammed.toFixed(2)),
      totalExecuted: Number(result.summary.totalExecuted.toFixed(2)),
      percentage: result.summary.percentage,
    },
    availableYears: result.availableYears,
    availableMonths: result.availableMonths,
  })
}

// Exportar handler con manejo de errores
export const GET = withErrorHandling(handleGet)