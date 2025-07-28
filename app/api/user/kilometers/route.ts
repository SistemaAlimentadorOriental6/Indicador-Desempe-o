import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers'
import { getKilometersService } from '@/lib/services/kilometers.service'

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

  console.log(`[Kilómetros] Solicitud para usuario: ${userCode}, año: ${year || 'todos'}, mes: ${month || 'todos'}`)

  // Obtener servicio de kilómetros
  const kilometersService = getKilometersService()

  try {
    // Obtener datos usando el servicio
    const result = await kilometersService.getUserKilometers({
      userCode,
      year,
      month,
    })

    // Verificar si hay datos
    if (!result.data || result.data.length === 0) {
      return apiResponse.success(
        {
          data: [],
          summary: {
            totalProgrammed: 0,
            totalExecuted: 0,
            percentage: 0,
          },
          availableYears: result.availableYears,
          availableMonths: result.availableMonths,
        },
        `No se encontraron datos de kilómetros para el usuario ${userCode}${year ? `, año ${year}` : ''}${month ? `, mes ${month}` : ''}`
      )
    }

    console.log(`[Kilómetros] Datos obtenidos: ${result.data.length} registros`)

    // Formatear respuesta con decimales
    const formattedData = result.data.map(item => ({
      ...item,
      valor_programacion: Number(item.valor_programacion).toFixed(2),
      valor_ejecucion: Number(item.valor_ejecucion).toFixed(2),
    }))

    const formattedSummary = {
      totalProgrammed: Number(result.summary.totalProgrammed).toFixed(2),
      totalExecuted: Number(result.summary.totalExecuted).toFixed(2),
      percentage: result.summary.percentage,
    }

    // Respuesta exitosa
    return apiResponse.success({
      data: formattedData,
      summary: formattedSummary,
      availableYears: result.availableYears,
      availableMonths: result.availableMonths,
    })

  } catch (error) {
    console.error('[Kilómetros] Error al obtener datos:', error)
    throw error // Se manejará en withErrorHandling
  }
}

// Exportar el handler envuelto con manejo de errores
export const GET = withErrorHandling(handleGet)